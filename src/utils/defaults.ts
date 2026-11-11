import { AppState, DayRecord, Task, Reward, Challenge, Badge, DisciplineRule, DisciplineLog, DisciplinePrinciple } from '../types';
import { DEFAULT_HERO_AVATAR_URL } from './avatars';
import { CUTE_HAMSTER_AVATAR_URL } from './pets';

export const INITIAL_TASKS: Task[] = [
  // Morning Quests (4/4 Completed Today!)
  {
    id: 'm1',
    title: 'Thức dậy đúng giờ & mỉm cười',
    titleEn: 'Wake up on time with a smile',
    description: 'Bé dậy ngay khi chuông báo thức reo, không nhõng nhẽo nè!',
    descriptionEn: 'Get out of bed right away without whining!',
    category: 'morning',
    habitGroup: 'self_care',
    tag: 'routine',
    stars: 1,
    xp: 5,
    timeExpected: '06:30',
    iconName: 'Sun',
    isCompleted: true,
    pendingApproval: false,
    completedAt: '06:30',
    voicePromptVi: 'Tuyệt vời lắm bé ơi! Thức dậy đúng giờ giúp bé luôn khỏe mạnh và tràn đầy năng lượng!',
    voicePromptEn: 'Awesome job! Waking up on time gives you super energy for the day!'
  },
  {
    id: 'm2',
    title: 'Đánh răng sạch & rửa mặt tươi tỉnh',
    titleEn: 'Brush teeth & wash face',
    description: 'Chải răng 2 phút cho răng trắng xinh, nụ cười rạng rỡ.',
    descriptionEn: 'Brush for 2 full minutes for shiny white teeth and fresh breath.',
    category: 'morning',
    habitGroup: 'self_care',
    tag: 'hygiene',
    stars: 1,
    xp: 5,
    timeExpected: '06:45',
    iconName: 'Sparkles',
    isCompleted: true,
    pendingApproval: false,
    completedAt: '06:45',
    voicePromptVi: 'Răng của bé sáng lấp lánh rồi! Bạn sâu răng phải chạy mất dép!',
    voicePromptEn: 'Your teeth are shining bright! Cavity monsters are running away!'
  },
  {
    id: 'm3',
    title: 'Tự gấp chăn gối & xếp giường gọn gàng',
    titleEn: 'Make your bed neatly',
    description: 'Vuốt phẳng ga giường và xếp chăn gối thật ngay ngắn.',
    descriptionEn: 'Straighten your blanket and fluff your pillow nicely.',
    category: 'morning',
    habitGroup: 'self_care',
    tag: 'chore',
    stars: 1,
    xp: 5,
    timeExpected: '07:00',
    iconName: 'BedDouble',
    isCompleted: true,
    pendingApproval: false,
    completedAt: '07:00',
    voicePromptVi: 'Căn phòng của bé thật ngăn nắp! Bé tự lập giỏi quá đi mất!',
    voicePromptEn: 'Your bed looks so neat and tidy! You are becoming so independent!'
  },
  {
    id: 'm4',
    title: 'Ăn sáng ngoan & uống 1 cốc nước ấm',
    titleEn: 'Healthy breakfast & warm water',
    description: 'Ăn hết phần ăn sáng mẹ chuẩn bị, không để thừa thức ăn.',
    descriptionEn: 'Enjoy your nutritious breakfast and drink clean water.',
    category: 'morning',
    habitGroup: 'health_sport',
    tag: 'health',
    stars: 1,
    xp: 5,
    timeExpected: '07:15',
    iconName: 'Utensils',
    isCompleted: true,
    pendingApproval: false,
    completedAt: '07:15',
    voicePromptVi: 'Bé ăn ngoan sẽ cao lớn và thông minh vượt trội đó!',
    voicePromptEn: 'Eating healthy makes your brain strong and your body tall!'
  },
  {
    id: 'm5',
    title: 'Pha cà phê sáng cho mẹ',
    titleEn: 'Make morning coffee for Mom',
    description: 'Tự giác phụ mẹ pha ly cà phê sáng thơm ngon mỗi ngày.',
    descriptionEn: 'Thoughtfully prepare a warm morning cup of coffee for Mom.',
    category: 'morning',
    habitGroup: 'family_help',
    tag: 'chore',
    stars: 1,
    xp: 5,
    timeExpected: '07:30',
    iconName: 'Heart',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Con yêu chu đáo quá! Ly cà phê sáng của con làm mẹ vui suốt cả ngày!',
    voicePromptEn: 'So thoughtful! Your morning coffee makes Mom smile all day!'
  },

  // Afternoon Quests
  {
    id: 'a1',
    title: 'Chào người lớn & để giày dép gọn gàng',
    titleEn: 'Greet elders & put shoes in rack',
    description: 'Đi học về khoanh tay chào ông bà bố mẹ, để giày dép vào kệ.',
    descriptionEn: 'Greet your family warmly and place shoes neatly on the rack.',
    category: 'afternoon',
    habitGroup: 'self_care',
    tag: 'routine',
    stars: 1,
    xp: 5,
    timeExpected: '16:45',
    iconName: 'HeartHandshake',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Bé thật ngoan ngoãn và lễ phép! Bố mẹ rất tự hào về bé!',
    voicePromptEn: 'You are so polite and organized! Mom and Dad are super proud!'
  },
  {
    id: 'a2',
    title: 'Rửa tay xà phòng & thay quần áo ở nhà',
    titleEn: 'Wash hands with soap & change clothes',
    description: 'Rửa sạch 6 bước để đánh bay vi khuẩn sau ngày dài đi học.',
    descriptionEn: 'Wash hands properly with soap to keep all germs away.',
    category: 'afternoon',
    habitGroup: 'health_sport',
    tag: 'hygiene',
    stars: 1,
    xp: 5,
    timeExpected: '17:00',
    iconName: 'ShieldCheck',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Đôi bàn tay sạch sẽ giúp bé phòng chống bệnh tật cực tốt!',
    voicePromptEn: 'Clean hands keep you safe, healthy, and ready to play!'
  },
  {
    id: 'a3',
    title: 'Tự giác hoàn thành bài tập về nhà',
    titleEn: 'Finish daily homework on time',
    description: 'Ngồi ngay ngắn, tập trung hoàn thành các bài cô giao hôm nay.',
    descriptionEn: 'Sit straight, focus well, and solve today assignments.',
    category: 'afternoon',
    habitGroup: 'study',
    tag: 'study',
    stars: 1,
    xp: 5,
    timeExpected: '15:30',
    iconName: 'Pencil',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Bác học nhí tuyệt đỉnh! Bé hoàn thành bài tập siêu nhanh và chính xác!',
    voicePromptEn: 'Brilliant student! You finished your homework like a champion!'
  },
  {
    id: 'a4',
    title: 'Đọc sách truyện bồi dưỡng trí tuệ 20 phút',
    titleEn: 'Read a book for 20 minutes',
    description: 'Khám phá thế giới qua những trang sách bổ ích và lý thú.',
    descriptionEn: 'Discover exciting new worlds through books and stories.',
    category: 'afternoon',
    habitGroup: 'study',
    tag: 'study',
    stars: 1,
    xp: 5,
    timeExpected: '16:15',
    iconName: 'BookOpen',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Đọc sách giúp trí tưởng tượng của bé bay cao bay xa!',
    voicePromptEn: 'Reading opens up wonderful adventures in your imagination!'
  },
  {
    id: 'a5',
    title: 'Tự giác học bài',
    titleEn: 'Study independently with focus',
    description: 'Ngồi ngay ngắn, tập trung hoàn thành bài vở.',
    descriptionEn: 'Sit neatly and focus on completing your lessons and study tasks.',
    category: 'afternoon',
    habitGroup: 'study',
    tag: 'study',
    stars: 1,
    xp: 5,
    timeExpected: '16:30',
    iconName: 'BookOpen',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Tinh thần tự giác học bài của con thật đáng khen ngợi!',
    voicePromptEn: 'Your independent study habit is truly admirable!'
  },

  // Evening Quests
  {
    id: 'e1',
    title: 'Phụ giúp dọn cơm & cất dọn đồ chơi',
    titleEn: 'Help set dinner & tidy toys',
    description: 'Lấy đũa thìa dọn bàn cơm và cất gọn đồ chơi vào thùng.',
    descriptionEn: 'Set the spoons and plates, and put toys back into the box.',
    category: 'evening',
    habitGroup: 'family_help',
    tag: 'chore',
    stars: 1,
    xp: 5,
    timeExpected: '19:15',
    iconName: 'HelpingHand',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Bé là trợ thủ đắc lực của gia đình! Cảm ơn con yêu nhiều!',
    voicePromptEn: 'You are the best little helper! Thank you so much sweetie!'
  },
  {
    id: 'e5',
    title: 'Phụ ba dọn dẹp',
    titleEn: 'Help Dad tidy up',
    description: 'Phụ giúp sắp xếp đồ đạc gọn gàng.',
    descriptionEn: 'Help Dad organize and tidy up household items neatly.',
    category: 'evening',
    habitGroup: 'family_help',
    tag: 'chore',
    stars: 1,
    xp: 5,
    timeExpected: '19:30',
    iconName: 'HelpingHand',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Con phụ ba dọn dẹp giỏi quá! Nhà cửa gọn gàng sáng bóng luôn!',
    voicePromptEn: 'Great job helping Dad tidy up! The house looks so neat!'
  },
  {
    id: 'e6',
    title: 'Đổ rác',
    titleEn: 'Take out the trash',
    description: 'Mang rác bỏ đúng nơi quy định giúp gia đình.',
    descriptionEn: 'Take the trash bag to the proper collection spot for the family.',
    category: 'evening',
    habitGroup: 'family_help',
    tag: 'chore',
    stars: 1,
    xp: 5,
    timeExpected: '19:45',
    iconName: 'Sparkles',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Hoan hô hiệp sĩ nhí biết phụ giúp gia đình đổ rác đúng nơi quy định!',
    voicePromptEn: 'Hooray for helping the family take out the trash cleanly!'
  },
  {
    id: 'e2',
    title: 'Tập trung bữa ăn tối thật ngoan',
    titleEn: 'Pack backpack for tomorrow',
    description: 'Kiểm tra hộp bút, sách giáo khoa và bình nước chuẩn bị sẵn sàng.',
    descriptionEn: 'Double check pencil case, notebooks, and water bottle.',
    category: 'evening',
    habitGroup: 'self_care',
    tag: 'routine',
    stars: 1,
    xp: 5,
    timeExpected: '20:30',
    iconName: 'Briefcase',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Chuẩn bị trước giúp ngày mai đi học thật thảnh thơi và tự tin!',
    voicePromptEn: 'Ready for tomorrow! You will have a wonderful school day!'
  },
  {
    id: 'e3',
    title: 'Đánh răng tối & rửa chân sạch sẽ',
    titleEn: 'Night toothbrush & clean feet',
    description: 'Chải răng trước khi ngủ để bảo vệ nụ cười khỏe đẹp.',
    descriptionEn: 'Brush teeth well before bed to protect your lovely smile.',
    category: 'evening',
    habitGroup: 'self_care',
    tag: 'hygiene',
    stars: 1,
    xp: 5,
    timeExpected: '21:00',
    iconName: 'Smile',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Thơm tho và sạch sẽ rồi! Giấc mơ đẹp đang đón chờ bé!',
    voicePromptEn: 'All squeaky clean! Sweet and magical dreams await you!'
  },
  {
    id: 'e4',
    title: 'Lên giường đi ngủ đúng giờ trước 21h30',
    titleEn: 'Sleep on time before 9:30 PM',
    description: 'Tắt đèn, không dùng điện thoại hay tivi, nhắm mắt ngủ ngoan.',
    descriptionEn: 'Lights off, screens away, rest well for growing taller.',
    category: 'evening',
    habitGroup: 'self_care',
    tag: 'routine',
    stars: 1,
    xp: 5,
    timeExpected: '21:30',
    iconName: 'Moon',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Chúc bé ngủ ngon và có những giấc mơ thần tiên thật đẹp!',
    voicePromptEn: 'Good night little champion! Dream sweet dreams tonight!'
  },

  // Bonus Challenges
  {
    id: 'b1',
    title: 'Uống đủ 1.5 lít nước ấm trong ngày',
    titleEn: 'Drink 1.5 liters of clean water',
    description: 'Uống từng ngụm nhỏ, giúp cơ thể khỏe mạnh và mắt sáng tinh anh.',
    descriptionEn: 'Stay hydrated all day long for glowing energy and focus.',
    category: 'bonus',
    habitGroup: 'health_sport',
    tag: 'health',
    stars: 1,
    xp: 5,
    iconName: 'Droplets',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Uống đủ nước là thói quen của các siêu anh hùng đó bé nha!',
    voicePromptEn: 'Drinking water gives superhero stamina to your body!'
  },
  {
    id: 'b2',
    title: 'Học thuộc 5 từ vựng tiếng Anh mới',
    titleEn: 'Learn 5 new English words',
    description: 'Đọc to và ghi nhớ 5 từ mới trong bài học hôm nay.',
    descriptionEn: 'Pronounce and remember 5 new English vocabulary words.',
    category: 'bonus',
    habitGroup: 'study',
    tag: 'study',
    stars: 1,
    xp: 5,
    iconName: 'Languages',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Bé nói tiếng Anh siêu đỉnh! Càng học càng giỏi giang nha!',
    voicePromptEn: 'Awesome bilingual champion! Your English is improving so fast!'
  },
  {
    id: 'b3',
    title: 'Vận động thể dục / nhảy dây 15 phút',
    titleEn: 'Exercise or jump rope 15 mins',
    description: 'Đổ mồ hôi một chút giúp xương chắc khỏe và tăng chiều cao.',
    descriptionEn: 'Have active fun with jumping rope or stretching exercises.',
    category: 'bonus',
    habitGroup: 'health_sport',
    tag: 'health',
    stars: 1,
    xp: 5,
    iconName: 'Activity',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Vận động thể thao giúp bé dễo dai và tràn đầy năng lượng tích cực!',
    voicePromptEn: 'High five! Active body leads to a sharp and happy mind!'
  },
  {
    id: 'b4',
    title: 'Nói lời yêu thương & ôm ba mẹ',
    titleEn: 'Say "I love you" & hug parents',
    description: 'Gửi một cái ôm ấm áp và lời cảm ơn chân thành đến người thân.',
    descriptionEn: 'Give a warm hug and say thank you to mom and dad.',
    category: 'bonus',
    habitGroup: 'family_help',
    tag: 'chore',
    stars: 1,
    xp: 5,
    iconName: 'Heart',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Lời yêu thương của bé làm ấm áp cả gia đình! Bố mẹ yêu con vô cùng!',
    voicePromptEn: 'Your warm hug melts our hearts! We love you so much!'
  },
  {
    id: 'custom_1794047307550',
    title: 'Tắm gội sạch sẽ trước 19h00',
    titleEn: 'Tắm gội sạch sẽ trước 19h00',
    description: 'Nhiệm vụ rèn luyện do bố mẹ giao',
    descriptionEn: 'Daily chore assigned by parents',
    category: 'evening',
    habitGroup: 'self_care',
    tag: 'hygiene',
    stars: 1,
    xp: 5,
    timeExpected: '18:30',
    iconName: 'Sparkles',
    isCompleted: false,
    pendingApproval: false,
    voicePromptVi: 'Bé đã hoàn thành Tắm gội sạch sẽ trước 19h00! Ba mẹ rất tự hào về bé!',
    voicePromptEn: 'Great job completing Tắm gội sạch sẽ trước 19h00! Keep it up!'
  }
];

