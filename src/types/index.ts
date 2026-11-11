export type Language = 'vi' | 'en';

export type TaskCategory = 'morning' | 'afternoon' | 'evening' | 'bonus';

export type HabitGroup = 'self_care' | 'study' | 'health_sport' | 'family_help';

export type TaskTag = 'study' | 'chore' | 'hygiene' | 'health' | 'routine';

export interface Task {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  category: TaskCategory;
  habitGroup: HabitGroup;
  tag?: TaskTag;
  stars: number; // Max 1 star per task
  xp: number;
  timeExpected?: string;
  iconName: string;
  isCompleted: boolean; // True only after Parent approves
  pendingApproval?: boolean; // True when child marks done and awaits parent approval
  requestedAt?: string;
  completedAt?: string;
  voicePromptVi: string;
  voicePromptEn: string;
}

export type RewardStatus = 'available' | 'requested' | 'approved' | 'claimed';

export interface Reward {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  cost: number;
  icon: string;
  status: RewardStatus;
  requestedAt?: string;
  approvedAt?: string;
}

export interface Challenge {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  durationSeconds: number;
  stars: number;
  xp: number;
  icon: string;
  isCompletedToday: boolean;
  pendingApproval?: boolean; // True when child clicks complete and awaits parent approval
  requestedAt?: string;
  completedAt?: string;
  type: 'timer' | 'action' | 'custom';
}

export interface Badge {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  requiredCount: number;
  currentCount: number;
  category: 'streak' | 'stars' | 'reading' | 'helper' | 'morning';
}

export type PetSpecies =
  | 'hamster'
  | 'dragon'
  | 'scout_dog'
  | 'scholar_cat';

export type PetAccessoryId =
  // Group 1: Free Level-Unlock Gifts (Lv.1 -> Lv.30)
  | 'food_bowl'
  | 'water_fountain'
  | 'cute_bow'
  | 'grass_rug'
  | 'hamster_wheel'
  | 'rainbow_house'
  | 'scholar_cap'
  | 'mini_bookshelf'
  | 'wall_clock'
  | 'mini_study_desk'
  | 'glowing_desk_lamp'
  | 'golden_crown'
  | 'crystal_castle'
  | 'mini_waterfall'
  | 'star_telescope'
  | 'rainbow_cloud_bed'
  | 'nut_robot'
  | 'cosmic_throne'
  // Group 2: Star Shop Special Items (5 -> 40 Stars)
  | 'toy_ball'
  | 'cozy_bed'
  | 'hat_glasses'
  | 'sunflower_pot'
  | 'mini_guitar'
  | 'camping_tent'
  | 'star_projector'
  | 'mini_skateboard'
  // Group 3: High-Level Coin Shop & Milestone Items (Lv.16, 18, 20, 22, 24, 26, 28, 30)
  | 'coral_aquarium'
  | 'magic_cauldron'
  | 'galaxy_piano'
  | 'wizard_cloak'
  | 'cyber_hoverboard'
  | 'plasma_fountain'
  | 'dragon_lantern'
  | 'golden_dragon_throne'
  // Legacy compatibility IDs
  | 'star_lamp'
  | 'hero_cape'
  | 'music_box'
  | 'medal_badge'
  | 'glowing_wings'
  | 'aquarium_tank'
  | 'magic_wand'
  | 'cloud_cushion'
  | 'diamond_crown'
  | 'galaxy_halo';

export type PetRoomTheme =
  | 'warm_wood'
  | 'garden_nature'
  | 'scholar_blue'
  | 'rainbow_dream'
  | 'royal_palace'
  | 'cosmic_galaxy'
  | 'coral_ocean'
  | 'magic_castle'
  | 'future_space'
  | 'golden_dragon';

export type PetPostureState = 'standing' | 'sitting' | 'lying' | 'jumping';

