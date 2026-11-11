import React, { useState } from 'react';
import {
  Scale,
  AlertTriangle,
  ShieldCheck,
  HeartHandshake,
  Volume2,
  Sparkles,
  CheckCircle2,
  Clock,
  Info,
  HelpCircle,
  ArrowRight,
  Tv,
  Box,
  Utensils,
  Moon,
  ShieldAlert,
  Frown
} from 'lucide-react';
import {
  DisciplineLog,
  DisciplinePrinciple,
  DisciplineRule,
  Language
} from '../types';
import { playClick, speakText } from '../utils/audio';

const renderDisciplineIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Tv':
    case '📺':
      return <Tv className="w-6 h-6 text-rose-500" />;
    case 'AlertTriangle':
    case '⚠️':
      return <AlertTriangle className="w-6 h-6 text-amber-500" />;
    case 'Box':
    case '📦':
      return <Box className="w-6 h-6 text-indigo-500" />;
    case 'Utensils':
    case '🍽️':
      return <Utensils className="w-6 h-6 text-orange-500" />;
    case 'Moon':
    case '🌙':
      return <Moon className="w-6 h-6 text-blue-500" />;
    case 'ShieldAlert':
    case '🤝':
      return <ShieldAlert className="w-6 h-6 text-red-500" />;
    case 'Frown':
    case '😢':
      return <Frown className="w-6 h-6 text-purple-500" />;
    default:
      return <span className="text-2xl">{iconName || '⚠️'}</span>;
  }
};

interface KidDisciplineViewProps {
  childName: string;
  currentStars: number;
  lastActiveDate: string;
  disciplineRules: DisciplineRule[];
  disciplinePrinciples: DisciplinePrinciple[];
  disciplineLogs: DisciplineLog[];
  language: Language;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  onGoToQuests?: () => void;
}

