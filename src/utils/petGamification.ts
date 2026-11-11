import { Task, VirtualPet, PetAccessoryId } from '../types';
import { getTodayKey } from './defaults';
import {
  EGG_HATCH_TARGET_STARS,
  PetLevelNumber,
  getAutoUnlockedAccessoriesForLevel,
  getPetEvolutionInfo,
  getPetSpeciesMeta
} from './pets';

/**
 * ============================================================================
 * GAMIFICATION ENGINE: NUÔI CHUỘT HAMSTER MŨM MĨM (10 CẤP ĐỘ EXP)
 * ============================================================================
 * Nguyên tắc cốt lõi:
 * 1. Công thức 3 chỉ số (Độ vui vẻ, Năng lượng, No bụng) tính theo 3 Buổi
 *    (Buổi Sáng • Buổi Trưa & Chiều • Buổi Tối) và GIẢM DẦN SAU MỖI GIỜ TRÔI QUA
 *    (-6% No bụng/giờ, -5% Vui vẻ/giờ, -5% Năng lượng/giờ) để bé có động lực
 *    hoàn thành nhiệm vụ kiếm Sao và chăm sóc Chuột Hamster suốt cả ngày!
 * 2. Level của Chuột Hamster có 10 Cấp độ (Lv.1 -> Lv.10) tính bằng điểm EXP.
 */

export const PET_RULES = {
  // 1. Tốc độ giảm dần sau mỗi giờ trôi qua (Từ 07:00 đến 21:00)
  HOURLY_HUNGER_DECAY: 6, // Giảm 6% No bụng sau mỗi 1 giờ trôi qua
  HOURLY_HAPPINESS_DECAY: 5, // Giảm 5% Độ vui vẻ sau mỗi 1 giờ trôi qua
  HOURLY_ENERGY_DECAY: 5, // Giảm 5% Năng lượng sau mỗi 1 giờ trôi qua

  // Giảm thêm khi chuyển sang buổi mới mà chưa hoàn thành rương buổi trước
  SESSION_MISSED_HUNGER_DECAY: 10,
  SESSION_MISSED_HAPPINESS_DECAY: 8,
  SESSION_MISSED_ENERGY_DECAY: 8,

  // 2. Tăng điểm theo 3 Buổi (Sáng • Trưa & Chiều • Tối)
  HUNGER_GAIN_MORNING_COMPLETE: 35, // Rương Buổi Sáng: +35% No bụng
  HUNGER_GAIN_AFTERNOON_COMPLETE: 35, // Rương Buổi Trưa & Chiều: +35% No bụng
  HUNGER_GAIN_EVENING_COMPLETE: 40, // Rương Buổi Tối: +40% No bụng

  SPECIAL_TREAT_STAR_COST: 5, // Mua đồ ăn thưởng đặc biệt: 5 Sao tích lũy
  SPECIAL_TREAT_HUNGER_GAIN: 20, // Cho ăn thưởng (5 ⭐) giúp hồi +20% No bụng
  SPECIAL_TREAT_HAPPINESS_GAIN: 15, // +15% Độ vui vẻ
  SPECIAL_TREAT_ENERGY_GAIN: 10, // +10% Năng lượng
  SPECIAL_TREAT_EVOLUTION_XP: 0, // Level linh thú được nuôi bằng EXP của bé (không mua Level bằng Sao)
  FEED_MAX_PER_DAY: 12, // Cho ăn giới hạn tối đa 12 lần/ngày

  // 3. Tương tác Xoa đầu & Học tập / Vận động
  HEAD_PAT_MAX_PER_DAY: 30, // Nút "Xoa đầu" tối đa 30 lần/ngày
  HEAD_PAT_HAPPINESS_GAIN: 2, // Mỗi lần xoa đầu cộng +2% Vui vẻ (tối đa +60%/ngày)
  HEAD_PAT_EXP_GAIN: 5, // Mỗi lần xoa đầu cộng +5 EXP cho Hamster
  STUDY_HOMEWORK_HAPPINESS_GAIN: 30, // Hoàn thành Học bài / Bài tập: +30% Vui vẻ
  READING_BOOK_HAPPINESS_GAIN: 25, // Hoàn thành Đọc sách: +25% Vui vẻ
  SPORT_CHORE_HAPPINESS_GAIN: 25, // Hoàn thành Thể dục / Việc nhà: +25% Vui vẻ

  // 4. Năng lượng theo Buổi (Sáng thức dậy, Trưa nghỉ ngơi, Tối ngủ đúng giờ)
  ENERGY_GAIN_MORNING_WAKE: 30, // Buổi Sáng: +30% Năng lượng
  ENERGY_GAIN_NOON_REST: 30, // Buổi Trưa & Chiều: +30% Năng lượng
  ENERGY_GAIN_EVENING_SLEEP: 40, // Buổi Tối: +40% Năng lượng
  TASK_ENERGY_GAIN: 15, // Mỗi nhiệm vụ đơn lẻ: +15% Năng lượng

  // 5. Thưởng nóng khi cả 3 chỉ số cùng đạt 100% trong ngày
  DAILY_GOAL_100_BONUS_EXP: 20, // +20 EXP thưởng thêm khi cả 3 thanh đạt 100%

  // 6. Kinh tế Xu nuôi thú & Trần chỉ số theo Nhiệm vụ
  TASK_EXP_REWARD: 5, // Mỗi nhiệm vụ hằng ngày hoàn thành thưởng +5 EXP
  TASK_COIN_REWARD: 15, // Mỗi nhiệm vụ hằng ngày hoàn thành thưởng +15đ xu nuôi thú vào ví của bé
  QUICK_CARE_COIN_COST: 5, // 4 nút Chăm Sóc Nhanh tiêu tốn 5đ/lần bấm
  QUICK_CARE_STAT_GAIN: 10, // Tăng +10% chỉ số tương ứng mỗi lần bấm
  SLEEP_MAX_PER_DAY: 3, // Nút Đi ngủ miễn phí nhưng giới hạn 3 lần/ngày
  STAT_CAP_WITHOUT_QUESTS: 80, // Trần chỉ số tối đa 80% nếu chưa mở Rương Buổi / chưa làm đủ 4 nhiệm vụ

  // 7. Ấp trứng & Tiến hóa 20 cấp theo EXP
  WELLBEING_THRESHOLD_PERCENT: 80,
  WELLBEING_REQUIRED_STREAK_DAYS: 3,
  UNLOCK_STAGE_1_EXP: 50
} as const;

