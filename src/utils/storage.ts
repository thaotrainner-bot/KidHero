import {
  AppState,
  DayRecord,
  Task,
  ChildProfile,
  VirtualPet,
  GoalHistoryItem,
  PetAccessoryId,
  Challenge,
  Reward,
  Badge,
  DisciplineRule,
  DisciplinePrinciple,
  DisciplineLog
} from '../types';
import {
  INITIAL_STATE,
  LEGACY_DEFAULT_CHALLENGE_IDS,
  getTodayKey,
  buildDefault7DayHistory,
  getOrCreateDeviceFamilyCode
} from './defaults';
import { getTaskTag } from './taskTags';
import { sanitizeAvatarUrl } from './avatars';
import {
  CUTE_HAMSTER_AVATAR_URL,
  getPetSpeciesMeta,
  EGG_HATCH_TARGET_STARS,
  getPetEvolutionInfo,
  getAutoUnlockedAccessoriesForLevel
} from './pets';
import { pushStateToFirebase, pullStateFromFirebase, subscribeToFirebaseFamily } from '../firebase';
import {
  getLastKnownNonZeroStars,
  saveLastKnownNonZeroStars,
  clearLastKnownNonZeroStarsOnExplicitReset
} from './googleSheetSync';

export const STORAGE_KEY = 'kidhero_app_data_v1';
export const STARS_STORAGE_KEY = 'kidhero_stars_v1';
export const TASKS_STORAGE_KEY = 'kidhero_tasks_v1';
export const PROGRESS_STORAGE_KEY = 'kidhero_progress_v1';
export const PET_EGG_STORAGE_KEY = 'kidhero_pet_egg_v1';
export const STAR_VAULT_BACKUP_KEY = 'kidhero_star_vault_backup_v1';
const BROADCAST_NAME = 'kidhero_sync_channel';

let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel(BROADCAST_NAME);
  } catch {
    syncChannel = null;
  }
}

// Module-level sync guards & reliable push queue (Parts B1 & 3)
let firebaseHydrated = false;
let lastSyncedFingerprint = '';
let lastPushedTs = 0;

let pendingPushState: AppState | null = null;
let pendingPushFingerprint = '';
let pushRetryTimer: ReturnType<typeof setTimeout> | null = null;
let pushRetryAttempt = 0;
let pushSeq = 0;

export function isFirebaseHydrated(): boolean {
  return firebaseHydrated;
}

export function markFirebaseHydrated(): void {
  firebaseHydrated = true;
}

export function hasPendingFirebasePush(): boolean {
  return pendingPushState !== null;
}

async function pushToFirebaseReliably(state: AppState, fingerprint: string): Promise<boolean> {
  const seq = ++pushSeq;
  pendingPushState = state;
  pendingPushFingerprint = fingerprint;
  if (pushRetryTimer) {
    clearTimeout(pushRetryTimer);
    pushRetryTimer = null;
  }

  const ok = await pushStateToFirebase(state).catch(() => false);
  if (seq !== pushSeq) {
    return ok;
  }

  if (ok) {
    pendingPushState = null;
    pendingPushFingerprint = '';
    pushRetryAttempt = 0;
    return true;
  }

  const delay = Math.min(60000, 3000 * Math.pow(2, pushRetryAttempt));
  pushRetryAttempt += 1;
  pushRetryTimer = setTimeout(() => {
    pushRetryTimer = null;
    if (pendingPushState) {
      void pushToFirebaseReliably(pendingPushState, pendingPushFingerprint);
    }
  }, delay);

  return false;
}