export const INITIAL_REWARDS: Reward[] = [
  // Nhóm 1: Quà Nhỏ Vui Vẻ (5 - 15 ⭐)
  {
    id: 'r1',
    title: 'Xem hoạt hình yêu thích 20 phút',
    titleEn: '20 mins of favorite cartoon time',
    description: 'Thưởng thức tập phim hoạt hình Doraemon, Conan hoặc Paw Patrol sau giờ học.',
    descriptionEn: 'Enjoy 20 minutes watching your favorite animated series.',
    cost: 10,
    icon: 'Tv',
    status: 'available'
  },
  {
    id: 'r_dinner_pick',
    title: 'Tự chọn món ăn tối yêu thích',
    titleEn: 'Pick tonight’s favorite dinner dish',
    description: 'Bé được làm "Bếp trưởng nhí" chọn món ngon cho bữa cơm tối của cả nhà.',
    descriptionEn: 'Choose your favorite dish for family dinner tonight.',
    cost: 15,
    icon: 'Pizza',
    status: 'available'
  },
  // Nhóm 2: Quà Tuần Xứng Đáng (20 - 50 ⭐)
  {
    id: 'r3',
    title: 'Đi nhà sách chọn 1 cuốn truyện tranh mới',
    titleEn: 'Visit bookstore & pick 1 new comic/book',
    description: 'Ba Nhân và Mẹ Ty sẽ cùng bé ra nhà sách chọn cuốn truyện bé thích.',
    descriptionEn: 'Visit the bookstore with parents to pick a brand new storybook.',
    cost: 30,
    icon: 'Book',
    status: 'available'
  },
  {
    id: 'r5',
    title: 'Đi công viên cuối tuần cùng Ba Nhân và Mẹ Ty',
    titleEn: 'Weekend park outing with Mom & Dad',
    description: 'Một buổi dạo chơi công viên, đạp xe và chơi trò chơi ngoài trời thật vui!',
    descriptionEn: 'A joyful weekend park trip with Mom and Dad.',
    cost: 35,
    icon: 'FerrisWheel',
    status: 'available'
  },
  {
    id: 'r4',
    title: 'Bữa tiệc Pizza / Gà rán cuối tuần',
    titleEn: 'Weekend Pizza or Fried Chicken feast',
    description: 'Cả nhà sẽ cùng thưởng thức bữa tiệc đặc biệt bé lựa chọn!',
    descriptionEn: 'The whole family will feast on your favorite weekend treat!',
    cost: 45,
    icon: 'Pizza',
    status: 'available'
  },
  // Nhóm 3: Quà Lớn Siêu Cấp (100+ ⭐)
  {
    id: 'r6',
    title: 'Bộ đồ chơi Lego / Đồ chơi mơ ước',
    titleEn: 'Dream Lego set or special toy',
    description: 'Phần thưởng vĩ đại cho chuỗi ngày nỗ lực tự lập phi thường của Hiệp sĩ Cơ Minh!',
    descriptionEn: 'Ultimate reward for great dedication and wonderful self-discipline!',
    cost: 120,
    icon: 'Gift',
    status: 'available'
  },
  {
    id: 'r7',
    title: 'Chuyến đi chơi xa / Khu vui chơi lớn cùng gia đình',
    titleEn: 'Big family trip or theme park adventure',
    description: 'Chuyến phiêu lưu đáng nhớ cuối tháng dành cho Siêu Anh Hùng xuất sắc nhất!',
    descriptionEn: 'Unforgettable family adventure trip for our Super Hero!',
    cost: 200,
    icon: 'FerrisWheel',
    status: 'available'
  }
];

