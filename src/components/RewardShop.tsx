import React, { useState } from 'react';
import {
  Gift,
  Tv,
  IceCream,
  Book,
  Pizza,
  FerrisWheel,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Pin,
  Crown,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Reward, Language } from '../types';
import { translations } from '../utils/translations';
import { playClick, playRewardFanfare, speakText } from '../utils/audio';

interface RewardShopProps {
  rewards: Reward[];
  stars: number;
  dailyStarsEarned?: number;
  pinnedRewardId?: string;
  onPinReward?: (rewardId: string) => void;
  language: Language;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  isParentMode: boolean;
  onRequestReward: (rewardId: string) => void;
  onApproveReward: (rewardId: string) => void;
  onRejectReward: (rewardId: string) => void;
  onClaimReward: (rewardId: string) => void;
  onAddCustomReward: (reward: Omit<Reward, 'id' | 'status'>) => void;
}

const REWARD_ICONS: Record<string, React.ElementType> = {
  Tv,
  IceCream,
  Book,
  Pizza,
  FerrisWheel,
  Gift
};

export const RewardShop: React.FC<RewardShopProps> = ({
  rewards,
  stars,
  dailyStarsEarned = 0,
  pinnedRewardId,
  onPinReward,
  language,
  soundEnabled,
  voiceEnabled,
  isParentMode,
  onRequestReward,
  onApproveReward,
  onRejectReward,
  onClaimReward,
  onAddCustomReward
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customTitleEn, setCustomTitleEn] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customCost, setCustomCost] = useState(25);

  const t = translations[language];

  // Resolve Pinned Dream Reward Goal (defaults to first available reward if none pinned yet)
  const pinnedReward =
    rewards.find((r) => r.id === pinnedRewardId) ||
    rewards.find((r) => r.status === 'available' && r.cost >= 30) ||
    rewards[0];

  const pinnedProgressPercent = pinnedReward
    ? Math.min(100, Math.round((stars / Math.max(1, pinnedReward.cost)) * 100))
    : 0;
  const remainingStarsForPinned = pinnedReward
    ? Math.max(0, pinnedReward.cost - stars)
    : 0;

  // Pending / Approved rewards waiting for parents to hand over
  const pendingOrApprovedRewards = rewards.filter(
    (r) => r.status === 'requested' || r.status === 'approved'
  );

  // 3 Categorized Reward Tiers
  const smallRewards = rewards.filter((r) => r.cost <= 19);
  const weeklyRewards = rewards.filter((r) => r.cost >= 20 && r.cost < 100);
  const grandRewards = rewards.filter((r) => r.cost >= 100);

  const handleRedeem = (reward: Reward) => {
    if (stars < reward.cost) {
      playClick(soundEnabled);
      if (voiceEnabled) {
        speakText(
          language === 'vi'
            ? `Bé cần thêm ${reward.cost - stars} ngôi sao nữa để đổi phần thưởng này nhé! Cố gắng lên nào!`
            : `You need ${reward.cost - stars} more stars to redeem this! Keep doing your quests!`,
          language,
          voiceEnabled
        );
      }
      return;
    }

    playRewardFanfare(soundEnabled);
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { y: 0.6 }
    });

    if (voiceEnabled) {
      speakText(
        language === 'vi'
          ? `Hoan hô! Bé đã đổi quà ${reward.title} thành công! Món quà đã vào danh sách Chờ Ba Mẹ Trao Quà!`
          : `Hooray! Reward requested! Added to the Waiting for Parents to Hand Over list!`,
        language,
        voiceEnabled
      );
    }

    onRequestReward(reward.id);
  };

  const handleApprove = (reward: Reward) => {
    playRewardFanfare(soundEnabled);
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.5 }
    });
    onApproveReward(reward.id);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    onAddCustomReward({
      title: customTitle.trim(),
      titleEn: customTitleEn.trim() || customTitle.trim(),
      description: customDesc.trim() || 'Phần thưởng đặc biệt từ Ba Nhân và Mẹ Ty',
      descriptionEn: customDesc.trim() || 'Special reward from parents',
      cost: Math.max(5, Number(customCost) || 25),
      icon: 'Gift'
    });

    setCustomTitle('');
    setCustomTitleEn('');
    setCustomDesc('');
    setCustomCost(25);
    setShowAddModal(false);
    playRewardFanfare(soundEnabled);
  };

  const renderRewardCard = (
    reward: Reward,
    tierTheme: {
      cardBg: string;
      border: string;
      iconBg: string;
      btnGradient: string;
    }
  ) => {
    const IconComp = REWARD_ICONS[reward.icon] || Gift;
    const canAfford = stars >= reward.cost;
    const isPinned = pinnedReward?.id === reward.id;
    const itemProgressPct = Math.min(100, Math.round((stars / Math.max(1, reward.cost)) * 100));

    return (
      <div
        key={reward.id}
        className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
          reward.status === 'requested'
            ? 'bg-amber-50/90 border-amber-400 dark:bg-amber-950/30 dark:border-amber-700 shadow-md'
            : reward.status === 'approved'
            ? 'bg-emerald-50/90 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700 shadow-md'
            : reward.status === 'claimed'
            ? 'bg-slate-100/60 border-slate-200 opacity-65 dark:bg-slate-800/40 dark:border-slate-700'
            : `${tierTheme.cardBg} ${tierTheme.border} hover:shadow-lg`
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${tierTheme.iconBg}`}>
              <IconComp className="w-6 h-6" />
            </div>

            <div className="flex items-center gap-1.5">
              {/* Pin as Dream Goal Button */}
              {onPinReward && (
                <button
                  type="button"
                  onClick={() => {
                    playClick(soundEnabled);
                    onPinReward(reward.id);
                  }}
                  title={
                    language === 'vi'
                      ? 'Ghim làm Mục Tiêu Mơ Ước Của Con'
                      : 'Pin as Dream Reward Goal'
                  }
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 border transition-all cursor-pointer ${
                    isPinned
                      ? 'bg-rose-500 text-white border-rose-400 shadow-2xs'
                      : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:text-rose-600'
                  }`}
                >
                  <Pin className="w-3 h-3" />
                  <span>
                    {isPinned
                      ? language === 'vi'
                        ? 'Đã ghim'
                        : 'Pinned'
                      : language === 'vi'
                      ? 'Ghim mục tiêu'
                      : 'Pin Goal'}
                  </span>
                </button>
              )}

              <div className="flex items-center gap-1 font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums text-base bg-amber-100/80 dark:bg-amber-950/70 px-2.5 py-1 rounded-xl border border-amber-300/60">
                <span>{reward.cost}</span>
                <span>⭐</span>
              </div>
            </div>
          </div>

          <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-1.5 font-display leading-snug">
            {language === 'vi' ? reward.title : reward.titleEn}
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            {language === 'vi' ? reward.description : reward.descriptionEn}
          </p>

          {/* Mini progress toward this reward */}
          {reward.status === 'available' && (
            <div className="mb-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>
                  {canAfford
                    ? language === 'vi'
                      ? '🎉 Đã đủ sao để đổi quà!'
                      : '🎉 Enough stars to redeem!'
                    : language === 'vi'
                    ? `Đã có ${stars}/${reward.cost} ⭐`
                    : `${stars}/${reward.cost} ⭐`}
                </span>
                <span className="font-mono">{itemProgressPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    canAfford ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${itemProgressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status and Action Buttons */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
          {reward.status === 'available' && (
            <button
              onClick={() => handleRedeem(reward)}
              disabled={!canAfford}
              className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                canAfford
                  ? `${tierTheme.btnGradient} text-white shadow-md hover:scale-[1.02] active:scale-[0.98]`
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>
                {canAfford
                  ? language === 'vi'
                    ? `Đổi quà ngay (${reward.cost} ⭐)`
                    : `${t.redeemReward} (${reward.cost} ⭐)`
                  : language === 'vi'
                  ? `Cần thêm ${reward.cost - stars} ⭐ nữa`
                  : `${t.notEnoughStars} (${reward.cost - stars} ⭐)`}
              </span>
            </button>
          )}

          {reward.status === 'requested' && (
            <div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 text-xs font-extrabold mb-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span>
                  {language === 'vi'
                    ? '🎁 Đang chờ Ba Mẹ trao quà!'
                    : t.waitingParentApproval}
                </span>
              </div>

              {isParentMode ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(reward)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    ✓ Duyệt & Trao quà
                  </button>
                  <button
                    onClick={() => onRejectReward(reward.id)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Hoàn sao
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                  {language === 'vi'
                    ? 'Con hãy báo Ba Nhân hoặc Mẹ Ty vào duyệt và trao quà cho con nhé!'
                    : 'Ask Mom or Dad to approve and hand over your reward!'}
                </p>
              )}
            </div>
          )}

          {reward.status === 'approved' && (
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.rewardApproved}</span>
              </div>

              <button
                onClick={() => onClaimReward(reward.id)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow"
              >
                🎉 {language === 'vi' ? 'Con đã nhận quà từ Ba Mẹ!' : t.rewardClaimed}
              </button>
            </div>
          )}

          {reward.status === 'claimed' && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ✓ {t.rewardClaimed}
              </span>
              <button
                type="button"
                onClick={() => handleRedeem(reward)}
                disabled={!canAfford}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40"
              >
                {language === 'vi' ? 'Đổi lại lần nữa' : 'Redeem again'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. MỤC TIÊU MƠ ƯỚC CỦA CON ("PINNED DREAM REWARD GOAL") */}
      {pinnedReward && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border-2 border-amber-300/60">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-300/15 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5">
            <div className="flex-1 space-y-2.5 text-center lg:text-left w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-xs">
                <span>🎯</span>
                <span>
                  {language === 'vi'
                    ? 'MỤC TIÊU MƠ ƯỚC CỦA CON (ĐÃ GHIM)'
                    : 'MY PINNED DREAM REWARD GOAL'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-white">
                {language === 'vi'
                  ? `Đổi "${pinnedReward.title}": Đã có ${stars}/${pinnedReward.cost} ⭐`
                  : `Redeem "${pinnedReward.titleEn}": ${stars}/${pinnedReward.cost} ⭐`}
              </h2>

              <p className="text-xs sm:text-sm text-amber-100 font-semibold">
                {remainingStarsForPinned === 0
                  ? language === 'vi'
                    ? `🎉 Tuyệt vời quá! Con đã tích đủ ${pinnedReward.cost} ⭐ để rinh món quà mơ ước này ngay hôm nay!`
                    : `🎉 Awesome! You have enough stars (${pinnedReward.cost} ⭐) to claim your dream reward right now!`
                  : language === 'vi'
                  ? `💪 Cố lên Hiệp sĩ Cơ Minh, chỉ còn ${remainingStarsForPinned} ⭐ nữa thôi là chạm tới mục tiêu mơ ước rồi!`
                  : `💪 Keep going! Only ${remainingStarsForPinned} ⭐ left to reach your dream reward!`}
              </p>

              {/* Big Visual Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-4 bg-black/35 rounded-full overflow-hidden p-0.5 border border-white/25">
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 via-yellow-300 to-emerald-400 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${pinnedProgressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-200">
                  <span>{language === 'vi' ? `Hiện có: ${stars} ⭐` : `Current: ${stars} ⭐`}</span>
                  <span>{pinnedProgressPercent}%</span>
                  <span>{language === 'vi' ? `Mục tiêu: ${pinnedReward.cost} ⭐` : `Target: ${pinnedReward.cost} ⭐`}</span>
                </div>
              </div>
            </div>

            {/* Quick Redeem Button for Pinned Goal */}
            <div className="shrink-0 flex flex-col items-center gap-2 bg-black/25 backdrop-blur-md p-4 rounded-2xl border border-white/20 min-w-[220px]">
              <div className="text-xs font-bold text-amber-200 flex items-center gap-1">
                <span>🐷</span>
                <span>{language === 'vi' ? 'Kho Sao Tích Lũy Đổi Quà Lớn:' : 'Cumulative Star Vault:'}</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                {stars} ⭐
              </div>
              <div className="text-[11px] font-bold text-emerald-300 font-mono bg-white/10 px-2.5 py-0.5 rounded-full">
                {language === 'vi'
                  ? `+${dailyStarsEarned} ⭐ kiếm được hôm nay (Cộng dồn qua các ngày)`
                  : `+${dailyStarsEarned} ⭐ earned today (Saved across days)`}
              </div>
              {pinnedReward.status === 'available' && (
                <button
                  type="button"
                  onClick={() => handleRedeem(pinnedReward)}
                  disabled={stars < pinnedReward.cost}
                  className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    stars >= pinnedReward.cost
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg animate-bounce'
                      : 'bg-white/15 text-indigo-200 cursor-not-allowed'
                  }`}
                >
                  {stars >= pinnedReward.cost
                    ? language === 'vi'
                      ? '🎁 Đổi mục tiêu mơ ước ngay!'
                      : '🎁 Redeem Dream Goal Now!'
                    : language === 'vi'
                    ? `Còn thiếu ${remainingStarsForPinned} ⭐`
                    : `Need ${remainingStarsForPinned} more ⭐`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. DANH SÁCH "CHỜ BA MẸ TRAO QUÀ" (HIỂN THỊ NỔI BẬT KHI BÉ ĐÃ ĐỔI QUÀ) */}
      {pendingOrApprovedRewards.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/35 border-2 border-amber-400 dark:border-amber-700 rounded-3xl p-5 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white font-display">
                  {language === 'vi'
                    ? `Danh Sách Chờ Ba Mẹ Trao Quà (${pendingOrApprovedRewards.length})`
                    : `Waiting for Parents to Hand Over (${pendingOrApprovedRewards.length})`}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {language === 'vi'
                    ? 'Những món quà con đã dùng Sao đổi thành công, đang chờ Ba Nhân & Mẹ Ty xác nhận trao tận tay!'
                    : 'Rewards you redeemed with Stars, waiting for Mom & Dad to hand over!'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingOrApprovedRewards.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {language === 'vi' ? item.title : item.titleEn}
                  </div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {item.status === 'approved'
                      ? language === 'vi'
                        ? '✓ Ba mẹ đã duyệt — Bấm xác nhận khi con đã nhận quà!'
                        : '✓ Approved by parents — Tap to confirm receipt!'
                      : language === 'vi'
                      ? `⏳ Đang chờ Ba Mẹ trao quà (Đã đổi ${item.cost} ⭐)`
                      : `⏳ Waiting for handover (${item.cost} ⭐)`}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {item.status === 'approved' ? (
                    <button
                      type="button"
                      onClick={() => onClaimReward(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow"
                    >
                      {language === 'vi' ? '🎉 Đã nhận quà' : '🎉 Claimed'}
                    </button>
                  ) : isParentMode ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(item)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow"
                    >
                      ✓ Trao quà
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs">
                      ⏳ Chờ trao
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar (Parent mode or quick add custom reward) */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-display">
            {language === 'vi'
              ? 'Cửa Hàng Đổi Quà 3 Cấp Độ Hấp Dẫn'
              : '3-Tier Family Reward Catalog'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'vi'
              ? 'Bấm nút "📌 Ghim mục tiêu" ở bất kỳ món quà nào con yêu thích nhất để theo dõi tiến độ mỗi ngày!'
              : 'Tap "Pin Goal" on your favorite reward to track your progress at the top!'}
          </p>
        </div>

        <button
          onClick={() => {
            playClick(soundEnabled);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addCustomReward}</span>
        </button>
      </div>

      {/* TIER 1: QUÀ NHỎ VUI VẺ (5 - 15 ⭐) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-sky-500/15 to-cyan-500/10 dark:from-sky-950/50 dark:to-cyan-950/30 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎈</span>
            <div>
              <h4 className="text-base sm:text-lg font-extrabold text-sky-900 dark:text-sky-200 font-display">
                {language === 'vi'
                  ? 'Nhóm 1: Quà Nhỏ Vui Vẻ (5 – 15 ⭐)'
                  : 'Tier 1: Fun Daily Treats (5 – 15 ⭐)'}
              </h4>
              <p className="text-xs text-sky-700 dark:text-sky-300">
                {language === 'vi'
                  ? 'Dễ dàng đổi ngay sau 1 – 2 ngày chăm chỉ làm nhiệm vụ!'
                  : 'Quick and fun treats you can unlock in just 1–2 days!'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-sky-500 text-white font-black text-xs font-mono">
            5 – 15 ⭐
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {smallRewards.map((reward) =>
            renderRewardCard(reward, {
              cardBg: 'bg-white dark:bg-slate-800',
              border: 'border-sky-200 dark:border-sky-800/60',
              iconBg: 'bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-300',
              btnGradient: 'bg-gradient-to-r from-sky-500 to-cyan-500'
            })
          )}
        </div>
      </div>

      {/* TIER 2: QUÀ TUẦN XỨNG ĐÁNG (20 - 50 ⭐) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-amber-500/15 to-orange-500/10 dark:from-amber-950/50 dark:to-orange-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌟</span>
            <div>
              <h4 className="text-base sm:text-lg font-extrabold text-amber-900 dark:text-amber-200 font-display">
                {language === 'vi'
                  ? 'Nhóm 2: Quà Tuần Xứng Đáng (20 – 50 ⭐)'
                  : 'Tier 2: Worthy Weekly Rewards (20 – 50 ⭐)'}
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {language === 'vi'
                  ? 'Đi nhà sách, mua truyện tranh, đi công viên cuối tuần cùng Ba Nhân và Mẹ Ty!'
                  : 'Bookstore visits, comics, and weekend park outings with Mom & Dad!'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs font-mono">
            20 – 50 ⭐
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {weeklyRewards.map((reward) =>
            renderRewardCard(reward, {
              cardBg: 'bg-white dark:bg-slate-800',
              border: 'border-amber-200 dark:border-amber-800/60',
              iconBg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300',
              btnGradient: 'bg-gradient-to-r from-amber-500 to-orange-500'
            })
          )}
        </div>
      </div>

      {/* TIER 3: QUÀ LỚN SIÊU CẤP (100+ ⭐) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-purple-500/15 via-fuchsia-500/15 to-rose-500/10 dark:from-purple-950/50 dark:to-rose-950/30 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">👑</span>
            <div>
              <h4 className="text-base sm:text-lg font-extrabold text-purple-900 dark:text-purple-200 font-display flex items-center gap-1.5">
                <span>
                  {language === 'vi'
                    ? 'Nhóm 3: Quà Lớn Siêu Cấp (100+ ⭐)'
                    : 'Tier 3: Super Grand Rewards (100+ ⭐)'}
                </span>
                <Crown className="w-4 h-4 text-amber-500" />
              </h4>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                {language === 'vi'
                  ? 'Đồ chơi mơ ước, bộ Lego lớn hoặc chuyến đi chơi xa cho chuỗi ngày kiên trì tuyệt đỉnh!'
                  : 'Dream Lego sets, special toys, and big family adventure trips!'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs font-mono">
            100+ ⭐
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grandRewards.map((reward) =>
            renderRewardCard(reward, {
              cardBg: 'bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-slate-800 dark:to-purple-950/20',
              border: 'border-purple-300 dark:border-purple-800/70',
              iconBg: 'bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-300',
              btnGradient: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600'
            })
          )}
        </div>
      </div>

      {/* Add Custom Reward Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>{t.addCustomReward}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên phần thưởng (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đi bơi cùng ba, Mua truyện Doraemon..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên phần thưởng (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Go swimming with dad, Bake cupcakes..."
                  value={customTitleEn}
                  onChange={(e) => setCustomTitleEn(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={2}
                  placeholder="Chi tiết cách thức thực hiện phần thưởng..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số sao cần đổi (5–15 ⭐ Quà nhỏ • 20–50 ⭐ Quà tuần • 100+ ⭐ Quà lớn)
                </label>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  value={customCost}
                  onChange={(e) => setCustomCost(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold text-sm hover:bg-slate-100"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md"
                >
                  Thêm quà
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