export function retryPendingFirebasePush(): void {
  if (pendingPushState) {
    void pushToFirebaseReliably(pendingPushState, pendingPushFingerprint);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', retryPendingFirebasePush);
}

export function resetFamilySyncGuards(): void {
  firebaseHydrated = false;
  lastSyncedFingerprint = '';
  lastPushedTs = 0;
  pendingPushState = null;
  pendingPushFingerprint = '';
  if (pushRetryTimer) {
    clearTimeout(pushRetryTimer);
    pushRetryTimer = null;
  }
  pushRetryAttempt = 0;
  pushSeq += 1;
}

/**
 * Converts an array or RTDB object map {"0": ..., "1": ...} into a clean array,
 * sorted by numeric key and filtering out null/undefined values.
 */
export function toArray<T = unknown>(value: unknown): T[] {
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
 * Normalizes all array fields in an AppState (and any nested `payload` object)
 * so RTDB object-indexed collections never fall back to defaults.
 */
export function normalizeFirebaseArrays(state: AppState): AppState {
  if (!state || typeof state !== 'object') return state;

  const rawRecord = state as unknown as Record<string, unknown>;
  const rawPayload =
    rawRecord.payload && typeof rawRecord.payload === 'object'
      ? (rawRecord.payload as Record<string, unknown>)
      : null;

  const normalizeHistoryMap = (
    historyObj: unknown
  ): Record<string, DayRecord> | undefined => {
    if (!historyObj || typeof historyObj !== 'object') return undefined;
    const normalized: Record<string, DayRecord> = {};
    for (const [dateKey, rec] of Object.entries(historyObj as Record<string, DayRecord>)) {
      if (rec && typeof rec === 'object') {
        normalized[dateKey] = {
          ...rec,
          completedTaskIds: toArray<string>(rec.completedTaskIds)
        };
      }
    }
    return normalized;
  };

  const normalizePetObj = (petObj: Partial<VirtualPet> | undefined): VirtualPet | undefined => {
    if (!petObj || typeof petObj !== 'object') return undefined;
    return {
      ...(petObj as VirtualPet),
      unlockedAccessories: toArray<PetAccessoryId>(petObj.unlockedAccessories),
      equippedAccessories: toArray<PetAccessoryId>(petObj.equippedAccessories),
      completedMealSlotsToday: toArray<'morning' | 'afternoon' | 'evening'>(
        petObj.completedMealSlotsToday
      ),
      appliedDecaySlotsToday: toArray<'morning' | 'afternoon' | 'evening'>(
        petObj.appliedDecaySlotsToday
      ),
      usedRoomAccessoriesToday: toArray<PetAccessoryId>(petObj.usedRoomAccessoriesToday)
    };
  };

  const normalizedPayload = rawPayload
    ? {
        ...rawPayload,
        tasks: toArray<Task>(rawPayload.tasks),
        challenges: toArray<Challenge>(rawPayload.challenges),
        rewards: toArray<Reward>(rawPayload.rewards),
        badges: toArray<Badge>(rawPayload.badges),
        disciplineRules: toArray<DisciplineRule>(rawPayload.disciplineRules),
        disciplinePrinciples: toArray<DisciplinePrinciple>(rawPayload.disciplinePrinciples),
        disciplineLogs: toArray<DisciplineLog>(rawPayload.disciplineLogs),
        history: normalizeHistoryMap(rawPayload.history) || rawPayload.history,
        profile:
          rawPayload.profile && typeof rawPayload.profile === 'object'
            ? {
                ...(rawPayload.profile as Record<string, unknown>),
                pet:
                  normalizePetObj(
                    (rawPayload.profile as Record<string, unknown>).pet as Partial<VirtualPet>
                  ) || (rawPayload.profile as Record<string, unknown>).pet
              }
            : rawPayload.profile
      }
    : undefined;

  const result: AppState = {
    ...state,
    tasks: toArray<Task>(state.tasks),
    challenges: toArray<Challenge>(state.challenges),
    rewards: toArray<Reward>(state.rewards),
    badges: toArray<Badge>(state.badges),
    disciplineRules: toArray<DisciplineRule>(state.disciplineRules),
    disciplinePrinciples: toArray<DisciplinePrinciple>(state.disciplinePrinciples),
    disciplineLogs: toArray<DisciplineLog>(state.disciplineLogs),
    history: normalizeHistoryMap(state.history) || state.history || {},
    profile: state.profile
      ? {
          ...state.profile,
          pet: normalizePetObj(state.profile.pet) || state.profile.pet
        }
      : state.profile
  };

  if (normalizedPayload) {
    (result as unknown as Record<string, unknown>).payload = normalizedPayload;
  }

  return result;
}

/**
 * Strips all undefined properties and array holes via JSON serialization before pushing to Firebase.
 */
export function toFirebaseSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Extracts the authoritative timestamp (`max(0, lastUpdatedAt, lastSyncTimestamp)`) from a state.
 */
export function getStateTimestamp(state: Partial<AppState> | null | undefined): number {
  if (!state) return 0;
  const rawTs = Math.max(
    0,
    Number(state.lastUpdatedAt) || 0,
    Number(state.lastSyncTimestamp) || 0
  );
  return rawTs === 1794124805000 ? 0 : rawTs;
}

/**
 * Computes a deterministic JSON fingerprint of an AppState with timestamps zeroed out
 * to detect echoes and prevent write-listen infinite loops.
 */
export function contentFingerprint(state: AppState): string {
  try {
    const clone: AppState = {
      ...state,
      lastUpdatedAt: 0,
      lastSyncTimestamp: 0
    };
    return JSON.stringify(clone);
  } catch {
    return '';
  }
}

function deduplicateById<T extends { id: string }>(items: unknown, fallbackItems: unknown = []): T[] {
  const primary = toArray<T>(items).filter((item) => Boolean(item && item.id));
  const source = primary.length > 0 ? primary : toArray<T>(fallbackItems);
  const map = new Map<string, T>();
  for (const item of source) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Automatically inspects, cleans, and deduplicates an AppState object:
 * - Normalizes Firebase arrays first (`normalizeFirebaseArrays`) so object-maps never reset to 0/17
 * - Deduplicates tasks, challenges, rewards, badges, and rules while preserving current state
 */
export function sanitizeAndDeduplicateState(inputState: AppState): AppState {
  const rawState = normalizeFirebaseArrays(inputState);
  const todayKey = getTodayKey();
  const rawRecord = rawState as unknown as Record<string, unknown>;
  const nestedPayload =
    rawRecord && typeof rawRecord.payload === 'object' && rawRecord.payload !== null
      ? (rawRecord.payload as Partial<AppState>)
      : null;

  const baseProfile = rawState.profile || nestedPayload?.profile || INITIAL_STATE.profile;
  const topLevelStars = typeof rawRecord.stars === 'number' ? rawRecord.stars : undefined;
  const payloadStars = nestedPayload?.profile?.stars;

  const resolvedProfileStars =
    nestedPayload && typeof topLevelStars === 'number' && topLevelStars > (baseProfile.stars || 0)
      ? Math.max(topLevelStars, Number(payloadStars) || 0, Number(baseProfile.stars) || 0)
      : Math.max(0, Number(baseProfile.stars) || 0);

  const rawTasksList = toArray<Task>(rawState.tasks);
  const payloadTasksList = toArray<Task>(nestedPayload?.tasks);

  const cleanTasks = deduplicateById<Task>(
    rawTasksList.length > 0 ? rawTasksList : payloadTasksList,
    INITIAL_STATE.tasks
  ).map((t) => ({
    ...t,
    tag: getTaskTag(t),
    stars: Math.max(1, Math.round(Number(t.stars) || 1)),
    xp: 5
  }));

  const legacyChallengeIds = new Set(LEGACY_DEFAULT_CHALLENGE_IDS);
  const rawChallengesList = toArray<Challenge>(rawState.challenges);
  const payloadChallengesList = toArray<Challenge>(nestedPayload?.challenges);
  const cleanChallenges = deduplicateById<Challenge>(
    rawChallengesList.length > 0 ? rawChallengesList : payloadChallengesList,
    INITIAL_STATE.challenges
  ).filter((c) => c && !legacyChallengeIds.has(c.id));

  const rawRewardsList = toArray<Reward>(rawState.rewards);
  const payloadRewardsList = toArray<Reward>(nestedPayload?.rewards);
  const cleanRewards = deduplicateById<Reward>(
    rawRewardsList.length > 0 ? rawRewardsList : payloadRewardsList,
    INITIAL_STATE.rewards
  );

  const rawBadgesList = toArray<Badge>(rawState.badges);
  const payloadBadgesList = toArray<Badge>(nestedPayload?.badges);
  const cleanBadges = deduplicateById<Badge>(
    rawBadgesList.length > 0 ? rawBadgesList : payloadBadgesList,
    INITIAL_STATE.badges
  );

  const rawRulesList = toArray<DisciplineRule>(rawState.disciplineRules);
  const payloadRulesList = toArray<DisciplineRule>(nestedPayload?.disciplineRules);
  const cleanRules = deduplicateById<DisciplineRule>(
    rawRulesList.length > 0 ? rawRulesList : payloadRulesList,
    INITIAL_STATE.disciplineRules
  );

  const rawPrinciplesList = toArray<DisciplinePrinciple>(rawState.disciplinePrinciples);
  const payloadPrinciplesList = toArray<DisciplinePrinciple>(nestedPayload?.disciplinePrinciples);
  const cleanPrinciples = deduplicateById<DisciplinePrinciple>(
    rawPrinciplesList.length > 0 ? rawPrinciplesList : payloadPrinciplesList,
    INITIAL_STATE.disciplinePrinciples
  );

  const cleanFamilyCode =
    rawState.familyCode && rawState.familyCode.trim()
      ? rawState.familyCode.trim().toUpperCase()
      : getOrCreateDeviceFamilyCode();

  // If lastActiveDate is missing, default to todayKey; if rawLastActiveDate > todayKey, KEEP rawLastActiveDate
  const rawLastActiveDate = baseProfile.lastActiveDate;
  const safeLastActiveDate = !rawLastActiveDate ? todayKey : rawLastActiveDate;

  const rawSyncTs = Math.max(
    Number(rawState.lastUpdatedAt || nestedPayload?.lastUpdatedAt) || 0,
    Number(rawState.lastSyncTimestamp || nestedPayload?.lastSyncTimestamp) || 0
  );
  const normalizedSyncTs = rawSyncTs === 1794124805000 ? 0 : rawSyncTs;

  const rawPet = baseProfile.pet;
  const allZeroPetBug =
    !rawPet ||
    (Number(rawPet.happiness || 0) === 0 &&
      Number(rawPet.energy || 0) === 0 &&
      Number(rawPet.hunger || 0) === 0);

  const petUnlocked = toArray<PetAccessoryId>(baseProfile.pet?.unlockedAccessories);
  const petEquipped = toArray<PetAccessoryId>(baseProfile.pet?.equippedAccessories);

  const cleanCleanState: AppState = {
    familyCode: cleanFamilyCode,
    language: rawState.language || nestedPayload?.language || 'vi',
    lastSyncTimestamp: normalizedSyncTs,
    lastUpdatedAt: normalizedSyncTs,
    lastExplicitResetTimestamp: rawState.lastExplicitResetTimestamp,
    lastStarSpendTimestamp: rawState.lastStarSpendTimestamp,
    profile: {
      ...INITIAL_STATE.profile,
      ...baseProfile,
      name:
        baseProfile.name === 'Bé Minh Triết' || !baseProfile.name
          ? 'Hiệp Sĩ Cơ Minh'
          : baseProfile.name,
      grade: baseProfile.grade || 'Lớp 4',
      avatar: sanitizeAvatarUrl(baseProfile.avatar),
      stars: resolvedProfileStars,
      totalStarsEarned: resolvedProfileStars,
      lastActiveDate: safeLastActiveDate,
      pet: {
        ...INITIAL_STATE.profile.pet,
        ...(baseProfile.pet || {}),
        species: 'hamster',
        name: baseProfile.pet?.name || 'Chuột Hamster Mũm Mĩm',
        avatar: CUTE_HAMSTER_AVATAR_URL,
        happiness: allZeroPetBug ? 80 : Math.max(0, Math.min(100, Number(rawPet?.happiness ?? 80))),
        energy: allZeroPetBug ? 80 : Math.max(0, Math.min(100, Number(rawPet?.energy ?? 80))),
        hunger: allZeroPetBug ? 75 : Math.max(0, Math.min(100, Number(rawPet?.hunger ?? 75))),
        lastDecayDate: !baseProfile.pet?.lastDecayDate
          ? safeLastActiveDate
          : baseProfile.pet.lastDecayDate,
        lastFeedDate: !baseProfile.pet?.lastFeedDate
          ? safeLastActiveDate
          : baseProfile.pet.lastFeedDate,
        lastHeadPatDate: !baseProfile.pet?.lastHeadPatDate
          ? safeLastActiveDate
          : baseProfile.pet.lastHeadPatDate,
        lastSleepDate: !baseProfile.pet?.lastSleepDate
          ? safeLastActiveDate
          : baseProfile.pet.lastSleepDate,
        coins:
          typeof baseProfile.pet?.coins === 'number'
            ? Math.max(0, Math.round(baseProfile.pet.coins))
            : 760,
        unlockedAccessories: Array.from(
          new Set<PetAccessoryId>([
            ...toArray<PetAccessoryId>(INITIAL_STATE.profile.pet.unlockedAccessories),
            ...petUnlocked
          ])
        ),
        equippedAccessories: Array.from(
          new Set<PetAccessoryId>(
            petEquipped.length > 0
              ? petEquipped
              : toArray<PetAccessoryId>(INITIAL_STATE.profile.pet.equippedAccessories)
          )
        )
      }
    },
    tasks: cleanTasks,
    challenges: cleanChallenges,
    rewards: cleanRewards,
    badges: cleanBadges,
    history: rawState.history || nestedPayload?.history || {},
    goalHistory: rawState.goalHistory || nestedPayload?.goalHistory || {},
    disciplineRules: cleanRules,
    disciplinePrinciples: cleanPrinciples,
    disciplineLogs: toArray<DisciplineLog>(rawState.disciplineLogs),
    settings: {
      ...INITIAL_STATE.settings,
      ...(nestedPayload?.settings || {}),
      ...(rawState.settings || {})
    }
  };

  return cleanCleanState;
}

interface StarVaultSnapshot {
  stars: number;
  totalStarsEarned: number;
  level: number;
  currentXp: number;
  maxXp: number;
  streakDays: number;
  petLevel: number;
  petExp: number;
  unlockedAccessories: string[];
  equippedAccessories: string[];
  lastStarSpendTimestamp?: number;
  updatedAt: number;
}

export function loadStarVaultSnapshot(): StarVaultSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STAR_VAULT_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StarVaultSnapshot;
    if (parsed && typeof parsed.stars === 'number' && parsed.stars >= 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStarVaultSnapshot(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    const stars = Math.max(0, Number(state.profile?.stars) || 0);
    const hasLegitSpend = Number(state.lastStarSpendTimestamp || 0) > 0;
    const hasActiveSync = getStateTimestamp(state) > 0;
    if (stars <= 0 && !hasLegitSpend && !hasActiveSync) return;

    saveLastKnownNonZeroStars(stars, true);

    const unifiedExp = Math.max(
      0,
      Number(state.profile?.currentXp) || 0,
      Number(state.profile?.pet?.exp ?? state.profile?.pet?.evolutionStars ?? 0)
    );
    const evoInfo = getPetEvolutionInfo(unifiedExp, true);

    const snapshot: StarVaultSnapshot = {
      stars,
      totalStarsEarned: stars,
      level: evoInfo.level,
      currentXp: unifiedExp,
      maxXp: evoInfo.nextThreshold,
      streakDays: Math.max(0, Number(state.profile?.streakDays) || 1),
      petLevel: evoInfo.level,
      petExp: unifiedExp,
      unlockedAccessories: toArray<string>(state.profile?.pet?.unlockedAccessories),
      equippedAccessories: toArray<string>(state.profile?.pet?.equippedAccessories),
      lastStarSpendTimestamp: state.lastStarSpendTimestamp,
      updatedAt: getStateTimestamp(state) || Date.now()
    };
    localStorage.setItem(STAR_VAULT_BACKUP_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage errors
  }
}

export function clearStarVaultSnapshot(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STAR_VAULT_BACKUP_KEY);
    clearLastKnownNonZeroStarsOnExplicitReset();
  } catch {
    // Ignore
  }
}

/**
 * Pure Last-Write-Wins reconciliation (Part B4):
 * Sanitizes both states, compares `getStateTimestamp`, and prefers the 2nd parameter (remote) on tie.
 * Winner wins intact (tasks, stars, EXP, pet, accessories) without mixing fields across devices.
 */
export function reconcileLatestDeviceStates(
  rawStateA: AppState,
  rawStateB: AppState
): AppState {
  const stateA = sanitizeAndDeduplicateState(rawStateA);
  const stateB = sanitizeAndDeduplicateState(rawStateB);

  const tsA = getStateTimestamp(stateA);
  const tsB = getStateTimestamp(stateB);

  const winner = tsB >= tsA ? stateB : stateA;
  const winningTs = Math.max(tsA, tsB);

  return syncTodayHistory(
    purgePastDaysData({
      ...winner,
      lastUpdatedAt: winningTs,
      lastSyncTimestamp: winningTs
    })
  );
}

/**
 * Applies remote Firebase state if its timestamp is strictly newer than local state (Part B5).
 * Marks Firebase as hydrated on first call.
 */
export function applyRemoteStateIfNewer(
  localState: AppState,
  remoteState: AppState
): AppState | null {
  const wasHydrated = firebaseHydrated;
  markFirebaseHydrated();

  const localTs = Math.max(getStateTimestamp(localState), lastPushedTs);
  const remote = syncTodayHistory(purgePastDaysData(remoteState));
  const remoteTs = getStateTimestamp(remote);

  if (remoteTs > localTs) {
    const next: AppState = {
      ...remote,
      lastUpdatedAt: remoteTs,
      lastSyncTimestamp: remoteTs
    };
    const normalizedNext = syncTodayHistory(purgePastDaysData(next));
    lastSyncedFingerprint = contentFingerprint(normalizedNext);
    saveAppState(normalizedNext, false);
    return normalizedNext;
  }

  if (!wasHydrated && localTs > remoteTs) {
    const localSynced = syncTodayHistory(
      purgePastDaysData({
        ...localState,
        lastUpdatedAt: localTs,
        lastSyncTimestamp: localTs
      })
    );
    const safeLocal = toFirebaseSafe(localSynced);
    lastSyncedFingerprint = contentFingerprint(localSynced);
    lastPushedTs = Math.max(lastPushedTs, localTs);

    if (safeLocal.familyCode) {
      void pushToFirebaseReliably(safeLocal, lastSyncedFingerprint);
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        pushStateToServer(safeLocal, true).catch((err) => {
          console.warn('[KidHero] Initial local push to Server failed:', err);
        });
      }
    }
  }

  return null;
}

/**
 * Sanitizes state and preserves cumulative stars (`profile.stars`), today's earned stars (`dailyStarsEarned`),
 * and 7-day history within the same state without resetting current day's data (Part B6).
 */
export function purgePastDaysData(rawState: AppState): AppState {
  const state = sanitizeAndDeduplicateState(rawState);
  const todayKey = getTodayKey();

  const default7Days = buildDefault7DayHistory();
  const cleanHistory: Record<string, DayRecord> = {
    ...default7Days,
    ...(state.history || {})
  };

  const cleanGoalHistory: Record<string, GoalHistoryItem> = {
    ...(state.goalHistory || {})
  };

  const cleanDisciplineLogs = toArray<DisciplineLog>(state.disciplineLogs).filter((log) =>
    Boolean(log && log.date)
  );

  const tasks = toArray<Task>(state.tasks).length > 0 ? toArray<Task>(state.tasks) : INITIAL_STATE.tasks;
  const starsFromApprovedTasks = tasks
    .filter((t) => t.isCompleted)
    .reduce((sum, t) => sum + Math.max(1, Math.round(Number(t.stars) || 1)), 0);

  const starsFromCompletedChallenges = toArray<Challenge>(state.challenges)
    .filter((c) => c.isCompletedToday)
    .reduce((sum, c) => sum + Math.max(1, Math.round(Number(c.stars) || 1)), 0);

  const questStarsToday = starsFromApprovedTasks + starsFromCompletedChallenges;
  const todayEarnedStars = Math.max(
    questStarsToday,
    Math.max(0, Number(state.profile?.dailyStarsEarned) || 0)
  );
  const rawStars = Math.max(0, Number(state.profile?.stars) || 0);
  const stateTs = getStateTimestamp(state);
  const wasExplicitlyReset = Boolean(
    state.lastExplicitResetTimestamp && state.lastExplicitResetTimestamp > 0 && rawStars === 0
  );
  const hasLegitSpend = Number(state.lastStarSpendTimestamp || 0) > 0;

  // Vault localStorage is ONLY used when state is completely brand new (timestamp = 0, not reset, no spend)
  let cumulativeStars = rawStars;
  if (rawStars === 0 && stateTs === 0 && !wasExplicitlyReset && !hasLegitSpend) {
    const vault = loadStarVaultSnapshot();
    cumulativeStars = Math.max(vault?.stars || 0, getLastKnownNonZeroStars(), todayEarnedStars);
  }

  const preservedActiveDate = !state.profile?.lastActiveDate
    ? todayKey
    : state.profile.lastActiveDate;

  return {
    ...state,
    tasks,
    history: cleanHistory,
    goalHistory: cleanGoalHistory,
    disciplineLogs: cleanDisciplineLogs,
    profile: {
      ...state.profile,
      avatar: sanitizeAvatarUrl(state.profile?.avatar),
      stars: cumulativeStars,
      dailyStarsEarned: todayEarnedStars,
      totalStarsEarned: cumulativeStars,
      lastActiveDate: preservedActiveDate
    }
  };
}

/**
 * Checks if the browser's current date (`getTodayKey()`) has crossed 00:00 into a new day.
 * MUST be called AFTER initial Firebase hydration completes!
 * - When `prevDateKey < todayKey` (a genuine new day after 0h):
 *   1. ONLY resets daily tasks (`isCompleted: false`) and `dailyStarsEarned: 0`.
 *   2. NEVER resets the 3 Hamster health stats (`happiness`, `energy`, `hunger`) to 0%!
 *   3. NEVER touches `profile.stars` (Cumulative Star Vault).
 */
export function checkAndResetAfterMidnight(state: AppState): AppState {
  const todayKey = getTodayKey();
  const prevDateKey = state.profile?.lastActiveDate;

  const taskList = toArray<Task>(state.tasks);
  const normalizedTasks: Task[] = (taskList.length > 0 ? taskList : INITIAL_STATE.tasks).map((t) => ({
    ...t,
    tag: getTaskTag(t),
    stars: Math.max(1, Math.round(Number(t.stars) || 1))
  }));

  const currentCumulativeStars = Math.max(0, Number(state.profile?.stars) || 0);
  const currentPet = state.profile?.pet || INITIAL_STATE.profile.pet;
  const allZeroPet =
    Number(currentPet.happiness || 0) === 0 &&
    Number(currentPet.energy || 0) === 0 &&
    Number(currentPet.hunger || 0) === 0;
  const safeHappiness = allZeroPet ? 80 : Math.max(0, Math.min(100, Number(currentPet.happiness ?? 80)));
  const safeEnergy = allZeroPet ? 80 : Math.max(0, Math.min(100, Number(currentPet.energy ?? 80)));
  const safeHunger = allZeroPet ? 75 : Math.max(0, Math.min(100, Number(currentPet.hunger ?? 75)));

  // If prevDateKey is missing or >= todayKey, keep prevDateKey (or todayKey if missing) WITHOUT resetting tasks, disciplineLogs, or stars!
  if (!prevDateKey || prevDateKey > todayKey) {
    const keptDateKey = prevDateKey || todayKey;
    const taskStarsNow = normalizedTasks
      .filter((t) => t.isCompleted)
      .reduce((sum, t) => sum + Math.max(1, Math.round(Number(t.stars) || 1)), 0);
    const challengeStarsNow = toArray<Challenge>(state.challenges)
      .filter((c) => c.isCompletedToday)
      .reduce((sum, c) => sum + Math.max(1, Math.round(Number(c.stars) || 1)), 0);
    const syncedDailyStars = Math.max(
      Number(state.profile?.dailyStarsEarned) || 0,
      taskStarsNow + challengeStarsNow
    );

    return {
      ...state,
      tasks: normalizedTasks,
      profile: {
        ...state.profile,
        stars: currentCumulativeStars,
        dailyStarsEarned: syncedDailyStars,
        totalStarsEarned: currentCumulativeStars,
        lastActiveDate: keptDateKey,
        pet: {
          ...currentPet,
          happiness: safeHappiness,
          energy: safeEnergy,
          hunger: safeHunger,
          lastDecayDate: currentPet.lastDecayDate || keptDateKey,
          lastFeedDate: currentPet.lastFeedDate || keptDateKey,
          lastHeadPatDate: currentPet.lastHeadPatDate || keptDateKey,
          lastSleepDate: currentPet.lastSleepDate || keptDateKey
        }
      }
    };
  }

  // Only reset when the browser date has genuinely advanced past prevDateKey (prevDateKey < todayKey)
  if (prevDateKey < todayKey) {
    const completedTaskIds = normalizedTasks.filter((t) => t.isCompleted).map((t) => t.id);
    const totalTasks = normalizedTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTaskIds.length / totalTasks) * 100) : 0;

    const yesterdayTaskStars = normalizedTasks
      .filter((t) => t.isCompleted)
      .reduce((sum, t) => sum + Math.max(1, Math.round(Number(t.stars) || 1)), 0);
    const yesterdayChallengeStars = toArray<Challenge>(state.challenges)
      .filter((c) => c.isCompletedToday)
      .reduce((sum, c) => sum + Math.max(1, Math.round(Number(c.stars) || 1)), 0);
    const yesterdayEarnedStars = Math.max(
      Number(state.profile.dailyStarsEarned) || 0,
      yesterdayTaskStars + yesterdayChallengeStars
    );

    const existingPrevRecord = state.history?.[prevDateKey];
    const updatedHistory: Record<string, DayRecord> = {
      ...buildDefault7DayHistory(),
      ...(state.history || {}),
      [prevDateKey]: {
        date: prevDateKey,
        completedTaskIds:
          completedTaskIds.length > 0
            ? completedTaskIds
            : toArray<string>(existingPrevRecord?.completedTaskIds),
        starsEarned:
          yesterdayEarnedStars > 0
            ? yesterdayEarnedStars
            : existingPrevRecord?.starsEarned || 0,
        cumulativeStars: currentCumulativeStars,
        totalTasks,
        completionRate:
          completionRate > 0 ? completionRate : existingPrevRecord?.completionRate || 0,
        goalMessage: state.settings?.dailyGoalMessage || existingPrevRecord?.goalMessage,
        petHappiness: safeHappiness,
        petEnergy: safeEnergy,
        petHunger: safeHunger
      },
      [todayKey]: {
        date: todayKey,
        completedTaskIds: [],
        starsEarned: 0,
        cumulativeStars: currentCumulativeStars,
        totalTasks,
        completionRate: 0,
        goalMessage: state.settings?.dailyGoalMessage,
        petHappiness: safeHappiness,
        petEnergy: safeEnergy,
        petHunger: safeHunger
      }
    };

    let newStreak = state.profile.streakDays;
    if (completionRate >= 50) {
      newStreak += 1;
    }

    const resetTasks: Task[] = normalizedTasks.map((t) => ({
      ...t,
      isCompleted: false,
      pendingApproval: false,
      completedAt: undefined,
      requestedAt: undefined
    }));

    const resetChallenges = toArray<Challenge>(state.challenges || INITIAL_STATE.challenges).map((c) => ({
      ...c,
      isCompletedToday: false,
      pendingApproval: false,
      requestedAt: undefined,
      completedAt: undefined
    }));

    const nowTs = Math.max(Date.now(), getStateTimestamp(state) + 1, lastPushedTs + 1);

    return {
      ...state,
      lastSyncTimestamp: nowTs,
      lastUpdatedAt: nowTs,
      tasks: resetTasks,
      challenges: resetChallenges,
      history: updatedHistory,
      goalHistory: {},
      disciplineLogs: [],
      profile: {
        ...state.profile,
        stars: currentCumulativeStars,
        dailyStarsEarned: 0,
        totalStarsEarned: currentCumulativeStars,
        streakDays: newStreak,
        lastActiveDate: todayKey,
        pet: {
          ...currentPet,
          species: 'hamster',
          name: 'Chuột Hamster Mũm Mĩm',
          avatar: CUTE_HAMSTER_AVATAR_URL,
          happiness: safeHappiness,
          energy: safeEnergy,
          hunger: safeHunger,
          coins: Math.max(0, Number(currentPet.coins ?? 760)),
          sleepCountToday: 0,
          lastSleepDate: todayKey,
          headPatCountToday: 0,
          feedCountToday: 0,
          lastHeadPatDate: todayKey,
          lastDecayDate: todayKey,
          lastHourlyDecayHour: undefined,
          completedMealSlotsToday: [],
          appliedDecaySlotsToday: [],
          usedRoomAccessoriesToday: [],
          moodState: 'normal'
        }
      }
    };
  }

  return {
    ...state,
    tasks: normalizedTasks,
    profile: {
      ...state.profile,
      pet: {
        ...currentPet,
        happiness: safeHappiness,
        energy: safeEnergy,
        hunger: safeHunger
      }
    }
  };
}