export const LEGACY_DEFAULT_CHALLENGE_IDS = new Set<string>([
  'c1',
  'c2',
  'c3',
  'ch_1794036371260_kuw2',
  'ch_1794036373552_ssab',
  'ch_1794036379772_04yr',
  'chal_1794041721814',
  'chal_1794041742024',
  'chal_1794041760824',
  'ch_1794104349971',
  'ch_1794104504481'
]);

export const INITIAL_CHALLENGES: Challenge[] = [];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'b_morning',
    title: 'Vua Dậy Sớm',
    titleEn: 'Early Bird Champion',
    description: 'Dậy đúng giờ 5 ngày liên tiếp',
    descriptionEn: 'Wake up on time for 5 consecutive days',
    icon: 'Sun',
    unlocked: true,
    unlockedAt: '2026-11-01',
    requiredCount: 5,
    currentCount: 5,
    category: 'morning'
  },
  {
    id: 'b_streak7',
    title: 'Chiến Binh Bền Bỉ',
    titleEn: '7-Day Streak Knight',
    description: 'Duy trì chuỗi hoàn thành nhiệm vụ 7 ngày',
    descriptionEn: 'Maintain a 7-day daily quest streak',
    icon: 'Flame',
    unlocked: false,
    requiredCount: 7,
    currentCount: 2,
    category: 'streak'
  },
  {
    id: 'b_scholar',
    title: 'Bác Học Nhí',
    titleEn: 'Little Professor',
    description: 'Hoàn thành 15 nhiệm vụ học tập & đọc sách',
    descriptionEn: 'Complete 15 study and book reading quests',
    icon: 'BookOpen',
    unlocked: true,
    unlockedAt: '2026-11-03',
    requiredCount: 15,
    currentCount: 15,
    category: 'reading'
  },
  {
    id: 'b_helper',
    title: 'Trợ Thủ Đắc Lực',
    titleEn: 'Super Family Helper',
    description: 'Giúp đỡ ba mẹ 10 lần việc nhà',
    descriptionEn: 'Help parents with household chores 10 times',
    icon: 'Heart',
    unlocked: false,
    requiredCount: 10,
    currentCount: 6,
    category: 'helper'
  },
  {
    id: 'b_star100',
    title: 'Triệu Phú Ngôi Sao',
    titleEn: 'Star Master 100',
    description: 'Tích lũy được tổng cộng 100 ngôi sao lấp lánh',
    descriptionEn: 'Earn a total of 100 shining stars',
    icon: 'Star',
    unlocked: true,
    unlockedAt: '2026-11-04',
    requiredCount: 100,
    currentCount: 170,
    category: 'stars'
  }
];

