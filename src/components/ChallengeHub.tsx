import React, { useState } from 'react';
import {
  CheckCircle2,
  Star,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  HeartHandshake,
  Check,
  Send,
  Award
} from 'lucide-react';
import { Challenge, Language } from '../types';
import { playClick, playSuccessChime, speakText } from '../utils/audio';

interface ChallengeHubProps {
  challenges: Challenge[];
  language: Language;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  isParentMode?: boolean;
  onToggleChallenge: (challengeId: string) => void;
  onApproveChallenge?: (challengeId: string) => void;
  onRejectChallenge?: (challengeId: string) => void;
  onUpdateChallenges?: (challenges: Challenge[]) => void;
}

interface GoodDeedSuggestion {
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  emoji: string;
  defaultStars: 2 | 3 | 5;
}

const GOOD_DEED_SUGGESTIONS: GoodDeedSuggestion[] = [
  {
    titleVi: 'Chia sẻ đồ chơi với bạn',
    titleEn: 'Share toys with friends',
    descVi: 'Vui vẻ cho bạn hoặc em mượn đồ chơi, cùng chơi hòa đồng.',
    descEn: 'Happily share toys with friends or siblings.',
    emoji: '🧸',
    defaultStars: 3
  },
  {
    titleVi: 'Tự giác lấy quần áo đi tắm',
    titleEn: 'Prepare clothes & take a bath independently',
    descVi: 'Tự chuẩn bị khăn, quần áo sạch và đi tắm không cần nhắc.',
    descEn: 'Prepare clean clothes and take a bath without reminders.',
    emoji: '🛁',
    defaultStars: 2
  },
  {
    titleVi: 'Nhặt được của rơi trả lại',
    titleEn: 'Return lost items to their owner',
    descVi: 'Trung thực nhặt đồ bị rơi và tìm trả lại cho người mất.',
    descEn: 'Honestly return lost belongings to their owner.',
    emoji: '💎',
    defaultStars: 5
  },
  {
    titleVi: 'Giúp người lớn xách đồ nặng',
    titleEn: 'Help adults carry heavy bags',
    descVi: 'Chủ động chạy ra phụ ba mẹ, ông bà xách đồ khi đi chợ về.',
    descEn: 'Proactively help parents or grandparents carry bags.',
    emoji: '🛍️',
    defaultStars: 3
  },
  {
    titleVi: 'Tự giải quyết xung đột không khóc nhè',
    titleEn: 'Resolve conflicts calmly without crying',
    descVi: 'Bình tĩnh nói chuyện, thương lượng lịch sự khi có bất đồng.',
    descEn: 'Calmly communicate and resolve disagreements.',
    emoji: '🤝',
    defaultStars: 5
  },
  {
    titleVi: 'Chủ động hỏi thăm ông bà',
    titleEn: 'Greet and care for grandparents',
    descVi: 'Lễ phép hỏi thăm sức khỏe, rót nước hoặc trò chuyện cùng ông bà.',
    descEn: 'Politely greet, pour water, and chat with grandparents.',
    emoji: '👵',
    defaultStars: 3
  }
];

const STAR_REWARD_OPTIONS: Array<{ stars: 2 | 3 | 5; xp: number; labelVi: string; labelEn: string }> = [
  { stars: 2, xp: 15, labelVi: 'Việc tốt nhỏ', labelEn: 'Good Deed' },
  { stars: 3, xp: 25, labelVi: 'Việc tốt đáng khen', labelEn: 'Great Deed' },
  { stars: 5, xp: 40, labelVi: 'Việc tốt xuất sắc', labelEn: 'Outstanding Deed' }
];

