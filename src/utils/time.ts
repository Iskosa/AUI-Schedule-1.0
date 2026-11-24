import { DAY_LABELS_RU } from '../constants/schedule';
import type {
  DayOfWeek,
  DayPhase,
  EffectiveLesson,
  GroupFilter,
  ScheduleScopeMode,
} from '../types/schedule';
import { getNoteSeverity } from './links';

const JS_WEEKDAY_TO_DAY: Record<number, DayOfWeek | null> = {
  0: null, // Sunday
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

export function parseTimeToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number.parseInt(hStr ?? '0', 10);
  const m = Number.parseInt(mStr ?? '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function formatLessonDuration(
  startTime: string,
  endTime: string
): string | null {
  const diff = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
  if (diff <= 0) return null;
  return `${diff} МИН`;
}

export function getTimeParts(hhmm: string): { hours: number; minutes: number } {
  const [hStr, mStr] = hhmm.split(':');
  return {
    hours: Number.parseInt(hStr ?? '0', 10) || 0,
    minutes: Number.parseInt(mStr ?? '0', 10) || 0,
  };
}

export function getDayPhase(date: Date): DayPhase {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 6 * 60 && minutes < 12 * 60) return 'MORNING';
  if (minutes >= 12 * 60 && minutes < 14 * 60) return 'LUNCHTIME';
  if (minutes >= 14 * 60 && minutes < 18 * 60) return 'AFTERNOON';
  return 'EVENING';
}

export function getWeekdayOrSunday(date: Date): DayOfWeek | 'SUNDAY' {
  return JS_WEEKDAY_TO_DAY[date.getDay()] ?? 'SUNDAY';
}

export function getDefaultStudyDay(date: Date): DayOfWeek {
  return JS_WEEKDAY_TO_DAY[date.getDay()] ?? 'MONDAY';
}

const russianDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const clockFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export function formatRussianDate(date: Date): string {
  return russianDateFormatter.format(date);
}

export function formatRussianWeekday(date: Date): string {
  const wd = getWeekdayOrSunday(date);
  if (wd === 'SUNDAY') return 'Воскресенье';
  return DAY_LABELS_RU[wd];
}

export function formatClock(date: Date): string {
  return clockFormatter.format(date);
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  if (days > 0) {
    return `${days}д ${pad(hours)}ч ${pad(mins)}м`;
  }
  if (hours > 0) {
    return `${hours}ч ${pad(mins)}м ${pad(secs)}с`;
  }
  return `${mins}м ${pad(secs)}с`;
}

export interface NextHudSlot {
  day: DayOfWeek;
  dayOffset: number;
  isToday: boolean;
  startTime: string;
  lessons: EffectiveLesson[];
  startsInSeconds: number;
  startsAtMs: number;
}

export interface LiveHudState {
  phase: DayPhase;
  todayDay: DayOfWeek | 'SUNDAY';
  isSunday: boolean;
  currentLessons: EffectiveLesson[];
  currentEndsInSeconds: number | null;
  currentEndsAtMs: number | null;
  nextSlot: NextHudSlot | null;
}

export function isDisputedSaturdayLesson(lesson: EffectiveLesson): boolean {
  if (lesson.day !== 'SATURDAY' || lesson.isOnline) return false;
  return (
    getNoteSeverity(lesson.notes) === 'warning' ||
    Boolean(lesson.notes?.toLowerCase().includes('satur_comments'))
  );
}

export function filterLessonsByGroup(
  lessons: EffectiveLesson[],
  selectedGroup: GroupFilter
): EffectiveLesson[] {
  if (selectedGroup === 'ALL') return lessons;
  return lessons.filter((ls) => ls.groupIds.includes(selectedGroup));
}

export function filterLessonsByScope(
  lessons: EffectiveLesson[],
  selectedGroup: GroupFilter,
  scopeMode: ScheduleScopeMode = 'group',
  focusedTeacherId: string | null = null
): EffectiveLesson[] {
  if (scopeMode === 'teacher' && focusedTeacherId) {
    return lessons.filter(
      (ls) =>
        ls.teacherId === focusedTeacherId ||
        ls.teacherIds.includes(focusedTeacherId) ||
        ls.pinnedSubgroupTeacherId === focusedTeacherId
    );
  }
  return filterLessonsByGroup(lessons, selectedGroup);
}