export const INITIAL_DISCIPLINE_RULES: DisciplineRule[] = [
  {
    id: 'rule_screen',
    title: 'Xem tivi / điện thoại quá giờ quy định',
    titleEn: 'Excessive screen / TV time over limit',
    description: 'Không tự giác tắt màn hình khi đã hết giờ thỏa thuận với ba mẹ',
    descriptionEn: 'Refusing to turn off device when agreed timer ends',
    penaltyStars: 5,
    icon: '📺'
  },
  {
    id: 'rule_tantrum',
    title: 'Nói to, gắt gỏng hoặc nhõng nhẽo',
    titleEn: 'Yelling, whining or throwing a tantrum',
    description: 'Chưa biết kiềm chế cảm xúc, nói năng gắt gỏng hoặc nhõng nhẽo',
    descriptionEn: 'Whining or speaking disrespectfully to family members',
    penaltyStars: 5,
    icon: '⚠️'
  },
  {
    id: 'rule_messy',
    title: 'Bừa bộn, không dọn đồ chơi & sách vở',
    titleEn: 'Leaving toys & study desk messy',
    description: 'Chơi xong không cất đồ vào thùng, để bàn học bừa bãi',
    descriptionEn: 'Not putting toys and books back into storage after use',
    penaltyStars: 3,
    icon: '📦'
  },
  {
    id: 'rule_food',
    title: 'Lãng phí thức ăn hoặc bỏ bữa',
    titleEn: 'Wasting food or skipping meals',
    description: 'Kén ăn, để thừa thức ăn dinh dưỡng mà mẹ đã nấu',
    descriptionEn: 'Leaving nutritious food uneaten or refusing meals',
    penaltyStars: 3,
    icon: '🍽️'
  },
  {
    id: 'rule_late_sleep',
    title: 'Thức khuya sau 22h00 không chịu ngủ',
    titleEn: 'Staying up late past bedtime',
    description: 'Cố tình thức nghịch đồ chơi hoặc xem thiết bị sau giờ ngủ',
    descriptionEn: 'Staying awake playing after bedtime hours',
    penaltyStars: 5,
    icon: '🌙'
  },
  {
    id: 'rule_fight',
    title: 'Không giữ lời hứa hoặc thiếu lễ phép với người lớn',
    titleEn: 'Breaking promises or being disrespectful',
    description: 'Chưa giữ đúng lời hứa với ba mẹ hoặc nói năng chưa lễ phép với người lớn',
    descriptionEn: 'Breaking promises made to parents or speaking disrespectfully to elders',
    penaltyStars: 8,
    icon: '🤝'
  },
  {
    id: 'rule_dishonest',
    title: 'Không trung thực hoặc nói dối',
    titleEn: 'Dishonesty or not telling the truth',
    description: 'Nói sai sự thật về việc học hoặc che giấu lỗi lầm',
    descriptionEn: 'Lying about chores, homework or mistakes',
    penaltyStars: 10,
    icon: '😢'
  }
];

