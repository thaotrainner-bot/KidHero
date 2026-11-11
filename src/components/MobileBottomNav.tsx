import React from 'react';
import { CheckSquare, Zap, Gift, Shield, Scale } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { playClick } from '../utils/audio';
import { KidOrParentTab } from './Header';

interface MobileBottomNavProps {
  activeTab: KidOrParentTab;
  onSelectTab: (tab: KidOrParentTab) => void;
  language: Language;
  soundEnabled: boolean;
  isParentMode: boolean;
  onOpenParentGate: () => void;
  pendingRewardCount: number;
  unforgivenPenaltyCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  language,
  soundEnabled,
  isParentMode,
  onOpenParentGate,
  pendingRewardCount,
  unforgivenPenaltyCount = 0
}) => {
  const t = translations[language];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="max-w-5xl mx-auto grid grid-cols-5 items-center h-15 md:h-12 px-1.5 sm:px-3 gap-1">
        {/* Tab 1: Daily Quests */}
        <button
          onClick={() => {
            playClick(soundEnabled);
            onSelectTab('quests');
          }}
          className={`flex flex-col md:flex-row items-center justify-center md:gap-2 min-h-[42px] py-1 px-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'quests' && !isParentMode
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50/80 dark:bg-indigo-950/50'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 font-bold'
          }`}
        >
          <CheckSquare className="w-4 h-4 md:w-4 md:h-4 mb-0.5 md:mb-0 stroke-[2.25]" />
          <span className="text-[11px] md:text-xs leading-tight tracking-normal truncate">
            {t.navDailyQuests}
          </span>
        </button>

        {/* Tab 2: Challenges */}
        <button
          onClick={() => {
            playClick(soundEnabled);
            onSelectTab('challenges');
          }}
          className={`flex flex-col md:flex-row items-center justify-center md:gap-2 min-h-[42px] py-1 px-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'challenges' && !isParentMode
              ? 'text-amber-600 dark:text-amber-400 font-extrabold bg-amber-50/80 dark:bg-amber-950/50'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 font-bold'
          }`}
        >
          <Zap className="w-4 h-4 md:w-4 md:h-4 mb-0.5 md:mb-0 stroke-[2.25]" />
          <span className="text-[11px] md:text-xs leading-tight tracking-normal truncate">
            {t.navChallenges}
          </span>
        </button>

        {/* Tab 3: Discipline (Kỷ Luật) */}
        <button
          onClick={() => {
            playClick(soundEnabled);
            onSelectTab('discipline');
          }}
          className={`relative flex flex-col md:flex-row items-center justify-center md:gap-2 min-h-[42px] py-1 px-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'discipline' && !isParentMode
              ? 'text-rose-600 dark:text-rose-400 font-extrabold bg-rose-50/80 dark:bg-rose-950/50'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 font-bold'
          }`}
        >
          <Scale className="w-4 h-4 md:w-4 md:h-4 mb-0.5 md:mb-0 stroke-[2.25]" />
          <span className="text-[11px] md:text-xs leading-tight tracking-normal truncate">
            {language === 'vi' ? 'Kỷ Luật' : 'Rules'}
          </span>
          {unforgivenPenaltyCount > 0 && (
            <span className="absolute top-0.5 right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {unforgivenPenaltyCount}
            </span>
          )}
        </button>

        {/* Tab 4: Rewards */}
        <button
          onClick={() => {
            playClick(soundEnabled);
            onSelectTab('rewards');
          }}
          className={`relative flex flex-col md:flex-row items-center justify-center md:gap-2 min-h-[42px] py-1 px-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'rewards' && !isParentMode
              ? 'text-rose-600 dark:text-rose-400 font-extrabold bg-rose-50/80 dark:bg-rose-950/50'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 font-bold'
          }`}
        >
          <Gift className="w-4 h-4 md:w-4 md:h-4 mb-0.5 md:mb-0 stroke-[2.25]" />
          <span className="text-[11px] md:text-xs leading-tight tracking-normal truncate">
            {t.navRewards}
          </span>
          {pendingRewardCount > 0 && (
            <span className="absolute top-1 right-3 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Tab 5: Parent Mode */}
        <button
          onClick={() => {
            playClick(soundEnabled);
            onOpenParentGate();
          }}
          className={`flex flex-col md:flex-row items-center justify-center md:gap-2 min-h-[42px] py-1 px-1 rounded-xl transition-colors cursor-pointer ${
            isParentMode
              ? 'text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-50/80 dark:bg-indigo-950/50'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 font-bold'
          }`}
        >
          <Shield className="w-4 h-4 md:w-4 md:h-4 mb-0.5 md:mb-0 stroke-[2.25]" />
          <span className="text-[11px] md:text-xs leading-tight tracking-normal truncate">
            {isParentMode ? 'Phụ Huynh' : t.navParentMode}
          </span>
        </button>
      </div>
    </nav>
  );
};