/**
 * Synchronizes today's completed tasks and stars into `state.history[todayKey]`,
 * preserves cumulative stars (`profile.stars`), keeps `dailyStarsEarned` accurate,
 * and NEVER resets Hamster's 3 health stats to 0%.
 */
export function syncTodayHistory(state: AppState): AppState {
  const todayKey = getTodayKey();
  const rawTasks = toArray<Task>(state.tasks);
  const tasks = rawTasks.length > 0 ? rawTasks : INITIAL_STATE.tasks;
  const completedTaskIds = tasks.filter((t) => t.isCompleted).map((t) => t.id);
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTaskIds.length / totalTasks) * 100) : 0;
  const starsFromApprovedTasks = tasks
    .filter((t) => t.isCompleted)
    .reduce((sum, t) => sum + (Number(t.stars) || 0), 0);
  const starsFromCompletedChallenges = toArray<Challenge>(state.challenges)
    .filter((c) => c.isCompletedToday)
    .reduce((sum, c) => sum + (Number(c.stars) || 0), 0);

  const todayStarsEarned = Math.max(
    starsFromApprovedTasks + starsFromCompletedChallenges,
    Math.max(0, Number(state.profile.dailyStarsEarned) || 0)
  );
  const rawStars = Math.max(0, Number(state.profile.stars) || 0);
  const stateTs = getStateTimestamp(state);
  const wasExplicitlyReset = Boolean(
    state.lastExplicitResetTimestamp &&
      state.lastExplicitResetTimestamp > 0 &&
      rawStars === 0
  );
  const hasLegitSpend = Number(state.lastStarSpendTimestamp || 0) > 0;

  let cumulativeStars = rawStars;
  if (rawStars === 0 && stateTs === 0 && !wasExplicitlyReset && !hasLegitSpend) {
    const vault = loadStarVaultSnapshot();
    cumulativeStars = Math.max(vault?.stars || 0, getLastKnownNonZeroStars(), todayStarsEarned);
  }
  const existingRecord = state.history?.[todayKey];

  const currentPet = state.profile?.pet || INITIAL_STATE.profile.pet;

  // Unified EXP: Pet Level is raised directly by the Child's EXP (`profile.currentXp` & `pet.exp`)
  const unifiedExp = Math.max(
    0,
    Number(state.profile?.currentXp) || 0,
    Number(currentPet.exp ?? currentPet.evolutionStars ?? 0)
  );
  const isHatched = Boolean(
    currentPet.isHatched || unifiedExp >= EGG_HATCH_TARGET_STARS || (currentPet.level || 1) >= 1
  );
  const evoInfo = getPetEvolutionInfo(unifiedExp, isHatched);
  const autoLevelGifts = getAutoUnlockedAccessoriesForLevel(evoInfo.level);
  const syncedUnlockedAccessories = Array.from(
    new Set<PetAccessoryId>([
      ...toArray<PetAccessoryId>(currentPet.unlockedAccessories),
      ...autoLevelGifts
    ])
  );

  const allZeroBug =
    Number(currentPet.happiness || 0) === 0 &&
    Number(currentPet.energy || 0) === 0 &&
    Number(currentPet.hunger || 0) === 0;

  const syncedPet: VirtualPet = {
    ...currentPet,
    species: 'hamster',
    name: 'Chuột Hamster Mũm Mĩm',
    avatar: CUTE_HAMSTER_AVATAR_URL,
    level: evoInfo.level,
    exp: unifiedExp,
    evolutionStars: unifiedExp,
    eggStars: isHatched ? EGG_HATCH_TARGET_STARS : Math.min(EGG_HATCH_TARGET_STARS, unifiedExp),
    isHatched,
    unlockedAccessories: syncedUnlockedAccessories,
    equippedAccessories: toArray<PetAccessoryId>(currentPet.equippedAccessories),
    completedMealSlotsToday: toArray<'morning' | 'afternoon' | 'evening'>(
      currentPet.completedMealSlotsToday
    ),
    appliedDecaySlotsToday: toArray<'morning' | 'afternoon' | 'evening'>(
      currentPet.appliedDecaySlotsToday
    ),
    usedRoomAccessoriesToday: toArray<PetAccessoryId>(currentPet.usedRoomAccessoriesToday),
    happiness: allZeroBug ? 80 : Math.max(0, Math.min(100, Number(currentPet.happiness ?? 80))),
    energy: allZeroBug ? 80 : Math.max(0, Math.min(100, Number(currentPet.energy ?? 80))),
    hunger: allZeroBug ? 75 : Math.max(0, Math.min(100, Number(currentPet.hunger ?? 75)))
  };

  const updatedHistory: Record<string, DayRecord> = {
    ...buildDefault7DayHistory(),
    ...(state.history || {}),
    [todayKey]: {
      date: todayKey,
      completedTaskIds,
      starsEarned: todayStarsEarned,
      cumulativeStars,
      totalTasks,
      completionRate,
      goalMessage: state.settings?.dailyGoalMessage || existingRecord?.goalMessage,
      petHappiness: syncedPet.happiness ?? 80,
      petEnergy: syncedPet.energy ?? 80,
      petHunger: syncedPet.hunger ?? 75
    }
  };

  const existingTodayGoal = state.goalHistory?.[todayKey];
  const updatedGoalHistory: Record<string, GoalHistoryItem> = {
    ...(state.goalHistory || {}),
    ...(existingTodayGoal
      ? {
           [todayKey]: {
             ...existingTodayGoal,
             starsEarned: todayStarsEarned,
             completionRate
           }
         }
      : {})
  };

  const updatedDisciplineLogs = toArray<DisciplineLog>(state.disciplineLogs).filter((log) =>
    Boolean(log && log.date)
  );

  return {
    ...state,
    tasks,
    history: updatedHistory,
    goalHistory: updatedGoalHistory,
    disciplineLogs: updatedDisciplineLogs,
    profile: {
      ...state.profile,
      stars: cumulativeStars,
      dailyStarsEarned: todayStarsEarned,
      totalStarsEarned: cumulativeStars,
      level: evoInfo.level,
      currentXp: unifiedExp,
      maxXp: evoInfo.nextThreshold,
      pet: syncedPet
    }
  };
}

