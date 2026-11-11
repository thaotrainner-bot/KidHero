import { PetAccessoryId, PetSpecies } from '../types';

export interface PetSpeciesOption {
  species: PetSpecies;
  nameVi: string;
  nameEn: string;
  titleVi: string;
  titleEn: string;
  avatar: string;
  emoji: string;
  foodVi: string;
  foodEn: string;
  cheerVi: string;
  cheerEn: string;
  badgeColor: string;
}

function createCutePetSvgDataUrl(
  bgStart: string,
  bgEnd: string,
  ringColor: string,
  illustrationSvg: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="220" height="220">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="46%" r="52%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="furGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" />
        <stop offset="55%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <linearGradient id="cheekBlush" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fda4af" />
        <stop offset="100%" stop-color="#f43f5e" />
      </linearGradient>
    </defs>
    <rect width="220" height="220" rx="48" fill="url(#bg)" />
    <circle cx="110" cy="108" r="88" fill="url(#glow)" stroke="${ringColor}" stroke-width="3.5" stroke-opacity="0.55" />
    <!-- Cute Sparkles & Hearts in Background -->
    <circle cx="34" cy="40" r="4.5" fill="#ffffff" fill-opacity="0.75" />
    <circle cx="186" cy="44" r="5" fill="#fde047" fill-opacity="0.9" />
    <circle cx="184" cy="172" r="5.5" fill="#ffffff" fill-opacity="0.5" />
    <path d="M36 164 C36 160, 42 160, 42 164 C42 160, 48 160, 48 164 C48 169, 42 173, 42 175 C42 173, 36 169, 36 164 Z" fill="#fda4af" opacity="0.85" />
    ${illustrationSvg}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Super Adorable Kawaii Chubby Hamster ("Chuột Hamster Mũm Mĩm") Vector Illustration
const HAMSTER_SVG_CONTENT = `
  <!-- Soft Shadow Under Hamster -->
  <ellipse cx="110" cy="194" rx="58" ry="12" fill="#78350f" opacity="0.28" />

  <!-- Cute Fluffy Round Ears with Soft Pink Inner -->
  <g>
    <circle cx="58" cy="58" r="24" fill="url(#furGrad)" stroke="#b45309" stroke-width="3" />
    <circle cx="58" cy="58" r="14.5" fill="#fecdd3" />
    <circle cx="61" cy="56" r="8" fill="#fda4af" opacity="0.7" />

    <circle cx="162" cy="58" r="24" fill="url(#furGrad)" stroke="#b45309" stroke-width="3" />
    <circle cx="162" cy="58" r="14.5" fill="#fecdd3" />
    <circle cx="159" cy="56" r="8" fill="#fda4af" opacity="0.7" />
  </g>

  <!-- Cute Little Lucky Clover Sprout on Top of Head -->
  <g>
    <path d="M110 42 Q110 26 116 22" fill="none" stroke="#15803d" stroke-width="3.5" stroke-linecap="round" />
    <ellipse cx="102" cy="24" rx="9" ry="5.5" transform="rotate(-22 102 24)" fill="#4ade80" stroke="#15803d" stroke-width="2" />
    <ellipse cx="120" cy="23" rx="9" ry="5.5" transform="rotate(24 120 23)" fill="#22c55e" stroke="#15803d" stroke-width="2" />
  </g>

  <!-- Ultra-Chubby Marshmallow Body & Cheeks -->
  <path d="M44 128 C38 86, 62 44, 110 44 C158 44, 182 86, 176 128 C184 156, 162 188, 110 188 C58 188, 36 156, 44 128 Z" fill="url(#furGrad)" stroke="#b45309" stroke-width="3.5" />

  <!-- Extra Fluffy Marshmallow Cheek Pouches -->
  <ellipse cx="57" cy="124" rx="26" ry="22" fill="#fef3c7" />
  <ellipse cx="163" cy="124" rx="26" ry="22" fill="#fef3c7" />

  <!-- Snow-Cream Face & Plump Belly Patch -->
  <ellipse cx="110" cy="112" rx="52" ry="40" fill="#fffbeb" />
  <ellipse cx="110" cy="148" rx="46" ry="37" fill="#ffffff" />

  <!-- Cute Golden Forehead Fur Tuft & Blaze -->
  <path d="M74 52 Q110 92 146 52 Q126 42 110 44 Q94 42 74 52 Z" fill="#f59e0b" />
  <path d="M102 44 Q106 35 110 42 Q114 34 118 44" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" />

  <!-- Rosy Pink Kawaii Blushing Cheeks -->
  <ellipse cx="62" cy="120" rx="13" ry="8" fill="url(#cheekBlush)" opacity="0.75" />
  <ellipse cx="158" cy="120" rx="13" ry="8" fill="url(#cheekBlush)" opacity="0.75" />
  <line x1="58" y1="118" x2="61" y2="122" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.8" />
  <line x1="64" y1="118" x2="67" y2="122" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.8" />
  <line x1="154" y1="118" x2="157" y2="122" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.8" />
  <line x1="160" y1="118" x2="163" y2="122" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.8" />

  <!-- Big Sparkling Anime Eyes -->
  <g>
    <circle cx="83" cy="100" r="10.5" fill="#1e1b4b" />
    <circle cx="80" cy="96" r="4.2" fill="#ffffff" />
    <circle cx="87" cy="104" r="2" fill="#ffffff" />
    <circle cx="78" cy="104" r="1.2" fill="#fda4af" />

    <circle cx="137" cy="100" r="10.5" fill="#1e1b4b" />
    <circle cx="134" cy="96" r="4.2" fill="#ffffff" />
    <circle cx="141" cy="104" r="2" fill="#ffffff" />
    <circle cx="132" cy="104" r="1.2" fill="#fda4af" />

    <!-- Cute Happy Eyebrows -->
    <path d="M75 84 Q83 80 90 84" fill="none" stroke="#92400e" stroke-width="2.5" stroke-linecap="round" />
    <path d="M130 84 Q137 80 145 84" fill="none" stroke="#92400e" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- Little Pink Heart Nose & Smiling 'w' Mouth -->
  <ellipse cx="110" cy="110" rx="6.5" ry="4.8" fill="#fb7185" stroke="#e11d48" stroke-width="1.5" />
  <ellipse cx="108.5" cy="108.8" rx="2.2" ry="1.2" fill="#ffffff" opacity="0.8" />
  <!-- Happy Open Mouth Tongue -->
  <path d="M101 119 Q110 130 119 119 Z" fill="#f43f5e" />
  <path d="M104 122 Q110 128 116 122 Z" fill="#fda4af" />
  <!-- Cute 'w' Lip Line -->
  <path d="M98 117 Q104 123 110 116 Q116 123 122 117" fill="none" stroke="#78350f" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Cute Whiskers -->
  <line x1="34" y1="114" x2="50" y2="117" stroke="#92400e" stroke-width="2.2" stroke-linecap="round" />
  <line x1="32" y1="124" x2="49" y2="124" stroke="#92400e" stroke-width="2.2" stroke-linecap="round" />
  <line x1="186" y1="114" x2="170" y2="117" stroke="#92400e" stroke-width="2.2" stroke-linecap="round" />
  <line x1="188" y1="124" x2="171" y2="124" stroke="#92400e" stroke-width="2.2" stroke-linecap="round" />

  <!-- Delicious Golden Sunflower Seed Held on Belly -->
  <g>
    <path d="M110 133 C94 133, 92 164, 110 172 C128 164, 126 133, 110 133 Z" fill="#334155" stroke="#fbbf24" stroke-width="2.5" />
    <path d="M110 137 L110 167" stroke="#f8fafc" stroke-width="2.5" stroke-linecap="round" />
    <path d="M104 142 Q103 154 107 164" fill="none" stroke="#cbd5e1" stroke-width="1.6" stroke-linecap="round" />
    <path d="M116 142 Q117 154 113 164" fill="none" stroke="#cbd5e1" stroke-width="1.6" stroke-linecap="round" />
  </g>

  <!-- Chubby Little Paws Holding the Seed -->
  <ellipse cx="92" cy="149" rx="10" ry="7.5" transform="rotate(18 92 149)" fill="#fde68a" stroke="#d97706" stroke-width="2.5" />
  <ellipse cx="128" cy="149" rx="10" ry="7.5" transform="rotate(-18 128 149)" fill="#fde68a" stroke="#d97706" stroke-width="2.5" />

  <!-- Cute Pink Paw Pads on Bottom Feet -->
  <g>
    <ellipse cx="80" cy="184" rx="14" ry="8" fill="#fecdd3" stroke="#f43f5e" stroke-width="2" />
    <circle cx="80" cy="185" r="3.5" fill="#fb7185" />
    <circle cx="74" cy="181" r="2" fill="#fb7185" />
    <circle cx="80" cy="179.5" r="2" fill="#fb7185" />
    <circle cx="86" cy="181" r="2" fill="#fb7185" />

    <ellipse cx="140" cy="184" rx="14" ry="8" fill="#fecdd3" stroke="#f43f5e" stroke-width="2" />
    <circle cx="140" cy="185" r="3.5" fill="#fb7185" />
    <circle cx="134" cy="181" r="2" fill="#fb7185" />
    <circle cx="140" cy="179.5" r="2" fill="#fb7185" />
    <circle cx="146" cy="181" r="2" fill="#fb7185" />
  </g>
`;

export const CUTE_HAMSTER_AVATAR_URL = createCutePetSvgDataUrl(
  '#fffbeb',
  '#fed7aa',
  '#f59e0b',
  HAMSTER_SVG_CONTENT
);

export const MAGIC_EGG_SVG_URL = createCutePetSvgDataUrl(
  '#312e81',
  '#581c87',
  '#fbbf24',
  `
  <!-- Nest / Cushion -->
  <ellipse cx="110" cy="176" rx="58" ry="15" fill="#78350f" stroke="#b45309" stroke-width="3" />
  <ellipse cx="110" cy="173" rx="48" ry="10" fill="#f59e0b" opacity="0.45" />
  <!-- Magical Glowing Egg -->
  <path d="M110 40 C72 40, 54 94, 54 132 C54 164, 78 178, 110 178 C142 178, 166 164, 166 132 C166 94, 148 40, 110 40 Z" fill="#fef3c7" stroke="#f59e0b" stroke-width="4" />
  <!-- Cute Hamster Ears Silhouette Glowing Inside Egg -->
  <circle cx="88" cy="92" r="11" fill="#f472b6" opacity="0.75" />
  <circle cx="132" cy="104" r="13" fill="#60a5fa" opacity="0.75" />
  <circle cx="84" cy="136" r="11" fill="#34d399" opacity="0.75" />
  <circle cx="126" cy="144" r="9" fill="#a78bfa" opacity="0.8" />
  <polygon points="110,60 113,68 122,68 115,73 117,81 110,76 103,81 105,73 98,68 107,68" fill="#f59e0b" />
  `
);

export const CRACKING_EGG_SVG_URL = createCutePetSvgDataUrl(
  '#4338ca',
  '#be185d',
  '#fde047',
  `
  <!-- Sparkles -->
  <circle cx="46" cy="74" r="6" fill="#fde047" />
  <circle cx="174" cy="72" r="6" fill="#fde047" />
  <circle cx="110" cy="26" r="7" fill="#fde047" />
  <!-- Magical Cracking Egg -->
  <path d="M110 40 C72 40, 54 94, 54 132 C54 164, 78 178, 110 178 C142 178, 166 164, 166 132 C166 94, 148 40, 110 40 Z" fill="#fef08a" stroke="#f59e0b" stroke-width="4" />
  <!-- Zigzag Crack Line -->
  <polyline points="62,112 82,100 98,120 118,96 134,118 158,104" fill="none" stroke="#7c2d12" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <polyline points="98,120 104,142" fill="none" stroke="#7c2d12" stroke-width="3.5" stroke-linecap="round" />
  `
);

// ONLY Chuột Hamster Mũm Mĩm is kept as the exclusive pet mascot!
export const PET_SPECIES_LIST: PetSpeciesOption[] = [
  {
    species: 'hamster',
    nameVi: 'Chuột Hamster Mũm Mĩm',
    nameEn: 'Chubby Hamster',
    titleVi: 'Má phúng phính hồng hào • Yêu hạt hướng dương & chăm ngoan',
    titleEn: 'Fluffy Rosy Cheeks • Sunflower Seed Collector',
    avatar: CUTE_HAMSTER_AVATAR_URL,
    emoji: '🐹',
    foodVi: 'Hạt hướng dương & Dâu tây ngọt',
    foodEn: 'Crunchy Sunflower Seed & Sweet Strawberry',
    cheerVi: 'Chít chít! Chuột Hamster Mũm Mĩm yêu bé lắm, cùng làm nhiệm vụ tích Sao nhé!',
    cheerEn: 'Squeak squeak! Chubby Hamster loves you! Let’s complete quests and earn Stars!',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
  }
];

// 30-Level EXP Thresholds for Chuột Hamster Mũm Mĩm (Lv.1 -> Lv.30)
export const EGG_HATCH_TARGET_STARS = 50; // 50 EXP to hatch Magic Egg
export const EVOLUTION_STAGE_2_STARS = 100; // Lv.2
export const EVOLUTION_STAGE_3_STARS = 200; // Lv.3
export const EVOLUTION_STAGE_4_EXP = 350; // Lv.4
export const EVOLUTION_STAGE_5_EXP = 550; // Lv.5
export const EVOLUTION_STAGE_6_EXP = 800; // Lv.6
export const EVOLUTION_STAGE_7_EXP = 1100; // Lv.7
export const EVOLUTION_STAGE_8_EXP = 1450; // Lv.8
export const EVOLUTION_STAGE_9_EXP = 1850; // Lv.9
export const EVOLUTION_STAGE_10_EXP = 2300; // Lv.10
export const EVOLUTION_STAGE_11_EXP = 2800; // Lv.11
export const EVOLUTION_STAGE_12_EXP = 3350; // Lv.12
export const EVOLUTION_STAGE_13_EXP = 3950; // Lv.13
export const EVOLUTION_STAGE_14_EXP = 4600; // Lv.14
export const EVOLUTION_STAGE_15_EXP = 5300; // Lv.15
export const EVOLUTION_STAGE_16_EXP = 6200; // Lv.16
export const EVOLUTION_STAGE_17_EXP = 7150; // Lv.17
export const EVOLUTION_STAGE_18_EXP = 8200; // Lv.18
export const EVOLUTION_STAGE_19_EXP = 9400; // Lv.19
export const EVOLUTION_STAGE_20_EXP = 10700; // Lv.20
export const EVOLUTION_STAGE_21_EXP = 12200; // Lv.21
export const EVOLUTION_STAGE_22_EXP = 13850; // Lv.22
export const EVOLUTION_STAGE_23_EXP = 15650; // Lv.23
export const EVOLUTION_STAGE_24_EXP = 17600; // Lv.24
export const EVOLUTION_STAGE_25_EXP = 19700; // Lv.25
export const EVOLUTION_STAGE_26_EXP = 22100; // Lv.26
export const EVOLUTION_STAGE_27_EXP = 24800; // Lv.27
export const EVOLUTION_STAGE_28_EXP = 27800; // Lv.28
export const EVOLUTION_STAGE_29_EXP = 31100; // Lv.29
export const EVOLUTION_STAGE_30_EXP = 34600; // Lv.30

export type PetLevelNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30;

export interface PetEvolutionStageMeta {
  stage: PetLevelNumber;
  minStars: number; // Min EXP for this level
  targetStars: number; // Next level EXP threshold
  titleVi: string;
  titleEn: string;
  badgeVi: string;
  badgeEn: string;
  perkVi: string;
  perkEn: string;
}

export const PET_EVOLUTION_STAGES: PetEvolutionStageMeta[] = [
  {
    stage: 1,
    minStars: 0,
    targetStars: 100,
    titleVi: 'Lv.1: Hamster Sơ Sinh Đáng Yêu',
    titleEn: 'Lv.1: Adorable Baby Hamster',
    badgeVi: '🐹 Lv.1 • Sơ sinh',
    badgeEn: '🐹 Lv.1 • Baby',
    perkVi: 'Đạt 50 EXP nở khỏi Trứng Ma Thuật! Mở khóa Đĩa hạt hướng dương, Bình nước & Nơ xinh.',
    perkEn: 'Reach 50 EXP to hatch! Unlocks Food Bowl, Water Fountain & Cute Bow.'
  },
  {
    stage: 2,
    minStars: 100,
    targetStars: 200,
    titleVi: 'Lv.2: Hamster Mũm Mĩm Tập Sự',
    titleEn: 'Lv.2: Chubby Apprentice Hamster',
    badgeVi: '🌻 Lv.2 • Tập sự (100+ EXP)',
    badgeEn: '🌻 Lv.2 • Apprentice (100+ EXP)',
    perkVi: 'Mở khóa Thảm cỏ êm ái & Chủ đề Khu Vườn Hạt Dẻ!',
    perkEn: 'Unlocks Soft Clover Grass Rug & Garden Nature Theme!'
  },
  {
    stage: 3,
    minStars: 200,
    targetStars: 350,
    titleVi: 'Lv.3: Hamster Chăm Chỉ Chạy Bộ',
    titleEn: 'Lv.3: Energetic Runner Hamster',
    badgeVi: '🎡 Lv.3 • Chăm chỉ (200+ EXP)',
    badgeEn: '🎡 Lv.3 • Energetic (200+ EXP)',
    perkVi: 'Mở khóa giọng nói cổ vũ & kỹ năng nhảy nhót năng động!',
    perkEn: 'Unlocks Voice Cheer & energetic jumping animations!'
  },
  {
    stage: 4,
    minStars: 350,
    targetStars: 550,
    titleVi: 'Lv.4: Hamster Bác Học Thông Thái',
    titleEn: 'Lv.4: Little Scholar Hamster',
    badgeVi: '🎓 Lv.4 • Bác Học (350+ EXP)',
    badgeEn: '🎓 Lv.4 • Scholar (350+ EXP)',
    perkVi: 'Mở khóa Vòng xoay chạy bộ, Nhà cầu vồng, Mũ bác học & Chủ đề Phòng Bác Học!',
    perkEn: 'Unlocks Exercise Wheel, Rainbow House, Scholar Cap & Scholar Room Theme!'
  },
  {
    stage: 5,
    minStars: 550,
    targetStars: 800,
    titleVi: 'Lv.5: Hamster Siêu Anh Hùng',
    titleEn: 'Lv.5: Superhero Hamster',
    badgeVi: '🧣 Lv.5 • Siêu Anh Hùng (550+ EXP)',
    badgeEn: '🧣 Lv.5 • Superhero (550+ EXP)',
    perkVi: 'Tăng 10% điểm tiện nghi phòng & mở khóa tư thế Nhảy Santo!',
    perkEn: 'Boosts Room Comfort Score & unlocks Superhero Jump!'
  },
  {
    stage: 6,
    minStars: 800,
    targetStars: 1100,
    titleVi: 'Lv.6: Hamster Chủ Nhân Nhà Gỗ Cầu Vồng',
    titleEn: 'Lv.6: Rainbow Villa Hamster',
    badgeVi: '🏡 Lv.6 • Nhà Cầu Vồng (800+ EXP)',
    badgeEn: '🏡 Lv.6 • Rainbow Villa (800+ EXP)',
    perkVi: 'Mở khóa Kệ sách gỗ thông thái, Đồng hồ treo tường & Chủ đề Phòng Cầu Vồng!',
    perkEn: 'Unlocks Wise Wooden Bookshelf, Wall Clock & Rainbow Room Theme!'
  },
  {
    stage: 7,
    minStars: 1100,
    targetStars: 1450,
    titleVi: 'Lv.7: Hamster Hiệp Sĩ Hào Quang',
    titleEn: 'Lv.7: Radiant Knight Hamster',
    badgeVi: '🪽 Lv.7 • Hiệp Sĩ Hào Quang (1100+ EXP)',
    badgeEn: '🪽 Lv.7 • Radiant Knight (1100+ EXP)',
    perkVi: 'Mở khóa hiệu ứng lấp lánh hào quang khi bé xoa đầu!',
    perkEn: 'Unlocks Radiant Aura sparkles when patted!'
  },
  {
    stage: 8,
    minStars: 1450,
    targetStars: 1850,
    titleVi: 'Lv.8: Hamster Hoàng Gia Tri Thức',
    titleEn: 'Lv.8: Royal Scholar Hamster',
    badgeVi: '🪑 Lv.8 • Tri Thức (1450+ EXP)',
    badgeEn: '🪑 Lv.8 • Royal Scholar (1450+ EXP)',
    perkVi: 'Mở khóa Bàn học mini & Đèn bàn phát sáng đổi màu phòng!',
    perkEn: 'Unlocks Mini Study Desk & Glowing Desk Lamp!'
  },
  {
    stage: 9,
    minStars: 1850,
    targetStars: 2300,
    titleVi: 'Lv.9: Hamster Kiến Trúc Sư Tài Ba',
    titleEn: 'Lv.9: Master Architect Hamster',
    badgeVi: '🏗️ Lv.9 • Kiến Trúc Sư (1850+ EXP)',
    badgeEn: '🏗️ Lv.9 • Master Architect (1850+ EXP)',
    perkVi: 'Tăng cấp Độ Tiện Nghi Phòng & hiệu ứng xây dựng phòng!',
    perkEn: 'Boosts Room Builder Comfort Score!'
  },
  {
    stage: 10,
    minStars: 2300,
    targetStars: 2800,
    titleVi: 'Lv.10: Hamster Hoàng Tử Lâu Đài Pha Lê',
    titleEn: 'Lv.10: Crystal Castle Prince Hamster',
    badgeVi: '🏰 Lv.10 • Lâu Đài Pha Lê (2300+ EXP)',
    badgeEn: '🏰 Lv.10 • Crystal Castle (2300+ EXP)',
    perkVi: 'Mở khóa Vương miện vàng, Lâu đài pha lê & Chủ đề Cung Điện Hoàng Gia!',
    perkEn: 'Unlocks Golden Crown, Crystal Castle & Royal Palace Room Theme!'
  },
  {
    stage: 11,
    minStars: 2800,
    targetStars: 3350,
    titleVi: 'Lv.11: Hamster Thám Hiểm Rừng Xanh',
    titleEn: 'Lv.11: Forest Explorer Hamster',
    badgeVi: '🧭 Lv.11 • Thám Hiểm (2800+ EXP)',
    badgeEn: '🧭 Lv.11 • Explorer (2800+ EXP)',
    perkVi: 'Mở khóa hiệu ứng lá rừng hạt dẻ & tăng sức bền năng lượng!',
    perkEn: 'Unlocks chestnut forest sparkles & stamina boost!'
  },
  {
    stage: 12,
    minStars: 3350,
    targetStars: 3950,
    titleVi: 'Lv.12: Hamster Chúa Đảo Suối Nguồn',
    titleEn: 'Lv.12: Waterfall Oasis Hamster',
    badgeVi: '⛲ Lv.12 • Suối Nguồn (3350+ EXP)',
    badgeEn: '⛲ Lv.12 • Oasis (3350+ EXP)',
    perkVi: 'Tặng miễn phí Thác nước hạt dẻ mini đặt trong phòng (+35% Vui vẻ & Năng lượng)!',
    perkEn: 'Unlocks Free Mini Chestnut Waterfall in the room!'
  },
  {
    stage: 13,
    minStars: 3950,
    targetStars: 4600,
    titleVi: 'Lv.13: Hamster Nhạc Sĩ Giao Hưởng',
    titleEn: 'Lv.13: Symphony Maestro Hamster',
    badgeVi: '🎼 Lv.13 • Nhạc Sĩ (3950+ EXP)',
    badgeEn: '🎼 Lv.13 • Maestro (3950+ EXP)',
    perkVi: 'Mở khóa nốt nhạc vàng bay quanh phòng khi Hamster nhảy múa!',
    perkEn: 'Unlocks musical notes around the room when dancing!'
  },
  {
    stage: 14,
    minStars: 4600,
    targetStars: 5300,
    titleVi: 'Lv.14: Hamster Nhà Thiên Văn Tinh Tú',
    titleEn: 'Lv.14: Starlight Astronomer Hamster',
    badgeVi: '🔭 Lv.14 • Thiên Văn (4600+ EXP)',
    badgeEn: '🔭 Lv.14 • Astronomer (4600+ EXP)',
    perkVi: 'Tặng miễn phí Kính thiên văn ngắm sao đặt cạnh cửa sổ (+40% Vui vẻ)!',
    perkEn: 'Unlocks Free Starlight Telescope on the upper wall!'
  },
  {
    stage: 15,
    minStars: 5300,
    targetStars: 6200,
    titleVi: 'Lv.15: Hamster Đại Sứ Hạnh Phúc',
    titleEn: 'Lv.15: Happiness Ambassador Hamster',
    badgeVi: '🌈 Lv.15 • Đại Sứ (5300+ EXP)',
    badgeEn: '🌈 Lv.15 • Ambassador (5300+ EXP)',
    perkVi: 'Mở khóa Chủ đề Phòng Ngân Hà & hiệu ứng sao băng lấp lánh!',
    perkEn: 'Unlocks Cosmic Galaxy Room Theme & shooting stars!'
  },
  {
    stage: 16,
    minStars: 6200,
    targetStars: 7150,
    titleVi: 'Lv.16: Hamster Hiệp Sĩ Ánh Sáng',
    titleEn: 'Lv.16: Knight of Light Hamster',
    badgeVi: '⚔️ Lv.16 • Hiệp Sĩ Ánh Sáng (6200+ EXP)',
    badgeEn: '⚔️ Lv.16 • Knight of Light (6200+ EXP)',
    perkVi: 'Tặng Đệm mây cầu vồng miễn phí & mở khóa Bể Cá San Hô Phát Sáng trong Cửa hàng Xu!',
    perkEn: 'Unlocks Free Rainbow Cloud Bed & Glowing Coral Aquarium in Coin Shop!'
  },
  {
    stage: 17,
    minStars: 7150,
    targetStars: 8200,
    titleVi: 'Lv.17: Hamster Kiện Tướng Tinh Anh',
    titleEn: 'Lv.17: Grand Elite Champion Hamster',
    badgeVi: '🏆 Lv.17 • Kiện Tướng (7150+ EXP)',
    badgeEn: '🏆 Lv.17 • Champion (7150+ EXP)',
    perkVi: 'Tăng tốc độ quay Vòng xoay chạy bộ & hiệu ứng pháo hoa nhà vô địch!',
    perkEn: 'Boosts Exercise Wheel spin & champion confetti!'
  },
  {
    stage: 18,
    minStars: 8200,
    targetStars: 9400,
    titleVi: 'Lv.18: Hamster Tổng Công Trình Sư Robot',
    titleEn: 'Lv.18: Robo-Inventive Master Hamster',
    badgeVi: '🤖 Lv.18 • Sáng Chế (8200+ EXP)',
    badgeEn: '🤖 Lv.18 • Robo Master (8200+ EXP)',
    perkVi: 'Tặng miễn phí Robot phục vụ hạt dẻ & mở khóa Nồi Giả Kim Phép Thuật ở Cửa hàng Xu!',
    perkEn: 'Unlocks Free Chestnut Butler Robot & Magic Alchemy Cauldron in Coin Shop!'
  },
  {
    stage: 19,
    minStars: 9400,
    targetStars: 10700,
    titleVi: 'Lv.19: Hamster Sứ Giả Đại Dương San Hô',
    titleEn: 'Lv.19: Coral Ocean Envoy Hamster',
    badgeVi: '🌊 Lv.19 • Đại Dương San Hô (9400+ EXP)',
    badgeEn: '🌊 Lv.19 • Coral Ocean (9400+ EXP)',
    perkVi: 'Mở khóa Chủ đề Kiến trúc 🌊 Đại Dương San Hô lung linh dưới đáy biển!',
    perkEn: 'Unlocks 🌊 Coral Ocean Architecture Theme!'
  },
  {
    stage: 20,
    minStars: 10700,
    targetStars: 12200,
    titleVi: 'Lv.20: Pháp Sư Tinh Tú',
    titleEn: 'Lv.20: Astral Starlight Mage Hamster',
    badgeVi: '🔮 Lv.20 • Pháp Sư Tinh Tú (10700+ EXP)',
    badgeEn: '🔮 Lv.20 • Starlight Mage (10700+ EXP)',
    perkVi: 'Tặng miễn phí Ngai Vàng Vũ Trụ & mở khóa Đàn Dương Cầm Ngân Hà ở Cửa hàng Xu!',
    perkEn: 'Unlocks Free Cosmic Throne & Galaxy Grand Piano in Coin Shop!'
  },
  {
    stage: 21,
    minStars: 12200,
    targetStars: 13850,
    titleVi: 'Lv.21: Hamster Thần Hộ Vệ Tinh Vân',
    titleEn: 'Lv.21: Nebula Guardian Hamster',
    badgeVi: '🌌 Lv.21 • Hộ Vệ Tinh Vân (12200+ EXP)',
    badgeEn: '🌌 Lv.21 • Nebula Guardian (12200+ EXP)',
    perkVi: 'Mở khóa hào quang Tinh Vân đa sắc bảo vệ căn phòng!',
    perkEn: 'Unlocks Multi-Color Nebula Guardian Aura!'
  },
  {
    stage: 22,
    minStars: 13850,
    targetStars: 15650,
    titleVi: 'Lv.22: Đại Pháp Sư Lâu Đài Phép Thuật',
    titleEn: 'Lv.22: Archmage of Magic Castle Hamster',
    badgeVi: '🏰 Lv.22 • Đại Pháp Sư (13850+ EXP)',
    badgeEn: '🏰 Lv.22 • Archmage (13850+ EXP)',
    perkVi: 'Mở khóa Chủ đề 🔮 Lâu Đài Phép Thuật & Áo Choàng Pháp Sư Tinh Tú ở Cửa hàng Xu!',
    perkEn: 'Unlocks 🔮 Magic Castle Room Theme & Starlight Wizard Cloak in Coin Shop!'
  },
  {
    stage: 23,
    minStars: 15650,
    targetStars: 17600,
    titleVi: 'Lv.23: Hamster Chiến Binh Ánh Sao',
    titleEn: 'Lv.23: Starlight Warrior Hamster',
    badgeVi: '⚡ Lv.23 • Chiến Binh Sao (15650+ EXP)',
    badgeEn: '⚡ Lv.23 • Starlight Warrior (15650+ EXP)',
    perkVi: 'Tăng +50 điểm tiện nghi phòng & hiệu ứng tia chớp ánh sao!',
    perkEn: 'Boosts Room Comfort Score by +50 & Starlight Lightning!'
  },
  {
    stage: 24,
    minStars: 17600,
    targetStars: 19700,
    titleVi: 'Lv.24: Hamster Phi Hành Gia Siêu Việt',
    titleEn: 'Lv.24: Transcendent Astronaut Hamster',
    badgeVi: '🛸 Lv.24 • Phi Hành Gia (17600+ EXP)',
    badgeEn: '🛸 Lv.24 • Astronaut (17600+ EXP)',
    perkVi: 'Mở khóa Ván Trượt Đệm Từ Trường Tương Lai trong Cửa hàng Xu!',
    perkEn: 'Unlocks Cyber Mag-Lev Hoverboard in Coin Shop!'
  },
  {
    stage: 25,
    minStars: 19700,
    targetStars: 22100,
    titleVi: 'Lv.25: Thuyền Trưởng Ngân Hà',
    titleEn: 'Lv.25: Galactic Fleet Captain Hamster',
    badgeVi: '🚀 Lv.25 • Thuyền Trưởng Ngân Hà (19700+ EXP)',
    badgeEn: '🚀 Lv.25 • Galactic Captain (19700+ EXP)',
    perkVi: 'Mở khóa Chủ đề Kiến trúc 🚀 Trạm Vũ Trụ Tương Lai siêu hiện đại!',
    perkEn: 'Unlocks 🚀 Future Space Station Architecture Theme!'
  },
  {
    stage: 26,
    minStars: 22100,
    targetStars: 24800,
    titleVi: 'Lv.26: Chiến Binh Kim Cương',
    titleEn: 'Lv.26: Diamond Paladin Hamster',
    badgeVi: '💎 Lv.26 • Chiến Binh Kim Cương (22100+ EXP)',
    badgeEn: '💎 Lv.26 • Diamond Warrior (22100+ EXP)',
    perkVi: 'Mở khóa Đài Phun Nước Năng Lượng Plasma trong Cửa hàng Xu!',
    perkEn: 'Unlocks Plasma Energy Fountain in Coin Shop!'
  },
  {
    stage: 27,
    minStars: 24800,
    targetStars: 27800,
    titleVi: 'Lv.27: Hamster Chúa Tể Siêu Tân Tinh',
    titleEn: 'Lv.27: Supernova Lord Hamster',
    badgeVi: '🌟 Lv.27 • Siêu Tân Tinh (24800+ EXP)',
    badgeEn: '🌟 Lv.27 • Supernova (24800+ EXP)',
    perkVi: 'Tăng vọt điểm tiện nghi phòng & mở khóa pháo hoa Siêu Tân Tinh!',
    perkEn: 'Supernova Comfort Boost & cosmic fireworks!'
  },
  {
    stage: 28,
    minStars: 27800,
    targetStars: 31100,
    titleVi: 'Lv.28: Kỵ Sĩ Rồng Vàng Thần Thoại',
    titleEn: 'Lv.28: Mythic Golden Dragon Knight Hamster',
    badgeVi: '🐉 Lv.28 • Kỵ Sĩ Rồng Vàng (27800+ EXP)',
    badgeEn: '🐉 Lv.28 • Dragon Knight (27800+ EXP)',
    perkVi: 'Mở khóa Chủ đề 🐉 Cung Điện Rồng Vàng Thần Thoại & Đèn Lồng Rồng Vàng!',
    perkEn: 'Unlocks 🐉 Mythic Golden Dragon Palace Theme & Dragon Lantern!'
  },
  {
    stage: 29,
    minStars: 31100,
    targetStars: 34600,
    titleVi: 'Lv.29: Hamster Thánh Vương Vũ Trụ',
    titleEn: 'Lv.29: Cosmic Sovereign Monarch Hamster',
    badgeVi: '🔱 Lv.29 • Thánh Vương (31100+ EXP)',
    badgeEn: '🔱 Lv.29 • Sovereign (31100+ EXP)',
    perkVi: 'Mở khóa hào quang Thánh Vương rực rỡ chuẩn bị lên đỉnh Huyền Thoại Cấp 30!',
    perkEn: 'Unlocks Cosmic Sovereign Aura on the threshold of Level 30!'
  },
  {
    stage: 30,
    minStars: 34600,
    targetStars: 40000,
    titleVi: 'Lv.30: Vua Hamster Huyền Thoại Cấp 30',
    titleEn: 'Lv.30: Legendary Hamster King Lv.30',
    badgeVi: '👑 Lv.30 • Vua Huyền Thoại (34600+ EXP)',
    badgeEn: '👑 Lv.30 • Legendary King (34600+ EXP)',
    perkVi: 'Đỉnh cao Cấp 30! Mở khóa Ngai Vàng Rồng Thần Huyền Thoại & Hào Quang Vô Cực!',
    perkEn: 'Supreme Level 30! Unlocks Mythic Dragon King Throne & Infinity Aura!'
  }
];

export function getPetEvolutionInfo(expPoints: number, isHatched?: boolean) {
  const exp = Math.max(0, Math.round(Number(expPoints) || 0));

  // Find current stage from 30 down to 1
  let matchedStage = PET_EVOLUTION_STAGES[0];
  for (let i = PET_EVOLUTION_STAGES.length - 1; i >= 0; i--) {
    if (exp >= PET_EVOLUTION_STAGES[i].minStars) {
      matchedStage = PET_EVOLUTION_STAGES[i];
      break;
    }
  }

  const level = matchedStage.stage;
  let nextThreshold = matchedStage.targetStars;
  let progressPercent = 0;

  if (level === 1 && !isHatched && exp < EGG_HATCH_TARGET_STARS) {
    nextThreshold = EGG_HATCH_TARGET_STARS;
    progressPercent = Math.min(100, Math.round((exp / EGG_HATCH_TARGET_STARS) * 100));
  } else if (level === 30) {
    const extraSpan = Math.max(2000, exp - matchedStage.minStars + 1000);
    nextThreshold = matchedStage.minStars + extraSpan;
    progressPercent = 100;
  } else {
    const span = Math.max(1, matchedStage.targetStars - matchedStage.minStars);
    progressPercent = Math.min(100, Math.round(((exp - matchedStage.minStars) / span) * 100));
  }

  return {
    stage: level,
    level,
    meta: matchedStage,
    currentStars: exp,
    currentExp: exp,
    nextThreshold,
    progressPercent,
    hasHatAndGlasses: level >= 2,
    hasWingsAndGlow: level >= 7,
    hasVoiceCheerUnlocked: level >= 3
  };
}

export interface PetAccessoryItem {
  id: PetAccessoryId;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  emoji: string;
  costStars: number; // 0 for Group 1 (level gifts) or coin items, 5..40 for Group 2 (star shop items)
  costCoins?: number; // Optional pet coins cost (đ) for high-level Lv.16 -> Lv.30 items
  requiredLevel: PetLevelNumber;
  requiredExp: number;
  statBoostType: 'hunger' | 'happiness' | 'energy' | 'appearance' | 'all';
  statBoostAmount: number;
  category: 'room' | 'wearable';
  unlockMethod: 'level' | 'shop'; // 'level' = Nhóm 1 (Quà tặng tự động khi lên cấp), 'shop' = Nhóm 2 (Đồ mua bằng Sao/Xu)
  roomTier?: 'wall' | 'middle_left' | 'middle_right' | 'floor_center' | 'floor_left' | 'floor_right' | 'wearable';
}

export const PET_ROOM_ACCESSORIES: PetAccessoryItem[] = [
  // ============================================================================
  // NHÓM 1: QUÀ TẶNG TỰ ĐỘNG KHI LÊN CẤP (MIỄN PHÍ KHI ĐẠT LV.1 -> LV.20)
  // ============================================================================

  // --- Lv.1: Đĩa thức ăn, Bình nước, Nơ xinh cổ áo ---
  {
    id: 'food_bowl',
    nameVi: 'Đĩa thức ăn đầy hạt',
    nameEn: 'Seed Food Bowl',
    descVi: 'Quà tặng tự động Lv.1 • Đặt ở Sàn gỗ bên trái. Bấm vào hiện trái tim & cho Hamster ngồi măm măm (+20% No bụng)!',
    descEn: 'Free Lv.1 Gift • Placed on left floor. Tap for hearts & yummy seeds (+20% Fullness)!',
    emoji: '🥣',
    costStars: 0,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'hunger',
    statBoostAmount: 20,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'floor_left'
  },
  {
    id: 'water_fountain',
    nameVi: 'Bình nước mát lành',
    nameEn: 'Fresh Water Bottle',
    descVi: 'Quà tặng tự động Lv.1 • Đặt ở Sàn gỗ bên phải. Bấm vào hiện trái tim & âm thanh vui nhộn (+20% No bụng)!',
    descEn: 'Free Lv.1 Gift • Placed on right floor. Tap for hearts & fresh water (+20% Fullness)!',
    emoji: '💧',
    costStars: 0,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'hunger',
    statBoostAmount: 20,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'floor_right'
  },
  {
    id: 'cute_bow',
    nameVi: 'Nơ xinh cổ áo',
    nameEn: 'Cute Collar Bow',
    descVi: 'Quà tặng tự động Lv.1 • Đeo chiếc nơ hồng xinh xắn ngay cổ áo Chuột Hamster (+15% Vui vẻ)!',
    descEn: 'Free Lv.1 Gift • Cute pink bow on Hamster’s collar (+15% Happiness)!',
    emoji: '🎀',
    costStars: 0,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'appearance',
    statBoostAmount: 15,
    category: 'wearable',
    unlockMethod: 'level',
    roomTier: 'wearable'
  },

  // --- Lv.2: Thảm cỏ êm ái ---
  {
    id: 'grass_rug',
    nameVi: 'Thảm cỏ êm ái',
    nameEn: 'Soft Clover Grass Rug',
    descVi: 'Quà tặng tự động Lv.2 (100 EXP) • Thảm tròn êm ái lót dưới chân Chuột Hamster ở Tầng 3 (+20% Vui vẻ)!',
    descEn: 'Free Lv.2 Gift (100 EXP) • Soft circular rug under Hamster’s feet (+20% Happiness)!',
    emoji: '🍀',
    costStars: 0,
    requiredLevel: 2,
    requiredExp: 100,
    statBoostType: 'happiness',
    statBoostAmount: 20,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'floor_center'
  },

  // --- Lv.4: Vòng xoay chạy bộ, Nhà cầu vồng, Mũ bác học ---
  {
    id: 'hamster_wheel',
    nameVi: 'Vòng xoay chạy bộ',
    nameEn: 'Hamster Exercise Wheel',
    descVi: 'Quà tặng tự động Lv.4 (350 EXP) • Đặt bên phải Tầng 2. Bấm vào quay tròn 3 giây kèm Hamster nhảy chạy tập thể dục!',
    descEn: 'Free Lv.4 Gift (350 EXP) • Placed on right middle tier. Tap to spin for 3s while Hamster exercises!',
    emoji: '🎡',
    costStars: 0,
    requiredLevel: 4,
    requiredExp: 350,
    statBoostType: 'all',
    statBoostAmount: 25,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'middle_right'
  },
  {
    id: 'rainbow_house',
    nameVi: 'Nhà cầu vồng',
    nameEn: 'Rainbow Hamster House',
    descVi: 'Quà tặng tự động Lv.4 (350 EXP) • Đặt bên trái Tầng 2. Bấm vào phát sáng lấp lánh nhiều màu & bay sao nhỏ!',
    descEn: 'Free Lv.4 Gift (350 EXP) • Placed on left middle tier. Tap to glow with rainbow sparkles & stars!',
    emoji: '🏡',
    costStars: 0,
    requiredLevel: 4,
    requiredExp: 350,
    statBoostType: 'all',
    statBoostAmount: 25,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'middle_left'
  },
  {
    id: 'scholar_cap',
    nameVi: 'Mũ bác học',
    nameEn: 'Scholar Graduation Cap',
    descVi: 'Quà tặng tự động Lv.4 (350 EXP) • Đầu đội mũ tốt nghiệp Hamster Bác Học Thông Thái (+25% Vui vẻ)!',
    descEn: 'Free Lv.4 Gift (350 EXP) • Wise Scholar Graduation Cap on Hamster’s head (+25% Happiness)!',
    emoji: '🎓',
    costStars: 0,
    requiredLevel: 4,
    requiredExp: 350,
    statBoostType: 'appearance',
    statBoostAmount: 25,
    category: 'wearable',
    unlockMethod: 'level',
    roomTier: 'wearable'
  },

  // --- Lv.6: Kệ sách gỗ thông thái, Đồng hồ treo tường ---
  {
    id: 'mini_bookshelf',
    nameVi: 'Kệ sách gỗ thông thái',
    nameEn: 'Wise Wooden Bookshelf',
    descVi: 'Quà tặng tự động Lv.6 (800 EXP) • Treo ở Tầng 1 (Tường trên). Bấm vào để Hamster ngồi đọc sách thông thái (+25% Vui vẻ)!',
    descEn: 'Free Lv.6 Gift (800 EXP) • Mounted on upper wall. Tap for wise reading (+25% Happiness)!',
    emoji: '📚',
    costStars: 0,
    requiredLevel: 6,
    requiredExp: 800,
    statBoostType: 'happiness',
    statBoostAmount: 25,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'wall'
  },
  {
    id: 'wall_clock',
    nameVi: 'Đồng hồ treo tường',
    nameEn: 'Cuckoo Wall Clock',
    descVi: 'Quà tặng tự động Lv.6 (800 EXP) • Treo ở Tầng 1 (Tường trên), nhắc nhở bé sinh hoạt đúng giờ (+25% Năng lượng)!',
    descEn: 'Free Lv.6 Gift (800 EXP) • Wall clock on upper tier (+25% Energy)!',
    emoji: '🕰️',
    costStars: 0,
    requiredLevel: 6,
    requiredExp: 800,
    statBoostType: 'energy',
    statBoostAmount: 25,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'wall'
  },

  // --- Lv.8: Bàn học mini, Đèn bàn phát sáng ---
  {
    id: 'mini_study_desk',
    nameVi: 'Bàn học mini',
    nameEn: 'Mini Study Desk',
    descVi: 'Quà tặng tự động Lv.8 (1450 EXP) • Bàn học gỗ xinh xắn đặt ở Tầng 2 cho Hamster Bác Học ngồi học (+30% Vui vẻ)!',
    descEn: 'Free Lv.8 Gift (1450 EXP) • Cute mini study desk (+30% Happiness)!',
    emoji: '🪑',
    costStars: 0,
    requiredLevel: 8,
    requiredExp: 1450,
    statBoostType: 'happiness',
    statBoostAmount: 30,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'middle_right'
  },
  {
    id: 'glowing_desk_lamp',
    nameVi: 'Đèn bàn phát sáng',
    nameEn: 'Glowing Desk Lamp',
    descVi: 'Quà tặng tự động Lv.8 (1450 EXP) • Bấm vào để đổi màu ánh sáng ấm áp trong phòng (+30% Năng lượng)!',
    descEn: 'Free Lv.8 Gift (1450 EXP) • Tap to toggle warm cozy room lighting (+30% Energy)!',
    emoji: '💡',
    costStars: 0,
    requiredLevel: 8,
    requiredExp: 1450,
    statBoostType: 'energy',
    statBoostAmount: 30,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'middle_right'
  },

  // --- Lv.10: Vương miện vàng, Lâu đài pha lê ---
  {
    id: 'golden_crown',
    nameVi: 'Vương miện vàng',
    nameEn: 'Royal Golden Crown',
    descVi: 'Quà tặng tự động Lv.10 (2300 EXP) • Vương miện vàng rực rỡ đội trên đầu Siêu Hamster (+35% cả 3 chỉ số)!',
    descEn: 'Free Lv.10 Gift (2300 EXP) • Royal Golden Crown on Hamster’s head (+35% all stats)!',
    emoji: '👑',
    costStars: 0,
    requiredLevel: 10,
    requiredExp: 2300,
    statBoostType: 'all',
    statBoostAmount: 35,
    category: 'wearable',
    unlockMethod: 'level',
    roomTier: 'wearable'
  },
  {
    id: 'crystal_castle',
    nameVi: 'Lâu đài pha lê',
    nameEn: 'Fairy Crystal Castle',
    descVi: 'Quà tặng tự động Lv.10 (2300 EXP) • Lâu đài pha lê lấp lánh đặt trong phòng (+35% cả 3 chỉ số)!',
    descEn: 'Free Lv.10 Gift (2300 EXP) • Sparkling Crystal Castle in the room (+35% all stats)!',
    emoji: '🏰',
    costStars: 0,
    requiredLevel: 10,
    requiredExp: 2300,
    statBoostType: 'all',
    statBoostAmount: 35,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'middle_left'
  },

  // --- Lv.12: Thác nước hạt dẻ mini ---
  {
    id: 'mini_waterfall',
    nameVi: 'Thác nước hạt dẻ mini',
    nameEn: 'Mini Chestnut Waterfall',
    descVi: 'Quà tặng tự động Lv.12 (3350 EXP) • Suối nước mát lành chảy róc rách bên phải phòng (+35% Vui vẻ & Năng lượng)!',
    descEn: 'Free Lv.12 Gift (3350 EXP) • Refreshing mini waterfall (+35% Happiness & Energy)!',
    emoji: '⛲',
    costStars: 0,
    requiredLevel: 12,
    requiredExp: 3350,
    statBoostType: 'all',
    statBoostAmount: 35,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'middle_right'
  },

  // --- Lv.14: Kính thiên văn ngắm sao ---
  {
    id: 'star_telescope',
    nameVi: 'Kính thiên văn ngắm sao',
    nameEn: 'Starlight Telescope',
    descVi: 'Quà tặng tự động Lv.14 (4600 EXP) • Đặt ở Tầng 1 cạnh cửa sổ để Hamster ngắm các vì sao (+40% Độ vui vẻ)!',
    descEn: 'Free Lv.14 Gift (4600 EXP) • Starlight telescope on upper wall (+40% Happiness)!',
    emoji: '🔭',
    costStars: 0,
    requiredLevel: 14,
    requiredExp: 4600,
    statBoostType: 'happiness',
    statBoostAmount: 40,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'wall'
  },

  // --- Lv.16: Đệm mây cầu vồng ---
  {
    id: 'rainbow_cloud_bed',
    nameVi: 'Đệm mây cầu vồng',
    nameEn: 'Rainbow Cloud Cushion',
    descVi: 'Quà tặng tự động Lv.16 (6200 EXP) • Đệm mây bồng bềnh cho Hamster nằm nghỉ ngơi siêu êm (+40% Năng lượng)!',
    descEn: 'Free Lv.16 Gift (6200 EXP) • Floating rainbow cloud bed (+40% Energy)!',
    emoji: '☁️',
    costStars: 0,
    requiredLevel: 16,
    requiredExp: 6200,
    statBoostType: 'energy',
    statBoostAmount: 40,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'middle_left'
  },

  // --- Lv.18: Robot phục vụ hạt dẻ ---
  {
    id: 'nut_robot',
    nameVi: 'Robot phục vụ hạt dẻ',
    nameEn: 'Smart Chestnut Robot',
    descVi: 'Quà tặng tự động Lv.18 (8200 EXP) • Robot thông minh ở sàn phòng luôn mang hạt dẻ thơm phức cho Hamster (+45% cả 3 chỉ số)!',
    descEn: 'Free Lv.18 Gift (8200 EXP) • Smart robot serving chestnuts on the floor (+45% all stats)!',
    emoji: '🤖',
    costStars: 0,
    requiredLevel: 18,
    requiredExp: 8200,
    statBoostType: 'all',
    statBoostAmount: 45,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'floor_left'
  },

  // --- Lv.20: Ngai vàng Vũ Trụ ---
  {
    id: 'cosmic_throne',
    nameVi: 'Ngai vàng Vũ Trụ Lv.20',
    nameEn: 'Supreme Cosmic Throne',
    descVi: 'Quà tặng tự động Lv.20 (10700 EXP) • Ngai vàng Ngân Hà đặt trang trọng trong phòng (+50% cả 3 chỉ số)!',
    descEn: 'Free Lv.20 Gift (10700 EXP) • Legendary Cosmic Throne (+50% all stats)!',
    emoji: '🪐',
    costStars: 0,
    requiredLevel: 20,
    requiredExp: 10700,
    statBoostType: 'all',
    statBoostAmount: 50,
    category: 'room',
    unlockMethod: 'level',
    roomTier: 'middle_left'
  },

  // ============================================================================
  // NHÓM 2: ĐỒ ĐẶC BIỆT BÉ TỰ DÙNG ĐIỂM THƯỞNG (SAO / XU NHIỆM VỤ) MUA TRONG CỬA HÀNG
  // Bảng giá Sao (5 ⭐ -> 40 ⭐) & Đồ Cấp Cao Lv.16 -> Lv.30 mua bằng Xu làm nhiệm vụ (đ)
  // ============================================================================
  {
    id: 'toy_ball',
    nameVi: 'Quả bóng sặc sỡ',
    nameEn: 'Colorful Toy Ball',
    descVi: 'Đồ đặc biệt Cửa hàng (5 ⭐) • Đặt trên sàn phòng. Bấm vào cho Hamster tâng bóng vui nhộn (+20% Độ vui vẻ)!',
    descEn: 'Special Shop Item (5 ⭐) • Placed on floor. Tap for playful ball bounce (+20% Happiness)!',
    emoji: '⚽',
    costStars: 5,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'happiness',
    statBoostAmount: 20,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'floor_left'
  },
  {
    id: 'cozy_bed',
    nameVi: 'Giường ngủ bông',
    nameEn: 'Fluffy Cotton Bed',
    descVi: 'Đồ đặc biệt Cửa hàng (8 ⭐) • Giường bông êm ái trong phòng giúp Hamster nghỉ ngơi (+25% Năng lượng)!',
    descEn: 'Special Shop Item (8 ⭐) • Fluffy cotton bed for cozy naps (+25% Energy)!',
    emoji: '🛏️',
    costStars: 8,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'energy',
    statBoostAmount: 25,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'middle_left'
  },
  {
    id: 'hat_glasses',
    nameVi: 'Kính râm siêu ngầu',
    nameEn: 'Super Cool Sunglasses',
    descVi: 'Đồ đặc biệt Cửa hàng (10 ⭐) • Đeo kính râm siêu ngầu lên khuôn mặt bầu bĩnh của Hamster (+25% Vui vẻ)!',
    descEn: 'Special Shop Item (10 ⭐) • Cool sunglasses worn directly on Hamster’s face (+25% Happiness)!',
    emoji: '🕶️',
    costStars: 10,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'appearance',
    statBoostAmount: 25,
    category: 'wearable',
    unlockMethod: 'shop',
    roomTier: 'wearable'
  },
  {
    id: 'sunflower_pot',
    nameVi: 'Chậu hoa hướng dương',
    nameEn: 'Sunny Sunflower Pot',
    descVi: 'Đồ đặc biệt Cửa hàng (15 ⭐) • Chậu hoa hướng dương rực rỡ tỏa hương trong phòng (+25% Vui vẻ & No bụng)!',
    descEn: 'Special Shop Item (15 ⭐) • Bright sunflower pot in the room (+25% Happiness & Fullness)!',
    emoji: '🌻',
    costStars: 15,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'all',
    statBoostAmount: 25,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'middle_right'
  },
  {
    id: 'mini_guitar',
    nameVi: 'Đàn guitar mini',
    nameEn: 'Mini Acoustic Guitar',
    descVi: 'Đồ đặc biệt Cửa hàng (18 ⭐) • Bấm vào để Hamster gảy đàn ngân vang nốt nhạc (+30% Độ vui vẻ)!',
    descEn: 'Special Shop Item (18 ⭐) • Tap for Hamster to strum cheerful music notes (+30% Happiness)!',
    emoji: '🎸',
    costStars: 18,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'happiness',
    statBoostAmount: 30,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'floor_left'
  },
  {
    id: 'camping_tent',
    nameVi: 'Lều cắm trại',
    nameEn: 'Cozy Camping Tent',
    descVi: 'Đồ đặc biệt Cửa hàng (25 ⭐) • Lều cắm trại dã ngoại ấm cúng ở Tầng 2 (+30% Năng lượng & Vui vẻ)!',
    descEn: 'Special Shop Item (25 ⭐) • Cozy adventure camping tent (+30% Energy & Happiness)!',
    emoji: '⛺',
    costStars: 25,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'all',
    statBoostAmount: 30,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'middle_left'
  },
  {
    id: 'star_projector',
    nameVi: 'Máy chiếu sao đêm',
    nameEn: 'Night Star Projector',
    descVi: 'Đồ đặc biệt Cửa hàng (35 ⭐) • Bấm vào để đổi ánh sáng phòng & chiếu bầu trời ngàn sao (+35% cả 3 chỉ số)!',
    descEn: 'Special Shop Item (35 ⭐) • Tap to switch room ambiance & project starry night sky (+35% all stats)!',
    emoji: '🔮',
    costStars: 35,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'all',
    statBoostAmount: 35,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'wall'
  },
  {
    id: 'mini_skateboard',
    nameVi: 'Ván trượt mini',
    nameEn: 'Mini Pro Skateboard',
    descVi: 'Đồ đặc biệt Cửa hàng (40 ⭐) • Đặt trên sàn phòng, bấm vào cho Hamster lướt ván siêu đỉnh (+40% cả 3 chỉ số)!',
    descEn: 'Special Shop Item (40 ⭐) • Tap for Hamster to ride the mini skateboard (+40% all stats)!',
    emoji: '🛹',
    costStars: 40,
    requiredLevel: 1,
    requiredExp: 0,
    statBoostType: 'all',
    statBoostAmount: 40,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'floor_right'
  },

  // ============================================================================
  // ĐỒ NỘI THẤT & PHỤ KIỆN CẤP CAO (MỞ KHÓA Ở LV.16, 18, 20, 22, 24, 26, 28, 30)
  // Mua bằng Tiền Xu nuôi thú (đ) kiếm được từ làm nhiệm vụ hằng ngày!
  // ============================================================================
  {
    id: 'coral_aquarium',
    nameVi: 'Bể cá San Hô phát sáng',
    nameEn: 'Glowing Coral Aquarium',
    descVi: 'Mở khóa ở Lv.16 (6200 EXP • Mua bằng 150đ Xu nhiệm vụ) • Bể san hô đại dương lung linh bên phải phòng (+40% Vui vẻ & Năng lượng)!',
    descEn: 'Unlocks at Lv.16 (6200 EXP • 150đ Coins) • Glowing coral reef aquarium (+40% Happiness & Energy)!',
    emoji: '🐠',
    costStars: 0,
    costCoins: 150,
    requiredLevel: 16,
    requiredExp: 6200,
    statBoostType: 'all',
    statBoostAmount: 40,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'middle_right'
  },
  {
    id: 'magic_cauldron',
    nameVi: 'Nồi giả kim Phép Thuật',
    nameEn: 'Magic Alchemy Cauldron',
    descVi: 'Mở khóa ở Lv.18 (8200 EXP • Mua bằng 200đ Xu nhiệm vụ) • Nồi phép thuật tỏa khói sao lấp lánh trên sàn phòng (+45% cả 3 chỉ số)!',
    descEn: 'Unlocks at Lv.18 (8200 EXP • 200đ Coins) • Sparkling magic potion cauldron (+45% all stats)!',
    emoji: '⚗️',
    costStars: 0,
    costCoins: 200,
    requiredLevel: 18,
    requiredExp: 8200,
    statBoostType: 'all',
    statBoostAmount: 45,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'floor_left'
  },
  {
    id: 'galaxy_piano',
    nameVi: 'Đàn Dương Cầm Ngân Hà',
    nameEn: 'Galaxy Grand Piano',
    descVi: 'Mở khóa ở Lv.20 (10700 EXP • Mua bằng 260đ Xu nhiệm vụ) • Đàn piano pha lê phát nhạc giao hưởng vũ trụ (+45% Độ vui vẻ)!',
    descEn: 'Unlocks at Lv.20 (10700 EXP • 260đ Coins) • Crystal grand piano playing cosmic melodies (+45% Happiness)!',
    emoji: '🎹',
    costStars: 0,
    costCoins: 260,
    requiredLevel: 20,
    requiredExp: 10700,
    statBoostType: 'happiness',
    statBoostAmount: 45,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'middle_right'
  },
  {
    id: 'wizard_cloak',
    nameVi: 'Áo choàng Pháp Sư Tinh Tú',
    nameEn: 'Starlight Archmage Cloak',
    descVi: 'Mở khóa ở Lv.22 (13850 EXP • Mua bằng 320đ Xu nhiệm vụ) • Trang phục Đại Pháp Sư lấp lánh ánh sao cho Hamster (+50% Vui vẻ)!',
    descEn: 'Unlocks at Lv.22 (13850 EXP • 320đ Coins) • Starlight Archmage cloak for Hamster (+50% Happiness)!',
    emoji: '🧙',
    costStars: 0,
    costCoins: 320,
    requiredLevel: 22,
    requiredExp: 13850,
    statBoostType: 'appearance',
    statBoostAmount: 50,
    category: 'wearable',
    unlockMethod: 'shop',
    roomTier: 'wearable'
  },
  {
    id: 'cyber_hoverboard',
    nameVi: 'Ván trượt Đệm Từ Trường',
    nameEn: 'Cyber Mag-Lev Hoverboard',
    descVi: 'Mở khóa ở Lv.24 (17600 EXP • Mua bằng 380đ Xu nhiệm vụ) • Ván trượt bay không trọng lực siêu ngầu trên sàn phòng (+50% cả 3 chỉ số)!',
    descEn: 'Unlocks at Lv.24 (17600 EXP • 380đ Coins) • Futuristic zero-gravity hoverboard (+50% all stats)!',
    emoji: '🛸',
    costStars: 0,
    costCoins: 380,
    requiredLevel: 24,
    requiredExp: 17600,
    statBoostType: 'all',
    statBoostAmount: 50,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'floor_right'
  },
  {
    id: 'plasma_fountain',
    nameVi: 'Đài phun nước Năng Lượng Plasma',
    nameEn: 'Plasma Energy Fountain',
    descVi: 'Mở khóa ở Lv.26 (22100 EXP • Mua bằng 450đ Xu nhiệm vụ) • Đài phun ánh sáng kim cương nạp đầy năng lượng vũ trụ (+55% Năng lượng & Vui vẻ)!',
    descEn: 'Unlocks at Lv.26 (22100 EXP • 450đ Coins) • Diamond plasma fountain (+55% Energy & Happiness)!',
    emoji: '💎',
    costStars: 0,
    costCoins: 450,
    requiredLevel: 26,
    requiredExp: 22100,
    statBoostType: 'all',
    statBoostAmount: 55,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'middle_right'
  },
  {
    id: 'dragon_lantern',
    nameVi: 'Đèn lồng Rồng Vàng Thần Thoại',
    nameEn: 'Mythic Golden Dragon Lantern',
    descVi: 'Mở khóa ở Lv.28 (27800 EXP • Mua bằng 520đ Xu nhiệm vụ) • Treo trên tường thượng điện tỏa hào quang Rồng Vàng (+55% cả 3 chỉ số)!',
    descEn: 'Unlocks at Lv.28 (27800 EXP • 520đ Coins) • Golden Dragon wall lantern (+55% all stats)!',
    emoji: '🏮',
    costStars: 0,
    costCoins: 520,
    requiredLevel: 28,
    requiredExp: 27800,
    statBoostType: 'all',
    statBoostAmount: 55,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'wall'
  },
  {
    id: 'golden_dragon_throne',
    nameVi: 'Ngai Vàng Rồng Thần Cấp 30',
    nameEn: 'Legendary Dragon King Throne Lv.30',
    descVi: 'Đỉnh cao Huyền Thoại Lv.30 (34600 EXP • Mua bằng 600đ Xu nhiệm vụ) • Bảo tọa Vua Hamster Huyền Thoại Cấp 30 (+60% cả 3 chỉ số)!',
    descEn: 'Legendary Lv.30 Peak (34600 EXP • 600đ Coins) • Mythic Dragon King Throne (+60% all stats)!',
    emoji: '🐉',
    costStars: 0,
    costCoins: 600,
    requiredLevel: 30,
    requiredExp: 34600,
    statBoostType: 'all',
    statBoostAmount: 60,
    category: 'room',
    unlockMethod: 'shop',
    roomTier: 'middle_left'
  }
];

export function getAutoUnlockedAccessoriesForLevel(level: number): PetAccessoryId[] {
  return PET_ROOM_ACCESSORIES.filter(
    (item) => item.unlockMethod === 'level' && item.requiredLevel <= level
  ).map((item) => item.id);
}

export function getPetSpeciesMeta(_species?: PetSpecies | string, _name?: string): PetSpeciesOption {
  return PET_SPECIES_LIST[0];
}
