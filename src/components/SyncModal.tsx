import React, { useEffect, useState } from 'react';
import {
  X,
  Wifi,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  Laptop,
  Share2,
  ArrowRight,
  Download,
  CheckCircle2,
  Sparkles,
  QrCode,
  ShieldCheck,
  Database,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { AppState, Language } from '../types';
import { translations } from '../utils/translations';
import { playClick, playSuccessChime } from '../utils/audio';
import { generateFamilyCode, isLegacyDefaultFamilyCode } from '../utils/defaults';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyCode: string;
  appState?: AppState;
  onJoinFamily: (code: string) => Promise<boolean>;
  onForceSync: () => Promise<void>;
  onForcePush?: () => Promise<boolean>;
  onForcePull?: () => Promise<boolean>;
  onApplySyncedState?: (newState: AppState) => void;
  language: Language;
  soundEnabled: boolean;
  isOnline: boolean;
  onFirebaseConfigUpdated?: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  familyCode,
  appState,
  onJoinFamily,
  onForceSync,
  onForcePush,
  onForcePull,
  language,
  soundEnabled,
  isOnline
}) => {
  const t = translations[language];
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showQrPanel, setShowQrPanel] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const activeFamilyCode = appState?.familyCode || familyCode || '';
  const currentStars = appState?.profile?.stars ?? 85;
  const dailyStars = appState?.profile?.dailyStarsEarned ?? 0;
  const currentLevel = appState?.profile?.level ?? 10;
  const completedTasksCount = appState?.tasks
    ? appState.tasks.filter((task) => task.isCompleted).length
    : 0;
  const totalTasksCount = appState?.tasks?.length ?? 17;

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?family=${encodeURIComponent(activeFamilyCode)}`
      : '';

  const qrCodeImageUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&color=1e1b4b&bgcolor=ffffff&data=${encodeURIComponent(shareUrl)}`
    : '';

  const getRelativeSyncTime = () => {
    const lastTs = appState?.lastSyncTimestamp;
    if (!lastTs) {
      return language === 'vi' ? 'Vừa đồng bộ tức thì' : 'Synced just now';
    }
    const diffSec = Math.max(0, Math.floor((currentTime - lastTs) / 1000));
    if (diffSec < 10) {
      return language === 'vi' ? 'Vừa đồng bộ tức thì (Real-time)' : 'Synced just now (Real-time)';
    }
    if (diffSec < 60) {
      return language === 'vi' ? `${diffSec} giây trước` : `${diffSec}s ago`;
    }
    const diffMin = Math.floor(diffSec / 60);
    return language === 'vi' ? `${diffMin} phút trước` : `${diffMin}m ago`;
  };

  const handleCopyCode = () => {
    playClick(soundEnabled);
    navigator.clipboard.writeText(activeFamilyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    playClick(soundEnabled);
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = joinCodeInput.trim().toUpperCase();
    if (!cleaned) return;
    playClick(soundEnabled);
    setIsSyncing(true);
    try {
      const ok = await onJoinFamily(cleaned);
      if (ok) {
        playSuccessChime(soundEnabled);
        setSyncMessage({
          type: 'success',
          text:
            language === 'vi'
              ? `Đã kết nối thành công với mã gia đình ${cleaned}!`
              : `Successfully connected to family code ${cleaned}!`
        });
        setJoinCodeInput('');
      } else {
        setSyncMessage({
          type: 'error',
          text:
            language === 'vi'
              ? `Không thể kết nối mã gia đình ${cleaned} (mã không hợp lệ hoặc chưa kết nối được Firebase). Mã gia đình hiện tại được giữ nguyên.`
              : `Could not connect to family code ${cleaned} (invalid code or Firebase unreachable). Current family code was kept.`
        });
      }
    } catch {
      setSyncMessage({
        type: 'error',
        text: 'Không kết nối được Firebase. Dữ liệu vẫn được lưu trên máy, vui lòng thử lại khi có mạng.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    playClick(soundEnabled);
    setIsSyncing(true);
    try {
      await onForceSync();
      playSuccessChime(soundEnabled);
      setSyncMessage({
        type: 'success',
        text:
          language === 'vi'
            ? `Đồng bộ hoàn tất! Kho Xu Tích Lũy (${currentStars} ⭐), Sao hôm nay (${dailyStars} ⭐) & Cấp độ (Lv.${currentLevel}) đã đồng nhất.`
            : `Sync complete! Star Vault (${currentStars} ⭐) & Level (Lv.${currentLevel}) are up to date.`
      });
    } catch {
      setSyncMessage({
        type: 'error',
        text:
          language === 'vi'
            ? 'Đang ở chế độ ngoại tuyến. Dữ liệu đã được lưu an toàn trên thiết bị.'
            : 'Offline mode. Data is safely saved locally.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushMasterClick = async () => {
    if (!onForcePush) return;
    playClick(soundEnabled);
    setIsSyncing(true);
    try {
      const ok = await onForcePush();
      if (ok) {
        playSuccessChime(soundEnabled);
        setSyncMessage({
          type: 'success',
          text:
            language === 'vi'
              ? `🚀 Đã phát dữ liệu máy này (${currentStars} ⭐ Xu tích lũy • +${dailyStars} ⭐ hôm nay) làm chuẩn cho toàn bộ thiết bị!`
              : `🚀 Pushed this device's data (${currentStars} ⭐) to all family devices!`
        });
      } else {
        setSyncMessage({
          type: 'error',
          text:
            language === 'vi'
              ? 'Không thể kết nối máy chủ đám mây. Vui lòng kiểm tra mạng.'
              : 'Could not reach cloud server. Please check network.'
        });
      }
    } catch {
      setSyncMessage({
        type: 'error',
        text: 'Không kết nối được Firebase. Dữ liệu vẫn được lưu trên máy, vui lòng thử lại khi có mạng.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullRemoteClick = async () => {
    if (!onForcePull) return;
    playClick(soundEnabled);
    setIsSyncing(true);
    try {
      const ok = await onForcePull();
      if (ok) {
        playSuccessChime(soundEnabled);
        setSyncMessage({
          type: 'success',
          text:
            language === 'vi'
              ? '📥 Đã tải dữ liệu mới nhất từ thiết bị kia về máy này thành công!'
              : '📥 Pulled latest data from remote family device!'
        });
      } else {
        setSyncMessage({
          type: 'error',
          text:
            language === 'vi'
              ? 'Chưa tìm thấy dữ liệu trên đám mây cho mã gia đình này.'
              : 'No remote cloud data found for this family code yet.'
        });
      }
    } catch {
      setSyncMessage({
        type: 'error',
        text: 'Không kết nối được Firebase. Dữ liệu vẫn được lưu trên máy, vui lòng thử lại khi có mạng.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateNewCode = async () => {
    playClick(soundEnabled);
    const newCode = generateFamilyCode();
    setIsSyncing(true);
    try {
      const ok = await onJoinFamily(newCode);
      if (!ok) {
        setSyncMessage({
          type: 'error',
          text:
            language === 'vi'
              ? `Không thể kết nối mã gia đình ${newCode} (mã không hợp lệ hoặc chưa kết nối được Firebase). Mã gia đình hiện tại được giữ nguyên.`
              : `Could not switch to family code ${newCode}. Current family code was kept.`
        });
        return;
      }
      playSuccessChime(soundEnabled);
      setSyncMessage({
        type: 'success',
        text:
          language === 'vi'
            ? `Đã tạo mã gia đình mới: ${newCode}`
            : `Created new family code: ${newCode}`
      });
    } catch {
      setSyncMessage({
        type: 'error',
        text: 'Không kết nối được Firebase. Dữ liệu vẫn được lưu trên máy, vui lòng thử lại khi có mạng.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-indigo-100 p-5 sm:p-7 relative">
        {/* Close Button */}
        <button
          onClick={() => {
            playClick(soundEnabled);
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-800">{t.syncTitle}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {isOnline ? 'Firebase Cloud + Real-Time' : 'Offline Mode'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">{t.syncSubtitle}</p>
          </div>
        </div>

        {/* Live Synchronized Data Summary Strip */}
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 mb-5 flex flex-wrap items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'vi' ? 'Trạng thái dữ liệu trên máy này' : 'Local & Cloud State'}
              </div>
              <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{getRelativeSyncTime()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-black">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-300">
              {currentStars} ⭐ {language === 'vi' ? 'Xu Tích Lũy' : 'Vault'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
              +{dailyStars} ⭐ {language === 'vi' ? 'Hôm nay' : 'Today'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              {completedTasksCount}/{totalTasksCount} {language === 'vi' ? 'Nhiệm vụ' : 'Quests'}
            </span>
          </div>
        </div>

        {/* Device Visual Banner */}
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-4 border border-indigo-100 mb-5 flex items-center justify-around text-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-indigo-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700">
              {language === 'vi' ? 'Điện thoại Bố/Mẹ' : 'Parent Phone'}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{language === 'vi' ? 'Tự động 2 chiều' : '2-Way Sync'}</span>
            </div>
            <div className="w-20 h-0.5 bg-gradient-to-r from-indigo-300 via-emerald-400 to-purple-300 my-1 rounded-full" />
            <span className="text-[11px] font-mono text-emerald-700 font-semibold">
              cominh-family-afa95 (RTDB)
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-purple-600">
              <Laptop className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700">
              {language === 'vi' ? 'iPad / Máy tính của Bé' : 'Kid Tablet / PC'}
            </span>
          </div>
        </div>

        {/* Current Family Code Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.familyCodeLabel}
            </label>
            <button
              type="button"
              onClick={() => {
                playClick(soundEnabled);
                setShowQrPanel(!showQrPanel);
              }}
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQrPanel ? (language === 'vi' ? 'Ẩn mã QR' : 'Hide QR') : (language === 'vi' ? 'Hiện mã QR' : 'Show QR')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border-2 border-indigo-200 rounded-xl px-4 py-2.5 font-mono font-black text-lg sm:text-xl text-indigo-700 tracking-wider text-center select-all">
              {activeFamilyCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? t.copied : t.copyCode}</span>
            </button>
          </div>

          {isLegacyDefaultFamilyCode(activeFamilyCode) && (
            <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5 text-xs leading-relaxed font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Mã gia đình này là mã mặc định dùng chung cho mọi máy cài ứng dụng. Người khác cũng có thể xem và sửa dữ liệu của bé. Hãy tạo mã riêng trên MỘT máy, sau đó nhập mã mới đó trên các máy còn lại của gia đình.
                </span>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateNewCode}
                  disabled={isSyncing}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tạo mã gia đình riêng</span>
                </button>
              </div>
            </div>
          )}

          {/* QR Code & Magic Link Section for Instant Second-Device Pairing */}
          {showQrPanel && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-indigo-100">
              {qrCodeImageUrl && (
                <div className="p-2 bg-white rounded-xl border-2 border-indigo-100 shadow-xs shrink-0">
                  <img
                    src={qrCodeImageUrl}
                    alt="Family Sync QR Code"
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg"
                  />
                </div>
              )}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>
                    {language === 'vi'
                      ? 'Quét mã QR bằng Điện thoại / iPad thứ 2'
                      : 'Scan QR with 2nd Phone / Tablet'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'vi'
                    ? 'Mở Camera trên điện thoại hoặc iPad khác và quét mã QR này để tự động kết nối vào cùng Mã Gia Đình mà không cần nhập tay!'
                    : 'Open Camera on another phone or tablet and scan this QR code to automatically join the same Family Code!'}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    onClick={handleCopyLink}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>
                      {copiedLink
                        ? language === 'vi'
                          ? 'Đã sao chép liên kết!'
                          : 'Link copied!'
                        : language === 'vi'
                        ? 'Sao chép liên kết nhanh'
                        : 'Copy magic link'}
                    </span>
                  </button>

                  <button
                    onClick={handleGenerateNewCode}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Tạo mã mới' : 'New code'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Sync Now / Push Master / Pull Remote */}
          <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex-1 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{t.connectSync}</span>
              </button>

              {onForcePush && (
                <button
                  onClick={handlePushMasterClick}
                  disabled={isSyncing}
                  className="flex-1 text-xs font-extrabold text-amber-950 bg-amber-400 hover:bg-amber-300 px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60"
                  title={
                    language === 'vi'
                      ? 'Lấy số sao và dữ liệu trên máy này ghi đè làm chuẩn cho tất cả thiết bị khác'
                      : 'Use this device as master and overwrite all other devices'
                  }
                >
                  <Flame className="w-3.5 h-3.5 fill-amber-950" />
                  <span>
                    {language === 'vi' ? 'Lấy máy này làm chuẩn' : 'Push This Device as Master'}
                  </span>
                </button>
              )}

              {onForcePull && (
                <button
                  onClick={handlePullRemoteClick}
                  disabled={isSyncing}
                  className="w-full sm:w-auto text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Tải từ máy kia về' : 'Pull from Cloud'}</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {language === 'vi'
                ? '💡 Mẹo: Nếu 2 thiết bị từng dùng khác mã hoặc lệch số sao, hãy bấm "Lấy máy này làm chuẩn" trên máy có số sao đúng nhất để đồng bộ tức thì sang máy kia.'
                : '💡 Tip: Click "Push This Device as Master" on the device with the correct stars to immediately overwrite other devices.'}
            </p>
          </div>
        </div>

        {/* Join Existing Family Code */}
        <form onSubmit={handleJoinSubmit} className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {t.joinFamily}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="VD: HERO-7KQ2-M9XA-P4TD"
              className="flex-1 border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase outline-none"
            />
            <button
              type="submit"
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>{t.connectSync}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            {language === 'vi'
              ? 'Nhập cùng một Mã Gia Đình trên cả điện thoại và máy tính để dữ liệu của bé luôn giống nhau ở mọi nơi.'
              : 'Enter the same Family Code on both phone and computer to keep your child data identical everywhere.'}
          </p>
        </form>

        {/* Feedback Toast */}
        {syncMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold ${
              syncMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