/**
 * Loads the application state from localStorage purely as an initial cache placeholder.
 * NEVER pushes to Firebase and NEVER runs midnight reset before Firebase Single Source of Truth is fetched!
 */
export function loadAppState(): AppState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const rawTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    const rawStars = localStorage.getItem(STARS_STORAGE_KEY);
    const rawProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
    const rawPetEgg = localStorage.getItem(PET_EGG_STORAGE_KEY);

    if (!raw && !rawTasks && !rawStars && !rawProgress && !rawPetEgg) {
      return {
        ...INITIAL_STATE,
        familyCode: getOrCreateDeviceFamilyCode(),
        lastSyncTimestamp: 0,
        lastUpdatedAt: 0
      };
    }

    const parsedBase: Partial<AppState> = raw ? JSON.parse(raw) : {};
    const parsedTasks: Task[] | null = rawTasks ? toArray<Task>(JSON.parse(rawTasks)) : null;
    const parsedStars: { stars?: number; dailyStarsEarned?: number; totalStarsEarned?: number } | null = rawStars
      ? JSON.parse(rawStars)
      : null;
    const parsedProgress: Partial<AppState> | null = rawProgress ? JSON.parse(rawProgress) : null;
    const parsedPetEgg: Partial<VirtualPet> | null = rawPetEgg ? JSON.parse(rawPetEgg) : null;

    const basePet: VirtualPet = {
      ...INITIAL_STATE.profile.pet,
      ...(parsedProgress?.profile?.pet || {}),
      ...(parsedBase.profile?.pet || {}),
      ...(parsedPetEgg || {})
    };

    const speciesMeta = getPetSpeciesMeta('hamster', basePet.name);
    const hasSavedEggRecord = Boolean(rawPetEgg);
    const normalizedEggStars = hasSavedEggRecord
      ? Math.max(0, Math.min(EGG_HATCH_TARGET_STARS, Number(basePet.eggStars ?? 0)))
      : EGG_HATCH_TARGET_STARS;
    const normalizedIsHatched = true;
    const normalizedEvolutionStars = Math.max(
      INITIAL_STATE.profile.currentXp,
      Number(basePet.exp ?? basePet.evolutionStars ?? normalizedEggStars)
    );

    const allZeroPetBug =
      Number(basePet.happiness || 0) === 0 &&
      Number(basePet.energy || 0) === 0 &&
      Number(basePet.hunger || 0) === 0;

    const baseUnlocked = toArray<PetAccessoryId>(basePet.unlockedAccessories);
    const baseEquipped = toArray<PetAccessoryId>(basePet.equippedAccessories);

    const mergedProfile: ChildProfile = {
      ...INITIAL_STATE.profile,
      ...(parsedProgress?.profile || {}),
      ...(parsedBase.profile || {}),
      avatar: sanitizeAvatarUrl(parsedBase.profile?.avatar || parsedProgress?.profile?.avatar),
      pet: {
        ...basePet,
        species: 'hamster',
        name: speciesMeta.nameVi,
        avatar: CUTE_HAMSTER_AVATAR_URL,
        happiness: allZeroPetBug ? 80 : Math.max(0, Math.min(100, Number(basePet.happiness ?? 80))),
        energy: allZeroPetBug ? 80 : Math.max(0, Math.min(100, Number(basePet.energy ?? 80))),
        hunger: allZeroPetBug ? 75 : Math.max(0, Math.min(100, Number(basePet.hunger ?? 75))),
        eggStars: normalizedEggStars,
        evolutionStars: normalizedEvolutionStars,
        exp: normalizedEvolutionStars,
        isHatched: normalizedIsHatched,
        hasChosenSpecies: true,
        unlockedAccessories: Array.from(
          new Set<PetAccessoryId>([
            ...toArray<PetAccessoryId>(INITIAL_STATE.profile.pet.unlockedAccessories),
            ...baseUnlocked
          ])
        ),
        equippedAccessories: Array.from(
          new Set<PetAccessoryId>(
            baseEquipped.length > 0
              ? baseEquipped
              : toArray<PetAccessoryId>(INITIAL_STATE.profile.pet.equippedAccessories)
          )
        )
      }
    };

    if (parsedStars) {
      if (typeof parsedStars.stars === 'number') {
        mergedProfile.stars = parsedStars.stars;
      }
      if (typeof parsedStars.dailyStarsEarned === 'number') {
        mergedProfile.dailyStarsEarned = parsedStars.dailyStarsEarned;
      }
      if (typeof parsedStars.totalStarsEarned === 'number') {
        mergedProfile.totalStarsEarned = parsedStars.totalStarsEarned;
      }
    }

    if (mergedProfile.name === 'Bé Minh Triết' || mergedProfile.name === 'Cơ Minh') {
      mergedProfile.name = 'Hiệp Sĩ Cơ Minh';
    }

    const baseTasksArr = toArray<Task>(parsedBase.tasks);
    const rawMergedTasks: Task[] =
      parsedTasks && parsedTasks.length > 0
        ? parsedTasks
        : baseTasksArr.length > 0
        ? baseTasksArr
        : INITIAL_STATE.tasks;

    const mergedTasks: Task[] = deduplicateById<Task>(rawMergedTasks, INITIAL_STATE.tasks).map((t) => {
      const isDone = Boolean(t.isCompleted);
      return {
        ...t,
        stars: Math.max(1, Math.round(Number(t.stars) || 1)),
        xp: 5,
        isCompleted: isDone,
        pendingApproval: Boolean(t.pendingApproval && !isDone),
        completedAt: isDone ? t.completedAt || t.timeExpected || '07:15' : undefined,
        requestedAt: t.pendingApproval && !isDone ? t.requestedAt : undefined
      };
    });

    const completedStarsToday = mergedTasks
      .filter((t) => t.isCompleted)
      .reduce((sum, t) => sum + Math.max(1, Math.round(Number(t.stars) || 1)), 0);

    mergedProfile.dailyStarsEarned = Math.max(
      completedStarsToday,
      Number(mergedProfile.dailyStarsEarned) || 0
    );

    const legacyChallengeIds = new Set(LEGACY_DEFAULT_CHALLENGE_IDS);
    const baseChallengesArr = toArray<Challenge>(parsedBase.challenges);
    const progressChallengesArr = toArray<Challenge>(parsedProgress?.challenges);
    const mergedChallenges = deduplicateById<Challenge>(
      baseChallengesArr.length > 0 ? baseChallengesArr : progressChallengesArr,
      INITIAL_STATE.challenges
    ).filter((c) => c && !legacyChallengeIds.has(c.id));

    const baseRewardsArr = toArray<Reward>(parsedBase.rewards);
    const progressRewardsArr = toArray<Reward>(parsedProgress?.rewards);
    const mergedRewards = deduplicateById<Reward>(
      baseRewardsArr.length > 0 ? baseRewardsArr : progressRewardsArr,
      INITIAL_STATE.rewards
    );

    const rawSavedTs = Math.max(
      Number(parsedBase.lastUpdatedAt) || 0,
      Number(parsedBase.lastSyncTimestamp) || 0
    );
    const cleanSavedTs = rawSavedTs === 1794124805000 ? 0 : rawSavedTs;

    const baseBadgesArr = toArray<Badge>(parsedBase.badges);
    const progressBadgesArr = toArray<Badge>(parsedProgress?.badges);
    const baseLogsArr = toArray<DisciplineLog>(parsedBase.disciplineLogs);
    const progressLogsArr = toArray<DisciplineLog>(parsedProgress?.disciplineLogs);

    const state: AppState = {
      ...INITIAL_STATE,
      ...parsedProgress,
      ...parsedBase,
      familyCode:
        parsedBase.familyCode && parsedBase.familyCode.trim()
          ? parsedBase.familyCode.trim().toUpperCase()
          : getOrCreateDeviceFamilyCode(),
      profile: mergedProfile,
      tasks: mergedTasks,
      rewards: mergedRewards,
      challenges: mergedChallenges,
      badges: deduplicateById<Badge>(
        baseBadgesArr.length > 0 ? baseBadgesArr : progressBadgesArr,
        INITIAL_STATE.badges
      ),
      history: {
        ...buildDefault7DayHistory(),
        ...(parsedProgress?.history || {}),
        ...(parsedBase.history || {})
      },
      goalHistory: {
        ...(parsedProgress?.goalHistory || {}),
        ...(parsedBase.goalHistory || {})
      },
      disciplinePrinciples: deduplicateById<DisciplinePrinciple>(
        toArray<DisciplinePrinciple>(parsedBase.disciplinePrinciples),
        INITIAL_STATE.disciplinePrinciples
      ),
      disciplineRules: deduplicateById<DisciplineRule>(
        toArray<DisciplineRule>(parsedBase.disciplineRules),
        INITIAL_STATE.disciplineRules
      ),
      disciplineLogs: baseLogsArr.length > 0 ? baseLogsArr : progressLogsArr,
      settings: {
        ...INITIAL_STATE.settings,
        ...(parsedBase.settings || {})
      },
      lastSyncTimestamp: cleanSavedTs,
      lastUpdatedAt: cleanSavedTs,
      lastStarSpendTimestamp: Number(parsedBase.lastStarSpendTimestamp) || undefined
    };

    const finalLoaded = syncTodayHistory(purgePastDaysData(state));
    if (!lastSyncedFingerprint) {
      lastSyncedFingerprint = contentFingerprint(finalLoaded);
    }
    return finalLoaded;
  } catch (err) {
    console.warn('Error loading state from localStorage:', err);
    return {
      ...INITIAL_STATE,
      familyCode: getOrCreateDeviceFamilyCode()
    };
  }
}

