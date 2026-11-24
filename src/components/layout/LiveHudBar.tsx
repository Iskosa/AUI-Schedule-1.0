import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Globe, MapPin, Pin, User } from 'lucide-react';
import { DAY_PHASE_LABELS, DAY_SHORT_RU } from '../../constants/schedule';
import type {
  DayOfWeek,
  EffectiveLesson,
  GroupFilter,
  ScheduleScopeMode,
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
  showSelectedDayChip?: boolean;
  scopeMode?: ScheduleScopeMode;
  focusedTeacherId?: string | null;
  onSelectLesson: (lesson: EffectiveLesson) => void;
  onJumpToToday: () => void;
}

interface HeroLessonMeta {
  roomText: string | null;
  teacherText: string | null;
  isPinnedSubgroup: boolean;
  subgroupCount: number;
}

function formatSubgroupCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ПОДГРУППА ▸`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} ПОДГРУППЫ ▸`;
  }
  return `${count} ПОДГРУПП ▸`;
}

function getHeroLessonMeta(
  lesson: EffectiveLesson,
  scopeMode: ScheduleScopeMode,
  focusedTeacherId: string | null
): HeroLessonMeta {
  if (scopeMode === 'teacher' && focusedTeacherId && lesson.subgroups) {
    const matched = lesson.subgroups.find(
      (sg) => sg.teacherId === focusedTeacherId
    );
    if (matched) {
      return {
        roomText: matched.room || null,
        teacherText: matched.teacherName || null,
        isPinnedSubgroup: true,
        subgroupCount: lesson.subgroups.length,
      };
    }
  }

  if (lesson.pinnedSubgroupTeacherId && lesson.subgroups) {
    const pinned = lesson.subgroups.find(
      (sg) => sg.teacherId === lesson.pinnedSubgroupTeacherId
    );
    if (pinned) {
      return {
        roomText: pinned.room || null,
        teacherText: pinned.teacherName || null,
        isPinnedSubgroup: true,
        subgroupCount: lesson.subgroups.length,
      };
    }
  }

  if (lesson.subgroups && lesson.subgroups.length > 0) {
    return {
      roomText: null,
      teacherText: null,
      isPinnedSubgroup: false,
      subgroupCount: lesson.subgroups.length,
    };
  }

  return {
    roomText: lesson.isOnline ? null : lesson.room,
    teacherText: lesson.teacherName,
    isPinnedSubgroup: false,
    subgroupCount: 0,
  };
}

