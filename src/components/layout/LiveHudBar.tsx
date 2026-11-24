import { useMemo } from 'react';
import { Calendar, Clock, PlayCircle, Timer } from 'lucide-react';
import { DAY_LABELS_RU, DAY_PHASE_LABELS } from '../../constants/schedule';
import type { EffectiveLesson, GroupFilter } from '../../types/schedule';
import {
  computeLiveHudState,
  formatClock,
  formatCountdown,
  formatRussianDate,
  formatRussianWeekday,
} from '../../utils/time';

interface LiveHudBarProps {
  now: Date;
  lessons: EffectiveLesson[];
  selectedGroup: GroupFilter;
  onSelectLesson: (lesson: EffectiveLesson) => void;
}

function summarizeLessonTeacherRoom(lesson: EffectiveLesson): string {
  if (lesson.pinnedSubgroupTeacherId && lesson.subgroups) {
    const pinned = lesson.subgroups.find(
      (sg) => sg.teacherId === lesson.pinnedSubgroupTeacherId
    );
    if (pinned) {
      return `${pinned.teacherName}${pinned.room ? ` • ${pinned.room}` : ''}`;
    }
  }
  const parts: string[] = [];
  if (lesson.isOnline) {
    parts.push('Online');
  } else if (lesson.room) {
    parts.push(lesson.room);
  }
  if (lesson.teacherName) {
    parts.push(lesson.teacherName);
  }
  return parts.join(' • ');
}

export function LiveHudBar({
  now,
  lessons,
  selectedGroup,
  onSelectLesson,
}: LiveHudBarProps) {
  const hud = useMemo(
    () => computeLiveHudState(now, lessons, selectedGroup),
    [now, lessons, selectedGroup]
  );

  const phaseMeta = DAY_PHASE_LABELS[hud.phase];

  return (
    <section
      aria-label="Живой статус расписания"
      className="grid gap-3 rounded-2xl border border-[#252e42] bg-[#121620] p-4 lg:grid-cols-12"
    >
      {/* Date, Weekday, Clock & Day Phase */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#252e42]/80 bg-[#1a2030]/60 px-4 py-3 lg:col-span-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            <span className="truncate">{formatRussianDate(now)}</span>
          </div>
          <div className="mt-1 text-base font-bold text-white">
            {formatRussianWeekday(now)}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="font-mono text-lg font-semibold tabular-nums text-slate-100">
            {formatClock(now)}
          </div>
          <span
            className={`rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wider ${phaseMeta.style}`}
          >
            {phaseMeta.label}
          </span>
        </div>
      </div>

      {/* Current Lesson */}
      <div className="flex flex-col justify-between rounded-xl border border-[#252e42]/80 bg-[#1a2030]/60 px-4 py-3 lg:col-span-4">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <PlayCircle className="h-3.5 w-3.5 text-emerald-400" />
            Сейчас ({selectedGroup === 'ALL' ? 'Все 4 группы' : selectedGroup})
          </span>
          {hud.currentEndsInSeconds !== null && (
            <span className="font-mono text-xs font-semibold text-emerald-300">
              до конца {formatCountdown(hud.currentEndsInSeconds)}
            </span>
          )}
        </div>

        {hud.currentLessons.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {hud.currentLessons.slice(0, 2).map((ls) => (
              <button
                key={ls.id}
                type="button"
                onClick={() => onSelectLesson(ls)}
                className="block w-full rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-left transition hover:border-emerald-400/50 hover:bg-emerald-500/15"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-white">
                    {ls.subject}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-emerald-300">
                    {ls.startTime}–{ls.endTime}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-300">
                  {selectedGroup === 'ALL' ? `${ls.groupIds.join(', ')} • ` : ''}
                  {summarizeLessonTeacherRoom(ls)}
                </div>
              </button>
            ))}
            {hud.currentLessons.length > 2 && (
              <div className="text-xs text-slate-400">
                + ещё {hud.currentLessons.length - 2} пара(ы) в это время
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 text-sm text-slate-400">
            {hud.isSunday ? 'Воскресенье — выходной день' : 'Сейчас пара не идёт'}
          </div>
        )}
      </div>

      {/* Next Lesson */}
      <div className="flex flex-col justify-between rounded-xl border border-[#252e42]/80 bg-[#1a2030]/60 px-4 py-3 lg:col-span-4">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Timer className="h-3.5 w-3.5 text-blue-400" />
            Следующая пара
          </span>
          {hud.nextSlot && (
            <span className="font-mono text-xs font-semibold text-blue-300">
              через {formatCountdown(hud.nextSlot.startsInSeconds)}
            </span>
          )}
        </div>

        {hud.nextSlot ? (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>
                {hud.nextSlot.isToday
                  ? `Сегодня в ${hud.nextSlot.startTime}`
                  : hud.nextSlot.dayOffset === 1
                    ? `Завтра (${DAY_LABELS_RU[hud.nextSlot.day]}) в ${hud.nextSlot.startTime}`
                    : `${DAY_LABELS_RU[hud.nextSlot.day]} в ${hud.nextSlot.startTime}`}
              </span>
            </div>

            {hud.nextSlot.lessons.length === 1 ? (
              <button
                type="button"
                onClick={() => onSelectLesson(hud.nextSlot!.lessons[0])}
                className="block w-full rounded-lg border border-blue-500/25 bg-blue-500/10 px-2.5 py-1.5 text-left transition hover:border-blue-400/50 hover:bg-blue-500/15"
              >
                <div className="truncate text-sm font-semibold text-white">
                  {hud.nextSlot.lessons[0].subject}
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-300">
                  {summarizeLessonTeacherRoom(hud.nextSlot.lessons[0])}
                </div>
              </button>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {hud.nextSlot.lessons.map((ls) => (
                  <button
                    key={ls.id}
                    type="button"
                    onClick={() => onSelectLesson(ls)}
                    className="max-w-full rounded-lg border border-blue-500/25 bg-blue-500/10 px-2 py-1 text-left text-xs transition hover:border-blue-400/50 hover:bg-blue-500/15"
                  >
                    <span className="font-semibold text-white">{ls.subject}</span>{' '}
                    <span className="text-blue-300">({ls.groupIds.join(', ')})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 text-sm text-slate-400">
            Запланированных пар не найдено
          </div>
        )}
      </div>
    </section>
  );
}
