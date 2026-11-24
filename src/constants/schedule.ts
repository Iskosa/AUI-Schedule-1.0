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
  'COMSE26B',
  'COMSE26A',
  'COMSEH26',
  'COMCIF26',
];

export const GROUP_LABELS: Record<GroupId, string> = {
  COMSE26B: 'COMSE-26B',
  COMSE26A: 'COMSE-26A',
  COMSEH26: 'COMSEH-26',
  COMCIF26: 'COMCIF-26',
};

export const GROUP_BADGE_STYLES: Record<GroupId, string> = {
  COMSE26B: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  COMSE26A: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  COMSEH26: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  COMCIF26: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  regular: 'Обычная',
  fixed: 'Фикс. / Поток',
  elective: 'Электив',
  advisor: 'Advisor Hour',
};

export const LESSON_TYPE_STYLES: Record<LessonType, string> = {
  regular: 'bg-slate-700/60 text-slate-200 border-slate-600/70',
  fixed: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  elective: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  advisor: 'bg-yellow-400/15 text-yellow-200 border-yellow-400/30',
};

export const DAY_PHASE_LABELS: Record<DayPhase, { label: string; style: string }> = {
  MORNING: {
    label: 'MORNING',
    style: 'bg-white text-[#0D0D0D] border-2 border-[#0D0D0D] shadow-[3px_3px_0_#E60012]',
  },
  LUNCHTIME: {
    label: 'LUNCHTIME',
    style: 'bg-[#FFE600] text-[#0D0D0D] border-2 border-[#0D0D0D] shadow-[3px_3px_0_#E60012]',
  },
  AFTERNOON: {
    label: 'AFTERNOON',
    style: 'bg-[#E60012] text-white border-2 border-white shadow-[3px_3px_0_#0D0D0D]',
  },
  EVENING: {
    label: 'EVENING',
    style: 'bg-[#0D0D0D] text-[#FFE600] border-2 border-[#FFE600] shadow-[3px_3px_0_#E60012]',
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