/**
 * Tính "Trần chỉ số theo Nhiệm vụ":
 * - Nếu hôm nay bé chưa hoàn thành nhiệm vụ nào (hoặc chưa đạt mốc 4 nhiệm vụ / chưa mở Rương Thưởng Buổi),
 *   các nút chăm sóc thủ công chỉ có thể nâng 3 chỉ số của Hamster lên tối đa 80%.
 * - Chỉ khi bé hoàn thành nhiệm vụ và mở Rương Thưởng Buổi (hoặc làm ít nhất 4 nhiệm vụ trong ngày),
 *   các chỉ số mới vượt qua mốc 80% để lên 100% và trao "Cúp Vàng Chăm Hamster 100% (+20 EXP)".
 */
export function getManualCareStatCap(tasks: Task[], _pet?: VirtualPet): number {
  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
  const sessionCategories: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];
  const hasUnlockedAnySessionChest = sessionCategories.some((cat) => {
    const slotTasks = tasks.filter((t) => t.category === cat);
    return slotTasks.length > 0 && slotTasks.every((t) => t.isCompleted);
  });

  if (completedTasksCount >= 4 || hasUnlockedAnySessionChest) {
    return 100;
  }
  return PET_RULES.STAT_CAP_WITHOUT_QUESTS;
}

export type DayTimeSlot = 'morning' | 'afternoon' | 'evening';

const clampPercent = (val: number): number =>
  Math.max(0, Math.min(100, Math.round(Number(val) || 0)));

