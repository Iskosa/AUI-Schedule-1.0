import type { DayOfWeek, DayPhase, GroupId, LessonType } from '../types/schedule';

export const STORAGE_KEY = 'aiu_p5r_schedule_overlay_v1';

export const DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export const DAY_ORDER: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
};

export const DAY_LABELS_RU: Record<DayOfWeek, string> = {
  MONDAY: 'Понедельник',
  TUESDAY: 'Вторник',
  WEDNESDAY: 'Среда',
  THURSDAY: 'Четверг',
  FRIDAY: 'Пятница',
  SATURDAY: 'Суббота',
};

export const DAY_SHORT_RU: Record<DayOfWeek, string> = {
  MONDAY: 'Пн',
  TUESDAY: 'Вт',
  WEDNESDAY: 'Ср',
  THURSDAY: 'Чт',
  FRIDAY: 'Пт',
  SATURDAY: 'Сб',
};

export const DAY_SHORT_EN: Record<DayOfWeek, string> = {
  MONDAY: 'MON',
  TUESDAY: 'TUE',
  WEDNESDAY: 'WED',
  THURSDAY: 'THU',
  FRIDAY: 'FRI',
  SATURDAY: 'SAT',
};

export const TARGET_GROUPS: GroupId[] = [
  'COMSE26A',
  'COMSE26B',
  'COMSEH26',
  'COMCIF26',
];

export const GROUP_LABELS: Record<GroupId, string> = {
  COMSE26A: 'COMSE-26A',
  COMSE26B: 'COMSE-26B',
  COMSEH26: 'COMSEH-26',
  COMCIF26: 'COMCIF-26',
};

export const GROUP_BADGE_STYLES: Record<GroupId, string> = {
  COMSE26A: 'bg-[#E60012] text-white border-2 border-white',
  COMSE26B: 'bg-[#0D0D0D] text-white border-2 border-white',
  COMSEH26: 'bg-white text-[#0D0D0D] border-2 border-[#0D0D0D]',
  COMCIF26: 'bg-[#FFE600] text-[#0D0D0D] border-2 border-[#0D0D0D]',
};

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  regular: 'Обычная',
  fixed: 'Фикс. / Поток',
  elective: 'Электив',
  advisor: 'Advisor Hour',
};

export const LESSON_TYPE_STYLES: Record<LessonType, string> = {
  regular: 'bg-[#0D0D0D] text-white border-2 border-white',
  fixed: 'bg-white text-[#0D0D0D] border-2 border-[#0D0D0D]',
  elective: 'bg-[#E60012] text-white border-2 border-white',
  advisor: 'bg-[#FFE600] text-[#0D0D0D] border-2 border-[#0D0D0D]',
};

export const DAY_PHASE_LABELS: Record<DayPhase, { label: string; style: string }> = {
  MORNING: {
    label: 'MORNING',
    style: 'bg-white text-[#0D0D0D] border border-white',
  },
  LUNCHTIME: {
    label: 'LUNCHTIME',
    style: 'bg-[#FFE600] text-[#0D0D0D] border border-[#FFE600]',
  },
  AFTERNOON: {
    label: 'AFTERNOON',
    style: 'bg-[#E60012] text-white border border-white/80',
  },
  EVENING: {
    label: 'EVENING',
    style: 'bg-[#0B0B0B] text-[#FFE600] border border-[#FFE600]/80',
  },
};

export const TIME_PRESETS: Array<{ label: string; startTime: string; endTime: string }> = [
  { label: '08:00 – 09:25', startTime: '08:00', endTime: '09:25' },
  { label: '09:30 – 10:55', startTime: '09:30', endTime: '10:55' },
  { label: '11:00 – 12:25', startTime: '11:00', endTime: '12:25' },
  { label: '12:30 – 13:55', startTime: '12:30', endTime: '13:55' },
  { label: '14:00 – 15:25', startTime: '14:00', endTime: '15:25' },
  { label: '08:00 – 10:10 (Рус. яз.)', startTime: '08:00', endTime: '10:10' },
  { label: '10:15 – 12:25 (Рус. яз.)', startTime: '10:15', endTime: '12:25' },
];