/**
 * Saves state to localStorage and pushes to Firebase ONLY when:
 * 1. `broadcast` is true, AND
 * 2. `firebaseHydrated` is true (device has already fetched from Firebase), AND
 * 3. `fingerprint !== lastSyncedFingerprint` (not an echo of what was just received/pushed).
 */
export function saveAppState(state: AppState, broadcast: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    const synced = syncTodayHistory(purgePastDaysData(state));
    const fingerprint = contentFingerprint(synced);

    if (broadcast && (!firebaseHydrated || fingerprint === lastSyncedFingerprint)) {
      broadcast = false;
    }

    const existingTs = getStateTimestamp(synced);
    const nextTs = broadcast
      ? Math.max(Date.now(), existingTs + 1, lastPushedTs + 1)
      : existingTs;

    const updatedState: AppState = {
      ...synced,
      lastSyncTimestamp: nextTs,
      lastUpdatedAt: nextTs
    };

    saveStarVaultSnapshot(updatedState);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));

    localStorage.setItem(
      STARS_STORAGE_KEY,
      JSON.stringify({
        stars: updatedState.profile.stars,
        dailyStarsEarned: updatedState.profile.dailyStarsEarned ?? 0,
        totalStarsEarned: updatedState.profile.totalStarsEarned,
        updatedAt: nextTs
      })
    );

    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedState.tasks));

    localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        profile: updatedState.profile,
        history: updatedState.history,
        goalHistory: updatedState.goalHistory,
        challenges: updatedState.challenges,
        rewards: updatedState.rewards,
        badges: updatedState.badges,
        disciplineLogs: updatedState.disciplineLogs,
        updatedAt: nextTs
      })
    );

    localStorage.setItem(
      PET_EGG_STORAGE_KEY,
      JSON.stringify({
        ...updatedState.profile.pet,
        species: 'hamster',
        name: 'Chuột Hamster Mũm Mĩm',
        avatar: CUTE_HAMSTER_AVATAR_URL,
        isHatched: Boolean(updatedState.profile.pet.isHatched),
        eggStars: Number(updatedState.profile.pet.eggStars ?? 0),
        evolutionStars: Number(updatedState.profile.pet.evolutionStars ?? updatedState.profile.pet.eggStars ?? 0),
        hasChosenSpecies: true,
        unlockedAccessories: toArray<PetAccessoryId>(updatedState.profile.pet.unlockedAccessories),
        equippedAccessories: toArray<PetAccessoryId>(updatedState.profile.pet.equippedAccessories),
        happiness: updatedState.profile.pet.happiness,
        energy: updatedState.profile.pet.energy,
        hunger: updatedState.profile.pet.hunger,
        level: updatedState.profile.pet.level,
        updatedAt: nextTs
      })
    );

    if (broadcast) {
      lastSyncedFingerprint = fingerprint;
      lastPushedTs = nextTs;
      const safeState = toFirebaseSafe(updatedState);

      if (syncChannel) {
        syncChannel.postMessage({
          type: 'LOCAL_STATE_UPDATED',
          timestamp: nextTs,
          state: safeState
        });
      }

      if (safeState.familyCode) {
        void pushToFirebaseReliably(safeState, fingerprint);
        if (navigator.onLine) {
          pushStateToServer(safeState, true).catch((err) => {
            console.warn('[KidHero] pushStateToServer failed in saveAppState:', err);
          });
        }
      }
    }
  } catch (err) {
    console.warn('Error saving state to localStorage:', err);
  }
}

