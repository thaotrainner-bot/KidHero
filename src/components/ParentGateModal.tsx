import React, { useState, useEffect } from 'react';
import { Lock, Delete, X, ShieldAlert, KeyRound } from 'lucide-react';
import { Language, ParentSettings } from '../types';
import { translations } from '../utils/translations';
import { playClick, playSuccessChime } from '../utils/audio';

interface ParentGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  settings: ParentSettings;
  language: Language;
  soundEnabled: boolean;
}

export const ParentGateModal: React.FC<ParentGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  settings,
  language,
  soundEnabled
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [gateMode, setGateMode] = useState<'pin' | 'math'>(settings.parentalGateType || 'pin');

  // Random math question
  const [mathProblem, setMathProblem] = useState({ q: '14 x 4', a: 56 });
  const [mathAnswer, setMathAnswer] = useState('');

  const t = translations[language];

  useEffect(() => {
    if (isOpen) {
      setEnteredPin('');
      setErrorMsg('');
      setMathAnswer('');
      // Generate new math problem for adults
      const n1 = Math.floor(Math.random() * 20) + 12;
      const n2 = Math.floor(Math.random() * 7) + 3;
      setMathProblem({ q: `${n1} x ${n2}`, a: n1 * n2 });
    }
  }, [isOpen]);

  const targetPinLength = Math.max(4, (settings.pin || '1234').length);
  const [showDigits, setShowDigits] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    playClick(soundEnabled);
    if (enteredPin.length < targetPinLength) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === targetPinLength) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    playClick(soundEnabled);
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = (pin: string) => {
    if (pin === (settings.pin || '1234')) {
      playSuccessChime(soundEnabled);
      onSuccess();
    } else {
      setErrorMsg(t.wrongPin);
      setEnteredPin('');
    }
  };

  const handleVerifyMath = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(mathAnswer.trim(), 10) === mathProblem.a) {
      playSuccessChime(soundEnabled);
      onSuccess();
    } else {
      setErrorMsg(t.wrongMath);
      setMathAnswer('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-sm">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-display mb-1">
          {t.parentGateTitle}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
          {t.parentGateHint}
        </p>

        {/* Toggle between PIN and Math */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <button
            onClick={() => {
              playClick(soundEnabled);
              setGateMode('pin');
              setErrorMsg('');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              gateMode === 'pin'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {language === 'vi' ? `Mật khẩu (${targetPinLength} số)` : `PIN (${targetPinLength} digits)`}
          </button>
          <button
            onClick={() => {
              playClick(soundEnabled);
              setGateMode('math');
              setErrorMsg('');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              gateMode === 'math'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Giải phép tính
          </button>
        </div>

        {gateMode === 'pin' ? (
          <div>
            {/* PIN Dots or Digits */}
            <div className="flex justify-center items-center gap-2.5 mb-3">
              {Array.from({ length: targetPinLength }, (_, idx) => (
                <div
                  key={idx}
                  className={`${
                    showDigits ? 'w-8 h-9 rounded-xl text-sm font-mono font-black flex items-center justify-center' : 'w-4 h-4 rounded-full'
                  } transition-all ${
                    idx < enteredPin.length
                      ? showDigits
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-600 scale-110 shadow-sm'
                      : 'border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {showDigits ? enteredPin[idx] || '•' : null}
                </div>
              ))}
            </div>

            <div className="mb-3">
              <button
                type="button"
                onClick={() => setShowDigits((prev) => !prev)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {showDigits
                  ? language === 'vi'
                    ? '🙈 Ẩn số đang nhập'
                    : '🙈 Hide digits'
                  : language === 'vi'
                  ? '👁️ Hiện số đang nhập'
                  : '👁️ Show digits'}
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs font-bold text-rose-500 mb-3 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="text-[11px] text-slate-400 mb-4">
              {settings.pin === '1234'
                ? t.defaultPinHint
                : language === 'vi'
                ? `Nhập mật khẩu ${targetPinLength} chữ số của Phụ huynh (có thể đổi trong Cài đặt Phụ huynh)`
                : `Enter your ${targetPinLength}-digit Parent PIN`}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit)}
                  className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-lg font-bold text-slate-800 dark:text-slate-100 active:scale-95 transition-transform"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleKeyPress('0')}
                className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-lg font-bold text-slate-800 dark:text-slate-100 active:scale-95 transition-transform"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifyMath} className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <div className="text-xs text-slate-500 mb-1">Hãy tính kết quả:</div>
              <div className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {mathProblem.q} = ?
              </div>
            </div>

            <input
              type="number"
              required
              autoFocus
              placeholder="Nhập kết quả..."
              value={mathAnswer}
              onChange={(e) => setMathAnswer(e.target.value)}
              className="w-full text-center px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {errorMsg && (
              <div className="text-xs font-bold text-rose-500 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
            >
              {t.unlock}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
