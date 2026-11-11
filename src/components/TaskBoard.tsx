import React, { useState } from 'react';
import {
  Sun,
  Sparkles,
  BedDouble,
  Utensils,
  HeartHandshake,
  ShieldCheck,
  Pencil,
  BookOpen,
  HelpingHand,
  Briefcase,
  Smile,
  Moon,
  Droplets,
  Languages,
  Activity,
  Heart,
  Volume2,
  Check,
  Clock,
  Star,
  GraduationCap,
  Home,
  HeartPulse,
  AlarmClock,
  Tag,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Gift
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, TaskCategory, TaskTag, Language } from '../types';
import { translations } from '../utils/translations';
import { playClick, playTaskCheerSound, playRewardFanfare, speakText, stopSpeaking } from '../utils/audio';
import { TASK_TAG_META, TASK_TAG_ORDER, getTaskTag } from '../utils/taskTags';
import { getCurrentTimeSlot } from '../utils/petGamification';

interface TaskBoardProps {
  tasks: Task[];
  language: Language;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  onToggleTask: (taskId: string) => void;
  onStartChallengeTimer?: (challengeId: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Sun,
  Sparkles,
  BedDouble,
  Utensils,
  HeartHandshake,
  ShieldCheck,
  Pencil,
  BookOpen,
  HelpingHand,
  Briefcase,
  Smile,
  Moon,
  Droplets,
  Languages,
  Activity,
  Heart
};

export const TAG_ICON_MAP: Record<TaskTag, React.ElementType> = {
  study: GraduationCap,
  chore: Home,
  hygiene: Droplets,
  health: HeartPulse,
  routine: AlarmClock
};

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  language,
  soundEnabled,
  voiceEnabled,
  onToggleTask
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<TaskTag | 'all'>('all');
  const [activeSpeakingTaskId, setActiveSpeakingTaskId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(false);

  // Auto-expand current session based on device clock, while allowing manual toggle of any session
  const currentSlot = getCurrentTimeSlot();
  const [expandedGroups, setExpandedGroups] = useState<Record<TaskCategory, boolean>>({
    morning: currentSlot === 'morning',
    afternoon: currentSlot === 'afternoon',
    evening: currentSlot === 'evening',
    bonus: true
  });
  const [openedChestToast, setOpenedChestToast] = useState<string | null>(null);

  const toggleGroupExpand = (cat: TaskCategory) => {
    playClick(soundEnabled);
    setExpandedGroups((prev) => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const t = translations[language];

  // Filtered tasks by both Time Category and Visual Task Tag
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const taskTag = getTaskTag(task);
    const matchesTag = selectedTag === 'all' || taskTag === selectedTag;
    return matchesCategory && matchesTag;
  });

  const completedCount = filteredTasks.filter((t) => t.isCompleted).length;
  const pendingCount = filteredTasks.filter((t) => t.pendingApproval && !t.isCompleted).length;

  // Tag summary stats across all tasks
  const tagSummaries = TASK_TAG_ORDER.map((tagId) => {
    const meta = TASK_TAG_META[tagId];
    const tasksWithTag = tasks.filter((t) => getTaskTag(t) === tagId);
    const doneWithTag = tasksWithTag.filter((t) => t.isCompleted).length;
    const pendingWithTag = tasksWithTag.filter((t) => t.pendingApproval && !t.isCompleted).length;
    return {
      tagId,
      meta,
      total: tasksWithTag.length,
      done: doneWithTag,
      pending: pendingWithTag
    };
  });

  const handleSelectTagFilter = (tagId: TaskTag | 'all') => {
    playClick(soundEnabled);
    const nextTag = selectedTag === tagId ? 'all' : tagId;
    setSelectedTag(nextTag);

    if (voiceEnabled && nextTag !== 'all') {
      const meta = TASK_TAG_META[nextTag];
      stopSpeaking();
      speakText(
        language === 'vi'
          ? `Nhóm nhiệm vụ ${meta.labelVi}: ${meta.shortDescVi}`
          : `${meta.labelEn} tasks: ${meta.shortDescEn}`,
        language,
        voiceEnabled
      );
    }
  };

  const handleTaskCheck = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();

    if (task.isCompleted) {
      playClick(soundEnabled);
      if (voiceEnabled) {
        stopSpeaking();
      }
      onToggleTask(task.id);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 35,
      spread: 55,
      origin: { x, y },
      colors: ['#f59e0b', '#fbbf24', '#6366f1']
    });