/**
 * Resets daily tasks for a new day while preserving cumulative stars (`profile.stars`)
 * AND preserving Hamster's 3 health stats (`happiness`, `energy`, `hunger`).
 */
export function resetDailyTasksForNewDay(state: AppState): AppState {
  const todayKey = getTodayKey();
  const tasksList = toArray<Task>(state.tasks);
  const completedTaskIds = tasksList.filter((t) => t.isCompleted).map((t) => t.id);
  const totalTasks = tasksList.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTaskIds.length / totalTasks) * 100) : 0;

  const currentPet = state.profile.pet;
  const safeHappiness = Math.max(50, Number(currentPet?.happiness) || 80);
  const safeEnergy = Math.max(50, Number(currentPet?.energy) || 80);
  const safeHunger = Math.max(50, Number(currentPet?.hunger) || 75);

  const updatedHistory: Record<string, DayRecord> = {
    ...(state.history || {}),
    [todayKey]: {
      date: todayKey,
      completedTaskIds: [],
      starsEarned: 0,
      totalTasks,
      completionRate: 0,
      goalMessage: state.settings.dailyGoalMessage,
      petHappiness: safeHappiness,
      petEnergy: safeEnergy,
      petHunger: safeHunger
    }
  };

  let newStreak = state.profile.streakDays;
  if (completionRate >= 50) {
    newStreak += 1;
  }

  const resetTasks = tasksList.map((task) => ({
    ...task,
    isCompleted: false,
    pendingApproval: false,
    completedAt: undefined,
    requestedAt: undefined
  }));

  const resetChallenges = toArray<Challenge>(state.challenges).map((c) => ({
    ...c,
    isCompletedToday: false,
    pendingApproval: false,
    requestedAt: undefined,
    completedAt: undefined
  }));

  const nextState: AppState = {
    ...state,
    history: updatedHistory,
    goalHistory: {},
    disciplineLogs: [],
    tasks: resetTasks,
    challenges: resetChallenges,
    profile: {
      ...state.profile,
      stars: Math.max(0, Number(state.profile.stars) || 0),
      dailyStarsEarned: 0,
      totalStarsEarned: Math.max(0, Number(state.profile.totalStarsEarned) || 0),
      streakDays: newStreak,
      lastActiveDate: todayKey,
      pet: {
        ...state.profile.pet,
        species: 'hamster',
        name: 'Chuột Hamster Mũm Mĩm',
        avatar: CUTE_HAMSTER_AVATAR_URL,
        happiness: safeHappiness,
        energy: safeEnergy,
        hunger: safeHunger,
        sleepCountToday: 0,
        lastSleepDate: todayKey,
        headPatCountToday: 0,
        feedCountToday: 0,
        lastFeedDate: todayKey,
        lastHeadPatDate: todayKey,
        lastDecayDate: todayKey,
        lastHourlyDecayHour: undefined,
        completedMealSlotsToday: [],
        appliedDecaySlotsToday: [],
        usedRoomAccessoriesToday: [],
        moodState: 'normal'
      }
    }
  };

  saveAppState(nextState, true);
  return nextState;
}

