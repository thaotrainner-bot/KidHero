export interface AvatarPreset {
  id: string;
  nameVi: string;
  nameEn: string;
  url: string;
}

function createSvgAvatarDataUrl(bgGradientStart: string, bgGradientEnd: string, emoji: string, accentColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradientStart}" />
        <stop offset="100%" stop-color="${bgGradientEnd}" />
      </linearGradient>
    </defs>
    <rect width="160" height="160" rx="36" fill="url(#g)" />
    <circle cx="80" cy="80" r="62" fill="rgba(255,255,255,0.18)" stroke="${accentColor}" stroke-width="3" />
    <circle cx="30" cy="32" r="6" fill="rgba(255,255,255,0.35)" />
    <circle cx="132" cy="126" r="8" fill="rgba(255,255,255,0.25)" />
    <text x="80" y="102" font-size="72" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_HERO_AVATAR_URL = createSvgAvatarDataUrl('#0f172a', '#1e40af', '🧑‍🚀', '#38bdf8');
export const SCHOLAR_CAT_AVATAR_URL = createSvgAvatarDataUrl('#f59e0b', '#d97706', '🐱', '#fde68a');
export const DRAGON_HERO_AVATAR_URL = createSvgAvatarDataUrl('#dc2626', '#f97316', '🐲', '#fde047');
export const DOG_ADVENTURER_AVATAR_URL = createSvgAvatarDataUrl('#0284c7', '#2563eb', '🐶', '#7dd3fc');

export function sanitizeAvatarUrl(url?: string): string {
  if (!url || typeof url !== 'string') return DEFAULT_HERO_AVATAR_URL;
  if (url.includes('/src/assets/images/')) {
    if (url.includes('cat_scholar')) return SCHOLAR_CAT_AVATAR_URL;
    if (url.includes('dog_adventurer')) return DOG_ADVENTURER_AVATAR_URL;
    return DEFAULT_HERO_AVATAR_URL;
  }
  return url;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'astronaut_kid',
    nameVi: 'Phi Hành Gia Nhí',
    nameEn: 'Little Astronaut',
    url: DEFAULT_HERO_AVATAR_URL
  },
  {
    id: 'dragon_hero',
    nameVi: 'Rồng Con Đốm Đốm',
    nameEn: 'Dragon Buddy',
    url: DRAGON_HERO_AVATAR_URL
  },
  {
    id: 'cat_scholar',
    nameVi: 'Mèo Thông Thái',
    nameEn: 'Scholar Cat',
    url: SCHOLAR_CAT_AVATAR_URL
  },
  {
    id: 'dog_adventurer',
    nameVi: 'Cún Phiêu Lưu',
    nameEn: 'Adventurer Pup',
    url: DOG_ADVENTURER_AVATAR_URL
  },
  {
    id: 'super_boy',
    nameVi: 'Bé Trai Siêu Nhân',
    nameEn: 'Super Boy',
    url: createSvgAvatarDataUrl('#2563eb', '#4f46e5', '🦸‍♂️', '#93c5fd')
  },
  {
    id: 'super_girl',
    nameVi: 'Bé Gái Siêu Nhân',
    nameEn: 'Super Girl',
    url: createSvgAvatarDataUrl('#db2777', '#9333ea', '🦸‍♀️', '#fbcfe8')
  },
  {
    id: 'star_princess',
    nameVi: 'Công Chúa Ánh Sao',
    nameEn: 'Star Princess',
    url: createSvgAvatarDataUrl('#ec4899', '#f43f5e', '👸', '#fde047')
  },
  {
    id: 'panda_scholar',
    nameVi: 'Gấu Trúc Chăm Chỉ',
    nameEn: 'Smart Panda',
    url: createSvgAvatarDataUrl('#059669', '#10b981', '🐼', '#a7f3d0')
  },
  {
    id: 'magic_unicorn',
    nameVi: 'Kỳ Lân Cầu Vồng',
    nameEn: 'Rainbow Unicorn',
    url: createSvgAvatarDataUrl('#7c3aed', '#ec4899', '🦄', '#fef08a')
  }
];

/**
 * Resizes and compresses an uploaded image file to a 160x160 JPEG Data URL (< 15KB)
 * so it can be stored safely in localStorage and synced via Firebase Realtime Database / Firestore.
 */
export function compressImageFileToDataUrl(file: File, maxSize: number = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Không thể đọc file ảnh'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Center-crop square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, maxSize, maxSize);
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Định dạng ảnh không hợp lệ'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Lỗi khi tải ảnh lên'));
    reader.readAsDataURL(file);
  });
}
