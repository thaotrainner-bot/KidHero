import React, { useEffect, useRef, useState } from 'react';
import {
  Star,
  Volume2,
  VolumeX,
  Lock,
  Sparkles,
  RefreshCw,
  CheckSquare,
  Zap,
  Gift,
  HeartHandshake
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { playClick } from '../utils/audio';

export type KidOrParentTab = 'quests' | 'challenges' | 'discipline' | 'rewards' | 'parent';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  soundEnabled: boolean;
  activeTab: KidOrParentTab;
  onSelectTab: (tab: KidOrParentTab) => void;
  isParentMode: boolean;
  onOpenParentGate: () => void;
  onOpenSync: () => void;
  stars: number;
  unforgivenPenaltyCount?: number;
}

const SPARKLE_PARTICLES = [
  { id: 1, x: -34, y: -28, size: 'w-4 h-4', delay: '0ms', color: 'text-amber-300' },
  { id: 2, x: -16, y: -38, size: 'w-5 h-5', delay: '60ms', color: 'text-yellow-300' },
  { id: 3, x: 10, y: -36, size: 'w-4 h-4', delay: '120ms', color: 'text-amber-400' },
  { id: 4, x: 34, y: -24, size: 'w-5 h-5', delay: '40ms', color: 'text-yellow-200' },
  { id: 5, x: -38, y: 12, size: 'w-3.5 h-3.5', delay: '90ms', color: 'text-orange-300' },
  { id: 6, x: -14, y: 34, size: 'w-4 h-4', delay: '150ms', color: 'text-amber-300' },
  { id: 7, x: 18, y: 36, size: 'w-5 h-5', delay: '80ms', color: 'text-yellow-400' },
  { id: 8, x: 38, y: 16, size: 'w-3.5 h-3.5', delay: '110ms', color: 'text-amber-200' },
  { id: 9, x: 0, y: -44, size: 'w-4 h-4', delay: '30ms', color: 'text-white' },
  { id: 10, x: 26, y: 28, size: 'w-4 h-4', delay: '140ms', color: 'text-orange-400' }
];

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  voiceEnabled,
  onToggleVoice,
  soundEnabled,
  activeTab,
  onSelectTab,
  isParentMode,
  onOpenParentGate,
  onOpenSync,
  stars,
  unforgivenPenaltyCount = 0
}) => {
  const t = translations[language];
  const prevStarsRef = useRef<number>(stars);
  const [starDelta, setStarDelta] = useState<number | null>(null);
  const [isSparkling, setIsSparkling] = useState(false);

  useEffect(() => {
    if (prevStarsRef.current !== stars) {
      const diff = stars - prevStarsRef.current;
      prevStarsRef.current = stars;
      if (diff !== 0) {
        setStarDelta(diff);
        if (diff > 0) {
          setIsSparkling(true);
        }
        const timer = setTimeout(() => {
          setStarDelta(null);
          setIsSparkling(false);
        }, 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [stars]);

  const handleNavClick = (tab: KidOrParentTab) => {
    playClick(soundEnabled);
    if (tab === 'parent') {
      onOpenParentGate();
    } else {
      onSelectTab(tab);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 h-13 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-full flex items-center justify-between gap-2">
        {/* Brand Identity */}
        <div
          onClick={() => handleNavClick('quests')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent block">
              {t.appTitle}
            </span>
          </div>
        </div>

        {/* Primary Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => handleNavClick('quests')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'quests' && !isParentMode
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>{t.navDailyQuests}</span>
          </button>

          <button
            onClick={() => handleNavClick('challenges')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'challenges' && !isParentMode
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{t.navChallenges}</span>
          </button>

          <button
            onClick={() => handleNavClick('discipline')}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'discipline' && !isParentMode
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-rose-600'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>{t.disciplineTab}</span>
            {unforgivenPenaltyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {unforgivenPenaltyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleNavClick('rewards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'rewards' && !isParentMode
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>{t.navRewards}</span>
          </button>

          <button
            onClick={() => handleNavClick('parent')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              isParentMode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{t.navParentMode}</span>
          </button>
        </nav>

        {/* Right Controls: Star Vault Display, Voice Toggle, Sync & Language */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Star Vault Counter with Falling Star Sparkle Animation */}
          <div className="relative flex items-center gap-1.5 sm:gap-2">
            <div
              className={`relative flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 border-2 px-3 py-1.5 rounded-2xl shadow-sm transition-all duration-300 ${
                isSparkling
                  ? 'border-amber-400 scale-110 ring-4 ring-yellow-300/60 shadow-lg shadow-amber-300/50'
                  : starDelta !== null
                  ? 'border-amber-400 scale-105 ring-2 ring-amber-300/50'
                  : 'border-amber-200 dark:border-amber-700/70'
              }`}
              title={
                language === 'vi'
                  ? 'Kho Xu / Sao Tích Lũy của bé (dùng đổi quà & nuôi linh thú)'
                  : 'Cumulative Star Vault'
              }
            >
              {/* Falling & Bursting Sparkle Stars Animation when receiving new rewards */}
              {isSparkling && (
                <div className="pointer-events-none absolute inset-0 overflow-visible z-30">
                  {SPARKLE_PARTICLES.map((p) => (
                    <span
                      key={p.id}
                      style={{
                        transform: `translate(${p.x}px, ${p.y}px)`,
                        animationDelay: p.delay
                      }}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                    >
                      <Star
                        className={`${p.size} ${p.color} fill-current drop-shadow-[0_0_8px_rgba(251,191,36,0.95)] animate-ping`}
                      />
                    </span>
                  ))}
                  {/* Falling golden stars effect around the star counter */}
                  <span className="absolute -top-6 left-1 animate-bounce text-yellow-400 drop-shadow-[0_2px_6px_rgba(245,158,11,0.9)]">
                    <Sparkles className="w-4 h-4 fill-yellow-300" />
                  </span>
                  <span
                    className="absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,1)]"
                    style={{ animationDelay: '100ms' }}
                  >
                    <Star className="w-5 h-5 fill-yellow-300" />
                  </span>
                  <span
                    className="absolute -top-5 right-1 animate-bounce text-yellow-300 drop-shadow-[0_2px_6px_rgba(251,191,36,0.9)]"
                    style={{ animationDelay: '200ms' }}
                  >
                    <Sparkles className="w-4 h-4 fill-amber-200" />
                  </span>
                  <span
                    className="absolute -bottom-5 left-2 animate-bounce text-amber-400 drop-shadow-[0_2px_6px_rgba(245,158,11,0.85)]"
                    style={{ animationDelay: '150ms' }}
                  >
                    <Star className="w-3.5 h-3.5 fill-yellow-300" />
                  </span>
                  <span
                    className="absolute -bottom-5 right-2 animate-bounce text-yellow-400 drop-shadow-[0_2px_6px_rgba(245,158,11,0.85)]"
                    style={{ animationDelay: '250ms' }}
                  >
                    <Sparkles className="w-4 h-4 fill-yellow-200" />
                  </span>
                </div>
              )}

              <Star
                className={`w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-400 transition-transform ${
                  isSparkling ? 'animate-spin scale-125' : ''
                }`}
              />
              <span
                className={`font-extrabold text-amber-900 dark:text-amber-200 font-mono text-sm sm:text-base tabular-nums transition-transform ${
                  isSparkling ? 'text-amber-600 scale-105' : ''
                }`}
              >
                {stars}
              </span>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hidden xl:inline">
                {language === 'vi' ? 'Xu Tích Lũy' : 'Vault'}
              </span>
            </div>

            {starDelta !== null && (
              <span
                className={`pointer-events-none absolute -bottom-6 left-3 px-2 py-0.5 rounded-full text-[11px] font-black shadow-md animate-bounce whitespace-nowrap z-20 ${
                  starDelta > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {starDelta > 0 ? `+${starDelta} ⭐` : `${starDelta} ⭐`}
              </span>
            )}
          </div>

          {/* Voice Guidance Toggle */}
          <button
            onClick={() => {
              playClick(soundEnabled);
              onToggleVoice();
            }}
            title={t.speechEnabled}
            className={`p-2 rounded-xl border transition-all ${
              voiceEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Family Sync Button */}
          <button
            onClick={() => {
              playClick(soundEnabled);
              onOpenSync();
            }}
            title={t.navSync}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t.navSync}</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => {
              playClick(soundEnabled);
              onLanguageChange(language === 'vi' ? 'en' : 'vi');
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors uppercase"
          >
            {language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
          </button>
        </div>
      </div>
    </header>
  );
};
