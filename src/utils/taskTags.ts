import { HabitGroup, Task, TaskTag } from '../types';

export interface TaskTagMeta {
  id: TaskTag;
  labelVi: string;
  labelEn: string;
  bilingualVi: string;
  shortDescVi: string;
  shortDescEn: string;
  textColor: string;
  iconBg: string;
  activeTabClass: string;
}

export const TASK_TAG_ORDER: TaskTag[] = ['study', 'chore', 'hygiene', 'health', 'routine'];

export const TASK_TAG_META: Record<TaskTag, TaskTagMeta> = {
  study: {
    id: 'study',
    labelVi: 'Học tập',
    labelEn: 'Study',
    bilingualVi: 'Học tập (Study)',
    shortDescVi: 'Làm bài tập, đọc sách, học ngoại ngữ & soạn sách vở',
    shortDescEn: 'Homework, reading books, vocabulary & school prep',
    textColor: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-100/90 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
    activeTabClass: 'bg-blue-600 text-white shadow-sm'
  },
  chore: {
    id: 'chore',
    labelVi: 'Việc nhà',
    labelEn: 'Chore',
    bilingualVi: 'Việc nhà (Chore)',
    shortDescVi: 'Gấp chăn màn, dọn đồ chơi, xếp giày dép & phụ giúp ba mẹ',
    shortDescEn: 'Making bed, tidying toys, organizing shoes & helping family',
    textColor: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-100/90 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    activeTabClass: 'bg-amber-600 text-white shadow-sm'
  },
  hygiene: {
    id: 'hygiene',
    labelVi: 'Vệ sinh',
    labelEn: 'Hygiene',
    bilingualVi: 'Vệ sinh (Hygiene)',
    shortDescVi: 'Đánh răng, rửa mặt, rửa tay xà phòng & giữ cơ thể sạch sẽ',
    shortDescEn: 'Brushing teeth, washing face, handwashing & personal hygiene',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    iconBg: 'bg-cyan-100/90 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300',
    activeTabClass: 'bg-cyan-600 text-white shadow-sm'
  },
  health: {
    id: 'health',
    labelVi: 'Sức khỏe',
    labelEn: 'Health',
    bilingualVi: 'Sức khỏe (Health)',
    shortDescVi: 'Ăn sáng đủ chất, uống nước ấm & tập thể dục vận động',
    shortDescEn: 'Healthy meals, drinking water & daily exercise',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    activeTabClass: 'bg-emerald-600 text-white shadow-sm'
  },
  routine: {
    id: 'routine',
    labelVi: 'Nề nếp',
    labelEn: 'Routine',
    bilingualVi: 'Nề nếp (Routine)',
    shortDescVi: 'Thức dậy đúng giờ, đi ngủ sớm & lễ phép chào hỏi',
    shortDescEn: 'Waking up on time, sleeping early & good daily habits',
    textColor: 'text-violet-700 dark:text-violet-300',
    iconBg: 'bg-violet-100/90 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
    activeTabClass: 'bg-violet-600 text-white shadow-sm'
  }
};

export function getTaskTag(task: Task): TaskTag {
  if (task.tag && TASK_TAG_META[task.tag]) {
    return task.tag;
  }

  const id = (task.id || '').toLowerCase();
  const titleLower = `${task.title || ''} ${task.titleEn || ''}`.toLowerCase();

  // Explicit default task IDs mapping
  if (id === 'm2' || id === 'a2' || id === 'e3') return 'hygiene';
  if (id === 'm3' || id === 'e1') return 'chore';
  if (id === 'a3' || id === 'a4' || id === 'e2' || id === 'b2') return 'study';
  if (id === 'm4' || id === 'b1' || id === 'b3') return 'health';
  if (id === 'm1' || id === 'a1' || id === 'e4' || id === 'b4') return 'routine';

  // Keyword fallback for custom parent-created tasks
  if (
    titleLower.includes('răng') ||
    titleLower.includes('rửa') ||
    titleLower.includes('tắm') ||
    titleLower.includes('vệ sinh') ||
    titleLower.includes('tooth') ||
    titleLower.includes('wash') ||
    titleLower.includes('hygiene') ||
    titleLower.includes('clean feet')
  ) {
    return 'hygiene';
  }

  if (
    titleLower.includes('dọn') ||
    titleLower.includes('gấp chăn') ||
    titleLower.includes('quét') ||
    titleLower.includes('lau') ||
    titleLower.includes('rửa bát') ||
    titleLower.includes('tưới cây') ||
    titleLower.includes('đồ chơi') ||
    titleLower.includes('giày dép') ||
    titleLower.includes('chore') ||
    titleLower.includes('tidy') ||
    titleLower.includes('bed')
  ) {
    return 'chore';
  }

  if (
    titleLower.includes('học') ||
    titleLower.includes('bài tập') ||
    titleLower.includes('đọc sách') ||
    titleLower.includes('sách vở') ||
    titleLower.includes('tiếng anh') ||
    titleLower.includes('study') ||
    titleLower.includes('homework') ||
    titleLower.includes('read') ||
    titleLower.includes('english')
  ) {
    return 'study';
  }

  // Fallback by habitGroup
  switch (task.habitGroup) {
    case 'study':
      return 'study';
    case 'family_help':
      return 'chore';
    case 'health_sport':
      return 'health';
    case 'self_care':
    default:
      return 'routine';
  }
}

export function tagToHabitGroup(tag: TaskTag): HabitGroup {
  switch (tag) {
    case 'study':
      return 'study';
    case 'chore':
      return 'family_help';
    case 'health':
      return 'health_sport';
    case 'hygiene':
    case 'routine':
    default:
      return 'self_care';
  }
}