export const ChallengeHub: React.FC<ChallengeHubProps> = ({
  challenges,
  language,
  soundEnabled,
  voiceEnabled,
  isParentMode = false,
  onToggleChallenge,
  onApproveChallenge,
  onRejectChallenge,
  onUpdateChallenges
}) => {
  const [deedTitle, setDeedTitle] = useState<string>('');
  const [selectedStars, setSelectedStars] = useState<2 | 3 | 5>(3);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const getXpForStars = (stars: number): number => {
    if (stars >= 5) return 40;
    if (stars >= 3) return 25;
    return 15;
  };

  // Phần 1: Ghi nhận việc tốt & gửi Chờ duyệt ngay
  const handleRecordGoodDeed = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = deedTitle.trim();
    if (!cleanTitle || !onUpdateChallenges) return;

    playSuccessChime(soundEnabled);
    const nowTime = new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const xpReward = getXpForStars(selectedStars);

    const createdDeed: Challenge = {
      id: `deed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: cleanTitle,
      titleEn: cleanTitle,
      description:
        language === 'vi'
          ? `Việc tốt phát sinh trong ngày (+${selectedStars} ⭐ • +${xpReward} EXP)`
          : `Spontaneous good deed today (+${selectedStars} ⭐ • +${xpReward} EXP)`,
      descriptionEn: `Spontaneous good deed today (+${selectedStars} ⭐ • +${xpReward} EXP)`,
      durationSeconds: 60,
      stars: selectedStars,
      xp: xpReward,
      icon: 'Smile',
      isCompletedToday: false,
      pendingApproval: true,
      requestedAt: nowTime,
      type: 'custom'
    };

    onUpdateChallenges([createdDeed, ...challenges]);
    setDeedTitle('');

    showNotice(
      language === 'vi'
        ? `⏳ Đã ghi nhận "${cleanTitle}" (+${selectedStars} ⭐) vào danh sách chờ Ba Mẹ duyệt!`
        : `⏳ Recorded "${cleanTitle}" (+${selectedStars} ⭐) waiting for parent approval!`
    );

    if (voiceEnabled) {
      speakText(
        language === 'vi'
          ? `Đã ghi nhận việc tốt ${cleanTitle}! Đợi ba mẹ duyệt nhận ${selectedStars} ngôi sao nhé!`
          : `Good deed recorded! Waiting for parent approval for ${selectedStars} stars!`,
        language,
        voiceEnabled
      );
    }
  };

  // Phần 2: Bấm chọn thẻ gợi ý việc tốt hôm nay (Tạo thử thách cho bé hoặc điền nhanh)
  const handleSelectSuggestion = (
    suggestion: GoodDeedSuggestion,
    markPendingImmediately: boolean
  ) => {
    if (!onUpdateChallenges) return;
    playSuccessChime(soundEnabled);

    const nowTime = new Date().toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const xpReward = getXpForStars(suggestion.defaultStars);

    const createdChallenge: Challenge = {
      id: `deed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: suggestion.titleVi,
      titleEn: suggestion.titleEn,
      description: suggestion.descVi,
      descriptionEn: suggestion.descEn,
      durationSeconds: 60,
      stars: suggestion.defaultStars,
      xp: xpReward,
      icon: 'Smile',
      isCompletedToday: false,
      pendingApproval: markPendingImmediately,
      requestedAt: markPendingImmediately ? nowTime : undefined,
      type: 'custom'
    };

    onUpdateChallenges([createdChallenge, ...challenges]);
    showNotice(
      markPendingImmediately
        ? language === 'vi'
          ? `⏳ Đã ghi nhận "${suggestion.titleVi}" (+${suggestion.defaultStars} ⭐) chờ Ba Mẹ duyệt!`
          : `⏳ Recorded "${suggestion.titleEn}" (+${suggestion.defaultStars} ⭐) for approval!`
        : language === 'vi'
        ? `✨ Đã giao thử thách việc tốt "${suggestion.titleVi}" (+${suggestion.defaultStars} ⭐) cho bé!`
        : `✨ Added good deed challenge "${suggestion.titleEn}" (+${suggestion.defaultStars} ⭐)!`
    );
  };

  const handleDeleteChallenge = (challengeId: string) => {
    if (!onUpdateChallenges) return;
    playClick(soundEnabled);
    const target = challenges.find((c) => c.id === challengeId);
    onUpdateChallenges(challenges.filter((c) => c.id !== challengeId));
    showNotice(
      language === 'vi'
        ? `🗑️ Đã xóa "${target?.title || 'việc tốt'}" khỏi danh sách hôm nay.`
        : `🗑️ Removed item from today's list.`
    );
  };

  const pendingCount = challenges.filter((c) => c.pendingApproval && !c.isCompletedToday).length;
  const approvedCount = challenges.filter((c) => c.isCompletedToday).length;

  return (
    <div className="space-y-5">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-extrabold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-xl border border-emerald-300 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMsg}
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="max-w-2xl text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold text-emerald-50 mb-2">
            <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {language === 'vi' ? 'Việc Tốt & Thử Thách Phát Sinh' : 'Good Deeds & Spontaneous Challenges'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display text-white">
            {language === 'vi'
              ? 'Ghi Nhận Việc Tốt Phát Sinh Trong Ngày'
              : 'Record Spontaneous Good Deeds Today'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-50/90 mt-1 leading-relaxed">
            {language === 'vi'
              ? 'Mỗi khi con làm được một hành động đẹp ngoài danh sách nhiệm vụ cố định, ba mẹ hoặc bé hãy ghi lại tại đây để nhận thưởng +2⭐, +3⭐ hoặc +5⭐!'
              : 'Whenever your child does a spontaneous good deed, record it here to reward +2⭐, +3⭐, or +5⭐!'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-center">
            <div className="text-[11px] font-bold text-emerald-100">
              {language === 'vi' ? 'Chờ duyệt' : 'Pending'}
            </div>
            <div className="text-lg font-extrabold font-mono text-amber-300">{pendingCount}</div>
          </div>
          <div className="px-3.5 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-center">
            <div className="text-[11px] font-bold text-emerald-100">
              {language === 'vi' ? 'Đã duyệt hôm nay' : 'Approved Today'}
            </div>
            <div className="text-lg font-extrabold font-mono text-white">{approvedCount}</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout for iPad Landscape */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PHẦN 1: Khung "Ghi nhận việc tốt" (Left 6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border-2 border-emerald-200 dark:border-emerald-800/70 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {language === 'vi' ? 'Phần 1' : 'Part 1'}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">
                  {language === 'vi' ? 'Ghi nhận việc tốt' : 'Record a Good Deed'}
                </h3>
              </div>
            </div>

            <form onSubmit={handleRecordGoodDeed} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'vi'
                    ? 'Tên việc tốt bé vừa làm phát sinh trong ngày:'
                    : 'Good deed performed today:'}
                </label>
                <input
                  type="text"
                  value={deedTitle}
                  onChange={(e) => setDeedTitle(e.target.value)}
                  placeholder={
                    language === 'vi'
                      ? 'VD: Nhường đồ chơi cho em, Giúp bà xách đồ...'
                      : 'e.g., Shared toys with sibling, helped grandma carry bags...'
                  }
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
                  {language === 'vi' ? 'Chọn mức thưởng Sao:' : 'Select Star Reward:'}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {STAR_REWARD_OPTIONS.map((opt) => {
                    const isSelected = selectedStars === opt.stars;
                    return (
                      <button
                        key={opt.stars}
                        type="button"
                        onClick={() => {
                          playClick(soundEnabled);
                          setSelectedStars(opt.stars);
                        }}
                        className={`py-2.5 px-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 shadow-sm scale-[1.02]'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-300'
                        }`}
                      >
                        <span className="text-base sm:text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span>+{opt.stars}</span>
                          <span>⭐</span>
                        </span>
                        <span className="text-[11px] font-bold opacity-85">
                          {language === 'vi' ? opt.labelVi : opt.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={!deedTitle.trim()}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-45 disabled:pointer-events-none active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {language === 'vi'
                    ? `Hoàn thành / Chờ duyệt (+${selectedStars} ⭐)`
                    : `Complete / Submit for Approval (+${selectedStars} ⭐)`}
                </span>
              </button>
            </form>
          </div>

          {/* Danh sách Việc Tốt & Thử Thách Hôm Nay */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>
                  {language === 'vi'
                    ? `Danh Sách Việc Tốt & Thử Thách Hôm Nay (${challenges.length})`
                    : `Today's Recorded Good Deeds (${challenges.length})`}
                </span>
              </h3>
            </div>

            {challenges.length === 0 ? (
              <div className="py-8 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <div className="text-3xl mb-2">🌱</div>
                <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                  {language === 'vi'
                    ? 'Hôm nay chưa có việc tốt phát sinh nào được ghi nhận.'
                    : 'No spontaneous good deeds recorded yet today.'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'vi'
                    ? 'Hãy nhập ở khung trên hoặc bấm chọn một gợi ý bên phải nhé!'
                    : 'Type a good deed above or tap one of the suggestions on the right!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {challenges.map((challenge) => {
                  const isPending = Boolean(challenge.pendingApproval && !challenge.isCompletedToday);

                  return (
                    <div
                      key={challenge.id}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        challenge.isCompletedToday
                          ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800'
                          : isPending
                          ? 'bg-amber-50/90 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700'
                          : 'bg-slate-50/80 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-mono font-extrabold text-xs">
                            <span>+{challenge.stars}</span>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[11px]">
                            +{challenge.xp} EXP
                          </span>
                          {challenge.requestedAt && !challenge.isCompletedToday && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              • {challenge.requestedAt}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          {language === 'vi' ? challenge.title : challenge.titleEn}
                        </h4>
                        {challenge.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                            {language === 'vi' ? challenge.description : challenge.descriptionEn}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {challenge.isCompletedToday ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {language === 'vi'
                                ? `Đã duyệt (+${challenge.stars} ⭐)`
                                : `Approved (+${challenge.stars} ⭐)`}
                            </span>
                          </span>
                        ) : isPending ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 font-extrabold text-xs">
                              <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 animate-spin" />
                              <span>{language === 'vi' ? 'Chờ duyệt' : 'Pending'}</span>
                            </span>

                            {onApproveChallenge && (
                              <button
                                type="button"
                                onClick={() => onApproveChallenge(challenge.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>
                                  {language === 'vi'
                                    ? `Ba mẹ duyệt (+${challenge.stars} ⭐)`
                                    : `Approve (+${challenge.stars} ⭐)`}
                                </span>
                              </button>
                            )}

                            {isParentMode && onRejectChallenge && (
                              <button
                                type="button"
                                onClick={() => onRejectChallenge(challenge.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
                              >
                                {language === 'vi' ? 'Hoàn lại' : 'Reset'}
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              playClick(soundEnabled);
                              onToggleChallenge(challenge.id);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {language === 'vi'
                                ? 'Hoàn thành / Chờ duyệt'
                                : 'Complete / Pending'}
                            </span>
                          </button>
                        )}

                        {onUpdateChallenges && (
                          <button
                            type="button"
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            title={language === 'vi' ? 'Xóa mục này' : 'Delete'}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* PHẦN 2: "Gợi ý việc tốt hôm nay" (Dành cho ba mẹ) (Right 6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border-2 border-indigo-200/80 dark:border-indigo-800/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {language === 'vi' ? 'Phần 2 • Dành cho ba mẹ' : 'Part 2 • For Parents'}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">
                  {language === 'vi'
                    ? 'Gợi ý việc tốt hôm nay'
                    : 'Good Deed Suggestions Today'}
                </h3>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {language === 'vi'
              ? 'Ba mẹ có thể bấm chọn trực tiếp các thẻ gợi ý bên dưới để giao thử thách việc tốt hôm nay cho bé, hoặc bấm "Ghi nhận ngay" khi thấy con vừa thực hiện:'
              : 'Tap any suggestion card below to assign a good deed challenge for your child today, or record it immediately:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOOD_DEED_SUGGESTIONS.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-2xl select-none">{item.emoji}</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-mono font-extrabold text-xs border border-amber-200 dark:border-amber-800">
                      <span>+{item.defaultStars}</span>
                      <span>⭐</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white font-display mb-1">
                    {language === 'vi' ? item.titleVi : item.titleEn}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {language === 'vi' ? item.descVi : item.descEn}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(item, false)}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Giao thử thách' : 'Add Challenge'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(item, true)}
                    className="py-2 px-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Chờ duyệt' : 'Submit'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
