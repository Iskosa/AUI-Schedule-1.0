import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Pin } from 'lucide-react';
import { DAY_PHASE_LABELS, DAY_SHORT_RU } from '../../constants/schedule';
import type {
  DayOfWeek,
  EffectiveLesson,
  GroupFilter,
  ViewMode,
} from '../../types/schedule';
import { getHudFlipMotionProps } from '../../utils/p5Motion';
import {
  computeLiveHudState,
  formatClock,
  formatCountdown,
  formatRussianWeekday,
} from '../../utils/time';

interface LiveHudBarProps {
  now: Date;
  lessons: EffectiveLesson[];
  selectedGroup: GroupFilter;
  selectedDay?: DayOfWeek;
  viewMode?: ViewMode;
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
        text: `${pinned.teacherName}${pinned.room ? ` · ${pinned.room}` : ''}`,
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
    text: parts.join(' · '),
    isPinnedSubgroup: false,
  };
}

export function LiveHudBar({
  now,
  lessons,
  selectedGroup,
  selectedDay,
  viewMode,
  onSelectLesson,
}: LiveHudBarProps) {
  const reduced = useReducedMotion();
  const hudFlipMotion = getHudFlipMotionProps(reduced);

  const hud = useMemo(
    () => computeLiveHudState(now, lessons, selectedGroup),
    [now, lessons, selectedGroup]
  );

  const phaseMeta = DAY_PHASE_LABELS[hud.phase];
  const dayNum = String(now.getDate());
  const monthNum = String(now.getMonth() + 1).padStart(2, '0');
  const flipKey =
    viewMode === 'day' && selectedDay
      ? `${hud.todayDay}-${selectedDay}`
      : hud.todayDay;

  const currentPrimary = hud.currentLessons[0] ?? null;
  const currentMeta = currentPrimary ? getLessonDisplayMeta(currentPrimary) : null;

  const nextPrimary = hud.nextSlot?.lessons[0] ?? null;
  const nextMeta = nextPrimary ? getLessonDisplayMeta(nextPrimary) : null;

  const nextWhenLabel = hud.nextSlot
    ? hud.nextSlot.isToday
      ? hud.nextSlot.startTime
      : hud.nextSlot.dayOffset === 1
        ? `Завтра ${hud.nextSlot.startTime}`
        : `${DAY_SHORT_RU[hud.nextSlot.day]} ${hud.nextSlot.startTime}`
    : '';

  return (
    <section
      aria-label="Живой статус расписания"
      className="flex flex-col gap-2 border border-white/15 border-l-4 border-l-[#E60012] bg-[#141414]/90 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-2"
    >
      {/* Left: Date Flip Block, Weekday, Clock & Day Phase */}
      <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:gap-3">
        <div style={{ perspective: 500 }}>
          <motion.div
            key={flipKey}
            {...hudFlipMotion}
            style={{ transformOrigin: '50% 0%' }}
            className="flex items-center gap-2"
          >
            <div className="p5-skew border border-white/80 bg-[#0B0B0B] px-2 py-0.5 shadow-[2px_2px_0_#E60012]">
              <span className="p5-unskew block font-display text-lg leading-none tracking-tight text-white sm:text-xl">
                {dayNum}
                <span className="mx-0.5 text-[#E60012]">/</span>
                {monthNum}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm ${
                  hud.isSunday ? 'text-[#E60012]' : 'text-white'
                }`}
              >
                {formatRussianWeekday(now)}
              </span>
              {viewMode === 'day' &&
                selectedDay &&
                selectedDay !== hud.todayDay && (
                  <span className="bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none text-[#0B0B0B]">
                    → {DAY_SHORT_RU[selectedDay].toUpperCase()}
                  </span>
                )}
            </div>
          </motion.div>
        </div>

        <span
          aria-hidden="true"
          className="hidden h-4 w-px bg-white/15 sm:block"
        />

        <div className="flex items-center gap-2">
          <span className="font-condensed text-sm font-bold tabular-nums tracking-wider text-neutral-200 sm:text-base">
            {formatClock(now)}
          </span>
          <span className={`p5-skew inline-block px-2 py-0.5 ${phaseMeta.style}`}>
            <span className="p5-unskew block font-condensed text-[10px] font-bold uppercase leading-none tracking-widest">
              {phaseMeta.label}
            </span>
          </span>
        </div>
      </div>

      {/* Right: Single clean Current / Next Lesson status + Countdown */}
      <div className="min-w-0 flex-1">
        {currentPrimary && currentMeta ? (
          <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:justify-end">
              <span className="p5-skew shrink-0 bg-[#E60012] px-2 py-0.5 text-white">
                <span className="p5-unskew block font-condensed text-[10px] font-bold uppercase leading-none tracking-wider">
                  СЕЙЧАС
                </span>
              </span>

              <button
                type="button"
                onClick={() => onSelectLesson(currentPrimary)}
                className="group flex min-w-0 items-center gap-1.5 text-left transition-colors hover:text-[#FFE600]"
              >
                {currentMeta.isPinnedSubgroup && (
                  <Pin className="h-3 w-3 shrink-0 text-[#FFE600]" />
                )}
                <span className="truncate text-xs font-bold text-white group-hover:text-[#FFE600] sm:text-sm">
                  {currentPrimary.subject}
                </span>
                {currentMeta.text && (
                  <span className="hidden truncate text-xs text-neutral-400 md:inline">
                    · {currentMeta.text}
                  </span>
                )}
                {hud.currentLessons.length > 1 && (
                  <span className="shrink-0 font-condensed text-[11px] font-bold text-[#FFE600]">
                    +{hud.currentLessons.length - 1}
                  </span>
                )}
              </button>
            </div>

            {hud.currentEndsInSeconds !== null && (
              <span className="shrink-0 border border-[#FFE600]/60 bg-[#0B0B0B] px-2 py-0.5 font-condensed text-[11px] font-bold uppercase tabular-nums text-[#FFE600]">
                ДО КОНЦА {formatCountdown(hud.currentEndsInSeconds)}
              </span>
            )}
          </div>
        ) : hud.nextSlot && nextPrimary && nextMeta ? (
          <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:justify-end">
              <span className="p5-skew shrink-0 bg-white px-2 py-0.5 text-[#0B0B0B]">
                <span className="p5-unskew block font-condensed text-[10px] font-bold uppercase leading-none tracking-wider">
                  СЛЕДУЮЩАЯ
                </span>
              </span>

              <button
                type="button"
                onClick={() => onSelectLesson(nextPrimary)}
                className="group flex min-w-0 items-center gap-1.5 text-left transition-colors hover:text-[#FFE600]"
              >
                {nextMeta.isPinnedSubgroup && (
                  <Pin className="h-3 w-3 shrink-0 text-[#FFE600]" />
                )}
                <span className="truncate text-xs font-bold text-white group-hover:text-[#FFE600] sm:text-sm">
                  {nextPrimary.subject}
                </span>
                <span className="shrink-0 font-condensed text-[11px] font-semibold text-neutral-400">
                  · {nextWhenLabel}
                </span>
                {nextMeta.text && (
                  <span className="hidden max-w-[200px] truncate text-xs text-neutral-400 lg:inline">
                    · {nextMeta.text}
                  </span>
                )}
                {hud.nextSlot.lessons.length > 1 && (
                  <span className="shrink-0 font-condensed text-[11px] font-bold text-[#FFE600]">
                    +{hud.nextSlot.lessons.length - 1}
                  </span>
                )}
              </button>
            </div>

            <span className="shrink-0 bg-[#FFE600] px-2 py-0.5 font-condensed text-[11px] font-bold uppercase tabular-nums text-[#0B0B0B]">
              ЧЕРЕЗ {formatCountdown(hud.nextSlot.startsInSeconds)}
            </span>
          </div>
        ) : (
          <div className="text-left font-condensed text-xs font-semibold uppercase tracking-wider text-neutral-400 sm:text-right">
            {hud.isSunday
              ? 'Воскресенье — выходной день'
              : 'Запланированных пар не найдено'}
          </div>
        )}
      </div>
    </section>
  );
}