/**
 * Allows parents to manually reset points/stars (Tự reset lại điểm):
 * - 'daily_only': Resets today's tasks while keeping cumulative stars AND keeping Hamster's 3 health stats
 * - 'all_stars': Resets both today's stars and cumulative total stars to 0
 * - 'full_reset': Resets all stars, XP, Level 1, Streak, Pet, and tasks to 0
 */
export function resetParentPoints(
  state: AppState,
  mode: 'daily_only' | 'all_stars' | 'full_reset'
): AppState {
  const todayKey = getTodayKey();
  const tasksList = toArray<Task>(state.tasks);
  const totalTasks = tasksList.length;

  const resetTasks = tasksList.map((task) => ({
    ...task,
    stars: Math.max(1, Math.round(Number(task.stars) || 1)),
    isCompleted: false,
    pendingApproval: false,
    completedAt: undefined,
    requestedAt: undefined
  }));

  const resetChallenges = toArray<Challenge>(state.challenges).map((c) => ({
    ...c,
    isCompletedToday: false,
    pendingApproval: false,
    requestedAt: undefined,
    completedAt: undefined
  }));

  const safeHappiness = Math.max(50, Number(state.profile.pet?.happiness) || 80);
  const safeEnergy = Math.max(50, Number(state.profile.pet?.energy) || 80);
  const safeHunger = Math.max(50, Number(state.profile.pet?.hunger) || 75);

  const clearedHistory: Record<string, DayRecord> = {
    ...(state.history || {}),
    [todayKey]: {
      date: todayKey,
      completedTaskIds: [],
      starsEarned: 0,
      totalTasks,
      completionRate: 0,
      goalMessage: state.settings.dailyGoalMessage,
      petHappiness: safeHappiness,
      petEnergy: safeEnergy,
      petHunger: safeHunger
    }
  };

  if (mode === 'daily_only') {
    const nextState: AppState = {
      ...state,
      history: clearedHistory,
      goalHistory: {},
      tasks: resetTasks,
      challenges: resetChallenges,
      profile: {
        ...state.profile,
        dailyStarsEarned: 0,
        lastActiveDate: todayKey,
        pet: {
          ...state.profile.pet,
          happiness: safeHappiness,
          energy: safeEnergy,
          hunger: safeHunger,
          sleepCountToday: 0,
          lastSleepDate: todayKey,
          headPatCountToday: 0,
          feedCountToday: 0,
          lastFeedDate: todayKey,
          lastHeadPatDate: todayKey,
          lastDecayDate: todayKey,
          lastHourlyDecayHour: undefined,
          completedMealSlotsToday: [],
          appliedDecaySlotsToday: [],
          usedRoomAccessoriesToday: [],
          moodState: 'normal'
        }
      }
    };
    saveAppState(nextState, true);
    return nextState;
  }

  if (mode === 'all_stars') {
    clearStarVaultSnapshot();
    const resetTs = Date.now();
    const nextState: AppState = {
      ...state,
      lastExplicitResetTimestamp: resetTs,
      history: clearedHistory,
      goalHistory: {},
      tasks: resetTasks,
      challenges: resetChallenges,
      profile: {
        ...state.profile,
        stars: 0,
        dailyStarsEarned: 0,
        totalStarsEarned: 0,
        lastActiveDate: todayKey,
        pet: {
          ...state.profile.pet,
          happiness: safeHappiness,
          energy: safeEnergy,
          hunger: safeHunger,
          headPatCountToday: 0,
          lastHeadPatDate: todayKey,
          lastDecayDate: todayKey,
          lastHourlyDecayHour: undefined,
          completedMealSlotsToday: [],
          appliedDecaySlotsToday: [],
          usedRoomAccessoriesToday: [],
          moodState: 'normal'
        }
      }
    };

    saveAppState(nextState, true);
    return nextState;
  }

  clearStarVaultSnapshot();
  const resetTs = Date.now();
  const resetBadges = toArray<Badge>(state.badges).map((b) => ({
    ...b,
    currentCount: 0,
    unlocked: false,
    unlockedAt: undefined
  }));

  const nextState: AppState = {
    ...state,
    lastExplicitResetTimestamp: resetTs,
    history: clearedHistory,
    goalHistory: {},
    disciplineLogs: [],
    tasks: resetTasks,
    challenges: resetChallenges,
    badges: resetBadges,
    profile: {
      ...state.profile,
      stars: 0,
      dailyStarsEarned: 0,
      totalStarsEarned: 0,
      currentXp: 0,
      maxXp: 100,
      level: 1,
      streakDays: 0,
      lastActiveDate: todayKey,
      pet: {
        ...state.profile.pet,
        species: 'hamster',
        name: 'Chuột Hamster Mũm Mĩm',
        avatar: CUTE_HAMSTER_AVATAR_URL,
        eggStars: 0,
        evolutionStars: 0,
        exp: 0,
        isHatched: true,
        level: 1,
        happiness: safeHappiness,
        energy: safeEnergy,
        hunger: safeHunger
      }
    }
  };

  saveAppState(nextState, true);
  return nextState;
}

