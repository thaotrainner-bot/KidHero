import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  Auth,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  get as rtdbGet,
  set as rtdbSet,
  onValue,
  Database
} from 'firebase/database';
import defaultFirebaseConfig from '../firebase-applet-config.json';
import { AppState, Task } from './types';

// Validation constants synchronized verbatim with firebase-blueprint.json
export const FAMILY_CODE_MIN_LENGTH = 3;
export const FAMILY_CODE_MAX_LENGTH = 64;
export const FAMILY_CODE_PATTERN = /^[a-zA-Z0-9_\-]+$/;
export const OWNER_ID_MAX_LENGTH = 128;

export const CUSTOM_FIREBASE_CONFIG_KEY = 'kidhero_custom_firebase_config_v1';
export const REMOTE_READ_TIMEOUT_MS = 8000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export interface CustomFirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

// Built-in deduplicated Firebase configuration for Cominh Family (asia-southeast1 RTDB)
export const COMINH_FAMILY_FIREBASE_CONFIG: CustomFirebaseConfig = {
  apiKey: 'AIzaSyDAAglH_d92bEHMH6KnpXGDetN9gFlaY3I',
  authDomain: 'cominh-family-afa95.firebaseapp.com',
  databaseURL: 'https://cominh-family-afa95-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'cominh-family-afa95',
  storageBucket: 'cominh-family-afa95.firebasestorage.app',
  messagingSenderId: '380757809004',
  appId: '1:380757809004:web:82d2295275a86c92724549',
  measurementId: 'G-3X2GNL1DGM'
};

// Primary provisioned Firebase App (Firestore + Google Auth)
const app: FirebaseApp =
  getApps().find((a) => a.name === '[DEFAULT]') || initializeApp(defaultFirebaseConfig);

export const db = getFirestore(app, defaultFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore on boot (as required by firebase-integration-rpc skill)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Standardized Firestore Error Handler (as required by firebase-integration-rpc skill)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function logFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  try {
    handleFirestoreError(error, operationType, path);
  } catch {
    /* đã log */
  }
}

/**
 * Validates and sanitizes a familyCode against firebase-blueprint.json constraints.
 */
export function isValidFamilyCode(code: string): boolean {
  const clean = (code || '').trim().toUpperCase();
  return (
    clean.length >= FAMILY_CODE_MIN_LENGTH &&
    clean.length <= FAMILY_CODE_MAX_LENGTH &&
    FAMILY_CODE_PATTERN.test(clean)
  );
}

/**
 * Converts a value returned by Firebase RTDB (which may serialize arrays as objects {"0": ..., "1": ...})
 * back into a clean array, sorted by numeric key and filtering out null/undefined.
 */
export function rtdbToArray<T = unknown>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is T => item !== null && item !== undefined);
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined
    );
    entries.sort(([a], [b]) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) {
        return na - nb;
      }
      return a.localeCompare(b);
    });
    return entries.map(([, v]) => v as T);
  }
  return [];
}

/**
 * Removes undefined fields and null/undefined array elements recursively so
 * Firebase Realtime Database & Firestore accept native maps and lists cleanly.
 */
function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined && item !== null)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) {
      result[key] = stripUndefined(value);
    }
  }
  return result as T;
}

/**
 * Loads the active Firebase Realtime Database configuration, automatically replacing
 * any outdated or conflicting localStorage config with `COMINH_FAMILY_FIREBASE_CONFIG`.
 */
export function loadCustomFirebaseConfig(): CustomFirebaseConfig {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(CUSTOM_FIREBASE_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CustomFirebaseConfig;
        if (
          parsed.projectId !== COMINH_FAMILY_FIREBASE_CONFIG.projectId ||
          parsed.databaseURL !== COMINH_FAMILY_FIREBASE_CONFIG.databaseURL ||
          parsed.apiKey !== COMINH_FAMILY_FIREBASE_CONFIG.apiKey
        ) {
          localStorage.setItem(CUSTOM_FIREBASE_CONFIG_KEY, JSON.stringify(COMINH_FAMILY_FIREBASE_CONFIG));
        }
      } else {
        localStorage.setItem(CUSTOM_FIREBASE_CONFIG_KEY, JSON.stringify(COMINH_FAMILY_FIREBASE_CONFIG));
      }
    } catch {
      // Ignore storage errors
    }
  }
  return COMINH_FAMILY_FIREBASE_CONFIG;
}

