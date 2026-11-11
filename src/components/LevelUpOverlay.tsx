import React, { useEffect } from 'react';
import { Crown, Sparkles, Star, Trophy, Volume2, X, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Language } from '../types';
import { playClick, playLevelUp, speakText } from '../utils/audio';

export interface LevelUpCelebrationData {
  previousLevel: number;
  newLevel: number;
  childName: string;
  childAvatar: string;
  currentXp: number;
  maxXp: number;
  petName: string;
  petAvatar: string;
}

interface LevelUpOverlayProps {
  celebration: LevelUpCelebrationData | null;
  language: Language;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  onClose: () => void;
}

function getHeroRankTitle(level: number, language: Language): string {
  if (level >= 15) {
    return language === 'vi' ? 'Huyền Thoại Tự Lập Vũ Trụ' : 'Cosmic Independence Legend';
  }
  if (level >= 10) {
    return language === 'vi' ? 'Siêu Anh Hùng KidHero' : 'Grand KidHero Champion';
  }
  if (level >= 7) {
    return language === 'vi' ? 'Thủ Lĩnh Ngôi Sao Vàng' : 'Golden Star Commander';
  }
  if (level >= 4) {
    return language === 'vi' ? 'Hiệp Sĩ Tự Giác Xuất Sắc' : 'Shining Habit Knight';
  }
  return language === 'vi' ? 'Chiến Binh Tự Lập Nhí' : 'Junior Habit Hero';
}