export interface VirtualPet {
  name: string;
  species: PetSpecies;
  avatar?: string;
  happiness: number; // 0 - 100
  energy: number; // 0 - 100
  hunger: number; // 0 - 100
  level: number; // 1 - 30: Calculated from Pet EXP (Điểm kinh nghiệm của bé)
  exp?: number; // Cumulative EXP earned by the child for leveling up the pet (30 levels)
  isHatched?: boolean; // True when hatched (50 EXP or 3 consecutive days >=80% stats)
  eggStars?: number; // Progress towards hatching milestone
  evolutionStars?: number; // Synced EXP-based evolution counter
  hasChosenSpecies?: boolean;
  unlockedAccessories?: PetAccessoryId[];
  equippedAccessories?: PetAccessoryId[];
  roomTheme?: PetRoomTheme; // 10 interactive room themes across 30 levels
  posture?: PetPostureState; // 'standing' | 'sitting' | 'lying' | 'jumping'
  // Gamification & Anti-Spam Cooldown State
  lastHeadPatDate?: string; // YYYY-MM-DD: Tracks date of head pats
  headPatCountToday?: number; // 0 - 30: Max 30 head pats per day (+2% Happiness each, reset after 0h)
  lastFeedDate?: string; // YYYY-MM-DD: Tracks date of feeding
  feedCountToday?: number; // 0 - 12: Max 12 feeds per day (reset after 0h)
  lastSpecialTreatAt?: number; // Timestamp (ms): Cooldown for 5-star Special Treat purchase
  moodState?: 'normal' | 'excited'; // 'excited' when fed a 5-star special treat
  excitedUntil?: number; // Timestamp (ms) until which excited state lasts
  completedMealSlotsToday?: ('morning' | 'afternoon' | 'evening')[]; // Tracks Sáng, Trưa, Tối
  appliedDecaySlotsToday?: ('morning' | 'afternoon' | 'evening')[]; // Tracks time-of-day session decay
  lastHourlyDecayHour?: number; // Tracks the last hour (0-23) when hourly stat decay was applied today
  lastDecayDate?: string; // YYYY-MM-DD for resetting daily slots
  sleptOnTimeDate?: string; // YYYY-MM-DD when child completed bedtime on time -> restores 100% energy
  consecutiveHighStatDays?: number; // Days in a row maintaining all 3 stats >= 80% (Hatches egg at 3 days)
  lastHighStatQualifiedDate?: string; // YYYY-MM-DD when >=80% all-stat streak was last incremented
  usedRoomAccessoriesToday?: PetAccessoryId[]; // Prevents spamming room accessories for free stats
  dailyGoal100CelebratedDate?: string; // YYYY-MM-DD when 100% daily pet goal was celebrated
  coins?: number; // Ví tiền xu nuôi thú của bé (+15đ mỗi nhiệm vụ hoàn thành, dùng 5đ/lần Chăm Sóc Nhanh)
  sleepCountToday?: number; // 0 - 3: Giới hạn nút Đi ngủ miễn phí tối đa 3 lần/ngày
  lastSleepDate?: string; // YYYY-MM-DD for resetting daily sleep count
}

export interface ChildProfile {
  name: string;
  grade: string;
  avatar: string;
  stars: number; // Sao Tích Lũy hiện có (Cumulative spendable star balance — persisted across days for big rewards!)
  dailyStarsEarned?: number; // Sao kiếm được trong ngày hôm nay (resets each day at 0h)
  totalStarsEarned: number; // Tổng sao tích lũy lịch sử đạt được
  level: number;
  currentXp: number;
  maxXp: number;
  streakDays: number;
  lastActiveDate: string;
  pinnedRewardId?: string;
  pet: VirtualPet;
}

export interface ParentSettings {
  pin: string;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  autoVoiceEncourage: boolean;
  parentalGateType: 'pin' | 'math';
  dailyGoalTasks: number;
  dailyGoalMessage?: string;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  completedTaskIds: string[];
  starsEarned: number;
  cumulativeStars?: number;
  totalTasks: number;
  completionRate: number;
  goalMessage?: string;
  petHappiness?: number;
  petEnergy?: number;
  petHunger?: number;
}

export interface GoalHistoryItem {
  date: string; // YYYY-MM-DD
  message: string;
  setAt?: string;
  starsEarned?: number;
  completionRate?: number;
}

export interface DisciplineRule {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  penaltyStars: number;
  icon: string;
}

export interface DisciplinePrinciple {
  id: string;
  title: string;
  titleEn: string;
  shortTag: string;
  shortTagEn: string;
  description: string;
  descriptionEn: string;
  exampleAction: string;
  exampleActionEn: string;
  category: 'core' | 'natural_consequence' | 'restorative' | 'agreement' | 'praise_ratio';
  icon: string;
}

export interface DisciplineLog {
  id: string;
  ruleId?: string;
  reason: string;
  reasonEn?: string;
  penaltyStars: number;
  timestamp: string;
  date: string; // YYYY-MM-DD
  forgiven?: boolean;
  forgivenAt?: string;
}

export interface AppState {
  profile: ChildProfile;
  tasks: Task[];
  rewards: Reward[];
  challenges: Challenge[];
  badges: Badge[];
  history: Record<string, DayRecord>;
  goalHistory?: Record<string, GoalHistoryItem>;
  disciplineRules?: DisciplineRule[];
  disciplinePrinciples?: DisciplinePrinciple[];
  disciplineLogs?: DisciplineLog[];
  settings: ParentSettings;
  familyCode: string;
  language: Language;
  lastSyncTimestamp: number;
  lastUpdatedAt?: number;
  lastExplicitResetTimestamp?: number;
  lastStarSpendTimestamp?: number;
  lastModifiedByDevice?: string;
}