export function LiveHudBar({
  now,
  lessons,
  selectedGroup,
  selectedDay,
  viewMode,
  showSelectedDayChip = true,
  scopeMode = 'group',
  focusedTeacherId = null,
  onSelectLesson,
  onJumpToToday,
}: LiveHudBarProps) {
  const reduced = useReducedMotion();
  const hudFlipMotion = getHudFlipMotionProps(reduced);

  const hud = useMemo(
    () =>
      computeLiveHudState(now, lessons, selectedGroup, {
        scopeMode,
        focusedTeacherId,
      }),
    [now, lessons, selectedGroup, scopeMode, focusedTeacherId]
  );

  const phaseMeta = DAY_PHASE_LABELS[hud.phase];
  const dayNum = String(now.getDate());
  const monthNum = String(now.getMonth() + 1).padStart(2, '0');
  const flipKey =
    showSelectedDayChip && viewMode === 'day' && selectedDay
      ? `${hud.todayDay}-${selectedDay}`
      : hud.todayDay;

  const currentPrimary = hud.currentLessons[0] ?? null;
  const currentMeta = currentPrimary
    ? getHeroLessonMeta(currentPrimary, scopeMode, focusedTeacherId)
    : null;

  const nextPrimary = hud.nextSlot?.lessons[0] ?? null;
  const nextMeta = nextPrimary
    ? getHeroLessonMeta(nextPrimary, scopeMode, focusedTeacherId)
    : null;

  const nextWhenLabel = hud.nextSlot
    ? hud.nextSlot.isToday
      ? `СЕГОДНЯ ${hud.nextSlot.startTime}`
      : hud.nextSlot.dayOffset === 1
        ? `ЗАВТРА ${hud.nextSlot.startTime}`
        : `${DAY_SHORT_RU[hud.nextSlot.day].toUpperCase()} ${hud.nextSlot.startTime}`
    : '';

  const activePrimary = currentPrimary ?? nextPrimary;
  const activeMeta = currentPrimary ? currentMeta : nextMeta;
  const isLiveNow = Boolean(currentPrimary);
  const extraLessonsCount = isLiveNow
    ? Math.max(0, hud.currentLessons.length - 1)
    : Math.max(0, (hud.nextSlot?.lessons.length ?? 0) - 1);
  const timerSeconds = isLiveNow
    ? hud.currentEndsInSeconds
    : hud.nextSlot?.startsInSeconds ?? null;

  const isViewingNonTodayDay = Boolean(
    showSelectedDayChip &&
      viewMode === 'day' &&
      selectedDay &&
      selectedDay !== hud.todayDay
  );

  return (
    <section
      aria-label="Живой статус расписания"
      className="grid grid-cols-1 items-center gap-5 pt-2 lg:grid-cols-12 lg:gap-6"
    >
      {/* Left Zone: Iconic P5R Calendar Polygon + Protruding Weekday & Phase */}
      <div className="lg:col-span-5" style={{ perspective: 600 }}>
        <motion.div
          key={flipKey}
          {...hudFlipMotion}
          style={{ transformOrigin: '50% 0%' }}
          className="flex items-center"
        >
          {/* Giant tilted date polygon (clickable return to today) */}
          <motion.button
            type="button"
            onClick={onJumpToToday}
            title="Вернуться к сегодняшнему дню"
            aria-label="Вернуться к сегодняшнему дню"
            whileHover={reduced ? undefined : { scale: 1.03 }}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 700, damping: 28 }}
            className="relative z-10 shrink-0 -rotate-[5deg] cursor-pointer text-left filter-[drop-shadow(6px_6px_0_#050505)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFE600]"
          >
            <div className="p5-clip-calendar bg-white p-[4px] transition-colors hover:bg-[#FFE600]">
              <div className="p5-clip-calendar bg-[#050505] px-4 py-2 sm:px-5 sm:py-2.5">
                <span className="block font-display text-[44px] leading-[0.88] tracking-tight text-white tabular-nums sm:text-[56px]">
                  {dayNum}
                  <span className="mx-0.5 text-[#E60012]">/</span>
                  {monthNum}
                </span>
              </div>
            </div>
          </motion.button>

          {/* Protruding tilted metadata stack overlapping the calendar polygon */}
          <div className="relative z-20 -ml-2.5 flex min-w-0 flex-col items-start gap-1.5 sm:-ml-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="-rotate-3 border-2 border-[#050505] bg-white px-3 py-1 text-[#050505] shadow-[4px_4px_0_#050505]">
                <span
                  className={`block font-display text-sm uppercase leading-none tracking-wider sm:text-base ${
                    hud.isSunday ? 'text-[#E60012]' : 'text-[#050505]'
                  }`}
                >
                  {formatRussianWeekday(now)}
                </span>
              </div>

              {isViewingNonTodayDay && selectedDay && (
                <motion.button
                  type="button"
                  onClick={onJumpToToday}
                  title="Вернуться на сегодняшний день"
                  aria-label="Вернуться на сегодняшний день"
                  whileHover={reduced ? undefined : { y: -2, scale: 1.04 }}
                  whileTap={reduced ? undefined : { x: 2, y: 2 }}
                  className="-rotate-2 cursor-pointer border-2 border-white bg-[#E60012] px-2 py-1 font-condensed text-[11px] font-bold uppercase leading-none text-white shadow-[3px_3px_0_#050505] transition-colors hover:border-[#050505] hover:bg-[#FFE600] hover:text-[#050505]"
                >
                  → {DAY_SHORT_RU[selectedDay].toUpperCase()}
                </motion.button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pl-2 sm:pl-3">
              <span
                className={`p5-skew inline-block rotate-2 px-2.5 py-0.5 shadow-[3px_3px_0_#050505] ${phaseMeta.style}`}
              >
                <span className="p5-unskew block font-condensed text-[11px] font-bold uppercase leading-none tracking-widest">
                  {phaseMeta.label}
                </span>
              </span>

              <span className="border-2 border-white bg-[#050505] px-2 py-0.5 font-condensed text-xs font-bold tabular-nums tracking-widest text-white shadow-[3px_3px_0_#050505] sm:text-sm">
                {formatClock(now)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Zone: Asymmetric Skewed Next / Current Lesson Hero Card */}
      <div className="min-w-0 pt-2 lg:col-span-7 lg:pt-0">
        {activePrimary && activeMeta ? (
          <motion.button
            type="button"
            onClick={() => onSelectLesson(activePrimary)}
            whileHover={reduced ? undefined : { y: -3, scale: 1.01 }}
            whileTap={reduced ? undefined : { x: 4, y: 4, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 750, damping: 28 }}
            className={`group relative block w-full cursor-pointer border-2 bg-[#060606] px-4 pt-1 pb-3.5 pl-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE600] sm:px-5 sm:pb-4 sm:pl-6 ${
              isLiveNow
                ? 'border-[#FFE600] shadow-[6px_6px_0_#E60012,8px_8px_0_#050505] hover:shadow-[7px_7px_0_#FFE600,9px_9px_0_#050505]'
                : 'border-white shadow-[6px_6px_0_#050505] hover:border-white hover:shadow-[7px_7px_0_#E60012,9px_9px_0_#050505]'
            }`}
          >
            {/* Clipped background corner & hover crimson wedge */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <span
                className={`absolute inset-y-0 left-0 w-1.5 ${
                  isLiveNow ? 'bg-[#FFE600]' : 'bg-[#E60012]'
                }`}
              />
              {!reduced && (
                <span
                  style={{ clipPath: 'polygon(0 0, 100% 0, 40% 100%, 0 100%)' }}
                  className="absolute inset-y-0 left-0 w-4 -translate-x-full bg-[#E60012] transition-transform duration-100 ease-out md:group-hover:translate-x-0"
                />
              )}
            </div>

            {/* Protruding top label tag */}
            <div className="relative z-10 -mt-4 mb-2 flex flex-wrap items-center gap-2">
              {isLiveNow ? (
                <span className="p5-skew inline-block border-2 border-white bg-[#E60012] px-3 py-0.5 text-white shadow-[3px_3px_0_#050505]">
                  <span className="p5-unskew block font-display text-xs uppercase leading-tight tracking-wider">
                    СЕЙЧАС ИДЁТ
                  </span>
                </span>
              ) : (
                <>
                  <span className="p5-skew inline-block border-2 border-[#050505] bg-white px-3 py-0.5 text-[#050505] shadow-[3px_3px_0_#050505]">
                    <span className="p5-unskew block font-display text-xs uppercase leading-tight tracking-wider">
                      СЛЕДУЮЩАЯ ПАРА
                    </span>
                  </span>
                  {nextWhenLabel && (
                    <span className="p5-skew inline-block border-2 border-white bg-[#E60012] px-2.5 py-0.5 text-white shadow-[3px_3px_0_#050505]">
                      <span className="p5-unskew block font-condensed text-xs font-bold uppercase leading-tight tracking-wider">
                        {nextWhenLabel}
                      </span>
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Main Subject + Meta + Giant Yellow Countdown */}
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="break-words font-display text-base uppercase leading-tight tracking-wide text-white transition-colors group-hover:text-[#FFE600] sm:text-xl">
                    {activePrimary.subject}
                  </h2>
                  {extraLessonsCount > 0 && (
                    <span className="shrink-0 border border-white bg-[#E60012] px-1.5 py-0.5 font-condensed text-[11px] font-bold leading-none text-white">
                      +{extraLessonsCount}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                  {activeMeta.isPinnedSubgroup ? (
                    <span className="inline-flex flex-wrap items-center gap-1.5 font-condensed font-bold uppercase tracking-wide text-[#FFE600]">
                      <Pin className="h-3.5 w-3.5 shrink-0" />
                      <span>{activeMeta.teacherText}</span>
                      {activeMeta.roomText && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{activeMeta.roomText}</span>
                        </>
                      )}
                    </span>
                  ) : (
                    <>
                      {activePrimary.isOnline && (
                        <span className="inline-flex items-center gap-1 border border-[#050505] bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[11px] font-bold uppercase leading-none tracking-wider text-[#050505]">
                          <Globe className="h-3 w-3" />
                          <span>ONLINE</span>
                        </span>
                      )}
                      {activeMeta.roomText && (
                        <span className="inline-flex items-center gap-1 font-condensed font-bold uppercase tracking-wide text-white">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E60012]" />
                          <span>{activeMeta.roomText}</span>
                        </span>
                      )}
                      {activeMeta.teacherText ? (
                        <span className="inline-flex min-w-0 items-center gap-1 font-medium text-neutral-200">
                          <User className="h-3.5 w-3.5 shrink-0 text-[#E60012]" />
                          <span className="break-words">
                            {activeMeta.teacherText}
                          </span>
                        </span>
                      ) : (
                        activeMeta.subgroupCount > 0 && (
                          <span className="inline-flex items-center whitespace-nowrap border border-white/80 bg-[#E60012] px-2 py-0.5 font-condensed text-[11px] font-bold uppercase tracking-wider text-white">
                            {formatSubgroupCount(activeMeta.subgroupCount)}
                          </span>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>

              {timerSeconds !== null && (
                <div className="p5-skew shrink-0 self-start border-2 border-[#050505] bg-[#FFE600] px-3.5 py-1.5 text-[#050505] shadow-[4px_4px_0_#E60012] sm:self-center">
                  <div className="p5-unskew flex flex-col items-start sm:items-end">
                    <span className="font-condensed text-[10px] font-bold uppercase leading-none tracking-widest text-[#050505]">
                      {isLiveNow ? 'ДО КОНЦА' : 'ЧЕРЕЗ'}
                    </span>
                    <span className="mt-0.5 whitespace-nowrap font-display text-lg leading-none tabular-nums text-[#050505] sm:text-2xl">
                      {formatCountdown(timerSeconds)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.button>
        ) : (
          <div className="border-2 border-white bg-[#060606] px-4 py-3 shadow-[5px_5px_0_#050505]">
            <p className="font-display text-sm uppercase tracking-wider text-white">
              {hud.isSunday
                ? 'Воскресенье — выходной день'
                : 'Запланированных пар не найдено'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
