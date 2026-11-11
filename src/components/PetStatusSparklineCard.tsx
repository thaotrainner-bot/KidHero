import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
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
  Utensils,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Crown,
  Activity
} from 'lucide-react';
import { DayRecord, GoalHistoryItem, Language, Task, VirtualPet } from '../types';
import { playClick } from '../utils/audio';
import { getPetEvolutionInfo, getPetSpeciesMeta } from '../utils/pets';

interface PetStatusSparklineCardProps {
  pet: VirtualPet;
  history: Record<string, DayRecord>;
  goalHistory?: Record<string, GoalHistoryItem>;
  tasks: Task[];
  language: Language;
  soundEnabled: boolean;
  lastActiveDate: string;
}

export interface PetStatusDayPoint {
  dateKey: string;
  dayLabel: string;
  shortDate: string;
  dayAndDate: string;
  happiness: number;
  hunger: number;
  energy: number;
  wellBeingAvg: number;
  completedTasks: number;
  completionRate: number;
  isToday: boolean;
}

export const PetStatusSparklineCard: React.FC<PetStatusSparklineCardProps> = ({
  pet,
  history,
  goalHistory,
  tasks,
  language,
  soundEnabled,
  lastActiveDate
}) => {
  const [viewMode, setViewMode] = useState<'sparklines_and_combined' | 'sparklines_only'>('sparklines_and_combined');
  const [highlightedMetric, setHighlightedMetric] = useState<'all' | 'happiness' | 'hunger' | 'energy'>('all');

  const petMeta = getPetSpeciesMeta(pet.species, pet.name);
  const petDisplayName = pet.name || (language === 'vi' ? petMeta.nameVi : petMeta.nameEn);
  const petAvatar = pet.avatar || petMeta.avatar;
  const evolutionInfo = getPetEvolutionInfo(pet.evolutionStars ?? pet.eggStars ?? 0, pet.isHatched);

  const defaultTotalTasks = tasks.length || 16;

  // Build 7-day dataset for Happiness, Hunger, and Energy
  const sevenDayData: PetStatusDayPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const dayLabel = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
    const shortDate = `${day}/${month}`;
    const isToday = i === 6 || dateKey === lastActiveDate;

    const record = history?.[dateKey];
    const goalRec = goalHistory?.[dateKey];

    let completionRate = 0;
    let completedTasks = 0;
    let happiness = 80;
    let hunger = 78;
    let energy = 82;

    if (isToday) {
      const approvedCount = tasks.filter((t) => t.isCompleted).length;
      const pendingCount = tasks.filter((t) => t.pendingApproval && !t.isCompleted).length;
      completedTasks = approvedCount;
      completionRate =
        defaultTotalTasks > 0
          ? Math.round(((approvedCount + pendingCount * 0.5) / defaultTotalTasks) * 100)
          : record?.completionRate || 80;
      happiness = Math.min(100, Math.max(0, Math.round(Number(pet.happiness) || 85)));
      hunger = Math.min(100, Math.max(0, Math.round(Number(pet.hunger) || 80)));
      energy = Math.min(100, Math.max(0, Math.round(Number(pet.energy) || 85)));
    } else if (record) {
      const totalForDay = record.totalTasks || defaultTotalTasks;
      completionRate = record.completionRate || 0;
      completedTasks =
        record.completedTaskIds?.length || Math.round((completionRate / 100) * totalForDay);

      happiness =
        record.petHappiness ??
        Math.min(98, Math.max(48, Math.round(42 + completionRate * 0.55 + (i % 2 === 0 ? 2 : -1))));
      hunger =
        record.petHunger ??
        Math.min(97, Math.max(45, Math.round(40 + completionRate * 0.54 + (i % 3 === 0 ? 3 : -2))));
      energy =
        record.petEnergy ??
        Math.min(100, Math.max(50, Math.round(46 + completionRate * 0.52 + (i % 2 === 1 ? 3 : 0))));
    } else if (goalRec && typeof goalRec.completionRate === 'number') {
      completionRate = goalRec.completionRate;
      completedTasks = Math.round((completionRate / 100) * defaultTotalTasks);
      happiness = Math.min(98, Math.max(48, Math.round(42 + completionRate * 0.55)));
      hunger = Math.min(96, Math.max(45, Math.round(40 + completionRate * 0.54)));
      energy = Math.min(100, Math.max(50, Math.round(46 + completionRate * 0.52)));
    } else {
      completionRate = 0;
      completedTasks = 0;
      happiness = Math.min(100, Math.max(0, Math.round(Number(pet.happiness) || 85)));
      hunger = Math.min(100, Math.max(0, Math.round(Number(pet.hunger) || 80)));
      energy = Math.min(100, Math.max(0, Math.round(Number(pet.energy) || 85)));
    }

    const wellBeingAvg = Math.round((happiness + hunger + energy) / 3);

    return {
      dateKey,
      dayLabel,
      shortDate,
      dayAndDate: `${dayLabel} (${shortDate})`,
      happiness,
      hunger,
      energy,
      wellBeingAvg,
      completedTasks,
      completionRate,
      isToday
    };
  });

  const calcStats = (key: 'happiness' | 'hunger' | 'energy') => {
    const values = sevenDayData.map((d) => d[key]);
    const current = values[values.length - 1] ?? 80;
    const first = values[0] ?? current;
    const delta = current - first;
    const avg = Math.round(values.reduce((acc, v) => acc + v, 0) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { current, delta, avg, min, max };
  };

  const happinessStats = calcStats('happiness');
  const hungerStats = calcStats('hunger');
  const energyStats = calcStats('energy');

  const overallWellBeing7dAvg = Math.round(
    (happinessStats.avg + hungerStats.avg + energyStats.avg) / 3
  );

  const metricConfigs = [
    {
      key: 'happiness' as const,
      titleVi: 'Độ Vui Vẻ (Happiness)',
      titleEn: 'Happiness Level',
      careHintVi: 'Tăng khi Xoa đầu & Học tập/Đọc sách (+20%)',
      careHintEn: 'Boosted by Petting & Study/Reading (+20%)',
      color: '#f59e0b',
      gradientId: 'petSparkHappiness',
      bgClass: 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-800/60',
      badgeClass: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
      textClass: 'text-amber-600 dark:text-amber-400',
      stats: happinessStats,
      icon: <Heart className="w-4 h-4 text-amber-500 fill-amber-500" />
    },
    {
      key: 'hunger' as const,
      titleVi: 'Độ No Bụng (Hunger / Fullness)',
      titleEn: 'Fullness / Hunger Level',
      careHintVi: 'Tăng +20% mỗi việc Sáng / Trưa / Tối hoàn thành',
      careHintEn: '+20% per Morning / Noon / Evening task done',
      color: '#0ea5e9',
      gradientId: 'petSparkHunger',
      bgClass: 'bg-sky-50/80 dark:bg-sky-950/25 border-sky-200/80 dark:border-sky-800/60',
      badgeClass: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300',
      textClass: 'text-sky-600 dark:text-sky-400',
      stats: hungerStats,
      icon: <Utensils className="w-4 h-4 text-sky-500" />
    },
    {
      key: 'energy' as const,
      titleVi: 'Năng Lượng (Energy)',
      titleEn: 'Energy Level',
      careHintVi: 'Hồi phục 100% khi bé đi ngủ đúng giờ buổi tối',
      careHintEn: 'Restores 100% when sleeping on time at night',
      color: '#10b981',
      gradientId: 'petSparkEnergy',
      bgClass: 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200/80 dark:border-emerald-800/60',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      stats: energyStats,
      icon: <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <img
              src={petAvatar}
              alt={petDisplayName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm bg-amber-50"
            />
            <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-black text-[10px] font-mono border border-white shadow">
              Cấp {evolutionInfo.stage}
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>
                {language === 'vi'
                  ? 'Pet Status • Biểu Đồ Sparkline 7 Ngày'
                  : 'Pet Status • 7-Day Well-Being Sparklines'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2 flex-wrap">
              <span>
                {language === 'vi'
                  ? `Trạng Thái Linh Vật 7 Ngày Qua (${petDisplayName})`
                  : `Pet Status: 7-Day Well-Being Sparklines (${petDisplayName})`}
              </span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-mono">
                {language === 'vi'
                  ? `Chỉ số khỏe mạnh TB: ${overallWellBeing7dAvg}%`
                  : `7d Well-Being Avg: ${overallWellBeing7dAvg}%`}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'vi'
                ? 'Theo dõi xu hướng 7 ngày của 3 chỉ số Độ vui vẻ, Độ no bụng và Năng lượng để thấy mối liên hệ giữa thói quen sinh hoạt của bé và sức khỏe linh vật.'
                : '7-day sparkline history for Happiness, Hunger, and Energy levels so parents can monitor long-term well-being trends.'}
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setViewMode('sparklines_and_combined');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'sparklines_and_combined'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'vi' ? '📊 Sparklines + Tổng hợp' : '📊 Sparklines + Combined'}
            </button>
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setViewMode('sparklines_only');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'sparklines_only'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'vi' ? '✨ 3 Thẻ Sparkline' : '✨ 3 Sparkline Cards'}
            </button>
          </div>
        </div>
      </div>

      {/* 3 Recharts Sparkline Cards for Happiness, Hunger, and Energy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricConfigs.map((metric) => {
          const isPositive = metric.stats.delta >= 0;
          const isFocused = highlightedMetric === 'all' || highlightedMetric === metric.key;

          return (
            <div
              key={metric.key}
              onClick={() => {
                playClick(soundEnabled);
                setHighlightedMetric((prev) => (prev === metric.key ? 'all' : metric.key));
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${metric.bgClass} ${
                !isFocused ? 'opacity-60' : 'ring-1 ring-transparent hover:shadow-md'
              }`}
            >
              {/* Card Top Info */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-100">
                    {metric.icon}
                    <span className="truncate">
                      {language === 'vi' ? metric.titleVi : metric.titleEn}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {language === 'vi' ? metric.careHintVi : metric.careHintEn}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-black font-mono shrink-0 ${
                    isPositive
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {isPositive ? `+${metric.stats.delta}%` : `${metric.stats.delta}%`}
                  </span>
                </span>
              </div>

              {/* Current Value & 7-Day Average Row */}
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black font-mono tabular-nums ${metric.textClass}`}>
                    {metric.stats.current}%
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'vi' ? 'hôm nay' : 'today'}
                  </span>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  <span className="font-bold">
                    {language === 'vi' ? 'TB 7 ngày:' : '7d Avg:'} {metric.stats.avg}%
                  </span>
                  <span className="text-slate-400 ml-1">
                    ({metric.stats.min}–{metric.stats.max}%)
                  </span>
                </div>
              </div>

              {/* Recharts 7-Day Sparkline AreaChart */}
              <div className="h-24 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={sevenDayData}
                    margin={{ top: 6, right: 6, left: 6, bottom: 2 }}
                  >
                    <defs>
                      <linearGradient id={metric.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={metric.color} stopOpacity={0.42} />
                        <stop offset="95%" stopColor={metric.color} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="dayLabel"
                      hide={false}
                      axisLine={false}
                      tickLine={false}
                      fontSize={10}
                      stroke="#94a3b8"
                      interval={0}
                    />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0]?.payload as PetStatusDayPoint;
                          const val = pt[metric.key];
                          return (
                            <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-xl shadow-lg border border-slate-700 text-[11px] space-y-0.5">
                              <div className="font-bold text-amber-300">{pt.dayAndDate}</div>
                              <div className="font-mono font-extrabold">
                                {language === 'vi' ? metric.titleVi : metric.titleEn}: {val}%
                              </div>
                              <div className="text-[10px] text-slate-300">
                                {language === 'vi'
                                  ? `Hoàn thành việc: ${pt.completionRate}%`
                                  : `Task completion: ${pt.completionRate}%`}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={metric.stats.avg}
                      stroke={metric.color}
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                    />
                    <Area
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.color}
                      strokeWidth={2.5}
                      fill={`url(#${metric.gradientId})`}
                      dot={{ r: 3, fill: metric.color, stroke: '#ffffff', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: metric.color, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Combined 7-Day Multi-Metric Comparison Recharts LineChart */}
      {viewMode === 'sparklines_and_combined' && (
        <div className="bg-slate-50/80 dark:bg-slate-900/50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>
                  {language === 'vi'
                    ? 'Biểu Đồ So Sánh Tổng Hợp 3 Chỉ Số Sức Khỏe Linh Vật (7 Ngày Qua)'
                    : 'Combined 7-Day Pet Well-Being Trend (Happiness, Hunger & Energy)'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'vi'
                  ? 'Bấm vào một thẻ chỉ số phía trên để làm nổi bật đường tương ứng, hoặc bấm lần nữa để xem cả 3 đường.'
                  : 'Click any metric card above to isolate its trend line, or click again to view all 3 metrics.'}
              </p>
            </div>

            {highlightedMetric !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  playClick(soundEnabled);
                  setHighlightedMetric('all');
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold self-start sm:self-auto"
              >
                {language === 'vi' ? 'Hiện cả 3 chỉ số' : 'Show all 3 metrics'}
              </button>
            )}
          </div>

          <div className="w-full h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sevenDayData}
                margin={{ top: 10, right: 16, left: -14, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} vertical={false} />
                <XAxis
                  dataKey="dayAndDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  dy={6}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0]?.payload as PetStatusDayPoint;
                      return (
                        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[210px]">
                          <div className="font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center justify-between gap-3">
                            <span>{d.dayAndDate}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                              TB: {d.wellBeingAvg}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-amber-600 dark:text-amber-400 font-bold font-mono">
                            <span>💖 {language === 'vi' ? 'Độ vui vẻ:' : 'Happiness:'}</span>
                            <span>{d.happiness}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-sky-600 dark:text-sky-400 font-bold font-mono">
                            <span>🍲 {language === 'vi' ? 'Độ no bụng:' : 'Fullness:'}</span>
                            <span>{d.hunger}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                            <span>⚡ {language === 'vi' ? 'Năng lượng:' : 'Energy:'}</span>
                            <span>{d.energy}%</span>
                          </div>
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                            <span>{language === 'vi' ? 'Tỷ lệ việc hoàn thành:' : 'Tasks completed:'}</span>
                            <span className="font-mono font-bold">{d.completionRate}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingBottom: '6px' }}
                />
                {(highlightedMetric === 'all' || highlightedMetric === 'happiness') && (
                  <Line
                    type="monotone"
                    dataKey="happiness"
                    name={language === 'vi' ? '💖 Độ vui vẻ (%)' : '💖 Happiness (%)'}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}
                {(highlightedMetric === 'all' || highlightedMetric === 'hunger') && (
                  <Line
                    type="monotone"
                    dataKey="hunger"
                    name={language === 'vi' ? '🍲 Độ no bụng (%)' : '🍲 Fullness (%)'}
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0ea5e9', stroke: '#ffffff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}
                {(highlightedMetric === 'all' || highlightedMetric === 'energy') && (
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name={language === 'vi' ? '⚡ Năng lượng (%)' : '⚡ Energy (%)'}
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
