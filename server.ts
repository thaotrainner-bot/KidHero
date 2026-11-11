import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const SYNC_STORE_FILE = path.join(DATA_DIR, 'family_sync_store.json');

interface FamilyStore {
  updatedAt: number;
  data: any;
}

const familyStore = new Map<string, FamilyStore>();
const sseClients = new Map<string, Set<express.Response>>();

function getTodayKeyServer(): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const rawYear = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (rawYear && month && day) {
      const parsedYear = parseInt(rawYear, 10);
      const year = !Number.isNaN(parsedYear) && parsedYear < 2026 ? '2026' : rawYear;
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback
  }
  const now = new Date();
  const rawYear = now.getFullYear();
  const year = rawYear < 2026 ? 2026 : rawYear;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
  * Sanitizes family sync payload on the server WITHOUT resetting tasks or dailyStarsEarned
  * based on the server container clock (since the client browser clock is the authoritative
  * source of truth for `getTodayKey()` and `checkAndResetAfterMidnight`).
  */
function sanitizeOnlyTodayData(rawData: any): any {
  if (!rawData || typeof rawData !== 'object') return rawData;
  const fallbackTodayKey = getTodayKeyServer();
  const clientDateKey =
    typeof rawData.profile?.lastActiveDate === 'string' && rawData.profile.lastActiveDate.trim()
      ? rawData.profile.lastActiveDate.trim()
      : fallbackTodayKey;

  const cleanHistory =
    rawData.history && typeof rawData.history === 'object' ? { ...rawData.history } : {};

  const cleanGoalHistory =
    rawData.goalHistory && typeof rawData.goalHistory === 'object' ? { ...rawData.goalHistory } : {};

  const cleanDisciplineLogs = Array.isArray(rawData.disciplineLogs)
    ? rawData.disciplineLogs.filter((log: any) => Boolean(log && log.date))
    : [];

  const tasks = Array.isArray(rawData.tasks) ? rawData.tasks : [];
  const challenges = Array.isArray(rawData.challenges) ? rawData.challenges : [];

  const completedTaskStars = tasks
    .filter((t: any) => Boolean(t && t.isCompleted))
    .reduce((sum: number, t: any) => sum + Math.max(1, Math.round(Number(t.stars) || 1)), 0);

  const completedChallengeStars = challenges
    .filter((c: any) => Boolean(c && c.isCompletedToday))
    .reduce((sum: number, c: any) => sum + Math.max(1, Math.round(Number(c.stars) || 1)), 0);

  const syncedDailyStars = Math.max(
    0,
    Number(rawData.profile?.dailyStarsEarned) || 0,
    completedTaskStars + completedChallengeStars
  );

  const currentCumulativeStars = Math.max(0, Number(rawData.profile?.stars) || 0);

  const rawPet = rawData.profile?.pet || {};
  const isAllStatsZero =
    (Number(rawPet.happiness) || 0) === 0 &&
    (Number(rawPet.energy) || 0) === 0 &&
    (Number(rawPet.hunger) || 0) === 0;

  return {
    ...rawData,
    tasks,
    challenges,
    history: cleanHistory,
    goalHistory: cleanGoalHistory,
    disciplineLogs: cleanDisciplineLogs,
    profile: rawData.profile
      ? {
          ...rawData.profile,
          stars: currentCumulativeStars,
          dailyStarsEarned: syncedDailyStars,
          totalStarsEarned: currentCumulativeStars,
          lastActiveDate: clientDateKey,
          pet: rawData.profile.pet
            ? {
                ...rawData.profile.pet,
                happiness: isAllStatsZero ? 80 : Math.max(0, Number(rawPet.happiness) || 80),
                energy: isAllStatsZero ? 80 : Math.max(0, Number(rawPet.energy) || 80),
                hunger: isAllStatsZero ? 75 : Math.max(0, Number(rawPet.hunger) || 75)
              }
            : rawData.profile.pet
        }
      : rawData.profile
  };
}

