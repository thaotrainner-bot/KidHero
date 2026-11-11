import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Award,
  Apple,
  Heart,
  ChevronRight,
  Zap,
  Volume2,
  VolumeX,
  AlertTriangle,
  Camera,
  Upload,
  Check,
  X,
  Pencil,
  Sparkles,
  User,
  CheckCircle2,
  Lock,
  ShoppingBag,
  Crown,
  Clock,
  Star,
  Sun,
  Moon,
  Palette,
  Gift
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ChildProfile,
  DisciplineLog,
  Language,
  PetAccessoryId,
  PetPostureState,
  PetRoomTheme,
  PetSpecies
} from '../types';
import { translations } from '../utils/translations';
import {
  playClick,
  playSuccessChime,
  playEggCrackAndHatchSound,
  playFeedCrunchSound,
  playPetPurrBeepSound,
  speakText
} from '../utils/audio';
import { AVATAR_PRESETS, compressImageFileToDataUrl } from '../utils/avatars';
import {
  EGG_HATCH_TARGET_STARS,
  PET_EVOLUTION_STAGES,
  PET_ROOM_ACCESSORIES,
  MAGIC_EGG_SVG_URL,
  CRACKING_EGG_SVG_URL,
  PetAccessoryItem,
  getAutoUnlockedAccessoriesForLevel,
  getPetSpeciesMeta,
  getPetEvolutionInfo
} from '../utils/pets';

export type HamsterExpressionState = 'happy' | 'bored' | 'crying' | 'sleeping';