export const KidDisciplineView: React.FC<KidDisciplineViewProps> = ({
  childName,
  currentStars,
  lastActiveDate,
  disciplineRules,
  disciplinePrinciples,
  disciplineLogs,
  language,
  soundEnabled,
  voiceEnabled,
  onGoToQuests
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // Filter only today's discipline logs
  const todayLogs = (disciplineLogs || []).filter((log) => log.date === lastActiveDate);
  const activePenaltiesToday = todayLogs.filter((log) => !log.forgiven);
  const forgivenLogsToday = todayLogs.filter((log) => log.forgiven);

  const totalStarsDeductedToday = activePenaltiesToday.reduce(
    (sum, log) => sum + (Number(log.penaltyStars) || 0),
    0
  );
  const totalStarsRestoredToday = forgivenLogsToday.reduce(
    (sum, log) => sum + (Number(log.penaltyStars) || 0),
    0
  );

  const handleSpeakSummary = () => {
    playClick(soundEnabled);
    if (activePenaltiesToday.length === 0) {
      const msg =
        language === 'vi'
          ? `Tuyệt vời lắm ${childName} ơi! Hôm nay bé rất ngoan, không bị trừ ngôi sao nào. Hãy xem bảng quy tắc kỷ luật bên dưới để luôn giữ vững phong độ nhé!`
          : `Awesome job ${childName}! You have zero star deductions today. Check the family rules below to keep shining!`;
      speakText(msg, language, true);
    } else {
      const reasons = activePenaltiesToday.map((l) => l.reason).join('; ');
      const msg =
        language === 'vi'
          ? `Hôm nay bé ${childName} đang bị trừ ${totalStarsDeductedToday} ngôi sao vì: ${reasons}. Bé hãy dũng cảm nhận lỗi với ba mẹ và làm tốt nhiệm vụ để được ba mẹ tha thứ và hoàn lại đủ sao nhé!`
          : `Today ${childName} lost ${totalStarsDeductedToday} stars for: ${reasons}. Apologize sincerely and complete your quests so parents can restore your stars!`;
      speakText(msg, language, true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Kid-Friendly Banner: Explain Discipline & Today's Status */}
      <div className="bg-gradient-to-br from-rose-600 via-orange-600 to-amber-600 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-xs text-xs sm:text-sm font-extrabold tracking-wide">
              <Scale className="w-4 h-4 text-amber-200" />
              <span>
                {language === 'vi'
                  ? 'Góc Tự Giác & Quy Tắc Kỷ Luật Của Bé'
                  : 'Kid Self-Discipline & Star Deduction Guide'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-tight">
              {language === 'vi'
                ? `${childName} ơi, cùng tìm hiểu vì sao bé bị trừ sao nhé!`
                : `How Star Deductions & Forgiveness Work`}
            </h2>

            <p className="text-sm sm:text-base text-rose-50/95 font-medium leading-relaxed">
              {language === 'vi'
                ? 'Trừ sao không phải là phạt nặng, mà là lời nhắc nhở để con rèn thói quen tốt. Khi con dũng cảm nhận lỗi và sửa sai, Ba Mẹ sẽ bấm nút Tha Thứ để hoàn lại 100% số sao cho con!'
                : 'Star deductions are gentle reminders to help you grow. Whenever you apologize and fix your mistake, Parents will forgive and restore 100% of your stars!'}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSpeakSummary}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-rose-700 hover:bg-amber-50 font-extrabold text-xs sm:text-sm shadow-md transition-transform active:scale-95"
              >
                <Volume2 className="w-4 h-4 text-rose-600" />
                <span>
                  {language === 'vi' ? 'Nghe giải thích bằng giọng nói' : 'Listen to Voice Guide'}
                </span>
              </button>

              {onGoToQuests && (
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    onGoToQuests();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-black/25 hover:bg-black/35 text-white border border-white/25 font-bold text-xs sm:text-sm transition-colors"
                >
                  <span>{language === 'vi' ? 'Làm nhiệm vụ chuộc lỗi' : 'Do Quests Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Summary KPI Cards for Child */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            <div className="bg-black/25 backdrop-blur-xs border border-white/20 rounded-2xl p-3.5 text-center">
              <div className="text-xs font-bold text-rose-100">
                {language === 'vi' ? 'Bị trừ hôm nay' : 'Deducted Today'}
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-1">
                {totalStarsDeductedToday > 0 ? `-${totalStarsDeductedToday}` : '0'} ⭐
              </div>
              <div className="text-[11px] text-rose-100/90 mt-0.5 font-semibold">
                {activePenaltiesToday.length}{' '}
                {language === 'vi' ? 'lần nhắc nhở' : 'reminders'}
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-xs border border-white/20 rounded-2xl p-3.5 text-center">
              <div className="text-xs font-bold text-emerald-100">
                {language === 'vi' ? 'Đã hoàn lại' : 'Restored Today'}
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 mt-1">
                +{totalStarsRestoredToday} ⭐
              </div>
              <div className="text-[11px] text-emerald-100/90 mt-0.5 font-semibold">
                {forgivenLogsToday.length}{' '}
                {language === 'vi' ? 'lần sửa sai' : 'forgiven'}
              </div>
            </div>

            <div className="bg-black/25 backdrop-blur-xs border border-white/20 rounded-2xl p-3.5 text-center">
              <div className="text-xs font-bold text-amber-100">
                {language === 'vi' ? 'Sao hiện có' : 'Current Stars'}
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
                {currentStars} ⭐
              </div>
              <div className="text-[11px] text-amber-100/90 mt-0.5 font-semibold">
                {language === 'vi' ? 'Trong ví của bé' : 'Available'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Today's Star Deduction Log (Nhật ký bị trừ sao hôm nay của bé) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-display">
                {language === 'vi'
                  ? '1. Nhật Ký Bị Trừ Sao Hôm Nay Của Bé'
                  : "1. Today's Star Deduction Log"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {language === 'vi'
                  ? 'Chi tiết từng lần bé bị trừ sao trong ngày hôm nay và lý do cụ thể'
                  : 'Exact reasons and timestamps for any star deductions recorded today'}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 self-start sm:self-auto">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>
              {language === 'vi' ? `Hôm nay (${lastActiveDate})` : `Today (${lastActiveDate})`}
            </span>
          </span>
        </div>

        {todayLogs.length === 0 ? (
          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-dashed border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-6 text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl">
              🌟
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-emerald-900 dark:text-emerald-200">
              {language === 'vi'
                ? `Hoan hô ${childName}! Hôm nay bé chưa bị trừ ngôi sao nào!`
                : `Hooray ${childName}! Zero stars deducted today!`}
            </h4>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300/90 max-w-xl mx-auto">
              {language === 'vi'
                ? 'Bé đang cư xử rất lễ phép, tự giác và đúng giờ. Hãy tiếp tục giữ vững chuỗi ngày ngoan ngoãn này nhé!'
                : 'You are doing an awesome job following all family rules today. Keep up the great habit!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayLogs.map((log) => {
              const matchedRule = disciplineRules.find((r) => r.id === log.ruleId);
              const ruleIcon = matchedRule?.icon || '⚠️';
              const reasonText =
                language === 'vi' ? log.reason : log.reasonEn || log.reason;

              return (
                <div
                  key={log.id}
                  className={`rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    log.forgiven
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/70 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        log.forgiven
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-2xl'
                          : 'bg-rose-100 dark:bg-rose-900/50 border-rose-300 dark:border-rose-700'
                      }`}
                    >
                      {log.forgiven ? '💚' : renderDisciplineIcon(ruleIcon)}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wide ${
                            log.forgiven
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {log.forgiven
                            ? language === 'vi'
                              ? `Đã tha thứ & Hoàn lại +${log.penaltyStars} ⭐`
                              : `Forgiven & Restored +${log.penaltyStars} ⭐`
                            : language === 'vi'
                            ? `Bị trừ -${log.penaltyStars} ⭐`
                            : `Deducted -${log.penaltyStars} ⭐`}
                        </span>

                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
                          ⏰ {log.timestamp}
                        </span>

                        {log.forgiven && log.forgivenAt && (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                            • {language === 'vi' ? `Hoàn sao lúc ${log.forgivenAt}` : `Restored at ${log.forgivenAt}`}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                        {language === 'vi' ? 'Lý do: ' : 'Reason: '}
                        <span className={log.forgiven ? 'line-through opacity-80' : 'text-rose-700 dark:text-rose-300'}>
                          {reasonText}
                        </span>
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        {log.forgiven
                          ? language === 'vi'
                            ? `🎉 Con đã biết nhận lỗi và sửa sai nên Ba Mẹ đã hoàn lại đủ +${log.penaltyStars} ngôi sao cho con!`
                            : `🎉 Because you apologized and fixed your behavior, Parents restored +${log.penaltyStars} stars!`
                          : language === 'vi'
                          ? `💡 Cách nhận lại ${log.penaltyStars} sao: Con hãy khoanh tay xin lỗi Ba Mẹ, khắc phục ngay việc "${reasonText}" và hoàn thành tốt nhiệm vụ hôm nay nhé!`
                          : `💡 How to earn back ${log.penaltyStars} stars: Apologize sincerely, fix "${reasonText}", and complete today's quests!`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playClick(soundEnabled);
                        const speech = log.forgiven
                          ? language === 'vi'
                            ? `Lúc ${log.timestamp}, bé bị nhắc nhở vì ${reasonText}, nhưng bé đã ngoan ngoãn sửa sai nên được ba mẹ tha thứ và hoàn lại ${log.penaltyStars} ngôi sao!`
                            : `Forgiven and restored ${log.penaltyStars} stars for ${reasonText}!`
                          : language === 'vi'
                          ? `Lúc ${log.timestamp}, bé bị trừ ${log.penaltyStars} ngôi sao vì: ${reasonText}. Bé hãy xin lỗi ba mẹ và sửa sai ngay để được hoàn lại ${log.penaltyStars} ngôi sao nhé!`
                          : `Deducted ${log.penaltyStars} stars at ${log.timestamp} for ${reasonText}. Apologize and fix it to earn your stars back!`;
                        speakText(speech, language, true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-colors"
                    >
                      <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{language === 'vi' ? 'Nghe lý do' : 'Listen'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Family Discipline Rules Table (Khi nào bé sẽ bị trừ sao?) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-display">
                {language === 'vi'
                  ? '2. Khi Nào Bé Bị Trừ Sao? (Bảng Quy Tắc Kỷ Luật)'
                  : '2. When Are Stars Deducted? (Family Rules)'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {language === 'vi'
                  ? `Danh sách ${disciplineRules.length} hành vi cần tránh và số sao bị trừ tương ứng do Ba Mẹ cài đặt`
                  : `All ${disciplineRules.length} behaviors to avoid and their exact star deductions set by Parents`}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs font-extrabold text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4" />
            <span>
              {language === 'vi'
                ? 'Bấm vào từng thẻ để nghe đọc quy tắc'
                : 'Tap any card to hear the rule'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {disciplineRules.map((rule) => {
            const title = language === 'vi' ? rule.title : rule.titleEn || rule.title;
            const desc =
              language === 'vi' ? rule.description : rule.descriptionEn || rule.description;
            const isSelected = selectedRuleId === rule.id;

            // Count how many times this rule was triggered today
            const triggeredTodayCount = activePenaltiesToday.filter(
              (l) => l.ruleId === rule.id
            ).length;

            return (
              <div
                key={rule.id}
                onClick={() => {
                  playClick(soundEnabled);
                  setSelectedRuleId(isSelected ? null : rule.id);
                  const speech =
                    language === 'vi'
                      ? `Quy tắc: ${title}. Nếu vi phạm sẽ bị trừ ${rule.penaltyStars} ngôi sao. ${desc}`
                      : `Rule: ${title}. Penalty: minus ${rule.penaltyStars} stars. ${desc}`;
                  speakText(speech, language, voiceEnabled);
                }}
                className={`cursor-pointer rounded-2xl p-4 sm:p-5 border-2 transition-all flex items-start gap-3.5 text-left ${
                  triggeredTodayCount > 0
                    ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 shadow-sm'
                    : isSelected
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-sm'
                    : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/70 hover:border-amber-300 dark:hover:border-amber-700'
                }`}
              >
                <div className="w-13 h-13 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                  {renderDisciplineIcon(rule.icon)}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                      {title}
                    </h4>

                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600 text-white font-mono font-black text-xs sm:text-sm shadow-2xs">
                      -{rule.penaltyStars} ⭐
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {desc}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                    {triggeredTodayCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>
                          {language === 'vi'
                            ? `Hôm nay bé đã mắc lỗi này (${triggeredTodayCount} lần)`
                            : `Triggered today (${triggeredTodayCount}x)`}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {language === 'vi'
                            ? 'Hôm nay bé thực hiện rất tốt!'
                            : 'Followed well today!'}
                        </span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Nghe đọc' : 'Listen'}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: How to Make Amends & Get Stars Back + Family Golden Principles */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50/70 to-indigo-50/60 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 rounded-3xl p-5 sm:p-6 border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-display">
              {language === 'vi'
                ? '3. Bí Kíp Chuộc Lỗi & Nhận Lại 100% Sao Từ Ba Mẹ'
                : '3. How to Make Amends & Get 100% of Your Stars Back'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {language === 'vi'
                ? 'Nếu lỡ bị trừ sao, bé chỉ cần làm đủ 3 bước siêu dễ dưới đây là được hoàn lại sao ngay!'
                : 'If you lose stars, follow these 3 simple steps to earn forgiveness and restore your stars!'}
            </p>
          </div>
        </div>

        {/* 3 Step Kid Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-emerald-200/70 dark:border-slate-700 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-extrabold">
              <span>Bước 1</span>
            </div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
              {language === 'vi' ? '🙏 Dũng cảm nhận lỗi' : '🙏 Apologize Sincerely'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'vi'
                ? 'Không khóc nhè hay đổ lỗi. Con bình tĩnh nói với Ba Mẹ: "Con biết lỗi rồi ạ, lần sau con sẽ chú ý hơn!"'
                : 'Stay calm and tell your parents sincerely that you understand why the behavior was not right.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-emerald-200/70 dark:border-slate-700 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-xs font-extrabold">
              <span>Bước 2</span>
            </div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
              {language === 'vi' ? '🧹 Tự giác sửa sai ngay' : '🧹 Fix the Mistake Right Away'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'vi'
                ? 'Ví dụ: Nếu quên dọn đồ chơi thì con đi cất gọn ngay; nếu chưa giữ lời hứa hoặc nói năng chưa lễ phép thì con khoanh tay xin lỗi ba mẹ và thực hiện ngay việc đã hứa.'
                : 'Take immediate action—such as tidying up your desk, keeping your promise, or apologizing politely to parents.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-emerald-200/70 dark:border-slate-700 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
              <span>Bước 3</span>
            </div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
              {language === 'vi' ? '🌟 Ba Mẹ hoàn lại 100% Sao!' : '🌟 Parents Restore 100% Stars!'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'vi'
                ? 'Ba Mẹ vào mục Kỷ Luật bấm nút "Tha Thứ & Hoàn Sao", toàn bộ số sao bị trừ sẽ bay trở lại ví của con!'
                : 'Parents tap "Forgive & Restore Stars" in Parent Mode, and all deducted stars return to your wallet!'}
            </p>
          </div>
        </div>

        {/* Family Golden Principles configured by Parents */}
        {disciplinePrinciples && disciplinePrinciples.length > 0 && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>
                {language === 'vi'
                  ? 'Nguyên tắc kỷ luật yêu thương của gia đình mình'
                  : 'Our Family Positive Discipline Principles'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {disciplinePrinciples.map((p) => {
                const pTitle = language === 'vi' ? p.title : p.titleEn || p.title;
                const pDesc =
                  language === 'vi' ? p.description : p.descriptionEn || p.description;
                return (
                  <div
                    key={p.id}
                    className="bg-white/85 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3"
                  >
                    <div className="text-2xl shrink-0">{p.icon || '💛'}</div>
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                        {pTitle}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {pDesc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
