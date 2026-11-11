import React from 'react';
import { X, Award, Sun, Flame, BookOpen, Heart, Star, Lock, CheckCircle2 } from 'lucide-react';
import { Badge, Language } from '../types';
import { translations } from '../utils/translations';
import { playClick } from '../utils/audio';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  badges: Badge[];
  language: Language;
  soundEnabled: boolean;
}

const BADGE_ICONS: Record<string, React.ElementType> = {
  Sun,
  Flame,
  BookOpen,
  Heart,
  Star
};

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  badges,
  language,
  soundEnabled
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
              {language === 'vi' ? 'Bộ Sưu Tập Huy Hiệu Siêu Cấp' : 'Superhero Badge Collection'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'vi'
                ? `Bé đã mở khóa được ${unlockedCount}/${badges.length} huy hiệu danh giá!`
                : `Unlocked ${unlockedCount}/${badges.length} prestigious badges!`}
            </p>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5 max-h-[60vh] overflow-y-auto pr-1">
          {badges.map((badge) => {
            const IconComp = BADGE_ICONS[badge.icon] || Star;
            const progress = Math.min(100, Math.round((badge.currentCount / badge.requiredCount) * 100));

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  badge.unlocked
                    ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/60 shadow-sm'
                    : 'bg-slate-50/70 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/60 opacity-70'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    badge.unlocked
                      ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 shadow-md shadow-amber-500/25'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {badge.unlocked ? <IconComp className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {language === 'vi' ? badge.title : badge.titleEn}
                    </h4>
                    {badge.unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
                    {language === 'vi' ? badge.description : badge.descriptionEn}
                  </p>

                  {!badge.unlocked && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                        <span>{language === 'vi' ? 'Tiến trình' : 'Progress'}</span>
                        <span className="font-mono">{badge.currentCount} / {badge.requiredCount}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {badge.unlocked && badge.unlockedAt && (
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                      ✓ {language === 'vi' ? 'Đã đạt' : 'Achieved'}: {badge.unlockedAt}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