interface HeroBannerProps {
  profile: ChildProfile;
  language: Language;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  onToggleSound?: () => void;
  onFeedPet: () => { allowed: boolean; messageVi: string; messageEn: string } | void;
  onPetPet: () => { allowed: boolean; messageVi: string; messageEn: string } | void;
  onChangePetSpecies?: (species: PetSpecies, name: string, avatar: string) => void;
  onAddEggStars?: (addedStars: number) => void;
  onSetEvolutionStars?: (targetStars: number) => void;
  onBuyOrToggleAccessory?: (accessoryId: PetAccessoryId) => {
    ok: boolean;
    purchasedNew?: boolean;
    messageVi: string;
    messageEn: string;
  };
  onUseRoomAccessory?: (
    accessoryId: PetAccessoryId
  ) => { ok: boolean; messageVi: string; messageEn: string } | void;
  onChangeRoomTheme?: (theme: PetRoomTheme) => void;
  onResetEggCycle?: () => void;
  onOpenBadges: () => void;
  completedTasksCount: number;
  pendingTasksCount?: number;
  totalTasksCount: number;
  dailyGoalMessage?: string;
  disciplineLogs?: DisciplineLog[];
  onOpenDiscipline?: () => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
  onUpdateProfile?: (name: string, grade: string, avatar: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  profile,
  language,
  soundEnabled,
  voiceEnabled,
  onToggleSound,
  onFeedPet,
  onPetPet,
  onAddEggStars,
  onBuyOrToggleAccessory,
  onUseRoomAccessory,
  onChangeRoomTheme,
  onOpenBadges,
  completedTasksCount,
  pendingTasksCount = 0,
  totalTasksCount,
  dailyGoalMessage,
  disciplineLogs,
  onOpenDiscipline,
  onUpdateAvatar,
  onUpdateProfile
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAccessoryShopModal, setShowAccessoryShopModal] = useState(false);
  const [showPetRulesGuide, setShowPetRulesGuide] = useState(false);
  const [showRoomBuilderPanel, setShowRoomBuilderPanel] = useState(false);
  const [builderTierFilter, setBuilderTierFilter] = useState<'all' | 'wall' | 'middle' | 'floor' | 'wearable'>('all');
  const [shopGroupTab, setShopGroupTab] = useState<'all' | 'shop' | 'level' | 'stages20'>('all');
  const [accessoryShopNotice, setAccessoryShopNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [isCrackingEgg, setIsCrackingEgg] = useState(false);
  const [justHatchedToast, setJustHatchedToast] = useState<string | null>(null);
  const [petActionBubble, setPetActionBubble] = useState<string | null>(null);
  const [blinkingItemId, setBlinkingItemId] = useState<PetAccessoryId | null>(null);

  // Room interactive states & 4 Postures (Đứng, Ngồi, Nằm, Nhảy)
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [rainbowHouseGlowing, setRainbowHouseGlowing] = useState(false);
  const [roomLightingMode, setRoomLightingMode] = useState<'auto' | 'bright' | 'warm_sleep'>('auto');
  const [previewExpression, setPreviewExpression] = useState<HamsterExpressionState | null>(null);
  const [activePosture, setActivePosture] = useState<PetPostureState>(profile.pet.posture || 'standing');
  const [recentlycheeredUntil, setRecentlyCheeredUntil] = useState<number>(0);

  // Celebration modal for buying a shop item or unlocking a new level gift
  const [giftCelebration, setGiftCelebration] = useState<{
    titleVi: string;
    titleEn: string;
    subtitleVi: string;
    subtitleEn: string;
    items: PetAccessoryItem[];
  } | null>(null);

  const [petEffectMode, setPetEffectMode] = useState<'idle' | 'bounce' | 'spin' | 'rainbow' | 'hearts' | 'stars'>('idle');
  const [floatingParticles, setFloatingParticles] = useState<
    { id: number; emoji: string; label?: string; left: number }[]
  >([]);

  const triggerPetVisualEffect = (
    mode: 'bounce' | 'spin' | 'rainbow' | 'hearts' | 'stars',
    emojis: string[],
    label?: string
  ) => {
    setPetEffectMode(mode);
    const nowId = Date.now();
    const spawned = emojis.map((emoji, idx) => ({
      id: nowId + idx,
      emoji,
      label: idx === 0 ? label : undefined,
      left: 14 + ((idx * 19) % 72)
    }));
    setFloatingParticles(spawned);
    setTimeout(() => {
      setPetEffectMode('idle');
      setFloatingParticles([]);
    }, 2400);
  };

  const [nameInput, setNameInput] = useState(profile.name);
  const [gradeInput, setGradeInput] = useState(profile.grade);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  const t = translations[language];
  const rawProfileName = profile.name?.trim() || 'Cơ Minh';
  const heroName = rawProfileName.replace(/^(Hiệp\s+Sĩ\s+)+/i, '').trim() || 'Cơ Minh';
  const fullHeroTitle = /^Hiệp\s+Sĩ/i.test(rawProfileName)
    ? `Hiệp Sĩ ${heroName}`
    : rawProfileName;
  const completionPercent =
    totalTasksCount > 0 ? Math.min(100, Math.round((completedTasksCount / totalTasksCount) * 100)) : 0;
  const pendingPercent =
    totalTasksCount > 0
      ? Math.min(100 - completionPercent, Math.round((pendingTasksCount / totalTasksCount) * 100))
      : 0;
  const activeEffortCount = Math.min(totalTasksCount, completedTasksCount + pendingTasksCount);
  const activeEffortPercent =
    totalTasksCount > 0 ? Math.min(100, Math.round((activeEffortCount / totalTasksCount) * 100)) : 0;

  // Dedicated Cute Chubby Hamster Mascot across 20 Levels (Lv.1 -> Lv.20), raised directly by Child's EXP
  const currentPetMeta = getPetSpeciesMeta('hamster', profile.pet.name);
  const petDisplayName = language === 'vi' ? currentPetMeta.nameVi : currentPetMeta.nameEn;
  const rawPetExp = Math.max(
    0,
    Number(profile.currentXp) || 0,
    Number(profile.pet.exp ?? profile.pet.evolutionStars ?? profile.pet.eggStars ?? 0)
  );
  const eggStars = Math.min(EGG_HATCH_TARGET_STARS, rawPetExp);
  const isHatched = Boolean(profile.pet.isHatched || rawPetExp >= EGG_HATCH_TARGET_STARS || profile.pet.level >= 1);
  const eggProgressPercent = Math.min(100, Math.round((eggStars / EGG_HATCH_TARGET_STARS) * 100));

  const evolutionStars = isHatched ? Math.max(EGG_HATCH_TARGET_STARS, rawPetExp) : rawPetExp;
  const evolutionInfo = getPetEvolutionInfo(evolutionStars, isHatched);
  const xpPercent = evolutionInfo.progressPercent;

  // Combine saved unlocked accessories with automatic level gifts (up to Lv.20)
  const autoLevelGiftIds = getAutoUnlockedAccessoriesForLevel(evolutionInfo.level);
  const unlockedAccessories = Array.from(
    new Set<PetAccessoryId>([...(profile.pet.unlockedAccessories || []), ...autoLevelGiftIds])
  );
  const equippedAccessories =
    profile.pet.equippedAccessories && profile.pet.equippedAccessories.length > 0
      ? profile.pet.equippedAccessories
      : (['food_bowl', 'water_fountain', 'cute_bow'] as PetAccessoryId[]);

  // Detect when Hamster levels up and automatically celebrate newly unlocked level gifts
  const prevPetLevelRef = useRef<number>(evolutionInfo.level);
  useEffect(() => {
    if (evolutionInfo.level > prevPetLevelRef.current) {
      const prevLevel = prevPetLevelRef.current;
      prevPetLevelRef.current = evolutionInfo.level;
      const newGiftItems = PET_ROOM_ACCESSORIES.filter(
        (item) =>
          item.unlockMethod === 'level' &&
          item.requiredLevel > prevLevel &&
          item.requiredLevel <= evolutionInfo.level
      );
      if (newGiftItems.length > 0) {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.55 },
          zIndex: 9999
        });
        setGiftCelebration({
          titleVi: `🎉 Chúc mừng ${petDisplayName} thăng cấp Lv.${evolutionInfo.level}/20!`,
          titleEn: `🎉 ${petDisplayName} reached Lv.${evolutionInfo.level}/20!`,
          subtitleVi: `Tự động mở khóa và bày quà tặng cấp mới vào Phòng Hamster Mũm Mĩm:`,
          subtitleEn: `Automatically unlocked and placed new level gifts into your Hamster Room:`,
          items: newGiftItems
        });
      }
    } else {
      prevPetLevelRef.current = evolutionInfo.level;
    }
  }, [evolutionInfo.level, petDisplayName]);

  // Check equipped wearables & room items
  const isItemEquipped = (id: PetAccessoryId) => equippedAccessories.includes(id);
  const hasCuteBow = isItemEquipped('cute_bow');
  const hasScholarCap = isItemEquipped('scholar_cap') || evolutionInfo.level >= 4;
  const hasGoldenCrown = isItemEquipped('golden_crown') || isItemEquipped('diamond_crown') || evolutionInfo.level >= 10;
  const hasCoolSunglasses = isItemEquipped('hat_glasses');
  const unlockedVoiceCheer = evolutionInfo.hasVoiceCheerUnlocked;

  const activeRoomTheme: PetRoomTheme = profile.pet.roomTheme || 'warm_wood';

  // Calculate Room Comfort Score (Độ tiện nghi phòng) for Room Builder
  const roomComfortScore =
    100 +
    equippedAccessories.length * 25 +
    evolutionInfo.level * 15 +
    (activeRoomTheme !== 'warm_wood' ? 40 : 0);

  const roomRankTitle =
    roomComfortScore >= 600
      ? language === 'vi'
        ? '🪐 Cung Điện Ngân Hà Tối Thượng'
        : '🪐 Supreme Galaxy Palace'
      : roomComfortScore >= 420
      ? language === 'vi'
        ? '🏰 Biệt Thự Pha Lê Hoàng Gia'
        : '🏰 Royal Crystal Villa'
      : roomComfortScore >= 260
      ? language === 'vi'
        ? '🎓 Phòng Bác Học Cầu Vồng'
        : '🎓 Rainbow Scholar Room'
      : language === 'vi'
      ? '🏡 Phòng Gỗ Ấm Cúng'
      : '🏡 Cozy Wood Room';

  // Head pat limit: 30 times/day; Feed limit: 12 times/day
  const headPatCountToday =
    profile.pet.lastHeadPatDate === profile.lastActiveDate
      ? Math.min(30, Math.max(0, Number(profile.pet.headPatCountToday ?? 0)))
      : 0;
  const hasReachedHeadPatLimit = headPatCountToday >= 30;

  const feedCountToday =
    profile.pet.lastFeedDate === profile.lastActiveDate
      ? Math.min(12, Math.max(0, Number(profile.pet.feedCountToday ?? 0)))
      : 0;
  const hasReachedFeedLimit = feedCountToday >= 12;

  const petCoins = Math.max(0, Math.round(Number(profile.pet.coins ?? 760)));
  const sleepCountToday =
    profile.pet.lastSleepDate === profile.lastActiveDate
      ? Math.min(3, Math.max(0, Number(profile.pet.sleepCountToday ?? 0)))
      : 0;
  const hasUnlockedStatCap100 = completedTasksCount >= 4;
  const manualStatCap = hasUnlockedStatCap100 ? 100 : 80;

  const isPetExcited =
    (profile.pet.moodState === 'excited' &&
      (!profile.pet.excitedUntil || profile.pet.excitedUntil > Date.now())) ||
    recentlycheeredUntil > Date.now();
  const consecutiveHighStatDays = Math.min(3, Math.max(0, Number(profile.pet.consecutiveHighStatDays ?? 0)));
  const isDailyPetGoal100 =
    profile.pet.happiness >= 100 && profile.pet.energy >= 100 && profile.pet.hunger >= 100;

  const todayPenalties = (disciplineLogs || []).filter(
    (l) => l.date === profile.lastActiveDate && !l.forgiven
  );
  const latestForgivenToday = (disciplineLogs || []).find(
    (l) => l.date === profile.lastActiveDate && l.forgiven
  );

  const nowDate = new Date();
  const currentHour = nowDate.getHours();
  const currentMinute = nowDate.getMinutes();
  const isAfter20hNight = currentHour >= 20 || currentHour < 5;
  const isBedtimeAfter2130 =
    (currentHour === 21 && currentMinute >= 30) || currentHour >= 22 || currentHour < 5;

  // Automatic 4-state expression logic (Cười vui vẻ, Buồn chán, Khóc nhè, Buồn ngủ)
  const averageThreeStats = Math.round(
    (profile.pet.hunger + profile.pet.happiness + profile.pet.energy) / 3
  );

  const computedExpression: HamsterExpressionState = (() => {
    if (previewExpression) return previewExpression;
    if (wheelSpinning || activePosture === 'jumping') return 'happy';
    if (isBedtimeAfter2130 || roomLightingMode === 'warm_sleep') return 'sleeping';
    if (isPetExcited) return 'happy';
    if (
      profile.pet.hunger < 30 ||
      profile.pet.happiness < 30 ||
      todayPenalties.length > 0
    ) {
      return 'crying';
    }
    if (averageThreeStats >= 70) {
      return 'happy';
    }
    return 'bored';
  })();

  const currentSessionLabel =
    currentHour < 11
      ? language === 'vi'
        ? '🌅 Ca Sáng (+35% No • +30% Năng lượng)'
        : '🌅 Morning Session'
      : currentHour < 17
      ? language === 'vi'
        ? '☀️ Ca Trưa & Chiều (+30% No • +30% Vui)'
        : '☀️ Afternoon Session'
      : language === 'vi'
      ? '🌙 Ca Tối (+40% No • +40% Năng lượng)'
      : '🌙 Evening Session';

  const getAutomaticPetSpeechBubble = () => {
    if (petActionBubble) return petActionBubble;
    if (wheelSpinning) {
      return language === 'vi'
        ? `🎡 Một, hai, một, hai! Mình đang chạy tập thể dục trên Vòng xoay siêu tốc cùng Hiệp Sĩ ${heroName}!`
        : `🎡 One, two! Running fast on the exercise wheel with Hero ${heroName}!`;
    }
    if (activePosture === 'jumping') {
      return language === 'vi'
        ? `🤸 Yayyy! Nhảy cao thật vui! Hiệp Sĩ ${heroName} nhìn mình bật nhảy nè!`
        : `🤸 Yay! Jumping high with Hero ${heroName}!`;
    }
    if (activePosture === 'lying') {
      return language === 'vi'
        ? `🛌 Nằm dài trên đệm êm thích quá đi ~ Cảm ơn Hiệp Sĩ ${heroName} đã xây phòng đẹp cho mình!`
        : `🛌 Lying down on the cozy cushion feels amazing, Hero ${heroName}!`;
    }
    if (activePosture === 'sitting') {
      return language === 'vi'
        ? `🪑 Mình đang ngồi ngoan ôm hạt hướng dương chờ ${heroName} hoàn thành nhiệm vụ nè!`
        : `🪑 Sitting nicely with my sunflower seed waiting for Hero ${heroName}!`;
    }
    if (computedExpression === 'crying') {
      return language === 'vi'
        ? `😭 Hu hu, mình đói và buồn quá, Hiệp Sĩ ${heroName} cứu mình với!`
        : `😭 Boohoo, I'm so hungry and sad, Hero ${heroName} please help me!`;
    }
    if (computedExpression === 'sleeping') {
      return language === 'vi'
        ? `😴 Zzz... Đã đến giờ nghỉ ngơi rồi, Hiệp Sĩ ${heroName} ngủ ngon cùng mình nha!`
        : `😴 Zzz... Time for sweet dreams with Hero ${heroName}!`;
    }
    if (isDailyPetGoal100) {
      return language === 'vi'
        ? `🏆 Cúp Vàng Chăm Hamster 100%! Tuyệt vời quá ${heroName} ơi (+20 EXP)!`
        : `🏆 100% Gold Cup! All 3 stats reached 100% (+20 EXP)!`;
    }
    if (computedExpression === 'bored') {
      return language === 'vi'
        ? `😐 Hừm... Bụng và độ vui đang ở mức ${averageThreeStats}%, Hiệp Sĩ ${heroName} làm nhiệm vụ hoặc chơi với đồ trong phòng nhé!`
        : `😐 Hmm... My stats are at ${averageThreeStats}%. Complete a quest or tap items in my room!`;
    }
    return language === 'vi'
      ? `💖 Chít chít! Mình đang cười tươi rạng rỡ! Cùng làm nhiệm vụ tích Sao đổi quà lớn nha ${heroName}!`
      : `💖 Squeak! I'm smiling bright! Let's earn stars together, ${heroName}!`;
  };

  const getDailyGoalMotivation = () => {
    if (completionPercent >= 100 && totalTasksCount > 0) {
      return language === 'vi'
        ? `🎉 Tuyệt đỉnh! ${heroName} đã hoàn thành 100% mục tiêu hôm nay!`
        : `🎉 Amazing! ${heroName} completed 100% of today's goal!`;
    }
    if (activeEffortPercent >= 75) {
      return language === 'vi'
        ? `🚀 Sắp về đích! Chỉ còn ${Math.max(0, totalTasksCount - activeEffortCount)} việc nữa thôi!`
        : `🚀 Almost there! Just ${Math.max(0, totalTasksCount - activeEffortCount)} quests left!`;
    }
    if (activeEffortPercent >= 50) {
      return language === 'vi'
        ? `🌟 Đã qua nửa chặng đường hôm nay rồi! Tiếp tục phát huy nhé!`
        : `🌟 Over halfway through today's goal! Keep shining!`;
    }
    return language === 'vi'
      ? `✨ Hoàn thành việc & thử thách để tích Sao đổi quà lớn và nuôi ${petDisplayName} lên Lv.20 nhé!`
      : `✨ Complete quests & challenges to save up stars and raise ${petDisplayName} to Lv.20!`;
  };

  const handlePetGreeting = () => {
    playSuccessChime(soundEnabled);
    if (voiceEnabled) {
      const greeting =
        language === 'vi'
          ? `Chào Hiệp Sĩ ${heroName}! Hôm nay bé đã sẵn sàng chinh phục các nhiệm vụ tự lập chưa? ${petDisplayName} rất yêu bé!`
          : `Hello Hero ${heroName}! Are you ready to conquer today quests?`;
      speakText(greeting, language, voiceEnabled);
    }
  };

  const fireHatchConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 85,
      origin: { y: 0.55 },
      colors: ['#fbbf24', '#f59e0b', '#10b981', '#ec4899', '#38bdf8', '#a855f7'],
      zIndex: 9999
    });
  };

  const handleIncubateStep = (starsToAdd: number) => {
    if (!onAddEggStars || isCrackingEgg) return;
    const nextEggStars = Math.min(EGG_HATCH_TARGET_STARS, eggStars + starsToAdd);

    if (nextEggStars >= EGG_HATCH_TARGET_STARS && !isHatched) {
      setIsCrackingEgg(true);
      playEggCrackAndHatchSound(soundEnabled);

      setTimeout(() => {
        onAddEggStars(starsToAdd);
        setIsCrackingEgg(false);
        fireHatchConfetti();
        const msg =
          language === 'vi'
            ? `🎉 Quả Trứng Ma Thuật đã nở ra ${petDisplayName}! Chúc mừng Hiệp Sĩ ${heroName}!`
            : `🎉 The Magic Egg hatched into ${petDisplayName}! Congratulations!`;
        setJustHatchedToast(msg);
        setTimeout(() => setJustHatchedToast(null), 5000);

        if (voiceEnabled) {
          speakText(msg, language, voiceEnabled);
        }
      }, 950);
    } else {
      playClick(soundEnabled);
      onAddEggStars(starsToAdd);
    }
  };

  // Switch Hamster Posture (Đứng, Ngồi, Nằm, Nhảy) with fun visual effects
  const handleSelectPosture = (posture: PetPostureState) => {
    playPetPurrBeepSound(soundEnabled);
    setActivePosture(posture);
    setRecentlyCheeredUntil(Date.now() + 6000);

    if (posture === 'jumping') {
      triggerPetVisualEffect('bounce', ['🤸', '⭐', '✨', '💨', '🎉'], 'Nhảy cao siêu đỉnh!');
      setPetActionBubble(
        language === 'vi'
          ? `🤸 Hura! ${petDisplayName} bật nhảy cao tràn đầy năng lượng cùng Hiệp Sĩ ${heroName}!`
          : `🤸 Hooray! ${petDisplayName} is jumping high with energy!`
      );
    } else if (posture === 'sitting') {
      triggerPetVisualEffect('hearts', ['🪑', '🌻', '💖', '📚'], 'Ngồi ngoan!');
      setPetActionBubble(
        language === 'vi'
          ? `🪑 ${petDisplayName} ngồi ngoan trên thảm ôm hạt hướng dương ngắm ${heroName}!`
          : `🪑 ${petDisplayName} is sitting nicely on the rug!`
      );
    } else if (posture === 'lying') {
      triggerPetVisualEffect('stars', ['🛌', '☁️', '💤', '💕'], 'Nằm thư giãn!');
      setPetActionBubble(
        language === 'vi'
          ? `🛌 Êm quá đi ~ ${petDisplayName} nằm dài thư giãn trên đệm bông ấm áp!`
          : `🛌 So cozy ~ ${petDisplayName} is lying down relaxing!`
      );
    } else {
      triggerPetVisualEffect('stars', ['🧍', '🐹', '✨', '🌟'], 'Đứng chào Hiệp Sĩ!');
      setPetActionBubble(
        language === 'vi'
          ? `🧍 ${petDisplayName} đứng nghiêm trang vẫy tay chào Hiệp Sĩ ${heroName}!`
          : `🧍 ${petDisplayName} is standing tall and waving at Hero ${heroName}!`
      );
    }
    setTimeout(() => setPetActionBubble(null), 3800);
  };

  // Interactive Room Item Handler (Automatically triggers matching posture & enforces 5đ Quick Care / Stat Cap!)
  const handleInteractWithRoomObject = (itemId: PetAccessoryId) => {
    const meta = PET_ROOM_ACCESSORIES.find((a) => a.id === itemId);
    if (!meta) return;

    setBlinkingItemId(itemId);
    setTimeout(() => setBlinkingItemId(null), 1100);
    const careRes = onUseRoomAccessory?.(itemId);

    if (careRes && typeof careRes === 'object' && !careRes.ok) {
      setPetActionBubble(language === 'vi' ? careRes.messageVi : careRes.messageEn);
      setTimeout(() => setPetActionBubble(null), 4500);
      return;
    }

    const customSuccessBubble =
      careRes && typeof careRes === 'object'
        ? language === 'vi'
          ? careRes.messageVi
          : careRes.messageEn
        : null;

    // Automatically switch posture based on furniture type
    if (itemId === 'cozy_bed' || itemId === 'rainbow_cloud_bed' || itemId === 'camping_tent') {
      setActivePosture('lying');
    } else if (
      itemId === 'mini_study_desk' ||
      itemId === 'mini_bookshelf' ||
      itemId === 'food_bowl' ||
      itemId === 'cosmic_throne'
    ) {
      setActivePosture('sitting');
    } else if (
      itemId === 'hamster_wheel' ||
      itemId === 'toy_ball' ||
      itemId === 'mini_skateboard' ||
      itemId === 'mini_guitar'
    ) {
      setActivePosture('jumping');
    }

    if (itemId === 'hamster_wheel') {
      playPetPurrBeepSound(soundEnabled);
      setWheelSpinning(true);
      setRecentlyCheeredUntil(Date.now() + 8000);
      triggerPetVisualEffect('bounce', ['🎡', '💨', '⚡', '💪', '⭐'], '-5đ • +10% Vui vẻ!');
      setPetActionBubble(
        customSuccessBubble ||
          (language === 'vi'
            ? `🎡 Vòng xoay quay tít 3 giây! ${petDisplayName} chạy tập thể dục siêu khỏe (-5đ • +10% Vui vẻ)!`
            : `🎡 Wheel spinning for 3 seconds! ${petDisplayName} is exercising (+10% Happiness)!`)
      );
      setTimeout(() => {
        setWheelSpinning(false);
      }, 3000);
      setTimeout(() => setPetActionBubble(null), 4200);
      return;
    }

    if (itemId === 'rainbow_house' || itemId === 'crystal_castle' || itemId === 'cosmic_throne') {
      playSuccessChime(soundEnabled);
      setRainbowHouseGlowing(true);
      setRecentlyCheeredUntil(Date.now() + 8000);
      confetti({
        particleCount: 35,
        spread: 65,
        origin: { y: 0.55 },
        colors: ['#f43f5e', '#fbbf24', '#34d399', '#38bdf8', '#a855f7']
      });
      triggerPetVisualEffect('rainbow', ['🌈', '✨', '⭐', '🌟', meta.emoji], `${meta.nameVi} lấp lánh!`);
      setPetActionBubble(
        customSuccessBubble ||
          (language === 'vi'
            ? `🌈 Oa! ${meta.nameVi} phát sáng lấp lánh 7 sắc cầu vồng và bay đầy sao nhỏ!`
            : `🌈 Wow! ${meta.nameEn} is glowing with rainbow stars!`)
      );
      setTimeout(() => setRainbowHouseGlowing(false), 3000);
      setTimeout(() => setPetActionBubble(null), 4000);
      return;
    }

    if (itemId === 'food_bowl' || itemId === 'water_fountain' || itemId === 'nut_robot') {
      playFeedCrunchSound(soundEnabled);
      setRecentlyCheeredUntil(Date.now() + 8000);
      const effectLabel =
        itemId === 'water_fountain'
          ? '-5đ • +10% Năng lượng!'
          : itemId === 'food_bowl'
          ? '-5đ • +10% No bụng!'
          : `+${meta.statBoostAmount}% No bụng!`;
      triggerPetVisualEffect('hearts', ['💖', '💕', '🌻', '💧', '🥰'], effectLabel);
      setPetActionBubble(
        customSuccessBubble ||
          (language === 'vi'
            ? `${meta.emoji} Nhăm nhăm! ${petDisplayName} thưởng thức ${meta.nameVi} 💖!`
            : `${meta.emoji} Yum! ${petDisplayName} enjoyed ${meta.nameEn} 💖!`)
      );
      setTimeout(() => setPetActionBubble(null), 4200);
      return;
    }

    if (itemId === 'glowing_desk_lamp' || itemId === 'star_projector' || itemId === 'star_lamp') {
      playClick(soundEnabled);
      const nextMode =
        roomLightingMode === 'warm_sleep'
          ? 'bright'
          : roomLightingMode === 'bright'
          ? 'auto'
          : 'warm_sleep';
      setRoomLightingMode(nextMode);
      triggerPetVisualEffect('stars', ['💡', '🌙', '✨', '⭐'], 'Đổi ánh sáng phòng!');
      setPetActionBubble(
        language === 'vi'
          ? nextMode === 'warm_sleep'
            ? `🌙 Đã bật ánh sáng vàng ấm dịu nhẹ chuẩn bị đi ngủ!`
            : nextMode === 'bright'
            ? `☀️ Đã bật ánh sáng ban ngày rực rỡ học tập!`
            : `✨ Đã chuyển ánh sáng phòng về chế độ tự động theo giờ!`
          : `💡 Switched room lighting mode!`
      );
      setTimeout(() => setPetActionBubble(null), 3800);
      return;
    }

    playPetPurrBeepSound(soundEnabled);
    setRecentlyCheeredUntil(Date.now() + 8000);
    triggerPetVisualEffect('bounce', [meta.emoji, '💖', '✨', '🌟'], meta.nameVi);
    setPetActionBubble(
      customSuccessBubble ||
        (language === 'vi'
          ? `${meta.emoji} ${petDisplayName} thích mê khi tương tác với ${meta.nameVi}!`
          : `${meta.emoji} ${petDisplayName} loved playing with ${meta.nameEn}!`)
    );
    setTimeout(() => setPetActionBubble(null), 3800);
  };

  // Toggle Window Lighting Mode
  const handleToggleWindowLighting = () => {
    playClick(soundEnabled);
    const nextMode =
      roomLightingMode === 'auto'
        ? 'warm_sleep'
        : roomLightingMode === 'warm_sleep'
        ? 'bright'
        : 'auto';
    setRoomLightingMode(nextMode);
    triggerPetVisualEffect(
      'stars',
      nextMode === 'warm_sleep' ? ['🌙', '⭐', '💤'] : ['☀️', '🌻', '✨'],
      nextMode === 'warm_sleep' ? 'Đèn vàng ấm đi ngủ' : 'Ánh sáng rực rỡ'
    );
    setPetActionBubble(
      language === 'vi'
        ? nextMode === 'warm_sleep'
          ? '🌙 Bấm Cửa sổ: Đã chuyển sang ánh sáng vàng ấm đi ngủ!'
          : nextMode === 'bright'
          ? '☀️ Bấm Cửa sổ: Đã bật ánh sáng ban ngày tươi sáng!'
          : '🌤️ Bấm Cửa sổ: Tự động đổi cảnh theo giờ thực tế!'
        : '🪟 Toggled room window lighting!'
    );
    setTimeout(() => setPetActionBubble(null), 3500);
  };

  // Handle Shop Buy or Toggle with Celebration Gift Popup
  const handleShopOrTrayItemAction = (item: PetAccessoryItem, openCelebrationOnBuy: boolean = true) => {
    if (!onBuyOrToggleAccessory) return;
    const wasUnlocked = unlockedAccessories.includes(item.id);
    const res = onBuyOrToggleAccessory(item.id);
    setAccessoryShopNotice({
      ok: res.ok,
      text: language === 'vi' ? res.messageVi : res.messageEn
    });

    if (res.ok && !wasUnlocked && openCelebrationOnBuy) {
      confetti({
        particleCount: 75,
        spread: 75,
        origin: { y: 0.55 },
        zIndex: 9999
      });
      setGiftCelebration({
        titleVi: `🎁 Mở Hộp Quà Thành Công: ${item.nameVi}!`,
        titleEn: `🎁 Gift Unlocked: ${item.nameEn}!`,
        subtitleVi: `Món đồ đã được tự động bày vào Phòng Hamster Mũm Mĩm cho Hiệp Sĩ ${heroName}!`,
        subtitleEn: `Automatically placed inside your Chubby Hamster Room!`,
        items: [item]
      });
    }
  };

  const todayStarsEarned = Math.max(0, Number(profile.dailyStarsEarned ?? 0));

  // Determine Room Background Style based on 10 Room Themes (Lv.1 -> Lv.30) & Lighting Mode
  const isWarmNightLighting =
    roomLightingMode === 'warm_sleep' || (roomLightingMode === 'auto' && isAfter20hNight);

  const roomWallStyleClass = isWarmNightLighting
    ? 'bg-gradient-to-b from-slate-900 via-indigo-950 to-amber-950/90 border-amber-400/50 shadow-[inset_0_0_50px_rgba(251,191,36,0.22)]'
    : activeRoomTheme === 'garden_nature'
    ? 'bg-gradient-to-b from-emerald-300/45 via-lime-200/30 to-emerald-950/60 border-emerald-300/70'
    : activeRoomTheme === 'scholar_blue'
    ? 'bg-gradient-to-b from-sky-200/45 via-blue-300/30 to-indigo-900/45 border-sky-300/60'
    : activeRoomTheme === 'rainbow_dream'
    ? 'bg-gradient-to-b from-pink-300/45 via-amber-200/35 to-emerald-400/35 border-pink-300/70 ring-2 ring-amber-300/50'
    : activeRoomTheme === 'royal_palace'
    ? 'bg-gradient-to-b from-amber-300/50 via-yellow-200/35 to-purple-950/65 border-amber-300 ring-2 ring-yellow-300/60'
    : activeRoomTheme === 'cosmic_galaxy'
    ? 'bg-gradient-to-b from-indigo-950 via-purple-900/80 to-fuchsia-950 border-cyan-300/70 ring-2 ring-fuchsia-400/50 shadow-[inset_0_0_40px_rgba(56,189,248,0.25)]'
    : activeRoomTheme === 'coral_ocean'
    ? 'bg-gradient-to-b from-cyan-400/45 via-teal-500/35 to-blue-950/75 border-cyan-300/80 ring-2 ring-teal-300/50'
    : activeRoomTheme === 'magic_castle'
    ? 'bg-gradient-to-b from-purple-400/45 via-fuchsia-500/35 to-indigo-950/80 border-fuchsia-300/80 ring-2 ring-purple-300/50'
    : activeRoomTheme === 'future_space'
    ? 'bg-gradient-to-b from-slate-900 via-cyan-950/85 to-indigo-950 border-cyan-400/80 ring-2 ring-sky-400/50 shadow-[inset_0_0_40px_rgba(34,211,238,0.28)]'
    : activeRoomTheme === 'golden_dragon'
    ? 'bg-gradient-to-b from-amber-400/55 via-red-600/35 to-amber-950/85 border-amber-300 ring-2 ring-yellow-300/70 shadow-[inset_0_0_45px_rgba(251,191,36,0.3)]'
    : 'bg-gradient-to-b from-amber-100/35 via-orange-200/25 to-amber-900/45 border-amber-300/60';

  const windowScene =
    roomLightingMode === 'warm_sleep' || (roomLightingMode === 'auto' && isAfter20hNight)
      ? {
          bg: 'from-slate-900 via-indigo-950 to-purple-950',
          icon: '🌙',
          subIcon: '⭐',
          labelVi: 'Trăng sao (>20h)',
          labelEn: 'Starry Night'
        }
      : roomLightingMode === 'auto' && currentHour >= 16 && currentHour < 20
      ? {
          bg: 'from-orange-400 via-rose-400 to-purple-700',
          icon: '🌇',
          subIcon: '☁️',
          labelVi: 'Hoàng hôn chiều',
          labelEn: 'Sunset'
        }
      : {
          bg: 'from-sky-300 via-cyan-200 to-emerald-200',
          icon: '☀️',
          subIcon: '🌻',
          labelVi: 'Nắng vàng ban ngày',
          labelEn: 'Sunny Day'
        };

  const ROOM_THEME_OPTIONS: {
    id: PetRoomTheme;
    labelVi: string;
    labelEn: string;
    unlockLevel: number;
  }[] = [
    { id: 'warm_wood', labelVi: '🪵 Gỗ Ấm', labelEn: '🪵 Wood', unlockLevel: 1 },
    { id: 'garden_nature', labelVi: '🌿 Vườn Hạt Dẻ', labelEn: '🌿 Garden', unlockLevel: 2 },
    { id: 'scholar_blue', labelVi: '📘 Bác Học', labelEn: '📘 Scholar', unlockLevel: 4 },
    { id: 'rainbow_dream', labelVi: '🌈 Cầu Vồng', labelEn: '🌈 Rainbow', unlockLevel: 6 },
    { id: 'royal_palace', labelVi: '👑 Hoàng Gia', labelEn: '👑 Royal', unlockLevel: 10 },
    { id: 'cosmic_galaxy', labelVi: '🪐 Ngân Hà', labelEn: '🪐 Galaxy', unlockLevel: 15 },
    { id: 'coral_ocean', labelVi: '🌊 Đại Dương San Hô', labelEn: '🌊 Coral Ocean', unlockLevel: 19 },
    { id: 'magic_castle', labelVi: '🔮 Lâu Đài Phép Thuật', labelEn: '🔮 Magic Castle', unlockLevel: 22 },
    { id: 'future_space', labelVi: '🚀 Trạm Vũ Trụ Tương Lai', labelEn: '🚀 Future Space', unlockLevel: 25 },
    { id: 'golden_dragon', labelVi: '🐉 Cung Điện Rồng Vàng Thần Thoại', labelEn: '🐉 Golden Dragon Palace', unlockLevel: 28 }
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-800 text-white rounded-3xl p-3 sm:p-4 shadow-xl shadow-indigo-900/15 mb-4 transition-all relative overflow-hidden">
      {/* Background ambient shapes */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-300/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-pink-400/15 rounded-full blur-2xl pointer-events-none" />

      {/* iPad Landscape 2-Column Widescreen Grid (60% Left = 7 cols / 40% Right = 5 cols, gap-4) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* ==============================================================
            CỘT BÊN TRÁI (60% màn hình - lg:col-span-7): CĂN PHÒNG HAMSTER TOÀN CẢNH
           ============================================================== */}
        <div className="lg:col-span-7 bg-gradient-to-b from-amber-500/20 via-pink-500/15 to-indigo-950/45 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border-2 border-amber-300/40 flex flex-col justify-between space-y-2 relative shadow-lg">
          {/* 1. THANH TRẠNG THÁI TRÊN CÙNG CỦA PHÒNG (Xếp gọn trên 1 hàng ngang duy nhất):
              Gồm Cấp độ (Lv.14/20), thanh EXP, số xu/điểm phòng (760đ), nút âm thanh và thông báo Ca Trưa & Chiều */}
          <div className="relative">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 bg-black/35 px-2.5 py-1.5 rounded-xl border border-amber-300/35 flex-wrap xl:flex-nowrap">
              {/* Level Badge */}
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1 shadow-2xs shrink-0">
                <Crown className="w-3 h-3 text-amber-900 shrink-0" />
                <span>Lv.{evolutionInfo.level}/30</span>
              </span>

              {/* Inline EXP Progress Bar */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[130px] max-w-[240px]">
                <div className="flex-1 h-2.5 bg-black/50 rounded-full overflow-hidden p-0.5 border border-amber-300/40">
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-300 rounded-full transition-all duration-500"
                    style={{ width: `${isHatched ? evolutionInfo.progressPercent : eggProgressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-black text-amber-200 whitespace-nowrap shrink-0">
                  {evolutionStars}/{evolutionInfo.nextThreshold} EXP
                </span>
              </div>

              {/* Pet Coin Wallet (Ví xu nuôi thú: +15đ/nhiệm vụ, tốn 5đ/lần Chăm sóc nhanh) */}
              <button
                type="button"
                onClick={() => {
                  playClick(soundEnabled);
                  setShowRoomBuilderPanel(true);
                }}
                title={
                  language === 'vi'
                    ? 'Ví tiền xu nuôi thú của bé (+15đ mỗi nhiệm vụ hoàn thành • Dùng 5đ/lần Chăm Sóc Nhanh)'
                    : 'Pet Care Coin Wallet (+15đ per quest • 5đ per Quick Care)'
                }
                className="px-2 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400 text-amber-200 hover:text-slate-950 border border-amber-300/50 text-[10px] font-mono font-black flex items-center gap-1 shrink-0 transition-all cursor-pointer"
              >
                <span>🪙</span>
                <span>{petCoins}đ</span>
              </button>

              {/* Session Notice (Ca Sáng / Ca Trưa & Chiều / Ca Tối) */}
              <span className="text-[10px] font-extrabold text-amber-100 bg-white/10 px-2 py-0.5 rounded-lg border border-white/15 truncate max-w-[200px] shrink-0">
                {currentSessionLabel}
              </span>

              {/* Sound Toggle + (?) Rules Help */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleSound?.()}
                  title={
                    soundEnabled
                      ? language === 'vi'
                        ? 'Đang bật âm thanh (Bấm để tắt)'
                        : 'Mute sound'
                      : language === 'vi'
                      ? 'Đang tắt âm thanh (Bấm để bật)'
                      : 'Unmute sound'
                  }
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                    soundEnabled
                      ? 'bg-amber-400/20 text-amber-200 border-amber-300/40 hover:bg-amber-400/30'
                      : 'bg-slate-900/50 text-slate-400 border-white/10'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setShowPetRulesGuide((prev) => !prev);
                  }}
                  title={
                    language === 'vi'
                      ? 'Xem công thức nuôi Hamster 20 cấp, 4 tư thế, Xoa đầu 30 lần & Cho ăn 12 lần/ngày'
                      : 'View 20-Level Hamster Care Formula'
                  }
                  className={`w-6 h-6 rounded-full font-black text-[11px] flex items-center justify-center border transition-all cursor-pointer shadow-xs ${
                    showPetRulesGuide
                      ? 'bg-amber-400 text-slate-950 border-white scale-105'
                      : 'bg-white/20 hover:bg-amber-400 text-white hover:text-slate-950 border-white/30'
                  }`}
                >
                  ?
                </button>
              </div>
            </div>

            {/* Popover Bảng Thông Tin Cơ Chế Nuôi Hamster 20 Cấp (Hiện ra khi bấm vào dấu ?) */}
            {showPetRulesGuide && (
              <div className="absolute inset-x-0 top-10 bg-slate-950/95 border border-amber-300/50 rounded-2xl p-3 text-[11px] space-y-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-40">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {language === 'vi'
                        ? 'Cơ chế nuôi Chuột Hamster 20 Cấp độ • 4 Tư thế • Xây dựng phòng:'
                        : '20-Level Hamster Care • 4 Postures • Room Builder:'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPetRulesGuide(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-[10px] text-indigo-100">
                  <div className="bg-white/10 rounded-xl px-2.5 py-1.5 border border-white/10 leading-snug">
                    🤸 <strong className="text-amber-300">4 Tư thế toàn thân & 4 Biểu cảm:</strong>{' '}
                    {language === 'vi'
                      ? 'Bé có thể bấm chọn cho Hamster Đứng, Ngồi, Nằm dài trên đệm hoặc Bật Nhảy cao! Bấm vào đồ vật trong phòng cũng tự động đổi tư thế.'
                      : 'Switch between Standing, Sitting, Lying down, and Jumping postures anytime!'}
                  </div>
                  <div className="bg-white/10 rounded-xl px-2.5 py-1.5 border border-white/10 leading-snug">
                    💖 <strong className="text-pink-300">Xoa đầu 30 lần/ngày & Cho ăn 12 lần/ngày:</strong>{' '}
                    {language === 'vi'
                      ? 'Mỗi ngày bé được Xoa đầu tối đa 30 lần (+2% Vui vẻ & +5 EXP/lần) và Cho ăn hạt hướng dương tối đa 12 lần/ngày (5 ⭐/lần).'
                      : 'Up to 30 Head Pats/day (+2% Happy & +5 EXP each) and up to 12 Feeds/day (5 ⭐ each).'}
                  </div>
                  <div className="bg-white/10 rounded-xl px-2.5 py-1.5 border border-white/10 leading-snug">
                    🏗️ <strong className="text-emerald-300">Tiến hóa 20 Cấp & Xây dựng 6 Chủ đề phòng:</strong>{' '}
                    {language === 'vi'
                      ? 'Đạt Lv.1 -> Lv.20 mở khóa miễn phí Thác nước hạt dẻ, Kính thiên văn, Đệm mây, Robot hạt dẻ, Ngai vàng Vũ Trụ & 6 kiến trúc phòng!'
                      : 'Reach Lv.1 -> Lv.20 to unlock Mini Waterfall, Star Telescope, Cloud Bed, Nut Robot, Cosmic Throne & 6 room themes!'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. CĂN PHÒNG HAMSTER TOÀN CẢNH (PANORAMIC WIDESCREEN ROOM SCENE) */}
          <div
            className={`relative rounded-2xl border-2 overflow-hidden min-h-[345px] sm:min-h-[365px] flex-1 flex flex-col justify-between p-2.5 sm:p-3 transition-all duration-500 shadow-inner ${roomWallStyleClass}`}
          >
            {/* Warm Sleep / Starlight Ambient Glow Overlay */}
            {isWarmNightLighting && (
              <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-indigo-950/50 via-amber-500/10 to-amber-950/40" />
            )}

            {/* Cosmic Galaxy Stars Overlay when Cosmic Theme is active */}
            {activeRoomTheme === 'cosmic_galaxy' && (
              <div className="absolute inset-0 pointer-events-none z-0 opacity-60 flex justify-around items-start pt-6 text-xs">
                <span className="animate-pulse">✨</span>
                <span className="animate-bounce" style={{ animationDuration: '3s' }}>🪐</span>
                <span className="animate-pulse">⭐</span>
                <span className="animate-bounce" style={{ animationDuration: '2.5s' }}>🌌</span>
              </div>
            )}

            {/* Wallpaper Subtle Vertical Stripes for Depth */}
            <div
              className="absolute inset-x-0 top-0 bottom-20 pointer-events-none opacity-15 z-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.28) 0px, rgba(255,255,255,0.28) 2px, transparent 2px, transparent 28px)'
              }}
            />

            {/* Floating Reaction Particles Overlay */}
            {floatingParticles.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                {floatingParticles.map((p) => (
                  <div
                    key={p.id}
                    style={{ left: `${p.left}%`, bottom: '34%' }}
                    className="absolute animate-bounce flex flex-col items-center drop-shadow-md"
                  >
                    <span className="text-xl sm:text-2xl">{p.emoji}</span>
                    {p.label && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-white whitespace-nowrap shadow">
                        {p.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ==============================================================
                TƯỜNG PHÍA TRÊN + OVERLAY 3 THANH CHỈ SỐ SỨC KHỎE Ở GÓC TRÊN BÊN TRÁI + BONG BÓNG LỜI THOẠI
               ============================================================== */}
            <div className="relative z-20 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                {/* GÓC TRÊN BÊN TRÁI: Cửa sổ nắng vàng + Cụm 3 thanh chỉ số sức khỏe gắn nổi (Overlay) */}
                <div className="flex flex-col sm:flex-row items-start gap-1.5">
                  {/* Cửa sổ nắng vàng (bấm đổi đèn ngày/đêm) */}
                  <button
                    type="button"
                    onClick={handleToggleWindowLighting}
                    title={
                      language === 'vi'
                        ? 'Cửa sổ thông minh: Bấm vào để đổi ánh sáng phòng (Sáng rõ / Vàng ấm đi ngủ)!'
                        : 'Interactive Window: Tap to switch room lighting!'
                    }
                    className="group relative flex items-center gap-1.5 px-2 py-1 rounded-2xl bg-gradient-to-b border-2 border-amber-200/80 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer overflow-hidden shrink-0"
                    style={{
                      backgroundImage: isWarmNightLighting
                        ? 'linear-gradient(to bottom, #0f172a, #312e81)'
                        : currentHour >= 16 && currentHour < 20
                        ? 'linear-gradient(to bottom, #fb923c, #be185d)'
                        : 'linear-gradient(to bottom, #38bdf8, #bae6fd)'
                    }}
                  >
                    <div className="relative w-8 h-8 rounded-lg border-2 border-amber-100/90 flex items-center justify-center bg-black/15 overflow-hidden shrink-0">
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-amber-100/60" />
                      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-amber-100/60" />
                      <span className="text-sm relative z-10 drop-shadow">{windowScene.icon}</span>
                      <span className="text-[8px] absolute top-0 right-0">{windowScene.subIcon}</span>
                    </div>
                    <div className="text-left pr-0.5">
                      <div className="text-[9px] font-black text-white drop-shadow leading-tight">
                        {language === 'vi' ? windowScene.labelVi : windowScene.labelEn}
                      </div>
                      <div className="text-[8px] font-bold text-amber-200 flex items-center gap-0.5">
                        {isWarmNightLighting ? (
                          <>
                            <Moon className="w-2.5 h-2.5" />
                            <span>{language === 'vi' ? 'Đèn ngủ ấm' : 'Sleep'}</span>
                          </>
                        ) : (
                          <>
                            <Sun className="w-2.5 h-2.5" />
                            <span>{language === 'vi' ? 'Đổi đèn' : 'Light'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* OVERLAY CỤM 3 THANH CHỈ SỐ SỨC KHỎE (Độ vui vẻ, Năng lượng, No bụng) GẮN NỔI Ở GÓC TRÊN BÊN TRÁI */}
                  <div className="bg-slate-950/75 backdrop-blur-md border border-amber-300/45 rounded-xl px-2.5 py-1.5 shadow-lg w-[168px] sm:w-[184px] space-y-1">
                    {/* Độ vui vẻ */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] shrink-0">💖</span>
                      <span className="text-[9px] font-extrabold text-pink-200 w-12 truncate">
                        {language === 'vi' ? 'Vui vẻ' : 'Happy'}
                      </span>
                      <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-400 to-amber-300 rounded-full transition-all duration-300"
                          style={{ width: `${profile.pet.happiness}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-black text-amber-300 w-7 text-right tabular-nums">
                        {profile.pet.happiness}%
                      </span>
                    </div>

                    {/* Năng lượng */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] shrink-0">⚡</span>
                      <span className="text-[9px] font-extrabold text-emerald-200 w-12 truncate">
                        {language === 'vi' ? 'Năng lượng' : 'Energy'}
                      </span>
                      <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-300"
                          style={{ width: `${profile.pet.energy}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-black text-emerald-300 w-7 text-right tabular-nums">
                        {profile.pet.energy}%
                      </span>
                    </div>

                    {/* No bụng */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] shrink-0">🥣</span>
                      <span className="text-[9px] font-extrabold text-sky-200 w-12 truncate">
                        {language === 'vi' ? 'No bụng' : 'Full'}
                      </span>
                      <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-cyan-300 rounded-full transition-all duration-300"
                          style={{ width: `${profile.pet.hunger}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-black text-sky-300 w-7 text-right tabular-nums">
                        {profile.pet.hunger}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* GÓC TRÊN BÊN PHẢI: Đồng hồ treo tường (12:04) và các huy hiệu nhỏ */}
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {/* Đồng hồ treo tường */}
                  <button
                    type="button"
                    onClick={() => handleInteractWithRoomObject('wall_clock')}
                    title={
                      language === 'vi'
                        ? 'Đồng hồ treo tường: Nhắc bé học tập & sinh hoạt đúng giờ!'
                        : 'Wall Clock: Keep routine on time!'
                    }
                    className={`px-2 py-1 rounded-xl border flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-90 ${
                      isItemEquipped('wall_clock')
                        ? 'bg-amber-500/40 hover:bg-amber-500/55 border-amber-300 text-white'
                        : 'bg-slate-950/60 hover:bg-slate-900/75 border-white/25 text-amber-100'
                    }`}
                  >
                    <span className="text-sm leading-none">🕰️</span>
                    <span className="text-[10px] font-mono font-black">
                      {nowDate.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </button>

                  {/* Kệ sách gỗ thông thái */}
                  <button
                    type="button"
                    onClick={() => handleInteractWithRoomObject('mini_bookshelf')}
                    title={
                      language === 'vi'
                        ? 'Kệ sách gỗ thông thái: Bấm vào để Hamster ngồi đọc sách tăng vui vẻ!'
                        : 'Wise Wooden Bookshelf: Tap to read!'
                    }
                    className={`px-2 py-1 rounded-xl border flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-90 ${
                      isItemEquipped('mini_bookshelf')
                        ? 'bg-amber-900/75 hover:bg-amber-800/85 border-amber-300/80 text-amber-100'
                        : 'bg-amber-950/45 hover:bg-amber-900/60 border-white/25 text-white/85'
                    } ${blinkingItemId === 'mini_bookshelf' ? 'ring-2 ring-amber-300 scale-110' : ''}`}
                  >
                    <span className="text-sm leading-none">📚</span>
                    <span className="text-[9px] font-extrabold hidden xl:inline">
                      {language === 'vi' ? 'Kệ sách' : 'Books'}
                    </span>
                  </button>

                  {/* Kính thiên văn ngắm sao (Lv.14) */}
                  {isItemEquipped('star_telescope') && (
                    <button
                      type="button"
                      onClick={() => handleInteractWithRoomObject('star_telescope')}
                      title={
                        language === 'vi'
                          ? 'Kính thiên văn ngắm sao (Lv.14): Bấm để ngắm dải ngân hà!'
                          : 'Starlight Telescope: Tap to stargaze!'
                      }
                      className="px-2 py-1 rounded-xl bg-sky-900/80 hover:bg-sky-800 border border-amber-300/80 text-amber-200 flex items-center gap-1 shadow cursor-pointer active:scale-90"
                    >
                      <span className="text-sm leading-none">🔭</span>
                    </button>
                  )}

                  {/* Máy chiếu sao đêm */}
                  {isItemEquipped('star_projector') && (
                    <button
                      type="button"
                      onClick={() => handleInteractWithRoomObject('star_projector')}
                      title={
                        language === 'vi'
                          ? 'Máy chiếu sao đêm: Bấm để bật/tắt bầu trời sao lung linh!'
                          : 'Night Star Projector: Tap to project stars!'
                      }
                      className="px-2 py-1 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 border border-cyan-300/70 text-cyan-200 flex items-center gap-1 shadow cursor-pointer active:scale-90"
                    >
                      <span className="text-sm leading-none animate-pulse">🔮</span>
                    </button>
                  )}

                  {/* Huy hiệu nhỏ cấp độ & phòng */}
                  <span className="px-2 py-1 rounded-xl bg-slate-950/60 border border-amber-300/40 text-[9px] font-extrabold text-amber-200 flex items-center gap-1">
                    <span>🏅</span>
                    <span className="hidden sm:inline">
                      {language === 'vi'
                        ? evolutionInfo.meta.titleVi.replace(/^Lv\.\d+:\s*/, '')
                        : evolutionInfo.meta.titleEn}
                    </span>
                  </span>
                </div>
              </div>

              {/* Bong bóng lời thoại gọn phía trên đầu Hamster (Đã chuẩn hóa không lặp chữ Hiệp Sĩ) */}
              <div className="mx-auto max-w-[92%] w-full flex flex-col items-center">
                <div className="bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white px-3 py-1 rounded-2xl shadow-md border-2 border-amber-300/90 text-[11px] font-bold text-center leading-snug relative flex items-center justify-center gap-1.5 flex-wrap">
                  {isDailyPetGoal100 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] border border-white shadow-2xs shrink-0">
                      🏆 Cúp Vàng 100%
                    </span>
                  )}
                  <span className="line-clamp-2">{getAutomaticPetSpeechBubble()}</span>
                  <div className="w-2.5 h-2.5 bg-white dark:bg-slate-900 border-r-2 border-b-2 border-amber-300/90 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2" />
                </div>
              </div>
            </div>

            {/* ==============================================================
                SÀN PHÒNG Ở GIỮA (DÀN NGANG CÂN ĐỐI TRÊN MẶT SÀN, KHÔNG XẾP CHỒNG DỌC):
                - Bên trái Hamster (col-span-4): Đặt Nhà cầu vồng và Đĩa hạt cạnh nhau trên mặt sàn
                - Chính giữa (col-span-4): Chuột Hamster đứng to, rõ nét ngay trung tâm
                - Bên phải Hamster (col-span-4): Đặt Vòng chạy và Bình nước cạnh nhau trên mặt sàn
               ============================================================== */}
            <div className="relative z-10 grid grid-cols-12 items-end gap-1 my-0.5 flex-1 min-h-[185px]">
              {/* BÊN TRÁI HAMSTER TRÊN SÀN (4 cols): NHÀ CẦU VỒNG & ĐĨA HẠT ĐẶT CẠNH NHAU NGANG */}
              <div className="col-span-4 flex flex-col items-center justify-end gap-1 pb-1">
                {/* Extra Left Floor/Middle Unlocked Badges (nếu có) */}
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {(
                    [
                      'cozy_bed',
                      'camping_tent',
                      'crystal_castle',
                      'rainbow_cloud_bed',
                      'cosmic_throne',
                      'toy_ball',
                      'mini_guitar',
                      'nut_robot'
                    ] as PetAccessoryId[]
                  )
                    .filter((id) => isItemEquipped(id))
                    .slice(0, 4)
                    .map((id) => {
                      const item = PET_ROOM_ACCESSORIES.find((a) => a.id === id);
                      if (!item) return null;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleInteractWithRoomObject(item.id)}
                          title={language === 'vi' ? `${item.nameVi}: Bấm để tương tác!` : item.nameEn}
                          className="px-1.5 py-0.5 rounded-lg bg-white/25 hover:bg-amber-400/40 border border-white/40 flex items-center gap-0.5 shadow transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                        >
                          <span className="text-xs leading-none">{item.emoji}</span>
                        </button>
                      );
                    })}
                </div>

                {/* Hàng ngang trên mặt sàn bên trái: Nhà cầu vồng + Đĩa hạt */}
                <div className="flex items-end justify-center gap-1.5 w-full">
                  {/* 1. Nhà cầu vồng */}
                  <button
                    type="button"
                    onClick={() => handleInteractWithRoomObject('rainbow_house')}
                    title={
                      language === 'vi'
                        ? 'Nhà cầu vồng: Bấm vào để phát sáng lấp lánh nhiều màu và bay các ngôi sao nhỏ!'
                        : 'Rainbow House: Tap for rainbow glow & flying stars!'
                    }
                    className={`group relative flex-1 max-w-[82px] rounded-2xl p-1 border-2 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md ${
                      rainbowHouseGlowing
                        ? 'bg-gradient-to-b from-pink-400/80 via-amber-300/80 to-emerald-400/80 border-white ring-4 ring-amber-300 scale-105'
                        : isItemEquipped('rainbow_house')
                        ? 'bg-gradient-to-b from-rose-400/45 via-amber-300/35 to-indigo-900/60 hover:from-rose-400/65 border-amber-200/80'
                        : 'bg-black/25 hover:bg-black/40 border-white/25 opacity-85'
                    }`}
                  >
                    {rainbowHouseGlowing && (
                      <div className="absolute -top-3 inset-x-0 flex justify-around text-xs animate-bounce pointer-events-none">
                        <span>⭐</span>
                        <span>✨</span>
                        <span>🌟</span>
                      </div>
                    )}
                    <svg viewBox="0 0 80 72" className="w-11 h-10 sm:w-13 sm:h-11 drop-shadow">
                      <path d="M8 34 Q40 4 72 34" fill="none" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
                      <path d="M12 36 Q40 10 68 36" fill="none" stroke="#fbbf24" strokeWidth="4.5" strokeLinecap="round" />
                      <path d="M16 38 Q40 15 64 38" fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
                      <path d="M20 40 Q40 20 60 40" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
                      <rect x="18" y="34" width="44" height="34" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="2.5" />
                      <path d="M31 68 V48 A9 9 0 0 1 49 48 V68 Z" fill="#fb7185" stroke="#be123c" strokeWidth="2" />
                      <circle cx="40" cy="41" r="3.5" fill="#fde047" />
                    </svg>
                    <span className="text-[8px] sm:text-[9px] font-black text-white drop-shadow truncate max-w-full">
                      {language === 'vi' ? 'Nhà cầu vồng' : 'Rainbow'}
                    </span>
                  </button>

                  {/* 2. Đĩa hạt (Đặt cân đối trên sàn cạnh Nhà cầu vồng) */}
                  <button
                    type="button"
                    onClick={() => handleInteractWithRoomObject('food_bowl')}
                    title={
                      language === 'vi'
                        ? 'Đĩa hạt hướng dương: Bấm vào để Hamster ngồi thưởng thức hạt (+No bụng)!'
                        : 'Seed Bowl: Tap to feed (+Fullness)!'
                    }
                    className={`group relative flex-1 max-w-[74px] rounded-2xl p-1 border-2 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md ${
                      isItemEquipped('food_bowl')
                        ? 'bg-gradient-to-b from-amber-400/45 to-amber-900/65 hover:from-amber-400/65 border-amber-200/85'
                        : 'bg-black/25 hover:bg-black/40 border-white/25 opacity-85'
                    }`}
                  >
                    <svg viewBox="0 0 64 52" className="w-10 h-9 sm:w-11 sm:h-10 drop-shadow">
                      {/* Sunflower Seeds Pile */}
                      <ellipse cx="24" cy="22" rx="5" ry="3.5" transform="rotate(-20 24 22)" fill="#78350f" stroke="#fef3c7" strokeWidth="1.2" />
                      <ellipse cx="32" cy="19" rx="5.5" ry="3.5" fill="#92400e" stroke="#fde68a" strokeWidth="1.2" />
                      <ellipse cx="40" cy="22" rx="5" ry="3.5" transform="rotate(20 40 22)" fill="#78350f" stroke="#fef3c7" strokeWidth="1.2" />
                      <ellipse cx="28" cy="25" rx="5" ry="3" fill="#b45309" stroke="#fef3c7" strokeWidth="1" />
                      <ellipse cx="36" cy="25" rx="5" ry="3" fill="#b45309" stroke="#fef3c7" strokeWidth="1" />
                      {/* Ceramic Food Bowl */}
                      <path d="M10 25 H54 L48 44 Q32 48 16 44 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2.5" strokeLinejoin="round" />
                      <ellipse cx="32" cy="25" rx="22" ry="4" fill="#fde68a" stroke="#b45309" strokeWidth="2" />
                      <path d="M25 35 L32 39 L39 35" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-[8px] sm:text-[9px] font-black text-white drop-shadow truncate max-w-full">
                      {language === 'vi' ? 'Đĩa hạt' : 'Seeds'}
                    </span>
                  </button>
                </div>
              </div>

              {/* CHÍNH GIỮA SÀN PHÒNG (4 cols): CHUỘT HAMSTER ĐỨNG TO, RÕ NÉT NGAY TRUNG TÂM */}
              <div className="col-span-4 flex flex-col items-center justify-end relative">
                {/* Ambient Expression Badges Floating Around Hamster */}
                {computedExpression === 'happy' && !wheelSpinning && (
                  <div className="absolute -top-2 inset-x-4 flex justify-between pointer-events-none z-20">
                    <span className="text-sm animate-bounce" style={{ animationDuration: '1.5s' }}>
                      💖
                    </span>
                    <span className="text-sm animate-bounce" style={{ animationDuration: '1.9s' }}>
                      💕
                    </span>
                  </div>
                )}

                {computedExpression === 'bored' && (
                  <div className="absolute -top-3 right-4 z-20 px-2 py-0.5 rounded-full bg-slate-900/85 border border-amber-300/60 text-amber-200 font-black text-xs animate-pulse pointer-events-none">
                    ...
                  </div>
                )}

                {computedExpression === 'crying' && (
                  <div className="absolute bottom-14 -right-2 z-20 px-2 py-0.5 rounded-full bg-rose-600/95 border border-white text-white font-black text-[10px] animate-bounce pointer-events-none shadow">
                    ùng ục ~ 💧
                  </div>
                )}

                {(computedExpression === 'sleeping' || activePosture === 'lying') && (
                  <div className="absolute -top-3 right-3 z-20 flex flex-col items-end animate-pulse pointer-events-none">
                    <span className="text-xs font-black text-amber-200">
                      {activePosture === 'lying' && computedExpression !== 'sleeping' ? 'Êm quá ~' : 'Zzz...'}
                    </span>
                    <span className="text-sm">{activePosture === 'lying' ? '☁️' : '💤'}</span>
                  </div>
                )}

                {!isHatched ? (
                  <button
                    type="button"
                    onClick={() => handleIncubateStep(10)}
                    className="relative group focus:outline-none cursor-pointer my-2"
                  >
                    <div
                      className={`w-32 h-40 rounded-3xl overflow-hidden border-3 border-amber-300 shadow-2xl bg-indigo-950 flex items-center justify-center transition-transform ${
                        isCrackingEgg
                          ? 'scale-110 rotate-6 ring-4 ring-amber-300'
                          : 'hover:scale-105 animate-bounce'
                      }`}
                    >
                      <img
                        src={isCrackingEgg ? CRACKING_EGG_SVG_URL : MAGIC_EGG_SVG_URL}
                        alt="Quả Trứng Ma Thuật"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] font-mono border border-white shadow whitespace-nowrap">
                      🥚 {eggStars}/{EGG_HATCH_TARGET_STARS} EXP ({consecutiveHighStatDays}/3 ngày)
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playSuccessChime(soundEnabled);
                      setRecentlyCheeredUntil(Date.now() + 8000);
                      setPreviewExpression(null);
                      confetti({
                        particleCount: 35,
                        spread: 60,
                        origin: { y: 0.55 }
                      });
                      triggerPetVisualEffect(
                        'rainbow',
                        ['🐹', '🌻', '💖', '✨', '🎓'],
                        `${petDisplayName} yêu ${heroName}!`
                      );
                      const cheerMsg =
                        language === 'vi'
                          ? `🐹 Chít chít! Hamster Bác Học Mũm Mĩm (Lv.${evolutionInfo.level}/20) vẫy tay cổ vũ Hiệp Sĩ ${heroName}!`
                          : `🐹 Squeak! Scholar Chubby Hamster waves to cheer Hero ${heroName}!`;
                      setPetActionBubble(cheerMsg);
                      setTimeout(() => setPetActionBubble(null), 4000);
                      if (voiceEnabled || unlockedVoiceCheer) {
                        speakText(
                          language === 'vi' ? currentPetMeta.cheerVi : currentPetMeta.cheerEn,
                          language,
                          true
                        );
                      }
                    }}
                    title={
                      language === 'vi'
                        ? 'Bấm vào Chuột Hamster toàn thân để xem nhún nhảy, vẫy tay & nghe cổ vũ!'
                        : 'Tap Full-Body Chubby Hamster for happy bounce & cheer!'
                    }
                    className={`relative group focus:outline-none cursor-pointer transition-all duration-300 flex flex-col items-center ${
                      wheelSpinning || activePosture === 'jumping'
                        ? 'animate-bounce -translate-y-2 scale-105'
                        : computedExpression === 'crying'
                        ? 'animate-pulse'
                        : computedExpression === 'happy' || petEffectMode === 'bounce'
                        ? 'animate-bounce'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      animationDuration: wheelSpinning
                        ? '0.35s'
                        : activePosture === 'jumping'
                        ? '0.55s'
                        : petEffectMode === 'bounce'
                        ? '0.6s'
                        : computedExpression === 'happy'
                        ? '2.2s'
                        : undefined
                    }}
                  >
                    {/* FULL-BODY VERTICAL HAMSTER SVG (3:4 aspect ratio, height 170px - 185px) WITH 4 POSTURES */}
                    <svg
                      viewBox="0 0 180 240"
                      className="w-[134px] h-[178px] sm:w-[140px] sm:h-[186px] drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)] overflow-visible"
                    >
                      <defs>
                        <linearGradient id="hamsterBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="55%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="bellyCreamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#fffbeb" />
                          <stop offset="100%" stopColor="#fef3c7" />
                        </linearGradient>
                      </defs>

                      {/* Special Cozy Pillow & Blanket when Hamster is in LYING posture (🛌 Nằm) */}
                      {activePosture === 'lying' && (
                        <g>
                          <ellipse
                            cx="90"
                            cy="204"
                            rx="74"
                            ry="22"
                            fill="#f472b6"
                            stroke="#fff"
                            strokeWidth="2.5"
                          />
                          <ellipse cx="42" cy="194" rx="22" ry="14" fill="#fde047" stroke="#f59e0b" strokeWidth="2" />
                        </g>
                      )}

                      {/* Special Spring Jump Lines & Shadow when Hamster is in JUMPING posture (🤸 Nhảy) */}
                      {activePosture === 'jumping' && (
                        <g>
                          <ellipse cx="90" cy="228" rx="34" ry="6" fill="#000000" opacity="0.25" />
                          <path
                            d="M72 222 Q90 202 108 222"
                            fill="none"
                            stroke="#fde047"
                            strokeWidth="3"
                            strokeDasharray="4 3"
                            strokeLinecap="round"
                          />
                          <text x="20" y="55" fontSize="16">⭐</text>
                          <text x="145" y="55" fontSize="16">✨</text>
                        </g>
                      )}

                      {/* Main Hamster Full Body Group — Transforms smoothly for Standing, Sitting, Lying, Jumping */}
                      <g
                        transform={
                          activePosture === 'lying'
                            ? 'translate(92, 166) rotate(-62) scale(0.88) translate(-90, -140)'
                            : activePosture === 'sitting'
                            ? 'translate(0, 12) scale(1, 0.94)'
                            : activePosture === 'jumping'
                            ? 'translate(0, -18)'
                            : undefined
                        }
                      >
                        {/* 1. FLUFFY ROUND HAMSTER EARS */}
                        <g>
                          <circle cx="48" cy="60" r="20" fill="url(#hamsterBodyGrad)" stroke="#92400e" strokeWidth="3" />
                          <circle cx="48" cy="60" r="12" fill="#fda4af" />
                          <circle cx="132" cy="60" r="20" fill="url(#hamsterBodyGrad)" stroke="#92400e" strokeWidth="3" />
                          <circle cx="132" cy="60" r="12" fill="#fda4af" />
                        </g>

                        {/* 2. PLUMP FULL-BODY TORSO & ROUND BELLY */}
                        <path
                          d={
                            activePosture === 'sitting'
                              ? 'M38 128 C26 154, 28 204, 52 214 C72 222, 108 222, 128 214 C152 204, 154 154, 142 128 Z'
                              : 'M44 128 C34 150, 36 198, 56 212 C72 220, 108 220, 124 212 C144 198, 146 150, 136 128 Z'
                          }
                          fill="url(#hamsterBodyGrad)"
                          stroke="#92400e"
                          strokeWidth="3.2"
                        />
                        {/* Big Round Marshmallow Belly (Bụng tròn mũm mĩm) */}
                        <ellipse
                          cx="90"
                          cy="172"
                          rx={activePosture === 'sitting' ? 41 : 37}
                          ry="38"
                          fill="url(#bellyCreamGrad)"
                          stroke="#fde68a"
                          strokeWidth="2"
                        />

                        {/* Belly Rumble Lines when Crying/Hungry */}
                        {computedExpression === 'crying' && (
                          <g stroke="#e11d48" strokeWidth="2" fill="none" strokeLinecap="round">
                            <path d="M66 172 Q72 167 78 172 T90 172" />
                            <path d="M90 180 Q96 175 102 180 T114 180" />
                          </g>
                        )}

                        {/* 3. CHUBBY HEAD & PUFFY CHEEKS */}
                        <path
                          d="M36 96 C32 62, 56 42, 90 42 C124 42, 148 62, 144 96 C152 118, 134 138, 90 138 C46 138, 28 118, 36 96 Z"
                          fill="url(#hamsterBodyGrad)"
                          stroke="#92400e"
                          strokeWidth="3.2"
                        />
                        {/* Puffy Cream Cheek Pouches */}
                        <ellipse cx="48" cy="108" rx="22" ry="18" fill="#fffbeb" />
                        <ellipse cx="132" cy="108" rx="22" ry="18" fill="#fffbeb" />
                        <ellipse cx="90" cy="98" rx="44" ry="33" fill="#fffbeb" />

                        {/* Golden Forehead Fur Blaze */}
                        <path d="M62 49 Q90 80 118 49 Q104 42 90 42 Q76 42 62 49 Z" fill="#f59e0b" />

                        {/* Rosy Pink Blushing Cheeks */}
                        <ellipse
                          cx="52"
                          cy="106"
                          rx="11"
                          ry="7"
                          fill="#fb7185"
                          opacity={computedExpression === 'happy' ? '0.85' : '0.45'}
                        />
                        <ellipse
                          cx="128"
                          cy="106"
                          rx="11"
                          ry="7"
                          fill="#fb7185"
                          opacity={computedExpression === 'happy' ? '0.85' : '0.45'}
                        />

                        {/* 4. DYNAMIC 4-STATE FACIAL EXPRESSIONS */}
                        {computedExpression === 'happy' && (
                          <g>
                            <circle cx="68" cy="88" r="8.5" fill="#1e1b4b" />
                            <circle cx="65.5" cy="85" r="3.2" fill="#ffffff" />
                            <circle cx="71" cy="91" r="1.5" fill="#ffffff" />
                            <path
                              d="M103 88 Q112 78 121 88"
                              fill="none"
                              stroke="#1e1b4b"
                              strokeWidth="4"
                              strokeLinecap="round"
                            />
                            <path
                              d="M119 84 L124 81"
                              stroke="#1e1b4b"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            <path d="M81 105 Q90 117 99 105 Z" fill="#f43f5e" />
                            <path d="M84 108 Q90 115 96 108 Z" fill="#fda4af" />
                            <path
                              d="M78 103 Q84 109 90 103 Q96 109 102 103"
                              fill="none"
                              stroke="#78350f"
                              strokeWidth="2.8"
                              strokeLinecap="round"
                            />
                          </g>
                        )}

                        {computedExpression === 'bored' && (
                          <g>
                            <circle cx="68" cy="90" r="7.5" fill="#1e1b4b" />
                            <rect x="59" y="81" width="18" height="8" fill="#fef3c7" />
                            <line x1="59" y1="89" x2="77" y2="89" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />

                            <circle cx="112" cy="90" r="7.5" fill="#1e1b4b" />
                            <rect x="103" y="81" width="18" height="8" fill="#fef3c7" />
                            <line x1="103" y1="89" x2="121" y2="89" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />

                            <line x1="81" y1="108" x2="99" y2="108" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
                          </g>
                        )}

                        {computedExpression === 'crying' && (
                          <g>
                            <circle cx="68" cy="89" r="8.5" fill="#1e1b4b" />
                            <circle cx="66" cy="86" r="3" fill="#ffffff" />
                            <circle cx="71" cy="92" r="2" fill="#38bdf8" />
                            <circle cx="112" cy="89" r="8.5" fill="#1e1b4b" />
                            <circle cx="110" cy="86" r="3" fill="#ffffff" />
                            <circle cx="115" cy="92" r="2" fill="#38bdf8" />

                            <path d="M58 80 Q66 76 74 82" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M122 80 Q114 76 106 82" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />

                            <path
                              d="M64 97 C60 105, 60 116, 65 118 C70 116, 70 105, 64 97 Z"
                              fill="#38bdf8"
                              stroke="#0284c7"
                              strokeWidth="1.2"
                            />
                            <path
                              d="M116 97 C112 105, 112 116, 117 118 C122 116, 122 105, 116 97 Z"
                              fill="#38bdf8"
                              stroke="#0284c7"
                              strokeWidth="1.2"
                            />

                            <path
                              d="M79 112 Q85 104 90 108 Q95 104 101 112"
                              fill="none"
                              stroke="#78350f"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          </g>
                        )}

                        {computedExpression === 'sleeping' && (
                          <g>
                            <path
                              d="M59 89 Q68 97 77 89"
                              fill="none"
                              stroke="#78350f"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M103 89 Q112 97 121 89"
                              fill="none"
                              stroke="#78350f"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                            />
                            <ellipse cx="90" cy="108" rx="4.5" ry="3.5" fill="#fb7185" stroke="#78350f" strokeWidth="2" />
                          </g>
                        )}

                        {/* Cute Pink Nose & Whiskers */}
                        <ellipse cx="90" cy="96" rx="5.5" ry="4" fill="#fb7185" stroke="#e11d48" strokeWidth="1.2" />
                        <line x1="22" y1="100" x2="38" y2="102" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
                        <line x1="20" y1="108" x2="37" y2="108" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
                        <line x1="158" y1="100" x2="142" y2="102" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
                        <line x1="160" y1="108" x2="143" y2="108" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />

                        {/* Optional Cool Sunglasses (Kính râm siêu ngầu) */}
                        {hasCoolSunglasses && computedExpression !== 'sleeping' && (
                          <g>
                            <rect x="52" y="79" width="32" height="17" rx="4" fill="#0f172a" stroke="#fbbf24" strokeWidth="2.5" />
                            <rect x="96" y="79" width="32" height="17" rx="4" fill="#0f172a" stroke="#fbbf24" strokeWidth="2.5" />
                            <line x1="84" y1="86" x2="96" y2="86" stroke="#fbbf24" strokeWidth="3" />
                            <line x1="56" y1="83" x2="64" y2="91" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                            <line x1="100" y1="83" x2="108" y2="91" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                          </g>
                        )}

                        {/* 5. CUTE BOW ON COLLAR (Cổ đeo nơ xinh) */}
                        {hasCuteBow && (
                          <g transform="translate(90, 136)">
                            <path d="M-18 -8 L0 0 L-18 8 Z" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
                            <path d="M18 -8 L0 0 L18 8 Z" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
                            <circle cx="0" cy="0" r="5" fill="#fbbf24" stroke="#be123c" strokeWidth="1.5" />
                          </g>
                        )}

                        {/* 6. TWO PAWS & SUNFLOWER SEED ON BELLY (Adapts to Jumping / Bored / Normal) */}
                        {activePosture === 'jumping' ? (
                          /* Raised Cheering Paws when Jumping */
                          <g>
                            <ellipse
                              cx="38"
                              cy="132"
                              rx="12"
                              ry="8.5"
                              transform="rotate(-48 38 132)"
                              fill="#fde68a"
                              stroke="#b45309"
                              strokeWidth="2.5"
                            />
                            <ellipse
                              cx="142"
                              cy="132"
                              rx="12"
                              ry="8.5"
                              transform="rotate(48 142 132)"
                              fill="#fde68a"
                              stroke="#b45309"
                              strokeWidth="2.5"
                            />
                            {/* Golden Star on Belly when Jumping */}
                            <polygon
                              points="90,154 94,164 105,164 96,171 99,181 90,175 81,181 84,171 75,164 86,164"
                              fill="#fbbf24"
                              stroke="#b45309"
                              strokeWidth="1.8"
                            />
                          </g>
                        ) : computedExpression === 'bored' || computedExpression === 'crying' ? (
                          /* Drooping arms when bored or crying */
                          <g>
                            <ellipse
                              cx="54"
                              cy="168"
                              rx="11"
                              ry="8"
                              transform="rotate(35 54 168)"
                              fill="#fde68a"
                              stroke="#b45309"
                              strokeWidth="2.5"
                            />
                            <ellipse
                              cx="126"
                              cy="168"
                              rx="11"
                              ry="8"
                              transform="rotate(-35 126 168)"
                              fill="#fde68a"
                              stroke="#b45309"
                              strokeWidth="2.5"
                            />
                          </g>
                        ) : (
                          /* Holding Sunflower Seed / Chestnut on Plump Belly & Waving */
                          <g>
                            <path
                              d="M90 152 C77 152, 75 178, 90 185 C105 178, 103 152, 90 152 Z"
                              fill="#334155"
                              stroke="#fbbf24"
                              strokeWidth="2.2"
                            />
                            <line x1="90" y1="155" x2="90" y2="181" stroke="#f8fafc" strokeWidth="2.2" strokeLinecap="round" />
                            <circle cx="101" cy="174" r="8.5" fill="#92400e" stroke="#fef3c7" strokeWidth="1.8" />
                            <path d="M95 178 Q101 182 107 178" fill="#fde68a" />

                            <ellipse
                              cx="73"
                              cy="166"
                              rx="11"
                              ry="8"
                              transform="rotate(18 73 166)"
                              fill="#fde68a"
                              stroke="#b45309"
                              strokeWidth="2.5"
                            />
                            <ellipse
                              cx="109"
                              cy="164"
                              rx="11"
                              ry="8"
                              transform="rotate(-22 109 164)"
                              fill="#fde68a"
                              stroke="#b45309"
                              strokeWidth="2.5"
                            />
                          </g>
                        )}

                        {/* 7. TWO FEET (Splayed cute toe-beans when Sitting, Leaping when Jumping, Standing on rug otherwise) */}
                        {activePosture === 'sitting' ? (
                          <g>
                            <ellipse
                              cx="52"
                              cy="208"
                              rx="16"
                              ry="12"
                              transform="rotate(-20 52 208)"
                              fill="#fecdd3"
                              stroke="#e11d48"
                              strokeWidth="2.2"
                            />
                            <circle cx="52" cy="210" r="4" fill="#fb7185" />
                            <circle cx="46" cy="204" r="2.2" fill="#fb7185" />
                            <circle cx="52" cy="202" r="2.2" fill="#fb7185" />
                            <circle cx="58" cy="204" r="2.2" fill="#fb7185" />

                            <ellipse
                              cx="128"
                              cy="208"
                              rx="16"
                              ry="12"
                              transform="rotate(20 128 208)"
                              fill="#fecdd3"
                              stroke="#e11d48"
                              strokeWidth="2.2"
                            />
                            <circle cx="128" cy="210" r="4" fill="#fb7185" />
                            <circle cx="122" cy="204" r="2.2" fill="#fb7185" />
                            <circle cx="128" cy="202" r="2.2" fill="#fb7185" />
                            <circle cx="134" cy="204" r="2.2" fill="#fb7185" />
                          </g>
                        ) : (
                          <g>
                            <ellipse cx="66" cy="215" rx="16" ry="9" fill="#fecdd3" stroke="#e11d48" strokeWidth="2.2" />
                            <circle cx="66" cy="216" r="3.5" fill="#fb7185" />
                            <circle cx="60" cy="212" r="2" fill="#fb7185" />
                            <circle cx="66" cy="210.5" r="2" fill="#fb7185" />
                            <circle cx="72" cy="212" r="2" fill="#fb7185" />

                            <ellipse cx="114" cy="215" rx="16" ry="9" fill="#fecdd3" stroke="#e11d48" strokeWidth="2.2" />
                            <circle cx="114" cy="216" r="3.5" fill="#fb7185" />
                            <circle cx="108" cy="212" r="2" fill="#fb7185" />
                            <circle cx="114" cy="210.5" r="2" fill="#fb7185" />
                            <circle cx="120" cy="212" r="2" fill="#fb7185" />
                          </g>
                        )}

                        {/* 8. HEADWEAR: GRADUATION CAP (Mũ bác học thông thái) OR GOLDEN CROWN */}
                        {hasGoldenCrown ? (
                          <g transform="translate(90, 26)">
                            <polygon
                              points="-26,18 -20,-4 -8,8 0,-10 8,8 20,-4 26,18"
                              fill="#fbbf24"
                              stroke="#b45309"
                              strokeWidth="2.5"
                              strokeLinejoin="round"
                            />
                            <circle cx="0" cy="-10" r="3.5" fill="#38bdf8" />
                            <circle cx="-20" cy="-4" r="3" fill="#f43f5e" />
                            <circle cx="20" cy="-4" r="3" fill="#34d399" />
                          </g>
                        ) : hasScholarCap ? (
                          <g transform="translate(90, 28)">
                            <polygon
                              points="0,-14 42,2 0,16 -42,2"
                              fill="#1e1b4b"
                              stroke="#fbbf24"
                              strokeWidth="2.5"
                            />
                            <path
                              d="M-22,7 V19 C-22,24 22,24 22,19 V7"
                              fill="#312e81"
                              stroke="#fbbf24"
                              strokeWidth="2"
                            />
                            <circle cx="0" cy="1" r="3.5" fill="#fbbf24" />
                            <path
                              d="M0,1 Q22,6 28,22"
                              fill="none"
                              stroke="#fbbf24"
                              strokeWidth="2.8"
                              strokeLinecap="round"
                            />
                            <circle cx="28" cy="23" r="3.5" fill="#f59e0b" />
                          </g>
                        ) : (
                          <g>
                            <path d="M90 42 Q90 26 96 22" fill="none" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round" />
                            <ellipse cx="83" cy="24" rx="8" ry="5" transform="rotate(-22 83 24)" fill="#4ade80" stroke="#15803d" strokeWidth="1.8" />
                            <ellipse cx="99" cy="23" rx="8" ry="5" transform="rotate(24 99 23)" fill="#22c55e" stroke="#15803d" strokeWidth="1.8" />
                          </g>
                        )}
                      </g>
                    </svg>
                  </button>
                )}
              </div>

              {/* BÊN PHẢI HAMSTER TRÊN SÀN (4 cols): VÒNG CHẠY & BÌNH NƯỚC ĐẶT CẠNH NHAU NGANG */}
              <div className="col-span-4 flex flex-col items-center justify-end gap-1 pb-1">
                {/* Extra Right Floor/Middle Unlocked Badges (nếu có) */}
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {(
                    [
                      'mini_study_desk',
                      'glowing_desk_lamp',
                      'sunflower_pot',
                      'mini_waterfall',
                      'mini_skateboard'
                    ] as PetAccessoryId[]
                  )
                    .filter((id) => isItemEquipped(id))
                    .slice(0, 4)
                    .map((id) => {
                      const item = PET_ROOM_ACCESSORIES.find((a) => a.id === id);
                      if (!item) return null;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleInteractWithRoomObject(item.id)}
                          title={language === 'vi' ? `${item.nameVi}: Bấm để tương tác!` : item.nameEn}
                          className="px-1.5 py-0.5 rounded-lg bg-white/25 hover:bg-amber-400/40 border border-white/40 flex items-center gap-0.5 shadow transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                        >
                          <span className="text-xs leading-none">{item.emoji}</span>
                        </button>
                      );
                    })}
                </div>

                {/* Hàng ngang trên mặt sàn bên phải: Vòng chạy + Bình nước */}
                <div className="flex items-end justify-center gap-1.5 w-full">
                  {/* 1. Vòng chạy (Hamster Wheel) */}
                  <button
                    type="button"
                    onClick={() => handleInteractWithRoomObject('hamster_wheel')}
                    title={
                      language === 'vi'
                        ? 'Vòng chạy tập thể dục: Bấm vào để vòng xoay quay tròn 3 giây (+Vui vẻ)!'
                        : 'Exercise Wheel: Tap to spin for 3 seconds (+Happiness)!'
                    }
                    className={`group relative flex-1 max-w-[82px] rounded-2xl p-1 border-2 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md ${
                      wheelSpinning
                        ? 'bg-amber-400/50 border-amber-200 ring-4 ring-amber-300 scale-105'
                        : isItemEquipped('hamster_wheel')
                        ? 'bg-gradient-to-b from-cyan-400/35 to-indigo-900/60 hover:from-cyan-400/55 border-cyan-200/80'
                        : 'bg-black/25 hover:bg-black/40 border-white/25 opacity-85'
                    }`}
                  >
                    <div className="relative w-11 h-10 sm:w-12 sm:h-11 flex items-center justify-center">
                      <svg
                        viewBox="0 0 80 80"
                        className={`w-10 h-10 sm:w-11 sm:h-11 ${
                          wheelSpinning ? 'animate-spin' : 'group-hover:rotate-45 transition-transform duration-500'
                        }`}
                        style={{ animationDuration: wheelSpinning ? '0.45s' : undefined }}
                      >
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#fde047" strokeWidth="6" />
                        <circle cx="40" cy="40" r="26" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 4" />
                        <line x1="40" y1="8" x2="40" y2="72" stroke="#fde047" strokeWidth="3" />
                        <line x1="8" y1="40" x2="72" y2="40" stroke="#fde047" strokeWidth="3" />
                        <line x1="17" y1="17" x2="63" y2="63" stroke="#fde047" strokeWidth="2.5" />
                        <line x1="63" y1="17" x2="17" y2="63" stroke="#fde047" strokeWidth="2.5" />
                        <circle cx="40" cy="40" r="7" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                      </svg>
                      <div className="absolute bottom-0 w-8 h-1 bg-amber-300 rounded-full" />
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-black text-white drop-shadow truncate max-w-full">
                      {wheelSpinning
                        ? language === 'vi'
                          ? 'Đang chạy!💨'
                          : 'Running!'
                        : language === 'vi'
                        ? 'Vòng chạy'
                        : 'Wheel'}
                    </span>
                  </button>

                  {/* 2. Bình nước (Đặt cân đối trên sàn cạnh Vòng chạy) */}
                  <button
                    type="button"
                    onClick={() => handleInteractWithRoomObject('water_fountain')}
                    title={
                      language === 'vi'
                        ? 'Bình nước mát lành: Bấm vào để Hamster uống nước (+Năng lượng)!'
                        : 'Water Bottle: Tap to hydrate (+Energy)!'
                    }
                    className={`group relative flex-1 max-w-[74px] rounded-2xl p-1 border-2 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md ${
                      isItemEquipped('water_fountain')
                        ? 'bg-gradient-to-b from-sky-400/45 to-blue-950/65 hover:from-sky-400/65 border-sky-200/85'
                        : 'bg-black/25 hover:bg-black/40 border-white/25 opacity-85'
                    }`}
                  >
                    <svg viewBox="0 0 64 56" className="w-10 h-9 sm:w-11 sm:h-10 drop-shadow">
                      {/* Stand & Water Bottle */}
                      <rect x="44" y="8" width="6" height="42" rx="3" fill="#fde047" stroke="#b45309" strokeWidth="1.8" />
                      <rect x="16" y="46" width="38" height="5" rx="2.5" fill="#fde047" stroke="#b45309" strokeWidth="1.8" />
                      <rect x="18" y="8" width="22" height="28" rx="9" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="2.2" />
                      <path d="M20 20 Q29 23 38 20 V29 A7 7 0 0 1 31 36 H27 A7 7 0 0 1 20 29 Z" fill="#0284c7" />
                      {/* Sipper Tube & Sparkling Water Drop */}
                      <path d="M27 36 L22 42" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
                      <circle cx="19" cy="45" r="3" fill="#7dd3fc" />
                    </svg>
                    <span className="text-[8px] sm:text-[9px] font-black text-white drop-shadow truncate max-w-full">
                      {language === 'vi' ? 'Bình nước' : 'Water'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* ==============================================================
                CẠNH ĐÁY CĂN PHÒNG: Thảm tròn dưới chân + Thanh chọn Tư thế (Đứng, Ngồi, Nằm, Nhảy)
                và Dãy nút biểu cảm nằm gọn trên 1 hàng ngang duy nhất
               ============================================================== */}
            <div className="relative z-20 pt-1.5 pb-1.5 px-2.5 -mx-2.5 sm:-mx-3 -mb-2.5 sm:-mb-3 bg-gradient-to-t from-amber-950/95 via-amber-900/85 to-amber-800/55 border-t-2 border-amber-300/60">
              {/* Circular Floor Rug Under Hamster's Feet */}
              <div
                onClick={() => handleInteractWithRoomObject('grass_rug')}
                title={
                  language === 'vi'
                    ? 'Thảm tròn êm ái dưới chân Chuột Hamster (Bấm để tương tác!)'
                    : 'Cozy circular rug under Hamster’s feet!'
                }
                className={`mx-auto -mt-4 mb-1 w-44 sm:w-52 h-5 rounded-full border flex items-center justify-center shadow-inner cursor-pointer transition-all ${
                  isItemEquipped('grass_rug')
                    ? 'bg-gradient-to-r from-emerald-500/65 via-lime-400/60 to-emerald-500/65 border-amber-200/90'
                    : 'bg-gradient-to-r from-pink-400/45 via-amber-300/45 to-pink-400/45 border-amber-200/60'
                }`}
              >
                <span className="text-[9px] font-black text-white drop-shadow flex items-center gap-1">
                  <span>{isItemEquipped('grass_rug') ? '🍀' : '⭐'}</span>
                  <span>
                    {language === 'vi'
                      ? `Lv.${evolutionInfo.level}/20 • ${
                          activePosture === 'lying'
                            ? 'Đang nằm'
                            : activePosture === 'sitting'
                            ? 'Đang ngồi'
                            : activePosture === 'jumping'
                            ? 'Đang nhảy'
                            : 'Đang đứng'
                        }`
                      : `Lv.${evolutionInfo.level}/20`}
                  </span>
                </span>
              </div>

              {/* 1 HÀNG NGANG DUY NHẤT: Thanh chọn Tư thế (Đứng, Ngồi, Nằm, Nhảy) + Dãy nút biểu cảm */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                {/* Cụm Tư thế (Đứng, Ngồi, Nằm, Nhảy) */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[9px] font-extrabold text-amber-200 mr-0.5 hidden sm:inline">
                    {language === 'vi' ? 'Tư thế:' : 'Pose:'}
                  </span>
                  {(
                    [
                      { id: 'standing' as const, emoji: '🧍', labelVi: 'Đứng', labelEn: 'Stand' },
                      { id: 'sitting' as const, emoji: '🪑', labelVi: 'Ngồi', labelEn: 'Sit' },
                      { id: 'lying' as const, emoji: '🛌', labelVi: 'Nằm', labelEn: 'Lie' },
                      { id: 'jumping' as const, emoji: '🤸', labelVi: 'Nhảy', labelEn: 'Jump' }
                    ] as const
                  ).map((pose) => {
                    const isCurrentPose = activePosture === pose.id;
                    return (
                      <button
                        key={pose.id}
                        type="button"
                        onClick={() => handleSelectPosture(pose.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                          isCurrentPose
                            ? 'bg-amber-400 text-slate-950 border-white shadow-2xs scale-105'
                            : 'bg-black/45 hover:bg-white/20 text-white border-white/20'
                        }`}
                      >
                        <span>{pose.emoji}</span>
                        <span>{language === 'vi' ? pose.labelVi : pose.labelEn}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Dãy nút biểu cảm nằm gọn cùng hàng ngang */}
                <div className="flex items-center gap-1 bg-black/45 px-2 py-0.5 rounded-xl border border-white/15">
                  <span className="text-[9px] font-bold text-amber-200 hidden xl:inline">
                    {language === 'vi' ? 'Biểu cảm:' : 'Mood:'}
                  </span>
                  {(
                    [
                      { id: null, emoji: '✨', labelVi: 'Tự động', labelEn: 'Auto' },
                      { id: 'happy' as const, emoji: '😊', labelVi: 'Cười', labelEn: 'Happy' },
                      { id: 'bored' as const, emoji: '😐', labelVi: 'Chán', labelEn: 'Bored' },
                      { id: 'crying' as const, emoji: '😭', labelVi: 'Khóc', labelEn: 'Cry' },
                      { id: 'sleeping' as const, emoji: '😴', labelVi: 'Ngủ', labelEn: 'Sleep' }
                    ] as const
                  ).map((exp) => {
                    const isSelected = previewExpression === exp.id;
                    return (
                      <button
                        key={exp.labelEn}
                        type="button"
                        onClick={() => {
                          playClick(soundEnabled);
                          setPreviewExpression(exp.id);
                        }}
                        title={
                          language === 'vi'
                            ? `Biểu cảm: ${exp.labelVi}`
                            : `Expression: ${exp.labelEn}`
                        }
                        className={`px-1.5 py-0.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-0.5 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 shadow-2xs scale-105'
                            : 'text-white/85 hover:bg-white/15'
                        }`}
                      >
                        <span>{exp.emoji}</span>
                        <span className="hidden sm:inline text-[9px]">
                          {language === 'vi' ? exp.labelVi : exp.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==============================================================
            CỘT BÊN PHẢI (40% màn hình - lg:col-span-5):
            BẢNG ĐIỀU KHIỂN, CHĂM SÓC NHANH & HỒ SƠ HIỆP SĨ CƠ MINH
           ============================================================== */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-2.5">
          {/* KHỐI 1 (TRÊN CÙNG): Thẻ Hồ sơ rút gọn của Hiệp Sĩ Cơ Minh
              (Avatar, Lớp 4, Kho Sao Tích Lũy, Sao kiếm thêm hôm nay và thanh Tiến độ nhiệm vụ kèm lời nhắn của Ba Mẹ) */}
          <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3 border border-white/15 space-y-2 shadow-md">
            {/* Hàng trên: Avatar + Tên Hiệp Sĩ Cơ Minh + Lớp 4 + Kho Sao Tích Lũy & Sao hôm nay */}
            <div className="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <button
                    onClick={handlePetGreeting}
                    title={language === 'vi' ? 'Bấm để nghe linh vật chào bé' : 'Click to hear mascot cheer'}
                    className="relative group focus:outline-none rounded-2xl cursor-pointer"
                  >
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md group-hover:scale-105 transition-transform bg-amber-100">
                      <img
                        src={profile.avatar}
                        alt={fullHeroTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow border border-white">
                      Lv.{profile.level}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick(soundEnabled);
                      setNameInput(profile.name);
                      setGradeInput(profile.grade);
                      setSelectedAvatar(profile.avatar);
                      setUploadError(null);
                      setShowProfileModal(true);
                    }}
                    title={language === 'vi' ? 'Sửa tên & ảnh đại diện' : 'Edit name & avatar'}
                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-indigo-950/90 hover:bg-amber-400 text-white hover:text-slate-950 border border-white shadow flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        setNameInput(profile.name);
                        setGradeInput(profile.grade);
                        setSelectedAvatar(profile.avatar);
                        setUploadError(null);
                        setShowProfileModal(true);
                      }}
                      className="group flex items-center gap-1 focus:outline-none text-left cursor-pointer"
                    >
                      <h1 className="text-base sm:text-lg font-extrabold tracking-tight font-display text-white group-hover:text-amber-200 truncate">
                        {fullHeroTitle}
                      </h1>
                      <Pencil className="w-3 h-3 text-amber-300 shrink-0" />
                    </button>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md text-indigo-100 font-bold shrink-0">
                      {profile.grade}
                    </span>
                  </div>

                  {/* Chuỗi ngày + Nút Huy hiệu gọn trên 1 hàng */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                      <span>{profile.streakDays} {t.streakDays}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        onOpenBadges();
                      }}
                      className="text-[10px] font-bold text-indigo-100 hover:text-white bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 transition-colors cursor-pointer"
                    >
                      <Award className="w-3 h-3 text-amber-300" />
                      <span>{t.navBadges}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cụm Kho Sao Tích Lũy & Sao hôm nay bên phải thẻ */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <div className="bg-gradient-to-b from-amber-400/30 to-amber-600/25 border border-amber-300/70 rounded-xl px-2.5 py-1 text-center shadow-2xs">
                  <div className="text-[9px] font-extrabold text-amber-100 uppercase tracking-wider">
                    {language === 'vi' ? 'Kho Sao Tích Lũy' : 'Star Vault'}
                  </div>
                  <div className="text-base sm:text-lg font-black font-mono text-amber-300 flex items-center justify-center gap-1 leading-tight">
                    <span>{profile.stars}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  </div>
                </div>

                <div className="bg-black/35 border border-emerald-300/40 rounded-xl px-2 py-1 text-center">
                  <div className="text-[9px] font-extrabold text-emerald-200 uppercase tracking-wider">
                    {language === 'vi' ? 'Hôm nay' : 'Today'}
                  </div>
                  <div className="text-sm sm:text-base font-black font-mono text-emerald-300 leading-tight">
                    +{todayStarsEarned}⭐
                  </div>
                </div>
              </div>
            </div>

            {/* Hàng dưới: Thanh Tiến độ nhiệm vụ 0/17 + Lời nhắn của Ba Mẹ gom gọn */}
            <div className="bg-black/30 rounded-xl p-2 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-extrabold text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>{language === 'vi' ? 'Tiến độ nhiệm vụ hôm nay:' : 'Daily Quest Progress:'}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {pendingTasksCount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/25 text-amber-200 font-mono">
                      ⏳ {pendingTasksCount}
                    </span>
                  )}
                  <span className="font-mono font-black text-emerald-300">
                    {completedTasksCount}/{totalTasksCount} ({completionPercent}%)
                  </span>
                </div>
              </div>

              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10 flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
                {pendingPercent > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                    style={{ width: `${pendingPercent}%` }}
                  />
                )}
              </div>

              {dailyGoalMessage && (
                <div className="flex items-center justify-between gap-1.5 pt-0.5 text-[11px] text-white/95">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Heart className="w-3 h-3 text-rose-300 fill-rose-300 shrink-0" />
                    <p className="truncate italic">
                      <strong className="text-amber-300 not-italic mr-1">
                        {language === 'vi' ? 'Ba Mẹ nhắn:' : 'Parents:'}
                      </strong>
                      &ldquo;{dailyGoalMessage}&rdquo;
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClick(soundEnabled);
                      speakText(dailyGoalMessage, language, voiceEnabled);
                    }}
                    className="p-0.5 rounded text-indigo-200 hover:text-white shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {todayPenalties.length > 0 && (
                <div className="text-[10px] text-rose-200 bg-rose-950/60 border border-rose-400/30 rounded-lg px-2 py-1 truncate">
                  ⚠️ <strong>-{todayPenalties.reduce((s, p) => s + p.penaltyStars, 0)} ⭐:</strong> &ldquo;{todayPenalties[0].reason}&rdquo;
                </div>
              )}

              {latestForgivenToday && todayPenalties.length === 0 && (
                <div className="text-[10px] text-emerald-200 bg-emerald-950/60 border border-emerald-400/30 rounded-lg px-2 py-1 truncate">
                  🌟 {language === 'vi' ? `Đã tha thứ & hoàn +${latestForgivenToday.penaltyStars} ⭐!` : `Restored +${latestForgivenToday.penaltyStars} ⭐!`}
                </div>
              )}
            </div>
          </div>

          {/* KHỐI 2 (Ở GIỮA - QUAN TRỌNG NHẤT):
              CỤM NÚT "CHĂM SÓC NHANH" (CORE ACTIONS) LƯỚI 3 CỘT x 2 HÀNG VỚI ICON LỚN DỄ CHẠM TRÊN IPAD */}
          <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3 border-2 border-amber-300/40 space-y-2 shadow-lg flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-amber-200">
                  {language === 'vi' ? 'Chăm Sóc Nhanh Hamster' : 'Quick Hamster Care'}
                </span>
                <span
                  title={
                    language === 'vi'
                      ? hasUnlockedStatCap100
                        ? 'Đã hoàn thành ≥4 nhiệm vụ / mở Rương Buổi: Cho phép nâng chỉ số lên 100% và nhận Cúp Vàng (+20 EXP)!'
                        : 'Chưa hoàn thành đủ 4 nhiệm vụ / Rương Buổi: Các nút chăm sóc thủ công giới hạn tối đa 80%!'
                      : 'Quest-linked Stat Cap'
                  }
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border ${
                    hasUnlockedStatCap100
                      ? 'bg-emerald-400/20 text-emerald-200 border-emerald-300/50'
                      : 'bg-amber-400/20 text-amber-200 border-amber-300/50'
                  }`}
                >
                  {hasUnlockedStatCap100
                    ? language === 'vi'
                      ? `🔓 Trần: 100% 🏆`
                      : `🔓 Cap: 100% 🏆`
                    : language === 'vi'
                    ? `🔒 Trần hiện tại: 80% (Làm nhiệm vụ để mở 100%)`
                    : `🔒 Current Cap: 80% (Complete quests for 100%)`}
                </span>
              </div>

              {/* 2 nút phụ trợ: Cho ăn hạt đặc biệt (20đ) & Cửa hàng Lv.1-20 */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewExpression(null);
                    setActivePosture('sitting');
                    setRecentlyCheeredUntil(Date.now() + 8000);
                    const res = onFeedPet();
                    if (res && typeof res === 'object') {
                      setPetActionBubble(language === 'vi' ? res.messageVi : res.messageEn);
                      if (res.allowed) {
                        confetti({
                          particleCount: 40,
                          spread: 60,
                          origin: { y: 0.6 }
                        });
                        triggerPetVisualEffect('bounce', ['🌻', '🍎', '🤩', '✨', '🪙'], '-20đ • +20% No bụng');
                      }
                    } else {
                      triggerPetVisualEffect('bounce', ['🌻', '🍎', '🤩', '✨'], '-20đ • +20% No');
                    }
                    setTimeout(() => setPetActionBubble(null), 4500);
                  }}
                  className="px-2 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  <span>🌻</span>
                  <span>
                    {language === 'vi'
                      ? `Hạt VIP (20đ • ${feedCountToday}/12)`
                      : `VIP Seed (20đ • ${feedCountToday}/12)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setAccessoryShopNotice(null);
                    setShowAccessoryShopModal(true);
                  }}
                  className="px-2 py-1 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 text-amber-300 border border-amber-300/50 font-black text-[10px] flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>{language === 'vi' ? 'Cửa hàng' : 'Shop'}</span>
                </button>
              </div>
            </div>

            {/* LƯỚI 3 CỘT x 2 HÀNG: 6 NÚT CHĂM SÓC NHANH (CORE ACTIONS) CHO IPAD */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 flex-1">
              {/* 1. Đĩa thức ăn (+No bụng • 5đ) */}
              <button
                type="button"
                onClick={() => {
                  setPreviewExpression('happy');
                  handleInteractWithRoomObject('food_bowl');
                }}
                className="group rounded-2xl p-2 sm:p-2.5 bg-gradient-to-b from-amber-400/35 to-orange-600/35 hover:from-amber-400/55 hover:to-orange-500/50 border-2 border-amber-300/70 flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer min-h-[72px]"
              >
                <span className="text-2xl sm:text-3xl leading-none group-hover:scale-110 transition-transform drop-shadow">
                  🥣
                </span>
                <span className="text-[11px] sm:text-xs font-extrabold text-white leading-tight text-center">
                  {language === 'vi' ? 'Đĩa thức ăn (5đ)' : 'Food Bowl (5đ)'}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-300 text-slate-950">
                  {language === 'vi' ? '+No bụng' : '+Fullness'}
                </span>
              </button>

              {/* 2. Bình nước (+Năng lượng • 5đ) */}
              <button
                type="button"
                onClick={() => {
                  setPreviewExpression('happy');
                  handleInteractWithRoomObject('water_fountain');
                }}
                className="group rounded-2xl p-2 sm:p-2.5 bg-gradient-to-b from-sky-400/35 to-blue-600/35 hover:from-sky-400/55 hover:to-blue-500/50 border-2 border-sky-300/70 flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer min-h-[72px]"
              >
                <span className="text-2xl sm:text-3xl leading-none group-hover:scale-110 transition-transform drop-shadow">
                  💧
                </span>
                <span className="text-[11px] sm:text-xs font-extrabold text-white leading-tight text-center">
                  {language === 'vi' ? 'Bình nước (5đ)' : 'Water Bottle (5đ)'}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-sky-300 text-slate-950">
                  {language === 'vi' ? '+Năng lượng' : '+Energy'}
                </span>
              </button>

              {/* 3. Chơi vòng quay (+Vui vẻ • 5đ) */}
              <button
                type="button"
                onClick={() => {
                  setPreviewExpression('happy');
                  handleInteractWithRoomObject('hamster_wheel');
                }}
                className="group rounded-2xl p-2 sm:p-2.5 bg-gradient-to-b from-fuchsia-400/35 to-purple-600/35 hover:from-fuchsia-400/55 hover:to-purple-500/50 border-2 border-pink-300/70 flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer min-h-[72px]"
              >
                <span className="text-2xl sm:text-3xl leading-none group-hover:rotate-45 transition-transform drop-shadow">
                  🎡
                </span>
                <span className="text-[11px] sm:text-xs font-extrabold text-white leading-tight text-center">
                  {language === 'vi' ? 'Chơi vòng quay (5đ)' : 'Spin Wheel (5đ)'}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-pink-300 text-slate-950">
                  {language === 'vi' ? '+Vui vẻ' : '+Happy'}
                </span>
              </button>

              {/* 4. Tắm sạch (+Vui vẻ • 5đ) */}
              <button
                type="button"
                onClick={() => {
                  const res = onUseRoomAccessory?.('mini_waterfall');
                  if (res && typeof res === 'object' && !res.ok) {
                    setPetActionBubble(language === 'vi' ? res.messageVi : res.messageEn);
                    setTimeout(() => setPetActionBubble(null), 4500);
                    return;
                  }
                  playSuccessChime(soundEnabled);
                  setPreviewExpression('happy');
                  setActivePosture('standing');
                  setRecentlyCheeredUntil(Date.now() + 8000);
                  triggerPetVisualEffect('rainbow', ['🛁', '🫧', '✨', '💖', '🌟'], '-5đ • +10% Vui vẻ!');
                  setPetActionBubble(
                    res && typeof res === 'object'
                      ? language === 'vi'
                        ? res.messageVi
                        : res.messageEn
                      : language === 'vi'
                      ? `🛁 Tắm bọt thơm phức! Lông của ${petDisplayName} trắng mượt lấp lánh rồi (-5đ • +10% Vui vẻ)!`
                      : `🛁 Squeaky clean bubble bath! ${petDisplayName} feels super refreshed (+10% Happy)!`
                  );
                  setTimeout(() => setPetActionBubble(null), 4000);
                }}
                className="group rounded-2xl p-2 sm:p-2.5 bg-gradient-to-b from-teal-400/35 to-emerald-600/35 hover:from-teal-400/55 hover:to-emerald-500/50 border-2 border-emerald-300/70 flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer min-h-[72px]"
              >
                <span className="text-2xl sm:text-3xl leading-none group-hover:scale-110 transition-transform drop-shadow">
                  🛁
                </span>
                <span className="text-[11px] sm:text-xs font-extrabold text-white leading-tight text-center">
                  {language === 'vi' ? 'Tắm sạch (5đ)' : 'Bubble Bath (5đ)'}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-300 text-slate-950">
                  {language === 'vi' ? '+Vui vẻ' : '+Happy'}
                </span>
              </button>

              {/* 5. Đi ngủ (+Năng lượng • Miễn phí 3 lần/ngày) */}
              <button
                type="button"
                onClick={() => {
                  const res = onUseRoomAccessory?.('cozy_bed');
                  if (res && typeof res === 'object' && !res.ok) {
                    setPetActionBubble(language === 'vi' ? res.messageVi : res.messageEn);
                    setTimeout(() => setPetActionBubble(null), 4500);
                    return;
                  }
                  playPetPurrBeepSound(soundEnabled);
                  setPreviewExpression('sleeping');
                  setActivePosture('lying');
                  setRoomLightingMode('warm_sleep');
                  triggerPetVisualEffect('stars', ['🛌', '🌙', '💤', '⚡', '✨'], '+10% Năng lượng!');
                  setPetActionBubble(
                    res && typeof res === 'object'
                      ? language === 'vi'
                        ? res.messageVi
                        : res.messageEn
                      : language === 'vi'
                      ? `🛌 Khò khò... ${petDisplayName} nằm trên đệm ấm nghỉ ngơi nạp đầy +Năng lượng cùng ${fullHeroTitle}!`
                      : `🛌 Zzz... ${petDisplayName} is resting in warm light to recharge +Energy!`
                  );
                  setTimeout(() => setPetActionBubble(null), 4000);
                }}
                className="group rounded-2xl p-2 sm:p-2.5 bg-gradient-to-b from-indigo-400/35 to-slate-800/60 hover:from-indigo-400/55 hover:to-slate-700/70 border-2 border-indigo-300/70 flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer min-h-[72px]"
              >
                <span className="text-2xl sm:text-3xl leading-none group-hover:scale-110 transition-transform drop-shadow">
                  🛌
                </span>
                <span className="text-[11px] sm:text-xs font-extrabold text-white leading-tight text-center">
                  {language === 'vi' ? `Đi ngủ (${sleepCountToday}/3)` : `Sleep (${sleepCountToday}/3)`}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-indigo-200 text-slate-950">
                  {language === 'vi' ? '+Năng lượng' : '+Energy'}
                </span>
              </button>

              {/* 6. Vuốt ve (+EXP) */}
              <button
                type="button"
                onClick={() => {
                  setPreviewExpression(null);
                  setRecentlyCheeredUntil(Date.now() + 8000);
                  const res = onPetPet();
                  if (res && typeof res === 'object') {
                    setPetActionBubble(language === 'vi' ? res.messageVi : res.messageEn);
                    if (res.allowed) {
                      confetti({
                        particleCount: 25,
                        spread: 50,
                        origin: { y: 0.6 }
                      });
                      triggerPetVisualEffect('hearts', ['💖', '🥰', '✨', '💕', '⭐'], '+2% Vui • +5 EXP');
                    }
                  }
                  setTimeout(() => setPetActionBubble(null), 4500);
                }}
                className="group rounded-2xl p-2 sm:p-2.5 bg-gradient-to-b from-rose-400/40 to-pink-600/40 hover:from-rose-400/60 hover:to-pink-500/55 border-2 border-rose-300/80 flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer min-h-[72px]"
              >
                <span className="text-2xl sm:text-3xl leading-none group-hover:scale-110 transition-transform drop-shadow">
                  💖
                </span>
                <span className="text-[11px] sm:text-xs font-extrabold text-white leading-tight text-center">
                  {language === 'vi' ? `Vuốt ve (${headPatCountToday}/30)` : `Pat (${headPatCountToday}/30)`}
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-200 text-slate-950">
                  +EXP • +Vui
                </span>
              </button>
            </div>
          </div>

          {/* KHỐI 3 (DƯỚI CÙNG):
              NÚT MỞ BẢNG POPUP "XÂY DỰNG & KIẾN TRÚC PHÒNG HAMSTER (10 CHỦ ĐỀ - 30 CẤP)" */}
          <button
            type="button"
            onClick={() => {
              playClick(soundEnabled);
              setShowRoomBuilderPanel(true);
            }}
            className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-slate-950 rounded-2xl p-3 border-2 border-white shadow-lg flex items-center justify-between gap-2 transition-all active:scale-98 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0 text-left">
              <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-300 flex items-center justify-center text-lg shrink-0 shadow">
                🏗️
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black leading-tight truncate">
                  {language === 'vi'
                    ? 'Xây dựng & Kiến trúc Phòng Hamster (10 Chủ đề - 30 Cấp)'
                    : 'Hamster Room Builder & Architecture (10 Themes - 30 Levels)'}
                </div>
                <div className="text-[10px] font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <span>
                    {language === 'vi' ? 'Chủ đề đang chọn:' : 'Selected Theme:'}{' '}
                    {
                      ROOM_THEME_OPTIONS.find((tOpt) => tOpt.id === activeRoomTheme)?.[
                        language === 'vi' ? 'labelVi' : 'labelEn'
                      ]
                    }
                  </span>
                </div>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-amber-300 text-[10px] font-black shrink-0 group-hover:translate-x-0.5 transition-transform">
              {language === 'vi' ? 'Mở bảng ▶' : 'Open ▶'}
            </span>
          </button>
        </div>
      </div>

      {/* ==============================================================
          POPUP MODAL: XÂY DỰNG & KIẾN TRÚC PHÒNG HAMSTER (10 CHỦ ĐỀ - 30 CẤP)
          (Mở ở giữa màn hình iPad mà không làm dài màn hình chính)
         ============================================================== */}
      {showRoomBuilderPanel && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border-2 border-amber-300 relative animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto space-y-4">
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setShowRoomBuilderPanel(false);
              }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl shrink-0 shadow-md border-2 border-white">
                🏗️
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-amber-300 font-display">
                  {language === 'vi'
                    ? 'Xây dựng & Kiến trúc Phòng Hamster (10 Chủ đề • 30 Cấp)'
                    : 'Hamster Room Builder & Themes (10 Themes • 30 Levels)'}
                </h3>
                <p className="text-xs text-indigo-200">
                  {roomRankTitle} • Điểm tiện nghi hiện tại: <strong className="text-amber-300 font-mono">{roomComfortScore}đ</strong> • Ví xu: <strong className="text-amber-300 font-mono">{petCoins}đ</strong> • Hamster Lv.{evolutionInfo.level}/30
                </p>
              </div>
            </div>

            {/* 1. Chọn 1 trong 10 Chủ đề Kiến trúc Phòng */}
            <div className="bg-white/5 rounded-2xl p-3.5 border border-amber-300/30 space-y-2">
              <div className="text-xs font-extrabold text-amber-200 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-300" />
                <span>
                  {language === 'vi'
                    ? 'Chọn Chủ đề Kiến trúc Căn phòng (10 Chủ đề mở khóa theo 30 Cấp):'
                    : 'Select Room Architecture Theme (10 Themes across 30 Levels):'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROOM_THEME_OPTIONS.map((themeOpt) => {
                  const lockedTheme = evolutionInfo.level < themeOpt.unlockLevel;
                  const isCurrentTheme = activeRoomTheme === themeOpt.id;
                  return (
                    <button
                      key={themeOpt.id}
                      type="button"
                      onClick={() => {
                        if (lockedTheme) {
                          playClick(soundEnabled);
                          setPetActionBubble(
                            language === 'vi'
                              ? `🔒 Chủ đề ${themeOpt.labelVi} sẽ mở khóa miễn phí khi Hamster đạt Lv.${themeOpt.unlockLevel}/30!`
                              : `🔒 ${themeOpt.labelEn} unlocks at Hamster Lv.${themeOpt.unlockLevel}/30!`
                          );
                          setTimeout(() => setPetActionBubble(null), 3500);
                          return;
                        }
                        playSuccessChime(soundEnabled);
                        onChangeRoomTheme?.(themeOpt.id);
                        triggerPetVisualEffect('rainbow', ['🏡', '✨', '🌈', '🎨'], `Đổi nền: ${themeOpt.labelVi}`);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-extrabold border-2 transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                        isCurrentTheme
                          ? 'bg-amber-400 text-slate-950 border-white shadow-md scale-[1.02]'
                          : lockedTheme
                          ? 'bg-black/30 text-white/45 border-white/10'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                      }`}
                    >
                      <span className="truncate">{language === 'vi' ? themeOpt.labelVi : themeOpt.labelEn}</span>
                      {lockedTheme ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 flex items-center gap-0.5 shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Lv.{themeOpt.unlockLevel}</span>
                        </span>
                      ) : isCurrentTheme ? (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 shrink-0">
                          ✓ Đang dùng
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Bày trí & Lắp đặt nội thất theo khu vực phòng */}
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/15 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-xs font-extrabold text-indigo-100">
                  {language === 'vi' ? 'Lọc đồ nội thất theo vị trí trong phòng:' : 'Filter Furniture by Room Zone:'}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {(
                    [
                      { id: 'all' as const, labelVi: 'Tất cả', labelEn: 'All' },
                      { id: 'wall' as const, labelVi: 'Tường trên', labelEn: 'Wall' },
                      { id: 'middle' as const, labelVi: 'Sàn trái & phải', labelEn: 'Middle' },
                      { id: 'floor' as const, labelVi: 'Đồ chơi & Đĩa/Bình', labelEn: 'Floor' },
                      { id: 'wearable' as const, labelVi: 'Trang phục Hamster', labelEn: 'Wearable' }
                    ] as const
                  ).map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        setBuilderTierFilter(z.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors ${
                        builderTierFilter === z.id
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {language === 'vi' ? z.labelVi : z.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {PET_ROOM_ACCESSORIES.filter((item) => {
                  if (builderTierFilter === 'all') return true;
                  if (builderTierFilter === 'wall') return item.roomTier === 'wall';
                  if (builderTierFilter === 'middle')
                    return item.roomTier === 'middle_left' || item.roomTier === 'middle_right';
                  if (builderTierFilter === 'floor')
                    return (
                      item.roomTier === 'floor_left' ||
                      item.roomTier === 'floor_center' ||
                      item.roomTier === 'floor_right'
                    );
                  return item.roomTier === 'wearable';
                }).map((item) => {
                  const isUnlocked = unlockedAccessories.includes(item.id);
                  const equipped = isItemEquipped(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleShopOrTrayItemAction(item, true)}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        equipped
                          ? 'bg-emerald-500/30 border-emerald-300 text-white'
                          : isUnlocked
                          ? 'bg-white/10 border-white/20 text-white/85 hover:bg-white/20'
                          : 'bg-black/40 border-white/10 text-white/50 hover:border-amber-300/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold truncate">
                            {language === 'vi' ? item.nameVi : item.nameEn}
                          </div>
                          <div className="text-[10px] font-mono text-amber-300">
                            {isUnlocked
                              ? equipped
                                ? '✓ Đang bày trong phòng'
                                : 'Trong kho (Bấm để bày)'
                              : item.costCoins && item.costCoins > 0
                              ? `Lv.${item.requiredLevel} • Mua ${item.costCoins}đ 🪙`
                              : item.unlockMethod === 'shop'
                              ? `Mua ${item.costStars} ⭐`
                              : `Quà Lv.${item.requiredLevel}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  playClick(soundEnabled);
                  setShowRoomBuilderPanel(false);
                  setShowAccessoryShopModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-extrabold text-xs border border-amber-300/40 cursor-pointer"
              >
                🛍️ {language === 'vi' ? 'Mở Cửa hàng & Lộ trình 30 Cấp' : 'Open Shop & 30-Level Roadmap'}
              </button>
              <button
                type="button"
                onClick={() => {
                  playSuccessChime(soundEnabled);
                  setShowRoomBuilderPanel(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md cursor-pointer"
              >
                {language === 'vi' ? 'Hoàn tất & Ngắm phòng 🐹' : 'Done 🐹'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast confirmation for profile or egg hatch */}
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-bold text-sm px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{language === 'vi' ? 'Đã lưu thay đổi thành công!' : 'Saved successfully!'}</span>
        </div>
      )}

      {justHatchedToast && (
        <div className="fixed top-6 right-6 z-50 bg-amber-400 text-slate-950 font-black text-sm px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border-2 border-white animate-in fade-in slide-in-from-top-3 duration-300">
          <Sparkles className="w-5 h-5 text-indigo-950 shrink-0" />
          <span>{justHatchedToast}</span>
        </div>
      )}

      {/* CELEBRATION MODAL WHEN BUYING AN ITEM OR UNLOCKING A NEW LEVEL GIFT */}
      {giftCelebration && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-300 text-center space-y-4 animate-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() => setGiftCelebration(null)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg border-2 border-white animate-bounce">
              <Gift className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-black text-amber-300 font-display">
                {language === 'vi' ? giftCelebration.titleVi : giftCelebration.titleEn}
              </h3>
              <p className="text-xs text-indigo-100 mt-1">
                {language === 'vi' ? giftCelebration.subtitleVi : giftCelebration.subtitleEn}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {giftCelebration.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/15 border border-amber-300/60 rounded-2xl p-3 flex items-center gap-3 text-left"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/25 border border-amber-300 flex items-center justify-center text-3xl shrink-0">
                    {item.emoji}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">
                      {language === 'vi' ? item.nameVi : item.nameEn}
                    </div>
                    <div className="text-[11px] text-emerald-300 font-bold">
                      ✓ {language === 'vi' ? 'Đã tự động bày vào Phòng Hamster!' : 'Automatically placed in Hamster Room!'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                playSuccessChime(soundEnabled);
                setGiftCelebration(null);
              }}
              className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg cursor-pointer"
            >
              {language === 'vi' ? 'Tuyệt vời! Ngắm phòng Hamster ngay 🐹' : 'Awesome! View Hamster Room 🐹'}
            </button>
          </div>
        </div>
      )}

      {/* Child Profile & Avatar Customizer Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setShowProfileModal(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-6 h-6 text-indigo-950" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold font-display">
                  {language === 'vi' ? 'Hồ Sơ Siêu Anh Hùng Của Bé' : 'Child Hero Profile'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'vi'
                    ? 'Tùy chỉnh tên anh hùng, lớp học và chọn ảnh đại diện yêu thích của bé!'
                    : 'Customize child hero name, grade, and superhero avatar!'}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white rounded-2xl p-4 mb-4 border border-indigo-400/30 shadow-md relative overflow-hidden">
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="relative shrink-0">
                  <img
                    src={selectedAvatar}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300 shadow-md bg-amber-50"
                  />
                  <div className="absolute -bottom-1.5 -right-1.5 bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full border border-white">
                    Lv.{profile.level}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-extrabold text-amber-300 tracking-wider">
                    {language === 'vi' ? 'Xem trước hồ sơ:' : 'Profile Preview:'}
                  </div>
                  <div className="text-lg font-black text-white truncate font-display">
                    {nameInput.trim() || 'Cơ Minh'}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md text-indigo-100 font-semibold">
                      {gradeInput.trim() || 'Lớp 3'}
                    </span>
                    <span className="text-xs text-amber-300 font-bold font-mono">
                      ⭐ {profile.stars} sao tích lũy
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const finalName = nameInput.trim() || 'Cơ Minh';
                const finalGrade = gradeInput.trim() || 'Lớp 3';
                if (onUpdateProfile) {
                  onUpdateProfile(finalName, finalGrade, selectedAvatar);
                } else if (onUpdateAvatar) {
                  onUpdateAvatar(selectedAvatar);
                }
                playSuccessChime(soundEnabled);
                setShowProfileModal(false);
                setSavedToast(true);
                setTimeout(() => setSavedToast(false), 3500);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{language === 'vi' ? 'Tên của bé (Tên Anh Hùng) *' : 'Child Name *'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ví dụ: Cơ Minh, Siêu Nhân Cơ Minh..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'vi' ? 'Lớp hoặc độ tuổi của bé' : 'Grade / Age'}</span>
                </label>
                <input
                  type="text"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="Ví dụ: Lớp 1, Lớp 2, Lớp 3..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-500" />
                    <span>{language === 'vi' ? 'Chọn ảnh đại diện của bé' : 'Superhero Avatar'}</span>
                  </label>

                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] cursor-pointer border border-indigo-200 dark:border-indigo-800 transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>{language === 'vi' ? 'Tải ảnh thật từ máy' : 'Upload photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadError(null);
                        try {
                          const dataUrl = await compressImageFileToDataUrl(file);
                          setSelectedAvatar(dataUrl);
                          playSuccessChime(soundEnabled);
                        } catch {
                          setUploadError(
                            language === 'vi'
                              ? 'Không thể tải ảnh này. Vui lòng chọn ảnh khác.'
                              : 'Could not load image. Please select another.'
                          );
                        }
                      }}
                    />
                  </label>
                </div>

                {uploadError && (
                  <div className="text-[11px] text-rose-600 font-semibold mb-2">{uploadError}</div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {AVATAR_PRESETS.map((item) => {
                    const isSelected = selectedAvatar === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          playClick(soundEnabled);
                          setSelectedAvatar(item.url);
                        }}
                        className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-left ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={item.url}
                            alt={item.nameVi}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-amber-300/80 bg-amber-50"
                          />
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 text-center line-clamp-1">
                          {language === 'vi' ? item.nameVi : item.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setShowProfileModal(false);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-transform active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{language === 'vi' ? 'Lưu hồ sơ anh hùng' : 'Save Hero Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          CỬA HÀNG PHỤ KIỆN & TRANG TRÍ PHÒNG HAMSTER (2 NHÓM RÕ RÀNG + BẢNG GIÁ MỚI)
         ============================================================================ */}
      {showAccessoryShopModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setShowAccessoryShopModal(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold font-display">
                  {language === 'vi'
                    ? 'Cửa Hàng Trang Trí Phòng & Lộ Trình 30 Cấp Hamster (Lv.1 – Lv.30)'
                    : 'Hamster Room Shop & 30-Level Roadmap (Lv.1 – Lv.30)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'vi'
                    ? `Gồm Nhóm 1 (Quà tặng miễn phí khi lên cấp), Nhóm 2 (Đồ đặc biệt mua bằng Sao hoặc Xu nuôi thú Lv.16–30) & Lộ trình 30 Cấp tiến hóa!`
                    : `Group 1 (Free Level-Up Gifts), Group 2 (Star & Coin Shop Special Items Lv.16–30) & 30-Level Evolution Roadmap!`}
                </p>
              </div>
            </div>

            {/* Balance & Level Summary Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl p-3.5 mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                  {language === 'vi' ? 'Số dư Sao, Ví Xu & Cấp Hamster:' : 'Hero Stars, Coin Wallet & Hamster Level:'}
                </div>
                <div className="text-xl font-black text-amber-300 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>{profile.stars} ⭐</span>
                  <span className="text-sm font-black px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950">
                    🪙 {petCoins}đ
                  </span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-white/20 text-white">
                    🐹 Lv.{evolutionInfo.level}/30 ({evolutionStars} EXP)
                  </span>
                </div>
              </div>
              <div className="text-right text-[11px] text-indigo-100">
                <div>{language === 'vi' ? 'Đã mở khóa:' : 'Unlocked:'}</div>
                <div className="font-extrabold text-amber-300 font-mono">
                  {unlockedAccessories.length}/{PET_ROOM_ACCESSORIES.length} {language === 'vi' ? 'món' : 'items'}
                </div>
              </div>
            </div>

            {/* Group Filter Tabs */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {[
                {
                  id: 'all' as const,
                  labelVi: `Tất cả (${PET_ROOM_ACCESSORIES.length})`,
                  labelEn: `All Items (${PET_ROOM_ACCESSORIES.length})`
                },
                {
                  id: 'shop' as const,
                  labelVi: `⭐ Nhóm 2: Mua bằng Sao & Xu (Lv.1–30)`,
                  labelEn: `⭐ Group 2: Star & Coin Shop (Lv.1–30)`
                },
                {
                  id: 'level' as const,
                  labelVi: `🎁 Nhóm 1: Quà lên cấp miễn phí`,
                  labelEn: `🎁 Group 1: Free Level Gifts`
                },
                {
                  id: 'stages20' as const,
                  labelVi: `🏆 Lộ trình 30 Cấp Hamster`,
                  labelEn: `🏆 30-Level Roadmap`
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setShopGroupTab(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    shopGroupTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {language === 'vi' ? tab.labelVi : tab.labelEn}
                </button>
              ))}
            </div>

            {/* Shop Feedback Banner (Including Loving Encouragement when Stars < Price) */}
            {accessoryShopNotice && (
              <div
                className={`mb-4 p-3.5 rounded-2xl text-xs font-extrabold border-2 flex items-center gap-2.5 shadow-sm ${
                  accessoryShopNotice.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-400'
                }`}
              >
                <span className="text-lg shrink-0">{accessoryShopNotice.ok ? '🎉' : '💪'}</span>
                <span>{accessoryShopNotice.text}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* LỘ TRÌNH 30 CẤP ĐỘ TIẾN HÓA HAMSTER */}
              {shopGroupTab === 'stages20' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-2.5 rounded-2xl border border-indigo-300 dark:border-indigo-700">
                    <div className="text-xs sm:text-sm font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <span>🏆</span>
                      <span>
                        {language === 'vi'
                          ? 'Lộ Trình Tiến Hóa 30 Cấp Độ Chuột Hamster Mũm Mĩm (Lv.1 → Lv.30)'
                          : '30-Level Chubby Hamster Evolution Roadmap (Lv.1 → Lv.30)'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      Hiện tại: Lv.{evolutionInfo.level}/30
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PET_EVOLUTION_STAGES.map((stage) => {
                      const isReached = evolutionInfo.level >= stage.stage;
                      const isCurrent = evolutionInfo.level === stage.stage;
                      return (
                        <div
                          key={stage.stage}
                          className={`p-3 rounded-2xl border flex items-start gap-2.5 transition-all ${
                            isCurrent
                              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/40'
                              : isReached
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-700'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                            <span className="text-base leading-none">{stage.badgeVi.split(' ')[0] || '🐹'}</span>
                            <span className="text-[9px] font-black font-mono text-indigo-600 dark:text-indigo-300 mt-0.5">
                              Lv.{stage.stage}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                {language === 'vi' ? stage.titleVi : stage.titleEn}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                                {stage.minStars} EXP
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {language === 'vi' ? stage.perkVi : stage.perkEn}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NHÓM 2: ĐỒ ĐẶC BIỆT BÉ TỰ DÙNG SAO HOẶC XU NUÔI THÚ ĐỂ MUA TRONG CỬA HÀNG */}
              {(shopGroupTab === 'all' || shopGroupTab === 'shop') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 rounded-2xl border border-amber-300 dark:border-amber-700">
                    <div className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <span>⭐</span>
                      <span>
                        {language === 'vi'
                          ? 'NHÓM 2 — Đồ Đặc Biệt Mua Bằng Sao Tích Lũy Hoặc Xu Nuôi Thú (Lv.1 – Lv.30)'
                          : 'GROUP 2 — Special Items Purchased with Saved Stars or Pet Coins (Lv.1 – Lv.30)'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                      5 ⭐ → 40 ⭐ • 120đ → 500đ 🪙
                    </span>
                  </div>

                  {PET_ROOM_ACCESSORIES.filter((i) => i.unlockMethod === 'shop').map((item) => {
                    const isUnlocked = unlockedAccessories.includes(item.id);
                    const isEquipped = isItemEquipped(item.id);
                    const isCoinItem = Boolean(item.costCoins && item.costCoins > 0);
                    const isLevelMet = evolutionInfo.level >= item.requiredLevel;
                    const canAfford =
                      isLevelMet &&
                      (isCoinItem ? petCoins >= (item.costCoins || 0) : profile.stars >= item.costStars);
                    const missingStars = Math.max(0, item.costStars - profile.stars);
                    const missingCoins = Math.max(0, (item.costCoins || 0) - petCoins);

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isEquipped
                            ? 'bg-amber-50/90 dark:bg-amber-950/35 border-amber-400 dark:border-amber-600'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-2xl shrink-0 shadow-2xs relative">
                            <span>{item.emoji}</span>
                            <span className="absolute -bottom-1 -right-1 text-[9px] font-black font-mono px-1.5 rounded bg-amber-400 text-slate-950 border border-white">
                              {isCoinItem ? `${item.costCoins}đ` : `${item.costStars}⭐`}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {language === 'vi' ? item.nameVi : item.nameEn}
                              </span>
                              {item.requiredLevel > 1 && (
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md font-mono ${
                                    isLevelMet
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  🔒 Yêu cầu Lv.{item.requiredLevel}/30
                                </span>
                              )}
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                                {isCoinItem ? `Giá: ${item.costCoins}đ 🪙` : `Giá: ${item.costStars} ⭐`}
                              </span>
                              {!isUnlocked && !isLevelMet && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                                  Mở khóa ở Lv.{item.requiredLevel} ({item.requiredExp} EXP)
                                </span>
                              )}
                              {!isUnlocked && isLevelMet && !canAfford && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                                  {isCoinItem ? `Thiếu ${missingCoins}đ 🪙` : `Thiếu ${missingStars} ⭐`}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                              {language === 'vi' ? item.descVi : item.descEn}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isUnlocked ? (
                            <button
                              type="button"
                              onClick={() => handleShopOrTrayItemAction(item, false)}
                              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                                isEquipped
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-indigo-600 hover:text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>
                                {isEquipped
                                  ? language === 'vi'
                                    ? 'Đang bày • Cất đi'
                                    : 'Placed • Store'
                                  : language === 'vi'
                                  ? 'Bày vào phòng'
                                  : 'Place in room'}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleShopOrTrayItemAction(item, true)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 ${
                                canAfford
                                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <span>{language === 'vi' ? 'Mua ngay' : 'Buy'}</span>
                              <span className="font-mono">
                                {isCoinItem ? `${item.costCoins}đ 🪙` : `${item.costStars} ⭐`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* NHÓM 1: QUÀ TẶNG TỰ ĐỘNG KHI LÊN CẤP (MIỄN PHÍ) */}
              {(shopGroupTab === 'all' || shopGroupTab === 'level') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-2xl border border-emerald-300 dark:border-emerald-700">
                    <div className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <span>🎁</span>
                      <span>
                        {language === 'vi'
                          ? 'NHÓM 1 — Quà Tặng Tự Động Khi Lên Cấp (Miễn Phí 0 ⭐)'
                          : 'GROUP 1 — Free Automatic Level-Up Gifts (0 ⭐)'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      Miễn phí 0 ⭐
                    </span>
                  </div>

                  {PET_ROOM_ACCESSORIES.filter((i) => i.unlockMethod === 'level').map((item) => {
                    const isLevelMet = evolutionInfo.level >= item.requiredLevel;
                    const isUnlocked = unlockedAccessories.includes(item.id) || isLevelMet;
                    const isEquipped = isItemEquipped(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isEquipped
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600'
                            : !isUnlocked
                            ? 'bg-slate-100/70 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-85'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-2xs relative">
                            <span>{item.emoji}</span>
                            <span className="absolute -bottom-1 -right-1 text-[9px] font-black font-mono px-1 rounded bg-slate-900 text-amber-300 border border-amber-400/50">
                              Lv.{item.requiredLevel}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {language === 'vi' ? item.nameVi : item.nameEn}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md font-mono ${
                                  isUnlocked
                                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                                }`}
                              >
                                {isUnlocked
                                  ? `🎁 Quà tặng Lv.${item.requiredLevel} (Miễn phí)`
                                  : `🔒 Đạt Lv.${item.requiredLevel} (${item.requiredExp} EXP) tặng miễn phí`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                              {language === 'vi' ? item.descVi : item.descEn}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isUnlocked ? (
                            <button
                              type="button"
                              onClick={() => handleShopOrTrayItemAction(item, false)}
                              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                                isEquipped
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-indigo-600 hover:text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>
                                {isEquipped
                                  ? language === 'vi'
                                    ? 'Đang bày • Cất đi'
                                    : 'Placed • Store'
                                  : language === 'vi'
                                  ? 'Bày vào phòng'
                                  : 'Place in room'}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleShopOrTrayItemAction(item, false)}
                              className="px-3 py-2 rounded-xl text-xs font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Lv.{item.requiredLevel}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