    playTaskCheerSound(soundEnabled);

    if (voiceEnabled) {
      const starReward = Math.max(1, Number(task.stars) || 1);
      const prompt =
        language === 'vi'
          ? `Tuyệt vời! Con đã hoàn thành nhiệm vụ "${task.title}" và nhận ngay +${starReward} ngôi sao cùng +15 xu nuôi thú!`
          : `Awesome! You completed "${task.titleEn}" and earned +${starReward} star and +15 pet coins!`;
      stopSpeaking();
      setActiveSpeakingTaskId(task.id);
      speakText(prompt, language, voiceEnabled).then(() => {
        setActiveSpeakingTaskId((curr) => (curr === task.id ? null : curr));
      });
    }

    onToggleTask(task.id);
  };

  const handleSpeakTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    playClick(soundEnabled);

    if (activeSpeakingTaskId === task.id) {
      stopSpeaking();
      setActiveSpeakingTaskId(null);
      return;
    }

    setActiveSpeakingTaskId(task.id);
    const taskTag = getTaskTag(task);
    const tagMeta = TASK_TAG_META[taskTag];
    const tagLabel = language === 'vi' ? `Phân loại ${tagMeta.labelVi}` : `${tagMeta.labelEn} task`;
    const title = language === 'vi' ? task.title : task.titleEn;
    const desc = language === 'vi' ? task.description : task.descriptionEn;
    const speech = `${tagLabel}. ${title}. ${desc}.`;

    speakText(speech, language, voiceEnabled).then(() => {
      setActiveSpeakingTaskId((curr) => (curr === task.id ? null : curr));
    });
  };

  const getCategoryTheme = (cat: TaskCategory) => {
    switch (cat) {
      case 'morning':
        return {
          titleVi: '🌅 Nhiệm Vụ Buổi Sáng (06:00 – 11:00)',
          titleEn: '🌅 Morning Quests (06:00 – 11:00)',
          chestLabelVi: '🎁 Rương Thưởng Buổi Sáng: +30% No bụng & +30% Năng lượng cho Linh Thú!',
          chestLabelEn: '🎁 Morning Chest: +30% Fullness & +30% Energy for Pet!',
          hungerBoost: 30,
          headerBg: 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15 dark:from-amber-950/50 dark:to-orange-950/30',
          border: 'border-amber-300/80 dark:border-amber-700/60',
          badge: 'text-amber-700 dark:text-amber-300',
          chestBg: 'from-amber-400 to-orange-400'
        };
      case 'afternoon':
        return {
          titleVi: '☀️ Nhiệm Vụ Buổi Trưa & Chiều (11:00 – 17:00)',
          titleEn: '☀️ Afternoon Quests (11:00 – 17:00)',
          chestLabelVi: '🎁 Rương Thưởng Buổi Trưa & Chiều: +30% No bụng & +30% Vui vẻ cho Linh Thú!',
          chestLabelEn: '🎁 Afternoon Chest: +30% Fullness & +30% Happiness for Pet!',
          hungerBoost: 30,
          headerBg: 'bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-blue-500/15 dark:from-sky-950/50 dark:to-cyan-950/30',
          border: 'border-sky-300/80 dark:border-sky-700/60',
          badge: 'text-sky-700 dark:text-sky-300',
          chestBg: 'from-sky-400 to-cyan-500'
        };
      case 'evening':
        return {
          titleVi: '🌙 Nhiệm Vụ Buổi Tối (17:00 – 21:30)',
          titleEn: '🌙 Evening Quests (17:00 – 21:30)',
          chestLabelVi: '🎁 Rương Thưởng Buổi Tối: +40% No bụng & +40% Năng lượng cho Linh Thú!',
          chestLabelEn: '🎁 Evening Chest: +40% Fullness & +40% Energy for Pet!',
          hungerBoost: 40,
          headerBg: 'bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-fuchsia-500/15 dark:from-indigo-950/50 dark:to-purple-950/30',
          border: 'border-indigo-300/80 dark:border-indigo-700/60',
          badge: 'text-indigo-700 dark:text-indigo-300',
          chestBg: 'from-indigo-500 to-purple-600'
        };
      case 'bonus':
        return {
          titleVi: '🌟 Nhiệm Vụ Thưởng Thêm Hàng Ngày',
          titleEn: '🌟 Daily Bonus Quests',
          chestLabelVi: '🎁 Rương Siêu Anh Hùng: Thưởng thêm EXP & Độ vui vẻ cho Linh Thú!',
          chestLabelEn: '🎁 Bonus Hero Chest: Extra EXP & Happiness for Pet!',
          hungerBoost: 20,
          headerBg: 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 dark:from-emerald-950/50 dark:to-teal-950/30',
          border: 'border-emerald-300/80 dark:border-emerald-700/60',
          badge: 'text-emerald-700 dark:text-emerald-300',
          chestBg: 'from-emerald-400 to-teal-500'
        };
    }
  };

  const renderTaskCard = (task: Task) => {
    const IconComponent = ICON_MAP[task.iconName] || Star;
    const theme = getCategoryTheme(task.category);
    const taskTag = getTaskTag(task);
    const tagMeta = TASK_TAG_META[taskTag];
    const TagIcon = TAG_ICON_MAP[taskTag];
    const isSpeakingThis = activeSpeakingTaskId === task.id;
    const isPending = Boolean(task.pendingApproval && !task.isCompleted);
    const starAmount = Math.max(1, Math.round(Number(task.stars) || 1));

    return (
      <div
        key={task.id}
        onClick={(e) => handleTaskCheck(task, e)}
        className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 sm:gap-3.5 ${
          task.isCompleted
            ? 'bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-900/50 opacity-90'
            : isPending
            ? 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/25 dark:border-amber-700/70 shadow-sm'
            : 'bg-white border-slate-200/90 dark:bg-slate-800/90 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md'
        }`}
      >
        <div className="pt-0.5 shrink-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform active:scale-90 ${
              task.isCompleted
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : isPending
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 group-hover:border-indigo-400'
            }`}
          >
            {task.isCompleted ? (
              <Check className="w-6 h-6 stroke-[3]" />
            ) : isPending ? (
              <Clock className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <IconComponent className="w-5 h-5 text-slate-500 dark:text-slate-300 group-hover:text-indigo-500 transition-colors" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className={`text-sm sm:text-base font-extrabold tracking-tight leading-snug ${
                task.isCompleted
                  ? 'line-through text-slate-500 dark:text-slate-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {language === 'vi' ? task.title : task.titleEn}
            </h3>

            <div className="flex items-center gap-1 shrink-0 font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums text-xs sm:text-sm bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200/70 dark:border-amber-800/50">
              <span>+{starAmount}</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>

          <p
            className={`text-xs sm:text-sm line-clamp-2 leading-relaxed ${
              task.isCompleted
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {language === 'vi' ? task.description : task.descriptionEn}
          </p>

          <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-slate-600 dark:text-slate-300">
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleSelectTagFilter(taskTag);
              }}
              className={`inline-flex items-center gap-1 font-extrabold hover:underline ${tagMeta.textColor}`}
            >
              <span className={`w-4 h-4 rounded inline-flex items-center justify-center ${tagMeta.iconBg}`}>
                <TagIcon className="w-3 h-3 stroke-[2.5]" />
              </span>
              <span>{language === 'vi' ? tagMeta.labelVi : tagMeta.labelEn}</span>
            </span>

            {task.timeExpected && (
              <>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 font-mono tabular-nums font-semibold">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{task.timeExpected}</span>
                </span>
              </>
            )}

            <span aria-hidden="true">·</span>
            <span className={`font-mono tabular-nums font-semibold ${theme.badge}`}>
              +{task.xp || 5} EXP
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-extrabold text-amber-700 dark:text-amber-300">
              +15đ 🪙
            </span>

            {isPending && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 dark:text-amber-300 font-extrabold">
                  ⏳ {language === 'vi' ? 'Chờ ba mẹ duyệt' : 'Pending'}
                </span>
              </>
            )}

            {task.isCompleted && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  ✓ {language === 'vi' ? `Đã duyệt (+${starAmount} ⭐)` : `Approved (+${starAmount} ⭐)`}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => handleSpeakTask(task, e)}
          title={t.pressToListen}
          className={`min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl transition-all self-center shrink-0 ${
            isSpeakingThis
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Volume2 className={`w-5 h-5 ${isSpeakingThis ? 'scale-110' : ''}`} />
        </button>
      </div>
    );
  };

  const sessionOrder: TaskCategory[] = ['morning', 'afternoon', 'evening', 'bonus'];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar + Toggleable Task Type Legend */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          <button
            onClick={() => {
              playClick(soundEnabled);
              setSelectedCategory('all');
            }}
            className={`px-3 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            📋 {t.allCategory} ({tasks.length})
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setSelectedCategory('morning');
              setExpandedGroups((p) => ({ ...p, morning: true }));
            }}
            className={`px-3 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
              selectedCategory === 'morning'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-amber-100'
            }`}
          >
            <span>🌅 {t.morningTitle}</span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setSelectedCategory('afternoon');
              setExpandedGroups((p) => ({ ...p, afternoon: true }));
            }}
            className={`px-3 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
              selectedCategory === 'afternoon'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-sky-100'
            }`}
          >
            <span>☀️ {t.afternoonTitle}</span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setSelectedCategory('evening');
              setExpandedGroups((p) => ({ ...p, evening: true }));
            }}
            className={`px-3 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
              selectedCategory === 'evening'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-indigo-100'
            }`}
          >
            <span>🌙 {t.eveningTitle}</span>
          </button>

          <button
            onClick={() => {
              playClick(soundEnabled);
              setSelectedCategory('bonus');
              setExpandedGroups((p) => ({ ...p, bonus: true }));
            }}
            className={`px-3 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
              selectedCategory === 'bonus'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 hover:bg-emerald-100'
            }`}
          >
            <span>🌟 {t.bonusTitle}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playClick(soundEnabled);
              setShowLegend((p) => !p);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Lọc theo loại việc' : 'Filter by type'}</span>
            {showLegend ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
            {completedCount}/{filteredTasks.length} ✓
            {pendingCount > 0 ? ` • ${pendingCount} ⏳` : ''}
          </div>
        </div>
      </div>

      {/* Collapsible Task Type Legend */}
      {(showLegend || selectedTag !== 'all') && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              {language === 'vi'
                ? 'Chọn biểu tượng để lọc nhanh nhóm thói quen:'
                : 'Tap an icon to filter habit types:'}
            </span>
            {selectedTag !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectTagFilter('all')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'vi' ? 'Hiện tất cả' : 'Reset'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {tagSummaries.map(({ tagId, meta, total, done }) => {
              const TagIcon = TAG_ICON_MAP[tagId];
              const isSelected = selectedTag === tagId;
              return (
                <button
                  key={tagId}
                  type="button"
                  onClick={() => handleSelectTagFilter(tagId)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBg}`}>
                      <TagIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {language === 'vi' ? meta.labelVi : meta.labelEn}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                    {done}/{total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {openedChestToast && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-between gap-2 animate-in fade-in zoom-in-95 duration-200">
          <span>{openedChestToast}</span>
          <button
            type="button"
            onClick={() => setOpenedChestToast(null)}
            className="px-2 py-0.5 rounded-lg bg-black/15 text-xs font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 3 COLLAPSIBLE TIME-OF-DAY SECTIONS WITH SESSION REWARD CHESTS ("RƯƠNG THƯỞNG BUỔI") */}
      <div className="space-y-4">
        {sessionOrder
          .filter((cat) => selectedCategory === 'all' || selectedCategory === cat)
          .map((cat) => {
            const groupTasks = filteredTasks.filter((t) => t.category === cat);
            if (groupTasks.length === 0) return null;

            const theme = getCategoryTheme(cat);
            const doneInGroup = groupTasks.filter((t) => t.isCompleted || t.pendingApproval).length;
            const approvedInGroup = groupTasks.filter((t) => t.isCompleted).length;
            const allDoneInGroup = doneInGroup === groupTasks.length && groupTasks.length > 0;
            const isCurrentSession = currentSlot === cat;
            const isExpanded = selectedCategory !== 'all' ? true : expandedGroups[cat];

            return (
              <div
                key={cat}
                className={`rounded-3xl border-2 overflow-hidden transition-all shadow-xs bg-white dark:bg-slate-900/90 ${theme.border}`}
              >
                {/* Collapsible Session Header */}
                <button
                  type="button"
                  onClick={() => toggleGroupExpand(cat)}
                  className={`w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${theme.headerBg}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">
                      {language === 'vi' ? theme.titleVi : theme.titleEn}
                    </h3>

                    {isCurrentSession && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold shadow-2xs">
                        ⏰ {language === 'vi' ? 'Buổi hiện tại' : 'Current Session'}
                      </span>
                    )}

                    {allDoneInGroup && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold shadow-2xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Đã mở Rương Buổi!' : 'Chest Unlocked!'}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-800 text-xs font-black font-mono text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                      {doneInGroup}/{groupTasks.length} {language === 'vi' ? 'việc' : 'done'}
                      {approvedInGroup > 0 ? ` (${approvedInGroup} ⭐)` : ''}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-white/70 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Collapsible Body: Task Cards + Session Reward Chest */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {groupTasks.map((task) => renderTaskCard(task))}
                    </div>

                    {/* Rương Thưởng Buổi ("Session Reward Chest") at the bottom of each session */}
                    <div
                      onClick={() => {
                        if (allDoneInGroup) {
                          playRewardFanfare(soundEnabled);
                          confetti({
                            particleCount: 55,
                            spread: 70,
                            origin: { y: 0.65 }
                          });
                          const msg =
                            language === 'vi'
                              ? `🎉 Rương Thưởng đã mở! Toàn bộ bữa ăn (+${theme.hungerBoost}% No bụng) đã bay sang nuôi Linh Thú no căng bụng!`
                              : `🎉 Session Chest opened! +${theme.hungerBoost}% Fullness sent to your Pet!`;
                          setOpenedChestToast(msg);
                          setTimeout(() => setOpenedChestToast(null), 5000);
                        } else {
                          playClick(soundEnabled);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer ${
                        allDoneInGroup
                          ? `bg-gradient-to-r ${theme.chestBg} text-white border-amber-200 shadow-lg`
                          : 'bg-slate-50 dark:bg-slate-800/60 border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-center sm:text-left">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs ${
                            allDoneInGroup
                              ? 'bg-white/25 animate-bounce'
                              : 'bg-amber-100 dark:bg-amber-950/60'
                          }`}
                        >
                          <span>{allDoneInGroup ? '🔓' : '🎁'}</span>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-extrabold">
                            {language === 'vi' ? theme.chestLabelVi : theme.chestLabelEn}
                          </div>
                          <div
                            className={`text-[11px] font-medium mt-0.5 ${
                              allDoneInGroup ? 'text-white/95' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {allDoneInGroup
                              ? language === 'vi'
                                ? '🎉 Xuất sắc! Con đã hoàn thành trọn vẹn các việc trong buổi — Bấm vào rương để ăn mừng!'
                                : '🎉 All tasks in this session completed — Tap chest to celebrate!'
                              : language === 'vi'
                              ? cat === 'afternoon'
                                ? `Còn ${groupTasks.length - doneInGroup} việc nữa để mở khóa Rương Buổi Trưa & Chiều (+30% No bụng & +30% Vui vẻ cho Linh thú)!`
                                : cat === 'evening'
                                ? `Còn ${groupTasks.length - doneInGroup} việc nữa để mở khóa Rương Buổi Tối (+40% No bụng & +40% Năng lượng cho Linh thú)!`
                                : cat === 'bonus'
                                ? `Còn ${groupTasks.length - doneInGroup} việc nữa để mở khóa Rương Siêu Anh Hùng (+EXP & +Độ vui vẻ cho Linh thú)!`
                                : `Còn ${groupTasks.length - doneInGroup} việc nữa để mở khóa Rương Buổi Sáng (+30% No bụng & +30% Năng lượng cho Linh thú)!`
                              : `${groupTasks.length - doneInGroup} more tasks to unlock this Session Chest!`}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono inline-flex items-center gap-1 ${
                            allDoneInGroup
                              ? 'bg-white text-slate-950 shadow'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>
                            {allDoneInGroup
                              ? language === 'vi'
                                ? `Đã nhận +${theme.hungerBoost}% No bụng!`
                                : `Claimed +${theme.hungerBoost}%!`
                              : `${doneInGroup}/${groupTasks.length}`}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};