/**
 * Parses a pasted Firebase snippet (either JS object literal `const firebaseConfig = { ... }` or JSON)
 * and saves it to localStorage, replacing any duplicate keys cleanly.
 */
export function parseAndSaveCustomFirebaseConfig(rawInput: string): {
  success: boolean;
  config?: CustomFirebaseConfig;
  error?: string;
} {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_FIREBASE_CONFIG_KEY, JSON.stringify(COMINH_FAMILY_FIREBASE_CONFIG));
    }
    return { success: true, config: COMINH_FAMILY_FIREBASE_CONFIG };
  }

  try {
    const extractField = (key: string): string | undefined => {
      const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`);
      const match = trimmed.match(regex);
      return match ? match[1].trim() : undefined;
    };

    const config: CustomFirebaseConfig = {
      ...COMINH_FAMILY_FIREBASE_CONFIG,
      apiKey: extractField('apiKey') || COMINH_FAMILY_FIREBASE_CONFIG.apiKey,
      authDomain: extractField('authDomain') || COMINH_FAMILY_FIREBASE_CONFIG.authDomain,
      databaseURL: extractField('databaseURL') || COMINH_FAMILY_FIREBASE_CONFIG.databaseURL,
      projectId: extractField('projectId') || COMINH_FAMILY_FIREBASE_CONFIG.projectId,
      storageBucket: extractField('storageBucket') || COMINH_FAMILY_FIREBASE_CONFIG.storageBucket,
      messagingSenderId: extractField('messagingSenderId') || COMINH_FAMILY_FIREBASE_CONFIG.messagingSenderId,
      appId: extractField('appId') || COMINH_FAMILY_FIREBASE_CONFIG.appId,
      measurementId: extractField('measurementId') || COMINH_FAMILY_FIREBASE_CONFIG.measurementId
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_FIREBASE_CONFIG_KEY, JSON.stringify(config));
    }

    return { success: true, config };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi phân tích cấu hình Firebase'
    };
  }
}

let cachedRtdbApp: FirebaseApp | null = null;
let cachedRtdbInstance: Database | null = null;
let cachedRtdbAuth: Auth | null = null;
let cachedRtdbAuthPromise: Promise<User | null> | null = null;
let warnedAnonymousAuthDisabled = false;

const RTDB_MEMBERSHIPS_STORAGE_KEY = 'kidhero_rtdb_memberships_v1';

function loadInitialMemberships(): Set<string> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(RTDB_MEMBERSHIPS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return new Set<string>(parsed.filter((x): x is string => typeof x === 'string'));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  return new Set<string>();
}

const registeredMemberships = loadInitialMemberships();

function persistMemberships(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        RTDB_MEMBERSHIPS_STORAGE_KEY,
        JSON.stringify(Array.from(registeredMemberships))
      );
    } catch {
      // Ignore storage errors
    }
  }
}

// Unique identifier for this browser tab/device instance to distinguish remote device updates from local echoes
export const CLIENT_INSTANCE_ID = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function getRtdbApp(): FirebaseApp | null {
  if (cachedRtdbApp) {
    return cachedRtdbApp;
  }
  try {
    const activeConfig = loadCustomFirebaseConfig();
    const customAppName = `kidhero-rtdb-${activeConfig.projectId || 'cominh-family-afa95'}`;
    const existingApp = getApps().find((a) => a.name === customAppName);
    cachedRtdbApp = existingApp || initializeApp(activeConfig, customAppName);
    return cachedRtdbApp;
  } catch (err) {
    console.warn('[KidHero] Failed to initialize RTDB app:', err);
    return null;
  }
}

/**
 * Returns a single deduplicated Firebase Realtime Database instance connected to
 * `cominh-family-afa95` (`https://cominh-family-afa95-default-rtdb.asia-southeast1.firebasedatabase.app`).
 */
export function getRealtimeDbInstance(): Database | null {
  if (cachedRtdbInstance) {
    return cachedRtdbInstance;
  }
  try {
    const rtdbApp = getRtdbApp();
    if (!rtdbApp) return null;
    const activeConfig = loadCustomFirebaseConfig();
    const dbUrl = activeConfig.databaseURL || COMINH_FAMILY_FIREBASE_CONFIG.databaseURL!;
    cachedRtdbInstance = getDatabase(rtdbApp, dbUrl);
    return cachedRtdbInstance;
  } catch (err) {
    console.warn('[KidHero] Failed to initialize RTDB instance:', err);
    return null;
  }
}

export function getRtdbAuth(): Auth | null {
  if (cachedRtdbAuth) {
    return cachedRtdbAuth;
  }
  try {
    const rtdbApp = getRtdbApp();
    if (!rtdbApp) return null;
    cachedRtdbAuth = getAuth(rtdbApp);
    return cachedRtdbAuth;
  } catch (err) {
    console.warn('[KidHero] Failed to initialize RTDB Auth:', err);
    return null;
  }
}

export async function ensureRtdbAuth(): Promise<User | null> {
  if (cachedRtdbAuthPromise) {
    return cachedRtdbAuthPromise;
  }

  cachedRtdbAuthPromise = (async () => {
    try {
      const rtdbAuth = getRtdbAuth();
      if (!rtdbAuth) {
        cachedRtdbAuthPromise = null;
        return null;
      }
      await withTimeout(rtdbAuth.authStateReady(), REMOTE_READ_TIMEOUT_MS, 'rtdbAuthReady');
      if (rtdbAuth.currentUser) {
        return rtdbAuth.currentUser;
      }
      const cred = await withTimeout(
        signInAnonymously(rtdbAuth),
        REMOTE_READ_TIMEOUT_MS,
        'signInAnonymously'
      );
      return cred.user;
    } catch (err) {
      if (!warnedAnonymousAuthDisabled) {
        warnedAnonymousAuthDisabled = true;
        console.warn(
          'Enable Authentication -> Sign-in method -> Anonymous (project cominh-family-afa95)',
          err
        );
      }
      cachedRtdbAuthPromise = null;
      return null;
    }
  })();

  return cachedRtdbAuthPromise;
}

export async function ensureFamilyMembership(code: string): Promise<boolean> {
  try {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!isValidFamilyCode(cleanCode)) return false;

    const user = await ensureRtdbAuth();
    if (!user) return false;

    const membershipKey = `${user.uid}:${cleanCode}`;
    if (registeredMemberships.has(membershipKey)) {
      return true;
    }

    const rtdb = getRealtimeDbInstance();
    if (!rtdb) return false;

    await withTimeout(
      rtdbSet(ref(rtdb, `familyMembers/${cleanCode}/${user.uid}`), true),
      REMOTE_READ_TIMEOUT_MS,
      'ensureFamilyMembership'
    );

    registeredMemberships.add(membershipKey);
    persistMemberships();
    return true;
  } catch (err) {
    console.warn('[KidHero] ensureFamilyMembership failed:', err);
    return false;
  }
}

function forgetFamilyMembership(code: string): void {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return;
  const suffix = `:${cleanCode}`;
  let removed = false;
  for (const key of Array.from(registeredMemberships)) {
    if (key.endsWith(suffix)) {
      registeredMemberships.delete(key);
      removed = true;
    }
  }
  if (removed) {
    persistMemberships();
  }
}

function parseRtdbSnapshotValue(val: Record<string, unknown> | null, cleanCode: string): {
  state: AppState;
  isFromOtherDevice: boolean;
} | null {
  if (!val || typeof val !== 'object') return null;

  const rawData =
    val.data && typeof val.data === 'object' && (val.data as Record<string, unknown>).profile
      ? (val.data as AppState)
      : val.profile && typeof val.profile === 'object'
      ? (val as unknown as AppState)
      : null;

  if (!rawData || !rawData.profile) {
    return null;
  }

  const tasksArray = rtdbToArray<Task>(rawData.tasks);
  if (tasksArray.length === 0) {
    return null;
  }

  const isFromOtherDevice =
    !val.updatedByClientId || val.updatedByClientId !== CLIENT_INSTANCE_ID;

  const resolvedStars =
    typeof val.stars === 'number' ? val.stars : Number(rawData.profile.stars) || 0;
  const resolvedLevel =
    typeof val.level === 'number' ? val.level : Number(rawData.profile.level) || 15;
  const resolvedXp =
    typeof val.currentXp === 'number'
      ? val.currentXp
      : Number(rawData.profile.currentXp) || 5360;
  const resolvedDailyStars =
    typeof val.dailyStarsEarned === 'number'
      ? val.dailyStarsEarned
      : Number(rawData.profile.dailyStarsEarned) || 0;

  const resolvedTimestamp = Math.max(
    0,
    Number(val.lastUpdatedAt) || 0,
    Number(val.lastSyncTimestamp) || 0,
    Number(rawData.lastUpdatedAt) || 0,
    Number(rawData.lastSyncTimestamp) || 0
  );

  const pet = rawData.profile.pet;
  const allZeroPetBug =
    pet &&
    Number(pet.happiness || 0) === 0 &&
    Number(pet.energy || 0) === 0 &&
    Number(pet.hunger || 0) === 0;

  const state: AppState = {
    ...rawData,
    tasks: tasksArray,
    familyCode: cleanCode,
    lastSyncTimestamp: resolvedTimestamp,
    lastUpdatedAt: resolvedTimestamp,
    profile: {
      ...rawData.profile,
      stars: resolvedStars,
      dailyStarsEarned: resolvedDailyStars,
      totalStarsEarned:
        typeof val.totalStarsEarned === 'number'
          ? val.totalStarsEarned
          : Number(rawData.profile.totalStarsEarned ?? resolvedStars) || 0,
      level: resolvedLevel,
      currentXp: resolvedXp,
      pet: pet
        ? {
            ...pet,
            happiness: allZeroPetBug ? 80 : Number(pet.happiness ?? 80),
            energy: allZeroPetBug ? 80 : Number(pet.energy ?? 80),
            hunger: allZeroPetBug ? 75 : Number(pet.hunger ?? 75)
          }
        : rawData.profile.pet
    }
  };

  return { state, isFromOtherDevice };
}

/**
 * Pushes the KidHero AppState to Firebase Realtime Database (`families/{familyCode}`)
 * as the Single Source of Truth, and (when signed in) to Cloud Firestore (`/families/{familyCode}`) as backup.
 */
export async function pushStateToFirebase(state: AppState): Promise<boolean> {
  const cleanCode = (state.familyCode || '').trim().toUpperCase();
  if (!isValidFamilyCode(cleanCode)) return false;

  const stateTs = Math.max(
    Number(state.lastUpdatedAt) || 0,
    Number(state.lastSyncTimestamp) || 0
  );
  const syncTs = stateTs > 0 ? stateTs : Date.now();

  const cleanState = stripUndefined({
    ...state,
    familyCode: cleanCode,
    lastSyncTimestamp: syncTs,
    lastUpdatedAt: syncTs
  });

  let pushedAny = false;

  // 1. Push to Firebase Realtime Database (Single Source of Truth)
  const rtdb = getRealtimeDbInstance();
  if (rtdb) {
    try {
      await ensureFamilyMembership(cleanCode);
      const familyRef = ref(rtdb, `families/${cleanCode}`);
      await rtdbSet(familyRef, {
        familyCode: cleanCode,
        stars: Math.max(0, Math.min(1000000, Number(cleanState.profile.stars) || 0)),
        dailyStarsEarned: Math.max(0, Math.min(100000, Number(cleanState.profile.dailyStarsEarned) || 0)),
        totalStarsEarned: Math.max(0, Math.min(10000000, Number(cleanState.profile.totalStarsEarned) || 0)),
        level: Math.max(1, Math.min(1000, Number(cleanState.profile.level) || 1)),
        currentXp: Math.max(0, Math.min(10000000, Number(cleanState.profile.currentXp) || 0)),
        lastSyncTimestamp: syncTs,
        lastUpdatedAt: syncTs,
        updatedByClientId: CLIENT_INSTANCE_ID,
        data: cleanState
      });
      pushedAny = true;
    } catch (err) {
      console.warn('[KidHero] RTDB set failed:', err);
    }
  }

  // 2. Push to Cloud Firestore (/families/{familyCode}) as backup if user is authenticated with verified email
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.emailVerified) {
    const docPath = `families/${cleanCode}`;
    const familyDocRef = doc(db, 'families', cleanCode);
    const boundedPayload = stripUndefined({
      profile: cleanState.profile,
      tasks: cleanState.tasks,
      rewards: cleanState.rewards,
      challenges: cleanState.challenges,
      badges: cleanState.badges,
      history: cleanState.history,
      goalHistory: cleanState.goalHistory || {},
      disciplineRules: cleanState.disciplineRules || [],
      disciplinePrinciples: cleanState.disciplinePrinciples || [],
      disciplineLogs: cleanState.disciplineLogs || [],
      settings: cleanState.settings,
      language: cleanState.language
    });

    const commonFields = {
      stars: Math.max(0, Math.min(1000000, Number(cleanState.profile.stars) || 0)),
      totalStarsEarned: Math.max(0, Math.min(10000000, Number(cleanState.profile.totalStarsEarned) || 0)),
      level: Math.max(1, Math.min(1000, Number(cleanState.profile.level) || 1)),
      currentXp: Math.max(0, Math.min(10000000, Number(cleanState.profile.currentXp) || 0)),
      payload: boundedPayload,
      lastSyncTimestamp: syncTs,
      lastUpdatedAt: syncTs,
      updatedAt: serverTimestamp()
    };

    try {
      const snap = await getDoc(familyDocRef);
      if (!snap.exists()) {
        await setDoc(familyDocRef, {
          familyCode: cleanCode,
          ownerId: currentUser.uid.slice(0, OWNER_ID_MAX_LENGTH),
          ...commonFields,
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(familyDocRef, commonFields);
      }
      pushedAny = true;
    } catch (error) {
      logFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  return pushedAny;
}

export type FirebasePullResult =
  | { status: 'ok'; state: AppState; source: 'rtdb' | 'firestore' }
  | { status: 'empty' }
  | { status: 'error'; error: unknown };

/**
 * Pulls the latest KidHero AppState from Firebase Realtime Database (Single Source of Truth)
 * with Cloud Firestore as backup. Never throws.
 */
export async function pullStateFromFirebase(familyCode: string): Promise<FirebasePullResult> {
  const cleanCode = (familyCode || '').trim().toUpperCase();
  if (!isValidFamilyCode(cleanCode)) {
    return { status: 'error', error: new Error('Invalid family code') };
  }

  let rtdbReachable = false;
  let lastError: unknown = new Error('Unable to reach Firebase Realtime Database');

  await ensureFamilyMembership(cleanCode);

  // 1A. Try Firebase Realtime Database SDK first (Single Source of Truth)
  const rtdb = getRealtimeDbInstance();
  if (rtdb) {
    try {
      const snap = await withTimeout(
        rtdbGet(ref(rtdb, `families/${cleanCode}`)),
        REMOTE_READ_TIMEOUT_MS,
        'rtdbGet'
      );
      rtdbReachable = true;
      const parsed = parseRtdbSnapshotValue(
        snap.val() as Record<string, unknown> | null,
        cleanCode
      );
      if (parsed) {
        return { status: 'ok', state: parsed.state, source: 'rtdb' };
      }
    } catch (err) {
      lastError = err;
      console.warn('[KidHero] RTDB get failed, trying REST fallback:', err);
    }
  }

  // 1B. Direct REST fallback to Firebase Realtime Database ONLY if SDK get failed
  if (!rtdbReachable) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REMOTE_READ_TIMEOUT_MS);
    try {
      const dbUrl = (
        loadCustomFirebaseConfig().databaseURL ||
        COMINH_FAMILY_FIREBASE_CONFIG.databaseURL ||
        ''
      ).replace(/\/$/, '');
      if (dbUrl) {
        const rtdbAuth = getRtdbAuth();
        let authQuery = '';
        if (rtdbAuth?.currentUser) {
          try {
            const idToken = await withTimeout(
              rtdbAuth.currentUser.getIdToken(),
              REMOTE_READ_TIMEOUT_MS,
              'getIdToken'
            );
            if (idToken) {
              authQuery = `?auth=${encodeURIComponent(idToken)}`;
            }
          } catch {
            // Proceed without token if token fetch fails
          }
        }
        const res = await fetch(
          `${dbUrl}/families/${encodeURIComponent(cleanCode)}.json${authQuery}`,
          {
            cache: 'no-store',
            signal: controller.signal
          }
        );
        if (!res.ok) {
          throw new Error(`RTDB REST fallback HTTP ${res.status}`);
        }
        rtdbReachable = true;
        const json = (await res.json()) as Record<string, unknown> | null;
        const parsed = parseRtdbSnapshotValue(json, cleanCode);
        if (parsed) {
          return { status: 'ok', state: parsed.state, source: 'rtdb' };
        }
      }
    } catch (err) {
      lastError = err;
      console.warn('[KidHero] RTDB REST fallback failed:', err);
    } finally {
      clearTimeout(timer);
    }
  }

  // 2. Fallback to Cloud Firestore if authenticated with verified email
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.emailVerified) {
    const docPath = `families/${cleanCode}`;
    try {
      const snap = await withTimeout(
        getDoc(doc(db, 'families', cleanCode)),
        REMOTE_READ_TIMEOUT_MS,
        'firestoreGet'
      );
      if (snap.exists()) {
        const data = snap.data();
        const tasksArray = rtdbToArray<Task>(data?.payload?.tasks);
        if (data && data.payload && data.payload.profile && tasksArray.length > 0) {
          const ts = Math.max(
            0,
            Number(data.lastUpdatedAt) || 0,
            Number(data.lastSyncTimestamp) || 0
          );
          const firestoreState: AppState = {
            ...(data.payload as AppState),
            tasks: tasksArray,
            familyCode: data.familyCode || cleanCode,
            lastSyncTimestamp: ts,
            lastUpdatedAt: ts,
            profile: {
              ...data.payload.profile,
              stars: typeof data.stars === 'number' ? data.stars : data.payload.profile.stars,
              totalStarsEarned:
                typeof data.totalStarsEarned === 'number'
                  ? data.totalStarsEarned
                  : data.payload.profile.totalStarsEarned,
              level: typeof data.level === 'number' ? data.level : data.payload.profile.level,
              currentXp:
                typeof data.currentXp === 'number' ? data.currentXp : data.payload.profile.currentXp
            }
          };
          return { status: 'ok', state: firestoreState, source: 'firestore' };
        }
      }
    } catch (error) {
      lastError = error;
      logFirestoreError(error, OperationType.GET, docPath);
    }
  }

  if (rtdbReachable) {
    return { status: 'empty' };
  }
  return { status: 'error', error: lastError };
}

/**
 * Subscribes to real-time updates from Firebase Realtime Database (`onValue` ONLY — Single Source of Truth)
 * for the given familyCode. Automatically ensures membership and re-subscribes with exponential backoff on error.
 */
export function subscribeToFirebaseFamily(
  familyCode: string,
  onRemoteUpdate: (
    remoteState: AppState,
    source: 'rtdb' | 'firestore',
    isFromOtherDevice?: boolean
  ) => void
): () => void {
  const cleanCode = (familyCode || '').trim().toUpperCase();
  if (!isValidFamilyCode(cleanCode)) return () => {};

  const rtdb = getRealtimeDbInstance();
  if (!rtdb) return () => {};

  let cancelled = false;
  let currentUnsub: (() => void) | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryAttempt = 0;

  const start = async () => {
    if (cancelled) return;
    await ensureFamilyMembership(cleanCode);
    if (cancelled) return;

    try {
      if (currentUnsub) {
        currentUnsub();
        currentUnsub = null;
      }
      const familyRef = ref(rtdb, `families/${cleanCode}`);
      currentUnsub = onValue(
        familyRef,
        (snapshot) => {
          if (cancelled) return;
          retryAttempt = 0;
          const parsed = parseRtdbSnapshotValue(
            snapshot.val() as Record<string, unknown> | null,
            cleanCode
          );
          if (parsed) {
            onRemoteUpdate(parsed.state, 'rtdb', parsed.isFromOtherDevice);
          }
        },
        (err) => {
          console.warn('[KidHero] RTDB onValue error:', err);
          forgetFamilyMembership(cleanCode);
          if (currentUnsub) {
            currentUnsub();
            currentUnsub = null;
          }
          if (!cancelled) {
            const delay = Math.min(60000, 3000 * Math.pow(2, retryAttempt));
            retryAttempt += 1;
            if (retryTimer) clearTimeout(retryTimer);
            retryTimer = setTimeout(() => {
              void start();
            }, delay);
          }
        }
      );
    } catch (err) {
      console.warn('[KidHero] RTDB subscribe failed:', err);
      if (!cancelled) {
        const delay = Math.min(60000, 3000 * Math.pow(2, retryAttempt));
        retryAttempt += 1;
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(() => {
          void start();
        }, delay);
      }
    }
  };

  void start();

  return () => {
    cancelled = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (currentUnsub) {
      currentUnsub();
      currentUnsub = null;
    }
  };
}

export async function signInWithGoogleForSync(): Promise<User | null> {
  const res = await signInWithPopup(auth, googleProvider);
  return res.user;
}

export async function signOutFromFirebaseSync(): Promise<void> {
  await firebaseSignOut(auth);
}

export { defaultFirebaseConfig };
