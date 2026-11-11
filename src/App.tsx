/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header, KidOrParentTab } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { TaskBoard } from './components/TaskBoard';
import { ChallengeHub } from './components/ChallengeHub';
import { RewardShop } from './components/RewardShop';
import { KidDisciplineView } from './components/KidDisciplineView';
import { ParentDashboard } from './components/ParentDashboard';
import { ParentGateModal } from './components/ParentGateModal';
import { BadgesModal } from './components/BadgesModal';
import { SyncModal } from './components/SyncModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LevelUpOverlay, LevelUpCelebrationData } from './components/LevelUpOverlay';
import confetti from 'canvas-confetti';
import { AppState, Language, PetAccessoryId, PetRoomTheme, PetSpecies, Reward, Task, VirtualPet } from './types';
import {
  loadAppState,
  saveAppState,
  applyRemoteStateIfNewer,
  getStateTimestamp,
  isFirebaseHydrated,
  markFirebaseHydrated,
  resetFamilySyncGuards,
  resetDailyTasksForNewDay,
  resetParentPoints,
  checkAndResetAfterMidnight,
  subscribeToCrossTabSync,
  subscribeToRealtimeMultiDeviceSync,
  pullLatestFamilyStateResult,
  forcePushStateToAllDevices,
  exportDataAsJson,
  importDataFromJson
} from './utils/storage';
import { isValidFamilyCode } from './firebase';
import {
  playLevelUp,
  playSuccessChime,
  playPenaltySound,
  playEggCrackAndHatchSound,
  playFeedCrunchSound,
  playPetPurrBeepSound,
  speakText
} from './utils/audio';
import {
  EGG_HATCH_TARGET_STARS,
  PET_ROOM_ACCESSORIES,
  PET_SPECIES_LIST,
  getAutoUnlockedAccessoriesForLevel,
  getPetSpeciesMeta,
  getPetEvolutionInfo
} from './utils/pets';
import {
  applyTimeOfDayPetDecay,
  processRealWorldTaskCompletionForPet,
  handleDailyHeadPat,
  evaluatePetHatchAndEvolution,
  getManualCareStatCap,
  PET_RULES
} from './utils/petGamification';

/**
 * Custom hook `useFamilySync` (Part C):
 * - Initializes `state` from `loadAppState()`, keeps `stateRef` always pointing to latest state, and manages `isSynced`.
 * - `applyRemote(remote)` calls `applyRemoteStateIfNewer(stateRef.current, remote)`; if newer, updates `stateRef` + `setState(next)` immediately.
 * - On first hydration completion, sets `isSynced(true)` and ONLY THEN runs `checkAndResetAfterMidnight`.
 * - Subscribes to `pullLatestFamilyState`, `subscribeToRealtimeMultiDeviceSync`, and `subscribeToCrossTabSync` per `familyCode`.
 * - Persists `state` via `saveAppState(state, true)` (which blocks push until hydrated and suppresses echoes).
 */