export const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({
  celebration,
  language,
  soundEnabled,
  voiceEnabled,
  onClose
}) => {
  useEffect(() => {
    if (!celebration) return;

    // Play celebratory Web Audio API Level Up fanfare
    playLevelUp(soundEnabled);

    // Multi-stage celebratory fireworks
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#fbbf24', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#38bdf8'],
      zIndex: 10000
    });

    const leftRightTimer = setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 60,
        spread: 65,
        origin: { x: 0.1, y: 0.65 },
        colors: ['#fde047', '#f59e0b', '#ec4899', '#8b5cf6'],
        zIndex: 10000
      });
      confetti({
        particleCount: 65,
        angle: 120,
        spread: 65,
        origin: { x: 0.9, y: 0.65 },
        colors: ['#34d399', '#38bdf8', '#fbbf24', '#6366f1'],
        zIndex: 10000
      });
    }, 220);

    if (voiceEnabled) {
      const rankTitle = getHeroRankTitle(celebration.newLevel, language);
      const speech =
        language === 'vi'
          ? `Chúc mừng siêu anh hùng ${celebration.childName} đã thăng cấp lên Cấp độ ${celebration.newLevel}, danh hiệu ${rankTitle}! ${celebration.petName} rất tự hào về bé!`
          : `Congratulations ${celebration.childName}! You leveled up to Level ${celebration.newLevel}, ${rankTitle}!`;
      speakText(speech, language, true);
    }

    return () => clearTimeout(leftRightTimer);
  }, [celebration, language, soundEnabled, voiceEnabled]);

  if (!celebration) return null;

  const rankTitle = getHeroRankTitle(celebration.newLevel, language);
  const xpProgressPercent = Math.min(
    100,
    Math.round((celebration.currentXp / Math.max(1, celebration.maxXp)) * 100)
  );

  const handleReplayFanfare = () => {
    playLevelUp(soundEnabled);
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#fbbf24', '#f59e0b', '#10b981', '#ec4899', '#38bdf8'],
      zIndex: 10000
    });
    if (voiceEnabled) {
      speakText(
        language === 'vi'
          ? `Hoan hô ${celebration.childName}! Cấp độ ${celebration.newLevel}: ${rankTitle}!`
          : `Hooray ${celebration.childName}! Level ${celebration.newLevel}: ${rankTitle}!`,
        language,
        true
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={language === 'vi' ? 'Chúc mừng thăng cấp mới' : 'Level Up Celebration'}
    >
      {/* Ambient Radial Glow & Floating Sparkles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden flex items-center justify-center">
        <div className="w-[460px] h-[460px] rounded-full bg-gradient-to-tr from-amber-400/30 via-fuchsia-500/20 to-indigo-500/30 blur-3xl animate-pulse" />
      </div>

      {/* Main Celebration Modal Card */}
      <div className="relative z-10 max-w-md w-full bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border-2 border-amber-300/80 shadow-2xl shadow-amber-500/20 text-center space-y-5 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playClick(soundEnabled);
            onClose();
          }}
          title={language === 'vi' ? 'Đóng' : 'Close'}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-indigo-100 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Pill */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-950" />
          <span>{language === 'vi' ? 'Chúc Mừng Thăng Cấp Mới!' : 'Level Up Unlocked!'}</span>
        </div>

        {/* Centerpiece: Animated New Level Badge */}
        <div className="relative flex flex-col items-center justify-center py-2">
          {/* Glowing Halo Ring behind Badge */}
          <div className="absolute w-36 h-36 rounded-full bg-amber-400/25 blur-xl animate-pulse pointer-events-none" />

          {/* Floating Crown */}
          <div
            className="relative z-20 -mb-3 w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white animate-bounce"
            style={{ animationDuration: '1.8s' }}
          >
            <Crown className="w-6 h-6 fill-amber-900 text-amber-950" />
          </div>

          {/* Shield / Hexagonal Level Badge */}
          <div className="relative z-10 w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 p-1.5 shadow-2xl border-3 border-white transform hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-2xl bg-gradient-to-b from-indigo-900 to-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-10 bg-white/10 rounded-t-2xl pointer-events-none" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                LEVEL
              </span>
              <span className="text-4xl sm:text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-400 leading-none mt-0.5 font-mono tabular-nums">
                {celebration.newLevel}
              </span>
              <div className="flex items-center gap-0.5 mt-1 text-amber-300">
                <Star className="w-3 h-3 fill-amber-300" />
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                <Star className="w-3 h-3 fill-amber-300" />
              </div>
            </div>
          </div>

          {/* Child & Mascot Mini Avatars flanking the Badge */}
          <div className="flex items-center justify-center gap-3 -mt-3 relative z-20">
            <div className="flex items-center gap-1.5 bg-slate-900/95 border border-amber-300/60 px-2.5 py-1 rounded-full shadow-md">
              <img
                src={celebration.childAvatar}
                alt={celebration.childName}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover border border-amber-300"
              />
              <span className="text-xs font-extrabold text-white">{celebration.childName}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-indigo-900/95 border border-amber-300/60 px-2.5 py-1 rounded-full shadow-md">
              <span className="text-xs font-mono font-bold text-indigo-200">
                Lv.{celebration.previousLevel}
              </span>
              <span className="text-amber-300 font-black">→</span>
              <span className="text-xs font-mono font-black text-amber-300">
                Lv.{celebration.newLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Title & Rank Description */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black font-display text-white">
            {language === 'vi'
              ? `Tuyệt Đỉnh, ${celebration.childName}!`
              : `Awesome Job, ${celebration.childName}!`}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-amber-300/30 text-amber-300 text-xs sm:text-sm font-extrabold">
            <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{rankTitle}</span>
          </div>
          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed pt-1">
            {language === 'vi'
              ? `Điểm kinh nghiệm (XP) của bé đã vượt mốc cấp độ cũ! Linh vật ${celebration.petName} đang nhảy múa ăn mừng cùng bé!`
              : `Your XP exceeded the level threshold! ${celebration.petName} is cheering for your new badge!`}
          </p>
        </div>

        {/* New Level XP Progress Bar */}
        <div className="bg-black/30 rounded-2xl p-3.5 border border-white/10 space-y-1.5 text-left">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1 text-amber-300">
              <Zap className="w-3.5 h-3.5 fill-amber-300" />
              <span>
                {language === 'vi'
                  ? `Tiến độ Cấp ${celebration.newLevel} mới:`
                  : `New Level ${celebration.newLevel} XP:`}
              </span>
            </span>
            <span className="font-mono text-indigo-100">
              {celebration.currentXp} / {celebration.maxXp} XP ({xpProgressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(8, xpProgressPercent)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleReplayFanfare}
            title={language === 'vi' ? 'Phát lại nhạc chúc mừng & pháo hoa' : 'Replay fanfare & confetti'}
            className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-amber-200 font-bold text-xs border border-white/15 transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Volume2 className="w-4 h-4" />
            <span>{language === 'vi' ? 'Nghe lại nhạc' : 'Replay Sound'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playClick(soundEnabled);
              onClose();
            }}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-950" />
            <span>
              {language === 'vi'
                ? `Nhận Huy Hiệu Lv.${celebration.newLevel}!`
                : `Claim Lv.${celebration.newLevel} Badge!`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