export const INITIAL_DISCIPLINE_PRINCIPLES: DisciplinePrinciple[] = [
  {
    id: 'principle_respect',
    title: 'Quy tắc 3 Không: Tôn trọng & Bình tĩnh',
    titleEn: 'The 3 No Rule: Respect & Calmness',
    shortTag: 'Không bạo lực · Không sỉ nhục · Không phạt khi giận',
    shortTagEn: 'No violence · No humiliation · No anger punishments',
    description: 'Kỷ luật có nguồn gốc từ từ "disciple" (học trò), mang ý nghĩa hướng dẫn và dạy dỗ, không phải trừng phạt hay trút giận. Khi cảm thấy tức giận, cha mẹ hãy tạm dừng 10 giây để lấy lại bình tĩnh trước khi trao đổi với con.',
    descriptionEn: 'Discipline means to guide and teach, not to inflict pain or shame. If angry, parents pause for 10 seconds before talking.',
    exampleAction: 'Khi con làm đổ sữa hoặc quấy khóc: Thay vì nói "Sao con hậu đậu thế!", hãy nói "Sữa đổ rồi, mẹ cùng con lấy khăn lau sạch nhé!".',
    exampleActionEn: 'When milk is spilled: Instead of blaming, calmly say "The milk spilled, let\'s wipe it up together!"',
    category: 'core',
    icon: 'HeartHandshake'
  },
  {
    id: 'principle_natural',
    title: 'Hệ quả tự nhiên & Logic (Nhân Quả)',
    titleEn: 'Natural & Logical Consequences',
    shortTag: 'Lỗi ở đâu · Khắc phục ở đó',
    shortTagEn: 'Action directly matches consequence',
    description: 'Biện pháp kỷ luật phải liên quan chặt chẽ đến hành vi vi phạm, giúp trẻ hiểu trách nhiệm và quy luật nhân quả trong cuộc sống một cách công bằng.',
    descriptionEn: 'Consequences must connect directly to the misbehavior so children learn real cause and effect without resentment.',
    exampleAction: 'Không dọn đồ chơi -> Tạm cất đồ chơi vào tủ 24h và trừ 5 ⭐. Xem tivi quá giờ -> Ngày hôm sau không xem màn hình.',
    exampleActionEn: 'Leaving toys uncleaned -> toys rest in closet for 24h & -5 ⭐. Screen time over limit -> no screen the next day.',
    category: 'natural_consequence',
    icon: 'Scale'
  },
  {
    id: 'principle_restorative',
    title: 'Cơ hội phục hồi: Tha thứ & Hoàn sao',
    titleEn: 'Restorative Opportunity & Forgiveness',
    shortTag: 'Dũng cảm nhận lỗi · Được hoàn lại sao',
    shortTagEn: 'Admit fault & restore stars',
    description: 'Sai lầm là cơ hội vàng để học hỏi. Khi trẻ nhận thức được lỗi sai, xin lỗi chân thành hoặc tự giác sửa đổi, cha mẹ hãy bấm "Tha thứ & Hoàn sao" để khen ngợi lòng dũng cảm của trẻ.',
    descriptionEn: 'Mistakes are learning opportunities. When a child takes responsibility or makes amends, forgive and restore their stars.',
    exampleAction: 'Tranh giành đồ chơi với em -> Sau khi bé biết ôm em và nhường lại đồ chơi, ba mẹ hoàn lại toàn bộ số sao đã trừ.',
    exampleActionEn: 'After apologizing to a sibling and sharing the toy nicely, parents immediately tap Restore Stars.',
    category: 'restorative',
    icon: 'RotateCcw'
  },
  {
    id: 'principle_agreement',
    title: 'Thỏa thuận trước: Rõ ràng & Nhất quán',
    titleEn: 'Clear Prior Agreements & Consistency',
    shortTag: 'Biết trước quy ước · Tự giác chấp hành',
    shortTagEn: 'Agreed boundaries · Consistent follow-through',
    description: 'Mọi giới hạn thời gian (giờ ngủ, xem tivi, học bài) và số sao bị trừ đều được cha mẹ cùng con thảo luận và ký cam kết trước. Không tự ý thêm quy định bất ngờ khi đang tranh cãi.',
    descriptionEn: 'All rules and penalties are agreed upon in advance with the child. No arbitrary rules made in moments of frustration.',
    exampleAction: 'Trước khi bật tivi: Nhắc nhẹ "Chúng ta đã thống nhất 20 phút rồi chuông reo con tự tắt nhé!".',
    exampleActionEn: 'Before starting games: "We agreed on 20 minutes; when the chime rings, we turn it off happily together!"',
    category: 'agreement',
    icon: 'FileText'
  },
  {
    id: 'principle_praise',
    title: 'Tỷ lệ vàng 5 Lời khen : 1 Lời nhắc',
    titleEn: 'The 5:1 Magic Ratio of Positive Parenting',
    shortTag: '5 Công nhận tích cực · 1 Nhắc nhở',
    shortTagEn: '5 Praises for every 1 correction',
    description: 'Tâm lý học phát triển chứng minh: trẻ phát triển vượt bậc khi được công nhận các hành vi tốt thường xuyên. Luôn giữ số lượng sao thưởng nhiệm vụ gấp nhiều lần so với số sao bị trừ.',
    descriptionEn: 'Children thrive on encouragement. Maintain at least 5 praises and earned rewards for every 1 penalty to keep morale high.',
    exampleAction: 'Ghi nhận kịp thời khi bé tự đi đánh răng, tự xếp giày dép, đọc sách ngoan trước khi nhắc nhở bất kỳ lỗi nào.',
    exampleActionEn: 'Praise brushing teeth, organizing shoes, and reading books on time so corrections are rare and effective.',
    category: 'praise_ratio',
    icon: 'Award'
  }
];