export function subscribeToCrossTabSync(callback: (newState: AppState) => void): () => void {
  const channelHandler = (event: MessageEvent) => {
    if (event.data && event.data.type === 'LOCAL_STATE_UPDATED' && event.data.state) {
      callback(purgePastDaysData(normalizeFirebaseArrays(event.data.state as AppState)));
    }
  };

  const storageHandler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue) as AppState;
        if (parsed && parsed.profile && toArray(parsed.tasks).length > 0) {
          callback(purgePastDaysData(normalizeFirebaseArrays(parsed)));
        }
      } catch {
        // Ignore malformed storage events
      }
    }
  };

  syncChannel?.addEventListener('message', channelHandler);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageHandler);
  }

  return () => {
    syncChannel?.removeEventListener('message', channelHandler);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', storageHandler);
    }
  };
}

export function subscribeToRealtimeMultiDeviceSync(
  familyCode: string,
  onRemoteUpdate: (
    remoteState: AppState,
    source: 'rtdb' | 'firestore',
    isFromOtherDevice?: boolean
  ) => void
): () => void {
  if (typeof window === 'undefined' || !familyCode) return () => {};
  const cleanCode = familyCode.trim().toUpperCase();

  // Only use Firebase Realtime Database (Single Source of Truth) — no SSE from server.ts
  const unsubFirebase = subscribeToFirebaseFamily(
    cleanCode,
    (remoteState, source, isFromOtherDevice) => {
      onRemoteUpdate(
        purgePastDaysData(normalizeFirebaseArrays(remoteState)),
        source,
        isFromOtherDevice
      );
    }
  );

  return () => {
    unsubFirebase();
  };
}

export async function pushStateToServer(state: AppState, force: boolean = false): Promise<boolean> {
  try {
    const cleanCode = (state.familyCode || '').trim().toUpperCase();
    if (!cleanCode) return false;
    const sanitized = toFirebaseSafe(purgePastDaysData(state));
    const res = await fetch(
      `/api/sync/${encodeURIComponent(cleanCode)}${force ? '?force=1' : ''}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: sanitized, force })
      }
    );
    return res.ok;
  } catch (err) {
    console.warn('[KidHero] pushStateToServer error:', err);
    return false;
  }
}

export async function pullStateFromServer(familyCode: string): Promise<AppState | null> {
  try {
    const cleanCode = (familyCode || '').trim().toUpperCase();
    if (!cleanCode) return null;
    const res = await fetch(`/api/sync/${encodeURIComponent(cleanCode)}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.data && json.data.profile && toArray(json.data.tasks).length > 0) {
      const serverData = normalizeFirebaseArrays(json.data as AppState);
      const serverTs =
        Number(serverData.lastUpdatedAt || serverData.lastSyncTimestamp || json.updatedAt) || 0;
      return purgePastDaysData({
        ...serverData,
        familyCode: cleanCode,
        lastSyncTimestamp: serverTs,
        lastUpdatedAt: serverTs
      });
    }
    return null;
  } catch (err) {
    console.warn('[KidHero] pullStateFromServer error:', err);
    return null;
  }
}

export type FamilyPullResult =
  | { status: 'ok'; state: AppState }
  | { status: 'empty' }
  | { status: 'error'; error: unknown };

export async function pullLatestFamilyStateResult(familyCode: string): Promise<FamilyPullResult> {
  const cleanCode = (familyCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { status: 'error', error: new Error('Invalid family code') };
  }

  const fbResult = await pullStateFromFirebase(cleanCode);
  if (fbResult.status === 'ok') {
    return {
      status: 'ok',
      state: syncTodayHistory(purgePastDaysData(normalizeFirebaseArrays(fbResult.state)))
    };
  }

  if (fbResult.status === 'error') {
    return { status: 'error', error: fbResult.error };
  }

  // Firebase returned 'empty' -> check server fallback
  const serverState = await pullStateFromServer(cleanCode).catch(() => null);
  if (serverState) {
    return {
      status: 'ok',
      state: syncTodayHistory(purgePastDaysData(normalizeFirebaseArrays(serverState)))
    };
  }

  markFirebaseHydrated();
  return { status: 'empty' };
}

export async function pullLatestFamilyState(familyCode: string): Promise<AppState | null> {
  const res = await pullLatestFamilyStateResult(familyCode);
  if (res.status === 'ok') {
    return res.state;
  }
  if (res.status === 'empty') {
    return null;
  }
  throw res.error;
}

export async function forcePushStateToAllDevices(state: AppState): Promise<boolean> {
  const stateTs = getStateTimestamp(state);
  const now = Math.max(Date.now(), stateTs + 1, lastPushedTs + 1);
  lastPushedTs = now;
  markFirebaseHydrated();

  const authoritativeState: AppState = syncTodayHistory(
    purgePastDaysData({
      ...state,
      lastSyncTimestamp: now,
      lastUpdatedAt: now
    })
  );

  lastSyncedFingerprint = contentFingerprint(authoritativeState);
  saveAppState(authoritativeState, false);

  const safePayload = toFirebaseSafe(authoritativeState);

  const [serverOk, firebaseOk] = await Promise.all([
    pushStateToServer(safePayload, true),
    pushToFirebaseReliably(safePayload, lastSyncedFingerprint)
  ]);

  if (syncChannel) {
    syncChannel.postMessage({
      type: 'LOCAL_STATE_UPDATED',
      timestamp: now,
      state: safePayload
    });
  }

  return serverOk || firebaseOk;
}

export function exportDataAsJson(state: AppState): void {
  const cleanState = syncTodayHistory(purgePastDaysData(state));
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cleanState, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `kidhero_backup_${getTodayKey()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importDataFromJson(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.profile || toArray(parsed.tasks).length === 0) {
          throw new Error('Invalid KidHero data structure');
        }
        resolve(syncTodayHistory(purgePastDaysData(normalizeFirebaseArrays(parsed))));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
}