export function useFamilySync(
  firebaseConfigRevision: number,
  onToast?: (msg: string) => void
) {
  const [state, setState] = useState<AppState>(() => {
    const initial = loadAppState();
    const params =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const familyParam = params?.get('family');
    if (familyParam && familyParam.trim()) {
      return {
        ...initial,
        familyCode: familyParam.trim().toUpperCase()
      };
    }
    return initial;
  });

  const [isSynced, setIsSynced] = useState<boolean>(isFirebaseHydrated);
  const stateRef = React.useRef<AppState>(state);
  stateRef.current = state;
  const hasHydratedOnceRef = React.useRef<boolean>(isFirebaseHydrated());
  const syncedFamilyCodeRef = React.useRef<string>((state.familyCode || '').trim().toUpperCase());
  const shownOfflineToastRef = React.useRef<boolean>(false);

  const runPostHydrationMidnightAndDecayCheck = useCallback(
    (base: AppState) => {
      const checked = checkAndResetAfterMidnight(base);
      const isNewDayAfterMidnight = Boolean(
        base.profile.lastActiveDate &&
          base.profile.lastActiveDate < checked.profile.lastActiveDate
      );
      const { pet: decayedPet, changed: decayChanged, noticeVi, noticeEn } =
        applyTimeOfDayPetDecay(checked.profile.pet, checked.tasks);

      if (isNewDayAfterMidnight || decayChanged) {
        const nowTs = Math.max(Date.now(), getStateTimestamp(checked) + 1);
        const nextState: AppState = {
          ...checked,
          lastSyncTimestamp: nowTs,
          lastUpdatedAt: nowTs,
          profile: {
            ...checked.profile,
            pet: decayedPet
          }
        };
        stateRef.current = nextState;
        setState(nextState);

        if (isNewDayAfterMidnight && onToast) {
          onToast(
            base.language === 'vi'
              ? `🌅 Bước sang ngày mới sau 0h! Giữ nguyên ${nextState.profile.stars} ⭐ tích lũy & đặt lại nhiệm vụ hôm nay về 0 ⭐!`
              : `🌅 New day after 00:00! Preserved ${nextState.profile.stars} ⭐ vault & reset today's quests to 0 ⭐!`
          );
        } else if (noticeVi && noticeEn && onToast) {
          onToast(base.language === 'vi' ? noticeVi : noticeEn);
        }
      }
    },
    [onToast]
  );

  const applyRemote = useCallback(
    (remote: AppState | null) => {
      const wasFirstHydration = !hasHydratedOnceRef.current;

      if (remote) {
        const prevStars = stateRef.current.profile.stars;
        const prevCompleted = stateRef.current.tasks.filter((t) => t.isCompleted).length;
        const next = applyRemoteStateIfNewer(stateRef.current, remote);

        if (next) {
          stateRef.current = next;
          setState(next);

          const nextCompleted = next.tasks.filter((t) => t.isCompleted).length;
          if (!wasFirstHydration && (next.profile.stars !== prevStars || nextCompleted !== prevCompleted) && onToast) {
            onToast(
              next.language === 'vi'
                ? `⚡ Đồng bộ tức thì: ${next.profile.stars} ⭐ (${nextCompleted}/${next.tasks.length} việc)`
                : `⚡ Live Synced: ${next.profile.stars} ⭐ (${nextCompleted}/${next.tasks.length} tasks)`
            );
          }
        }
      } else {
        markFirebaseHydrated();
      }

      if (wasFirstHydration) {
        hasHydratedOnceRef.current = true;
        setIsSynced(true);
        runPostHydrationMidnightAndDecayCheck(stateRef.current);
      }
    },
    [onToast, runPostHydrationMidnightAndDecayCheck]
  );

  // Sync subscription by familyCode (pullLatestFamilyStateResult + RTDB onValue + CrossTab)
  useEffect(() => {
    const code = (state.familyCode || '').trim().toUpperCase();
    if (code !== syncedFamilyCodeRef.current) {
      syncedFamilyCodeRef.current = code;
      resetFamilySyncGuards();
    }

    if (!code) {
      markFirebaseHydrated();
      setIsSynced(true);
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryAttempt = 0;

    const clearRetryTimer = () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const attemptHydration = async () => {
      if (cancelled) return;
      const hydratedBefore = isFirebaseHydrated();
      const result = await pullLatestFamilyStateResult(code);
      if (cancelled) return;

      if (result.status === 'ok') {
        clearRetryTimer();
        retryAttempt = 0;
        shownOfflineToastRef.current = false;
        applyRemote(result.state);
        return;
      }

      if (result.status === 'empty') {
        clearRetryTimer();
        retryAttempt = 0;
        shownOfflineToastRef.current = false;
        applyRemote(null);
        if (!hydratedBefore) {
          void forcePushStateToAllDevices(stateRef.current);
        }
        return;
      }

      // status === 'error'
      if (!hasHydratedOnceRef.current) {
        hasHydratedOnceRef.current = true;
        setIsSynced(true);
        runPostHydrationMidnightAndDecayCheck(stateRef.current);
      }

      if (!shownOfflineToastRef.current && onToast) {
        shownOfflineToastRef.current = true;
        onToast(
          '⚠️ Chưa kết nối được Firebase. Dữ liệu chỉ lưu trên máy, sẽ tự đồng bộ lại khi có mạng.'
        );
      }

      clearRetryTimer();
      const delay = Math.min(60000, 3000 * Math.pow(2, retryAttempt));
      retryAttempt += 1;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (!cancelled && !isFirebaseHydrated()) {
          void attemptHydration();
        }
      }, delay);
    };

    void attemptHydration();

    const unsubRealtime = subscribeToRealtimeMultiDeviceSync(code, (remoteState) => {
      if (!cancelled) {
        clearRetryTimer();
        retryAttempt = 0;
        applyRemote(remoteState);
      }
    });

    const unsubCrossTab = subscribeToCrossTabSync((newState) => {
      if (!cancelled) {
        applyRemote(newState);
      }
    });

    const handleWakeOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void attemptHydration();
        if (hasHydratedOnceRef.current) {
          runPostHydrationMidnightAndDecayCheck(stateRef.current);
        }
      }
    };

    const handleOnlineReconnect = () => {
      if (!cancelled && !isFirebaseHydrated()) {
        clearRetryTimer();
        retryAttempt = 0;
        void attemptHydration();
      }
    };

    const midnightInterval = setInterval(() => {
      if (!cancelled && hasHydratedOnceRef.current) {
        runPostHydrationMidnightAndDecayCheck(stateRef.current);
      }
    }, 30000);

    window.addEventListener('focus', handleWakeOrFocus);
    document.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('online', handleOnlineReconnect);

    return () => {
      cancelled = true;
      clearRetryTimer();
      clearInterval(midnightInterval);
      unsubRealtime();
      unsubCrossTab();
      window.removeEventListener('focus', handleWakeOrFocus);
      document.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('online', handleOnlineReconnect);
    };
  }, [state.familyCode, firebaseConfigRevision, applyRemote, runPostHydrationMidnightAndDecayCheck, onToast]);

  // Persist & broadcast state whenever state changes (saveAppState automatically blocks push before hydration or on echo)
  useEffect(() => {
    saveAppState(state, true);
  }, [state]);

  // Flush to localStorage on tab close
  useEffect(() => {
    const flushLocal = () => {
      saveAppState(stateRef.current, false);
    };
    window.addEventListener('beforeunload', flushLocal);
    return () => {
      window.removeEventListener('beforeunload', flushLocal);
    };
  }, []);

  return {
    state,
    setState,
    stateRef,
    isSynced,
    applyRemote
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<KidOrParentTab>('quests');
  const [isParentMode, setIsParentMode] = useState<boolean>(false);
  const [showParentGate, setShowParentGate] = useState<boolean>(false);
  const [showBadges, setShowBadges] = useState<boolean>(false);
  const [showSync, setShowSync] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [firebaseConfigRevision, setFirebaseConfigRevision] = useState<number>(0);
  const [realtimeToast, setRealtimeToast] = useState<string | null>(null);
  const [levelUpCelebration, setLevelUpCelebration] = useState<LevelUpCelebrationData | null>(null);

  const showTimedToast = useCallback((msg: string) => {
    setRealtimeToast(msg);
    setTimeout(() => setRealtimeToast(null), 3200);
  }, []);

  const {
    state: appState,
    setState: setAppState,
    stateRef: latestStateRef,
    isSynced,
    applyRemote
  } = useFamilySync(firebaseConfigRevision, showTimedToast);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save changes to storage & immediately sync via saveAppState(stamped, true)
  const updateState = useCallback(
    (updater: (prev: AppState) => AppState) => {
      if (!isSynced) return;
      setAppState((prev) => {
        const next = updater(prev);
        const now = Math.max(Date.now(), getStateTimestamp(prev) + 1);
        const stamped: AppState = {
          ...next,
          lastSyncTimestamp: now,
          lastUpdatedAt: now
        };
        latestStateRef.current = stamped;
        return stamped;
      });
    },
    [isSynced, setAppState, latestStateRef]
  );

  // Helper: Compute real-world action pet care boosts from completing a task
  const getTaskRealWorldPetCareBoosts = useCallback((task: Task) => {
    // 1. No bụng: Mỗi khi bé hoàn thành 1 nhiệm vụ buổi sáng/trưa/tối, thú cưng được cộng 20% no bụng
    const isMealTimeRoutine =
      task.category === 'morning' || task.category === 'afternoon' || task.category === 'evening';
    const hungerBoost = isMealTimeRoutine ? 20 : 10;

    // 2. Độ vui vẻ: Hoàn thành nhiệm vụ Học tập/Đọc sách sẽ tăng vui vẻ (+20%)
    const isStudyOrReading =
      task.habitGroup === 'study' ||
      task.tag === 'study' ||
      /học|đọc sách|bài tập|từ vựng|read|study|homework|book/i.test(`${task.title} ${task.titleEn}`);
    const happinessBoost = isStudyOrReading ? 20 : 5;

    // 3. Năng lượng: Đi ngủ đúng giờ vào buổi tối giúp thú cưng hồi phục 100% năng lượng
    const isSleepOnTime =
      task.id === 'e4' ||
      /ngủ đúng giờ|đi ngủ|ngủ ngon|sleep|bedtime/i.test(`${task.title} ${task.titleEn}`);

    return {
      hungerBoost,
      happinessBoost,
      isStudyOrReading,
      isSleepOnTime,
      energyBoost: isSleepOnTime ? 100 : 8
    };
  }, []);

  // Advance Magic Egg hatching & EXP-based Pet Level evolution progress
  const advancePetEggProgress = useCallback(
    (
      pet: VirtualPet,
      expAdded: number,
      happinessBoost: number = 0,
      energyBoost: number = 0,
      hungerBoost: number = 0,
      restoreFullEnergy: boolean = false
    ): { nextPet: VirtualPet; justHatched: boolean; evolvedToStage: number | null } => {
      const safeExpAdded = Math.max(0, Math.round(expAdded));
      const currentExp = Math.max(0, Number(pet.exp ?? pet.evolutionStars ?? pet.eggStars ?? 0));
      const nextExp = currentExp + safeExpAdded;
      const nextEggProgress = Math.min(EGG_HATCH_TARGET_STARS, nextExp);
      const wasHatched = Boolean(pet.isHatched) || currentExp >= EGG_HATCH_TARGET_STARS;
      const willHatchNow = !wasHatched && nextExp >= EGG_HATCH_TARGET_STARS;

      const prevInfo = getPetEvolutionInfo(currentExp, wasHatched);
      const nextInfo = getPetEvolutionInfo(nextExp, wasHatched || willHatchNow);
      const evolvedToStage = nextInfo.stage > prevInfo.stage ? nextInfo.stage : null;

      let chosenSpecies = pet.species;
      let chosenName = pet.name;
      let chosenAvatar = pet.avatar;

      if (willHatchNow) {
        if (!pet.hasChosenSpecies) {
          const randomIndex = Math.floor(Math.random() * PET_SPECIES_LIST.length);
          const randomMeta = PET_SPECIES_LIST[randomIndex] || PET_SPECIES_LIST[0];
          chosenSpecies = randomMeta.species;
          chosenName = randomMeta.nameVi;
          chosenAvatar = randomMeta.avatar;
        } else {
          const meta = getPetSpeciesMeta(pet.species);
          chosenSpecies = meta.species;
          chosenName = pet.name || meta.nameVi;
          chosenAvatar = pet.avatar || meta.avatar;
        }
      }

      // Auto-unlock and auto-equip milestone level gifts as Pet Level (EXP) increases
      const unlockedSet = new Set<PetAccessoryId>(pet.unlockedAccessories || []);
      const equippedSet = new Set<PetAccessoryId>(pet.equippedAccessories || []);
      const prevGifts = new Set<PetAccessoryId>(getAutoUnlockedAccessoriesForLevel(prevInfo.level));
      const nextGifts = getAutoUnlockedAccessoriesForLevel(nextInfo.level);

      for (const giftId of nextGifts) {
        const wasUnlocked = unlockedSet.has(giftId);
        unlockedSet.add(giftId);
        if (!wasUnlocked || !prevGifts.has(giftId) || equippedSet.size === 0) {
          equippedSet.add(giftId);
        }
      }

      return {
        justHatched: willHatchNow,
        evolvedToStage,
        nextPet: {
          ...pet,
          species: chosenSpecies,
          name: chosenName,
          avatar: chosenAvatar,
          level: nextInfo.level,
          exp: nextExp,
          eggStars: willHatchNow || wasHatched ? EGG_HATCH_TARGET_STARS : nextEggProgress,
          evolutionStars: nextExp,
          isHatched: wasHatched || willHatchNow,
          unlockedAccessories: Array.from(unlockedSet),
          equippedAccessories: Array.from(equippedSet),
          happiness: Math.min(100, pet.happiness + (willHatchNow ? Math.max(20, happinessBoost) : happinessBoost)),
          energy: restoreFullEnergy
            ? 100
            : Math.min(100, pet.energy + (willHatchNow ? Math.max(20, energyBoost) : energyBoost)),
          hunger: Math.min(100, pet.hunger + (willHatchNow ? Math.max(20, hungerBoost) : hungerBoost))
        }
      };
    },
    []
  );

  // Check Badge Unlocks
  const checkBadges = (state: AppState): AppState => {
    const updatedBadges = state.badges.map((b) => {
      let current = b.currentCount;
      let unlocked = b.unlocked;

      if (b.id === 'b_star100') {
        current = state.profile.totalStarsEarned;
        if (current >= b.requiredCount && !unlocked) {
          unlocked = true;
        }
      } else if (b.id === 'b_streak7') {
        current = state.profile.streakDays;
        if (current >= b.requiredCount && !unlocked) {
          unlocked = true;
        }
      } else if (b.id === 'b_scholar') {
        const studyDone = state.tasks.filter((t) => t.habitGroup === 'study' && t.isCompleted).length;
        current = Math.max(b.currentCount, studyDone);
        if (current >= b.requiredCount && !unlocked) {
          unlocked = true;
        }
      } else if (b.id === 'b_helper') {
        const helpDone = state.tasks.filter((t) => t.habitGroup === 'family_help' && t.isCompleted).length;
        current = Math.max(b.currentCount, helpDone);
        if (current >= b.requiredCount && !unlocked) {
          unlocked = true;
        }
      }

      return {
        ...b,
        currentCount: current,
        unlocked,
        unlockedAt: unlocked && !b.unlockedAt ? new Date().toISOString().split('T')[0] : b.unlockedAt
      };
    });

    return {
      ...state,
      badges: updatedBadges
    };
  };

  // Trigger Canvas-based Confetti Explosion for positive reinforcement
  const triggerConfettiExplosion = useCallback(() => {
    // Stage 1: Celebratory Center Burst
    confetti({
      particleCount: 75,
      spread: 75,
      origin: { y: 0.62 },
      colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6', '#fbbf24', '#f43f5e'],
      ticks: 260,
      gravity: 1.15,
      scalar: 1.1,
      zIndex: 9999
    });

    // Stage 2: Left celebratory cannon blast
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0.05, y: 0.75 },
        colors: ['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#a855f7'],
        ticks: 230,
        gravity: 1.05,
        zIndex: 9999
      });
    }, 130);

    // Stage 3: Right celebratory cannon blast
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 0.95, y: 0.75 },
        colors: ['#10b981', '#06b6d4', '#6366f1', '#fde047', '#34d399'],
        ticks: 230,
        gravity: 1.05,
        zIndex: 9999
      });
    }, 260);
  }, []);

  // Kid/Parent Task Toggle -> Immediately toggles task completion and adds/subtracts stars in BOTH Cumulative Vault (stars) and Today's Stars (dailyStarsEarned), plus +5 EXP & +15đ coins
  const handleToggleTask = (taskId: string) => {
    updateState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const starReward = Math.max(1, Math.round(Number(task.stars) || 1));
      const xpReward = Number(task.xp) || PET_RULES.TASK_EXP_REWARD;
      const nowTime = new Date().toLocaleTimeString(prev.language === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Unchecking a completed task -> subtract stars from BOTH stars and dailyStarsEarned (not below 0)
      if (task.isCompleted) {
        const updatedTasks = prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                isCompleted: false,
                pendingApproval: false,
                completedAt: undefined,
                requestedAt: undefined
              }
            : t
        );

        const nextStars = Math.max(0, prev.profile.stars - starReward);
        const nextDailyStars = Math.max(0, (prev.profile.dailyStarsEarned ?? 0) - starReward);
        const currentPetExp = Math.max(
          0,
          Number(prev.profile.currentXp) || 0,
          Number(prev.profile.pet.exp ?? prev.profile.pet.evolutionStars ?? 0)
        );
        const nextExp = Math.max(0, currentPetExp - xpReward);
        const nextCoins = Math.max(0, Number(prev.profile.pet.coins ?? 760) - PET_RULES.TASK_COIN_REWARD);
        const levelInfo = getPetEvolutionInfo(nextExp, prev.profile.pet.isHatched);

        setRealtimeToast(
          prev.language === 'vi'
            ? `↩️ Đã bỏ chọn "${task.title}" (-${starReward} ⭐ • Kho sao: ${nextStars} ⭐ • Sao hôm nay: +${nextDailyStars} ⭐)`
            : `↩️ Unchecked "${task.titleEn}" (-${starReward} ⭐ • Vault: ${nextStars} ⭐ • Today: +${nextDailyStars} ⭐)`
        );
        setTimeout(() => setRealtimeToast(null), 3500);

        return {
          ...prev,
          tasks: updatedTasks,
          profile: {
            ...prev.profile,
            stars: nextStars,
            dailyStarsEarned: nextDailyStars,
            totalStarsEarned: nextStars,
            level: levelInfo.level,
            currentXp: nextExp,
            maxXp: levelInfo.nextThreshold,
            pet: {
              ...prev.profile.pet,
              level: levelInfo.level,
              exp: nextExp,
              evolutionStars: nextExp,
              coins: nextCoins
            }
          }
        };
      }

      // Checking an incomplete task -> mark completed immediately & add stars to BOTH stars and dailyStarsEarned
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isCompleted: true,
              pendingApproval: false,
              completedAt: nowTime,
              requestedAt: undefined
            }
          : t
      );

      const petResult = processRealWorldTaskCompletionForPet(
        prev.profile.pet,
        task,
        updatedTasks,
        xpReward
      );

      const nextStars = prev.profile.stars + starReward;
      const nextDailyStars = (prev.profile.dailyStarsEarned ?? 0) + starReward;
      const nextExp = petResult.nextPet.exp ?? (prev.profile.currentXp + xpReward);
      const levelInfo = getPetEvolutionInfo(nextExp, petResult.nextPet.isHatched);

      setRealtimeToast(
        prev.language === 'vi'
          ? `🌟 Hoàn thành "${task.title}"! +${starReward} ⭐ (Kho sao: ${nextStars} ⭐ • Sao hôm nay: +${nextDailyStars} ⭐) • ${petResult.feedbackVi}`
          : `🌟 Completed "${task.titleEn}"! +${starReward} ⭐ (Vault: ${nextStars} ⭐ • Today: +${nextDailyStars} ⭐)`
      );
      setTimeout(() => setRealtimeToast(null), 4200);

      return {
        ...prev,
        tasks: updatedTasks,
        profile: {
          ...prev.profile,
          stars: nextStars,
          dailyStarsEarned: nextDailyStars,
          totalStarsEarned: Math.max(prev.profile.totalStarsEarned, nextStars),
          level: levelInfo.level,
          currentXp: nextExp,
          maxXp: levelInfo.nextThreshold,
          pet: petResult.nextPet
        }
      };
    });
  };

  // Parent Approval of a Single Task (Awards stars, XP, and updates Pet Hunger +30%/+30%/+40%, Study/Sport Happiness +25-30%, Sleep 100% Energy, and 3-Day >=80% Egg Streak)
  const handleApproveTask = (taskId: string) => {
    let approvedNow = false;
    let eggHatchedNow = false;

    updateState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || task.isCompleted) return prev;

      approvedNow = true;
      const starReward = Math.max(1, Math.round(Number(task.stars) || 1));
      const xpReward = Number(task.xp) || PET_RULES.TASK_EXP_REWARD;
      const nowTime = new Date().toLocaleTimeString(prev.language === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              stars: starReward,
              isCompleted: true,
              pendingApproval: false,
              completedAt: nowTime
            }
          : t
      );

      const petResult = processRealWorldTaskCompletionForPet(
        {
          ...prev.profile.pet,
          exp: Math.max(0, Number(prev.profile.currentXp) || 0, Number(prev.profile.pet.exp) || 0),
          evolutionStars: Math.max(0, Number(prev.profile.currentXp) || 0, Number(prev.profile.pet.exp) || 0)
        },
        task,
        updatedTasks,
        starReward,
        xpReward
      );
      const nextPet = petResult.nextPet;
      const unifiedNextExp = Math.max(0, Number(nextPet.exp) || 0);
      const nextEvoInfo = getPetEvolutionInfo(unifiedNextExp, true);
      const previousLevel = Math.max(1, Number(prev.profile.pet.level || prev.profile.level) || 1);
      const nextLevel = nextEvoInfo.level;
      const nextMaxXp = nextEvoInfo.nextThreshold;
      const leveledUpNow = nextLevel > previousLevel;

      eggHatchedNow = petResult.justHatched || Boolean(petResult.evolvedToStage) || leveledUpNow;

      if (leveledUpNow) {
        setLevelUpCelebration({
          previousLevel,
          newLevel: nextLevel,
          childName: prev.profile.name,
          childAvatar: prev.profile.avatar,
          currentXp: unifiedNextExp,
          maxXp: nextMaxXp,
          petName: nextPet.name,
          petAvatar: nextPet.avatar || prev.profile.avatar
        });
      }

      if (petResult.justHatched) {
        playEggCrackAndHatchSound(prev.settings.soundEnabled);
      } else if (petResult.evolvedToStage || leveledUpNow) {
        playLevelUp(prev.settings.soundEnabled);
      } else {
        playSuccessChime(prev.settings.soundEnabled);
      }

      setRealtimeToast(prev.language === 'vi' ? petResult.feedbackVi : petResult.feedbackEn);
      setTimeout(() => setRealtimeToast(null), 4500);

      if (prev.settings.voiceEnabled && !leveledUpNow) {
        speakText(
          petResult.justHatched
            ? prev.language === 'vi'
              ? `Oa! Chúc mừng bé ${prev.profile.name}! Trứng Ma Thuật đã nở ra bạn ${nextPet.name} rồi!`
              : `Hooray! Magic Egg hatched into ${nextPet.name}!`
            : petResult.evolvedToStage
              ? prev.language === 'vi'
                ? `Tuyệt đỉnh! Linh thú ${nextPet.name} đã tiến hóa lên Cấp ${petResult.evolvedToStage}!`
                : `Amazing! ${nextPet.name} evolved to Stage ${petResult.evolvedToStage}!`
              : prev.language === 'vi'
                ? `Ba mẹ đã duyệt nhiệm vụ ${task.title}! ${petResult.feedbackVi}`
                : `Parents approved ${task.titleEn}! ${petResult.feedbackEn}`,
          prev.language,
          prev.settings.voiceEnabled
        );
      }

      const nextStars = prev.profile.stars + starReward;
      const updatedState: AppState = {
        ...prev,
        tasks: updatedTasks,
        profile: {
          ...prev.profile,
          stars: nextStars,
          dailyStarsEarned: (prev.profile.dailyStarsEarned ?? 0) + starReward,
          totalStarsEarned: nextStars,
          currentXp: unifiedNextExp,
          maxXp: nextMaxXp,
          level: nextLevel,
          pet: {
            ...nextPet,
            level: nextLevel,
            exp: unifiedNextExp,
            evolutionStars: unifiedNextExp
          }
        }
      };

      return checkBadges(updatedState);
    });

    if (approvedNow || eggHatchedNow) {
      triggerConfettiExplosion();
    }
  };

  // Parent Approval of All Pending Tasks at once
  const handleApproveAllTasks = () => {
    let anyApproved = false;
    let eggHatchedNow = false;

    updateState((prev) => {
      const pendingList = prev.tasks.filter((t) => t.pendingApproval && !t.isCompleted);
      const pendingChallenges = prev.challenges.filter((c) => c.pendingApproval && !c.isCompletedToday);
      if (pendingList.length === 0 && pendingChallenges.length === 0) return prev;

      anyApproved = true;
      const nowTime = new Date().toLocaleTimeString(prev.language === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const taskStarsAdded = pendingList.reduce(
        (sum, t) => sum + Math.max(1, Math.round(Number(t.stars) || 1)),
        0
      );
      const challengeStarsAdded = pendingChallenges.reduce(
        (sum, c) => sum + Math.max(1, Math.round(Number(c.stars) || 1)),
        0
      );
      const totalStarsAdded = taskStarsAdded + challengeStarsAdded;

      const taskXpAdded = pendingList.reduce((sum, t) => sum + (Number(t.xp) || PET_RULES.TASK_EXP_REWARD), 0);
      const challengeXpAdded = pendingChallenges.reduce((sum, c) => sum + (Number(c.xp) || 30), 0);
      const totalXpAdded = taskXpAdded + challengeXpAdded;
      const taskCoinsAdded = pendingList.length * PET_RULES.TASK_COIN_REWARD;

      let totalHappinessBoost = pendingChallenges.length * 20;
      let totalEnergyBoost = pendingChallenges.length * 15;
      let totalHungerBoost = pendingChallenges.length * 15;
      let anySleepOnTime = false;

      pendingList.forEach((t) => {
        const b = getTaskRealWorldPetCareBoosts(t);
        totalHappinessBoost += b.happinessBoost;
        totalEnergyBoost += b.energyBoost;
        totalHungerBoost += b.hungerBoost;
        if (b.isSleepOnTime) anySleepOnTime = true;
      });

      const updatedTasks = prev.tasks.map((t) =>
        t.pendingApproval && !t.isCompleted
          ? {
              ...t,
              stars: Math.max(1, Math.round(Number(t.stars) || 1)),
              isCompleted: true,
              pendingApproval: false,
              completedAt: nowTime
            }
          : t
      );

      const updatedChallenges = prev.challenges.map((c) =>
        c.pendingApproval && !c.isCompletedToday
          ? {
              ...c,
              isCompletedToday: true,
              pendingApproval: false,
              completedAt: nowTime
            }
          : c
      );

      const baseUnifiedExp = Math.max(
        0,
        Number(prev.profile.currentXp) || 0,
        Number(prev.profile.pet.exp ?? prev.profile.pet.evolutionStars ?? 0)
      );
      const previousLevel = Math.max(1, Number(prev.profile.pet.level || prev.profile.level) || 1);

      const { nextPet, justHatched, evolvedToStage } = advancePetEggProgress(
        {
          ...prev.profile.pet,
          exp: baseUnifiedExp,
          evolutionStars: baseUnifiedExp
        },
        totalXpAdded,
        totalHappinessBoost,
        totalEnergyBoost,
        totalHungerBoost,
        anySleepOnTime
      );

      const unifiedNextExp = Math.max(0, Number(nextPet.exp) || 0);
      const nextEvoInfo = getPetEvolutionInfo(unifiedNextExp, true);
      const nextLevel = nextEvoInfo.level;
      const nextMaxXp = nextEvoInfo.nextThreshold;
      const leveledUpNow = nextLevel > previousLevel;

      eggHatchedNow = justHatched || Boolean(evolvedToStage) || leveledUpNow;

      if (leveledUpNow) {
        setLevelUpCelebration({
          previousLevel,
          newLevel: nextLevel,
          childName: prev.profile.name,
          childAvatar: prev.profile.avatar,
          currentXp: unifiedNextExp,
          maxXp: nextMaxXp,
          petName: nextPet.name,
          petAvatar: nextPet.avatar || prev.profile.avatar
        });
      }

      if (justHatched) {
        playEggCrackAndHatchSound(prev.settings.soundEnabled);
      } else if (evolvedToStage || leveledUpNow) {
        playLevelUp(prev.settings.soundEnabled);
      } else {
        playSuccessChime(prev.settings.soundEnabled);
      }

      const totalApprovedCount = pendingList.length + pendingChallenges.length;
      if (prev.settings.voiceEnabled && !leveledUpNow) {
        speakText(
          justHatched
            ? prev.language === 'vi'
              ? `Tuyệt vời! Quả Trứng Ma Thuật đã nở ra bạn ${nextPet.name} rồi!`
              : `Awesome! Magic Egg hatched into ${nextPet.name}!`
            : prev.language === 'vi'
              ? `Ba mẹ đã duyệt toàn bộ ${totalApprovedCount} mục! Bé ${prev.profile.name} nhận thêm ${totalStarsAdded} ngôi sao tích lũy và +${totalXpAdded} EXP nuôi linh thú!`
              : `Parents approved all ${totalApprovedCount} items! Earned ${totalStarsAdded} stars!`,
          prev.language,
          prev.settings.voiceEnabled
        );
      }

      const nextCoins = Math.max(0, Number(prev.profile.pet.coins ?? 760)) + taskCoinsAdded;
      const nextStars = prev.profile.stars + totalStarsAdded;
      const updatedState: AppState = {
        ...prev,
        tasks: updatedTasks,
        challenges: updatedChallenges,
        profile: {
          ...prev.profile,
          stars: nextStars,
          dailyStarsEarned: (prev.profile.dailyStarsEarned ?? 0) + totalStarsAdded,
          totalStarsEarned: nextStars,
          currentXp: unifiedNextExp,
          maxXp: nextMaxXp,
          level: nextLevel,
          pet: {
            ...nextPet,
            coins: nextCoins,
            level: nextLevel,
            exp: unifiedNextExp,
            evolutionStars: unifiedNextExp
          }
        }
      };

      return checkBadges(updatedState);
    });

    if (anyApproved || eggHatchedNow) {
      triggerConfettiExplosion();
    }
  };

  // Parent Rejects a Pending Task (Ask child to redo) or Revokes an Approved Task
  const handleRejectTask = (taskId: string) => {
    updateState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const wasCompleted = task.isCompleted;
      const starDeduct = wasCompleted ? Math.max(1, Math.round(Number(task.stars) || 1)) : 0;
      const xpDeduct = wasCompleted ? Number(task.xp) || PET_RULES.TASK_EXP_REWARD : 0;
      const coinDeduct = wasCompleted ? PET_RULES.TASK_COIN_REWARD : 0;

      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isCompleted: false,
              pendingApproval: false,
              requestedAt: undefined,
              completedAt: undefined
            }
          : t
      );

      const nextStars = Math.max(0, prev.profile.stars - starDeduct);
      const nextExp = Math.max(0, prev.profile.currentXp - xpDeduct);
      const nextCoins = Math.max(0, Number(prev.profile.pet.coins ?? 760) - coinDeduct);
      const nextEvoInfo = getPetEvolutionInfo(nextExp, true);

      return {
        ...prev,
        lastStarSpendTimestamp: starDeduct > 0 ? Date.now() : prev.lastStarSpendTimestamp,
        tasks: updatedTasks,
        profile: {
          ...prev.profile,
          stars: nextStars,
          dailyStarsEarned: Math.max(0, (prev.profile.dailyStarsEarned ?? 0) - starDeduct),
          totalStarsEarned: nextStars,
          currentXp: nextExp,
          maxXp: nextEvoInfo.nextThreshold,
          level: nextEvoInfo.level,
          pet: {
            ...prev.profile.pet,
            coins: nextCoins,
            level: nextEvoInfo.level,
            exp: nextExp,
            evolutionStars: nextExp
          }
        }
      };
    });
  };

  // Mua đồ ăn Hạt VIP cho Hamster (Dùng 20đ từ ví tiền xu nuôi thú -> +20% No bụng, +10% Vui vẻ; áp dụng Trần chỉ số theo Nhiệm vụ)
  const handleFeedPet = (): { allowed: boolean; messageVi: string; messageEn: string } => {
    const todayKey = appState.profile.lastActiveDate;
    const currentFeedCount =
      appState.profile.pet.lastFeedDate === todayKey
        ? Math.max(0, Number(appState.profile.pet.feedCountToday ?? 0))
        : 0;
    const currentCoins = Math.max(0, Math.round(Number(appState.profile.pet.coins ?? 760)));
    const statCap = getManualCareStatCap(appState.tasks, appState.profile.pet);

    if (currentFeedCount >= 12) {
      playPenaltySound(appState.settings.soundEnabled);
      const msgVi = `🌻 Hôm nay bé đã cho ${appState.profile.pet.name} ăn đủ 12/12 lần rồi! Bụng Hamster đã tròn xoe, hẹn bé ngày mai nhé!`;
      const msgEn = `🌻 You have already fed your pet 12 times today!`;
      setRealtimeToast(msgVi);
      setTimeout(() => setRealtimeToast(null), 4000);
      return { allowed: false, messageVi: msgVi, messageEn: msgEn };
    }

    if (currentCoins < 20) {
      playPenaltySound(appState.settings.soundEnabled);
      const msgVi = `🪙 Ví xu của bé cần 20đ để mua Hạt VIP (Hiện có ${currentCoins}đ). Mỗi nhiệm vụ hoàn thành được thưởng +15đ xu, bé hãy làm nhiệm vụ nhé!`;
      const msgEn = `🪙 You need 20 coins for VIP Seed (Current: ${currentCoins}đ). Complete quests to earn +15 coins each!`;
      setRealtimeToast(msgVi);
      setTimeout(() => setRealtimeToast(null), 4000);
      return { allowed: false, messageVi: msgVi, messageEn: msgEn };
    }

    if (
      appState.profile.pet.hunger >= statCap &&
      appState.profile.pet.happiness >= statCap &&
      appState.profile.pet.energy >= statCap
    ) {
      playPenaltySound(appState.settings.soundEnabled);
      const msgVi =
        statCap < 100
          ? `🔒 Cả 3 chỉ số đã đạt trần ${statCap}%! Con hãy hoàn thành ít nhất 4 nhiệm vụ hoặc mở Rương Thưởng Buổi để mở khóa giới hạn lên 100% và nhận Cúp Vàng Chăm Hamster 100% (+20 EXP) nhé!`
          : `🏆 Cả 3 chỉ số của Hamster đều đã đạt tối đa 100% rồi!`;
      const msgEn =
        statCap < 100
          ? `🔒 Stats capped at ${statCap}%! Complete at least 4 quests or unlock a Session Chest to reach 100%!`
          : `🏆 All 3 stats are already at 100%!`;
      setRealtimeToast(msgVi);
      setTimeout(() => setRealtimeToast(null), 4500);
      return { allowed: false, messageVi: msgVi, messageEn: msgEn };
    }

    playFeedCrunchSound(appState.settings.soundEnabled);
    const nextCoins = Math.max(0, currentCoins - 20);
    const capNote =
      statCap < 100
        ? ` (Trần hiện tại: ${statCap}% - Làm 4 việc/mở Rương Buổi để lên 100%)`
        : '';
    const msgVi = `🌻 Đã thưởng Hạt VIP (-20đ, còn ${nextCoins}đ)! Hamster được +20% No bụng & +10% Vui vẻ${capNote}!`;
    const msgEn = `🌻 Fed VIP Seed (-20đ, ${nextCoins}đ left)! Hamster gained +20% Fullness & +10% Happiness!`;
    setRealtimeToast(msgVi);
    setTimeout(() => setRealtimeToast(null), 4000);

    updateState((prev) => {
      const nextFeedCount = currentFeedCount + 1;
      const prevCap = getManualCareStatCap(prev.tasks, prev.profile.pet);
      const nextHunger = Math.min(prevCap, Math.max(0, (prev.profile.pet.hunger || 0) + 20));
      const nextHappiness = Math.min(prevCap, Math.max(0, (prev.profile.pet.happiness || 0) + 10));
      const nextEnergy = Math.min(prevCap, Math.max(0, (prev.profile.pet.energy || 0) + 5));

      const draftPet: VirtualPet = {
        ...prev.profile.pet,
        coins: Math.max(0, Math.round(Number(prev.profile.pet.coins ?? 760)) - 20),
        hunger: nextHunger,
        happiness: nextHappiness,
        energy: nextEnergy,
        lastFeedDate: todayKey,
        feedCountToday: nextFeedCount,
        moodState: 'excited',
        lastSpecialTreatAt: Date.now()
      };

      const { updatedPet, reached100BonusNow } = evaluatePetHatchAndEvolution(
        draftPet,
        0,
        todayKey
      );
      const bonusExp = reached100BonusNow ? PET_RULES.DAILY_GOAL_100_BONUS_EXP : 0;
      const nextExp = Math.max(
        0,
        Number(prev.profile.currentXp) + bonusExp,
        Number(updatedPet.exp) || 0
      );
      const nextEvoInfo = getPetEvolutionInfo(nextExp, true);

      if (reached100BonusNow) {
        triggerConfettiExplosion();
        setRealtimeToast(
          prev.language === 'vi'
            ? `🏆 Chúc mừng ${prev.profile.name} nhận Cúp Vàng Chăm Hamster 100% (+${PET_RULES.DAILY_GOAL_100_BONUS_EXP} EXP)!`
            : `🏆 100% Gold Cup unlocked (+${PET_RULES.DAILY_GOAL_100_BONUS_EXP} EXP)!`
        );
      }

      return {
        ...prev,
        profile: {
          ...prev.profile,
          currentXp: nextExp,
          maxXp: nextEvoInfo.nextThreshold,
          level: nextEvoInfo.level,
          pet: {
            ...updatedPet,
            level: nextEvoInfo.level,
            exp: nextExp,
            evolutionStars: nextExp
          }
        }
      };
    });

    return { allowed: true, messageVi: msgVi, messageEn: msgEn };
  };

  // Nút "Xoa đầu" (Tối đa 30 lần/ngày: +2% Vui vẻ & +5 EXP cho bé để nuôi Level linh thú, áp dụng Trần chỉ số theo Nhiệm vụ)
  const handlePetPet = (): { allowed: boolean; messageVi: string; messageEn: string } => {
    const statCap = getManualCareStatCap(appState.tasks, appState.profile.pet);
    const result = handleDailyHeadPat(appState.profile.pet, appState.profile.lastActiveDate, statCap);

    if (!result.allowed) {
      playPenaltySound(appState.settings.soundEnabled);
      setRealtimeToast(appState.language === 'vi' ? result.messageVi : result.messageEn);
      setTimeout(() => setRealtimeToast(null), 4500);
      if (appState.settings.voiceEnabled) {
        speakText(
          appState.language === 'vi' ? result.messageVi : result.messageEn,
          appState.language,
          appState.settings.voiceEnabled
        );
      }
      return { allowed: false, messageVi: result.messageVi, messageEn: result.messageEn };
    }

    if (result.evolvedToStage) {
      playLevelUp(appState.settings.soundEnabled);
      triggerConfettiExplosion();
    } else {
      playPetPurrBeepSound(appState.settings.soundEnabled);
    }

    setRealtimeToast(appState.language === 'vi' ? result.messageVi : result.messageEn);
    setTimeout(() => setRealtimeToast(null), 4500);

    if (appState.settings.voiceEnabled) {
      speakText(
        appState.language === 'vi' ? result.messageVi : result.messageEn,
        appState.language,
        appState.settings.voiceEnabled
      );
    }

    updateState((prev) => {
      const nextExp = Math.max(
        0,
        Number(prev.profile.currentXp) + (result.expAdded || 0),
        Number(result.nextPet.exp) || 0
      );
      const nextEvoInfo = getPetEvolutionInfo(nextExp, true);
      const prevLevel = Math.max(1, Number(prev.profile.pet.level || prev.profile.level) || 1);

      if (nextEvoInfo.level > prevLevel) {
        setLevelUpCelebration({
          previousLevel: prevLevel,
          newLevel: nextEvoInfo.level,
          childName: prev.profile.name,
          childAvatar: prev.profile.avatar,
          currentXp: nextExp,
          maxXp: nextEvoInfo.nextThreshold,
          petName: result.nextPet.name,
          petAvatar: result.nextPet.avatar || prev.profile.avatar
        });
      }

      return {
        ...prev,
        profile: {
          ...prev.profile,
          currentXp: nextExp,
          maxXp: nextEvoInfo.nextThreshold,
          level: nextEvoInfo.level,
          pet: {
            ...result.nextPet,
            level: nextEvoInfo.level,
            exp: nextExp,
            evolutionStars: nextExp
          }
        }
      };
    });

    return { allowed: true, messageVi: result.messageVi, messageEn: result.messageEn };
  };

  // Switch Pet Companion Species (saved to localStorage)
  const handleChangePetSpecies = (species: PetSpecies, name: string, avatar: string) => {
    updateState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        pet: {
          ...prev.profile.pet,
          species,
          name,
          avatar,
          hasChosenSpecies: true
        }
      }
    }));
  };

  // Add EXP directly into Magic Egg / Evolution progress
  const handleAddEggStars = (amount: number) => {
    let hatchedOrEvolved = false;
    updateState((prev) => {
      const { nextPet, justHatched, evolvedToStage } = advancePetEggProgress(prev.profile.pet, amount, 10, 10, 10);
      const unifiedNextExp = Math.max(0, Number(nextPet.exp) || 0);
      const nextEvoInfo = getPetEvolutionInfo(unifiedNextExp, true);
      hatchedOrEvolved = justHatched || Boolean(evolvedToStage);
      if (evolvedToStage) {
        playLevelUp(prev.settings.soundEnabled);
      }
      return {
        ...prev,
        profile: {
          ...prev.profile,
          currentXp: unifiedNextExp,
          maxXp: nextEvoInfo.nextThreshold,
          level: nextEvoInfo.level,
          pet: nextPet
        }
      };
    });

    if (hatchedOrEvolved) {
      triggerConfettiExplosion();
    }
  };

  // Set exact Evolution EXP (for testing / switching Level 1 -> Level 20)
  const handleSetEvolutionStars = (targetExp: number) => {
    let celebrated = false;
    updateState((prev) => {
      const safeExp = Math.max(0, Math.round(targetExp));
      const isHatched = safeExp >= EGG_HATCH_TARGET_STARS;
      const nextEggStars = Math.min(EGG_HATCH_TARGET_STARS, safeExp);
      const nextInfo = getPetEvolutionInfo(safeExp, isHatched);

      const unlockedSet = new Set<PetAccessoryId>(prev.profile.pet.unlockedAccessories || []);
      const equippedSet = new Set<PetAccessoryId>(prev.profile.pet.equippedAccessories || []);
      for (const giftId of getAutoUnlockedAccessoriesForLevel(nextInfo.level)) {
        unlockedSet.add(giftId);
        equippedSet.add(giftId);
      }

      if (safeExp >= (prev.profile.pet.exp ?? prev.profile.pet.evolutionStars ?? 0) && safeExp >= EGG_HATCH_TARGET_STARS) {
        celebrated = true;
      }

      return {
        ...prev,
        profile: {
          ...prev.profile,
          currentXp: safeExp,
          maxXp: nextInfo.nextThreshold,
          level: nextInfo.level,
          pet: {
            ...prev.profile.pet,
            isHatched,
            exp: safeExp,
            eggStars: nextEggStars,
            evolutionStars: safeExp,
            level: nextInfo.level,
            unlockedAccessories: Array.from(unlockedSet),
            equippedAccessories: Array.from(equippedSet)
          }
        }
      };
    });

    if (celebrated) {
      playLevelUp(appState.settings.soundEnabled);
      triggerConfettiExplosion();
    }
  };

  // Switch Room Theme (Phòng Gỗ Ấm Áp / Phòng Bác Học Xanh Dương / Phòng Cầu Vồng at Lv.4+)
  const handleChangeRoomTheme = (theme: PetRoomTheme) => {
    updateState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        pet: {
          ...prev.profile.pet,
          roomTheme: theme
        }
      }
    }));
  };

  // Buy or Toggle Pet Room / Wearable Accessory (Group 1: Free Level Gifts, Group 2: Star Shop Items 5..40 Stars — deducts Cumulative Stars)
  const handleBuyOrToggleAccessory = (
    accessoryId: PetAccessoryId
  ): { ok: boolean; purchasedNew?: boolean; messageVi: string; messageEn: string } => {
    const meta = PET_ROOM_ACCESSORIES.find((a) => a.id === accessoryId);
    if (!meta) {
      return { ok: false, messageVi: 'Không tìm thấy phụ kiện', messageEn: 'Accessory not found' };
    }

    const rawHeroName = appState.profile.name?.trim() || 'Cơ Minh';
    const heroName = rawHeroName.replace(/^(Hiệp\s+Sĩ\s+)+/i, '').trim() || 'Cơ Minh';
    const currentPet = appState.profile.pet;
    const currentPetExp = Math.max(
      0,
      Number(appState.profile.currentXp) || 0,
      Number(currentPet.exp ?? currentPet.evolutionStars ?? currentPet.eggStars ?? 0)
    );
    const currentEvolutionInfo = getPetEvolutionInfo(currentPetExp, currentPet.isHatched);
    const unlockedList = currentPet.unlockedAccessories || [];
    const equippedList =
      currentPet.equippedAccessories && currentPet.equippedAccessories.length > 0
        ? currentPet.equippedAccessories
        : (['food_bowl', 'water_fountain', 'cute_bow'] as PetAccessoryId[]);

    const isLevelGiftUnlocked =
      meta.unlockMethod === 'level' && currentEvolutionInfo.level >= meta.requiredLevel;
    const isAlreadyUnlocked = unlockedList.includes(accessoryId) || isLevelGiftUnlocked;

    if (!isAlreadyUnlocked && currentEvolutionInfo.level < meta.requiredLevel) {
      playPenaltySound(appState.settings.soundEnabled);
      return {
        ok: false,
        messageVi:
          meta.unlockMethod === 'level'
            ? `🔒 ${meta.nameVi} là quà tặng tự động miễn phí khi bé đạt ${meta.requiredExp} EXP (Hamster Lv.${meta.requiredLevel}/30). Hiện tại bé đang có ${currentPetExp} EXP (Lv.${currentEvolutionInfo.level}/30)!`
            : `🔒 ${meta.nameVi} yêu cầu Hamster đạt Cấp ${meta.requiredLevel}/30 (${meta.requiredExp} EXP) mới có thể mở khóa mua! Hiện tại bé đang ở Lv.${currentEvolutionInfo.level}/30 (${currentPetExp} EXP).`,
        messageEn: `🔒 ${meta.nameEn} requires Hamster Level ${meta.requiredLevel}/30 (${meta.requiredExp} EXP)!`
      };
    }

    if (isAlreadyUnlocked) {
      const willEquip = !equippedList.includes(accessoryId);
      const nextEquipped = willEquip
        ? [...equippedList, accessoryId]
        : equippedList.filter((id) => id !== accessoryId);

      updateState((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          pet: {
            ...prev.profile.pet,
            unlockedAccessories: Array.from(
              new Set([...(prev.profile.pet.unlockedAccessories || []), accessoryId])
            ),
            equippedAccessories: nextEquipped
          }
        }
      }));

      playSuccessChime(appState.settings.soundEnabled);
      return {
        ok: true,
        purchasedNew: false,
        messageVi: willEquip
          ? `✨ Đã bày ${meta.nameVi} vào Phòng Hamster Mũm Mĩm!`
          : `📦 Đã cất ${meta.nameVi} vào kho!`,
        messageEn: willEquip ? `Placed ${meta.nameEn} in room!` : `Stored ${meta.nameEn}!`
      };
    }

    // Group 2A: High-level Coin Shop Items (Lv.16 -> Lv.30 purchased with Pet Coins đ)
    const coinPrice = Math.max(0, Number(meta.costCoins) || 0);
    if (coinPrice > 0) {
      const currentCoins = Math.max(0, Math.round(Number(currentPet.coins ?? 760)));
      if (currentCoins < coinPrice) {
        const missingCoins = Math.max(1, coinPrice - currentCoins);
        playPenaltySound(appState.settings.soundEnabled);
        return {
          ok: false,
          purchasedNew: false,
          messageVi: `🪙 Ví xu hiện có ${currentCoins}đ, còn thiếu ${missingCoins}đ để mua ${meta.nameVi} (Giá ${coinPrice}đ). Hãy hoàn thành thêm nhiệm vụ (+15đ/việc) nhé!`,
          messageEn: `🪙 Need ${missingCoins}đ more coins to buy ${meta.nameEn} (${coinPrice}đ)!`
        };
      }

      const remainingCoins = Math.max(0, currentCoins - coinPrice);
      updateState((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          pet: {
            ...prev.profile.pet,
            coins: Math.max(0, Math.round(Number(prev.profile.pet.coins ?? 760)) - coinPrice),
            unlockedAccessories: Array.from(
              new Set([...(prev.profile.pet.unlockedAccessories || []), accessoryId])
            ),
            equippedAccessories: Array.from(
              new Set([
                ...(prev.profile.pet.equippedAccessories && prev.profile.pet.equippedAccessories.length > 0
                  ? prev.profile.pet.equippedAccessories
                  : (['food_bowl', 'water_fountain', 'cute_bow'] as PetAccessoryId[])),
                accessoryId
              ])
            ),
            happiness: Math.min(100, prev.profile.pet.happiness + meta.statBoostAmount),
            energy: Math.min(100, prev.profile.pet.energy + Math.round(meta.statBoostAmount / 2))
          }
        }
      }));

      playLevelUp(appState.settings.soundEnabled);
      triggerConfettiExplosion();
      return {
        ok: true,
        purchasedNew: true,
        messageVi: `🎉 Đã dùng ${coinPrice}đ xu mua thành công ${meta.nameVi} (còn ${remainingCoins}đ) & tự động bày vào Phòng Hamster!`,
        messageEn: `🎉 Purchased ${meta.nameEn} for ${coinPrice}đ coins (${remainingCoins}đ left)!`
      };
    }

    // Group 2B: Check Star Balance when child clicks to buy with Cumulative Stars
    if (appState.profile.stars < meta.costStars) {
      const missingStars = Math.max(1, meta.costStars - appState.profile.stars);
      playPenaltySound(appState.settings.soundEnabled);
      const encourageVi = `Cố lên Hiệp Sĩ ${heroName} nhé, con còn thiếu ${missingStars} Sao tích lũy nữa là đủ mua món này rồi!`;
      const encourageEn = `Keep going Hero ${heroName}, you only need ${missingStars} more Stars to buy ${meta.nameEn}!`;
      if (appState.settings.voiceEnabled) {
        speakText(
          appState.language === 'vi' ? encourageVi : encourageEn,
          appState.language,
          appState.settings.voiceEnabled
        );
      }
      return {
        ok: false,
        purchasedNew: false,
        messageVi: encourageVi,
        messageEn: encourageEn
      };
    }

    const remainingStars = Math.max(0, appState.profile.stars - meta.costStars);

    updateState((prev) => {
      const nextStars = Math.max(0, prev.profile.stars - meta.costStars);
      return {
        ...prev,
        lastStarSpendTimestamp: Date.now(),
        profile: {
          ...prev.profile,
          stars: nextStars,
          totalStarsEarned: nextStars,
          pet: {
            ...prev.profile.pet,
            unlockedAccessories: Array.from(
              new Set([...(prev.profile.pet.unlockedAccessories || []), accessoryId])
            ),
            equippedAccessories: Array.from(
              new Set([
                ...(prev.profile.pet.equippedAccessories && prev.profile.pet.equippedAccessories.length > 0
                  ? prev.profile.pet.equippedAccessories
                  : (['food_bowl', 'water_fountain', 'cute_bow'] as PetAccessoryId[])),
                accessoryId
              ])
            ),
            hunger:
              meta.statBoostType === 'hunger' || meta.statBoostType === 'all'
                ? Math.min(100, prev.profile.pet.hunger + meta.statBoostAmount)
                : prev.profile.pet.hunger,
            happiness:
              meta.statBoostType === 'happiness' || meta.statBoostType === 'appearance' || meta.statBoostType === 'all'
                ? Math.min(100, prev.profile.pet.happiness + meta.statBoostAmount)
                : prev.profile.pet.happiness,
            energy:
              meta.statBoostType === 'energy' || meta.statBoostType === 'all'
                ? Math.min(100, prev.profile.pet.energy + meta.statBoostAmount)
                : prev.profile.pet.energy
          }
        }
      };
    });

    playLevelUp(appState.settings.soundEnabled);
    triggerConfettiExplosion();
    if (appState.settings.voiceEnabled) {
      speakText(
        appState.language === 'vi'
          ? `Chúc mừng Hiệp Sĩ ${heroName}! Con đã dùng ${meta.costStars} sao tích lũy mua ${meta.nameVi} (còn ${remainingStars} sao) và bày vào Phòng Hamster Mũm Mĩm rồi!`
          : `Congratulations Hero ${heroName}! Unlocked ${meta.nameEn} (-${meta.costStars} stars) and placed it in the Hamster Room!`,
        appState.language,
        appState.settings.voiceEnabled
      );
    }

    return {
      ok: true,
      purchasedNew: true,
      messageVi: `🎁 Đã mua thành công ${meta.nameVi}! Đã trừ ${meta.costStars} ⭐ tích lũy (còn ${remainingStars} ⭐) & tự động bày vào Phòng Hamster!`,
      messageEn: `🎁 Purchased ${meta.nameEn} (-${meta.costStars} ⭐, ${remainingStars} ⭐ left)! Placed in Hamster Room!`
    };
  };

  // Chăm sóc Nhanh & Tương tác Đồ Vật trong Phòng Hamster:
  // - 4 nút Chăm Sóc Nhanh (Đĩa thức ăn, Bình nước, Chơi vòng quay, Tắm sạch): tốn 5đ/lần bấm từ ví xu -> tăng +10% chỉ số tương ứng.
  // - Nút Đi ngủ (cozy_bed): miễn phí (0đ), giới hạn 3 lần/ngày -> tăng +10% Năng lượng.
  // - Áp dụng "Trần chỉ số theo Nhiệm vụ": Nếu chưa làm đủ 4 nhiệm vụ và chưa mở Rương Buổi, chỉ số tối đa là 80%.
  //   Khi mở khóa trần 100% và cả 3 chỉ số đạt 100%, trao "Cúp Vàng Chăm Hamster 100% (+20 EXP)".
  const handleUseRoomAccessory = (
    accessoryId: PetAccessoryId
  ): { ok: boolean; messageVi: string; messageEn: string } => {
    const meta = PET_ROOM_ACCESSORIES.find((a) => a.id === accessoryId);
    if (!meta) {
      return { ok: false, messageVi: 'Không tìm thấy vật phẩm', messageEn: 'Item not found' };
    }

    const todayKey = appState.profile.lastActiveDate;
    const pet = appState.profile.pet;
    const currentCoins = Math.max(0, Math.round(Number(pet.coins ?? 760)));
    const statCap = getManualCareStatCap(appState.tasks, pet);

    // 1. Nút "Đi ngủ" (cozy_bed) -> Miễn phí (0đ), giới hạn 3 lần/ngày (+10% Năng lượng)
    if (accessoryId === 'cozy_bed') {
      const sleepCountToday =
        pet.lastSleepDate === todayKey ? Math.max(0, Number(pet.sleepCountToday ?? 0)) : 0;

      if (sleepCountToday >= PET_RULES.SLEEP_MAX_PER_DAY) {
        playPenaltySound(appState.settings.soundEnabled);
        const msgVi = `🛌 Hôm nay ${pet.name} đã Đi ngủ miễn phí đủ ${PET_RULES.SLEEP_MAX_PER_DAY}/${PET_RULES.SLEEP_MAX_PER_DAY} lần rồi! Con hãy dùng Bình nước (5đ) hoặc làm nhiệm vụ để nạp thêm Năng lượng nhé!`;
        const msgEn = `🛌 Free sleep already used ${PET_RULES.SLEEP_MAX_PER_DAY}/${PET_RULES.SLEEP_MAX_PER_DAY} times today!`;
        setRealtimeToast(appState.language === 'vi' ? msgVi : msgEn);
        setTimeout(() => setRealtimeToast(null), 4200);
        return { ok: false, messageVi: msgVi, messageEn: msgEn };
      }

      if (pet.energy >= statCap) {
        playPenaltySound(appState.settings.soundEnabled);
        const msgVi =
          statCap < 100
            ? `🔒 Năng lượng đã đạt trần ${statCap}%! Con hãy hoàn thành ít nhất 4 nhiệm vụ hoặc mở Rương Thưởng Buổi để vượt mốc 80% lên 100% và nhận Cúp Vàng (+20 EXP) nhé!`
            : `⚡ Năng lượng của ${pet.name} đã đầy 100% rồi!`;
        const msgEn =
          statCap < 100
            ? `🔒 Energy capped at ${statCap}%! Complete at least 4 quests or unlock a Session Chest to reach 100%!`
            : `⚡ Energy is already at 100%!`;
        setRealtimeToast(appState.language === 'vi' ? msgVi : msgEn);
        setTimeout(() => setRealtimeToast(null), 4500);
        return { ok: false, messageVi: msgVi, messageEn: msgEn };
      }

      const nextSleepCount = sleepCountToday + 1;
      const nextEnergy = Math.min(statCap, pet.energy + PET_RULES.QUICK_CARE_STAT_GAIN);
      const actualGain = Math.max(0, nextEnergy - pet.energy);
      playPetPurrBeepSound(appState.settings.soundEnabled);

      let awardedCupNow = false;
      updateState((prev) => {
        const capNow = getManualCareStatCap(prev.tasks, prev.profile.pet);
        const draftPet: VirtualPet = {
          ...prev.profile.pet,
          energy: Math.min(capNow, prev.profile.pet.energy + PET_RULES.QUICK_CARE_STAT_GAIN),
          sleepCountToday: nextSleepCount,
          lastSleepDate: todayKey
        };
        const { updatedPet, reached100BonusNow } = evaluatePetHatchAndEvolution(draftPet, 0, todayKey);
        awardedCupNow = reached100BonusNow;
        const bonusExp = reached100BonusNow ? PET_RULES.DAILY_GOAL_100_BONUS_EXP : 0;
        const nextExp = Math.max(
          0,
          Number(prev.profile.currentXp) + bonusExp,
          Number(updatedPet.exp) || 0
        );
        const nextEvoInfo = getPetEvolutionInfo(nextExp, true);

        return {
          ...prev,
          profile: {
            ...prev.profile,
            currentXp: nextExp,
            maxXp: nextEvoInfo.nextThreshold,
            level: nextEvoInfo.level,
            pet: {
              ...updatedPet,
              level: nextEvoInfo.level,
              exp: nextExp,
              evolutionStars: nextExp
            }
          }
        };
      });

      if (awardedCupNow) {
        playLevelUp(appState.settings.soundEnabled);
        triggerConfettiExplosion();
      }

      const cupMsg = awardedCupNow
        ? ` 🏆 Đạt 100% cả 3 chỉ số: Nhận Cúp Vàng Chăm Hamster 100% (+${PET_RULES.DAILY_GOAL_100_BONUS_EXP} EXP)!`
        : '';
      const msgVi = `🛌 Khò khò... ${pet.name} Đi ngủ miễn phí (${nextSleepCount}/${PET_RULES.SLEEP_MAX_PER_DAY} lần/ngày) • +${actualGain}% Năng lượng (${nextEnergy}%)${cupMsg}`;
      const msgEn = `🛌 ${pet.name} slept (${nextSleepCount}/${PET_RULES.SLEEP_MAX_PER_DAY} free today) • +${actualGain}% Energy (${nextEnergy}%)${cupMsg}`;
      setRealtimeToast(appState.language === 'vi' ? msgVi : msgEn);
      setTimeout(() => setRealtimeToast(null), 4200);
      return { ok: true, messageVi: msgVi, messageEn: msgEn };
    }

    // 2. 4 nút Chăm Sóc Nhanh tiêu tốn 5đ/lần bấm (Đĩa thức ăn, Bình nước, Chơi vòng quay, Tắm sạch) -> +10% chỉ số tương ứng
    const isPaidQuickCare =
      accessoryId === 'food_bowl' ||
      accessoryId === 'water_fountain' ||
      accessoryId === 'hamster_wheel' ||
      accessoryId === 'mini_waterfall';

    if (isPaidQuickCare) {
      const targetStatKey: 'hunger' | 'energy' | 'happiness' =
        accessoryId === 'food_bowl'
          ? 'hunger'
          : accessoryId === 'water_fountain'
          ? 'energy'
          : 'happiness';

      const statLabelVi =
        targetStatKey === 'hunger'
          ? 'No bụng'
          : targetStatKey === 'energy'
          ? 'Năng lượng'
          : 'Độ vui vẻ';
      const statLabelEn =
        targetStatKey === 'hunger'
          ? 'Fullness'
          : targetStatKey === 'energy'
          ? 'Energy'
          : 'Happiness';

      const currentStatVal = pet[targetStatKey];

      if (currentStatVal >= statCap) {
        playPenaltySound(appState.settings.soundEnabled);
        const msgVi =
          statCap < 100
            ? `🔒 Chỉ số ${statLabelVi} đã đạt trần ${statCap}%! Con hãy hoàn thành ít nhất 4 nhiệm vụ hoặc mở Rương Thưởng Buổi để vượt mốc 80% lên 100% và nhận Cúp Vàng Chăm Hamster 100% (+20 EXP) nhé!`
            : `✨ Chỉ số ${statLabelVi} của ${pet.name} đã đạt tối đa 100% rồi!`;
        const msgEn =
          statCap < 100
            ? `🔒 ${statLabelEn} is capped at ${statCap}%! Complete at least 4 quests or unlock a Session Chest to reach 100%!`
            : `✨ ${statLabelEn} is already at 100%!`;
        setRealtimeToast(appState.language === 'vi' ? msgVi : msgEn);
        setTimeout(() => setRealtimeToast(null), 4500);
        return { ok: false, messageVi: msgVi, messageEn: msgEn };
      }

      if (currentCoins < PET_RULES.QUICK_CARE_COIN_COST) {
        playPenaltySound(appState.settings.soundEnabled);
        const msgVi = `🪙 Ví xu của bé không đủ ${PET_RULES.QUICK_CARE_COIN_COST}đ (Hiện có ${currentCoins}đ)! Mỗi nhiệm vụ hoàn thành được thưởng +${PET_RULES.TASK_COIN_REWARD}đ xu, con hãy làm nhiệm vụ nhé!`;
        const msgEn = `🪙 Not enough coins (need ${PET_RULES.QUICK_CARE_COIN_COST}đ, have ${currentCoins}đ)! Complete quests to earn +${PET_RULES.TASK_COIN_REWARD}đ each!`;
        setRealtimeToast(appState.language === 'vi' ? msgVi : msgEn);
        setTimeout(() => setRealtimeToast(null), 4500);
        return { ok: false, messageVi: msgVi, messageEn: msgEn };
      }

      if (accessoryId === 'food_bowl' || accessoryId === 'water_fountain') {
        playFeedCrunchSound(appState.settings.soundEnabled);
      } else {
        playSuccessChime(appState.settings.soundEnabled);
      }

      const nextCoins = Math.max(0, currentCoins - PET_RULES.QUICK_CARE_COIN_COST);
      const nextStatVal = Math.min(statCap, currentStatVal + PET_RULES.QUICK_CARE_STAT_GAIN);
      const actualGain = Math.max(0, nextStatVal - currentStatVal);

      let awardedCupNow = false;
      updateState((prev) => {
        const capNow = getManualCareStatCap(prev.tasks, prev.profile.pet);
        const prevCoins = Math.max(0, Math.round(Number(prev.profile.pet.coins ?? 760)));
        const draftPet: VirtualPet = {
          ...prev.profile.pet,
          coins: Math.max(0, prevCoins - PET_RULES.QUICK_CARE_COIN_COST),
          hunger:
            targetStatKey === 'hunger'
              ? Math.min(capNow, prev.profile.pet.hunger + PET_RULES.QUICK_CARE_STAT_GAIN)
              : prev.profile.pet.hunger,
          energy:
            targetStatKey === 'energy'
              ? Math.min(capNow, prev.profile.pet.energy + PET_RULES.QUICK_CARE_STAT_GAIN)
              : prev.profile.pet.energy,
          happiness:
            targetStatKey === 'happiness'
              ? Math.min(capNow, prev.profile.pet.happiness + PET_RULES.QUICK_CARE_STAT_GAIN)
              : prev.profile.pet.happiness
        };

        const { updatedPet, reached100BonusNow } = evaluatePetHatchAndEvolution(draftPet, 0, todayKey);
        awardedCupNow = reached100BonusNow;
        const bonusExp = reached100BonusNow ? PET_RULES.DAILY_GOAL_100_BONUS_EXP : 0;
        const nextExp = Math.max(
          0,
          Number(prev.profile.currentXp) + bonusExp,
          Number(updatedPet.exp) || 0
        );
        const nextEvoInfo = getPetEvolutionInfo(nextExp, true);

        return {
          ...prev,
          profile: {
            ...prev.profile,
            currentXp: nextExp,
            maxXp: nextEvoInfo.nextThreshold,
            level: nextEvoInfo.level,
            pet: {
              ...updatedPet,
              level: nextEvoInfo.level,
              exp: nextExp,
              evolutionStars: nextExp
            }
          }
        };
      });

      if (awardedCupNow) {
        playLevelUp(appState.settings.soundEnabled);
        triggerConfettiExplosion();
      }

      const actionTitleVi =
        accessoryId === 'food_bowl'
          ? '🥣 Đĩa thức ăn'
          : accessoryId === 'water_fountain'
          ? '💧 Bình nước'
          : accessoryId === 'hamster_wheel'
          ? '🎡 Chơi vòng quay'
          : '🛁 Tắm sạch';

      const cupMsg = awardedCupNow
        ? ` 🏆 Chúc mừng nhận Cúp Vàng Chăm Hamster 100% (+${PET_RULES.DAILY_GOAL_100_BONUS_EXP} EXP)!`
        : '';
      const msgVi = `${actionTitleVi}: -${PET_RULES.QUICK_CARE_COIN_COST}đ (Ví còn ${nextCoins}đ) • +${actualGain}% ${statLabelVi} (${nextStatVal}%)${cupMsg}`;
      const msgEn = `${meta.nameEn}: -${PET_RULES.QUICK_CARE_COIN_COST}đ (${nextCoins}đ left) • +${actualGain}% ${statLabelEn} (${nextStatVal}%)${cupMsg}`;
      setRealtimeToast(appState.language === 'vi' ? msgVi : msgEn);
      setTimeout(() => setRealtimeToast(null), 4200);
      return { ok: true, messageVi: msgVi, messageEn: msgEn };
    }

    // 3. Các vật phẩm trang trí khác trong phòng (1 lượt miễn phí/ngày, vẫn tuân thủ Trần chỉ số theo Nhiệm vụ)
    const usedToday = pet.usedRoomAccessoriesToday || [];
    if (usedToday.includes(accessoryId)) {
      playPenaltySound(appState.settings.soundEnabled);
      const cooldownMsg =
        appState.language === 'vi'
          ? `🏠 Hôm nay ${pet.name} đã tương tác nhận thưởng từ ${meta.nameVi} (1/1 lượt/ngày) rồi! Bé hãy dùng nút Chăm Sóc Nhanh (5đ) hoặc làm nhiệm vụ nhé!`
          : `🏠 ${pet.name} already used ${meta.nameEn} today (1/1 daily bonus)!`;
      setRealtimeToast(cooldownMsg);
      setTimeout(() => setRealtimeToast(null), 4000);
      return { ok: false, messageVi: cooldownMsg, messageEn: cooldownMsg };
    }

    playSuccessChime(appState.settings.soundEnabled);
    updateState((prev) => {
      const capNow = getManualCareStatCap(prev.tasks, prev.profile.pet);
      return {
        ...prev,
        profile: {
          ...prev.profile,
          pet: {
            ...prev.profile.pet,
            usedRoomAccessoriesToday: Array.from(
              new Set([...(prev.profile.pet.usedRoomAccessoriesToday || []), accessoryId])
            ),
            hunger:
              meta.statBoostType === 'hunger' || meta.statBoostType === 'all'
                ? Math.min(capNow, prev.profile.pet.hunger + meta.statBoostAmount)
                : prev.profile.pet.hunger,
            happiness:
              meta.statBoostType === 'happiness' || meta.statBoostType === 'appearance' || meta.statBoostType === 'all'
                ? Math.min(capNow, prev.profile.pet.happiness + meta.statBoostAmount)
                : prev.profile.pet.happiness,
            energy:
              meta.statBoostType === 'energy' || meta.statBoostType === 'all'
                ? Math.min(capNow, prev.profile.pet.energy + meta.statBoostAmount)
                : prev.profile.pet.energy
          }
        }
      };
    });

    const msgVi = `${meta.emoji} ${pet.name} thích mê khi chơi cùng ${meta.nameVi}!`;
    const msgEn = `${meta.emoji} ${pet.name} loved playing with ${meta.nameEn}!`;
    return { ok: true, messageVi: msgVi, messageEn: msgEn };
  };

  // Reset Magic Egg cycle (to hatch a new egg from 0 EXP if desired)
  const handleResetEggCycle = () => {
    updateState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        currentXp: 0,
        maxXp: 100,
        level: 1,
        pet: {
          ...prev.profile.pet,
          isHatched: false,
          exp: 0,
          eggStars: 0,
          evolutionStars: 0,
          level: 1
        }
      }
    }));
  };

  // Kid Click Challenge -> Request Parent Approval immediately (no timer wait required)
  const handleToggleChallenge = (challengeId: string) => {
    updateState((prev) => {
      const challenge = prev.challenges.find((c) => c.id === challengeId);
      if (!challenge || challenge.isCompletedToday) return prev;

      const willRequestApproval = !challenge.pendingApproval;
      const nowTime = new Date().toLocaleTimeString(prev.language === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const updatedChallenges = prev.challenges.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              pendingApproval: willRequestApproval,
              requestedAt: willRequestApproval ? nowTime : undefined
            }
          : c
      );

      if (willRequestApproval) {
        setRealtimeToast(
          prev.language === 'vi'
            ? `⚡ Đã gửi thử thách "${challenge.title}" chờ Ba Mẹ duyệt (+${challenge.stars} ⭐ • +${challenge.xp} EXP)!`
            : `⚡ Sent challenge "${challenge.titleEn}" for parent approval (+${challenge.stars} ⭐)!`
        );
        setTimeout(() => setRealtimeToast(null), 4000);
      }

      return {
        ...prev,
        challenges: updatedChallenges
      };
    });
  };

  // Parent Approval of a Challenge
  const handleApproveChallenge = (challengeId: string) => {
    let approvedNow = false;
    let hatchedNow = false;

    updateState((prev) => {
      const challenge = prev.challenges.find((c) => c.id === challengeId);
      if (!challenge || challenge.isCompletedToday) return prev;

      approvedNow = true;
      const nowTime = new Date().toLocaleTimeString(prev.language === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const updatedChallenges = prev.challenges.map((c) =>
        c.id === challengeId
          ? { ...c, isCompletedToday: true, pendingApproval: false, completedAt: nowTime }
          : c
      );

      const challengeStars = Math.max(1, Math.round(Number(challenge.stars) || 3));
      const challengeXp = Math.max(15, Number(challenge.xp) || 30);
      const baseUnifiedExp = Math.max(
        0,
        Number(prev.profile.currentXp) || 0,
        Number(prev.profile.pet.exp ?? prev.profile.pet.evolutionStars ?? 0)
      );
      const previousLevel = Math.max(1, Number(prev.profile.pet.level || prev.profile.level) || 1);

      const { nextPet, justHatched, evolvedToStage } = advancePetEggProgress(
        {
          ...prev.profile.pet,
          exp: baseUnifiedExp,
          evolutionStars: baseUnifiedExp
        },
        challengeXp,
        25,
        20,
        20
      );

      const unifiedNextExp = Math.max(0, Number(nextPet.exp) || 0);
      const nextEvoInfo = getPetEvolutionInfo(unifiedNextExp, true);
      const nextLevel = nextEvoInfo.level;
      const nextMaxXp = nextEvoInfo.nextThreshold;
      const leveledUpNow = nextLevel > previousLevel;

      hatchedNow = justHatched || Boolean(evolvedToStage) || leveledUpNow;

      if (leveledUpNow) {
        setLevelUpCelebration({
          previousLevel,
          newLevel: nextLevel,
          childName: prev.profile.name,
          childAvatar: prev.profile.avatar,
          currentXp: unifiedNextExp,
          maxXp: nextMaxXp,
          petName: nextPet.name,
          petAvatar: nextPet.avatar || prev.profile.avatar
        });
      }

      if (justHatched) {
        playEggCrackAndHatchSound(prev.settings.soundEnabled);
      } else if (evolvedToStage || leveledUpNow) {
        playLevelUp(prev.settings.soundEnabled);
      } else {
        playSuccessChime(prev.settings.soundEnabled);
      }

      setRealtimeToast(
        prev.language === 'vi'
          ? `🎉 Đã duyệt thử thách "${challenge.title}"! +${challengeStars} ⭐ tích lũy & +${challengeXp} EXP nuôi Hamster!`
          : `🎉 Approved challenge "${challenge.titleEn}"! +${challengeStars} ⭐ & +${challengeXp} EXP!`
      );
      setTimeout(() => setRealtimeToast(null), 4500);

      if (prev.settings.voiceEnabled && !leveledUpNow) {
        speakText(
          prev.language === 'vi'
            ? `Ba mẹ đã duyệt thử thách ${challenge.title}! Bé nhận thêm ${challengeStars} ngôi sao tích lũy và ${challengeXp} điểm kinh nghiệm nuôi Chuột Hamster!`
            : `Parents approved challenge ${challenge.titleEn}! Earned ${challengeStars} stars!`,
          prev.language,
          prev.settings.voiceEnabled
        );
      }

      const nextStars = prev.profile.stars + challengeStars;
      const updatedState: AppState = {
        ...prev,
        challenges: updatedChallenges,
        profile: {
          ...prev.profile,
          stars: nextStars,
          dailyStarsEarned: (prev.profile.dailyStarsEarned ?? 0) + challengeStars,
          totalStarsEarned: nextStars,
          currentXp: unifiedNextExp,
          maxXp: nextMaxXp,
          level: nextLevel,
          pet: {
            ...nextPet,
            level: nextLevel,
            exp: unifiedNextExp,
            evolutionStars: unifiedNextExp
          }
        }
      };

      return checkBadges(updatedState);
    });

    if (approvedNow || hatchedNow) {
      triggerConfettiExplosion();
    }
  };

  // Parent Rejection of a Challenge
  const handleRejectChallenge = (challengeId: string) => {
    updateState((prev) => ({
      ...prev,
      challenges: prev.challenges.map((c) =>
        c.id === challengeId
          ? { ...c, pendingApproval: false, isCompletedToday: false, requestedAt: undefined }
          : c
      )
    }));
  };

  // Reward Request: Does NOT deduct stars immediately; marks as 'requested' waiting for parent approval
  const handleRequestReward = (rewardId: string) => {
    updateState((prev) => {
      const reward = prev.rewards.find((r) => r.id === rewardId);
      if (!reward || prev.profile.stars < reward.cost) return prev;

      const updatedRewards = prev.rewards.map((r) =>
        r.id === rewardId
          ? { ...r, status: 'requested' as const, requestedAt: new Date().toISOString() }
          : r
      );

      setRealtimeToast(
        prev.language === 'vi'
          ? `🎁 Đã gửi yêu cầu đổi quà "${reward.title}"! Đang chờ Ba Mẹ duyệt đổi quà (cần ${reward.cost} ⭐)`
          : `🎁 Reward requested: "${reward.titleEn}"! Waiting for parent approval (${reward.cost} ⭐)`
      );
      setTimeout(() => setRealtimeToast(null), 4500);

      return {
        ...prev,
        rewards: updatedRewards
      };
    });
  };

  // Reward Approval by Parents: Deducts stars when parents approve
  const handleApproveReward = (rewardId: string) => {
    updateState((prev) => {
      const reward = prev.rewards.find((r) => r.id === rewardId);
      if (!reward) return prev;

      const nextStars = Math.max(0, prev.profile.stars - reward.cost);
      setRealtimeToast(
        prev.language === 'vi'
          ? `🎉 Ba Mẹ đã duyệt và trao quà "${reward.title}"! Đã trừ ${reward.cost} ⭐ tích lũy (còn ${nextStars} ⭐)`
          : `🎉 Parents approved "${reward.titleEn}"! Deducted ${reward.cost} ⭐ (${nextStars} ⭐ left)`
      );
      setTimeout(() => setRealtimeToast(null), 4500);

      return {
        ...prev,
        lastStarSpendTimestamp: Date.now(),
        rewards: prev.rewards.map((r) =>
          r.id === rewardId
            ? { ...r, status: 'approved' as const, approvedAt: new Date().toISOString() }
            : r
        ),
        profile: {
          ...prev.profile,
          stars: nextStars,
          totalStarsEarned: nextStars
        }
      };
    });
  };

  // Reward Rejection: Resets reward to 'available' without star penalty
  const handleRejectReward = (rewardId: string) => {
    updateState((prev) => {
      const reward = prev.rewards.find((r) => r.id === rewardId);
      if (!reward) return prev;

      setRealtimeToast(
        prev.language === 'vi'
          ? `Ba Mẹ đã hoàn lại trạng thái cho phần thưởng "${reward.title}".`
          : `Reward "${reward.titleEn}" was returned to available status.`
      );
      setTimeout(() => setRealtimeToast(null), 4000);

      return {
        ...prev,
        rewards: prev.rewards.map((r) =>
          r.id === rewardId ? { ...r, status: 'available' as const } : r
        )
      };
    });
  };

  // Claim Approved Reward
  const handleClaimReward = (rewardId: string) => {
    updateState((prev) => ({
      ...prev,
      rewards: prev.rewards.map((r) =>
        r.id === rewardId ? { ...r, status: 'claimed' as const } : r
      )
    }));
  };

  // Add Custom Reward
  const handleAddCustomReward = (custom: Omit<Reward, 'id' | 'status'>) => {
    const newReward: Reward = {
      ...custom,
      id: `custom_rew_${Date.now()}`,
      status: 'available'
    };
    updateState((prev) => ({
      ...prev,
      rewards: [...prev.rewards, newReward]
    }));
  };

  // Apply Discipline & Star Deduction
  const handleApplyDiscipline = (reason: string, penaltyStars: number, ruleId?: string) => {
    updateState((prev) => {
      const deduction = Math.max(1, Number(penaltyStars) || 5);
      const newStars = Math.max(0, prev.profile.stars - deduction);
      const now = new Date();
      const timeStr = now.toLocaleTimeString(prev.language === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const todayKey = prev.profile.lastActiveDate;

      const newLog = {
        id: `disc_${Date.now()}`,
        ruleId,
        reason,
        penaltyStars: deduction,
        timestamp: timeStr,
        date: todayKey,
        forgiven: false
      };

      playPenaltySound(prev.settings.soundEnabled);

      if (prev.settings.voiceEnabled) {
        const msg =
          prev.language === 'vi'
            ? `Bé ơi, hành động "${reason}" chưa đúng quy định của gia đình mình và bị trừ ${deduction} ngôi sao. Bé nhớ rút kinh nghiệm để làm tốt hơn nha!`
            : `Reminder: "${reason}" resulted in a ${deduction} star deduction. Remember to reflect and do better next time!`;
        speakText(msg, prev.language, prev.settings.voiceEnabled);
      }

      return {
        ...prev,
        lastStarSpendTimestamp: Date.now(),
        profile: {
          ...prev.profile,
          stars: newStars,
          totalStarsEarned: newStars
        },
        disciplineLogs: [newLog, ...(prev.disciplineLogs || [])]
      };
    });
  };

  // Forgive discipline / refund stars
  const handleForgiveDiscipline = (logId: string) => {
    updateState((prev) => {
      const log = (prev.disciplineLogs || []).find((l) => l.id === logId);
      if (!log || log.forgiven) return prev;

      playSuccessChime(prev.settings.soundEnabled);

      if (prev.settings.voiceEnabled) {
        const msg =
          prev.language === 'vi'
            ? `Ba mẹ rất khen ngợi tinh thần biết nhận lỗi và sửa sai của bé! Ba mẹ hoàn lại ${log.penaltyStars} ngôi sao cho con!`
            : `Parents appreciate your sincere reflection! ${log.penaltyStars} stars restored!`;
        speakText(msg, prev.language, prev.settings.voiceEnabled);
      }

      const nextStars = prev.profile.stars + log.penaltyStars;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          stars: nextStars,
          totalStarsEarned: nextStars
        },
        disciplineLogs: (prev.disciplineLogs || []).map((l) =>
          l.id === logId
            ? {
                ...l,
                forgiven: true,
                forgivenAt: new Date().toLocaleTimeString(prev.language === 'vi' ? 'vi-VN' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
            : l
        )
      };
    });
  };

  // Delete discipline log
  const handleDeleteDisciplineLog = (logId: string) => {
    updateState((prev) => ({
      ...prev,
      disciplineLogs: (prev.disciplineLogs || []).filter((l) => l.id !== logId)
    }));
  };

  // Edit existing discipline log (reason & penaltyStars, adjusting child's active stars if not forgiven)
  const handleEditDisciplineLog = (logId: string, updatedReason: string, updatedPenaltyStars: number) => {
    updateState((prev) => {
      const targetLog = (prev.disciplineLogs || []).find((l) => l.id === logId);
      if (!targetLog) return prev;

      const cleanPenalty = Math.max(1, Math.min(200, Math.round(Number(updatedPenaltyStars) || 1)));
      const cleanReason = updatedReason.trim() || targetLog.reason;

      // If this penalty is currently active (not forgiven), adjust the child's star balance by the delta
      let nextStars = prev.profile.stars;
      if (!targetLog.forgiven) {
        const starDiff = targetLog.penaltyStars - cleanPenalty; // positive if new penalty is smaller (refunds diff)
        nextStars = Math.max(0, prev.profile.stars + starDiff);
      }

      return {
        ...prev,
        lastStarSpendTimestamp: nextStars < prev.profile.stars ? Date.now() : prev.lastStarSpendTimestamp,
        profile: {
          ...prev.profile,
          stars: nextStars,
          totalStarsEarned: nextStars
        },
        disciplineLogs: (prev.disciplineLogs || []).map((l) =>
          l.id === logId
            ? {
                ...l,
                reason: cleanReason,
                reasonEn: cleanReason,
                penaltyStars: cleanPenalty
              }
            : l
        )
      };
    });
  };

  // Direct Star Adjustment by Parents (Star bonus / deduction / exact amount — adjusts Cumulative Stars; Pet Level is raised by Child EXP)
  const handleAdjustStars = (amount: number, isExact: boolean = false, reason?: string) => {
    if (!isSynced) return;
    setAppState((prev) => {
      let nextStars: number;
      if (isExact) {
        nextStars = Math.max(0, Math.round(amount));
      } else {
        nextStars = Math.max(0, prev.profile.stars + Math.round(amount));
      }

      const isIncreased = nextStars > prev.profile.stars;
      const isDecreased = nextStars < prev.profile.stars;

      if (isIncreased || (isExact && nextStars === prev.profile.stars)) {
        playSuccessChime(prev.settings.soundEnabled);
        triggerConfettiExplosion();
        if (prev.settings.voiceEnabled && reason) {
          speakText(
            prev.language === 'vi'
              ? `Đã cập nhật số sao của bé thành ${nextStars} ngôi sao!`
              : `Updated total stars to ${nextStars} stars!`,
            prev.language,
            prev.settings.voiceEnabled
          );
        }
      } else if (isDecreased) {
        playPenaltySound(prev.settings.soundEnabled);
        if (prev.settings.voiceEnabled && reason) {
          speakText(
            prev.language === 'vi'
              ? `Ba mẹ đã điều chỉnh số sao của bé thành ${nextStars} ngôi sao.`
              : `Adjusted stars to ${nextStars}.`,
            prev.language,
            prev.settings.voiceEnabled
          );
        }
      }

      const now = Math.max(Date.now(), getStateTimestamp(prev) + 1);
      const nextState: AppState = {
        ...prev,
        lastSyncTimestamp: now,
        lastUpdatedAt: now,
        lastStarSpendTimestamp: isDecreased ? now : prev.lastStarSpendTimestamp,
        profile: {
          ...prev.profile,
          stars: nextStars,
          dailyStarsEarned: isExact
            ? nextStars === 0
              ? 0
              : prev.profile.dailyStarsEarned || 0
            : isIncreased
            ? (prev.profile.dailyStarsEarned || 0) + (nextStars - prev.profile.stars)
            : prev.profile.dailyStarsEarned || 0,
          totalStarsEarned: nextStars
        }
      };

      latestStateRef.current = nextState;

      setRealtimeToast(
        prev.language === 'vi'
          ? `✨ Đã cập nhật số sao tích lũy: ${nextStars} ⭐ (Đã lưu & đồng bộ ${prev.familyCode})`
          : `✨ Updated stars: ${nextStars} ⭐ (Saved & synced)`
      );
      setTimeout(() => setRealtimeToast(null), 3500);

      return nextState;
    });
  };

  // Join existing Family Code (Pulls remote data first if it exists; otherwise initializes code with current device state)
  const handleJoinFamily = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (!isValidFamilyCode(cleanCode)) {
      return false;
    }

    const result = await pullLatestFamilyStateResult(cleanCode);
    if (result.status === 'error') {
      return false;
    }

    if (result.status === 'ok') {
      const remoteTs = Math.max(getStateTimestamp(result.state), Date.now());
      const adopted: AppState = {
        ...result.state,
        familyCode: cleanCode,
        lastSyncTimestamp: remoteTs,
        lastUpdatedAt: remoteTs
      };
      applyRemote(adopted);
      return true;
    }

    // status === 'empty'
    const nowTs = Math.max(Date.now(), getStateTimestamp(latestStateRef.current) + 1);
    const switchedState: AppState = {
      ...latestStateRef.current,
      familyCode: cleanCode,
      lastSyncTimestamp: nowTs,
      lastUpdatedAt: nowTs
    };
    setAppState(switchedState);
    latestStateRef.current = switchedState;
    await forcePushStateToAllDevices(switchedState);
    return true;
  };

  // Smart two-way sync: pulls latest from Firebase via applyRemoteStateIfNewer, or pushes local if local is newer
  const handleForceSync = async () => {
    const current = latestStateRef.current;
    const result = await pullLatestFamilyStateResult(current.familyCode);
    if (result.status === 'error') {
      throw result.error;
    }
    if (result.status === 'ok') {
      const applied = applyRemoteStateIfNewer(current, result.state);
      if (applied) {
        latestStateRef.current = applied;
        setAppState(applied);
        return;
      }
    }
    await forcePushStateToAllDevices(latestStateRef.current);
  };

  // Explicit Force Push: Make this device's data the master across all connected devices
  const handleForcePushMaster = async (): Promise<boolean> => {
    const now = Math.max(Date.now(), getStateTimestamp(latestStateRef.current) + 1);
    const updated: AppState = {
      ...latestStateRef.current,
      lastSyncTimestamp: now,
      lastUpdatedAt: now
    };
    setAppState(updated);
    latestStateRef.current = updated;
    return await forcePushStateToAllDevices(updated);
  };

  // Explicit Force Pull: Pull latest data from Firebase and adopt it directly
  const handleForcePullRemote = async (): Promise<boolean> => {
    const current = latestStateRef.current;
    const result = await pullLatestFamilyStateResult(current.familyCode);
    if (result.status === 'ok') {
      const bumpedTs = Math.max(
        getStateTimestamp(result.state),
        getStateTimestamp(current) + 1,
        Date.now()
      );
      const adopted: AppState = {
        ...result.state,
        lastSyncTimestamp: bumpedTs,
        lastUpdatedAt: bumpedTs
      };
      applyRemote(adopted);
      return true;
    }
    return false;
  };

  // Export / Import
  const handleExportBackup = () => {
    exportDataAsJson(appState);
  };

  const handleImportBackup = async (file: File) => {
    try {
      const imported = await importDataFromJson(file);
      const nowTs = Math.max(Date.now(), getStateTimestamp(latestStateRef.current) + 1);
      const stamped: AppState = {
        ...imported,
        lastSyncTimestamp: nowTs,
        lastUpdatedAt: nowTs
      };
      latestStateRef.current = stamped;
      setAppState(stamped);
      playSuccessChime(appState.settings.soundEnabled);
    } catch {
      setRealtimeToast(appState.language === 'vi' ? '⚠️ File dữ liệu không hợp lệ!' : '⚠️ Invalid backup file format!');
      setTimeout(() => setRealtimeToast(null), 3500);
    }
  };

  const completedTasksCount = appState.tasks.filter((t) => t.isCompleted).length;
  const pendingTaskApprovalsCount = appState.tasks.filter((t) => t.pendingApproval && !t.isCompleted).length;
  const pendingChallengeApprovalsCount = appState.challenges.filter((c) => c.pendingApproval && !c.isCompletedToday).length;
  const pendingRewardCount =
    appState.rewards.filter((r) => r.status === 'requested').length +
    pendingTaskApprovalsCount +
    pendingChallengeApprovalsCount;
  const unforgivenPenaltyCount = (appState.disciplineLogs || []).filter(
    (l) => l.date === appState.profile.lastActiveDate && !l.forgiven
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header (Top Bar Contract Compliant) */}
      <Header
        language={appState.language}
        onLanguageChange={(lang) => updateState((prev) => ({ ...prev, language: lang }))}
        voiceEnabled={appState.settings.voiceEnabled}
        onToggleVoice={() =>
          updateState((prev) => ({
            ...prev,
            settings: { ...prev.settings, voiceEnabled: !prev.settings.voiceEnabled }
          }))
        }
        soundEnabled={appState.settings.soundEnabled}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'parent') setIsParentMode(false);
        }}
        isParentMode={isParentMode}
        onOpenParentGate={() => {
          if (isParentMode) {
            setIsParentMode(false);
            setActiveTab('quests');
          } else {
            setShowParentGate(true);
          }
        }}
        onOpenSync={() => setShowSync(true)}
        stars={appState.profile.stars}
        unforgivenPenaltyCount={unforgivenPenaltyCount}
      />

      {!isSynced && (
        <div className="bg-amber-500/95 text-slate-950 text-xs sm:text-sm font-extrabold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm z-40">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
          <span>
            {appState.language === 'vi'
              ? 'Đang đồng bộ dữ liệu từ Firebase... Vui lòng đợi trong giây lát (đã khoá chấm sao/nhập liệu)'
              : 'Syncing with Firebase... Please wait (inputs locked)'}
          </span>
        </div>
      )}

      {/* Main Container (Widescreen iPad Landscape max-w-7xl with compact vertical padding) */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-5 py-2.5 pb-20 transition-opacity ${
          !isSynced ? 'pointer-events-none opacity-60 select-none' : ''
        }`}
      >
        {/* Child Profile & Pet Banner (Visible only on kid quests tab) */}
        {!isParentMode && activeTab === 'quests' && (
          <HeroBanner
            profile={appState.profile}
            language={appState.language}
            soundEnabled={appState.settings.soundEnabled}
            voiceEnabled={appState.settings.voiceEnabled}
            onToggleSound={() =>
              updateState((prev) => ({
                ...prev,
                settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled }
              }))
            }
            onFeedPet={handleFeedPet}
            onPetPet={handlePetPet}
            onChangePetSpecies={handleChangePetSpecies}
            onAddEggStars={handleAddEggStars}
            onSetEvolutionStars={handleSetEvolutionStars}
            onBuyOrToggleAccessory={handleBuyOrToggleAccessory}
            onUseRoomAccessory={handleUseRoomAccessory}
            onChangeRoomTheme={handleChangeRoomTheme}
            onResetEggCycle={handleResetEggCycle}
            onOpenBadges={() => setShowBadges(true)}
            completedTasksCount={completedTasksCount}
            pendingTasksCount={pendingTaskApprovalsCount}
            totalTasksCount={appState.tasks.length}
            dailyGoalMessage={appState.settings.dailyGoalMessage}
            disciplineLogs={appState.disciplineLogs}
            onOpenDiscipline={() => setActiveTab('discipline')}
            onUpdateAvatar={(avatarUrl) =>
              updateState((prev) => ({
                ...prev,
                profile: {
                  ...prev.profile,
                  avatar: avatarUrl
                }
              }))
            }
            onUpdateProfile={(name, grade, avatar) =>
              updateState((prev) => ({
                ...prev,
                profile: {
                  ...prev.profile,
                  name,
                  grade,
                  avatar
                }
              }))
            }
          />
        )}

        {/* Dynamic Views */}
        {isParentMode ? (
          <ParentDashboard
            appState={appState}
            language={appState.language}
            soundEnabled={appState.settings.soundEnabled}
            onExitParentMode={() => {
              setIsParentMode(false);
              setActiveTab('quests');
            }}
            onUpdateTasks={(tasks) => updateState((prev) => ({ ...prev, tasks }))}
            onUpdateChallenges={(challenges) => updateState((prev) => ({ ...prev, challenges }))}
            onUpdateRewards={(rewards) => updateState((prev) => ({ ...prev, rewards }))}
            onApproveTask={handleApproveTask}
            onApproveAllTasks={handleApproveAllTasks}
            onRejectTask={handleRejectTask}
            onApproveChallenge={handleApproveChallenge}
            onRejectChallenge={handleRejectChallenge}
            onApproveReward={handleApproveReward}
            onRejectReward={handleRejectReward}
            onUpdateSettings={(settings, newGoalHistory) =>
              updateState((prev) => ({
                ...prev,
                settings,
                goalHistory: newGoalHistory !== undefined ? newGoalHistory : prev.goalHistory
              }))
            }
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onApplyDiscipline={handleApplyDiscipline}
            onForgiveDiscipline={handleForgiveDiscipline}
            onDeleteDisciplineLog={handleDeleteDisciplineLog}
            onEditDisciplineLog={handleEditDisciplineLog}
            onUpdateDisciplineRules={(disciplineRules) =>
              updateState((prev) => ({ ...prev, disciplineRules }))
            }
            onUpdateDisciplinePrinciples={(disciplinePrinciples) =>
              updateState((prev) => ({ ...prev, disciplinePrinciples }))
            }
            onClearDisciplineLogs={() =>
              updateState((prev) => ({ ...prev, disciplineLogs: [] }))
            }
            onResetDailyTasks={() => updateState((prev) => resetDailyTasksForNewDay(prev))}
            onResetPoints={(mode) => updateState((prev) => resetParentPoints(prev, mode))}
            onAdjustStars={handleAdjustStars}
            onUpdateProfile={(name, grade, avatar) =>
              updateState((prev) => ({
                ...prev,
                profile: {
                  ...prev.profile,
                  name,
                  grade,
                  ...(avatar ? { avatar } : {})
                }
              }))
            }
          />
        ) : (
          <>
            {activeTab === 'quests' && (
              <TaskBoard
                tasks={appState.tasks}
                language={appState.language}
                soundEnabled={appState.settings.soundEnabled}
                voiceEnabled={appState.settings.voiceEnabled}
                onToggleTask={handleToggleTask}
              />
            )}

            {activeTab === 'challenges' && (
              <ChallengeHub
                challenges={appState.challenges}
                language={appState.language}
                soundEnabled={appState.settings.soundEnabled}
                voiceEnabled={appState.settings.voiceEnabled}
                isParentMode={isParentMode}
                onToggleChallenge={handleToggleChallenge}
                onApproveChallenge={handleApproveChallenge}
                onRejectChallenge={handleRejectChallenge}
                onUpdateChallenges={(challenges) =>
                  updateState((prev) => ({ ...prev, challenges }))
                }
              />
            )}

            {activeTab === 'discipline' && (
              <KidDisciplineView
                childName={appState.profile.name}
                currentStars={appState.profile.stars}
                lastActiveDate={appState.profile.lastActiveDate}
                disciplineRules={appState.disciplineRules || []}
                disciplinePrinciples={appState.disciplinePrinciples || []}
                disciplineLogs={appState.disciplineLogs || []}
                language={appState.language}
                soundEnabled={appState.settings.soundEnabled}
                voiceEnabled={appState.settings.voiceEnabled}
                onGoToQuests={() => setActiveTab('quests')}
              />
            )}

            {activeTab === 'rewards' && (
              <RewardShop
                rewards={appState.rewards}
                stars={appState.profile.stars}
                dailyStarsEarned={appState.profile.dailyStarsEarned ?? 0}
                language={appState.language}
                soundEnabled={appState.settings.soundEnabled}
                voiceEnabled={appState.settings.voiceEnabled}
                isParentMode={isParentMode}
                pinnedRewardId={appState.profile.pinnedRewardId}
                onPinReward={(rewardId) =>
                  updateState((prev) => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      pinnedRewardId: rewardId
                    }
                  }))
                }
                onRequestReward={handleRequestReward}
                onApproveReward={handleApproveReward}
                onRejectReward={handleRejectReward}
                onClaimReward={handleClaimReward}
                onAddCustomReward={handleAddCustomReward}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="hidden md:block py-6 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">KidHero</span>
            <span>·</span>
            <span>{appState.language === 'vi' ? 'Ứng dụng rèn luyện tự lập cho bé' : 'Kids Daily Habits & Routine Companion'}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span>✓</span>
              <span>
                {appState.language === 'vi'
                  ? 'Tự động lưu tiến độ (localStorage & Cloud)'
                  : 'Auto-saved to localStorage & Cloud'}
              </span>
            </span>
            <span>·</span>
            <span className="font-mono text-slate-400">
              {appState.familyCode}
            </span>
            <span>·</span>
            <span className={isOnline ? 'text-emerald-600' : 'text-amber-600'}>
              {isOnline ? (appState.language === 'vi' ? 'Đã kết nối' : 'Online') : (appState.language === 'vi' ? 'Chế độ ngoại tuyến' : 'Offline')}
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (Ergonomic thumb zone) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'parent') setIsParentMode(false);
        }}
        language={appState.language}
        soundEnabled={appState.settings.soundEnabled}
        isParentMode={isParentMode}
        onOpenParentGate={() => {
          if (isParentMode) {
            setIsParentMode(false);
            setActiveTab('quests');
          } else {
            setShowParentGate(true);
          }
        }}
        pendingRewardCount={pendingRewardCount}
        unforgivenPenaltyCount={unforgivenPenaltyCount}
      />

      {/* Modals */}
      <ParentGateModal
        isOpen={showParentGate}
        onClose={() => setShowParentGate(false)}
        onSuccess={() => {
          setShowParentGate(false);
          setIsParentMode(true);
          setActiveTab('parent');
        }}
        settings={appState.settings}
        language={appState.language}
        soundEnabled={appState.settings.soundEnabled}
      />

      <BadgesModal
        isOpen={showBadges}
        onClose={() => setShowBadges(false)}
        badges={appState.badges}
        language={appState.language}
        soundEnabled={appState.settings.soundEnabled}
      />

      {realtimeToast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-emerald-950/95 text-emerald-300 border border-emerald-500/40 shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{realtimeToast}</span>
        </div>
      )}

      <SyncModal
        isOpen={showSync}
        onClose={() => setShowSync(false)}
        familyCode={appState.familyCode}
        appState={appState}
        onJoinFamily={handleJoinFamily}
        onForceSync={handleForceSync}
        onForcePush={handleForcePushMaster}
        onForcePull={handleForcePullRemote}
        onApplySyncedState={(newState) => {
          const bumpedTs = Math.max(
            getStateTimestamp(newState),
            getStateTimestamp(latestStateRef.current) + 1,
            Date.now()
          );
          applyRemote({
            ...newState,
            lastSyncTimestamp: bumpedTs,
            lastUpdatedAt: bumpedTs
          });
        }}
        language={appState.language}
        soundEnabled={appState.settings.soundEnabled}
        isOnline={isOnline}
        onFirebaseConfigUpdated={() => setFirebaseConfigRevision((r) => r + 1)}
      />

      {/* Level Up Celebration Overlay Animation (Triggered when nextXp >= nextMaxXp) */}
      <LevelUpOverlay
        celebration={levelUpCelebration}
        language={appState.language}
        soundEnabled={appState.settings.soundEnabled}
        voiceEnabled={appState.settings.voiceEnabled}
        onClose={() => setLevelUpCelebration(null)}
      />
    </div>
  );
}