export function formatVietnamDateKey(dateObj: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(dateObj);
    const rawYear = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (rawYear && month && day) {
      const parsedYear = parseInt(rawYear, 10);
      const year = !Number.isNaN(parsedYear) && parsedYear < 2026 ? '2026' : rawYear;
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback to local time if Intl timeZone is unavailable
  }
  const rawYear = dateObj.getFullYear();
  const year = rawYear < 2026 ? 2026 : rawYear;
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayKey(): string {
  return formatVietnamDateKey(new Date());
}

export function getOffsetDateKey(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return formatVietnamDateKey(d);
}

export const INITIAL_DISCIPLINE_LOGS: DisciplineLog[] = [
  {
    id: 'disc_morning_1',
    ruleId: 'rule_tantrum',
    reason: 'Nhắc nhở lần 1: Chưa tự giác thực hiện đúng giờ quy định buổi sáng',
    reasonEn: 'Reminder 1: Needed morning routine reminder',
    penaltyStars: 10,
    timestamp: '07:40',
    date: getTodayKey(),
    forgiven: false
  },
  {
    id: 'disc_morning_2',
    ruleId: 'rule_fight',
    reason: 'Nhắc nhở lần 2: Chưa giữ đúng cam kết và thái độ tích cực khi được nhắc',
    reasonEn: 'Reminder 2: Did not keep morning promise when reminded',
    penaltyStars: 10,
    timestamp: '08:15',
    date: getTodayKey(),
    forgiven: false
  },
  {
    id: 'disc_morning_3',
    ruleId: 'rule_dishonest',
    reason: 'Nhắc nhở lần 3: Cần rèn luyện tính tự giác và tập trung tốt hơn',
    reasonEn: 'Reminder 3: Needs better focus and self-discipline',
    penaltyStars: 10,
    timestamp: '08:50',
    date: getTodayKey(),
    forgiven: false
  }
];

export function buildDefault7DayHistory(): Record<string, DayRecord> {
  const dailyProgression = [
    { daysAgo: 6, starsEarned: 24, cumulativeStars: 24, completionRate: 71, tasksCount: 12, happiness: 68, energy: 62, hunger: 64 },
    { daysAgo: 5, starsEarned: 28, cumulativeStars: 52, completionRate: 76, tasksCount: 13, happiness: 72, energy: 66, hunger: 66 },
    { daysAgo: 4, starsEarned: 28, cumulativeStars: 80, completionRate: 82, tasksCount: 14, happiness: 76, energy: 68, hunger: 68 },
    { daysAgo: 3, starsEarned: 28, cumulativeStars: 108, completionRate: 88, tasksCount: 15, happiness: 80, energy: 72, hunger: 70 },
    { daysAgo: 2, starsEarned: 30, cumulativeStars: 138, completionRate: 94, tasksCount: 16, happiness: 84, energy: 76, hunger: 72 },
    { daysAgo: 1, starsEarned: 28, cumulativeStars: 105, completionRate: 94, tasksCount: 16, happiness: 88, energy: 80, hunger: 75 },
    { daysAgo: 0, starsEarned: 4, cumulativeStars: 75, completionRate: 24, tasksCount: 4, happiness: 80, energy: 80, hunger: 75 }
  ];

  const allTaskIds = [
    'm1',
    'm2',
    'm3',
    'm4',
    'a1',
    'a2',
    'a3',
    'a4',
    'e1',
    'e2',
    'b1',
    'b2',
    'b3',
    'b4',
    'custom_1794047307550'
  ];

  const records: Record<string, DayRecord> = {};
  for (const item of dailyProgression) {
    const key = getOffsetDateKey(item.daysAgo);
    records[key] = {
      date: key,
      completedTaskIds: allTaskIds.slice(0, item.tasksCount),
      starsEarned: item.starsEarned,
      cumulativeStars: item.cumulativeStars,
      totalTasks: 17,
      completionRate: item.completionRate,
      goalMessage: 'Hôm nay con hãy hoàn thành bài tập sớm và tự tin mỉm cười nhé! Ba mẹ luôn yêu con ❤️',
      petHappiness: item.happiness,
      petEnergy: item.energy,
      petHunger: item.hunger
    };
  }
  return records;
}

export const LEGACY_DEFAULT_FAMILY_CODE = 'HERO-KID-8823';

export function isLegacyDefaultFamilyCode(code?: string | null): boolean {
  return (code || '').trim().toUpperCase() === LEGACY_DEFAULT_FAMILY_CODE;
}

export function generateFamilyCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let p1 = '';
  let p2 = '';
  let p3 = '';
  for (let i = 0; i < 4; i++) p1 += alphabet.charAt(bytes[i] & 31);
  for (let i = 4; i < 8; i++) p2 += alphabet.charAt(bytes[i] & 31);
  for (let i = 8; i < 12; i++) p3 += alphabet.charAt(bytes[i] & 31);
  return `HERO-${p1}-${p2}-${p3}`;
}

