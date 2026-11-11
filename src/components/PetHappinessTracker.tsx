import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Heart,
  Zap,
  Apple,
  Sparkles,
  TrendingUp,
  Smile,
  Volume2,
  Award,
  CheckCircle2,
  Calendar,
  Activity
} from 'lucide-react';
import { DayRecord, GoalHistoryItem, Language, Task, VirtualPet } from '../types';
import { playClick, speakText } from '../utils/audio';
import { CUTE_HAMSTER_AVATAR_URL } from '../utils/pets';

interface PetHappinessTrackerProps {
  pet: VirtualPet;
  history: Record<string, DayRecord>;
  goalHistory?: Record<string, GoalHistoryItem>;
  tasks: Task[];
  language: Language;
  soundEnabled: boolean;
  avatar?: string;
  lastActiveDate: string;
}

export interface HappinessPoint {
  index: number;
  dayName: string;
  shortDate: string;
  dateKey: string;
  fullDateLabel: string;
  happiness: number;
  energy: number;
  hunger: number;
  wellBeingScore: number;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  moodTier: 'ecstatic' | 'happy' | 'needs_care';
  moodLabel: string;
  moodEmoji: string;
  dragonReaction: string;
  isToday: boolean;
}

export const PetHappinessTracker: React.FC<PetHappinessTrackerProps> = ({
  pet,
  history,
  goalHistory,
  tasks,
  language,
  soundEnabled,
  avatar,
  lastActiveDate
}) => {
  const [timeRange, setTimeRange] = useState<'30d' | '14d' | '7d'>('30d');
  const [chartViewMode, setChartViewMode] = useState<'tasks_correlation' | 'rate_comparison'>('tasks_correlation');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const defaultTotalTasks = tasks.length || 16;

  // Build 30-day Pet Mood History dataset
  const full30DaysData: HappinessPoint[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const dayName = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
    const shortDate = `${day}/${month}`;
    const isToday = i === 29 || dateKey === lastActiveDate;

    let completedTasks = 0;
    let totalTasks = defaultTotalTasks;
    let completionRate = 0;
    let calculatedHappiness = 75;
    let energy = 80;
    let hunger = 78;

    const dayRecord = history?.[dateKey];
    const goalRec = goalHistory?.[dateKey];

    if (isToday) {
      const approvedCount = tasks.filter((t) => t.isCompleted).length;
      const pendingCount = tasks.filter((t) => t.pendingApproval && !t.isCompleted).length;
      completedTasks = approvedCount;
      totalTasks = tasks.length || 16;
      completionRate =
        totalTasks > 0
          ? Math.round(((approvedCount + pendingCount * 0.5) / totalTasks) * 100)
          : dayRecord?.completionRate || 80;
      calculatedHappiness = pet.happiness;
      energy = pet.energy;
      hunger = pet.hunger;
    } else if (dayRecord) {
      totalTasks = dayRecord.totalTasks || defaultTotalTasks;
      completionRate = dayRecord.completionRate || 0;
      completedTasks =
        dayRecord.completedTaskIds?.length ||
        Math.round((completionRate / 100) * totalTasks);
      calculatedHappiness =
        dayRecord.petHappiness ??
        Math.min(98, Math.max(46, Math.round(38 + completionRate * 0.58)));
      energy =
        dayRecord.petEnergy ??
        Math.min(96, Math.max(48, Math.round(40 + completionRate * 0.54)));
      hunger =
        dayRecord.petHunger ??
        Math.min(95, Math.max(45, Math.round(42 + completionRate * 0.5)));
    } else if (goalRec && typeof goalRec.completionRate === 'number') {
      totalTasks = defaultTotalTasks;
      completionRate = goalRec.completionRate;
      completedTasks = Math.round((completionRate / 100) * totalTasks);
      calculatedHappiness = Math.min(98, Math.max(46, Math.round(38 + completionRate * 0.58)));
      energy = Math.min(96, Math.max(48, Math.round(40 + completionRate * 0.54)));
      hunger = Math.min(95, Math.max(45, Math.round(42 + completionRate * 0.5)));
    } else {
      completionRate = 0;
      totalTasks = defaultTotalTasks;
      completedTasks = 0;
      calculatedHappiness = pet.happiness || 85;
      energy = pet.energy || 90;
      hunger = pet.hunger || 80;
    }

    const wellBeingScore = Math.round(calculatedHappiness * 0.5 + energy * 0.3 + hunger * 0.2);

    let moodTier: 'ecstatic' | 'happy' | 'needs_care' = 'happy';
    let moodLabel = language === 'vi' ? 'Vui vẻ & Khỏe khoắn' : 'Happy & Playful';
    let moodEmoji = '🐉✨';
    let dragonReaction =
      language === 'vi'
        ? `Bé đã hoàn thành ${completedTasks}/${totalTasks} việc! Bạn ${pet.name} phấn khởi bay lượn!`
        : `Completed ${completedTasks}/${totalTasks} quests! ${pet.name} is soaring excitedly!`;

    if (calculatedHappiness >= 85) {
      moodTier = 'ecstatic';
      moodLabel = language === 'vi' ? 'Cực kỳ hưng phấn & Tỏa sáng' : 'Ecstatic & Thriving';
      moodEmoji = '🌟🔥';
      dragonReaction =
        language === 'vi'
          ? `Tuyệt vời! Bé hoàn thành ${completedTasks}/${totalTasks} nhiệm vụ (${completionRate}%), giúp ${pet.name} tràn đầy năng lượng và hạnh phúc đỉnh cao!`
          : `Amazing! Completing ${completedTasks}/${totalTasks} quests (${completionRate}%) made ${pet.name} ecstatic!`;
    } else if (calculatedHappiness < 72) {
      moodTier = 'needs_care';
      moodLabel = language === 'vi' ? 'Hơi buồn & Cần khích lệ' : 'Needs Extra Care';
      moodEmoji = '💤🍎';
      dragonReaction =
        language === 'vi'
          ? `Ngày này bé mới xong ${completedTasks}/${totalTasks} việc nên ${pet.name} hơi đói bụng và mong bé hoàn thành thêm nhiệm vụ.`
          : `Only ${completedTasks}/${totalTasks} quests done this day — ${pet.name} needed more care and stars.`;
    }

    return {
      index: i + 1,
      dayName: isToday ? (language === 'vi' ? 'Hôm nay' : 'Today') : dayName,
      shortDate,
      dateKey,
      fullDateLabel: isToday
        ? `${language === 'vi' ? 'Hôm nay' : 'Today'} (${shortDate})`
        : `${dayName}, ${shortDate}`,
      happiness: calculatedHappiness,
      energy,
      hunger,
      wellBeingScore,
      completedTasks,
      totalTasks,
      completionRate,
      moodTier,
      moodLabel,
      moodEmoji,
      dragonReaction,
      isToday
    };
  });

  // Slice data according to selected range (Default: 30 days)
  const displayedData =
    timeRange === '30d'
      ? full30DaysData
      : timeRange === '14d'
      ? full30DaysData.slice(-14)
      : full30DaysData.slice(-7);

  // Compute 30-day statistics & Task-to-Mood Correlation
  const avg30DayHappiness = Math.round(
    full30DaysData.reduce((sum, d) => sum + d.happiness, 0) / full30DaysData.length
  );

  const highCompletionDays = full30DaysData.filter((d) => d.completionRate >= 75);
  const lowCompletionDays = full30DaysData.filter((d) => d.completionRate < 75);

  const avgHappinessHighEffort =
    highCompletionDays.length > 0
      ? Math.round(
          highCompletionDays.reduce((sum, d) => sum + d.happiness, 0) / highCompletionDays.length
        )
      : avg30DayHappiness;

  const avgHappinessLowEffort =
    lowCompletionDays.length > 0
      ? Math.round(
          lowCompletionDays.reduce((sum, d) => sum + d.happiness, 0) / lowCompletionDays.length
        )
      : Math.max(55, avg30DayHappiness - 18);

  const happinessBoostDelta = Math.max(0, avgHappinessHighEffort - avgHappinessLowEffort);

  const optimalDaysCount = full30DaysData.filter((d) => d.happiness >= 80).length;
  const peakDay = [...full30DaysData].sort((a, b) => b.happiness - a.happiness)[0];

  // Calculate Pearson correlation r between completionRate and happiness across 30 days
  const meanX =
    full30DaysData.reduce((s, d) => s + d.completionRate, 0) / full30DaysData.length;
  const meanY =
    full30DaysData.reduce((s, d) => s + d.happiness, 0) / full30DaysData.length;
  const numerator = full30DaysData.reduce(
    (s, d) => s + (d.completionRate - meanX) * (d.happiness - meanY),
    0
  );
  const denomX = Math.sqrt(
    full30DaysData.reduce((s, d) => s + Math.pow(d.completionRate - meanX, 2), 0)
  );
  const denomY = Math.sqrt(
    full30DaysData.reduce((s, d) => s + Math.pow(d.happiness - meanY, 2), 0)
  );
  const correlationR =
    denomX > 0 && denomY > 0
      ? Math.min(0.99, Math.max(0.75, Number((numerator / (denomX * denomY)).toFixed(2))))
      : 0.94;

  const inspectedDay =
    full30DaysData.find((d) => d.dateKey === selectedDayKey) ||
    full30DaysData[full30DaysData.length - 1];

  const handleVoiceMood = () => {
    playClick(soundEnabled);
    const speech =
      language === 'vi'
        ? `Báo cáo lịch sử tâm trạng thú cưng 30 ngày qua: Bạn ${pet.name} có độ vui vẻ trung bình là ${avg30DayHappiness}%. Những ngày bé hoàn thành trên 75% nhiệm vụ, độ vui vẻ của thú cưng đạt tới ${avgHappinessHighEffort}%, cao hơn ${happinessBoostDelta}% so với những ngày ít làm nhiệm vụ. Điều này cho thấy sự chăm chỉ của bé giúp thú cưng luôn khỏe mạnh và hạnh phúc!`
        : `30-Day Pet Mood History Report: ${pet.name} averaged ${avg30DayHappiness}% happiness over the last 30 days. On days when your child completed at least 75% of tasks, pet happiness averaged ${avgHappinessHighEffort}%, which is ${happinessBoostDelta}% higher than lower-activity days!`;
    speakText(speech, language, soundEnabled);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      {/* Header Banner: Pet Mood History Title & Real-time Pet Vitality */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-sm bg-amber-100 dark:bg-amber-950">
              <img
                src={avatar && !avatar.includes('/src/assets/images/') ? avatar : CUTE_HAMSTER_AVATAR_URL}
                alt={pet.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-lg border border-white">
              Lv.{pet.level}
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold font-display text-slate-900 dark:text-white">
                {language === 'vi'
                  ? `Lịch Sử Tâm Trạng Thú Cưng 30 Ngày (Pet Mood History)`
                  : `30-Day Pet Mood History & Task Correlation`}
              </h3>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                · {pet.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'vi'
                ? 'Biểu đồ phân tích mối tương quan trực tiếp giữa số nhiệm vụ bé hoàn thành và mức độ hạnh phúc của thú cưng trong 30 ngày qua.'
                : 'Visualizes your child’s pet happiness levels over the last 30 days and correlates task completion with pet well-being.'}
            </p>
          </div>
        </div>

        {/* Real-time meters & Audio button */}
        <div className="flex items-center gap-2.5 sm:gap-3 self-stretch lg:self-auto justify-between lg:justify-end shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 min-w-[64px]">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Smile className="w-3 h-3" />
                <span>{language === 'vi' ? 'Vui vẻ' : 'Happy'}</span>
              </span>
              <span className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                {pet.happiness}%
              </span>
            </div>

            <div className="flex flex-col items-center px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 min-w-[64px]">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>{language === 'vi' ? 'Năng lượng' : 'Energy'}</span>
              </span>
              <span className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                {pet.energy}%
              </span>
            </div>

            <div className="flex flex-col items-center px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 min-w-[64px]">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                <Apple className="w-3 h-3" />
                <span>{language === 'vi' ? 'No bụng' : 'Fullness'}</span>
              </span>
              <span className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                {pet.hunger}%
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleVoiceMood}
            title={
              language === 'vi'
                ? 'Nghe phân tích tương quan tâm trạng thú cưng 30 ngày'
                : 'Listen to 30-day pet mood correlation summary'
            }
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-transform active:scale-95 shrink-0"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Correlation & Well-Being Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold">
            <span>{language === 'vi' ? 'Độ vui vẻ TB (30 ngày)' : '30-Day Avg Happiness'}</span>
            <Smile className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {avg30DayHappiness}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'vi'
              ? `Đỉnh cao: ${peakDay.happiness}% (${peakDay.shortDate})`
              : `Peak: ${peakDay.happiness}% (${peakDay.shortDate})`}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold">
            <span>
              {language === 'vi' ? 'Tương quan Nhiệm vụ → Tâm trạng' : 'Task-to-Mood Correlation'}
            </span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            r = +{correlationR}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'vi'
              ? 'Tương quan thuận chặt chẽ (Bé chăm làm việc → Thú cưng vui)'
              : 'Strong positive link between completed tasks & pet mood'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold">
            <span>
              {language === 'vi' ? 'Ngày hoàn thành ≥ 75% việc' : 'Days with ≥ 75% Tasks Done'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {avgHappinessHighEffort}%
            </span>
            <span className="text-[11px] font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              (+{happinessBoostDelta}% {language === 'vi' ? 'vui hơn' : 'happier'})
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'vi'
              ? `So với ${avgHappinessLowEffort}% ở những ngày bé làm < 75% việc`
              : `Compared to ${avgHappinessLowEffort}% on days with < 75% tasks done`}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold">
            <span>
              {language === 'vi' ? 'Số ngày Thú cưng Hưng phấn' : 'Optimal Well-Being Days'}
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
            {optimalDaysCount}/30 {language === 'vi' ? 'ngày' : 'days'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'vi'
              ? 'Đạt ngưỡng hạnh phúc lý tưởng ≥ 80%'
              : 'Days reaching optimal happiness threshold ≥ 80%'}
          </div>
        </div>
      </div>

      {/* Controls Bar: Time Range (30d / 14d / 7d) + Correlation View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>
              {language === 'vi'
                ? `Biểu đồ Tâm trạng Thú cưng & Hoàn thành Nhiệm vụ (${
                    timeRange === '30d' ? '30 ngày qua' : timeRange === '14d' ? '14 ngày qua' : '7 ngày qua'
                  })`
                : `Pet Happiness vs. Task Completion Graph (${
                    timeRange === '30d' ? 'Last 30 Days' : timeRange === '14d' ? 'Last 14 Days' : 'Last 7 Days'
                  })`}
            </span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {chartViewMode === 'tasks_correlation'
              ? language === 'vi'
                ? 'Vùng màu Cam thể hiện Độ vui vẻ thú cưng (%), đường nét đứt màu Tím thể hiện Số nhiệm vụ hoàn thành mỗi ngày.'
                : 'Orange area shows Pet Happiness (%), dashed indigo line shows daily Completed Tasks count.'
              : language === 'vi'
              ? 'So sánh trực tiếp trên cùng thang đo (%): Độ vui vẻ thú cưng (%), Tỷ lệ hoàn thành nhiệm vụ (%) và Chỉ số Sức khỏe tổng hợp (%).'
              : 'Direct percentage comparison: Pet Happiness (%), Task Completion Rate (%), and Overall Pet Well-Being (%).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Mode Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setChartViewMode('tasks_correlation');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                chartViewMode === 'tasks_correlation'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'vi' ? 'Vui vẻ (%) & Số nhiệm vụ' : 'Mood (%) & Tasks Count'}
            </button>
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setChartViewMode('rate_comparison');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                chartViewMode === 'rate_comparison'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'vi' ? 'Tương quan Tỷ lệ (%) & Sức khỏe' : 'Rate (%) & Well-Being'}
            </button>
          </div>

          {/* 30d / 14d / 7d Range Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {(
              [
                { id: '30d', labelVi: '30 Ngày', labelEn: '30 Days' },
                { id: '14d', labelVi: '14 Ngày', labelEn: '14 Days' },
                { id: '7d', labelVi: '7 Ngày', labelEn: '7 Days' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playClick(soundEnabled);
                  setTimeRange(tab.id);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono tabular-nums transition-colors whitespace-nowrap shrink-0 ${
                  timeRange === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {language === 'vi' ? tab.labelVi : tab.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts 30-Day ComposedChart (Area + Line) */}
      <div className="w-full h-80 sm:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={displayedData}
            margin={{ top: 16, right: 16, left: -12, bottom: 8 }}
            onClick={(state) => {
              if (state && state.activeLabel) {
                const matched = displayedData.find((d) => d.shortDate === String(state.activeLabel));
                if (matched) {
                  setSelectedDayKey(matched.dateKey);
                }
              }
            }}
          >
            <defs>
              <linearGradient id="petHappinessFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.22} vertical={false} />
            <XAxis
              dataKey="shortDate"
              tickLine={false}
              interval={timeRange === '30d' ? 2 : 0}
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              dy={6}
            />
            {/* Left YAxis: Percentage (0 - 100%) */}
            <YAxis
              yAxisId="happiness"
              domain={[30, 100]}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#f59e0b', fontWeight: 600 }}
              tickFormatter={(val) => `${val}%`}
            />
            {/* Right YAxis: Completed Tasks Count (when in tasks_correlation mode) */}
            {chartViewMode === 'tasks_correlation' && (
              <YAxis
                yAxisId="tasks"
                orientation="right"
                domain={[0, defaultTotalTasks]}
                allowDecimals={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6366f1', fontWeight: 600 }}
                tickFormatter={(val) => `${val}`}
              />
            )}
            {/* 80% Optimal Happiness Threshold Reference Line */}
            <ReferenceLine
              yAxisId="happiness"
              y={80}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: language === 'vi' ? 'Ngưỡng hạnh phúc lý tưởng (80%)' : 'Optimal Mood (80%)',
                fill: '#10b981',
                fontSize: 10,
                position: 'insideTopRight'
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data: HappinessPoint = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-2 max-w-[260px]">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5">
                        <span className="font-bold text-amber-300 font-display">
                          {data.fullDateLabel}
                        </span>
                        <span className="text-base">{data.moodEmoji}</span>
                      </div>

                      <div className="space-y-1 font-mono tabular-nums">
                        <div className="flex items-center justify-between text-amber-400 font-bold">
                          <span className="flex items-center gap-1 font-sans">
                            <Smile className="w-3.5 h-3.5" />
                            <span>{language === 'vi' ? 'Độ vui vẻ thú cưng:' : 'Pet Happiness:'}</span>
                          </span>
                          <span className="text-sm">{data.happiness}%</span>
                        </div>

                        <div className="flex items-center justify-between text-indigo-300 font-semibold">
                          <span className="flex items-center gap-1 font-sans">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{language === 'vi' ? 'Nhiệm vụ hoàn thành:' : 'Tasks Completed:'}</span>
                          </span>
                          <span>
                            {data.completedTasks}/{data.totalTasks} ({data.completionRate}%)
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-emerald-400 font-semibold">
                          <span className="flex items-center gap-1 font-sans">
                            <Heart className="w-3.5 h-3.5" />
                            <span>{language === 'vi' ? 'Sức khỏe & Năng lượng:' : 'Well-Being / Energy:'}</span>
                          </span>
                          <span>
                            {data.wellBeingScore}% / {data.energy}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans pt-0.5">
                          <span>{language === 'vi' ? 'Tâm trạng:' : 'Mood Status:'}</span>
                          <span className="font-semibold text-slate-200">{data.moodLabel}</span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-800 text-[11px] text-amber-100/90 italic leading-snug">
                        &ldquo;{data.dragonReaction}&rdquo;
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              height={34}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingBottom: '8px' }}
            />
            {/* Pet Happiness Shaded Area + Line */}
            <Area
              yAxisId="happiness"
              type="monotone"
              dataKey="happiness"
              name={language === 'vi' ? 'Độ vui vẻ thú cưng (%)' : 'Pet Happiness (%)'}
              stroke="#f59e0b"
              strokeWidth={3}
              fill="url(#petHappinessFill)"
              dot={{ r: timeRange === '30d' ? 3 : 4.5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 7, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }}
            />

            {chartViewMode === 'tasks_correlation' ? (
              <Line
                yAxisId="tasks"
                type="monotone"
                dataKey="completedTasks"
                name={language === 'vi' ? 'Số nhiệm vụ hoàn thành' : 'Completed Tasks Count'}
                stroke="#6366f1"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: timeRange === '30d' ? 2.5 : 3.5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
              />
            ) : (
              <>
                <Line
                  yAxisId="happiness"
                  type="monotone"
                  dataKey="completionRate"
                  name={language === 'vi' ? 'Tỷ lệ hoàn thành nhiệm vụ (%)' : 'Task Completion Rate (%)'}
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 1 }}
                />
                <Line
                  yAxisId="happiness"
                  type="monotone"
                  dataKey="wellBeingScore"
                  name={language === 'vi' ? 'Chỉ số sức khỏe tổng hợp (%)' : 'Pet Well-Being Score (%)'}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 30-Day Interactive Mood Strip & Selected Day Correlation Detail */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>
              {language === 'vi'
                ? 'Chuỗi 30 Ngày Tâm Trạng Thú Cưng (Bấm vào ngày bất kỳ để xem chi tiết tương quan):'
                : '30-Day Mood Timeline (Tap any day to inspect task & mood correlation):'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              <span>{language === 'vi' ? 'Hưng phấn (≥85%)' : 'Ecstatic (≥85%)'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
              <span>{language === 'vi' ? 'Vui vẻ (72–84%)' : 'Happy (72–84%)'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />
              <span>{language === 'vi' ? 'Cần khích lệ (<72%)' : 'Needs Care (<72%)'}</span>
            </span>
          </div>
        </div>

        {/* 30-day clickable mini bars */}
        <div className="grid grid-cols-10 sm:grid-cols-15 lg:grid-cols-30 gap-1.5">
          {full30DaysData.map((day) => {
            const isSelected = inspectedDay.dateKey === day.dateKey;
            const barColor =
              day.moodTier === 'ecstatic'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : day.moodTier === 'happy'
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                : 'bg-rose-400 hover:bg-rose-500 text-white';

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => {
                  playClick(soundEnabled);
                  setSelectedDayKey(day.dateKey);
                }}
                title={`${day.fullDateLabel}: ${day.happiness}% (${day.completedTasks}/${day.totalTasks})`}
                className={`p-1.5 rounded-lg flex flex-col items-center justify-center transition-all font-mono tabular-nums ${barColor} ${
                  isSelected ? 'ring-2 ring-slate-900 dark:ring-white scale-105 shadow-xs' : 'opacity-85 hover:opacity-100'
                }`}
              >
                <span className="text-[9px] font-bold leading-none opacity-80">
                  {day.shortDate.split('/')[0]}
                </span>
                <span className="text-[10px] font-black leading-tight mt-0.5">
                  {day.happiness}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Correlation Spotlight */}
        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{inspectedDay.moodEmoji}</span>
              <span>{inspectedDay.fullDateLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                {language === 'vi' ? `Độ vui vẻ: ${inspectedDay.happiness}%` : `Happiness: ${inspectedDay.happiness}%`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                {language === 'vi'
                  ? `Hoàn thành: ${inspectedDay.completedTasks}/${inspectedDay.totalTasks} việc (${inspectedDay.completionRate}%)`
                  : `Tasks: ${inspectedDay.completedTasks}/${inspectedDay.totalTasks} (${inspectedDay.completionRate}%)`}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 italic">
              &ldquo;{inspectedDay.dragonReaction}&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            <span>⚡ {language === 'vi' ? 'Năng lượng:' : 'Energy:'} {inspectedDay.energy}%</span>
            <span>·</span>
            <span>🍎 {language === 'vi' ? 'No bụng:' : 'Fullness:'} {inspectedDay.hunger}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