function loadStoreFromDisk(): void {
  try {
    if (fs.existsSync(SYNC_STORE_FILE)) {
      const raw = fs.readFileSync(SYNC_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, FamilyStore>;
      if (parsed && typeof parsed === 'object') {
        for (const [code, entry] of Object.entries(parsed)) {
          if (entry && entry.data) {
            familyStore.set(code, {
              updatedAt: Number(entry.updatedAt) || Date.now(),
              data: sanitizeOnlyTodayData(entry.data)
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not load family sync store from disk:', err);
  }
}

function saveStoreToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serialized: Record<string, FamilyStore> = {};
    for (const [code, entry] of familyStore.entries()) {
      serialized[code] = entry;
    }
    fs.writeFileSync(SYNC_STORE_FILE, JSON.stringify(serialized, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist family sync store to disk:', err);
  }
}

loadStoreFromDisk();

function broadcastFamilyUpdate(familyCode: string, updatedAt: number, data: any) {
  const cleanCode = (familyCode || '').trim().toUpperCase();
  const clients = sseClients.get(cleanCode);
  if (!clients || clients.size === 0) return;

  const payload = JSON.stringify({
    familyCode: cleanCode,
    updatedAt,
    data
  });

  for (const res of clients) {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch {
      clients.delete(res);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });



  // Real-time Server-Sent Events (SSE) stream for instant multi-device push
  app.get('/api/events/:familyCode', (req, res) => {
    const cleanCode = (req.params.familyCode || '').trim().toUpperCase();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let clients = sseClients.get(cleanCode);
    if (!clients) {
      clients = new Set();
      sseClients.set(cleanCode, clients);
    }
    clients.add(res);

    // Send initial snapshot if present
    const entry = familyStore.get(cleanCode);
    if (entry) {
      const sanitized = sanitizeOnlyTodayData(entry.data);
      res.write(
        `data: ${JSON.stringify({
          familyCode: cleanCode,
          updatedAt: entry.updatedAt,
          data: sanitized
        })}\n\n`
      );
    }

    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      clients?.delete(res);
    });
  });

  // Pull latest family data
  app.get('/api/sync/:familyCode', (req, res) => {
    const { familyCode } = req.params;
    const cleanCode = (familyCode || '').trim().toUpperCase();
    const entry = familyStore.get(cleanCode);
    if (!entry) {
      return res.status(404).json({ error: 'Family code not found on server yet' });
    }
    const sanitized = sanitizeOnlyTodayData(entry.data);
    return res.json({
      familyCode: cleanCode,
      updatedAt: entry.updatedAt,
      data: sanitized
    });
  });

  // Push updated family data (with timestamp protection, anti-star-loss guard & force override support)
  app.post('/api/sync/:familyCode', (req, res) => {
    const { familyCode } = req.params;
    const cleanCode = (familyCode || '').trim().toUpperCase();
    const { data, force } = req.body;
    const isForce = Boolean(force || req.query.force === '1' || req.query.force === 'true');

    if (!data) {
      return res.status(400).json({ error: 'Missing data payload' });
    }

    const existing = familyStore.get(cleanCode);
    const incomingTs = Math.max(
      Number(data.lastUpdatedAt) || 0,
      Number(data.lastSyncTimestamp) || 0
    );

    // Prevent an uninitialized device (incomingTs === 0) or stale tab from overwriting newer server state unless force=true
    if (!isForce && existing && (incomingTs === 0 || incomingTs < existing.updatedAt - 2000)) {
      return res.json({
        success: true,
        ignoredStale: true,
        familyCode: cleanCode,
        updatedAt: existing.updatedAt,
        data: existing.data
      });
    }

    // CRITICAL ANTI-STAR-LOSS GUARD ON SERVER:
    // If existing server state has >0 stars and incoming state is an uninitialized 0-star session
    // (neither explicitly reset nor legitimately spent), preserve existing stars.
    let mergedData = data;
    if (existing && existing.data && existing.data.profile && data.profile) {
      const existingStars = Math.max(0, Number(existing.data.profile.stars) || 0);
      const incomingStars = Math.max(0, Number(data.profile.stars) || 0);
      const existingResetTs = Number(existing.data.lastExplicitResetTimestamp) || 0;
      const incomingResetTs = Number(data.lastExplicitResetTimestamp) || 0;
      const wasExplicitlyReset = incomingResetTs > existingResetTs && incomingResetTs > 0;
      const hasLegitSpend = Number(data.lastStarSpendTimestamp || 0) > 0;

      if (existingStars > 0 && incomingStars === 0 && !wasExplicitlyReset && !hasLegitSpend && incomingTs === 0) {
        mergedData = {
          ...data,
          profile: {
            ...data.profile,
            stars: existingStars,
            totalStarsEarned: existingStars,
            level: Math.max(Number(existing.data.profile.level) || 1, Number(data.profile.level) || 1),
            currentXp: Math.max(
              Number(existing.data.profile.currentXp) || 0,
              Number(data.profile.currentXp) || 0
            ),
            pet: {
              ...(existing.data.profile.pet || {}),
              ...(data.profile.pet || {}),
              level: Math.max(
                Number(existing.data.profile.pet?.level) || 1,
                Number(data.profile.pet?.level) || 1
              ),
              exp: Math.max(
                Number(existing.data.profile.pet?.exp) || 0,
                Number(data.profile.pet?.exp) || 0
              ),
              evolutionStars: Math.max(
                Number(existing.data.profile.pet?.evolutionStars) || 0,
                Number(data.profile.pet?.evolutionStars) || 0
              )
            }
          }
        };
      }
    }

    const updatedAt = isForce ? Date.now() : Math.max(Date.now(), incomingTs);
    const sanitizedData = sanitizeOnlyTodayData({
      ...mergedData,
      familyCode: cleanCode,
      lastSyncTimestamp: updatedAt,
      lastUpdatedAt: updatedAt
    });

    familyStore.set(cleanCode, {
      updatedAt,
      data: sanitizedData
    });
    saveStoreToDisk();
    broadcastFamilyUpdate(cleanCode, updatedAt, sanitizedData);

    return res.json({
      success: true,
      familyCode: cleanCode,
      updatedAt,
      data: sanitizedData
    });
  });

  // Development mode: Vite dev server middleware
  if (process.env.NODE_ENV !== 'production') {
    let viteMiddleware: any = null;
    const viteReadyPromise = createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    }).then((vite) => {
      viteMiddleware = vite.middlewares;
      return vite;
    });

    app.use(async (req, res, next) => {
      if (viteMiddleware) {
        return viteMiddleware(req, res, next);
      }
      try {
        const vite = await viteReadyPromise;
        return vite.middlewares(req, res, next);
      } catch (err) {
        return next(err);
      }
    });
  } else {
    // Production: serve built static files
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KidHero server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
