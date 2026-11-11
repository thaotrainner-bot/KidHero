import React, { useState } from 'react';
import {
  BarChart3,
  CheckSquare,
  Gift,
  Settings,
  Flame,
  Star,
  Award,
  Sparkles,
  Plus,
  Trash2,
  Download,
  Upload,
  Lock,
  ArrowLeft,
  TrendingUp,
  Zap,
  Heart,
  MessageSquareHeart,
  Send,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle2,
  List,
  AlertTriangle,
  ShieldAlert,
  Frown,
  Tv,
  Box,
  Utensils,
  Moon,
  RotateCcw,
  ShieldCheck,
  Info,
  Scale,
  FileText,
  HeartHandshake,
  BookOpen,
  Volume2,
  PieChart as PieChartIcon,
  BarChart2,
  Check,
  Pencil,
  Camera,
  X,
  IceCream,
  Book,
  Pizza,
  FerrisWheel,
  Clock,
  Smile,
  Trophy,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { AppState, Challenge, DisciplineLog, DisciplinePrinciple, DisciplineRule, GoalHistoryItem, HabitGroup, Language, Reward, Task, TaskCategory, TaskTag } from '../types';
import { translations } from '../utils/translations';
import { playClick, playSuccessChime, playPenaltySound, speakText } from '../utils/audio';
import { INITIAL_CHALLENGES, INITIAL_DISCIPLINE_PRINCIPLES, INITIAL_DISCIPLINE_RULES, INITIAL_REWARDS, INITIAL_TASKS } from '../utils/defaults';
import { TASK_TAG_META, TASK_TAG_ORDER, getTaskTag, tagToHabitGroup } from '../utils/taskTags';
import { TAG_ICON_MAP } from './TaskBoard';
import { AVATAR_PRESETS, compressImageFileToDataUrl } from '../utils/avatars';

interface ParentDashboardProps {
  appState: AppState;
  language: Language;
  soundEnabled: boolean;
  onExitParentMode: () => void;
  onUpdateTasks: (tasks: Task[]) => void;
  onUpdateChallenges?: (challenges: Challenge[]) => void;
  onUpdateRewards?: (rewards: Reward[]) => void;
  onApproveTask?: (taskId: string) => void;
  onApproveAllTasks?: () => void;
  onRejectTask?: (taskId: string) => void;
  onApproveChallenge?: (challengeId: string) => void;
  onRejectChallenge?: (challengeId: string) => void;
  onApproveReward: (rewardId: string) => void;
  onRejectReward: (rewardId: string) => void;
  onUpdateSettings: (settings: AppState['settings'], newGoalHistory?: Record<string, GoalHistoryItem>) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onApplyDiscipline?: (reason: string, penaltyStars: number, ruleId?: string) => void;
  onForgiveDiscipline?: (logId: string) => void;
  onDeleteDisciplineLog?: (logId: string) => void;
  onEditDisciplineLog?: (logId: string, updatedReason: string, updatedPenaltyStars: number) => void;
  onUpdateDisciplineRules?: (rules: DisciplineRule[]) => void;
  onUpdateDisciplinePrinciples?: (principles: DisciplinePrinciple[]) => void;
  onClearDisciplineLogs?: () => void;
  onResetDailyTasks?: () => void;
  onResetPoints?: (mode: 'daily_only' | 'all_stars' | 'full_reset') => void;
  onUpdateProfile?: (name: string, grade: string, avatar?: string) => void;
  onAdjustStars?: (amount: number, isExact?: boolean, reason?: string) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  appState,
  language,
  soundEnabled,
  onExitParentMode,
  onUpdateTasks,
  onUpdateChallenges,
  onUpdateRewards,
  onApproveTask,
  onApproveAllTasks,
  onRejectTask,
  onApproveChallenge,
  onRejectChallenge,
  onApproveReward,
  onRejectReward,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onApplyDiscipline,
  onForgiveDiscipline,
  onDeleteDisciplineLog,
  onEditDisciplineLog,
  onUpdateDisciplineRules,
  onUpdateDisciplinePrinciples,
  onClearDisciplineLogs,
  onResetDailyTasks,
  onResetPoints,
  onUpdateProfile,
  onAdjustStars
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'goals' | 'discipline' | 'tasks' | 'challenges' | 'rewards' | 'settings'>('report');

  // Direct Star Adjustment & Points Reset State
  const [showStarAdjustModal, setShowStarAdjustModal] = useState(false);
  const [showResetPointsModal, setShowResetPointsModal] = useState(false);
  const [customStarAmount, setCustomStarAmount] = useState<number>(1);
  const [customStarReason, setCustomStarReason] = useState<string>('');
  const [starAdjustMode, setStarAdjustMode] = useState<'add' | 'subtract' | 'set'>('add');
  const [starAdjustToast, setStarAdjustToast] = useState<string | null>(null);

  const handleExecuteStarAdjust = (amount: number, isExact: boolean = false, reasonText?: string) => {
    if (!onAdjustStars) return;
    onAdjustStars(amount, isExact, reasonText);
    const toastMsg = isExact
      ? (language === 'vi' ? `Đã đặt số sao hôm nay của bé ${appState.profile.name} thành ${amount} ⭐!` : `Set stars to ${amount} ⭐!`)
      : amount > 0
      ? (language === 'vi' ? `Đã cộng +${amount} ⭐ cho bé ${appState.profile.name}!` : `Added +${amount} ⭐!`)
      : (language === 'vi' ? `Đã trừ ${Math.abs(amount)} ⭐ của bé!` : `Deducted ${Math.abs(amount)} ⭐!`);
    setStarAdjustToast(toastMsg);
    setTimeout(() => setStarAdjustToast(null), 3500);
  };

  const handleExecuteResetPoints = (mode: 'daily_only' | 'all_stars' | 'full_reset') => {
    playSuccessChime(soundEnabled);
    if (onResetPoints) {
      onResetPoints(mode);
    } else if (onAdjustStars) {
      onAdjustStars(0, true, 'Phụ huynh reset lại điểm');
    }
    setShowResetPointsModal(false);
    const toastMsg =
      mode === 'daily_only'
        ? language === 'vi'
          ? `🔄 Đã reset sao hôm nay & nhiệm vụ trong ngày của bé ${appState.profile.name} về 0 ⭐!`
          : `🔄 Reset today's stars and daily quests to 0 ⭐!`
        : mode === 'all_stars'
          ? language === 'vi'
            ? `🔄 Đã reset toàn bộ Sao hôm nay & Tổng sao tích lũy về 0 ⭐!`
            : `🔄 Reset both today's stars and cumulative total stars to 0 ⭐!`
          : language === 'vi'
            ? `🔄 Đã reset toàn bộ Điểm (Sao, XP/Cấp độ 1, Chuỗi ngày & Trứng Linh Vật) về ban đầu!`
            : `🔄 Reset all Points (Stars, XP/Level 1, Streak & Magic Egg) to initial state!`;
    setStarAdjustToast(toastMsg);
    setTimeout(() => setStarAdjustToast(null), 4000);
  };

  // Task Settings & Management State (Tối thiểu nhiệm vụ cài đặt sao là 1 sao)
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [newTaskTimeExpected, setNewTaskTimeExpected] = useState('07:00');
  const [newTaskXp, setNewTaskXp] = useState(20);
  const [newTaskVoiceVi, setNewTaskVoiceVi] = useState('');

  const handleAdjustTaskStars = (taskId: string, delta: number) => {
    const updated = appState.tasks.map((t) => {
      if (t.id === taskId) {
        const currentStars = Math.max(1, Math.round(Number(t.stars) || 1));
        const newStars = Math.max(1, Math.min(10, currentStars + delta));
        return { ...t, stars: newStars };
      }
      return t;
    });
    onUpdateTasks(updated);
    playSuccessChime(soundEnabled);
  };

  const handleSaveEditedTask = (updatedTask: Task) => {
    const resolvedTag = updatedTask.tag || getTaskTag(updatedTask);
    const clampedTask: Task = {
      ...updatedTask,
      tag: resolvedTag,
      habitGroup: tagToHabitGroup(resolvedTag),
      stars: Math.max(1, Math.min(10, Math.round(Number(updatedTask.stars) || 1)))
    };
    const updated = appState.tasks.map((t) => (t.id === clampedTask.id ? clampedTask : t));
    onUpdateTasks(updated);
    playSuccessChime(soundEnabled);
    setEditingTask(null);
  };

  const handleRestoreDefaultTasks = () => {
    onUpdateTasks(INITIAL_TASKS);
    playSuccessChime(soundEnabled);
    setStarAdjustToast(
      language === 'vi'
        ? 'Đã khôi phục danh sách nhiệm vụ mẫu (tối thiểu 1 ⭐/nhiệm vụ)!'
        : 'Restored default tasks (min 1 ⭐/task)!'
    );
    setTimeout(() => setStarAdjustToast(null), 3500);
  };

  // Edit Child Profile Modal State (Preserved for parent convenience if needed)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editChildName, setEditChildName] = useState(appState.profile.name);
  const [editChildGrade, setEditChildGrade] = useState(appState.profile.grade);
  const [editChildAvatar, setEditChildAvatar] = useState(appState.profile.avatar);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  const handleOpenEditProfile = () => {
    playClick(soundEnabled);
    setEditChildName(appState.profile.name);
    setEditChildGrade(appState.profile.grade);
    setEditChildAvatar(appState.profile.avatar);
    setAvatarUploadError(null);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editChildName.trim() || appState.profile.name;
    const cleanGrade = editChildGrade.trim() || appState.profile.grade;
    const cleanAvatar = editChildAvatar || appState.profile.avatar;

    if (onUpdateProfile) {
      onUpdateProfile(cleanName, cleanGrade, cleanAvatar);
    }

    playSuccessChime(soundEnabled);
    setShowEditProfileModal(false);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3500);
  };

  // New task form state (Mặc định 1 sao, tối thiểu 1 sao)
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTitleEn, setNewTaskTitleEn] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('morning');
  const [newTaskHabit, setNewTaskHabit] = useState<HabitGroup>('self_care');
  const [newTaskTag, setNewTaskTag] = useState<TaskTag>('study');
  const [newTaskStars, setNewTaskStars] = useState(1);

  // Challenge Settings & Management State (Cài đặt Thử thách: Thêm, Sửa, Xóa, Chỉnh sao & thời gian)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeTitleEn, setNewChallengeTitleEn] = useState('');
  const [newChallengeDesc, setNewChallengeDesc] = useState('');
  const [newChallengeMinutes, setNewChallengeMinutes] = useState<number>(5);
  const [newChallengeStars, setNewChallengeStars] = useState<number>(15);
  const [newChallengeXp, setNewChallengeXp] = useState<number>(30);
  const [newChallengeIcon, setNewChallengeIcon] = useState<string>('Zap');

  const handleAdjustChallengeStars = (challengeId: string, delta: number) => {
    if (!onUpdateChallenges) return;
    const updated = appState.challenges.map((c) => {
      if (c.id === challengeId) {
        const nextStars = Math.max(1, Math.min(100, Math.round(Number(c.stars) || 1) + delta));
        return { ...c, stars: nextStars };
      }
      return c;
    });
    onUpdateChallenges(updated);
    playSuccessChime(soundEnabled);
  };

  const handleAddNewChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChallengeTitle.trim() || !onUpdateChallenges) return;
    const mins = Math.max(1, Math.min(120, Math.round(Number(newChallengeMinutes) || 5)));
    const stars = Math.max(1, Math.min(100, Math.round(Number(newChallengeStars) || 10)));
    const xp = Math.max(5, Math.min(500, Math.round(Number(newChallengeXp) || 30)));

    const created: Challenge = {
      id: `chal_${Date.now()}`,
      title: newChallengeTitle.trim(),
      titleEn: newChallengeTitleEn.trim() || newChallengeTitle.trim(),
      description: newChallengeDesc.trim() || 'Thử thách tập trung đếm ngược vui nhộn do ba mẹ thiết lập!',
      descriptionEn: newChallengeDesc.trim() || 'Fun countdown focus challenge set by parents!',
      durationSeconds: mins * 60,
      stars,
      xp,
      icon: newChallengeIcon || 'Zap',
      isCompletedToday: false,
      type: 'timer'
    };

    onUpdateChallenges([...appState.challenges, created]);
    setNewChallengeTitle('');
    setNewChallengeTitleEn('');
    setNewChallengeDesc('');
    setNewChallengeMinutes(5);
    setNewChallengeStars(15);
    setNewChallengeXp(30);
    setShowAddChallenge(false);
    playSuccessChime(soundEnabled);
    setStarAdjustToast(
      language === 'vi'
        ? `⚡ Đã thêm thử thách "${created.title}" (+${created.stars} ⭐)!`
        : `⚡ Added challenge "${created.titleEn}" (+${created.stars} ⭐)!`
    );
    setTimeout(() => setStarAdjustToast(null), 3500);
  };

  const handleSaveEditedChallenge = (updatedChallenge: Challenge) => {
    if (!onUpdateChallenges) return;
    const clamped: Challenge = {
      ...updatedChallenge,
      durationSeconds: Math.max(60, Math.round(Number(updatedChallenge.durationSeconds) || 300)),
      stars: Math.max(1, Math.min(100, Math.round(Number(updatedChallenge.stars) || 1))),
      xp: Math.max(5, Math.min(500, Math.round(Number(updatedChallenge.xp) || 20)))
    };
    onUpdateChallenges(appState.challenges.map((c) => (c.id === clamped.id ? clamped : c)));
    setEditingChallenge(null);
    playSuccessChime(soundEnabled);
    setStarAdjustToast(
      language === 'vi'
        ? `✓ Đã lưu chỉnh sửa thử thách "${clamped.title}"!`
        : `✓ Saved challenge "${clamped.titleEn}"!`
    );
    setTimeout(() => setStarAdjustToast(null), 3000);
  };

  const handleDeleteChallenge = (challengeId: string) => {
    if (!onUpdateChallenges) return;
    playClick(soundEnabled);
    onUpdateChallenges(appState.challenges.filter((c) => c.id !== challengeId));
  };

  const handleRestoreDefaultChallenges = () => {
    if (!onUpdateChallenges) return;
    onUpdateChallenges(INITIAL_CHALLENGES);
    playSuccessChime(soundEnabled);
    setStarAdjustToast(
      language === 'vi' ? 'Đã khôi phục danh sách thử thách mặc định!' : 'Restored default challenges!'
    );
    setTimeout(() => setStarAdjustToast(null), 3500);
  };

  // Reward Shop Settings & Management State (Cài đặt Đổi sao lấy quà: Thêm, Sửa, Xóa, Chỉnh giá sao)
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [showAddReward, setShowAddReward] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardTitleEn, setNewRewardTitleEn] = useState('');
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [newRewardCost, setNewRewardCost] = useState<number>(30);
  const [newRewardIcon, setNewRewardIcon] = useState<string>('Gift');

  const handleAdjustRewardCost = (rewardId: string, delta: number) => {
    if (!onUpdateRewards) return;
    const updated = appState.rewards.map((r) => {
      if (r.id === rewardId) {
        const nextCost = Math.max(1, Math.min(2000, Math.round(Number(r.cost) || 10) + delta));
        return { ...r, cost: nextCost };
      }
      return r;
    });
    onUpdateRewards(updated);
    playSuccessChime(soundEnabled);
  };

  const handleAddNewReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle.trim() || !onUpdateRewards) return;
    const cost = Math.max(1, Math.min(2000, Math.round(Number(newRewardCost) || 30)));
    const created: Reward = {
      id: `rew_${Date.now()}`,
      title: newRewardTitle.trim(),
      titleEn: newRewardTitleEn.trim() || newRewardTitle.trim(),
      description: newRewardDesc.trim() || 'Phần thưởng đặc biệt dành cho bé khi tích đủ sao!',
      descriptionEn: newRewardDesc.trim() || 'Special family reward for earning stars!',
      cost,
      icon: newRewardIcon || 'Gift',
      status: 'available'
    };
    onUpdateRewards([...appState.rewards, created]);
    setNewRewardTitle('');
    setNewRewardTitleEn('');
    setNewRewardDesc('');
    setNewRewardCost(30);
    setNewRewardIcon('Gift');
    setShowAddReward(false);
    playSuccessChime(soundEnabled);
    setStarAdjustToast(
      language === 'vi'
        ? `🎁 Đã thêm quà "${created.title}" (${created.cost} ⭐)!`
        : `🎁 Added reward "${created.titleEn}" (${created.cost} ⭐)!`
    );
    setTimeout(() => setStarAdjustToast(null), 3500);
  };

  const handleSaveEditedReward = (updatedReward: Reward) => {
    if (!onUpdateRewards) return;
    const clamped: Reward = {
      ...updatedReward,
      cost: Math.max(1, Math.min(2000, Math.round(Number(updatedReward.cost) || 10)))
    };
    onUpdateRewards(appState.rewards.map((r) => (r.id === clamped.id ? clamped : r)));
    setEditingReward(null);
    playSuccessChime(soundEnabled);
    setStarAdjustToast(
      language === 'vi'
        ? `✓ Đã cập nhật quà "${clamped.title}" (${clamped.cost} ⭐)!`
        : `✓ Updated reward "${clamped.titleEn}" (${clamped.cost} ⭐)!`
    );
    setTimeout(() => setStarAdjustToast(null), 3000);
  };

  const handleDeleteReward = (rewardId: string) => {
    if (!onUpdateRewards) return;
    playClick(soundEnabled);
    onUpdateRewards(appState.rewards.filter((r) => r.id !== rewardId));
  };

  const handleResetRewardStatus = (rewardId: string) => {
    if (!onUpdateRewards) return;
    playSuccessChime(soundEnabled);
    onUpdateRewards(
      appState.rewards.map((r) =>
        r.id === rewardId ? { ...r, status: 'available', requestedAt: undefined, approvedAt: undefined } : r
      )
    );
  };

  const handleRestoreDefaultRewards = () => {
    if (!onUpdateRewards) return;
    onUpdateRewards(INITIAL_REWARDS);
    playSuccessChime(soundEnabled);
    setStarAdjustToast(
      language === 'vi'
        ? 'Đã khôi phục danh sách phần thưởng mặc định!'
        : 'Restored default rewards catalog!'
    );
    setTimeout(() => setStarAdjustToast(null), 3500);
  };

  const renderRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'Tv':
        return <Tv className="w-5 h-5" />;
      case 'IceCream':
        return <IceCream className="w-5 h-5" />;
      case 'Book':
        return <Book className="w-5 h-5" />;
      case 'Pizza':
        return <Pizza className="w-5 h-5" />;
      case 'FerrisWheel':
        return <FerrisWheel className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  // Settings & Parent Password/PIN Change state
  const [pinInput, setPinInput] = useState(appState.settings.pin);
  const [currentPinVerify, setCurrentPinVerify] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);
  const [showPinText, setShowPinText] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);
  const [goalMessageInput, setGoalMessageInput] = useState(appState.settings.dailyGoalMessage || '');
  const [goalMessageSaved, setGoalMessageSaved] = useState(false);

  // Goal History Calendar State
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCalendarDateKey, setSelectedCalendarDateKey] = useState<string>(
    appState.profile.lastActiveDate || '2026-11-05'
  );
  const [historyViewMode, setHistoryViewMode] = useState<'calendar' | 'list'>('calendar');

  const handleSaveGoalMessage = (e?: React.FormEvent | string) => {
    if (typeof e === 'object' && e !== null && 'preventDefault' in e) {
      e.preventDefault();
    }
    const todayKey = appState.profile.lastActiveDate;
    const msg = (typeof e === 'string' ? e : goalMessageInput).trim();
    const newGoalHistory = {
      ...(appState.goalHistory || {}),
      ...(msg
        ? {
            [todayKey]: {
              date: todayKey,
              message: msg,
              setAt: new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          }
        : {})
    };

    onUpdateSettings(
      {
        ...appState.settings,
        dailyGoalMessage: msg
      },
      newGoalHistory
    );
    playSuccessChime(soundEnabled);
    setGoalMessageSaved(true);
    setTimeout(() => setGoalMessageSaved(false), 3000);
  };

  // Discipline & Deduction State
  const [disciplineSubTab, setDisciplineSubTab] = useState<'actions' | 'manage' | 'charts' | 'principles'>('actions');
  const [familyPledgeSigned, setFamilyPledgeSigned] = useState(true);
  const [customDisciplineReason, setCustomDisciplineReason] = useState('');
  const [customDisciplineStars, setCustomDisciplineStars] = useState(10);
  const [disciplineFilter, setDisciplineFilter] = useState<'all' | 'unforgiven' | 'forgiven'>('all');
  const [disciplineNotice, setDisciplineNotice] = useState<string | null>(null);
  const [penaltyConfirmModal, setPenaltyConfirmModal] = useState<{
    rule?: DisciplineRule;
    reason: string;
    stars: number;
  } | null>(null);

  // Discipline Rules Settings & Editing State (Cài đặt & Chỉnh sửa quy tắc kỷ luật)
  const [showAddDisciplineRule, setShowAddDisciplineRule] = useState(false);
  const [editingDisciplineRule, setEditingDisciplineRule] = useState<DisciplineRule | null>(null);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleTitleEn, setNewRuleTitleEn] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRulePenaltyStars, setNewRulePenaltyStars] = useState<number>(5);
  const [newRuleIcon, setNewRuleIcon] = useState<string>('AlertTriangle');

  // Discipline Log Editing State (Chỉnh sửa nhật ký kỷ luật)
  const [editingDisciplineLog, setEditingDisciplineLog] = useState<DisciplineLog | null>(null);

  // Discipline Principles Editing State (Cài đặt & Chỉnh sửa nguyên tắc kỷ luật vàng)
  const [showAddPrinciple, setShowAddPrinciple] = useState(false);
  const [editingPrinciple, setEditingPrinciple] = useState<DisciplinePrinciple | null>(null);
  const [newPrincipleTitle, setNewPrincipleTitle] = useState('');
  const [newPrincipleShortTag, setNewPrincipleShortTag] = useState('');
  const [newPrincipleDesc, setNewPrincipleDesc] = useState('');
  const [newPrincipleExample, setNewPrincipleExample] = useState('');
  const [newPrincipleIcon, setNewPrincipleIcon] = useState('HeartHandshake');

  const disciplineLogs = appState.disciplineLogs || [];
  const disciplineRules = appState.disciplineRules || [];
  const disciplinePrinciples = appState.disciplinePrinciples || INITIAL_DISCIPLINE_PRINCIPLES;
  const activeUnforgivenLogs = disciplineLogs.filter((l) => !l.forgiven);

  const handleAdjustDisciplineRuleStars = (ruleId: string, delta: number) => {
    if (!onUpdateDisciplineRules) return;
    const updated = disciplineRules.map((r) => {
      if (r.id === ruleId) {
        const nextStars = Math.max(1, Math.min(100, Math.round(Number(r.penaltyStars) || 1) + delta));
        return { ...r, penaltyStars: nextStars };
      }
      return r;
    });
    onUpdateDisciplineRules(updated);
    playSuccessChime(soundEnabled);
  };

  const handleAddDisciplineRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim() || !onUpdateDisciplineRules) return;
    const penaltyStars = Math.max(1, Math.min(100, Math.round(Number(newRulePenaltyStars) || 5)));
    const created: DisciplineRule = {
      id: `rule_custom_${Date.now()}`,
      title: newRuleTitle.trim(),
      titleEn: newRuleTitleEn.trim() || newRuleTitle.trim(),
      description: newRuleDesc.trim() || 'Quy tắc nề nếp do phụ huynh thiết lập cho gia đình.',
      descriptionEn: newRuleDesc.trim() || 'Custom family discipline rule set by parents.',
      penaltyStars,
      icon: newRuleIcon || 'AlertTriangle'
    };
    onUpdateDisciplineRules([created, ...disciplineRules]);
    setNewRuleTitle('');
    setNewRuleTitleEn('');
    setNewRuleDesc('');
    setNewRulePenaltyStars(5);
    setNewRuleIcon('AlertTriangle');
    setShowAddDisciplineRule(false);
    playSuccessChime(soundEnabled);
    setDisciplineNotice(
      language === 'vi'
        ? `✓ Đã thêm quy tắc kỷ luật mới: "${created.title}" (-${created.penaltyStars} ⭐)!`
        : `✓ Added new discipline rule: "${created.titleEn}" (-${created.penaltyStars} ⭐)!`
    );
    setTimeout(() => setDisciplineNotice(null), 4000);
  };

  const handleSaveEditedDisciplineRule = (updatedRule: DisciplineRule) => {
    if (!onUpdateDisciplineRules) return;
    const clamped: DisciplineRule = {
      ...updatedRule,
      title: updatedRule.title.trim() || 'Quy tắc nề nếp',
      titleEn: updatedRule.titleEn.trim() || updatedRule.title.trim() || 'Discipline Rule',
      penaltyStars: Math.max(1, Math.min(100, Math.round(Number(updatedRule.penaltyStars) || 1)))
    };
    onUpdateDisciplineRules(disciplineRules.map((r) => (r.id === clamped.id ? clamped : r)));
    setEditingDisciplineRule(null);
    playSuccessChime(soundEnabled);
    setDisciplineNotice(
      language === 'vi'
        ? `✓ Đã lưu chỉnh sửa quy tắc "${clamped.title}" (-${clamped.penaltyStars} ⭐)!`
        : `✓ Saved discipline rule "${clamped.titleEn}" (-${clamped.penaltyStars} ⭐)!`
    );
    setTimeout(() => setDisciplineNotice(null), 3500);
  };

  const handleDeleteDisciplineRule = (ruleId: string) => {
    if (!onUpdateDisciplineRules) return;
    playClick(soundEnabled);
    onUpdateDisciplineRules(disciplineRules.filter((r) => r.id !== ruleId));
    setDisciplineNotice(
      language === 'vi' ? 'Đã xóa quy tắc kỷ luật khỏi danh sách.' : 'Deleted discipline rule.'
    );
    setTimeout(() => setDisciplineNotice(null), 3000);
  };

  const handleRestoreDefaultDisciplineRules = () => {
    if (!onUpdateDisciplineRules) return;
    onUpdateDisciplineRules(INITIAL_DISCIPLINE_RULES);
    playSuccessChime(soundEnabled);
    setDisciplineNotice(
      language === 'vi'
        ? '🔄 Đã khôi phục danh sách quy tắc kỷ luật mặc định!'
        : '🔄 Restored default discipline rules!'
    );
    setTimeout(() => setDisciplineNotice(null), 3500);
  };

  const handleSaveEditedDisciplineLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDisciplineLog || !onEditDisciplineLog) return;
    const cleanPenalty = Math.max(1, Math.min(200, Math.round(Number(editingDisciplineLog.penaltyStars) || 1)));
    const cleanReason = editingDisciplineLog.reason.trim() || 'Nhắc nhở nề nếp';
    onEditDisciplineLog(editingDisciplineLog.id, cleanReason, cleanPenalty);
    setEditingDisciplineLog(null);
    playSuccessChime(soundEnabled);
    setDisciplineNotice(
      language === 'vi'
        ? `✓ Đã cập nhật bản ghi kỷ luật: "${cleanReason}" (-${cleanPenalty} ⭐)!`
        : `✓ Updated discipline log: "${cleanReason}" (-${cleanPenalty} ⭐)!`
    );
    setTimeout(() => setDisciplineNotice(null), 3500);
  };

  const handleAddPrinciple = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrincipleTitle.trim() || !onUpdateDisciplinePrinciples) return;
    const created: DisciplinePrinciple = {
      id: `principle_${Date.now()}`,
      title: newPrincipleTitle.trim(),
      titleEn: newPrincipleTitle.trim(),
      shortTag: newPrincipleShortTag.trim() || 'Nguyên tắc gia đình · Tôn trọng & Tự giác',
      shortTagEn: newPrincipleShortTag.trim() || 'Family principle · Respect & Responsibility',
      description: newPrincipleDesc.trim() || 'Cùng con thảo luận rõ ràng và kiên nhẫn đồng hành mỗi ngày.',
      descriptionEn: newPrincipleDesc.trim() || 'Guide your child with patience and consistency every day.',
      exampleAction: newPrincipleExample.trim() || 'Nhắc nhở nhẹ nhàng và khen ngợi ngay khi con biết hợp tác.',
      exampleActionEn: newPrincipleExample.trim() || 'Remind gently and praise immediately when your child cooperates.',
      category: 'core',
      icon: newPrincipleIcon || 'HeartHandshake'
    };
    onUpdateDisciplinePrinciples([...disciplinePrinciples, created]);
    setNewPrincipleTitle('');
    setNewPrincipleShortTag('');
    setNewPrincipleDesc('');
    setNewPrincipleExample('');
    setShowAddPrinciple(false);
    playSuccessChime(soundEnabled);
    setDisciplineNotice(
      language === 'vi'
        ? `✓ Đã thêm nguyên tắc kỷ luật gia đình: "${created.title}"!`
        : `✓ Added family principle: "${created.title}"!`
    );
    setTimeout(() => setDisciplineNotice(null), 3500);
  };

  const handleSaveEditedPrinciple = (updated: DisciplinePrinciple) => {
    if (!onUpdateDisciplinePrinciples) return;
    onUpdateDisciplinePrinciples(
      disciplinePrinciples.map((p) => (p.id === updated.id ? updated : p))
    );
    setEditingPrinciple(null);
    playSuccessChime(soundEnabled);
    setDisciplineNotice(
      language === 'vi'
        ? `✓ Đã lưu chỉnh sửa nguyên tắc "${updated.title}"!`
        : `✓ Updated principle "${updated.title}"!`
    );
    setTimeout(() => setDisciplineNotice(null), 3500);
  };

  const handleDeletePrinciple = (principleId: string) => {
    if (!onUpdateDisciplinePrinciples) return;
    playClick(soundEnabled);
    onUpdateDisciplinePrinciples(disciplinePrinciples.filter((p) => p.id !== principleId));
  };

  const handleRestoreDefaultPrinciples = () => {
    if (!onUpdateDisciplinePrinciples) return;
    onUpdateDisciplinePrinciples(INITIAL_DISCIPLINE_PRINCIPLES);
    playSuccessChime(soundEnabled);
    setDisciplineNotice(
      language === 'vi'
        ? '🔄 Đã khôi phục Bộ 5 Nguyên tắc Kỷ luật Vàng mặc định!'
        : '🔄 Restored the 5 Golden Principles!'
    );
    setTimeout(() => setDisciplineNotice(null), 3500);
  };

  // Discipline Analytics calculations
  const last7DaysDiscipline = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    const dayName = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });

    const logsForDay = disciplineLogs.filter((l) => l.date === key);
    const deductedStars = logsForDay.reduce((sum, l) => sum + l.penaltyStars, 0);
    const restoredStars = logsForDay.filter((l) => l.forgiven).reduce((sum, l) => sum + l.penaltyStars, 0);
    const incidents = logsForDay.length;

    return {
      dayName,
      date: key,
      deductedStars,
      restoredStars,
      incidents
    };
  });

  const categoryMap: Record<string, { name: string; nameEn: string; count: number; stars: number; color: string }> = {
    screen: { name: 'Màn hình / Tivi', nameEn: 'Screen Time', count: 0, stars: 0, color: '#f43f5e' },
    messy: { name: 'Bừa bộn đồ chơi/phòng', nameEn: 'Messy Toys/Room', count: 0, stars: 0, color: '#f59e0b' },
    sleep: { name: 'Thức khuya / Giờ giấc', nameEn: 'Bedtime Defiance', count: 0, stars: 0, color: '#6366f1' },
    tantrum: { name: 'Gắt gỏng / Nhõng nhẽo', nameEn: 'Tantrums / Whining', count: 0, stars: 0, color: '#8b5cf6' },
    food: { name: 'Ăn uống / Bỏ bữa', nameEn: 'Food / Skipping meals', count: 0, stars: 0, color: '#06b6d4' },
    fight: { name: 'Tranh giành / Bất hòa', nameEn: 'Sibling Disputes', count: 0, stars: 0, color: '#ec4899' },
    other: { name: 'Hành vi khác', nameEn: 'Other Behaviors', count: 0, stars: 0, color: '#64748b' }
  };

  disciplineLogs.forEach((log) => {
    const rid = (log.ruleId || '').toLowerCase();
    const reasonLower = (log.reason || '').toLowerCase();
    if (rid.includes('screen') || reasonLower.includes('tivi') || reasonLower.includes('điện thoại')) {
      categoryMap.screen.count += 1;
      categoryMap.screen.stars += log.penaltyStars;
    } else if (rid.includes('messy') || reasonLower.includes('bừa bộn') || reasonLower.includes('đồ chơi')) {
      categoryMap.messy.count += 1;
      categoryMap.messy.stars += log.penaltyStars;
    } else if (rid.includes('sleep') || rid.includes('late') || reasonLower.includes('ngủ') || reasonLower.includes('thức khuya')) {
      categoryMap.sleep.count += 1;
      categoryMap.sleep.stars += log.penaltyStars;
    } else if (rid.includes('tantrum') || reasonLower.includes('gắt gỏng') || reasonLower.includes('nhõng nhẽo')) {
      categoryMap.tantrum.count += 1;
      categoryMap.tantrum.stars += log.penaltyStars;
    } else if (rid.includes('food') || reasonLower.includes('ăn') || reasonLower.includes('rau')) {
      categoryMap.food.count += 1;
      categoryMap.food.stars += log.penaltyStars;
    } else if (rid.includes('fight') || rid.includes('dishonest') || reasonLower.includes('em') || reasonLower.includes('dối')) {
      categoryMap.fight.count += 1;
      categoryMap.fight.stars += log.penaltyStars;
    } else {
      categoryMap.other.count += 1;
      categoryMap.other.stars += log.penaltyStars;
    }
  });

  const pieDisciplineData = Object.values(categoryMap)
    .filter((c) => c.count > 0)
    .map((c) => ({
      name: language === 'vi' ? c.name : c.nameEn,
      value: c.count,
      stars: c.stars,
      color: c.color
    }));

  const totalDisciplineIncidents = disciplineLogs.length;
  const forgivenDisciplineIncidents = disciplineLogs.filter((l) => l.forgiven).length;
  const restorationRate =
    totalDisciplineIncidents > 0 ? Math.round((forgivenDisciplineIncidents / totalDisciplineIncidents) * 100) : 100;
  const totalDeductedStars = disciplineLogs.reduce((sum, l) => sum + l.penaltyStars, 0);
  const totalRestoredStars = disciplineLogs.filter((l) => l.forgiven).reduce((sum, l) => sum + l.penaltyStars, 0);

  const handleQuickApply = (rule: DisciplineRule) => {
    setPenaltyConfirmModal({
      rule,
      reason: language === 'vi' ? rule.title : rule.titleEn,
      stars: rule.penaltyStars
    });
  };

  const handleConfirmPenalty = () => {
    if (!penaltyConfirmModal) return;
    if (onApplyDiscipline) {
      onApplyDiscipline(penaltyConfirmModal.reason, penaltyConfirmModal.stars, penaltyConfirmModal.rule?.id);
    }
    const msg =
      language === 'vi'
        ? `Đã áp dụng trừ ${penaltyConfirmModal.stars} ⭐ cho hành vi: "${penaltyConfirmModal.reason}"`
        : `Deducted ${penaltyConfirmModal.stars} ⭐ for: "${penaltyConfirmModal.reason}"`;
    setDisciplineNotice(msg);
    setTimeout(() => setDisciplineNotice(null), 4000);
    setPenaltyConfirmModal(null);
  };

  const handleCustomPenaltySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDisciplineReason.trim()) return;
    if (onApplyDiscipline) {
      onApplyDiscipline(customDisciplineReason.trim(), customDisciplineStars);
    }
    const msg =
      language === 'vi'
        ? `Đã trừ ${customDisciplineStars} ⭐: "${customDisciplineReason.trim()}"`
        : `Deducted ${customDisciplineStars} ⭐: "${customDisciplineReason.trim()}"`;
    setDisciplineNotice(msg);
    setTimeout(() => setDisciplineNotice(null), 4000);
    setCustomDisciplineReason('');
    setCustomDisciplineStars(10);
  };

  const handleForgiveDisciplineAction = (logId: string) => {
    if (onForgiveDiscipline) {
      onForgiveDiscipline(logId);
      const msg =
        language === 'vi'
          ? 'Đã tha thứ và hoàn lại toàn bộ số sao cho bé! Bé sẽ rất vui và có thêm động lực!'
          : 'Forgiven! All stars have been restored to your child!';
      setDisciplineNotice(msg);
      setTimeout(() => setDisciplineNotice(null), 4000);
    }
  };

  const renderDisciplineIcon = (iconName: string) => {
    switch (iconName) {
      case 'Tv':
      case '📺':
        return <Tv className="w-5 h-5 text-rose-500" />;
      case 'AlertTriangle':
      case '⚠️':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'Box':
      case '📦':
        return <Box className="w-5 h-5 text-indigo-500" />;
      case 'Utensils':
      case '🍽️':
        return <Utensils className="w-5 h-5 text-orange-500" />;
      case 'Moon':
      case '🌙':
        return <Moon className="w-5 h-5 text-blue-500" />;
      case 'ShieldAlert':
      case '🤝':
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'Frown':
      case '😢':
        return <Frown className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    }
  };

  const renderPrincipleIcon = (iconName: string) => {
    switch (iconName) {
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5 text-rose-500" />;
      case 'Scale':
        return <Scale className="w-5 h-5 text-amber-500" />;
      case 'RotateCcw':
        return <RotateCcw className="w-5 h-5 text-emerald-500" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'Award':
        return <Award className="w-5 h-5 text-purple-500" />;
      default:
        return <Heart className="w-5 h-5 text-rose-500" />;
    }
  };

  const t = translations[language];

  const completedTasksToday = appState.tasks.filter((t) => t.isCompleted);
  const taskStarsToday = completedTasksToday.reduce(
    (sum, t) => sum + Math.max(1, Math.round(Number(t.stars) || 1)),
    0
  );
  const challengeStarsToday = (appState.challenges || [])
    .filter((c) => c.isCompletedToday)
    .reduce((sum, c) => sum + Math.max(1, Math.round(Number(c.stars) || 1)), 0);
  const todayEarnedStars =
    appState.profile.dailyStarsEarned !== undefined
      ? Math.max(Number(appState.profile.dailyStarsEarned) || 0, taskStarsToday + challengeStarsToday)
      : taskStarsToday + challengeStarsToday;
  const todayCompletionRate =
    appState.tasks.length > 0
      ? Math.round((completedTasksToday.length / appState.tasks.length) * 100)
      : 0;

  // 7-Day Training Data (from Tuesday to Monday Today)
  const fixedWeekLabelsVi = ['Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN', 'Thứ 2'];
  const fixedWeekLabelsEn = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
  const fallbackDailyStars = [24, 28, 28, 28, 30, 28, todayEarnedStars];
  const fallbackRates = [71, 76, 82, 88, 94, 94, todayCompletionRate];
  const fallbackTasksDone = [12, 13, 14, 15, 16, 16, completedTasksToday.length];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    const isToday = i === 6 || key === appState.profile.lastActiveDate;
    const record = appState.history?.[key];

    const dayLabel = language === 'vi' ? fixedWeekLabelsVi[i] : fixedWeekLabelsEn[i];

    let stars = fallbackDailyStars[i];
    let rate = fallbackRates[i];
    let tasksDone = fallbackTasksDone[i];

    if (isToday) {
      stars = todayEarnedStars;
      rate = todayCompletionRate;
      tasksDone = completedTasksToday.length;
    } else if (record && record.starsEarned > 0) {
      stars = record.starsEarned;
      rate = record.completionRate;
      tasksDone =
        record.completedTaskIds && record.completedTaskIds.length > 0
          ? record.completedTaskIds.length
          : Math.min(appState.tasks.length, record.starsEarned);
    }

    return {
      dateKey: key,
      label: isToday ? (language === 'vi' ? `${dayLabel} (H.Nay)` : `${dayLabel} (Today)`) : dayLabel,
      shortLabel: dayLabel,
      fullDate: `${day}/${month}`,
      rate,
      stars,
      tasksDone,
      totalTasks: appState.tasks.length || 17,
      isToday
    };
  });

  // Calculate Habit Group Stats & Dynamic Insight
  const habitStats = {
    self_care: appState.tasks.filter((t) => t.habitGroup === 'self_care'),
    study: appState.tasks.filter((t) => t.habitGroup === 'study'),
    health_sport: appState.tasks.filter((t) => t.habitGroup === 'health_sport'),
    family_help: appState.tasks.filter((t) => t.habitGroup === 'family_help')
  };

  const getHabitRate = (groupTasks: Task[]) => {
    if (groupTasks.length === 0) return 0;
    const done = groupTasks.filter((t) => t.isCompleted).length;
    return Math.round((done / groupTasks.length) * 100);
  };

  const habitGroupDetails = [
    {
      key: 'self_care' as const,
      name: language === 'vi' ? 'Tự phục vụ cá nhân' : t.habitSelfCare,
      rate: getHabitRate(habitStats.self_care),
      done: habitStats.self_care.filter((t) => t.isCompleted).length,
      total: habitStats.self_care.length,
      barColor: 'bg-amber-500'
    },
    {
      key: 'study' as const,
      name: language === 'vi' ? 'Học tập & Đọc sách' : t.habitStudy,
      rate: getHabitRate(habitStats.study),
      done: habitStats.study.filter((t) => t.isCompleted).length,
      total: habitStats.study.length,
      barColor: 'bg-indigo-500'
    },
    {
      key: 'health_sport' as const,
      name: language === 'vi' ? 'Sức khỏe & Vận động' : t.habitHealth,
      rate: getHabitRate(habitStats.health_sport),
      done: habitStats.health_sport.filter((t) => t.isCompleted).length,
      total: habitStats.health_sport.length,
      barColor: 'bg-emerald-500'
    },
    {
      key: 'family_help' as const,
      name: language === 'vi' ? 'Giúp đỡ gia đình' : t.habitFamily,
      rate: getHabitRate(habitStats.family_help),
      done: habitStats.family_help.filter((t) => t.isCompleted).length,
      total: habitStats.family_help.length,
      barColor: 'bg-rose-500'
    }
  ];

  const sortedByRateDesc = [...habitGroupDetails].sort((a, b) => b.rate - a.rate);
  const topHabitGroup = sortedByRateDesc[0];
  const activeHabitGroups = sortedByRateDesc.filter((g) => g.rate > 0);
  const zeroHabitGroups = habitGroupDetails.filter((g) => g.rate === 0);

  const dynamicHabitEvaluation = (() => {
    if (activeHabitGroups.length === 0) {
      return {
        summary:
          language === 'vi'
            ? `Hôm nay bé ${appState.profile.name} chưa bắt đầu nhiệm vụ nào trong cả 4 nhóm thói quen (0%).`
            : `${appState.profile.name} hasn't completed any tasks across the 4 habit groups today (0%).`,
        suggestion:
          language === 'vi'
            ? 'Gợi ý cho Ba Mẹ: Khích lệ bé khởi động ngày mới bằng các việc Tự phục vụ cá nhân buổi sáng (đánh răng, gấp chăn màn, ăn sáng) để nhận những ngôi sao đầu tiên nhé!'
            : 'Parent tip: Encourage your child to start with Morning Self-Care tasks!'
      };
    }

    const activeSummaryText = activeHabitGroups
      .map((g) => `${g.name} (${g.rate}% - ${g.done}/${g.total} việc)`)
      .join(' và ');

    if (zeroHabitGroups.length > 0) {
      const zeroNames = zeroHabitGroups.map((g) => `${g.name} (0%)`).join(', ');
      return {
        summary:
          language === 'vi'
            ? `Hôm nay bé thực hiện tốt nhất nhóm ${topHabitGroup.name} (${topHabitGroup.rate}% - ${topHabitGroup.done}/${topHabitGroup.total} việc)${
                activeHabitGroups.length > 1
                  ? `, cùng với ${activeHabitGroups
                      .slice(1)
                      .map((g) => `${g.name} (${g.rate}%)`)
                      .join(', ')}`
                  : ''
              }. Hiện tại nhóm ${zeroNames} đang ở mức 0% (chưa thực hiện).`
            : `Today ${topHabitGroup.name} leads at ${topHabitGroup.rate}%, while ${zeroNames} are currently at 0%.`,
        suggestion:
          language === 'vi'
            ? `Gợi ý cho Ba Mẹ: Khen ngợi bé đã tự giác làm tốt nhóm ${topHabitGroup.name} (${topHabitGroup.rate}%); đồng thời nhắc nhẹ và đồng hành cùng bé hoàn thành các việc thuộc nhóm ${zeroHabitGroups
                .map((g) => g.name)
                .join(' & ')} vào buổi chiều và tối nay nhé!`
            : `Parent tip: Praise ${topHabitGroup.name} (${topHabitGroup.rate}%) and gently remind your child to work on ${zeroHabitGroups
                .map((g) => g.name)
                .join(' & ')} this afternoon/evening!`
      };
    }

    const lowestGroup = sortedByRateDesc[sortedByRateDesc.length - 1];
    return {
      summary:
        language === 'vi'
          ? `Tuyệt vời! Bé đã khởi động đều cả 4 nhóm thói quen hôm nay (${activeSummaryText}), nổi bật nhất là nhóm ${topHabitGroup.name} đạt ${topHabitGroup.rate}%.`
          : `Great job! All 4 habit groups have progress today, led by ${topHabitGroup.name} at ${topHabitGroup.rate}%.`,
      suggestion:
        language === 'vi'
          ? `Gợi ý cho Ba Mẹ: Khen ngợi sự toàn diện của bé ở nhóm ${topHabitGroup.name}, và cổ vũ bé hoàn thành nốt các việc còn lại của nhóm ${lowestGroup.name} (${lowestGroup.rate}%) để đạt 100% mục tiêu ngày!`
          : `Parent tip: Celebrate ${topHabitGroup.name} and encourage finishing the remaining tasks in ${lowestGroup.name} (${lowestGroup.rate}%)!`
    };
  })();

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const clampedStars = Math.max(1, Math.min(10, Math.round(Number(newTaskStars) || 1)));

    const newTask: Task = {
      id: `custom_${Date.now()}`,
      title: newTaskTitle.trim(),
      titleEn: newTaskTitleEn.trim() || newTaskTitle.trim(),
      description: newTaskDescription.trim() || 'Nhiệm vụ rèn luyện do bố mẹ giao',
      descriptionEn: newTaskDescription.trim() || 'Daily chore assigned by parents',
      category: newTaskCategory,
      habitGroup: newTaskHabit || tagToHabitGroup(newTaskTag),
      tag: newTaskTag,
      stars: clampedStars,
      xp: Number(newTaskXp) || 20,
      timeExpected: newTaskTimeExpected.trim() || undefined,
      iconName: 'Sparkles',
      isCompleted: false,
      pendingApproval: false,
      voicePromptVi:
        newTaskVoiceVi.trim() || `Bé đã hoàn thành ${newTaskTitle}! Ba mẹ rất tự hào về bé!`,
      voicePromptEn: `Great job completing ${newTaskTitleEn || newTaskTitle}! Keep it up!`
    };

    onUpdateTasks([...appState.tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskTitleEn('');
    setNewTaskDescription('');
    setNewTaskVoiceVi('');
    setShowAddTask(false);
    playSuccessChime(soundEnabled);
    setStarAdjustToast(
      language === 'vi'
        ? `✓ Đã thêm nhiệm vụ "${newTask.title}" (+${newTask.stars} ⭐)!`
        : `✓ Added quest "${newTask.titleEn}" (+${newTask.stars} ⭐)!`
    );
    setTimeout(() => setStarAdjustToast(null), 3500);
  };

  const handleDeleteTask = (taskId: string) => {
    playClick(soundEnabled);
    onUpdateTasks(appState.tasks.filter((t) => t.id !== taskId));
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);
    const currentStoredPin = appState.settings.pin || '1234';

    // Support both quick pinInput change and full verified password change
    if (newPinInput || confirmPinInput || currentPinVerify) {
      if (currentPinVerify !== currentStoredPin) {
        setPinChangeError(
          language === 'vi'
            ? 'Mật khẩu hiện tại chưa đúng. Vui lòng kiểm tra lại!'
            : 'Current password/PIN is incorrect!'
        );
        return;
      }
      if (newPinInput.length < 4 || newPinInput.length > 8) {
        setPinChangeError(
          language === 'vi'
            ? 'Mật khẩu mới cần có từ 4 đến 8 chữ số!'
            : 'New PIN must be 4 to 8 digits!'
        );
        return;
      }
      if (newPinInput !== confirmPinInput) {
        setPinChangeError(
          language === 'vi'
            ? 'Mật khẩu xác nhận không khớp với mật khẩu mới!'
            : 'Confirmation PIN does not match!'
        );
        return;
      }
      onUpdateSettings({
        ...appState.settings,
        pin: newPinInput
      });
      setPinInput(newPinInput);
      setCurrentPinVerify('');
      setNewPinInput('');
      setConfirmPinInput('');
      setShowChangePinModal(false);
      playSuccessChime(soundEnabled);
      setSaveNotice(true);
      setStarAdjustToast(
        language === 'vi'
          ? '🔐 Đã thay đổi mật khẩu Phụ huynh thành công!'
          : '🔐 Parent password updated successfully!'
      );
      setTimeout(() => {
        setSaveNotice(false);
        setStarAdjustToast(null);
      }, 3500);
      return;
    }

    if (pinInput.length >= 4 && pinInput.length <= 8) {
      onUpdateSettings({
        ...appState.settings,
        pin: pinInput
      });
      playSuccessChime(soundEnabled);
      setSaveNotice(true);
      setStarAdjustToast(
        language === 'vi'
          ? '🔐 Đã lưu mật khẩu Phụ huynh mới!'
          : '🔐 Saved new Parent PIN!'
      );
      setTimeout(() => {
        setSaveNotice(false);
        setStarAdjustToast(null);
      }, 3500);
    } else {
      setPinChangeError(
        language === 'vi'
          ? 'Mật khẩu cần có từ 4 đến 8 chữ số!'
          : 'PIN must be 4 to 8 digits!'
      );
    }
  };

  const pendingRewards = appState.rewards.filter((r) => r.status === 'requested');
  const pendingTasks = appState.tasks.filter((t) => t.pendingApproval && !t.isCompleted);
  const pendingChallenges = (appState.challenges || []).filter(
    (c) => c.pendingApproval && !c.isCompletedToday
  );
  const totalPendingRequests =
    pendingTasks.length + pendingChallenges.length + pendingRewards.length;

  return (
    <div className="space-y-5">
      {/* Star Adjust Toast Notification */}
      {starAdjustToast && (
        <div className="fixed top-6 right-6 z-50 bg-amber-500 text-slate-950 font-black text-sm px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-white animate-in fade-in slide-in-from-top-3 duration-300">
          <Star className="w-5 h-5 fill-slate-950 text-slate-950" />
          <span>{starAdjustToast}</span>
        </div>
      )}

      {/* Compact Parent Top Header & Sub-Navigation Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h2 className="text-lg sm:text-xl font-extrabold font-display text-white">
                {t.parentDashboard}
              </h2>
            </div>

            {/* Khung Hồ Sơ Hiệp Sĩ Cơ Minh (Lv.15/30 nhỏ gọn) */}
            <div
              onClick={handleOpenEditProfile}
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left shadow-sm cursor-pointer transition-colors"
              title="Bấm để chỉnh sửa hồ sơ của bé"
            >
              <img
                src={appState.profile.avatar}
                alt={appState.profile.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-xl object-cover border border-amber-300 shrink-0 bg-amber-50"
              />
              <div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white">
                  <span>{appState.profile.name}</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono">
                    Lv.{appState.profile.level}/30
                  </span>
                </div>
                <div className="text-[10px] font-medium text-slate-300 flex items-center gap-1.5">
                  <span>{appState.profile.grade}</span>
                  <span>•</span>
                  <span className="text-orange-300 font-bold">
                    🔥 {appState.profile.streakDays} ngày liên tiếp
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setPinChangeError(null);
                setCurrentPinVerify('');
                setNewPinInput('');
                setConfirmPinInput('');
                setShowChangePinModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl transition-colors shadow whitespace-nowrap cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Đổi mật khẩu' : 'Change PIN'}</span>
            </button>

            <button
              onClick={() => {
                playClick(soundEnabled);
                onExitParentMode();
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.exitParentMode}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Inside Header */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/90 rounded-2xl overflow-x-auto border border-slate-700/70">
          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveTab('report');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'report'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Báo cáo tổng' : t.reportTab}</span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveTab('goals');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Lịch sử lời nhắn' : 'Goal History'}</span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveTab('discipline');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'discipline'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {language === 'vi'
                ? `Kỷ luật (${disciplineRules.length})`
                : `${t.disciplineTab} (${disciplineRules.length})`}
            </span>
            {activeUnforgivenLogs.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                {activeUnforgivenLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveTab('tasks');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>
              {language === 'vi' ? `Nhiệm vụ (${appState.tasks.length})` : `${t.taskManagerTab} (${appState.tasks.length})`}
            </span>
            {pendingTasks.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono flex items-center justify-center font-black">
                {pendingTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveTab('challenges');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'challenges'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {language === 'vi'
                ? `Thử thách (${appState.challenges.length})`
                : `Challenges (${appState.challenges.length})`}
            </span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveTab('rewards');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'rewards'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>
              {language === 'vi'
                ? `Đổi quà (${appState.rewards.length})`
                : `Rewards (${appState.rewards.length})`}
            </span>
            {pendingRewards.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                {pendingRewards.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setActiveTab('settings');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t.settingsTab}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Progress Reports (Báo Cáo Tổng) */}
      {activeTab === 'report' && (
        <div className="space-y-5">
          {/* =====================================================================
              PHẦN 1 (Trên cùng):
              - Khung Hồ sơ Hiệp Sĩ Cơ Minh (Lv.15/30) & Lời nhắn mục tiêu của Ba Mẹ (sửa & lưu nhanh)
              - Cụm nút Chấm sao nhanh (+1, +5, -1, -5, Sửa sao nhanh & Reset điểm)
              - Danh sách "Yêu cầu chờ Ba Mẹ duyệt" (duyệt 1 chạm)
          ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Cột trái Phần 1 (7 phần): Hồ sơ Hiệp Sĩ Cơ Minh & Lời nhắn mục tiêu (Sửa & Lưu nhanh) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-rose-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={appState.profile.avatar}
                    alt={appState.profile.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400 shrink-0 bg-amber-50"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                        {appState.profile.name}
                      </span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-mono">
                        Lv.{appState.profile.level}/30
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        ({appState.profile.grade})
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      <span>Lời nhắn mục tiêu của Ba Mẹ gửi bé hôm nay:</span>
                    </div>
                  </div>
                </div>

                {goalMessageSaved && (
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    ✓ Đã lưu lời nhắn!
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveGoalMessage} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  maxLength={180}
                  value={goalMessageInput}
                  onChange={(e) => setGoalMessageInput(e.target.value)}
                  placeholder="Nhập lời nhắn động viên mục tiêu hôm nay cho bé..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Lưu lời nhắn</span>
                </button>
              </form>
            </div>

            {/* Cột phải Phần 1 (5 phần): Cụm nút Chấm sao nhanh (+1, +5, -1, -5, Sửa sao nhanh & Reset điểm) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-amber-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Chấm Sao Nhanh &amp; Điều Chỉnh Điểm
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {appState.profile.stars} ⭐
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      (Hôm nay: +{todayEarnedStars} ⭐ • {completedTasksToday.length}/{appState.tasks.length} việc)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setCustomStarAmount(appState.profile.stars);
                    setCustomStarReason('Phụ huynh nhập nhanh số sao tổng hiện tại');
                    setStarAdjustMode('set');
                    setShowStarAdjustModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Sửa sao nhanh</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExecuteStarAdjust(1, false, 'Thưởng +1 sao hoàn thành tốt')}
                  className="flex-1 min-w-[56px] py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-transform text-center cursor-pointer"
                >
                  +1 ⭐
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteStarAdjust(5, false, 'Thưởng +5 sao xuất sắc')}
                  className="flex-1 min-w-[56px] py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-xs shadow-xs transition-transform text-center cursor-pointer"
                >
                  +5 ⭐
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteStarAdjust(-1, false, 'Trừ 1 sao nhắc nhở')}
                  className="flex-1 min-w-[56px] py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-transform text-center cursor-pointer"
                >
                  -1 ⭐
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteStarAdjust(-5, false, 'Vi phạm thỏa thuận')}
                  className="flex-1 min-w-[56px] py-2 rounded-xl bg-rose-700 hover:bg-rose-600 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-transform text-center cursor-pointer"
                >
                  -5 ⭐
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setShowResetPointsModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-700 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-extrabold text-xs border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset điểm</span>
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách "Yêu cầu chờ Ba Mẹ duyệt" (Nhiệm vụ, Thử thách, Đổi quà - Duyệt 1 chạm) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-sm">
                  ⏳
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Yêu cầu chờ Ba Mẹ duyệt ({totalPendingRequests} yêu cầu)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Khi bé bấm hoàn thành nhiệm vụ, thử thách hoặc đổi quà, ba mẹ bấm Duyệt 1 chạm ngay tại đây.
                  </p>
                </div>
              </div>

              {onApproveAllTasks && pendingTasks.length + pendingChallenges.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    onApproveAllTasks();
                    setStarAdjustToast(
                      `Đã duyệt toàn bộ ${pendingTasks.length + pendingChallenges.length} mục cho bé ${appState.profile.name}!`
                    );
                    setTimeout(() => setStarAdjustToast(null), 3500);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-transform active:scale-95 whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  ✓ Duyệt tất cả ({pendingTasks.length + pendingChallenges.length})
                </button>
              )}
            </div>

            {totalPendingRequests === 0 ? (
              <div className="py-2.5 px-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Hiện không có yêu cầu nào chờ duyệt (0 yêu cầu Thử thách &amp; Đổi quà).</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {pendingTasks.map((task) => {
                  const starVal = Math.max(1, Math.round(Number(task.stars) || 1));
                  return (
                    <div
                      key={task.id}
                      className="bg-amber-50/60 dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          📋 {language === 'vi' ? task.title : task.titleEn}
                        </div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold font-mono mt-0.5">
                          Nhiệm vụ • +{starVal} ⭐
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onApproveTask && (
                          <button
                            type="button"
                            onClick={() => onApproveTask(task.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                          >
                            ✓ Duyệt
                          </button>
                        )}
                        {onRejectTask && (
                          <button
                            type="button"
                            onClick={() => onRejectTask(task.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs cursor-pointer"
                          >
                            Làm lại
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {pendingChallenges.map((challenge) => {
                  const starVal = Math.max(1, Math.round(Number(challenge.stars) || 1));
                  return (
                    <div
                      key={challenge.id}
                      className="bg-violet-50/70 dark:bg-slate-900 border border-violet-300 dark:border-violet-800 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          ⚡ {language === 'vi' ? challenge.title : challenge.titleEn}
                        </div>
                        <div className="text-[11px] text-violet-700 dark:text-violet-400 font-bold font-mono mt-0.5">
                          Thử thách • +{starVal} ⭐
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {onApproveChallenge && (
                          <button
                            type="button"
                            onClick={() => onApproveChallenge(challenge.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                          >
                            ✓ Duyệt
                          </button>
                        )}
                        {onRejectChallenge && (
                          <button
                            type="button"
                            onClick={() => onRejectChallenge(challenge.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs cursor-pointer"
                          >
                            Làm lại
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {pendingRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-rose-50/70 dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        🎁 {language === 'vi' ? reward.title : reward.titleEn}
                      </div>
                      <div className="text-[11px] text-rose-700 dark:text-rose-400 font-bold font-mono mt-0.5">
                        Đổi quà • {reward.cost} ⭐
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onApproveReward(reward.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                      >
                        ✓ Duyệt quà
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectReward(reward.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold text-xs cursor-pointer"
                      >
                        Hoàn sao
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =====================================================================
              PHẦN 2 (Ở giữa - 4 ô thẻ số liệu to, rõ ràng trên 1 hàng ngang):
              1. Sao kiếm hôm nay: +4 ⭐ (Đã xong 4/17 việc)
              2. Kho sao tích lũy: 170 ⭐ (Dùng để đổi phần thưởng với Ba Mẹ)
              3. Chờ Ba Mẹ duyệt: 0 yêu cầu (Thử thách & Đổi quà)
              4. Chuỗi ngày tự giác: 2 ngày liên tiếp
          ===================================================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Thẻ 1: Sao kiếm hôm nay */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-amber-200 dark:border-amber-800/60 shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-extrabold mb-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" />
                <span>Sao kiếm hôm nay</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                +{todayEarnedStars} ⭐
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                Đã xong {completedTasksToday.length}/{appState.tasks.length} việc
              </div>
            </div>

            {/* Thẻ 2: Kho sao tích lũy */}
            <div className="bg-gradient-to-br from-indigo-50 to-amber-50/60 dark:from-slate-800 dark:to-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/60 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold mb-1.5">
                <Award className="w-4 h-4 shrink-0" />
                <span>Kho sao tích lũy hiện có</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {appState.profile.stars} ⭐
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                Dùng để đổi phần thưởng với Ba Mẹ
              </div>
            </div>

            {/* Thẻ 3: Chờ Ba Mẹ duyệt */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-xs font-extrabold mb-1.5">
                <CheckSquare className="w-4 h-4 shrink-0" />
                <span>Chờ Ba Mẹ duyệt</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {totalPendingRequests} yêu cầu
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                Thử thách &amp; Đổi quà
              </div>
            </div>

            {/* Thẻ 4: Chuỗi ngày tự giác */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-orange-200 dark:border-orange-800/60 shadow-sm">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-xs font-extrabold mb-1.5">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500 shrink-0" />
                <span>Chuỗi ngày tự giác</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {appState.profile.streakDays} ngày liên tiếp
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                Cấp độ hiện tại: Lv.{appState.profile.level}/30
              </div>
            </div>
          </div>

          {/* =====================================================================
              PHẦN 3 (Phía dưới - Chia 2 cột cạnh nhau trên màn hình ngang iPad):
              - Cột trái: "Kết Quả Rèn Luyện 7 Ngày Qua" (1 biểu đồ cột đơn giản từ Thứ 3 đến Thứ 2 hôm nay)
              - Cột phải: "Tỷ Lệ 4 Nhóm Thói Quen Hôm Nay" + Nhận xét gợi ý tự động theo % thực tế
          ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CỘT TRÁI: Kết Quả Rèn Luyện 7 Ngày Qua */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    <span>Kết Quả Rèn Luyện 7 Ngày Qua</span>
                  </h3>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono">
                    Hôm nay: +{todayEarnedStars} ⭐ • {completedTasksToday.length}/{appState.tasks.length} việc
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  Số sao kiếm được mỗi ngày (từ Thứ 3 đến Thứ 2 hôm nay) và tỷ lệ % hoàn thành nhiệm vụ dưới chân cột
                </p>
              </div>

              {/* Biểu đồ cột đơn giản, trực quan từ Thứ 3 đến Thứ 2 hôm nay */}
              <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 px-1 border-b border-slate-200 dark:border-slate-700">
                {last7Days.map((day, idx) => {
                  const maxBarStars = Math.max(30, ...last7Days.map((d) => d.stars));
                  const barHeightPct = Math.max(12, Math.round((day.stars / maxBarStars) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      {/* Số sao kiếm được trên đỉnh cột */}
                      <div
                        className={`text-xs font-mono font-black mb-1.5 px-1.5 py-0.5 rounded-md ${
                          day.isToday
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        +{day.stars}⭐
                      </div>

                      {/* Thân cột */}
                      <div className="w-full flex-1 flex items-end justify-center">
                        <div
                          className={`w-full max-w-[46px] rounded-t-xl transition-all shadow-sm ${
                            day.isToday
                              ? 'bg-gradient-to-t from-amber-500 to-yellow-400 ring-2 ring-amber-400/50'
                              : 'bg-gradient-to-t from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300'
                          }`}
                          style={{ height: `${barHeightPct}%` }}
                          title={`${day.label}: +${day.stars} ⭐ (${day.rate}% - ${day.tasksDone}/${day.totalTasks} việc)`}
                        />
                      </div>

                      {/* Chân cột: Thứ & % hoàn thành nhiệm vụ */}
                      <div className="mt-2 text-center">
                        <div
                          className={`text-[11px] sm:text-xs font-extrabold whitespace-nowrap ${
                            day.isToday
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {day.isToday ? 'Thứ 2 (H.Nay)' : day.shortLabel}
                        </div>
                        <div
                          className={`text-[11px] font-mono font-bold mt-0.5 ${
                            day.isToday
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {day.rate}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Chuỗi hiện tại: <strong className="text-orange-600 dark:text-orange-400">{appState.profile.streakDays} ngày liên tiếp</strong>
                </span>
                <span>
                  Chi tiết hôm nay: <strong className="text-emerald-600 dark:text-emerald-400">+{todayEarnedStars} ⭐ • {completedTasksToday.length}/{appState.tasks.length} việc ({todayCompletionRate}%)</strong>
                </span>
              </div>
            </div>

            {/* CỘT PHẢI: Tỷ Lệ 4 Nhóm Thói Quen Hôm Nay + Nhận xét tự động */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">
                    Tỷ Lệ 4 Nhóm Thói Quen Hôm Nay
                  </h3>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                    Tổng: {completedTasksToday.length}/{appState.tasks.length} việc ({todayCompletionRate}%)
                  </span>
                </div>

                <div className="space-y-3.5">
                  {habitGroupDetails.map((group) => (
                    <div key={group.key}>
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold mb-1.5">
                        <span className="text-slate-800 dark:text-slate-100">{group.name}</span>
                        <span className="font-mono font-extrabold text-slate-700 dark:text-slate-200">
                          {group.rate}% ({group.done}/{group.total} việc)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${group.barColor} rounded-full transition-all duration-300`}
                          style={{ width: `${group.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Khung Nhận xét & Gợi ý tự động khớp với % thực tế của từng nhóm */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50/70 dark:from-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-indigo-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Nhận xét &amp; Gợi ý theo tiến độ thực tế hôm nay</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {dynamicHabitEvaluation.summary}
                </p>
                <div className="pt-2 border-t border-indigo-200/60 dark:border-slate-700 text-xs font-bold text-indigo-900 dark:text-amber-300 leading-relaxed">
                  💡 {dynamicHabitEvaluation.suggestion}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Goal History Calendar & Archive */}
      {activeTab === 'goals' && (() => {
        const calendarYear = calendarMonth.getFullYear();
        const calendarMonthIndex = calendarMonth.getMonth();
        const firstDayOfMonth = new Date(calendarYear, calendarMonthIndex, 1);
        const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
        const totalDaysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();

        const monthGoals = Object.values(appState.goalHistory || {}).filter((item) =>
          item.date.startsWith(`${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}`)
        );

        const allGoalsList = Object.values(appState.goalHistory || {}).sort((a, b) =>
          b.date.localeCompare(a.date)
        );

        const selectedGoal = appState.goalHistory?.[selectedCalendarDateKey];

        const monthName = calendarMonth.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
          month: 'long',
          year: 'numeric'
        });

        const weekDays =
          language === 'vi'
            ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const handleReuseMessage = (message: string) => {
          setGoalMessageInput(message);
          const todayKey = appState.profile.lastActiveDate;
          const newGoalHistory = {
            ...(appState.goalHistory || {}),
            [todayKey]: {
              date: todayKey,
              message,
              setAt: new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          };
          onUpdateSettings(
            {
              ...appState.settings,
              dailyGoalMessage: message
            },
            newGoalHistory
          );
          playSuccessChime(soundEnabled);
          setGoalMessageSaved(true);
          setTimeout(() => setGoalMessageSaved(false), 3000);
        };

        const formatSelectedDate = (dateKey: string) => {
          const [y, m, d] = dateKey.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          return dateObj.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        };

        return (
          <div className="space-y-6">
            {/* Header with View Toggle */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-rose-500" />
                  <span>
                    {language === 'vi' ? 'Lịch Sử Lời Nhắn Mục Tiêu Cho Bé' : 'Goal History & Calendar View'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'vi'
                    ? 'Xem lại các lời nhắn động viên ba mẹ đã gửi trong tháng qua và kết quả rèn luyện của bé'
                    : 'Browse through daily encouragement goals set over the past month and child achievements'}
                </p>
              </div>

              {/* View Mode Segmented Controls */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-750 rounded-xl self-start sm:self-auto border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setHistoryViewMode('calendar');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    historyViewMode === 'calendar'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Lịch tháng' : 'Calendar'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setHistoryViewMode('list');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    historyViewMode === 'list'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Danh sách' : 'Timeline'}</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 fill-rose-500" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    {language === 'vi' ? 'Lời nhắn trong tháng này' : 'Goals set this month'}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {monthGoals.length} {language === 'vi' ? 'ngày có lời nhắn' : 'days with goals'}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    {language === 'vi' ? 'Tỷ lệ hoàn thành thói quen' : 'Average completion rate'}
                  </div>
                  <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    {appState.tasks.length > 0
                      ? Math.round(
                          (appState.tasks.filter((t) => t.isCompleted).length /
                            appState.tasks.length) *
                            100
                        )
                      : 0}
                    %
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    {language === 'vi' ? 'Tác động tâm lý tích cực' : 'Positive habit impact'}
                  </div>
                  <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {language === 'vi' ? '+22% tự giác khi có lời nhắn' : '+22% higher focus with goals'}
                  </div>
                </div>
              </div>
            </div>

            {/* CALENDAR VIEW */}
            {historyViewMode === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Month Calendar Matrix (7 columns on desktop) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  {/* Calendar Month Navigation Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white capitalize font-display">
                      {monthName}
                    </h4>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          playClick(soundEnabled);
                          setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1));
                        }}
                        title={language === 'vi' ? 'Tháng trước' : 'Previous month'}
                        className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playClick(soundEnabled);
                          const now = new Date();
                          setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                          setSelectedCalendarDateKey(appState.profile.lastActiveDate);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                      >
                        {language === 'vi' ? 'Hôm nay' : 'Today'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playClick(soundEnabled);
                          setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1));
                        }}
                        title={language === 'vi' ? 'Tháng sau' : 'Next month'}
                        className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day of Week Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 py-1 border-b border-slate-100 dark:border-slate-700">
                    {weekDays.map((wd, i) => (
                      <div key={i} className={i >= 5 ? 'text-rose-500' : ''}>
                        {wd}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid Cells */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {/* Blank leading days */}
                    {Array.from({ length: startingDayIndex }).map((_, idx) => (
                      <div key={`blank-${idx}`} className="h-16 sm:h-20 rounded-xl bg-slate-50/40 dark:bg-slate-900/20" />
                    ))}

                    {/* Active Days in Month */}
                    {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
                      const dayNumber = idx + 1;
                      const dayStr = String(dayNumber).padStart(2, '0');
                      const monthStr = String(calendarMonthIndex + 1).padStart(2, '0');
                      const dateKey = `${calendarYear}-${monthStr}-${dayStr}`;

                      const goalItem = appState.goalHistory?.[dateKey];
                      const hasGoal = Boolean(goalItem);
                      const isToday = dateKey === appState.profile.lastActiveDate;
                      const isSelected = dateKey === selectedCalendarDateKey;

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => {
                            playClick(soundEnabled);
                            setSelectedCalendarDateKey(dateKey);
                          }}
                          className={`h-16 sm:h-20 p-1.5 rounded-xl text-left flex flex-col justify-between transition-all relative border ${
                            isSelected
                              ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
                              : hasGoal
                              ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/60 hover:border-rose-300'
                              : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={`text-xs font-mono font-bold ${
                                isToday
                                  ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {dayNumber}
                            </span>

                            {hasGoal && (
                              <span className="text-[11px]" title="Có lời nhắn từ ba mẹ">
                                ❤️
                              </span>
                            )}
                          </div>

                          {/* Mini quote indicator */}
                          {hasGoal ? (
                            <div className="w-full">
                              <p className="text-[10px] text-rose-700 dark:text-rose-300 font-medium truncate leading-tight">
                                {goalItem?.message}
                              </p>
                              {goalItem?.completionRate !== undefined && (
                                <div className="text-[9px] font-mono font-semibold text-slate-500">
                                  {goalItem.completionRate}%
                                </div>
                              )}
                            </div>
                          ) : (
                            <span />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-rose-100 border border-rose-300 flex items-center justify-center text-[8px]">
                        ❤️
                      </span>
                      <span>{language === 'vi' ? 'Ngày có lời nhắn' : 'Day with goal'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-indigo-600" />
                      <span>{language === 'vi' ? 'Hôm nay' : 'Today'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Selected Day Inspector (5 columns on desktop) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                      {formatSelectedDate(selectedCalendarDateKey)}
                    </h4>

                    {selectedCalendarDateKey === appState.profile.lastActiveDate && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 text-[11px] font-bold">
                        {language === 'vi' ? 'Hôm nay' : 'Today'}
                      </span>
                    )}
                  </div>

                  {selectedGoal ? (
                    <div className="space-y-4">
                      {/* Message Quote Box */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 dark:from-slate-900 dark:to-slate-900/90 border border-rose-200 dark:border-rose-900/50">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold mb-2">
                          <Heart className="w-4 h-4 fill-rose-500" />
                          <span>
                            {language === 'vi'
                              ? 'Lời nhắn ba mẹ đã gửi:'
                              : 'Encouragement message sent:'}
                          </span>
                        </div>

                        <p className="text-sm text-slate-800 dark:text-slate-100 font-medium italic leading-relaxed">
                          &ldquo;{selectedGoal.message}&rdquo;
                        </p>

                        {selectedGoal.setAt && (
                          <div className="text-[11px] text-slate-400 mt-2 font-mono">
                            {language === 'vi' ? 'Gửi lúc:' : 'Sent at:'} {selectedGoal.setAt}
                          </div>
                        )}
                      </div>

                      {/* Day Stats if available */}
                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500 mb-0.5">
                            {language === 'vi' ? 'Số sao kiếm được' : 'Stars earned'}
                          </div>
                          <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                            {selectedCalendarDateKey === appState.profile.lastActiveDate
                              ? `+${todayEarnedStars} ⭐ • ${completedTasksToday.length}/${appState.tasks.length} việc`
                              : `+${selectedGoal.starsEarned ?? 4} ⭐`}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500 mb-0.5">
                            {language === 'vi' ? 'Tỷ lệ hoàn thành' : 'Completion rate'}
                          </div>
                          <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                            {selectedCalendarDateKey === appState.profile.lastActiveDate
                              ? `${todayCompletionRate}%`
                              : `${selectedGoal.completionRate ?? 24}%`}
                          </div>
                        </div>
                      </div>

                      {/* Reuse Message Action */}
                      <button
                        type="button"
                        onClick={() => handleReuseMessage(selectedGoal.message)}
                        className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>
                          {language === 'vi'
                            ? 'Dùng lại lời nhắn này cho hôm nay'
                            : 'Reuse this goal message today'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                        <Heart className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="text-xs text-slate-500">
                        {language === 'vi'
                          ? 'Chưa có lời nhắn mục tiêu nào được lưu vào ngày này.'
                          : 'No goal message was recorded on this day.'}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          playClick(soundEnabled);
                          setActiveTab('settings');
                        }}
                        className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
                      >
                        {language === 'vi' ? 'Đặt lời nhắn mới cho bé ✏️' : 'Set a new goal message ✏️'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TIMELINE LIST VIEW */}
            {historyViewMode === 'list' && (
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                  {language === 'vi' ? 'Danh sách lời nhắn theo dòng thời gian' : 'Chronological Goal Archive'}
                </h4>

                <div className="space-y-3">
                  {allGoalsList.map((item) => {
                    const isItemToday = item.date === appState.profile.lastActiveDate;
                    const itemStars = isItemToday ? todayEarnedStars : item.starsEarned;
                    const itemRate = isItemToday ? todayCompletionRate : item.completionRate;
                    return (
                    <div
                      key={item.date}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                            {formatSelectedDate(item.date)}
                          </span>
                          {isItemToday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                              Hôm nay
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 italic">
                          &ldquo;{item.message}&rdquo;
                        </p>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {itemStars !== undefined && (
                            <span>
                              +{itemStars} ⭐{isItemToday ? ` • ${completedTasksToday.length}/${appState.tasks.length} việc` : ''}
                            </span>
                          )}
                          {itemRate !== undefined && (
                            <>
                              <span>·</span>
                              <span>{itemRate}% {language === 'vi' ? 'hoàn thành' : 'rate'}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReuseMessage(item.message)}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-rose-50 text-rose-600 dark:text-rose-300 border border-slate-200 dark:border-slate-600 text-xs font-bold whitespace-nowrap shadow-sm self-start sm:self-center transition-colors flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Dùng lại' : 'Reuse'}</span>
                      </button>
                    </div>
                  );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Tab: Discipline & Star Penalty System */}
      {activeTab === 'discipline' && (
        <div className="space-y-6">
          {/* Notification Banner */}
          {disciplineNotice && (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-sm font-bold">{disciplineNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setDisciplineNotice(null)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Child Profile & Balance Banner */}
          <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-rose-900/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/80 shadow-md bg-white/20 shrink-0">
                  <img
                    src={appState.profile.avatar}
                    alt={appState.profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-rose-100 font-bold">
                    {language === 'vi' ? 'Quản lý kỷ luật tích cực & Nề nếp' : 'Positive Discipline & Routine Hub'}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                    {appState.profile.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-100 mt-0.5">
                    {language === 'vi'
                      ? 'Rèn luyện tính tự lập, hiểu rõ hệ quả hành vi và nuôi dưỡng tinh thần dám chịu trách nhiệm.'
                      : 'Nurture independence, understand natural consequences, and cultivate restorative responsibility.'}
                  </p>
                </div>
              </div>

              {/* Star Counter Pill */}
              <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl px-5 py-3 text-center sm:text-right shrink-0">
                <div className="text-xs font-medium text-rose-100 mb-0.5">
                  {language === 'vi' ? 'Số sao hiện có của bé' : 'Current Child Stars'}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono flex items-center justify-center sm:justify-end gap-1.5">
                  <span>{appState.profile.stars}</span>
                  <span className="text-xl">⭐</span>
                </div>
                <div className="text-[11px] text-rose-100/90 font-medium mt-0.5">
                  {language === 'vi' ? 'Dùng để đổi thưởng trong Kho Quà' : 'Available for Reward Shop'}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-4 border-t border-white/20 text-center">
              <div className="bg-black/15 rounded-xl p-2.5">
                <div className="text-[11px] text-rose-100 mb-0.5">
                  {language === 'vi' ? 'Tổng số lần vi phạm' : 'Total Incidents'}
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white font-mono">
                  {totalDisciplineIncidents}
                </div>
              </div>

              <div className="bg-black/15 rounded-xl p-2.5">
                <div className="text-[11px] text-rose-100 mb-0.5">
                  {language === 'vi' ? 'Đang cần sửa sai' : 'Active (Unforgiven)'}
                </div>
                <div className="text-base sm:text-lg font-extrabold text-amber-300 font-mono">
                  {activeUnforgivenLogs.length}
                </div>
              </div>

              <div className="bg-black/15 rounded-xl p-2.5">
                <div className="text-[11px] text-rose-100 mb-0.5">
                  {language === 'vi' ? 'Đã sửa sai & hoàn sao' : 'Forgiven & Restored'}
                </div>
                <div className="text-base sm:text-lg font-extrabold text-emerald-300 font-mono">
                  {forgivenDisciplineIncidents}
                </div>
              </div>

              <div className="bg-black/15 rounded-xl p-2.5">
                <div className="text-[11px] text-rose-100 mb-0.5">
                  {language === 'vi' ? 'Tỷ lệ phục hồi sao' : 'Restoration Rate'}
                </div>
                <div className="text-base sm:text-lg font-extrabold text-sky-300 font-mono">
                  {restorationRate}%
                </div>
              </div>
            </div>
          </div>

          {/* Sub Navigation Bar: Thao tác & Nhật ký | Cài đặt & Chỉnh sửa Kỷ luật | Biểu đồ | Nguyên tắc */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setDisciplineSubTab('actions');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                disciplineSubTab === 'actions'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{language === 'vi' ? 'Thao tác & Nhật ký' : 'Actions & Logs'}</span>
              {activeUnforgivenLogs.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                  {activeUnforgivenLogs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setDisciplineSubTab('manage');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                disciplineSubTab === 'manage'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-rose-500" />
              <span>{language === 'vi' ? 'Cài đặt & Chỉnh sửa quy tắc' : 'Configure & Edit Rules'}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                {disciplineRules.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setDisciplineSubTab('charts');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                disciplineSubTab === 'charts'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              <span>{language === 'vi' ? 'Biểu đồ kỷ luật' : 'Discipline Analytics'}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                {language === 'vi' ? 'Trực quan' : 'Visual'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setDisciplineSubTab('principles');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                disciplineSubTab === 'principles'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-rose-500" />
              <span>{language === 'vi' ? 'Nguyên tắc kỷ luật vàng' : 'Discipline Principles'}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                {disciplinePrinciples.length} {language === 'vi' ? 'nguyên tắc' : 'rules'}
              </span>
            </button>
          </div>

          {/* SUB-TAB 1: ACTIONS & LOGS (With direct Rule Add/Edit/Delete & Log Editing) */}
          {disciplineSubTab === 'actions' && (
            <div className="space-y-6">
              {/* Section: Preset Discipline Rules (Quick Deduct + Quick Edit / Add) */}
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <span>{language === 'vi' ? 'Quy tắc vi phạm phổ biến (Trừ sao nhanh & Tùy chỉnh)' : 'Common Rules (Quick Penalty & Edit)'}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {language === 'vi'
                        ? 'Bấm "Áp dụng" để trừ sao nhanh, hoặc bấm Sửa / - / + để chỉnh mức sao phạt và thêm quy tắc riêng của gia đình.'
                        : 'Tap Apply to deduct stars, or use Edit / - / + to customize penalty stars and add family rules.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        setShowAddDisciplineRule(!showAddDisciplineRule);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Thêm quy tắc mới' : 'Add Rule'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        setDisciplineSubTab('manage');
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5 text-rose-500" />
                      <span>{language === 'vi' ? 'Quản lý tất cả' : 'Manage All'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRestoreDefaultDisciplineRules}
                      title={language === 'vi' ? 'Khôi phục bộ quy tắc mẫu' : 'Restore default rules'}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Khôi phục mẫu' : 'Reset Defaults'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Add New Discipline Rule Form */}
                {showAddDisciplineRule && (
                  <form
                    onSubmit={handleAddDisciplineRule}
                    className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/70 space-y-4 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-rose-600" />
                        <span>{language === 'vi' ? 'Thêm quy tắc kỷ luật mới' : 'Add New Discipline Rule'}</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddDisciplineRule(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800"
                      >
                        ✕ {language === 'vi' ? 'Đóng' : 'Close'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'vi' ? 'Tên quy tắc / Hành vi cần nhắc nhở *' : 'Rule Title *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={newRuleTitle}
                          onChange={(e) => setNewRuleTitle(e.target.value)}
                          placeholder={language === 'vi' ? 'Vd: Đi học muộn, Quên mang bình nước...' : 'e.g., Late for school...'}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'vi' ? 'Số sao trừ khi vi phạm (1 - 100 ⭐)' : 'Penalty Stars (1 - 100 ⭐)'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={newRulePenaltyStars}
                            onChange={(e) => setNewRulePenaltyStars(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black font-mono text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                          <div className="flex flex-wrap gap-1">
                            {[1, 2, 3, 5, 10, 15, 20].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setNewRulePenaltyStars(val)}
                                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                                  newRulePenaltyStars === val
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                -{val}⭐
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'vi' ? 'Mô tả chi tiết / Lời dặn dò tích cực cho bé' : 'Description / Constructive Guidance'}
                        </label>
                        <input
                          type="text"
                          value={newRuleDesc}
                          onChange={(e) => setNewRuleDesc(e.target.value)}
                          placeholder={language === 'vi' ? 'Vd: Chuẩn bị cặp sách từ tối hôm trước để sáng đi học đúng giờ...' : 'e.g., Pack school bag the night before...'}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          {language === 'vi' ? 'Chọn biểu tượng' : 'Select Icon'}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'AlertTriangle', labelVi: 'Nhắc nhở' },
                            { id: 'Tv', labelVi: 'Tivi / Màn hình' },
                            { id: 'Box', labelVi: 'Đồ chơi / Gọn gàng' },
                            { id: 'Utensils', labelVi: 'Ăn uống' },
                            { id: 'Moon', labelVi: 'Giấc ngủ' },
                            { id: 'ShieldAlert', labelVi: 'Ứng xử / Chia sẻ' },
                            { id: 'Frown', labelVi: 'Trung thực' }
                          ].map((ic) => (
                            <button
                              key={ic.id}
                              type="button"
                              onClick={() => setNewRuleIcon(ic.id)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                                newRuleIcon === ic.id
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {renderDisciplineIcon(ic.id)}
                              <span>{ic.labelVi}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddDisciplineRule(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                      >
                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{language === 'vi' ? 'Lưu quy tắc mới' : 'Save Rule'}</span>
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                  {disciplineRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850 hover:border-rose-300 dark:hover:border-rose-800 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                            {renderDisciplineIcon(rule.icon)}
                          </div>

                          {/* Quick Star Adjuster + Edit + Delete Controls */}
                          <div className="flex items-center gap-1">
                            <div className="flex items-center bg-rose-100/90 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl p-0.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustDisciplineRuleStars(rule.id, -1)}
                                title={language === 'vi' ? 'Giảm 1 sao phạt' : 'Decrease penalty by 1'}
                                className="w-6 h-6 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 text-rose-700 dark:text-rose-300 font-black text-xs flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono font-extrabold text-rose-700 dark:text-rose-300 text-xs">
                                -{rule.penaltyStars} ⭐
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAdjustDisciplineRuleStars(rule.id, 1)}
                                title={language === 'vi' ? 'Tăng 1 sao phạt' : 'Increase penalty by 1'}
                                className="w-6 h-6 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 text-rose-700 dark:text-rose-300 font-black text-xs flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                playClick(soundEnabled);
                                setEditingDisciplineRule({ ...rule });
                              }}
                              title={language === 'vi' ? 'Chỉnh sửa quy tắc này' : 'Edit rule'}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDisciplineRule(rule.id)}
                              title={language === 'vi' ? 'Xóa quy tắc này' : 'Delete rule'}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                            {language === 'vi' ? rule.title : rule.titleEn}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">
                            {language === 'vi' ? rule.description : rule.descriptionEn}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playClick(soundEnabled);
                          handleQuickApply(rule);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 text-xs sm:text-sm font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>{language === 'vi' ? `Áp dụng (-${rule.penaltyStars} ⭐)` : `Apply (-${rule.penaltyStars} ⭐)`}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Custom Penalty Form */}
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-500" />
                  <span>{language === 'vi' ? 'Ghi nhận lỗi vi phạm tùy chỉnh' : 'Custom Violation & Deduction'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'vi'
                    ? 'Nhập lý do cụ thể và mức phạt số sao phù hợp cho các tình huống ngoài danh mục trên.'
                    : 'Enter a custom reason and choose how many stars to deduct for specific situations.'}
                </p>

                <form onSubmit={handleCustomPenaltySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                    <div className="md:col-span-8">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {language === 'vi' ? 'Hành vi vi phạm của bé' : 'Violation Reason'}
                      </label>
                      <input
                        type="text"
                        required
                        value={customDisciplineReason}
                        onChange={(e) => setCustomDisciplineReason(e.target.value)}
                        placeholder={
                          language === 'vi'
                            ? 'Vd: Không chịu làm bài tập, vứt quần áo bừa bãi...'
                            : 'e.g., Refused to do homework, threw clothes on the floor...'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {language === 'vi' ? 'Số sao trừ' : 'Stars to Deduct'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={customDisciplineStars}
                        onChange={(e) => setCustomDisciplineStars(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Quick star chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500 font-medium">
                      {language === 'vi' ? 'Mức trừ nhanh:' : 'Quick amounts:'}
                    </span>
                    {[1, 2, 3, 5, 10, 15, 20].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setCustomDisciplineStars(amount)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
                          customDisciplineStars === amount
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        -{amount} ⭐
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={!customDisciplineReason.trim()}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        {language === 'vi'
                          ? `Xác nhận trừ ${customDisciplineStars} sao ⭐`
                          : `Confirm Deduct ${customDisciplineStars} Stars ⭐`}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Section: Discipline Log & Forgive / Restore / Edit Mechanism */}
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-emerald-500" />
                      <span>{language === 'vi' ? 'Nhật ký kỷ luật, Chỉnh sửa & Hoàn sao' : 'Discipline History, Edit & Restorations'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'vi'
                        ? 'Khi bé biết nhận lỗi và sửa sai, bấm "Tha thứ & Hoàn sao". Phụ huynh cũng có thể bấm "Sửa" để điều chỉnh nội dung hoặc số sao đã trừ.'
                        : 'When your child corrects a mistake, tap "Forgive & Restore Stars", or tap "Edit" to modify any recorded log.'}
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl self-start sm:self-auto text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDisciplineFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        disciplineFilter === 'all'
                          ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {language === 'vi' ? 'Tất cả' : 'All'} ({disciplineLogs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisciplineFilter('unforgiven')}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        disciplineFilter === 'unforgiven'
                          ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {language === 'vi' ? 'Chưa hoàn sao' : 'Active'} ({activeUnforgivenLogs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisciplineFilter('forgiven')}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        disciplineFilter === 'forgiven'
                          ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {language === 'vi' ? 'Đã hoàn sao' : 'Forgiven'} ({forgivenDisciplineIncidents})
                    </button>
                  </div>
                </div>

                {/* Log List */}
                {(() => {
                  const filteredLogs = disciplineLogs.filter((l) => {
                    if (disciplineFilter === 'unforgiven') return !l.forgiven;
                    if (disciplineFilter === 'forgiven') return l.forgiven;
                    return true;
                  });

                  if (filteredLogs.length === 0) {
                    return (
                      <div className="py-10 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-500 mx-auto flex items-center justify-center">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {disciplineFilter === 'unforgiven'
                            ? language === 'vi'
                              ? 'Tuyệt vời! Hiện tại không có lỗi vi phạm nào chưa hoàn sao.'
                              : 'Great! No active unforgiven penalties.'
                            : language === 'vi'
                            ? 'Chưa có bản ghi kỷ luật nào trong danh mục này.'
                            : 'No discipline records in this filter.'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {language === 'vi'
                            ? 'Bé đang thực hiện tốt các quy định nề nếp gia đình.'
                            : 'Your child is following household routines well.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 pt-2">
                      {filteredLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                            log.forgiven
                              ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/15'
                              : 'border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-850'
                          }`}
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {log.date} · {log.timestamp}
                              </span>

                              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-900/40">
                                -{log.penaltyStars} ⭐
                              </span>

                              {log.forgiven ? (
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>
                                    {language === 'vi'
                                      ? `Đã tha thứ & hoàn lại +${log.penaltyStars} ⭐ ${log.forgivenAt ? `(${log.forgivenAt})` : ''}`
                                      : `Forgiven & restored +${log.penaltyStars} ⭐`}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{language === 'vi' ? 'Đang rút kinh nghiệm' : 'Active penalty'}</span>
                                </span>
                              )}
                            </div>

                            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                              {language === 'vi' ? log.reason : log.reasonEn || log.reason}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {!log.forgiven && (
                              <button
                                type="button"
                                onClick={() => {
                                  playClick(soundEnabled);
                                  handleForgiveDisciplineAction(log.id);
                                }}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                              >
                                <Heart className="w-3.5 h-3.5 fill-white" />
                                <span>
                                  {language === 'vi'
                                    ? `Tha thứ & Hoàn +${log.penaltyStars} ⭐`
                                    : `Forgive & Restore +${log.penaltyStars} ⭐`}
                                </span>
                              </button>
                            )}

                            {/* Edit Discipline Log Button */}
                            <button
                              type="button"
                              onClick={() => {
                                playClick(soundEnabled);
                                setEditingDisciplineLog({ ...log });
                              }}
                              title={language === 'vi' ? 'Chỉnh sửa nội dung hoặc số sao trừ của bản ghi này' : 'Edit this discipline log'}
                              className="px-2.5 py-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                playClick(soundEnabled);
                                if (onDeleteDisciplineLog) onDeleteDisciplineLog(log.id);
                                setDisciplineNotice(
                                  language === 'vi' ? 'Đã xóa bản ghi kỷ luật.' : 'Deleted discipline log entry.'
                                );
                                setTimeout(() => setDisciplineNotice(null), 3000);
                              }}
                              title={language === 'vi' ? 'Xóa bản ghi' : 'Delete log'}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* SUB-TAB 1B: DEDICATED DISCIPLINE SETTINGS & CUSTOMIZATION HUB */}
          {disciplineSubTab === 'manage' && (
            <div className="space-y-6">
              {/* Card 1: Manage & Customize All Discipline Rules */}
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
                      <Settings className="w-5 h-5 text-rose-500" />
                      <span>
                        {language === 'vi'
                          ? `Cài Đặt & Chỉnh Sửa Quy Tắc Kỷ Luật (${disciplineRules.length})`
                          : `Discipline Rules Settings (${disciplineRules.length})`}
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {language === 'vi'
                        ? 'Thêm quy tắc mới, chỉnh sửa tên, mô tả lời khuyên và mức trừ sao (từ 1 ⭐ đến 100 ⭐) phù hợp với nề nếp gia đình.'
                        : 'Add new rules, edit titles, guidance descriptions, and star penalties (1 ⭐ to 100 ⭐) tailored to your family.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        setShowAddDisciplineRule(!showAddDisciplineRule);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-extrabold shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Thêm quy tắc kỷ luật' : 'Add Discipline Rule'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRestoreDefaultDisciplineRules}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-500" />
                      <span>{language === 'vi' ? 'Khôi phục mặc định' : 'Restore Defaults'}</span>
                    </button>
                  </div>
                </div>

                {/* Add New Rule Form inside Manage Tab */}
                {showAddDisciplineRule && (
                  <form
                    onSubmit={handleAddDisciplineRule}
                    className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/70 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-rose-900 dark:text-rose-200">
                        {language === 'vi' ? 'Tạo quy tắc kỷ luật mới' : 'Create New Discipline Rule'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddDisciplineRule(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'vi' ? 'Tên quy tắc (Tiếng Việt) *' : 'Rule Title (Vietnamese) *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={newRuleTitle}
                          onChange={(e) => setNewRuleTitle(e.target.value)}
                          placeholder="Vd: Chưa tự giác xếp giày dép lên kệ"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'vi' ? 'Số sao trừ (1 - 100 ⭐)' : 'Penalty Stars (1 - 100 ⭐)'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={newRulePenaltyStars}
                            onChange={(e) => setNewRulePenaltyStars(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black font-mono text-rose-600"
                          />
                          <div className="flex flex-wrap gap-1">
                            {[1, 2, 3, 5, 10, 15, 20].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setNewRulePenaltyStars(val)}
                                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold ${
                                  newRulePenaltyStars === val
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                -{val}⭐
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'vi' ? 'Mô tả hệ quả & hướng dẫn khắc phục' : 'Description & Guidance'}
                        </label>
                        <input
                          type="text"
                          value={newRuleDesc}
                          onChange={(e) => setNewRuleDesc(e.target.value)}
                          placeholder="Vd: Khi đi học về cần để giày ngay ngắn lên kệ, nếu bé tự xếp lại sẽ được hoàn sao"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddDisciplineRule(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      >
                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold"
                      >
                        {language === 'vi' ? 'Lưu quy tắc' : 'Save Rule'}
                      </button>
                    </div>
                  </form>
                )}

                {/* List of Rules with Full Management Controls */}
                <div className="space-y-3">
                  {disciplineRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-rose-300 transition-all"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                          {renderDisciplineIcon(rule.icon)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                            {language === 'vi' ? rule.title : rule.titleEn}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                            {language === 'vi' ? rule.description : rule.descriptionEn}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Quick Penalty Star Stepper */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustDisciplineRuleStars(rule.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="px-2.5 font-mono font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                            -{rule.penaltyStars} ⭐
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustDisciplineRuleStars(rule.id, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            playClick(soundEnabled);
                            setEditingDisciplineRule({ ...rule });
                          }}
                          className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDisciplineRule(rule.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          title={language === 'vi' ? 'Xóa quy tắc' : 'Delete rule'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Customize Family Discipline Principles */}
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                      <span>
                        {language === 'vi'
                          ? `Tùy Chỉnh Bộ Nguyên Tắc Kỷ Luật Vàng (${disciplinePrinciples.length})`
                          : `Customize Family Discipline Principles (${disciplinePrinciples.length})`}
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {language === 'vi'
                        ? 'Chỉnh sửa hoặc bổ sung các nguyên tắc giáo dục tích cực và kịch bản giao tiếp mẫu của riêng gia đình bạn.'
                        : 'Edit or add positive parenting principles and real-life scripts for your family.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        setShowAddPrinciple(!showAddPrinciple);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Thêm nguyên tắc mới' : 'Add Principle'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRestoreDefaultPrinciples}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-indigo-500" />
                      <span>{language === 'vi' ? 'Khôi phục 5 nguyên tắc mẫu' : 'Restore Defaults'}</span>
                    </button>
                  </div>
                </div>

                {showAddPrinciple && (
                  <form
                    onSubmit={handleAddPrinciple}
                    className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-800/70 space-y-3.5"
                  >
                    <h4 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">
                      {language === 'vi' ? 'Thêm nguyên tắc kỷ luật gia đình mới' : 'Add New Family Principle'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'vi' ? 'Tên nguyên tắc *' : 'Principle Title *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={newPrincipleTitle}
                          onChange={(e) => setNewPrincipleTitle(e.target.value)}
                          placeholder="Vd: Khen ngợi nỗ lực hơn kết quả"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'vi' ? 'Khẩu hiệu tóm tắt' : 'Short Tagline'}
                        </label>
                        <input
                          type="text"
                          value={newPrincipleShortTag}
                          onChange={(e) => setNewPrincipleShortTag(e.target.value)}
                          placeholder="Vd: Ghi nhận sự cố gắng · Kiên trì mỗi ngày"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'vi' ? 'Nội dung giải thích nguyên tắc' : 'Description'}
                        </label>
                        <textarea
                          rows={2}
                          value={newPrincipleDesc}
                          onChange={(e) => setNewPrincipleDesc(e.target.value)}
                          placeholder="Giải thích ý nghĩa của nguyên tắc đối với sự phát triển của bé..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {language === 'vi' ? 'Tình huống ứng dụng & Câu nói mẫu của Ba Mẹ' : 'Real-Life Example Script'}
                        </label>
                        <input
                          type="text"
                          value={newPrincipleExample}
                          onChange={(e) => setNewPrincipleExample(e.target.value)}
                          placeholder="Vd: Khi con viết chữ chưa đẹp nhưng rất chăm chú: 'Mẹ thấy hôm nay con ngồi học rất tập trung!'"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddPrinciple(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      >
                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold"
                      >
                        {language === 'vi' ? 'Lưu nguyên tắc' : 'Save Principle'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {disciplinePrinciples.map((principle, idx) => (
                    <div
                      key={principle.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                            #{idx + 1}
                          </span>
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                            {language === 'vi' ? principle.title : principle.titleEn}
                          </h4>
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            • {language === 'vi' ? principle.shortTag : principle.shortTagEn}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                          {language === 'vi' ? principle.description : principle.descriptionEn}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            playClick(soundEnabled);
                            setEditingPrinciple({ ...principle });
                          }}
                          className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePrinciple(principle.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                          title={language === 'vi' ? 'Xóa nguyên tắc' : 'Delete principle'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: DISCIPLINE CHARTS & ANALYTICS */}
          {disciplineSubTab === 'charts' && (
            <div className="space-y-6">
              {/* 4 KPI Health Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{language === 'vi' ? 'Chỉ số phục hồi sao' : 'Restoration Rate'}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {restorationRate}%
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${restorationRate}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">
                    {restorationRate >= 75
                      ? language === 'vi'
                        ? '🌟 Bé rất tự giác nhận lỗi!'
                        : '🌟 Outstanding honesty!'
                      : language === 'vi'
                      ? 'Cần kiên nhẫn đồng hành'
                      : 'Needs guidance'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{language === 'vi' ? 'Tổng sao đã trừ' : 'Total Stars Deducted'}</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                    -{totalDeductedStars} ⭐
                  </div>
                  <div className="text-[11px] text-slate-500 mt-3 font-medium">
                    {totalDisciplineIncidents} {language === 'vi' ? 'lần ghi nhận vi phạm' : 'total incidents'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{language === 'vi' ? 'Số sao đã hoàn lại' : 'Total Restored Stars'}</span>
                    <RotateCcw className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    +{totalRestoredStars} ⭐
                  </div>
                  <div className="text-[11px] text-slate-500 mt-3 font-medium">
                    {forgivenDisciplineIncidents} {language === 'vi' ? 'lần được tha thứ' : 'forgiven occasions'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{language === 'vi' ? 'Hành vi gặp nhiều nhất' : 'Top Incident Area'}</span>
                    <PieChartIcon className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-1">
                    {pieDisciplineData.length > 0 ? pieDisciplineData[0].name : 'Chưa có dữ liệu'}
                  </div>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-3 font-semibold">
                    {pieDisciplineData.length > 0
                      ? `${pieDisciplineData[0].value} ${language === 'vi' ? 'lần nhắc nhở' : 'times'}`
                      : 'Nề nếp tốt'}
                  </div>
                </div>
              </div>

              {/* Chart 1: 7-Day Trend of Deductions vs Restorations */}
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-indigo-500" />
                      <span>{language === 'vi' ? 'Biểu đồ xu hướng trừ sao & hoàn sao 7 ngày qua' : '7-Day Deduction vs Restoration Trend'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'vi'
                        ? 'So sánh số sao bị trừ (đỏ) và số sao được tha thứ & hoàn lại khi bé biết nhận lỗi (xanh lá)'
                        : 'Daily comparison of deducted stars (rose) vs restored stars after apologies (emerald)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                      <span>{language === 'vi' ? 'Sao bị trừ' : 'Deducted'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                      <span>{language === 'vi' ? 'Sao hoàn lại' : 'Restored'}</span>
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last7DaysDiscipline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.25} />
                      <XAxis dataKey="dayName" tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                                <div className="font-bold text-amber-300">{label} ({data.date})</div>
                                <div className="text-rose-300 flex justify-between gap-3">
                                  <span>{language === 'vi' ? 'Sao bị trừ:' : 'Deducted:'}</span>
                                  <span className="font-mono font-bold">-{data.deductedStars} ⭐</span>
                                </div>
                                <div className="text-emerald-300 flex justify-between gap-3">
                                  <span>{language === 'vi' ? 'Sao hoàn lại:' : 'Restored:'}</span>
                                  <span className="font-mono font-bold">+{data.restoredStars} ⭐</span>
                                </div>
                                <div className="text-slate-400 pt-1 border-t border-slate-700 flex justify-between gap-3">
                                  <span>{language === 'vi' ? 'Số lần vi phạm:' : 'Incidents:'}</span>
                                  <span className="font-mono font-bold">{data.incidents}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="deductedStars"
                        name={language === 'vi' ? 'Sao bị trừ' : 'Deducted'}
                        fill="#f43f5e"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={32}
                      />
                      <Bar
                        dataKey="restoredStars"
                        name={language === 'vi' ? 'Sao hoàn lại' : 'Restored'}
                        fill="#10b981"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Category Breakdown Donut Chart + Table */}
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-1 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-indigo-500" />
                  <span>{language === 'vi' ? 'Biểu đồ phân bổ nguyên nhân vi phạm' : 'Category Breakdown of Violations'}</span>
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  {language === 'vi'
                    ? 'Nhận diện thói quen nào bé thường xuyên mắc lỗi để cha mẹ cùng bé tháo gỡ và tìm giải pháp hỗ trợ'
                    : 'Identify which behavioral patterns need proactive encouragement and parent support'}
                </p>

                {pieDisciplineData.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-5 h-56 w-full flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieDisciplineData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieDisciplineData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-slate-700 text-xs">
                                    <div className="font-bold">{data.name}</div>
                                    <div className="text-amber-300 font-mono mt-0.5">
                                      {data.value} {language === 'vi' ? 'lần vi phạm' : 'incidents'} (-{data.stars} ⭐)
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xs font-semibold text-slate-400">
                          {language === 'vi' ? 'Tổng vi phạm' : 'Total'}
                        </span>
                        <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">
                          {totalDisciplineIncidents}
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-2.5">
                      {pieDisciplineData.map((item, idx) => {
                        const pct = Math.round((item.value / totalDisciplineIncidents) * 100);
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl border border-slate-100 dark:border-slate-750 bg-slate-50/60 dark:bg-slate-850 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                {item.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 font-mono">
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                -{item.stars} ⭐
                              </span>
                              <span className="text-slate-500 font-medium">
                                {item.value} {language === 'vi' ? 'lần' : 'times'}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 bg-white dark:bg-slate-700 rounded-lg shadow-2xs">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {language === 'vi' ? 'Chưa có đủ dữ liệu vi phạm để hiển thị biểu đồ tròn' : 'No violation data to display chart'}
                  </div>
                )}
              </div>

              {/* Smart Behavioral Analysis & Positive Coaching Advice */}
              <div className="bg-gradient-to-r from-amber-50/80 via-rose-50/50 to-indigo-50/70 dark:from-slate-850 dark:to-slate-800 p-5 sm:p-6 rounded-2xl border border-amber-200/60 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Sparkles className="w-5 h-5" />
                  <h4 className="text-sm font-bold font-display uppercase tracking-wider">
                    {language === 'vi' ? 'Phân tích & Lời khuyên giáo dục từ KidHero AI' : 'Smart Positive Coaching Insights'}
                  </h4>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    {language === 'vi' ? (
                      <>
                        Qua dữ liệu 7 ngày qua, tỷ lệ sửa sai và được hoàn sao của bé đạt{' '}
                        <strong className="text-emerald-600 font-bold">{restorationRate}%</strong>. Điều này chứng minh phương pháp kỷ luật phục hồi đang phát huy hiệu quả tuyệt vời: bé không nảy sinh tâm lý chống đối mà chủ động nhận lỗi để lấy lại sao.
                      </>
                    ) : (
                      <>
                        Your child demonstrates a{' '}
                        <strong className="text-emerald-600 font-bold">{restorationRate}%</strong> restorative recovery rate. This shows your discipline system is empowering self-reflection rather than breeding resentment.
                      </>
                    )}
                  </p>

                  <div className="bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-amber-200/50 dark:border-slate-700 mt-2 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-slate-900 dark:text-white">
                        {language === 'vi' ? 'Khuyến nghị tuần tới:' : 'Actionable Recommendation:'}
                      </strong>
                      <span className="ml-1 text-slate-600 dark:text-slate-300">
                        {language === 'vi'
                          ? 'Duy trì quy tắc thỏa thuận thời gian sử dụng thiết bị trước khi mở máy. Hãy đặt hẹn giờ chuông báo vui tai trước 5 phút để bé có bước đệm chuẩn bị tắt tivi mà không cảm thấy đột ngột.'
                          : 'Set a friendly 5-minute pre-timer before screen time ends so transitions are smooth and drama-free.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: 5 GOLDEN DISCIPLINE PRINCIPLES */}
          {disciplineSubTab === 'principles' && (
            <div className="space-y-6">
              {/* Manifesto Intro Banner */}
              <div className="bg-gradient-to-r from-rose-50 via-purple-50 to-indigo-50 dark:from-slate-850 dark:to-slate-800 p-5 sm:p-6 rounded-2xl border border-rose-200/60 dark:border-slate-700">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                      {language === 'vi' ? 'Bộ 5 Nguyên Tắc Kỷ Luật Tích Cực Gia Đình' : 'The 5 Golden Principles of Positive Discipline'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {language === 'vi'
                        ? 'Kỷ luật không phải là sự trừng phạt hay áp đặt quyền lực, mà là quá trình kiên nhẫn hướng dẫn con rèn luyện thói quen tự chủ, tự chịu trách nhiệm và tôn trọng mọi người.'
                        : 'Discipline is not about punishment or dominance. It is the loving process of teaching children self-regulation, empathy, and accountability.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 5 Principles Detailed Cards */}
              <div className="space-y-4">
                {disciplinePrinciples.map((principle, index) => (
                  <div
                    key={principle.id}
                    className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 font-display font-black text-slate-800 dark:text-slate-200 flex items-center justify-center text-sm shadow-2xs shrink-0">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                            <span>{language === 'vi' ? principle.title : principle.titleEn}</span>
                          </h4>
                          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                            {language === 'vi' ? principle.shortTag : principle.shortTagEn}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            playClick(soundEnabled);
                            const textToRead = `${principle.title}. ${principle.description} Tình huống mẫu: ${principle.exampleAction}`;
                            speakText(textToRead, language, soundEnabled);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{language === 'vi' ? 'Nghe đọc' : 'Listen'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playClick(soundEnabled);
                            setEditingPrinciple({ ...principle });
                          }}
                          className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {language === 'vi' ? principle.description : principle.descriptionEn}
                    </p>

                    {/* Practical Example Box */}
                    <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-750 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs">
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {language === 'vi' ? 'Ứng dụng thực tế & Cách cha mẹ trao đổi mẫu:' : 'Real-Life Scenario & Script:'}
                        </strong>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5 italic">
                          &ldquo;{language === 'vi' ? principle.exampleAction : principle.exampleActionEn}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Family Discipline Pledge Contract */}
              <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-3xl p-6 sm:p-7 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-md">
                  <FileText className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white font-display">
                    {language === 'vi' ? 'Khế Ước Nề Nếp & Kỷ Luật Gia Đình' : 'The Family Positive Discipline Pledge'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto mt-1 leading-relaxed">
                    {language === 'vi'
                      ? 'Ba Mẹ cam kết luôn tôn trọng, lắng nghe và giải thích nhẹ nhàng. Bé yêu cam kết tự giác thực hiện nhiệm vụ, trung thực nhận lỗi và biết sửa sai để nhận lại sao.'
                      : 'Parents commit to gentle consistency and respect. Children commit to responsibility, honesty, and restorative courage.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {language === 'vi' ? 'Đại diện Phụ Huynh:' : 'Parents:'}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-black flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      <span>{language === 'vi' ? 'Ba & Mẹ' : 'Mom & Dad'}</span>
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {language === 'vi' ? 'Đại diện Bé Yêu:' : 'Child Champion:'}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-black flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{appState.profile.name}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFamilyPledgeSigned(!familyPledgeSigned);
                      playSuccessChime(soundEnabled);
                    }}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 ${
                      familyPledgeSigned
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {familyPledgeSigned
                        ? language === 'vi'
                          ? '✓ Cả nhà đã ký cam kết thực hiện'
                          : '✓ Family Pledge Signed'
                        : language === 'vi'
                        ? 'Bấm để ký cam kết gia đình'
                        : 'Sign Family Pledge'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick(soundEnabled);
                      const pledgeText =
                        language === 'vi'
                          ? 'Khế ước gia đình: Ba Mẹ cam kết luôn tôn trọng, lắng nghe và giải thích nhẹ nhàng. Bé yêu cam kết tự giác thực hiện nhiệm vụ, trung thực nhận lỗi và biết sửa sai để nhận lại sao!'
                          : 'Family Pledge: Parents commit to gentle respect. Children commit to responsibility and honesty!';
                      speakText(pledgeText, language, soundEnabled);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <Volume2 className="w-4 h-4 text-indigo-500" />
                    <span>{language === 'vi' ? 'Đọc to cam kết' : 'Read Aloud'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Confirmation Modal */}
          {penaltyConfirmModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white font-display">
                      {language === 'vi' ? 'Xác nhận áp dụng kỷ luật' : 'Confirm Star Deduction'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {language === 'vi' ? 'Bé sẽ nhận được lời nhắc nhở giáo dục nhẹ nhàng' : 'Educational constructive audio prompt will play'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'vi' ? 'Hành vi vi phạm:' : 'Violation:'}
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {penaltyConfirmModal.reason}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 font-medium">
                      {language === 'vi' ? 'Số sao bị trừ:' : 'Stars to deduct:'}
                    </span>
                    <span className="text-base font-mono font-black text-rose-600 dark:text-rose-400">
                      -{penaltyConfirmModal.stars} ⭐
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{language === 'vi' ? 'Số sao còn lại sau khi trừ:' : 'Remaining stars:'}</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {Math.max(0, appState.profile.stars - penaltyConfirmModal.stars)} ⭐
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPenaltyConfirmModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmPenalty}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      {language === 'vi'
                        ? `Xác nhận trừ ${penaltyConfirmModal.stars} ⭐`
                        : `Confirm Deduct ${penaltyConfirmModal.stars} ⭐`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Discipline Rule Modal */}
          {editingDisciplineRule && (
            <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                      {renderDisciplineIcon(editingDisciplineRule.icon)}
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">
                        {language === 'vi' ? 'Chỉnh Sửa Quy Tắc Kỷ Luật' : 'Edit Discipline Rule'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {language === 'vi' ? 'Cập nhật tên, mô tả giáo dục và số sao phạt' : 'Update rule title, description, and star penalty'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingDisciplineRule(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEditedDisciplineRule(editingDisciplineRule);
                  }}
                  className="space-y-4 text-xs sm:text-sm"
                >
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên quy tắc / Hành vi *' : 'Rule Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingDisciplineRule.title}
                      onChange={(e) =>
                        setEditingDisciplineRule({
                          ...editingDisciplineRule,
                          title: e.target.value,
                          titleEn: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Mô tả hệ quả & lời khuyên cho bé' : 'Description & Guidance'}
                    </label>
                    <textarea
                      rows={2}
                      value={editingDisciplineRule.description}
                      onChange={(e) =>
                        setEditingDisciplineRule({
                          ...editingDisciplineRule,
                          description: e.target.value,
                          descriptionEn: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === 'vi' ? 'Số sao trừ khi vi phạm (1 - 100 ⭐)' : 'Penalty Stars (1 - 100 ⭐)'}
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editingDisciplineRule.penaltyStars}
                        onChange={(e) =>
                          setEditingDisciplineRule({
                            ...editingDisciplineRule,
                            penaltyStars: Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                          })
                        }
                        className="w-24 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-black text-rose-600 text-base"
                      />
                      {[1, 2, 3, 5, 10, 15, 20, 30].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            setEditingDisciplineRule({
                              ...editingDisciplineRule,
                              penaltyStars: val
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-lg font-mono font-bold text-xs transition-colors ${
                            editingDisciplineRule.penaltyStars === val
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          -{val} ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === 'vi' ? 'Biểu tượng quy tắc' : 'Rule Icon'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'AlertTriangle', labelVi: 'Nhắc nhở' },
                        { id: 'Tv', labelVi: 'Tivi / Màn hình' },
                        { id: 'Box', labelVi: 'Đồ chơi / Gọn gàng' },
                        { id: 'Utensils', labelVi: 'Ăn uống' },
                        { id: 'Moon', labelVi: 'Giấc ngủ' },
                        { id: 'ShieldAlert', labelVi: 'Ứng xử / Chia sẻ' },
                        { id: 'Frown', labelVi: 'Trung thực' }
                      ].map((ic) => (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() =>
                            setEditingDisciplineRule({
                              ...editingDisciplineRule,
                              icon: ic.id
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                            editingDisciplineRule.icon === ic.id
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {renderDisciplineIcon(ic.id)}
                          <span>{ic.labelVi}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingDisciplineRule(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300"
                    >
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm"
                    >
                      {language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Discipline Log Entry Modal */}
          {editingDisciplineLog && (
            <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">
                    {language === 'vi' ? 'Chỉnh Sửa Nhật Ký Kỷ Luật' : 'Edit Discipline Log'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingDisciplineLog(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditedDisciplineLog} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Lý do / Hành vi ghi nhận *' : 'Recorded Reason *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingDisciplineLog.reason}
                      onChange={(e) =>
                        setEditingDisciplineLog({
                          ...editingDisciplineLog,
                          reason: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Số sao trừ (1 - 200 ⭐)' : 'Deducted Stars (1 - 200 ⭐)'}
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={editingDisciplineLog.penaltyStars}
                        onChange={(e) =>
                          setEditingDisciplineLog({
                            ...editingDisciplineLog,
                            penaltyStars: Math.max(1, Math.min(200, parseInt(e.target.value) || 1))
                          })
                        }
                        className="w-24 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-black text-rose-600 text-base"
                      />
                      {[1, 2, 3, 5, 10, 15, 20].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            setEditingDisciplineLog({
                              ...editingDisciplineLog,
                              penaltyStars: val
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-lg font-mono font-bold text-xs ${
                            editingDisciplineLog.penaltyStars === val
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          -{val} ⭐
                        </button>
                      ))}
                    </div>
                    {!editingDisciplineLog.forgiven && (
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {language === 'vi'
                          ? '💡 Số sao hiện tại của bé sẽ tự động được cập nhật tương ứng với mức sao mới.'
                          : '💡 Child current star balance will automatically adjust to match the updated penalty.'}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingDisciplineLog(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs"
                    >
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs"
                    >
                      {language === 'vi' ? 'Lưu cập nhật' : 'Save Log'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Family Discipline Principle Modal */}
          {editingPrinciple && (
            <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">
                    {language === 'vi' ? 'Chỉnh Sửa Nguyên Tắc Kỷ Luật Vàng' : 'Edit Discipline Principle'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingPrinciple(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEditedPrinciple(editingPrinciple);
                  }}
                  className="space-y-3.5 text-xs sm:text-sm"
                >
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên nguyên tắc *' : 'Principle Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingPrinciple.title}
                      onChange={(e) =>
                        setEditingPrinciple({
                          ...editingPrinciple,
                          title: e.target.value,
                          titleEn: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Nhãn tóm tắt / Khẩu hiệu' : 'Short Tag'}
                    </label>
                    <input
                      type="text"
                      value={editingPrinciple.shortTag}
                      onChange={(e) =>
                        setEditingPrinciple({
                          ...editingPrinciple,
                          shortTag: e.target.value,
                          shortTagEn: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Nội dung giải thích chi tiết' : 'Description'}
                    </label>
                    <textarea
                      rows={3}
                      value={editingPrinciple.description}
                      onChange={(e) =>
                        setEditingPrinciple({
                          ...editingPrinciple,
                          description: e.target.value,
                          descriptionEn: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tình huống ứng dụng & Câu nói mẫu' : 'Real-Life Example Script'}
                    </label>
                    <textarea
                      rows={2}
                      value={editingPrinciple.exampleAction}
                      onChange={(e) =>
                        setEditingPrinciple({
                          ...editingPrinciple,
                          exampleAction: e.target.value,
                          exampleActionEn: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingPrinciple(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs"
                    >
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs"
                    >
                      {language === 'vi' ? 'Lưu nguyên tắc' : 'Save Principle'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manage Daily Quests & Task Settings (Cài đặt các nhiệm vụ & thay đổi sao - Tối đa 1 sao) */}
      {activeTab === 'tasks' && (
        <div className="space-y-5">
          {/* Header & Quick Action Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>{language === 'vi' ? 'Cài Đặt Nhiệm Vụ (Tối Đa 1 ⭐) & Duyệt Việc Của Bé' : 'Quest Settings (Max 1 ⭐) & Task Approval'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'vi'
                    ? 'Tối đa nhiệm vụ cài đặt sao là 1 sao (0 hoặc 1 ⭐). Mỗi nhiệm vụ bé hoàn thành phải được phụ huynh duyệt. Sao mỗi ngày tự động đặt lại sau 0h và tích vào Báo cáo tổng.'
                    : 'Maximum star setting per quest is 1 star. Every completed quest must be approved by parents. Daily stars reset after 00:00 into Total Report.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {onApproveAllTasks && pendingTasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onApproveAllTasks();
                      setStarAdjustToast(
                        language === 'vi'
                          ? `Đã duyệt tất cả ${pendingTasks.length} nhiệm vụ cho bé!`
                          : `Approved all ${pendingTasks.length} quests!`
                      );
                      setTimeout(() => setStarAdjustToast(null), 3500);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-transform active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>{language === 'vi' ? `Duyệt tất cả (${pendingTasks.length})` : `Approve All (${pendingTasks.length})`}</span>
                  </button>
                )}

                {onResetDailyTasks && (
                  <button
                    type="button"
                    onClick={() => {
                      playSuccessChime(soundEnabled);
                      onResetDailyTasks();
                      setStarAdjustToast(
                        language === 'vi'
                          ? 'Đã chốt sao hôm nay vào Báo cáo tổng & đặt lại ngày mới (0h)!'
                          : 'Archived today stars into Total Report & reset for new day!'
                      );
                      setTimeout(() => setStarAdjustToast(null), 3500);
                    }}
                    title={language === 'vi' ? 'Chốt sao hôm nay vào Báo cáo tổng và đặt lại sao ngày mới về 0' : 'Archive to Total Report & reset'}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{language === 'vi' ? 'Đặt lại sau 0h & Tích vào tổng' : '0h Reset & Archive'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRestoreDefaultTasks}
                  title={language === 'vi' ? 'Khôi phục lại danh sách nhiệm vụ chuẩn ban đầu (1 sao/việc)' : 'Restore initial quests'}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-300/60 transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{language === 'vi' ? 'Khôi phục mẫu (1⭐)' : 'Restore Default'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setNewTaskTitle('');
                    setNewTaskTitleEn('');
                    setNewTaskCategory('morning');
                    setNewTaskHabit('self_care');
                    setNewTaskStars(1);
                    setNewTaskTimeExpected('07:00');
                    setNewTaskXp(20);
                    setNewTaskVoiceVi('');
                    setShowAddTask(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'vi' ? 'Thêm việc mới' : 'Add Quest'}</span>
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
              {[
                { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All', count: appState.tasks.length },
                {
                  id: 'morning',
                  label: language === 'vi' ? '🌅 Buổi Sáng' : '🌅 Morning',
                  count: appState.tasks.filter((t) => t.category === 'morning').length
                },
                {
                  id: 'afternoon',
                  label: language === 'vi' ? '☀️ Buổi Chiều' : '☀️ Afternoon',
                  count: appState.tasks.filter((t) => t.category === 'afternoon').length
                },
                {
                  id: 'evening',
                  label: language === 'vi' ? '🌙 Buổi Tối' : '🌙 Evening',
                  count: appState.tasks.filter((t) => t.category === 'evening').length
                },
                {
                  id: 'bonus',
                  label: language === 'vi' ? '⚡ Thử Thách Thêm' : '⚡ Bonus',
                  count: appState.tasks.filter((t) => t.category === 'bonus').length
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setTaskCategoryFilter(tab.id as 'all' | TaskCategory);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    taskCategoryFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      taskCategoryFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {appState.tasks
              .filter((task) => (taskCategoryFilter === 'all' ? true : task.category === taskCategoryFilter))
              .map((task) => {
                const isPending = Boolean(task.pendingApproval && !task.isCompleted);
                const starVal = Math.max(1, Math.round(Number(task.stars) || 1));
                const taskTag = getTaskTag(task);
                const tagMeta = TASK_TAG_META[taskTag];
                const TagIcon = TAG_ICON_MAP[taskTag];
                return (
                  <div
                    key={task.id}
                    className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border flex flex-col justify-between gap-3 shadow-2xs transition-colors ${
                      isPending
                        ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-400/30'
                        : task.isCompleted
                        ? 'border-emerald-300 dark:border-emerald-800/70'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-md ${tagMeta.iconBg}`}>
                            <TagIcon className="w-3.5 h-3.5 stroke-[2.25]" />
                            <span>{language === 'vi' ? tagMeta.bilingualVi : tagMeta.labelEn}</span>
                          </span>
                          <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                            {task.category === 'morning'
                              ? '🌅 Sáng'
                              : task.category === 'afternoon'
                              ? '☀️ Chiều'
                              : task.category === 'evening'
                              ? '🌙 Tối'
                              : '⚡ Thêm'}
                          </span>
                          {task.timeExpected && (
                            <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                              ⏰ {task.timeExpected}
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold border border-amber-300">
                              ⏳ Chờ phụ huynh duyệt {task.requestedAt ? `(${task.requestedAt})` : ''}
                            </span>
                          )}
                          {task.isCompleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                              ✓ Phụ huynh đã duyệt (+{starVal}⭐)
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                          {language === 'vi' ? task.title : task.titleEn}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {language === 'vi' ? task.description : task.descriptionEn}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Task Settings Footer: Quick Star Adjuster (Min 1 ⭐) + Parent Approval + Edit + Delete */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                      {/* Star Modifier (Tối thiểu 1 sao) */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-0.5">
                          {language === 'vi' ? 'Sao (Tối thiểu 1⭐):' : 'Stars (Min 1⭐):'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustTaskStars(task.id, -1)}
                          disabled={starVal <= 1}
                          title={language === 'vi' ? 'Tối thiểu 1 sao' : 'Minimum 1 star'}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-colors text-xs"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200/80 dark:border-amber-900/60">
                          {starVal} ⭐
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustTaskStars(task.id, 1)}
                          disabled={starVal >= 10}
                          title={language === 'vi' ? 'Tăng thêm 1 sao' : 'Add 1 star'}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-colors text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Action buttons: Approve / Redo + Edit & Delete */}
                      <div className="flex items-center gap-1.5">
                        {!task.isCompleted && onApproveTask && (
                          <button
                            type="button"
                            onClick={() => {
                              onApproveTask(task.id);
                              setStarAdjustToast(
                                language === 'vi'
                                  ? `Đã duyệt "${task.title}" (+${starVal} ⭐)!`
                                  : `Approved "${task.titleEn}" (+${starVal} ⭐)!`
                              );
                              setTimeout(() => setStarAdjustToast(null), 3000);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl font-extrabold text-xs transition-colors ${
                              isPending
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
                                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            ✓ {language === 'vi' ? 'Duyệt' : 'Approve'}
                          </button>
                        )}

                        {(isPending || task.isCompleted) && onRejectTask && (
                          <button
                            type="button"
                            onClick={() => {
                              playClick(soundEnabled);
                              onRejectTask(task.id);
                            }}
                            className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-700 text-slate-600 hover:text-rose-700 dark:text-slate-300 font-bold text-xs transition-colors"
                          >
                            {language === 'vi' ? 'Hủy duyệt' : 'Reset'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            playClick(soundEnabled);
                            setEditingTask({ ...task, stars: starVal });
                          }}
                          title={language === 'vi' ? 'Chỉnh sửa chi tiết nhiệm vụ này' : 'Edit quest details'}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          title={language === 'vi' ? 'Xóa nhiệm vụ này' : 'Delete quest'}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Edit Task Modal */}
          {editingTask && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-indigo-600" />
                    <span>{language === 'vi' ? 'Chỉnh sửa nhiệm vụ (Tối thiểu 1 ⭐)' : 'Edit Quest (Min 1 ⭐)'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingTask) {
                      handleSaveEditedTask(editingTask);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên nhiệm vụ (Tiếng Việt) *' : 'Quest Title (Vietnamese) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên nhiệm vụ (Tiếng Anh)' : 'Quest Title (English)'}
                    </label>
                    <input
                      type="text"
                      value={editingTask.titleEn || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, titleEn: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Mô tả chi tiết / Lời dặn dò' : 'Description / Instructions'}
                    </label>
                    <textarea
                      rows={2}
                      value={editingTask.description || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Loại nhiệm vụ (Tag)' : 'Task Type Tag'}
                      </label>
                      <select
                        value={editingTask.tag || getTaskTag(editingTask)}
                        onChange={(e) => {
                          const selected = e.target.value as TaskTag;
                          setEditingTask({
                            ...editingTask,
                            tag: selected,
                            habitGroup: tagToHabitGroup(selected)
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        {TASK_TAG_ORDER.map((tagId) => {
                          const meta = TASK_TAG_META[tagId];
                          return (
                            <option key={tagId} value={tagId}>
                              {language === 'vi' ? meta.bilingualVi : meta.labelEn}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Khung giờ trong ngày' : 'Time Category'}
                      </label>
                      <select
                        value={editingTask.category}
                        onChange={(e) =>
                          setEditingTask({ ...editingTask, category: e.target.value as TaskCategory })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="morning">🌅 Buổi Sáng</option>
                        <option value="afternoon">☀️ Buổi Chiều</option>
                        <option value="evening">🌙 Buổi Tối</option>
                        <option value="bonus">⚡ Thử Thách Thêm</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Giờ quy định (HH:MM)' : 'Expected Time'}
                      </label>
                      <input
                        type="text"
                        placeholder="06:30, 17:45..."
                        value={editingTask.timeExpected || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, timeExpected: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Số sao thưởng (Tối thiểu 1 ⭐)' : 'Reward Stars (Min 1 ⭐)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        value={Math.max(1, Math.min(10, Number(editingTask.stars ?? 1)))}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            stars: Math.max(1, Math.min(10, Number(e.target.value) || 1))
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-amber-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Điểm kinh nghiệm (XP)' : 'XP Reward'}
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="200"
                        value={editingTask.xp || 20}
                        onChange={(e) => setEditingTask({ ...editingTask, xp: Number(e.target.value) || 20 })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-indigo-600 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Lời động viên bằng giọng nói' : 'Voice Encouragement Prompt'}
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tuyệt vời lắm Cơ Minh ơi! Con làm việc rất chăm chỉ!"
                      value={editingTask.voicePromptVi || ''}
                      onChange={(e) => setEditingTask({ ...editingTask, voicePromptVi: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                      {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md"
                    >
                      {language === 'vi' ? 'Lưu thay đổi nhiệm vụ' : 'Save Quest'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Task Modal */}
          {showAddTask && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    <span>{language === 'vi' ? 'Thêm công việc rèn luyện mới (Tối thiểu 1 ⭐)' : 'Add New Quest (Min 1 ⭐)'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddNewTask} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên nhiệm vụ (Tiếng Việt) *' : 'Quest Title (Vietnamese) *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Tưới cây cảnh ban công, Rửa ly nước..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên nhiệm vụ (English)' : 'Quest Title (English)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Water balcony plants, Wash cup..."
                      value={newTaskTitleEn}
                      onChange={(e) => setNewTaskTitleEn(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Mô tả hướng dẫn cho bé' : 'Description / Instructions'}
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ví dụ: Tưới đều nước cho các chậu cây ngoài ban công..."
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Khung giờ' : 'Category'}
                      </label>
                      <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="morning">🌅 Buổi Sáng</option>
                        <option value="afternoon">☀️ Buổi Chiều</option>
                        <option value="evening">🌙 Buổi Tối</option>
                        <option value="bonus">⚡ Thử Thách Thêm</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Nhãn phân loại (Tag)' : 'Task Type Tag'}
                      </label>
                      <select
                        value={newTaskTag}
                        onChange={(e) => {
                          const selected = e.target.value as TaskTag;
                          setNewTaskTag(selected);
                          setNewTaskHabit(tagToHabitGroup(selected));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        {TASK_TAG_ORDER.map((tagId) => {
                          const meta = TASK_TAG_META[tagId];
                          return (
                            <option key={tagId} value={tagId}>
                              {language === 'vi' ? meta.bilingualVi : meta.labelEn}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Giờ quy định' : 'Time'}
                      </label>
                      <input
                        type="text"
                        placeholder="07:00"
                        value={newTaskTimeExpected}
                        onChange={(e) => setNewTaskTimeExpected(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Số sao (Tối thiểu 1 ⭐)' : 'Stars (Min 1 ⭐)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        value={Math.max(1, Math.min(10, Number(newTaskStars ?? 1)))}
                        onChange={(e) => setNewTaskStars(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Điểm XP' : 'XP'}
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="200"
                        value={newTaskXp}
                        onChange={(e) => setNewTaskXp(Number(e.target.value) || 20)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Lời động viên khi bé hoàn thành' : 'Voice encouragement'}
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Bé Cơ Minh tự giác và ngăn nắp quá! Ba mẹ yêu con!"
                      value={newTaskVoiceVi}
                      onChange={(e) => setNewTaskVoiceVi(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddTask(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md"
                    >
                      {language === 'vi' ? 'Thêm nhiệm vụ' : 'Create Quest'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Challenge Settings & Management (Cài đặt Thử thách: Thêm, Sửa, Xóa) */}
      {activeTab === 'challenges' && (
        <div className="space-y-5">
          {/* Header & Action Bar */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">
                  {language === 'vi'
                    ? `Quản Lý & Cài Đặt Thử Thách Đếm Ngược (${appState.challenges.length})`
                    : `Manage & Customize Challenges (${appState.challenges.length})`}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'vi'
                  ? 'Ba mẹ có thể thêm thử thách mới, chỉnh sửa thời gian đếm ngược (phút), số sao thưởng, hoặc xóa thử thách.'
                  : 'Add new timer challenges, edit duration (minutes), star rewards, or remove challenges.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onUpdateChallenges && (
                <button
                  type="button"
                  onClick={() => {
                    playSuccessChime(soundEnabled);
                    onUpdateChallenges(
                      appState.challenges.map((c) => ({ ...c, isCompletedToday: false }))
                    );
                    setStarAdjustToast(
                      language === 'vi'
                        ? '🔄 Đã mở lại toàn bộ thử thách hôm nay để bé có thể thực hiện lại!'
                        : '🔄 Reset all challenges for today!'
                    );
                    setTimeout(() => setStarAdjustToast(null), 3500);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-600 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-violet-500" />
                  <span>{language === 'vi' ? 'Mở lại thử thách hôm nay' : 'Reset Today Status'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRestoreDefaultChallenges}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-300/60 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === 'vi' ? 'Khôi phục mẫu' : 'Restore Default'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick(soundEnabled);
                  setNewChallengeTitle('');
                  setNewChallengeTitleEn('');
                  setNewChallengeDesc('');
                  setNewChallengeMinutes(5);
                  setNewChallengeStars(15);
                  setNewChallengeXp(30);
                  setNewChallengeIcon('Zap');
                  setShowAddChallenge(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'vi' ? 'Thêm thử thách mới' : 'Add Challenge'}</span>
              </button>
            </div>
          </div>

          {/* Quick Sample Challenge Templates for 1-Click Add */}
          {onUpdateChallenges && (
            <div className="bg-violet-50/70 dark:bg-slate-800/80 p-4 sm:p-5 rounded-3xl border border-violet-200 dark:border-slate-700 space-y-2.5">
              <div className="text-xs font-extrabold text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>
                  {language === 'vi'
                    ? 'Mẫu thử thách gợi ý cho Ba Mẹ (Bấm để thêm nhanh vào danh sách):'
                    : 'Suggested Challenge Templates (Tap to quick-add):'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  {
                    title: 'Thử thách 15 phút: Đọc sách khám phá',
                    titleEn: '15-Minute Reading Adventure',
                    description: 'Ngồi ngay ngắn đọc 1 chương truyện hoặc sách khoa học yêu thích không xao nhãng.',
                    descriptionEn: 'Read a chapter of your favorite book with full focus for 15 minutes.',
                    durationSeconds: 900,
                    stars: 20,
                    xp: 40,
                    icon: 'Zap'
                  },
                  {
                    title: 'Thử thách 5 phút: Nhảy dây / Thể dục khỏe khoắn',
                    titleEn: '5-Minute Jump Rope & Exercise',
                    description: 'Vận động toàn thân, nhảy dây hoặc tập các động tác thể dục buổi sáng thật năng lượng!',
                    descriptionEn: 'Do jump rope or morning exercises with full energy for 5 minutes!',
                    durationSeconds: 300,
                    stars: 15,
                    xp: 30,
                    icon: 'Flame'
                  },
                  {
                    title: 'Thử thách 10 phút: Luyện viết chữ đẹp nắn nót',
                    titleEn: '10-Minute Neat Handwriting',
                    description: 'Ngồi thẳng lưng và rèn viết chữ thật tròn trịa, sạch đẹp trong 10 phút.',
                    descriptionEn: 'Sit with good posture and practice neat handwriting for 10 minutes.',
                    durationSeconds: 600,
                    stars: 15,
                    xp: 35,
                    icon: 'Smile'
                  },
                  {
                    title: 'Thử thách 10 phút: Ôn 5 từ vựng Tiếng Anh mới',
                    titleEn: '10-Minute English Vocabulary Sprint',
                    description: 'Đọc to và viết lại 5 từ vựng Tiếng Anh mới cùng câu ví dụ vui nhộn.',
                    descriptionEn: 'Practice reading aloud and writing 5 new English words.',
                    durationSeconds: 600,
                    stars: 20,
                    xp: 40,
                    icon: 'Zap'
                  },
                  {
                    title: 'Thử thách 5 phút: Gấp quần áo gọn gàng',
                    titleEn: '5-Minute Clothes Folding',
                    description: 'Phụ giúp ba mẹ gấp gọn quần áo của bé và xếp ngay ngắn vào tủ.',
                    descriptionEn: 'Help parents fold your clothes neatly and put them in the wardrobe.',
                    durationSeconds: 300,
                    stars: 15,
                    xp: 30,
                    icon: 'Smile'
                  },
                  {
                    title: 'Thử thách 15 phút: Vẽ tranh / Lắp ghép sáng tạo',
                    titleEn: '15-Minute Creative Drawing & Building',
                    description: 'Tập trung vẽ một bức tranh đẹp hoặc lắp ráp mô hình sáng tạo không dùng tivi/điện thoại.',
                    descriptionEn: 'Draw a picture or build a creative model without screen time.',
                    durationSeconds: 900,
                    stars: 20,
                    xp: 40,
                    icon: 'Flame'
                  }
                ].map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      playSuccessChime(soundEnabled);
                      const created: Challenge = {
                        ...tpl,
                        id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        isCompletedToday: false,
                        type: 'timer'
                      };
                      onUpdateChallenges([...appState.challenges, created]);
                      setStarAdjustToast(
                        language === 'vi'
                          ? `⚡ Đã thêm nhanh thử thách "${created.title}" (+${created.stars} ⭐)!`
                          : `⚡ Added challenge "${created.titleEn}"!`
                      );
                      setTimeout(() => setStarAdjustToast(null), 3500);
                    }}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-violet-100/70 dark:hover:bg-violet-950/40 border border-violet-200/80 dark:border-slate-700 flex items-center justify-between gap-2 text-left transition-all group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {language === 'vi' ? tpl.title : tpl.titleEn}
                      </div>
                      <div className="text-[11px] font-mono text-violet-600 dark:text-violet-400 mt-0.5">
                        ⏱️ {Math.round(tpl.durationSeconds / 60)} {language === 'vi' ? 'phút' : 'mins'} • +{tpl.stars} ⭐ • +{tpl.xp} XP
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-violet-600 group-hover:bg-violet-700 text-white font-extrabold text-[11px] shrink-0">
                      + {language === 'vi' ? 'Thêm' : 'Add'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Challenges List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appState.challenges.map((challenge) => {
              const durationMins = Math.max(1, Math.round((challenge.durationSeconds || 300) / 60));
              const starVal = Math.max(1, Math.round(Number(challenge.stars) || 1));
              return (
                <div
                  key={challenge.id}
                  className={`p-5 bg-white dark:bg-slate-800 rounded-2xl border flex flex-col justify-between gap-4 shadow-xs transition-all ${
                    challenge.isCompletedToday
                      ? 'border-emerald-300 dark:border-emerald-800/80'
                      : 'border-slate-200 dark:border-slate-700 hover:border-violet-400'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-11 h-11 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
                          {challenge.icon === 'Flame' ? (
                            <Flame className="w-5 h-5" />
                          ) : challenge.icon === 'Smile' ? (
                            <Smile className="w-5 h-5" />
                          ) : (
                            <Zap className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                            <Clock className="w-3 h-3" />
                            <button
                              type="button"
                              onClick={() => {
                                if (!onUpdateChallenges) return;
                                playClick(soundEnabled);
                                const nextMins = Math.max(1, durationMins - 1);
                                onUpdateChallenges(
                                  appState.challenges.map((c) =>
                                    c.id === challenge.id ? { ...c, durationSeconds: nextMins * 60 } : c
                                  )
                                );
                              }}
                              disabled={durationMins <= 1}
                              className="px-1 rounded hover:bg-violet-200/70 disabled:opacity-40 font-black"
                              title={language === 'vi' ? 'Giảm 1 phút' : '-1 min'}
                            >
                              -
                            </button>
                            <span>{durationMins} {language === 'vi' ? 'phút' : 'mins'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (!onUpdateChallenges) return;
                                playClick(soundEnabled);
                                const nextMins = Math.min(120, durationMins + 1);
                                onUpdateChallenges(
                                  appState.challenges.map((c) =>
                                    c.id === challenge.id ? { ...c, durationSeconds: nextMins * 60 } : c
                                  )
                                );
                              }}
                              className="px-1 rounded hover:bg-violet-200/70 font-black"
                              title={language === 'vi' ? 'Tăng 1 phút' : '+1 min'}
                            >
                              +
                            </button>
                          </div>
                          {challenge.isCompletedToday && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                              ✓ {language === 'vi' ? 'Đã xong hôm nay' : 'Done today'}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg">
                        +{challenge.xp} XP
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-display leading-snug">
                      {language === 'vi' ? challenge.title : challenge.titleEn}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {language === 'vi' ? challenge.description : challenge.descriptionEn}
                    </p>
                  </div>

                  {/* Footer Controls: Approve / Redo + Quick Star Adjuster + Edit + Delete */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5">
                    {!challenge.isCompletedToday && onApproveChallenge && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onApproveChallenge(challenge.id);
                            setStarAdjustToast(
                              language === 'vi'
                                ? `Đã duyệt thử thách "${challenge.title}" (+${starVal} ⭐)!`
                                : `Approved challenge "${challenge.titleEn}" (+${starVal} ⭐)!`
                            );
                            setTimeout(() => setStarAdjustToast(null), 3000);
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors ${
                            challenge.pendingApproval
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {challenge.pendingApproval
                              ? language === 'vi'
                                ? `Duyệt thử thách bé đã báo xong (+${starVal} ⭐)`
                                : `Approve Pending (+${starVal} ⭐)`
                              : language === 'vi'
                              ? `Duyệt nhanh (+${starVal} ⭐)`
                              : `Quick Approve (+${starVal} ⭐)`}
                          </span>
                        </button>
                        {challenge.pendingApproval && onRejectChallenge && (
                          <button
                            type="button"
                            onClick={() => onRejectChallenge(challenge.id)}
                            className="py-2 px-2.5 rounded-xl bg-slate-200 hover:bg-rose-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
                          >
                            {language === 'vi' ? 'Làm lại' : 'Redo'}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {language === 'vi' ? 'Thưởng:' : 'Stars:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustChallengeStars(challenge.id, -1)}
                          disabled={starVal <= 1}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200/80">
                          +{starVal} ⭐
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustChallengeStars(challenge.id, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            playClick(soundEnabled);
                            setEditingChallenge({ ...challenge });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-bold text-xs transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteChallenge(challenge.id)}
                          title={language === 'vi' ? 'Xóa thử thách này' : 'Delete challenge'}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Challenge Modal */}
          {showAddChallenge && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-violet-600" />
                    <span>{language === 'vi' ? 'Thêm Thử Thách Đếm Ngược Mới' : 'Add New Countdown Challenge'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddChallenge(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddNewChallenge} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên thử thách (Tiếng Việt) *' : 'Challenge Title (Vietnamese) *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Thử thách 10 phút: Luyện viết chữ đẹp..."
                      value={newChallengeTitle}
                      onChange={(e) => setNewChallengeTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên thử thách (English)' : 'Challenge Title (English)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10-Minute Handwriting Focus..."
                      value={newChallengeTitleEn}
                      onChange={(e) => setNewChallengeTitleEn(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Mô tả hướng dẫn thử thách' : 'Description'}
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ví dụ: Bật đồng hồ đếm ngược và ngồi ngay ngắn rèn chữ thật nắn nót..."
                      value={newChallengeDesc}
                      onChange={(e) => setNewChallengeDesc(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Thời gian (Phút)' : 'Duration (Mins)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={newChallengeMinutes}
                        onChange={(e) => setNewChallengeMinutes(Math.max(1, Number(e.target.value) || 5))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-violet-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Sao thưởng (⭐)' : 'Stars (⭐)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newChallengeStars}
                        onChange={(e) => setNewChallengeStars(Math.max(1, Number(e.target.value) || 10))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Điểm XP' : 'XP'}
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={newChallengeXp}
                        onChange={(e) => setNewChallengeXp(Math.max(5, Number(e.target.value) || 30))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Biểu tượng' : 'Icon'}
                      </label>
                      <select
                        value={newChallengeIcon}
                        onChange={(e) => setNewChallengeIcon(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="Zap">⚡ Tia Chớp</option>
                        <option value="Flame">🔥 Ngọn Lửa</option>
                        <option value="Smile">😊 Nụ Cười</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddChallenge(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold shadow-md"
                    >
                      {language === 'vi' ? 'Thêm thử thách' : 'Create Challenge'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Challenge Modal */}
          {editingChallenge && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-violet-600" />
                    <span>{language === 'vi' ? 'Chỉnh sửa Thử Thách' : 'Edit Challenge'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingChallenge(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingChallenge) {
                      handleSaveEditedChallenge(editingChallenge);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên thử thách (Tiếng Việt) *' : 'Challenge Title (Vietnamese) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingChallenge.title}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên thử thách (English)' : 'Challenge Title (English)'}
                    </label>
                    <input
                      type="text"
                      value={editingChallenge.titleEn || ''}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, titleEn: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Mô tả chi tiết' : 'Description'}
                    </label>
                    <textarea
                      rows={2}
                      value={editingChallenge.description || ''}
                      onChange={(e) =>
                        setEditingChallenge({
                          ...editingChallenge,
                          description: e.target.value,
                          descriptionEn: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Thời gian (Phút)' : 'Duration (Mins)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={Math.max(1, Math.round((editingChallenge.durationSeconds || 300) / 60))}
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            durationSeconds: Math.max(1, Number(e.target.value) || 5) * 60
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-violet-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Sao thưởng (⭐)' : 'Stars (⭐)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editingChallenge.stars}
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            stars: Math.max(1, Number(e.target.value) || 1)
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Điểm XP' : 'XP'}
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={editingChallenge.xp}
                        onChange={(e) =>
                          setEditingChallenge({
                            ...editingChallenge,
                            xp: Math.max(5, Number(e.target.value) || 20)
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Biểu tượng' : 'Icon'}
                      </label>
                      <select
                        value={editingChallenge.icon || 'Zap'}
                        onChange={(e) => setEditingChallenge({ ...editingChallenge, icon: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="Zap">⚡ Tia Chớp</option>
                        <option value="Flame">🔥 Ngọn Lửa</option>
                        <option value="Smile">😊 Nụ Cười</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingChallenge(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold shadow-md"
                    >
                      {language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Approve Rewards & Manage Reward Shop Catalog (Cài đặt Đổi Sao Lấy Quà) */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Section A: Pending Reward Requests from Child */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <span>🎁 {language === 'vi' ? `Yêu cầu đổi quà cần duyệt (${pendingRewards.length})` : `Pending Reward Requests (${pendingRewards.length})`}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'vi'
                    ? 'Khi bé dùng sao đổi quà ở Cửa Hàng Phần Thưởng, yêu cầu sẽ hiển thị tại đây để ba mẹ phê duyệt.'
                    : 'When your child redeems stars in the Reward Shop, requests appear here for your approval.'}
                </p>
              </div>
            </div>

            {pendingRewards.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/70 dark:border-slate-700 text-slate-500 text-xs sm:text-sm">
                {language === 'vi'
                  ? 'Hiện tại không có yêu cầu đổi quà nào đang chờ duyệt. Bé đang tiếp tục tích sao!'
                  : 'No pending reward requests right now.'}
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {language === 'vi' ? reward.title : reward.titleEn}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Bé đã dùng <span className="font-mono font-bold text-amber-600">{reward.cost} ⭐</span> để xin đổi phần thưởng này.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onApproveReward(reward.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
                      >
                        ✓ Duyệt ngay
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectReward(reward.id)}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                      >
                        Từ chối (Hoàn sao)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Reward Shop Catalog Settings (Thêm, Sửa, Xóa phần thưởng & Chỉnh số sao đổi quà) */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  <span>
                    {language === 'vi'
                      ? `Cài Đặt Danh Sách Quà Đổi Sao (${appState.rewards.length} phần thưởng)`
                      : `Manage Reward Shop Catalog (${appState.rewards.length} rewards)`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'vi'
                    ? 'Ba mẹ có thể thêm quà mới, chỉnh sửa tên quà, thay đổi mức sao cần đổi hoặc xóa các phần thưởng không còn phù hợp.'
                    : 'Add custom family rewards, edit reward names, adjust star costs, or remove rewards.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestoreDefaultRewards}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-300/60 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'vi' ? 'Khôi phục quà mẫu' : 'Restore Default'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setNewRewardTitle('');
                    setNewRewardTitleEn('');
                    setNewRewardDesc('');
                    setNewRewardCost(30);
                    setNewRewardIcon('Gift');
                    setShowAddReward(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'vi' ? 'Thêm phần thưởng mới' : 'Add New Reward'}</span>
                </button>
              </div>
            </div>

            {/* Rewards Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appState.rewards.map((reward) => {
                const costVal = Math.max(1, Math.round(Number(reward.cost) || 10));
                return (
                  <div
                    key={reward.id}
                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                      reward.status === 'requested'
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                        : reward.status === 'approved' || reward.status === 'claimed'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/70'
                        : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                          {renderRewardIcon(reward.icon)}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {reward.status !== 'available' && (
                            <button
                              type="button"
                              onClick={() => handleResetRewardStatus(reward.id)}
                              title={language === 'vi' ? 'Đặt lại trạng thái để bé có thể đổi lại quà này' : 'Make available again'}
                              className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold transition-colors"
                            >
                              🔄 {language === 'vi' ? 'Cho đổi lại' : 'Reset'}
                            </button>
                          )}
                          <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono font-black text-xs border border-amber-300/60">
                            {costVal} ⭐
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-display leading-snug">
                        {language === 'vi' ? reward.title : reward.titleEn}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {language === 'vi' ? reward.description : reward.descriptionEn}
                      </p>
                    </div>

                    {/* Footer: Quick Cost Adjust + Edit + Delete */}
                    <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-0.5">
                          {language === 'vi' ? 'Giá sao:' : 'Cost:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustRewardCost(reward.id, -5)}
                          disabled={costVal <= 1}
                          className="px-1.5 py-0.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustRewardCost(reward.id, -1)}
                          disabled={costVal <= 1}
                          className="px-1.5 py-0.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 disabled:opacity-40 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustRewardCost(reward.id, 1)}
                          className="px-1.5 py-0.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustRewardCost(reward.id, 5)}
                          className="px-1.5 py-0.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs"
                        >
                          +5
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            playClick(soundEnabled);
                            setEditingReward({ ...reward });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteReward(reward.id)}
                          title={language === 'vi' ? 'Xóa phần thưởng này' : 'Delete reward'}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Reward Modal */}
          {showAddReward && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-500" />
                    <span>{language === 'vi' ? 'Thêm Phần Thưởng Đổi Sao Mới' : 'Add New Family Reward'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddReward(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddNewReward} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên phần thưởng (Tiếng Việt) *' : 'Reward Title (Vietnamese) *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Đi nhà sách chọn truyện mới, Đi bơi cuối tuần..."
                      value={newRewardTitle}
                      onChange={(e) => setNewRewardTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên phần thưởng (English)' : 'Reward Title (English)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Visit bookstore, Weekend swimming..."
                      value={newRewardTitleEn}
                      onChange={(e) => setNewRewardTitleEn(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Mô tả phần thưởng' : 'Description'}
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Chi tiết phần thưởng dành cho bé..."
                      value={newRewardDesc}
                      onChange={(e) => setNewRewardDesc(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Số sao cần đổi (⭐)' : 'Star Cost (⭐)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        value={newRewardCost}
                        onChange={(e) => setNewRewardCost(Math.max(1, Number(e.target.value) || 10))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-amber-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Biểu tượng quà' : 'Reward Icon'}
                      </label>
                      <select
                        value={newRewardIcon}
                        onChange={(e) => setNewRewardIcon(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="Gift">🎁 Hộp Quà / Đồ Chơi</option>
                        <option value="Tv">📺 Xem Hoạt Hình / Giải Trí</option>
                        <option value="IceCream">🍦 Kem / Món Tráng Miệng</option>
                        <option value="Book">📚 Sách / Truyện Tranh</option>
                        <option value="Pizza">🍕 Món Ăn Yêu Thích</option>
                        <option value="FerrisWheel">🎡 Đi Chơi Công Viên</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddReward(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-md"
                    >
                      {language === 'vi' ? 'Thêm quà vào cửa hàng' : 'Create Reward'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Reward Modal */}
          {editingReward && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-amber-500" />
                    <span>{language === 'vi' ? 'Chỉnh Sửa Phần Thưởng Đổi Sao' : 'Edit Reward'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingReward(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingReward) {
                      handleSaveEditedReward(editingReward);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên phần thưởng (Tiếng Việt) *' : 'Reward Title (Vietnamese) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingReward.title}
                      onChange={(e) => setEditingReward({ ...editingReward, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Tên phần thưởng (English)' : 'Reward Title (English)'}
                    </label>
                    <input
                      type="text"
                      value={editingReward.titleEn || ''}
                      onChange={(e) => setEditingReward({ ...editingReward, titleEn: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {language === 'vi' ? 'Mô tả chi tiết' : 'Description'}
                    </label>
                    <textarea
                      rows={2}
                      value={editingReward.description || ''}
                      onChange={(e) =>
                        setEditingReward({
                          ...editingReward,
                          description: e.target.value,
                          descriptionEn: e.target.value
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Số sao cần đổi (⭐)' : 'Star Cost (⭐)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        value={editingReward.cost}
                        onChange={(e) =>
                          setEditingReward({
                            ...editingReward,
                            cost: Math.max(1, Number(e.target.value) || 10)
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-amber-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {language === 'vi' ? 'Biểu tượng quà' : 'Reward Icon'}
                      </label>
                      <select
                        value={editingReward.icon || 'Gift'}
                        onChange={(e) => setEditingReward({ ...editingReward, icon: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="Gift">🎁 Hộp Quà / Đồ Chơi</option>
                        <option value="Tv">📺 Xem Hoạt Hình / Giải Trí</option>
                        <option value="IceCream">🍦 Kem / Món Tráng Miệng</option>
                        <option value="Book">📚 Sách / Truyện Tranh</option>
                        <option value="Pizza">🍕 Món Ăn Yêu Thích</option>
                        <option value="FerrisWheel">🎡 Đi Chơi Công Viên</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingReward(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-md"
                    >
                      {language === 'vi' ? 'Lưu thay đổi quà' : 'Save Reward'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Settings & Security */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Quick Management Hub for Tasks, Challenges & Rewards inside Settings Tab */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-500" />
                <span>
                  {language === 'vi'
                    ? 'Cài Đặt Nhiệm Vụ, Thử Thách & Đổi Sao Lấy Quà'
                    : 'Configure Quests, Challenges & Reward Shop'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'vi'
                  ? 'Truy cập nhanh để chỉnh sửa, thêm mới hoặc xóa bớt các nhiệm vụ hằng ngày, thử thách bấm giờ và danh sách quà đổi sao.'
                  : 'Quickly customize, add, edit, or delete daily quests, timer challenges, and family rewards.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Cài đặt Nhiệm vụ' : 'Quest Settings'}</span>
                    </span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300">
                      {appState.tasks.length} việc
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {language === 'vi'
                      ? 'Thêm bớt việc sáng/chiều/tối, chỉnh sửa tên và số sao thưởng (tối thiểu 1 ⭐).'
                      : 'Add, edit, or delete daily quests and star rewards.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setActiveTab('tasks');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  {language === 'vi' ? 'Mở cài đặt Nhiệm vụ →' : 'Manage Quests →'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/70 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Cài đặt Thử thách' : 'Challenge Settings'}</span>
                    </span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300">
                      {appState.challenges.length} thử thách
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {language === 'vi'
                      ? 'Thêm bớt hoặc sửa các thử thách đồng hồ đếm ngược, thời gian và sao thưởng.'
                      : 'Add, edit, or delete countdown timer challenges.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setActiveTab('challenges');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  {language === 'vi' ? 'Mở cài đặt Thử thách →' : 'Manage Challenges →'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Gift className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Đổi sao lấy quà' : 'Reward Shop Settings'}</span>
                    </span>
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300">
                      {appState.rewards.length} món quà
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {language === 'vi'
                      ? 'Thêm quà mới, sửa mức sao đổi thưởng, xóa quà hoặc duyệt yêu cầu đổi quà.'
                      : 'Add, edit, or delete rewards and star redemption costs.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setActiveTab('rewards');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xs transition-colors"
                >
                  {language === 'vi' ? 'Mở cài đặt Đổi quà →' : 'Manage Rewards →'}
                </button>
              </div>
            </div>
          </div>
          {/* Child Profile Card in Settings */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={appState.profile.avatar}
                alt={appState.profile.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm shrink-0"
              />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {language === 'vi' ? 'Thông tin hồ sơ của bé' : 'Child Profile Information'}
                </div>
                <div
                  onClick={handleOpenEditProfile}
                  className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mt-0.5"
                >
                  <span>{appState.profile.name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                    {appState.profile.grade}
                  </span>
                  <Pencil className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'vi'
                    ? 'Tên và lớp/tuổi của bé được hiển thị ở màn hình chính và đồng bộ tự động giữa các thiết bị.'
                    : 'Displayed on the main hero banner and automatically synced across family devices.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenEditProfile}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Chỉnh sửa hồ sơ' : 'Edit Child Profile'}</span>
            </button>
          </div>

          {/* Daily Goal Message for Child */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    {language === 'vi' ? 'Lời nhắn mục tiêu & Động viên cho bé' : 'Daily Goal & Encouragement Message'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'vi'
                      ? 'Lời nhắn này sẽ xuất hiện nổi bật trên màn hình chính (HeroBanner) để khích lệ bé tự giác mỗi ngày'
                      : 'This message will be prominently displayed in the child HeroBanner as a daily loving encouragement'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveGoalMessage} className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {language === 'vi' ? 'Nội dung lời nhắn hôm nay:' : 'Today Message for Child:'}
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {goalMessageInput.length}/180 ký tự
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={180}
                  placeholder={
                    language === 'vi'
                      ? 'Ví dụ: Hôm nay con hãy hoàn thành bài tập sớm và tự tin mỉm cười nhé! Ba mẹ luôn yêu con ❤️'
                      : 'e.g. Finish your homework early today and smile with confidence! Mom & Dad love you ❤️'
                  }
                  value={goalMessageInput}
                  onChange={(e) => setGoalMessageInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
                />
              </div>

              {/* Quick Preset Suggestions */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  {language === 'vi' ? 'Gợi ý lời nhắn yêu thương nhanh:' : 'Quick loving message presets:'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    language === 'vi'
                      ? 'Hôm nay con hãy hoàn thành bài tập sớm và tự tin mỉm cười nhé! Ba mẹ luôn yêu con ❤️'
                      : 'Finish homework early today and smile with confidence! Love you! ❤️',
                    language === 'vi'
                      ? 'Nhớ uống đủ nước và cùng mẹ dọn dẹp bàn ăn sau bữa tối nha con yêu! 🌟'
                      : 'Drink enough water and help clean the table after dinner! 🌟',
                    language === 'vi'
                      ? 'Bé yêu của ba mẹ hãy học tập chăm chỉ và tự lập thật giỏi nhé! 🚀'
                      : 'Study hard and enjoy your wonderful day of independence! 🚀',
                    language === 'vi'
                      ? 'Con là niềm tự hào to lớn của cả nhà! Cố lên con nhé! 💪'
                      : 'You are our greatest pride! Have a super heroic day! 💪'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        setGoalMessageInput(preset);
                      }}
                      className="text-left text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              {goalMessageInput && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-900 text-white text-xs border border-white/10">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[10px] uppercase mb-1">
                    <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                    <span>{language === 'vi' ? 'Xem trước trên màn hình của bé:' : 'Preview on child screen:'}</span>
                  </div>
                  <p className="italic text-white/95 leading-relaxed">&ldquo;{goalMessageInput}&rdquo;</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Lưu lời nhắn cho bé' : 'Save Daily Goal Message'}</span>
                  </button>

                  {goalMessageInput && (
                    <button
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        setGoalMessageInput('');
                      }}
                      className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      {language === 'vi' ? 'Xóa lời nhắn' : 'Clear'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      playClick(soundEnabled);
                      setActiveTab('goals');
                    }}
                    className="px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Xem lịch sử 30 ngày 📅' : 'View 30-Day Calendar 📅'}</span>
                  </button>
                </div>

                {goalMessageSaved && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    ✓ {language === 'vi' ? 'Đã lưu lời nhắn thành công!' : 'Message saved successfully!'}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Security PIN / Parent Password Change */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-500" />
                  <span>
                    {language === 'vi'
                      ? 'Thay đổi Mật khẩu / Mã PIN Phụ huynh (4 – 8 số)'
                      : 'Change Parent Password / PIN (4 – 8 digits)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'vi'
                    ? 'Mật khẩu dùng để khóa khu vực Phụ huynh, ngăn bé tự ý chỉnh sao hoặc duyệt quà. Hỗ trợ mật khẩu từ 4 đến 8 chữ số.'
                    : 'Protects the Parent Dashboard from unauthorized access. Supports 4 to 8 digits.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                  {language === 'vi' ? 'Độ dài hiện tại:' : 'Current length:'} {(appState.settings.pin || '1234').length} {language === 'vi' ? 'số' : 'digits'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPinText((prev) => !prev)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {showPinText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPinText ? (language === 'vi' ? 'Ẩn số' : 'Hide') : (language === 'vi' ? 'Hiện số' : 'Show')}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {language === 'vi' ? '1. Mật khẩu hiện tại *' : '1. Current PIN *'}
                  </label>
                  <input
                    type={showPinText ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="••••"
                    value={currentPinVerify}
                    onChange={(e) => {
                      setCurrentPinVerify(e.target.value.replace(/\D/g, ''));
                      setPinChangeError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-center tracking-widest text-base font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {language === 'vi' ? '2. Mật khẩu mới (4–8 số) *' : '2. New PIN (4–8 digits) *'}
                  </label>
                  <input
                    type={showPinText ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="••••"
                    value={newPinInput}
                    onChange={(e) => {
                      setNewPinInput(e.target.value.replace(/\D/g, ''));
                      setPinChangeError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-center tracking-widest text-base font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {language === 'vi' ? '3. Nhập lại mật khẩu mới *' : '3. Confirm New PIN *'}
                  </label>
                  <input
                    type={showPinText ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="••••"
                    value={confirmPinInput}
                    onChange={(e) => {
                      setConfirmPinInput(e.target.value.replace(/\D/g, ''));
                      setPinChangeError(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-center tracking-widest text-base font-bold"
                  />
                </div>
              </div>

              {pinChangeError && (
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pinChangeError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Cập nhật mật khẩu mới' : 'Update Password'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings({
                      ...appState.settings,
                      pin: '1234'
                    });
                    setPinInput('1234');
                    setCurrentPinVerify('');
                    setNewPinInput('');
                    setConfirmPinInput('');
                    setPinChangeError(null);
                    playSuccessChime(soundEnabled);
                    setSaveNotice(true);
                    setTimeout(() => setSaveNotice(false), 3000);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'vi' ? 'Đặt lại mặc định (1234)' : 'Reset to default (1234)'}
                </button>
              </div>
            </form>

            {saveNotice && (
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ✓ {t.savedNotice}
              </div>
            )}
          </div>

          {/* Backup & Restore Data + LocalStorage Auto-Save Status */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Lưu trữ tự động (LocalStorage) & Sao lưu ngoại tuyến
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toàn bộ số sao, cấp độ XP, tiến độ và danh sách nhiệm vụ được tự động lưu vào localStorage của trình duyệt ngay khi thao tác, đảm bảo không mất dữ liệu khi tắt web hoặc tải lại trang.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã lưu tự động vào LocalStorage</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500">Số sao đã lưu</div>
                <div className="font-mono font-extrabold text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                  ⭐ {appState.profile.stars} sao (Tổng: {appState.profile.totalStarsEarned})
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500">Tiến độ & Cấp độ</div>
                <div className="font-mono font-extrabold text-sm text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Cấp {appState.profile.level} • {appState.profile.currentXp}/{appState.profile.maxXp} XP
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500">Danh sách nhiệm vụ đã lưu</div>
                <div className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {appState.tasks.filter((t) => t.isCompleted).length}/{appState.tasks.length} hoàn thành
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onExportBackup}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                <span>{t.exportData}</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>{t.importData}</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImportBackup(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Edit Child Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setShowEditProfileModal(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shrink-0">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-display">
                  {language === 'vi' ? 'Chỉnh sửa hồ sơ & Ảnh đại diện của bé' : 'Edit Child Profile & Avatar'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'vi'
                    ? 'Cập nhật ảnh đại diện, tên gọi và tuổi/lớp học của bé yêu'
                    : 'Update your child avatar, name, and age or grade'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 mt-4">
              {/* Avatar Picker & Upload Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={editChildAvatar}
                      alt={editChildName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow bg-amber-50"
                    />
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow">
                      <Camera className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === 'vi' ? 'Ảnh đại diện của bé' : 'Child Avatar'}
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Tải ảnh của bé từ máy lên' : 'Upload Custom Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setAvatarUploadError(null);
                          try {
                            const compressed = await compressImageFileToDataUrl(file);
                            setEditChildAvatar(compressed);
                            playSuccessChime(soundEnabled);
                          } catch {
                            setAvatarUploadError(
                              language === 'vi'
                                ? 'Không thể đọc ảnh này, vui lòng chọn ảnh khác.'
                                : 'Could not read image file.'
                            );
                          }
                        }}
                      />
                    </label>
                    {avatarUploadError && (
                      <div className="text-[11px] font-semibold text-rose-600">{avatarUploadError}</div>
                    )}
                  </div>
                </div>

                {/* Preset Character Avatars */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    {language === 'vi' ? 'Hoặc chọn nhân vật hoạt hình dễ thương:' : 'Or choose a cute character avatar:'}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                    {AVATAR_PRESETS.map((item) => {
                      const isSelected = editChildAvatar === item.url;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            playClick(soundEnabled);
                            setEditChildAvatar(item.url);
                          }}
                          className={`p-1.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          <img
                            src={item.url}
                            alt={item.nameVi}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover border border-amber-300 shrink-0"
                          />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 line-clamp-2 leading-tight">
                            {language === 'vi' ? item.nameVi : item.nameEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'vi' ? 'Tên của bé *' : 'Child Name *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={editChildName}
                  onChange={(e) => setEditChildName(e.target.value)}
                  placeholder={language === 'vi' ? 'Ví dụ: Bé Cơ Minh, Cơ Minh...' : 'e.g. Leo, Mia...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'vi' ? 'Tuổi hoặc Lớp của bé *' : 'Child Age or Grade *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={editChildGrade}
                  onChange={(e) => setEditChildGrade(e.target.value)}
                  placeholder={language === 'vi' ? 'Ví dụ: Lớp 1, Lớp 2, Lớp 3, 8 tuổi...' : 'e.g. Grade 1, Grade 2, 8 years old...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Quick select suggestions for Grade / Age */}
                <div className="mt-2">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                    {language === 'vi' ? 'Chọn nhanh lớp hoặc độ tuổi:' : 'Quick select grade or age:'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(language === 'vi'
                      ? ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', '6 tuổi', '7 tuổi', '8 tuổi', '9 tuổi', '10 tuổi']
                      : ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Age 6', 'Age 7', 'Age 8', 'Age 9', 'Age 10']
                    ).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          playClick(soundEnabled);
                          setEditChildGrade(preset);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          editChildGrade === preset
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    setShowEditProfileModal(false);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-colors"
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-colors"
                >
                  {language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Star Adjustment Modal (Thay đổi sao ở phần phụ huynh) */}
      {showStarAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
                  ⭐
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                    {language === 'vi' ? 'Điều Chỉnh Số Sao Cho Bé' : 'Adjust Child Stars'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'vi' ? 'Bé hiện có:' : 'Current balance:'}{' '}
                    <strong className="text-amber-500 font-mono text-sm">{appState.profile.stars} ⭐</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStarAdjustModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (starAdjustMode === 'set') {
                  const exactVal = Math.max(0, Math.round(Number(customStarAmount) || 0));
                  handleExecuteStarAdjust(exactVal, true, customStarReason || 'Đặt lại số sao');
                } else {
                  const amt = Math.max(1, Math.round(Number(customStarAmount) || 1));
                  if (starAdjustMode === 'subtract') {
                    handleExecuteStarAdjust(-amt, false, customStarReason || 'Điều chỉnh trừ sao');
                  } else {
                    handleExecuteStarAdjust(amt, false, customStarReason || 'Khen thưởng sao');
                  }
                }
                setShowStarAdjustModal(false);
              }}
              className="space-y-4 text-xs"
            >
              {/* Mode Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'vi' ? 'Hình thức điều chỉnh' : 'Adjustment Type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClick(soundEnabled);
                      setStarAdjustMode('add');
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold transition-all ${
                      starAdjustMode === 'add'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    + {language === 'vi' ? 'Thưởng sao' : 'Reward'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick(soundEnabled);
                      setStarAdjustMode('subtract');
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold transition-all ${
                      starAdjustMode === 'subtract'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    - {language === 'vi' ? 'Trừ sao' : 'Deduct'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick(soundEnabled);
                      setStarAdjustMode('set');
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold transition-all ${
                      starAdjustMode === 'set'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    = {language === 'vi' ? 'Đặt số sao' : 'Set Exact'}
                  </button>
                </div>
              </div>

              {/* Amount Field */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {starAdjustMode === 'set'
                    ? (language === 'vi' ? 'Đặt lại tổng số sao chính xác thành:' : 'Set exact total stars to:')
                    : starAdjustMode === 'subtract'
                    ? (language === 'vi' ? 'Số sao trừ bớt:' : 'Stars to deduct:')
                    : (language === 'vi' ? 'Số sao thưởng thêm:' : 'Stars to add:')}
                </label>
                <input
                  type="number"
                  min={starAdjustMode === 'set' ? '0' : '1'}
                  max="5000"
                  required
                  value={customStarAmount}
                  onChange={(e) => setCustomStarAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-black font-mono outline-none focus:ring-2 focus:ring-amber-500"
                />

                {/* Quick amount presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400">{language === 'vi' ? 'Nhanh:' : 'Quick:'}</span>
                  {(starAdjustMode === 'set' ? [0, 10, 25, 50, 100] : [1, 5, 10, 20, 50]).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        setCustomStarAmount(amt);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px] border border-slate-200 dark:border-slate-700"
                    >
                      {starAdjustMode === 'set' ? `${amt} ⭐` : `${amt} ⭐`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Field */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'vi' ? 'Lý do thay đổi số sao' : 'Reason / Note'}
                </label>
                <input
                  type="text"
                  placeholder={
                    starAdjustMode === 'subtract'
                      ? 'Ví dụ: Nhắc nhở nề nếp, chưa tập trung...'
                      : 'Ví dụ: Bài kiểm tra 10 điểm, chăm chỉ học bài...'
                  }
                  value={customStarReason}
                  onChange={(e) => setCustomStarReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Quick Reason Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400">{language === 'vi' ? 'Lý do:' : 'Reasons:'}</span>
                  {(starAdjustMode === 'subtract'
                    ? ['Xem tivi quá giờ', 'Chưa dọn dẹp đồ chơi', 'Gắt gỏng nhõng nhẽo', 'Đi ngủ muộn']
                    : ['Bài kiểm tra 10 điểm', 'Tự giác học bài', 'Phụ ba mẹ dọn nhà', 'Thưởng chuyên cần cuối tuần']
                  ).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        setCustomStarReason(r);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 hover:border-amber-400"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStarAdjustModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-black text-white shadow-md flex items-center justify-center gap-1.5 ${
                    starAdjustMode === 'subtract'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : starAdjustMode === 'set'
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>{language === 'vi' ? 'Xác nhận cập nhật sao' : 'Confirm Adjust'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent Manual Reset Points Modal (Tự reset lại điểm) */}
      {showResetPointsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800 shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-display">
                    {language === 'vi' ? 'Phụ Huynh Tự Reset Lại Điểm Của Bé' : 'Reset Child Points & Stars'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'vi'
                      ? `Chọn mức đặt lại điểm cho bé ${appState.profile.name} (Hiện có: ${appState.profile.stars} ⭐ hôm nay • Tổng: ${appState.profile.totalStarsEarned} ⭐ • Cấp ${appState.profile.level})`
                      : `Choose how you want to reset ${appState.profile.name}'s points`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetPointsModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Option 1: Reset Today's Stars & Daily Quests */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {language === 'vi'
                      ? '1. Reset sao hôm nay & làm mới nhiệm vụ ngày (Về 0 ⭐)'
                      : '1. Reset Today Stars & Daily Quests (To 0 ⭐)'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {language === 'vi'
                      ? 'Đặt lại số sao hôm nay về 0 ⭐ và bỏ chọn các nhiệm vụ hôm nay để bé làm lại. Giữ nguyên Tổng sao tích lũy và Cấp độ XP.'
                      : 'Resets today stars to 0 ⭐ and unchecks today quests while preserving Total Report stars and XP level.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExecuteResetPoints('daily_only')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm whitespace-nowrap shrink-0 transition-transform active:scale-95"
                >
                  {language === 'vi' ? 'Reset sao hôm nay' : 'Reset Today'}
                </button>
              </div>

              {/* Option 2: Reset All Stars (Today + Cumulative Total Report) */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {language === 'vi'
                      ? '2. Reset toàn bộ điểm Sao (Hôm nay + Báo cáo tổng về 0 ⭐)'
                      : '2. Reset All Stars (Today + Total Report to 0 ⭐)'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {language === 'vi'
                      ? 'Đặt lại cả Sao hôm nay và Tổng sao tích lũy trong báo cáo về 0 ⭐. Giữ nguyên Cấp độ XP của bé.'
                      : 'Resets both today stars and cumulative Total Report stars to 0 ⭐ while keeping XP level.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExecuteResetPoints('all_stars')}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm whitespace-nowrap shrink-0 transition-transform active:scale-95"
                >
                  {language === 'vi' ? 'Reset toàn bộ Sao' : 'Reset All Stars'}
                </button>
              </div>

              {/* Option 3: Full Reset (Stars + XP/Level 1 + Streak + Magic Egg) */}
              <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-rose-700 dark:text-rose-300">
                    {language === 'vi'
                      ? '3. Reset toàn bộ Điểm từ đầu (Sao + XP Cấp 1 + Chuỗi + Trứng)'
                      : '3. Full Points Reset (Stars + XP Level 1 + Streak + Egg)'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {language === 'vi'
                      ? 'Đặt lại toàn bộ Sao về 0 ⭐, Điểm kinh nghiệm về 0 XP (Cấp 1), Chuỗi ngày về 0 và Quả Trứng Ma Thuật về 0/50 ⭐ để bắt đầu chu kỳ mới hoàn toàn.'
                      : 'Resets all Stars to 0 ⭐, XP to 0 (Level 1), Streak to 0, and Magic Egg to 0/50 ⭐ for a fresh start.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExecuteResetPoints('full_reset')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm whitespace-nowrap shrink-0 transition-transform active:scale-95"
                >
                  {language === 'vi' ? 'Reset toàn bộ điểm' : 'Full Reset'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowResetPointsModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Change Parent Password / PIN Modal */}
      {showChangePinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-display">
                    {language === 'vi' ? 'Thay Đổi Mật Khẩu Phụ Huynh' : 'Change Parent Password'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'vi'
                      ? 'Bảo vệ khu vực Phụ huynh bằng mật khẩu từ 4 đến 8 chữ số'
                      : 'Protect Parent Dashboard with a 4 to 8 digit PIN'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePinModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  {language === 'vi' ? 'Độ dài mật khẩu hiện tại:' : 'Current PIN length:'}{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
                    {(appState.settings.pin || '1234').length} {language === 'vi' ? 'chữ số' : 'digits'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPinText((prev) => !prev)}
                  className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {showPinText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPinText ? (language === 'vi' ? 'Ẩn số' : 'Hide') : (language === 'vi' ? 'Hiện số' : 'Show')}</span>
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? '1. Nhập mật khẩu hiện tại *' : '1. Current Password / PIN *'}
                </label>
                <input
                  type={showPinText ? 'text' : 'password'}
                  inputMode="numeric"
                  required
                  maxLength={8}
                  placeholder={language === 'vi' ? 'Nhập mật khẩu đang dùng (Mặc định: 1234)' : 'Current PIN'}
                  value={currentPinVerify}
                  onChange={(e) => {
                    setCurrentPinVerify(e.target.value.replace(/\D/g, ''));
                    setPinChangeError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center tracking-widest text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? '2. Nhập mật khẩu mới (4 – 8 chữ số) *' : '2. New Password / PIN (4–8 digits) *'}
                </label>
                <input
                  type={showPinText ? 'text' : 'password'}
                  inputMode="numeric"
                  required
                  maxLength={8}
                  placeholder={language === 'vi' ? 'Từ 4 đến 8 chữ số...' : '4 to 8 digits'}
                  value={newPinInput}
                  onChange={(e) => {
                    setNewPinInput(e.target.value.replace(/\D/g, ''));
                    setPinChangeError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center tracking-widest text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'vi' ? '3. Xác nhận lại mật khẩu mới *' : '3. Confirm New Password / PIN *'}
                </label>
                <input
                  type={showPinText ? 'text' : 'password'}
                  inputMode="numeric"
                  required
                  maxLength={8}
                  placeholder={language === 'vi' ? 'Nhập lại mật khẩu mới...' : 'Re-enter new PIN'}
                  value={confirmPinInput}
                  onChange={(e) => {
                    setConfirmPinInput(e.target.value.replace(/\D/g, ''));
                    setPinChangeError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-center tracking-widest text-base font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {pinChangeError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{pinChangeError}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{language === 'vi' ? 'Lưu mật khẩu mới' : 'Save New PIN'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