export function computeLiveHudState(
  now: Date,
  allLessons: EffectiveLesson[],
  selectedGroup: GroupFilter,
  scope?: {
    scopeMode?: ScheduleScopeMode;
    focusedTeacherId?: string | null;
  }
): LiveHudState {
  const phase = getDayPhase(now);
  const todayDay = getWeekdayOrSunday(now);
  const isSunday = todayDay === 'SUNDAY';
  const filtered = filterLessonsByScope(
    allLessons,
    selectedGroup,
    scope?.scopeMode ?? 'group',
    scope?.focusedTeacherId ?? null
  );

  const nowTotalSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  let currentLessons: EffectiveLesson[] = [];
  let currentEndsInSeconds: number | null = null;
  let currentEndsAtMs: number | null = null;

  if (todayDay !== 'SUNDAY') {
    const todaysLessons = filtered.filter((ls) => ls.day === todayDay);
    currentLessons = todaysLessons.filter((ls) => {
      const startSec = parseTimeToMinutes(ls.startTime) * 60;
      const endSec = parseTimeToMinutes(ls.endTime) * 60;
      return nowTotalSeconds >= startSec && nowTotalSeconds < endSec;
    });

    if (currentLessons.length > 0) {
      const soonestEndMinutes = Math.min(
        ...currentLessons.map((ls) => parseTimeToMinutes(ls.endTime))
      );
      const endTarget = new Date(now);
      endTarget.setHours(
        Math.floor(soonestEndMinutes / 60),
        soonestEndMinutes % 60,
        0,
        0
      );
      currentEndsAtMs = endTarget.getTime();
      currentEndsInSeconds = Math.max(
        0,
        soonestEndMinutes * 60 - nowTotalSeconds
      );
    }

    const remainingToday = todaysLessons
      .filter((ls) => parseTimeToMinutes(ls.startTime) * 60 > nowTotalSeconds)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (remainingToday.length > 0) {
      const nextStart = remainingToday[0].startTime;
      const slotLessons = remainingToday.filter((ls) => ls.startTime === nextStart);
      const { hours, minutes } = getTimeParts(nextStart);
      const startTarget = new Date(now);
      startTarget.setHours(hours, minutes, 0, 0);
      const startSec = (hours * 60 + minutes) * 60;
      return {
        phase,
        todayDay,
        isSunday,
        currentLessons,
        currentEndsInSeconds,
        currentEndsAtMs,
        nextSlot: {
          day: todayDay,
          dayOffset: 0,
          isToday: true,
          startTime: nextStart,
          lessons: slotLessons,
          startsInSeconds: Math.max(0, startSec - nowTotalSeconds),
          startsAtMs: startTarget.getTime(),
        },
      };
    }
  }

  // Sunday OR all lessons today have finished -> search upcoming days 1..7 (skipping Sunday)
  let nextSlot: NextHudSlot | null = null;
  for (let offset = 1; offset <= 7; offset += 1) {
    const targetJsWeekday = (now.getDay() + offset) % 7;
    const studyDay = JS_WEEKDAY_TO_DAY[targetJsWeekday];
    if (!studyDay) continue;

    const dayLessons = filtered
      .filter((ls) => ls.day === studyDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (dayLessons.length === 0) continue;

    const earliestStart = dayLessons[0].startTime;
    const slotLessons = dayLessons.filter((ls) => ls.startTime === earliestStart);
    const { hours, minutes } = getTimeParts(earliestStart);
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + offset);
    targetDate.setHours(hours, minutes, 0, 0);

    const startsInSeconds = Math.max(
      0,
      Math.floor((targetDate.getTime() - now.getTime()) / 1000)
    );

    nextSlot = {
      day: studyDay,
      dayOffset: offset,
      isToday: false,
      startTime: earliestStart,
      lessons: slotLessons,
      startsInSeconds,
      startsAtMs: targetDate.getTime(),
    };
    break;
  }

  return {
    phase,
    todayDay,
    isSunday,
    currentLessons,
    currentEndsInSeconds,
    currentEndsAtMs,
    nextSlot,
  };
}