export function getCurrentTimeSlot(now: Date = new Date()): DayTimeSlot {
  const hour = now.getHours();
  if (hour < 11) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function areAllPetStatsAbove80(pet: VirtualPet): boolean {
  return (
    clampPercent(pet.hunger) >= PET_RULES.WELLBEING_THRESHOLD_PERCENT &&
    clampPercent(pet.happiness) >= PET_RULES.WELLBEING_THRESHOLD_PERCENT &&
    clampPercent(pet.energy) >= PET_RULES.WELLBEING_THRESHOLD_PERCENT
  );
}

export function getDailyPetGoalPercent(pet: VirtualPet): number {
  const avg =
    (clampPercent(pet.happiness) + clampPercent(pet.energy) + clampPercent(pet.hunger)) / 3;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

/**
 * Cập nhật EXP, Level (1 -> 30) của Chuột Hamster và trạng thái Ấp trứng / Mở khóa phụ kiện
 */
export function evaluatePetHatchAndEvolution(
  pet: VirtualPet,
  addedExp: number = 0,
  todayKey: string = getTodayKey()
): {
  updatedPet: VirtualPet;
  justHatchedByStreak: boolean;
  justHatchedByStars: boolean;
  evolvedToStage: PetLevelNumber | null;
  reached100BonusNow: boolean;
} {
  const isGoal100Now =
    clampPercent(pet.hunger) >= 100 &&
    clampPercent(pet.happiness) >= 100 &&
    clampPercent(pet.energy) >= 100;
  const reached100BonusNow =
    isGoal100Now && pet.dailyGoal100CelebratedDate !== todayKey;
  const totalAddedExp =
    Math.max(0, addedExp) +
    (reached100BonusNow ? PET_RULES.DAILY_GOAL_100_BONUS_EXP : 0);

  const prevExp = Math.max(
    0,
    Number(pet.exp ?? pet.evolutionStars ?? pet.eggStars ?? 0)
  );
  const nextExp = Math.max(0, Math.round(prevExp + totalAddedExp));
  const nextEggProgress = Math.min(EGG_HATCH_TARGET_STARS, nextExp);

  let consecutiveDays = Math.max(0, Number(pet.consecutiveHighStatDays ?? 0));
  let lastQualifiedDate = pet.lastHighStatQualifiedDate;

  if (areAllPetStatsAbove80(pet) && lastQualifiedDate !== todayKey) {
    consecutiveDays += 1;
    lastQualifiedDate = todayKey;
  }

  const wasHatched = Boolean(pet.isHatched);
  const hatchedByStreak =
    !wasHatched && consecutiveDays >= PET_RULES.WELLBEING_REQUIRED_STREAK_DAYS;
  const hatchedByExp = !wasHatched && nextExp >= EGG_HATCH_TARGET_STARS;
  const isNowHatched = wasHatched || hatchedByStreak || hatchedByExp;

  const prevInfo = getPetEvolutionInfo(prevExp, wasHatched);
  const nextInfo = getPetEvolutionInfo(
    isNowHatched ? Math.max(EGG_HATCH_TARGET_STARS, nextExp) : nextExp,
    isNowHatched
  );

  const evolvedToStage: PetLevelNumber | null =
    nextInfo.level > prevInfo.level ? nextInfo.level : null;

  const unlockedSet = new Set<PetAccessoryId>(pet.unlockedAccessories || []);
  const equippedSet = new Set<PetAccessoryId>(pet.equippedAccessories || []);

  const prevLevelGifts = new Set<PetAccessoryId>(getAutoUnlockedAccessoriesForLevel(prevInfo.level));
  const nextLevelGifts = getAutoUnlockedAccessoriesForLevel(nextInfo.level);

  for (const giftId of nextLevelGifts) {
    const wasAlreadyUnlocked = unlockedSet.has(giftId);
    unlockedSet.add(giftId);
    // Automatically place newly unlocked level gifts into the room!
    if (!wasAlreadyUnlocked || !prevLevelGifts.has(giftId) || equippedSet.size === 0) {
      equippedSet.add(giftId);
    }
  }

  const finalExp = isNowHatched ? Math.max(EGG_HATCH_TARGET_STARS, nextExp) : nextExp;
  const hamsterMeta = getPetSpeciesMeta('hamster');

  return {
    updatedPet: {
      ...pet,
      species: 'hamster',
      name:
        !pet.name ||
        pet.name === 'Rồng Con Đốm Đốm' ||
        pet.name === 'Cún Con Dũng Cảm' ||
        pet.name === 'Mèo Con Thông Thái'
          ? hamsterMeta.nameVi
          : pet.name,
      avatar: hamsterMeta.avatar,
      isHatched: isNowHatched,
      exp: finalExp,
      eggStars: isNowHatched ? EGG_HATCH_TARGET_STARS : nextEggProgress,
      evolutionStars: finalExp,
      level: nextInfo.level,
      consecutiveHighStatDays: consecutiveDays,
      lastHighStatQualifiedDate: lastQualifiedDate,
      dailyGoal100CelebratedDate: reached100BonusNow
        ? todayKey
        : pet.dailyGoal100CelebratedDate,
      unlockedAccessories: Array.from(unlockedSet),
      equippedAccessories: Array.from(equippedSet)
    },
    justHatchedByStreak: hatchedByStreak,
    justHatchedByStars: hatchedByExp,
    evolvedToStage,
    reached100BonusNow
  };
}

/**
 * Cơ chế Giảm Dần Theo Mỗi Giờ Trôi Qua & Theo Buổi (Sáng • Trưa & Chiều • Tối):
 * 1. Qua 0h sang ngày mới (chỉ khi workingPet.lastDecayDate < todayKey): Reset 3 chỉ số về 0% cho ngày mới, đồng thời reset lượt Xoa đầu (0/30) & Cho ăn (0/12).
 *    Nếu workingPet.lastDecayDate > todayKey (do lệch đồng hồ máy chủ 2026 vs máy người dùng 2025), chỉ chuẩn hóa ngày về todayKey mà KHÔNG reset chỉ số!
 * 2. Trong ngày (07:00 - 21:00): Sau mỗi 1 giờ trôi qua, No bụng giảm -6%/giờ,
 *    Độ vui vẻ giảm -5%/giờ, Năng lượng giảm -5%/giờ để thúc đẩy bé làm nhiệm vụ kiếm Sao.
 * 3. Khi bước sang Buổi Trưa (11h) hoặc Buổi Tối (17h30) mà chưa xong nhiệm vụ buổi trước,
 *    nhắc nhở và giảm thêm 1 nhịp theo buổi.
 */
export function applyTimeOfDayPetDecay(
  pet: VirtualPet,
  tasks: Task[],
  now: Date = new Date()
): { pet: VirtualPet; changed: boolean; noticeVi?: string; noticeEn?: string } {
  const todayKey = getTodayKey();
  const currentHour = now.getHours();
  const hamsterMeta = getPetSpeciesMeta('hamster');

  const allZeroBug =
    clampPercent(pet.happiness) === 0 &&
    clampPercent(pet.energy) === 0 &&
    clampPercent(pet.hunger) === 0;

  let workingPet: VirtualPet = {
    ...pet,
    species: 'hamster',
    name:
      !pet.name ||
      pet.name === 'Rồng Con Đốm Đốm' ||
      pet.name === 'Cún Con Dũng Cảm' ||
      pet.name === 'Mèo Con Thông Thái'
        ? hamsterMeta.nameVi
        : pet.name,
    avatar: hamsterMeta.avatar,
    happiness: allZeroBug ? 80 : clampPercent(pet.happiness),
    energy: allZeroBug ? 80 : clampPercent(pet.energy),
    hunger: allZeroBug ? 75 : clampPercent(pet.hunger)
  };
  let changed =
    allZeroBug ||
    workingPet.species !== pet.species ||
    workingPet.name !== pet.name ||
    workingPet.avatar !== pet.avatar;
  let noticeVi: string | undefined;
  let noticeEn: string | undefined;

  // 1. Kiểm tra ngày:
  // - Nếu lastDecayDate chưa có hoặc đang ở năm/ngày tương lai so với đồng hồ thiết bị (lastDecayDate > todayKey),
  //   chỉ đồng bộ lại ngày về todayKey và giữ nguyên toàn bộ chỉ số!
  if (!workingPet.lastDecayDate || workingPet.lastDecayDate > todayKey) {
    workingPet = {
      ...workingPet,
      lastDecayDate: todayKey,
      lastSleepDate: todayKey,
      lastFeedDate: todayKey,
      lastHeadPatDate: todayKey,
      lastHourlyDecayHour: currentHour,
      happiness: workingPet.happiness,
      energy: workingPet.energy,
      hunger: workingPet.hunger
    };
    return { pet: workingPet, changed: true };
  }

  // - Khi bước sang ngày mới (lastDecayDate < todayKey):
  //   CHỈ reset các bộ đếm lượt trong ngày (sleepCountToday, headPatCountToday, feedCountToday).
  //   TUYỆT ĐỐI KHÔNG ĐƯỢC reset 3 chỉ số sức khỏe (Vui vẻ, Năng lượng, No bụng) của Hamster về 0%!
  if (workingPet.lastDecayDate < todayKey) {
    workingPet = {
      ...workingPet,
      lastDecayDate: todayKey,
      lastHourlyDecayHour: currentHour,
      appliedDecaySlotsToday: [],
      completedMealSlotsToday: [],
      usedRoomAccessoriesToday: [],
      sleepCountToday: 0,
      lastSleepDate: todayKey,
      headPatCountToday: 0,
      lastHeadPatDate: todayKey,
      feedCountToday: 0,
      lastFeedDate: todayKey,
      happiness: workingPet.happiness > 0 ? workingPet.happiness : 80,
      energy: workingPet.energy > 0 ? workingPet.energy : 80,
      hunger: workingPet.hunger > 0 ? workingPet.hunger : 75
    };
    return { pet: workingPet, changed: true };
  }

  // 2. Giảm dần sau mỗi giờ trôi qua (trong khung giờ sinh hoạt 07:00 - 21:00)
  const prevHour =
    typeof workingPet.lastHourlyDecayHour === 'number'
      ? workingPet.lastHourlyDecayHour
      : currentHour;

  if (currentHour > prevHour && currentHour >= 7 && currentHour <= 22) {
    const activeHoursElapsed = Math.min(4, Math.max(0, currentHour - Math.max(7, prevHour)));
    if (activeHoursElapsed > 0 && (workingPet.hunger > 0 || workingPet.happiness > 0 || workingPet.energy > 0)) {
      const hungerDrop = activeHoursElapsed * PET_RULES.HOURLY_HUNGER_DECAY;
      const happinessDrop = activeHoursElapsed * PET_RULES.HOURLY_HAPPINESS_DECAY;
      const energyDrop = activeHoursElapsed * PET_RULES.HOURLY_ENERGY_DECAY;

      workingPet = {
        ...workingPet,
        hunger: clampPercent(workingPet.hunger - hungerDrop),
        happiness: clampPercent(workingPet.happiness - happinessDrop),
        energy: clampPercent(workingPet.energy - energyDrop),
        lastHourlyDecayHour: currentHour
      };
      changed = true;
      noticeVi = `⏰ Đã qua ${activeHoursElapsed} giờ: ${workingPet.name} tiêu hao -${hungerDrop}% No bụng, -${happinessDrop}% Vui vẻ, -${energyDrop}% Năng lượng. Bé hãy làm nhiệm vụ kiếm Sao chăm thú nhé!`;
      noticeEn = `⏰ ${activeHoursElapsed}h passed: ${workingPet.name} used -${hungerDrop}% Fullness, -${happinessDrop}% Happiness, -${energyDrop}% Energy. Complete quests to care for your Hamster!`;
    } else {
      workingPet = {
        ...workingPet,
        lastHourlyDecayHour: currentHour
      };
      changed = true;
    }
  } else if (workingPet.lastHourlyDecayHour === undefined) {
    workingPet = {
      ...workingPet,
      lastHourlyDecayHour: currentHour
    };
    changed = true;
  }

  // 3. Kiểm tra chuyển giao Buổi (Buổi Trưa >= 11h, Buổi Tối >= 17h) nếu chưa hoàn thành buổi trước
  const appliedSlots = new Set<DayTimeSlot>(workingPet.appliedDecaySlotsToday || []);
  const morningTasks = tasks.filter((t) => t.category === 'morning');
  const afternoonTasks = tasks.filter((t) => t.category === 'afternoon');
  const morningDone = morningTasks.length > 0 && morningTasks.every((t) => t.isCompleted || t.pendingApproval);
  const afternoonDone = afternoonTasks.length > 0 && afternoonTasks.every((t) => t.isCompleted || t.pendingApproval);

  if (currentHour >= 11 && !appliedSlots.has('afternoon')) {
    appliedSlots.add('afternoon');
    if (!morningDone && (workingPet.hunger > 0 || workingPet.happiness > 0 || workingPet.energy > 0)) {
      workingPet = {
        ...workingPet,
        hunger: clampPercent(workingPet.hunger - PET_RULES.SESSION_MISSED_HUNGER_DECAY),
        happiness: clampPercent(workingPet.happiness - PET_RULES.SESSION_MISSED_HAPPINESS_DECAY),
        energy: clampPercent(workingPet.energy - PET_RULES.SESSION_MISSED_ENERGY_DECAY),
        appliedDecaySlotsToday: Array.from(appliedSlots)
      };
      noticeVi = `☀️ Đã sang Buổi Trưa! ${workingPet.name} đang đói bụng dần, bé hãy hoàn thành nhiệm vụ Buổi Sáng & Buổi Trưa để nhận Sao nhé!`;
      noticeEn = `☀️ It's Afternoon! Complete your Morning & Afternoon quests to feed ${workingPet.name}!`;
    } else {
      workingPet = {
        ...workingPet,
        appliedDecaySlotsToday: Array.from(appliedSlots)
      };
    }
    changed = true;
  }

  if (currentHour >= 18 && !appliedSlots.has('evening')) {
    appliedSlots.add('evening');
    if (!afternoonDone && (workingPet.hunger > 0 || workingPet.happiness > 0 || workingPet.energy > 0)) {
      workingPet = {
        ...workingPet,
        hunger: clampPercent(workingPet.hunger - PET_RULES.SESSION_MISSED_HUNGER_DECAY),
        happiness: clampPercent(workingPet.happiness - PET_RULES.SESSION_MISSED_HAPPINESS_DECAY),
        energy: clampPercent(workingPet.energy - PET_RULES.SESSION_MISSED_ENERGY_DECAY),
        appliedDecaySlotsToday: Array.from(appliedSlots)
      };
      noticeVi = `🌙 Đã sang Buổi Tối! Bé hãy hoàn thành bài tập & nhiệm vụ buổi tối để ${workingPet.name} no bụng và đầy năng lượng trước khi ngủ nhé!`;
      noticeEn = `🌙 It's Evening! Complete your quests so ${workingPet.name} is full and happy before bedtime!`;
    } else {
      workingPet = {
        ...workingPet,
        appliedDecaySlotsToday: Array.from(appliedSlots)
      };
    }
    changed = true;
  }

  return { pet: workingPet, changed, noticeVi, noticeEn };
}

/**
 * Xử lý sự kiện khi bé hoàn thành một công việc thực tế ngoài đời:
 * - Tăng 3 chỉ số (No bụng, Vui vẻ, Năng lượng) theo công thức Buổi (Sáng • Trưa & Chiều • Tối)
 *   để bù đắp lượng giảm dần mỗi giờ và hướng tới 100%.
 * - Cộng EXP để nâng cấp Chuột Hamster từ Lv.1 -> Lv.20.
 */
export function processRealWorldTaskCompletionForPet(
  pet: VirtualPet,
  completedTask: Task,
  allUpdatedTasks: Task[],
  starsEarnedFromTask: number,
  xpEarnedFromTask?: number
): {
  nextPet: VirtualPet;
  hungerAdded: number;
  happinessAdded: number;
  energyAdded: number;
  expAdded: number;
  coinsAdded: number;
  energyRestoredTo100: boolean;
  completedMealSlotNow: DayTimeSlot | null;
  justHatched: boolean;
  evolvedToStage: PetLevelNumber | null;
  feedbackVi: string;
  feedbackEn: string;
} {
  const todayKey = getTodayKey();
  const category = completedTask.category;
  const completedMeals = new Set<DayTimeSlot>(pet.completedMealSlotsToday || []);
  const expGain = Math.max(5, Math.round(Number(xpEarnedFromTask ?? completedTask.xp) || PET_RULES.TASK_EXP_REWARD));
  const coinsAdded = PET_RULES.TASK_COIN_REWARD;

  // 1. Tính điểm NO BỤNG theo Buổi (Sáng +35%, Trưa +35%, Tối +40%)
  let hungerAdded = 12;
  let completedMealSlotNow: DayTimeSlot | null = null;

  if (category === 'morning' || category === 'afternoon' || category === 'evening') {
    const slotTargetGain =
      category === 'morning'
        ? PET_RULES.HUNGER_GAIN_MORNING_COMPLETE
        : category === 'afternoon'
        ? PET_RULES.HUNGER_GAIN_AFTERNOON_COMPLETE
        : PET_RULES.HUNGER_GAIN_EVENING_COMPLETE;

    const slotTasks = allUpdatedTasks.filter((t) => t.category === category);
    const totalInSlot = Math.max(1, slotTasks.length);
    const allSlotTasksCompleted = slotTasks.every((t) => t.isCompleted || t.pendingApproval);
    const perTaskShare = Math.max(10, Math.round(slotTargetGain / totalInSlot));

    if (allSlotTasksCompleted && !completedMeals.has(category)) {
      completedMeals.add(category);
      completedMealSlotNow = category;
      hungerAdded = Math.max(perTaskShare + 10, Math.round(slotTargetGain * 0.6));
    } else {
      hungerAdded = perTaskShare;
    }
  } else {
    hungerAdded = 15;
  }

  // 2. Tính điểm ĐỘ VUI VẺ theo Buổi & Nhóm việc
  const textCombined = `${completedTask.title} ${completedTask.titleEn} ${completedTask.description}`.toLowerCase();
  const isReadingBook =
    completedTask.id === 'a4' ||
    /đọc sách|truyện|nhà sách|read|book|story/i.test(textCombined);

  const isStudyHomework =
    !isReadingBook &&
    (completedTask.habitGroup === 'study' ||
      completedTask.tag === 'study' ||
      /học|bài tập|từ vựng|viết|toán|soạn sách|study|homework|english/i.test(textCombined));

  const isSportOrChore =
    completedTask.habitGroup === 'health_sport' ||
    completedTask.habitGroup === 'family_help' ||
    completedTask.tag === 'health' ||
    completedTask.tag === 'chore' ||
    /thể dục|vận động|chạy|đạp xe|bơi|nhảy dây|tập|dọn|gấp chăn|giày dép|sport|exercise|workout|tidy|help/i.test(
      textCombined
    );

  let happinessAdded = category === 'afternoon' ? 18 : 15;
  if (isStudyHomework) {
    happinessAdded = PET_RULES.STUDY_HOMEWORK_HAPPINESS_GAIN; // +30% Vui vẻ
  } else if (isReadingBook) {
    happinessAdded = PET_RULES.READING_BOOK_HAPPINESS_GAIN; // +25% Vui vẻ
  } else if (isSportOrChore) {
    happinessAdded = PET_RULES.SPORT_CHORE_HAPPINESS_GAIN; // +25% Vui vẻ
  }
  if (completedMealSlotNow) {
    happinessAdded += 10; // Thưởng thêm khi hoàn thành trọn vẹn 1 buổi
  }

  // 3. Tính điểm NĂNG LƯỢNG theo Buổi (Sáng thức dậy +30%, Trưa nghỉ ngơi +30%, Tối ngủ đúng giờ +40%)
  const isWakeUpOrMorningRoutine =
    completedTask.id === 'm1' ||
    completedTask.id === 'm2' ||
    (category === 'morning' &&
      /thức dậy|dậy sớm|đánh răng|rửa mặt|wake up|brush teeth/i.test(textCombined));

  const isNoonRestOrAfternoonRoutine =
    completedTask.id === 'a1' ||
    completedTask.id === 'a2' ||
    (category === 'afternoon' &&
      /nghỉ trưa|ngủ trưa|rửa tay|thay quần áo|chào|nap|rest|wash hands/i.test(textCombined));

  const isEveningSleepOrHygiene =
    completedTask.id === 'e3' ||
    completedTask.id === 'e4' ||
    (category === 'evening' &&
      /ngủ đúng giờ|đi ngủ|ngủ ngon|đánh răng tối|rửa chân|sleep on time|bedtime|night toothbrush/i.test(
        textCombined
      ));

  let energyAdded: number = PET_RULES.TASK_ENERGY_GAIN;
  if (isEveningSleepOrHygiene) {
    energyAdded = PET_RULES.ENERGY_GAIN_EVENING_SLEEP; // +40% Năng lượng
  } else if (isWakeUpOrMorningRoutine) {
    energyAdded = PET_RULES.ENERGY_GAIN_MORNING_WAKE; // +30% Năng lượng
  } else if (isNoonRestOrAfternoonRoutine) {
    energyAdded = PET_RULES.ENERGY_GAIN_NOON_REST; // +30% Năng lượng
  }
  if (completedMealSlotNow) {
    energyAdded += 8;
  }

  const nextHunger = clampPercent(pet.hunger + hungerAdded);
  const nextHappiness = clampPercent(pet.happiness + happinessAdded);
  const nextEnergy = clampPercent(pet.energy + energyAdded);
  const energyRestoredTo100 = nextEnergy >= 100;

  const currentCoins = Math.max(0, Math.round(Number(pet.coins ?? 760)));
  const nextCoins = currentCoins + coinsAdded;

  const draftPet: VirtualPet = {
    ...pet,
    hunger: nextHunger,
    happiness: nextHappiness,
    energy: nextEnergy,
    coins: nextCoins,
    completedMealSlotsToday: Array.from(completedMeals),
    lastHourlyDecayHour: new Date().getHours(),
    sleptOnTimeDate: isEveningSleepOrHygiene ? todayKey : pet.sleptOnTimeDate
  };

  const {
    updatedPet,
    justHatchedByStreak,
    justHatchedByStars,
    evolvedToStage,
    reached100BonusNow
  } = evaluatePetHatchAndEvolution(
    draftPet,
    expGain,
    todayKey
  );

  const totalExpGranted =
    expGain +
    (reached100BonusNow ? PET_RULES.DAILY_GOAL_100_BONUS_EXP : 0);

  const slotLabelVi =
    completedMealSlotNow === 'morning'
      ? `🎁 Mở Rương Buổi Sáng (+${hungerAdded}% No bụng)`
      : completedMealSlotNow === 'afternoon'
      ? `🎁 Mở Rương Buổi Trưa (+${hungerAdded}% No bụng)`
      : completedMealSlotNow === 'evening'
      ? `🎁 Mở Rương Buổi Tối (+${hungerAdded}% No bụng)`
      : `+${hungerAdded}% No bụng`;

  const bonus100Vi = reached100BonusNow
    ? ` 🏆 Nhận Cúp Vàng Chăm Hamster 100% (+${PET_RULES.DAILY_GOAL_100_BONUS_EXP} EXP)!`
    : '';

  const feedbackVi = `🐹 Chít chít! Hoàn thành nhiệm vụ: +1 ⭐, +${totalExpGranted} EXP, +${coinsAdded}đ xu nuôi thú (Ví: ${nextCoins}đ) • ${updatedPet.name} nhận ${slotLabelVi}, +${happinessAdded}% Vui vẻ, +${energyAdded}% Năng lượng!${bonus100Vi}`;
  const feedbackEn = `🐹 Squeak! Quest completed: +1 ⭐, +${totalExpGranted} EXP, +${coinsAdded} coins (Wallet: ${nextCoins}đ) • ${updatedPet.name} gained +${hungerAdded}% Fullness, +${happinessAdded}% Happiness, +${energyAdded}% Energy!`;

  return {
    nextPet: updatedPet,
    hungerAdded,
    happinessAdded,
    energyAdded,
    expAdded: totalExpGranted,
    coinsAdded,
    energyRestoredTo100,
    completedMealSlotNow,
    justHatched: justHatchedByStreak || justHatchedByStars,
    evolvedToStage,
    feedbackVi,
    feedbackEn
  };
}

/**
 * Xử lý nút "Xoa đầu" (Tối đa 30 lần/ngày, +2% Độ vui vẻ/lần & +5 EXP)
 */
export function handleDailyHeadPat(
  pet: VirtualPet,
  todayKey: string = getTodayKey(),
  maxStatCap: number = 100
): {
  allowed: boolean;
  nextPet: VirtualPet;
  happinessAdded: number;
  expAdded: number;
  evolvedToStage: PetLevelNumber | null;
  headPatCountToday: number;
  messageVi: string;
  messageEn: string;
} {
  const currentCount =
    pet.lastHeadPatDate === todayKey
      ? Math.max(0, Number(pet.headPatCountToday ?? 0))
      : 0;

  if (currentCount >= PET_RULES.HEAD_PAT_MAX_PER_DAY) {
    return {
      allowed: false,
      nextPet: {
        ...pet,
        lastHeadPatDate: todayKey,
        headPatCountToday: PET_RULES.HEAD_PAT_MAX_PER_DAY
      },
      happinessAdded: 0,
      expAdded: 0,
      evolvedToStage: null,
      headPatCountToday: PET_RULES.HEAD_PAT_MAX_PER_DAY,
      messageVi: `💖 Hôm nay bé đã xoa đầu khen ${pet.name} đủ ${PET_RULES.HEAD_PAT_MAX_PER_DAY}/${PET_RULES.HEAD_PAT_MAX_PER_DAY} lần (+60% Vui vẻ) rồi! Hãy làm nhiệm vụ các buổi để đạt 100% nhé!`,
      messageEn: `💖 You already patted ${pet.name} ${PET_RULES.HEAD_PAT_MAX_PER_DAY}/${PET_RULES.HEAD_PAT_MAX_PER_DAY} times today!`
    };
  }

  const nextCount = currentCount + 1;
  const effectiveHappiness =
    pet.happiness >= maxStatCap
      ? pet.happiness
      : Math.min(maxStatCap, clampPercent(pet.happiness + PET_RULES.HEAD_PAT_HAPPINESS_GAIN));
  const actualHappinessGain = Math.max(0, effectiveHappiness - pet.happiness);

  const draftPet: VirtualPet = {
    ...pet,
    happiness: effectiveHappiness,
    lastHeadPatDate: todayKey,
    headPatCountToday: nextCount
  };

  const { updatedPet, evolvedToStage, reached100BonusNow } = evaluatePetHatchAndEvolution(
    draftPet,
    PET_RULES.HEAD_PAT_EXP_GAIN,
    todayKey
  );

  const totalExpAdded =
    PET_RULES.HEAD_PAT_EXP_GAIN +
    (reached100BonusNow ? PET_RULES.DAILY_GOAL_100_BONUS_EXP : 0);

  const capNoteVi =
    maxStatCap < 100 && effectiveHappiness >= maxStatCap
      ? ' (Đạt trần 80% - Làm đủ 4 nhiệm vụ hoặc mở Rương Buổi để lên 100%!)'
      : '';
  const bonusText = reached100BonusNow
    ? ` 🏆 Nhận Cúp Vàng Chăm Hamster 100% (+${PET_RULES.DAILY_GOAL_100_BONUS_EXP} EXP)!`
    : '';

  return {
    allowed: true,
    nextPet: updatedPet,
    happinessAdded: actualHappinessGain,
    expAdded: totalExpAdded,
    evolvedToStage,
    headPatCountToday: nextCount,
    messageVi: `🐹 Chít chít ~ ${updatedPet.name} thích mê khi được bé xoa đầu (+${actualHappinessGain}% Vui vẻ, +${PET_RULES.HEAD_PAT_EXP_GAIN} EXP • Lượt ${nextCount}/${PET_RULES.HEAD_PAT_MAX_PER_DAY})${capNoteVi}!${bonusText}`,
    messageEn: `🐹 Squeak ~ ${updatedPet.name} loved your head pat (+${actualHappinessGain}% Happiness • ${nextCount}/${PET_RULES.HEAD_PAT_MAX_PER_DAY})!`
  };
}

/**
 * Xử lý nút "Cho ăn hạt (5 ⭐ • Tối đa 12 lần/ngày)":
 * - Dùng 5 Sao tích lũy mua Hạt Hướng Dương Vàng & Dâu Tây (trừ thẳng vào Sao tích lũy), giúp hồi +20% No bụng, +15% Vui vẻ, +10% Năng lượng!
 * - Giới hạn tối đa 12 lần/ngày (reset sau 0h). Level của linh thú được nuôi bằng điểm kinh nghiệm EXP của bé.
 */
export function handlePurchaseSpecialTreat(
  pet: VirtualPet,
  currentStars: number,
  nowMs: number = Date.now(),
  todayKey: string = getTodayKey()
): {
  allowed: boolean;
  nextStars: number;
  expAdded: number;
  nextPet: VirtualPet;
  justHatched: boolean;
  evolvedToStage: PetLevelNumber | null;
  messageVi: string;
  messageEn: string;
} {
  const currentFeedCount =
    pet.lastFeedDate === todayKey
      ? Math.max(0, Number(pet.feedCountToday ?? 0))
      : 0;

  if (currentFeedCount >= PET_RULES.FEED_MAX_PER_DAY) {
    return {
      allowed: false,
      nextStars: currentStars,
      expAdded: 0,
      nextPet: {
        ...pet,
        lastFeedDate: todayKey,
        feedCountToday: PET_RULES.FEED_MAX_PER_DAY
      },
      justHatched: false,
      evolvedToStage: null,
      messageVi: `🌻 Hôm nay bé đã cho ${pet.name} ăn đủ tối đa ${PET_RULES.FEED_MAX_PER_DAY}/${PET_RULES.FEED_MAX_PER_DAY} lần rồi! Bụng Hamster đã tròn xoe, hẹn bé ngày mai nhé!`,
      messageEn: `🌻 You have already fed ${pet.name} the maximum ${PET_RULES.FEED_MAX_PER_DAY}/${PET_RULES.FEED_MAX_PER_DAY} times today!`
    };
  }

  if (currentStars < PET_RULES.SPECIAL_TREAT_STAR_COST) {
    return {
      allowed: false,
      nextStars: currentStars,
      expAdded: 0,
      nextPet: pet,
      justHatched: false,
      evolvedToStage: null,
      messageVi: `⭐ Bé cần đủ ${PET_RULES.SPECIAL_TREAT_STAR_COST} Sao tích lũy để mua Hạt hướng dương cho ${pet.name} (Hiện có ${currentStars} ⭐). Bé hãy làm nhiệm vụ kiếm thêm Sao nhé!`,
      messageEn: `⭐ You need ${PET_RULES.SPECIAL_TREAT_STAR_COST} Stars to buy a special treat for ${pet.name}!`
    };
  }

  const nextFeedCount = currentFeedCount + 1;
  const nextStars = Math.max(0, currentStars - PET_RULES.SPECIAL_TREAT_STAR_COST);

  const draftPet: VirtualPet = {
    ...pet,
    hunger: clampPercent(pet.hunger + PET_RULES.SPECIAL_TREAT_HUNGER_GAIN),
    happiness: clampPercent(pet.happiness + PET_RULES.SPECIAL_TREAT_HAPPINESS_GAIN),
    energy: clampPercent(pet.energy + PET_RULES.SPECIAL_TREAT_ENERGY_GAIN),
    moodState: 'excited',
    excitedUntil: nowMs + 60 * 60 * 1000,
    lastSpecialTreatAt: nowMs,
    lastFeedDate: todayKey,
    feedCountToday: nextFeedCount
  };

  const {
    updatedPet,
    justHatchedByStreak,
    justHatchedByStars,
    evolvedToStage,
    reached100BonusNow
  } = evaluatePetHatchAndEvolution(
    draftPet,
    PET_RULES.SPECIAL_TREAT_EVOLUTION_XP,
    todayKey
  );

  const expAdded = reached100BonusNow ? PET_RULES.DAILY_GOAL_100_BONUS_EXP : 0;

  const bonusText = reached100BonusNow
    ? ` 🏆 Đạt 100% cả 3 chỉ số (+${PET_RULES.DAILY_GOAL_100_BONUS_EXP} EXP thưởng)!`
    : '';

  return {
    allowed: true,
    nextStars,
    expAdded,
    nextPet: updatedPet,
    justHatched: justHatchedByStreak || justHatchedByStars,
    evolvedToStage,
    messageVi: `🌻 Măm măm! Đã trừ ${PET_RULES.SPECIAL_TREAT_STAR_COST} ⭐ tích lũy (còn ${nextStars} ⭐) mua Hạt hướng dương cho ${updatedPet.name} (+${PET_RULES.SPECIAL_TREAT_HUNGER_GAIN}% No bụng, +${PET_RULES.SPECIAL_TREAT_HAPPINESS_GAIN}% Vui vẻ, +${PET_RULES.SPECIAL_TREAT_ENERGY_GAIN}% Năng lượng • Lần ${nextFeedCount}/${PET_RULES.FEED_MAX_PER_DAY})!${bonusText}`,
    messageEn: `🌻 Yum! Deducted ${PET_RULES.SPECIAL_TREAT_STAR_COST} ⭐ (remaining: ${nextStars} ⭐) for a Special Treat (+${PET_RULES.SPECIAL_TREAT_HUNGER_GAIN}% Fullness • ${nextFeedCount}/${PET_RULES.FEED_MAX_PER_DAY} today)!`
  };
}