const DEVICE_FAMILY_CODE_STORAGE_KEY = 'kidhero_device_family_code_v1';

export function getOrCreateDeviceFamilyCode(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = (localStorage.getItem(DEVICE_FAMILY_CODE_STORAGE_KEY) || '').trim().toUpperCase();
      if (saved && saved.length >= 3 && saved.length <= 64 && /^[A-Z0-9_\-]+$/.test(saved) && !isLegacyDefaultFamilyCode(saved)) {
        return saved;
      }
      const created = generateFamilyCode();
      localStorage.setItem(DEVICE_FAMILY_CODE_STORAGE_KEY, created);
      return created;
    }
  } catch {
    // Ignore storage errors
  }
  return generateFamilyCode();
}

export const INITIAL_STATE: AppState = {
  profile: {
    name: 'Hiệp Sĩ Cơ Minh',
    grade: 'Lớp 4',
    avatar: DEFAULT_HERO_AVATAR_URL,
    stars: 75,
    dailyStarsEarned: 4,
    totalStarsEarned: 75,
    level: 15,
    currentXp: 5360,
    maxXp: 6200,
    streakDays: 2,
    lastActiveDate: getTodayKey(),
    pet: {
      name: 'Chuột Hamster Mũm Mĩm',
      species: 'hamster',
      avatar: CUTE_HAMSTER_AVATAR_URL,
      happiness: 80,
      energy: 80,
      hunger: 75,
      coins: 760,
      sleepCountToday: 0,
      lastSleepDate: getTodayKey(),
      level: 15,
      exp: 5360,
      isHatched: true,
      eggStars: 50,
      evolutionStars: 5360,
      hasChosenSpecies: true,
      headPatCountToday: 0,
      feedCountToday: 0,
      lastFeedDate: getTodayKey(),
      lastDecayDate: getTodayKey(),
      completedMealSlotsToday: ['morning'],
      appliedDecaySlotsToday: [],
      usedRoomAccessoriesToday: [],
      unlockedAccessories: [
        'hat_glasses',
        'hero_cape',
        'glowing_wings',
        'food_bowl',
        'water_fountain',
        'cute_bow',
        'grass_rug',
        'hamster_wheel',
        'rainbow_house',
        'scholar_cap',
        'mini_bookshelf',
        'wall_clock',
        'star_projector',
        'mini_study_desk',
        'glowing_desk_lamp',
        'golden_crown',
        'crystal_castle',
        'mini_waterfall',
        'star_telescope'
      ],
      equippedAccessories: [
        'hat_glasses',
        'glowing_wings',
        'food_bowl',
        'water_fountain',
        'hamster_wheel',
        'rainbow_house',
        'scholar_cap',
        'grass_rug',
        'mini_bookshelf',
        'wall_clock',
        'star_projector',
        'cute_bow',
        'mini_waterfall',
        'star_telescope'
      ],
      roomTheme: 'warm_wood'
    }
  },
  tasks: INITIAL_TASKS,
  rewards: INITIAL_REWARDS,
  challenges: INITIAL_CHALLENGES,
  badges: INITIAL_BADGES,
  history: buildDefault7DayHistory(),
  goalHistory: {},
  disciplineRules: INITIAL_DISCIPLINE_RULES,
  disciplinePrinciples: INITIAL_DISCIPLINE_PRINCIPLES,
  disciplineLogs: INITIAL_DISCIPLINE_LOGS,
  settings: {
    pin: '1234',
    soundEnabled: true,
    voiceEnabled: false,
    autoVoiceEncourage: true,
    parentalGateType: 'pin',
    dailyGoalTasks: 8,
    dailyGoalMessage: 'Hôm nay con hãy hoàn thành bài tập sớm và tự tin mỉm cười nhé! Ba mẹ luôn yêu con ❤️'
  },
  familyCode: LEGACY_DEFAULT_FAMILY_CODE,
  language: 'vi',
  lastSyncTimestamp: 0,
  lastUpdatedAt: 0
};
