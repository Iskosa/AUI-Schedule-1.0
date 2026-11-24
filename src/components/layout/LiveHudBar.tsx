import { useMemo } from 'react';
import { Clock, Pin, PlayCircle, Timer } from 'lucide-react';
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

interface LessonDisplayMeta {
  text: string;
  isPinnedSubgroup: boolean;
}

function getLessonDisplayMeta(lesson: EffectiveLesson): LessonDisplayMeta {
  if (lesson.pinnedSubgroupTeacherId && lesson.subgroups) {
    const pinned = lesson.subgroups.find(
      (sg) => sg.teacherId === lesson.pinnedSubgroupTeacherId
    );
    if (pinned) {
      return {
        text: `${pinned.teacherName}${pinned.room ? ` • ${pinned.room}` : ''}`,
        isPinnedSubgroup: true,
      };
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
  return {
    text: parts.join(' • '),
    isPinnedSubgroup: false,
  };
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
  const dayNum = String(now.getDate());
  const monthNum = String(now.getMonth() + 1).padStart(2, '0');

  return (
    <section
      aria-label="Живой статус расписания"
      className="grid gap-4 lg:grid-cols-12"
    >
      {/* P5R Calendar, Weekday, Clock & Day Phase */}
      <div className="p5-shadow p5-halftone relative flex flex-wrap items-center justify-between gap-3 border-2 border-white border-l-[6px] border-l-[#E60012] bg-[#161616] p-4 lg:col-span-4">
        <div className="min-w-0">
          <div className="p5-drop-shadow-red inline-block -rotate-2">
            <div className="p5-clip-hud-date bg-white p-[3px]">
              <div className="p5-clip-hud-date bg-[#0D0D0D] px-3.5 py-2">
                <div className="font-display text-3xl leading-none tracking-tight text-white sm:text-4xl">
                  {dayNum}
                  <span className="mx-0.5 text-[#E60012]">/</span>
                  {monthNum}
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-2.5 ml-3">
            <span className="p5-skew inline-block border-2 border-[#0D0D0D] bg-white px-2.5 py-0.5 shadow-[3px_3px_0_#E60012]">
              <span
                className={`p5-unskew block font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm ${
                  hud.isSunday ? 'text-[#E60012]' : 'text-[#0D0D0D]'
                }`}
              >
                {formatRussianWeekday(now)}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="border-l-4 border-[#E60012] bg-[#0D0D0D] px-2.5 py-1 font-condensed text-2xl font-bold leading-none tabular-nums tracking-wider text-white shadow-[3px_3px_0_#0D0D0D] sm:text-3xl">
            {formatClock(now)}
          </div>
          <span className={`p5-skew inline-block px-2.5 py-0.5 ${phaseMeta.style}`}>
            <span className="p5-unskew block font-condensed text-xs font-bold uppercase tracking-widest">
              {phaseMeta.label}
            </span>
          </span>
          <div className="font-condensed text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
            {formatRussianDate(now)}
          </div>
        </div>
      </div>

      {/* Current Lesson */}
      <div
        className={`p5-shadow flex flex-col justify-between border-2 border-white bg-[#161616] p-4 lg:col-span-4 ${
          hud.currentLessons.length > 0 ? 'border-t-4 border-t-[#E60012]' : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p5-skew inline-block border border-white bg-[#E60012] px-2 py-0.5 shadow-[2px_2px_0_#0D0D0D]">
              <span className="p5-unskew inline-flex items-center gap-1 font-condensed text-xs font-bold uppercase tracking-wider text-white">
                <PlayCircle className="h-3.5 w-3.5" />
                <span>СЕЙЧАС</span>
              </span>
            </span>
            <span className="border border-white/60 bg-[#0D0D0D] px-1.5 py-0.5 font-condensed text-[11px] font-bold uppercase tracking-wider text-white">
              {selectedGroup === 'ALL' ? 'ВСЕ 4 ГРУППЫ' : selectedGroup}
            </span>
          </div>

          {hud.currentEndsInSeconds !== null && (
            <span className="border-2 border-[#FFE600] bg-[#0D0D0D] px-2 py-0.5 font-condensed text-xs font-bold uppercase tabular-nums text-[#FFE600]">
              ДО КОНЦА {formatCountdown(hud.currentEndsInSeconds)}
            </span>
          )}
        </div>

        {hud.currentLessons.length > 0 ? (
          <div className="mt-3 space-y-2">
            {hud.currentLessons.slice(0, 2).map((ls) => {
              const meta = getLessonDisplayMeta(ls);
              return (
                <button
                  key={ls.id}
                  type="button"
                  onClick={() => onSelectLesson(ls)}
                  className="block w-full border-2 border-white bg-[#0D0D0D] px-3 py-2 text-left shadow-[3px_3px_0_#E60012] transition hover:-translate-y-0.5 hover:border-[#FFE600]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-white">
                      {ls.subject}
                    </span>
                    <span className="shrink-0 font-condensed text-xs font-bold tabular-nums text-[#FFE600]">
                      {ls.startTime}–{ls.endTime}
                    </span>
                  </div>
                  <div
                    className={`mt-1 flex items-center gap-1.5 truncate text-xs ${
                      meta.isPinnedSubgroup
                        ? 'font-bold text-[#FFE600]'
                        : 'text-neutral-300'
                    }`}
                  >
                    {meta.isPinnedSubgroup && (
                      <>
                        <Pin className="h-3 w-3 shrink-0 text-[#FFE600]" />
                        <span className="shrink-0 border border-[#FFE600] bg-[#161616] px-1 font-condensed text-[10px] font-bold uppercase text-[#FFE600]">
                          ПОДГРУППА
                        </span>
                      </>
                    )}
                    <span className="truncate">
                      {selectedGroup === 'ALL' ? `${ls.groupIds.join(', ')} • ` : ''}
                      {meta.text}
                    </span>
                  </div>
                </button>
              );
            })}
            {hud.currentLessons.length > 2 && (
              <div className="font-condensed text-xs font-semibold uppercase tracking-wide text-neutral-300">
                + ещё {hud.currentLessons.length - 2} пара(ы) в это время
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 border-2 border-dashed border-white/25 bg-[#0D0D0D] px-3 py-3 font-condensed text-sm uppercase tracking-wide text-neutral-300">
            {hud.isSunday ? 'Воскресенье — выходной день' : 'Сейчас пара не идёт'}
          </div>
        )}
      </div>

      {/* Next Lesson */}
      <div className="p5-shadow flex flex-col justify-between border-2 border-white bg-[#161616] p-4 lg:col-span-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="p5-skew inline-block border border-[#0D0D0D] bg-white px-2 py-0.5 shadow-[2px_2px_0_#E60012]">
            <span className="p5-unskew inline-flex items-center gap-1 font-condensed text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
              <Timer className="h-3.5 w-3.5 text-[#E60012]" />
              <span>СЛЕДУЮЩАЯ</span>
            </span>
          </span>

          {hud.nextSlot && (
            <span className="border-2 border-[#0D0D0D] bg-[#FFE600] px-2 py-0.5 font-condensed text-xs font-bold uppercase tabular-nums text-[#0D0D0D] shadow-[2px_2px_0_#0D0D0D]">
              ЧЕРЕЗ {formatCountdown(hud.nextSlot.startsInSeconds)}
            </span>
          )}
        </div>

        {hud.nextSlot ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-white">
              <Clock className="h-3.5 w-3.5 text-[#E60012]" />
              <span>
                {hud.nextSlot.isToday
                  ? `Сегодня в ${hud.nextSlot.startTime}`
                  : hud.nextSlot.dayOffset === 1
                    ? `Завтра (${DAY_LABELS_RU[hud.nextSlot.day]}) в ${hud.nextSlot.startTime}`
                    : `${DAY_LABELS_RU[hud.nextSlot.day]} в ${hud.nextSlot.startTime}`}
              </span>
            </div>

            {hud.nextSlot.lessons.length === 1 ? (
              (() => {
                const nextLesson = hud.nextSlot.lessons[0];
                const meta = getLessonDisplayMeta(nextLesson);
                return (
                  <button
                    type="button"
                    onClick={() => onSelectLesson(nextLesson)}
                    className="block w-full border-2 border-white bg-[#0D0D0D] px-3 py-2 text-left shadow-[3px_3px_0_#0D0D0D] transition hover:-translate-y-0.5 hover:border-[#E60012]"
                  >
                    <div className="truncate text-sm font-bold text-white">
                      {nextLesson.subject}
                    </div>
                    <div
                      className={`mt-1 flex items-center gap-1.5 truncate text-xs ${
                        meta.isPinnedSubgroup
                          ? 'font-bold text-[#FFE600]'
                          : 'text-neutral-300'
                      }`}
                    >
                      {meta.isPinnedSubgroup && (
                        <>
                          <Pin className="h-3 w-3 shrink-0 text-[#FFE600]" />
                          <span className="shrink-0 border border-[#FFE600] bg-[#161616] px-1 font-condensed text-[10px] font-bold uppercase text-[#FFE600]">
                            ПОДГРУППА
                          </span>
                        </>
                      )}
                      <span className="truncate">{meta.text}</span>
                    </div>
                  </button>
                );
              })()
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {hud.nextSlot.lessons.map((ls) => {
                  const meta = getLessonDisplayMeta(ls);
                  return (
                    <button
                      key={ls.id}
                      type="button"
                      onClick={() => onSelectLesson(ls)}
                      className="max-w-full border-2 border-white bg-[#0D0D0D] px-2.5 py-1.5 text-left text-xs shadow-[3px_3px_0_#0D0D0D] transition hover:-translate-y-0.5 hover:border-[#E60012]"
                    >
                      <div className="flex items-center gap-1.5">
                        {meta.isPinnedSubgroup && (
                          <Pin className="h-3 w-3 shrink-0 text-[#FFE600]" />
                        )}
                        <span className="font-bold text-white">{ls.subject}</span>{' '}
                        <span className="font-condensed font-bold text-[#FFE600]">
                          ({ls.groupIds.join(', ')})
                        </span>
                      </div>
                      {meta.isPinnedSubgroup && meta.text && (
                        <div className="mt-0.5 truncate text-[11px] font-bold text-[#FFE600]">
                          {meta.text}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 border-2 border-dashed border-white/25 bg-[#0D0D0D] px-3 py-3 font-condensed text-sm uppercase tracking-wide text-neutral-300">
            Запланированных пар не найдено
          </div>
        )}
      </div>
    </section>
  );
}
