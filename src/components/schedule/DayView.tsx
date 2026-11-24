import { LayoutGroup, m, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import {
  DAY_LABELS_RU,
  DAY_SHORT_EN,
  DAY_SHORT_RU,
  DAYS,
} from '../../constants/schedule';
import type {
  DayOfWeek,
  EffectiveLesson,
  GroupFilter,
  ScheduleScopeMode,
} from '../../types/schedule';
import {
  getCardSlamItemVariants,
  getCursorSpring,
  getStaggerContainerVariants,
} from '../../utils/p5Motion';
import { filterLessonsByScope } from '../../utils/time';
import { LessonCard } from './LessonCard';

interface DayViewProps {
  selectedDay: DayOfWeek;
  todayDay: DayOfWeek | 'SUNDAY';
  onSelectDay: (day: DayOfWeek) => void;
  lessons: EffectiveLesson[];
  selectedGroup: GroupFilter;
  scopeMode: ScheduleScopeMode;
  focusedTeacherId: string | null;
  saturdayNotes: string[];
  saturdayNotesCollapsed: boolean;
  onToggleSaturdayNotes: () => void;
  currentLessonIds: Set<string>;
  onSelectLesson: (lesson: EffectiveLesson) => void;
  onAddLessonForDay: (day: DayOfWeek) => void;
}

function formatLessonCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ПАРА`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} ПАРЫ`;
  }
  return `${count} ПАР`;
}

export function DayView({
  selectedDay,
  todayDay,
  onSelectDay,
  lessons,
  selectedGroup,
  scopeMode,
  focusedTeacherId,
  saturdayNotes,
  saturdayNotesCollapsed,
  onToggleSaturdayNotes,
  currentLessonIds,
  onSelectLesson,
  onAddLessonForDay,
}: DayViewProps) {
  const reduced = useReducedMotion();
  const cursorSpring = getCursorSpring(reduced);
  const containerVariants = getStaggerContainerVariants(reduced);
  const itemVariants = getCardSlamItemVariants(reduced);
  const tapProps = reduced
    ? {}
    : {
        whileTap: { x: 2, y: 2 },
        transition: { type: 'spring' as const, stiffness: 800, damping: 30 },
      };

  const scopedLessons = filterLessonsByScope(
    lessons,
    selectedGroup,
    scopeMode,
    focusedTeacherId
  );
  const dayLessons = scopedLessons.filter((ls) => ls.day === selectedDay);
  const isToday = selectedDay === todayDay;
  const dayIndexStr = String(DAYS.indexOf(selectedDay) + 1).padStart(2, '0');
  const showGroupsAlways = scopeMode === 'teacher';

  return (
    <div className="space-y-4">
      {/* Mobile Day Switcher + Selected Day Strip */}
      <div className="space-y-3 lg:hidden">
        <LayoutGroup id="p5-days-mobile">
          <div
            role="group"
            aria-label="Выбор дня недели"
            className="grid grid-cols-3 gap-2 sm:grid-cols-6"
          >
            {DAYS.map((day) => {
              const count = scopedLessons.filter((ls) => ls.day === day).length;
              const active = selectedDay === day;
              const dayIsToday = day === todayDay;
              return (
                <m.button
                  key={day}
                  type="button"
                  onClick={() => onSelectDay(day)}
                  {...tapProps}
                  className="relative px-2 py-1.5 text-left text-white"
                >
                  {active ? (
                    <m.div
                      layoutId="p5-day-cursor-mobile"
                      aria-hidden="true"
                      transition={cursorSpring}
                      className="pointer-events-none absolute inset-0 z-0"
                    >
                      <div className="p5-skew h-full w-full -rotate-[1deg] border-2 border-white bg-[#E60012] shadow-[4px_4px_0_#050505]" />
                    </m.div>
                  ) : (
                    <div
                      aria-hidden="true"
                      className={`p5-skew pointer-events-none absolute inset-0 z-0 border-2 bg-[#060606] shadow-[3px_3px_0_#050505] ${
                        dayIsToday ? 'border-[#FFE600]' : 'border-white'
                      }`}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-between gap-1">
                    <span className="flex flex-col leading-none">
                      <span className="font-condensed text-[9px] font-bold uppercase tracking-widest opacity-80">
                        {DAY_SHORT_EN[day]}
                      </span>
                      <span className="font-display text-xs uppercase">
                        {DAY_SHORT_RU[day]}
                      </span>
                    </span>
                    <span
                      className={`px-1 py-0.5 font-condensed text-[10px] font-bold leading-none ${
                        dayIsToday
                          ? 'bg-[#FFE600] text-[#050505]'
                          : active
                            ? 'bg-[#050505] text-white'
                            : 'bg-white text-[#050505]'
                      }`}
                    >
                      {count}
                    </span>
                  </span>
                </m.button>
              );
            })}
          </div>
        </LayoutGroup>

        <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-white bg-[#060606] px-3.5 py-2 shadow-[4px_4px_0_#E60012]">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-2xl uppercase leading-none text-white [text-shadow:2px_2px_0_#E60012]">
              {DAY_SHORT_EN[selectedDay]}
            </span>
            <span className="border-2 border-[#050505] bg-white px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#050505]">
              {DAY_LABELS_RU[selectedDay]}
            </span>
            {isToday && (
              <span className="border border-[#050505] bg-[#FFE600] px-1.5 py-0.5 font-display text-[10px] uppercase leading-none text-[#050505]">
                TODAY
              </span>
            )}
          </div>
          <span className="font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
            {formatLessonCount(dayLessons.length)}
          </span>
        </div>
      </div>

      {/* Desktop 2-Column Editorial Magazine Spread */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Editorial Rail: Giant Skewed Vertical Day Monument + Day Switcher */}
        <aside className="hidden lg:sticky lg:top-20 lg:col-span-4 lg:flex lg:flex-col lg:gap-4 xl:col-span-3">
          {/* Giant Skewed Day Poster */}
          <div className="relative -rotate-2 border-[3px] border-white bg-[#060606] p-5 shadow-[7px_7px_0_#E60012,9px_9px_0_#050505]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-condensed text-[11px] font-bold uppercase tracking-widest text-neutral-300">
                DAY {dayIndexStr} // AIU
              </span>
              {isToday && (
                <span className="border-2 border-[#050505] bg-[#FFE600] px-2 py-0.5 font-display text-[10px] uppercase leading-none tracking-wider text-[#050505]">
                  TODAY
                </span>
              )}
            </div>

            <div className="mt-2 font-display text-6xl uppercase leading-none tracking-tight text-white [text-shadow:4px_4px_0_#E60012]">
              {DAY_SHORT_EN[selectedDay]}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="p5-skew inline-block border-2 border-[#050505] bg-white px-3 py-1 text-[#050505] shadow-[3px_3px_0_#E60012]">
                <span className="p5-unskew block font-display text-sm uppercase leading-none tracking-wider">
                  {DAY_LABELS_RU[selectedDay]}
                </span>
              </span>

              <span className="border border-white/80 bg-[#E60012] px-2 py-1 font-condensed text-xs font-bold uppercase leading-none tracking-wider text-white">
                {formatLessonCount(dayLessons.length)}
              </span>
            </div>
          </div>

          {/* Vertical P5R Day Switcher */}
          <LayoutGroup id="p5-days-desktop">
            <div
              role="group"
              aria-label="Переключение дня недели"
              className="flex flex-col gap-2"
            >
              {DAYS.map((day) => {
                const count = scopedLessons.filter((ls) => ls.day === day).length;
                const active = selectedDay === day;
                const dayIsToday = day === todayDay;

                return (
                  <m.button
                    key={day}
                    type="button"
                    onClick={() => onSelectDay(day)}
                    {...tapProps}
                    className="relative px-3.5 py-2 text-left text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE600]"
                  >
                    {active ? (
                      <m.div
                        layoutId="p5-day-cursor-desktop"
                        aria-hidden="true"
                        transition={cursorSpring}
                        className="pointer-events-none absolute inset-0 z-0"
                      >
                        <div className="p5-skew h-full w-full -rotate-[1deg] border-2 border-white bg-[#E60012] shadow-[4px_4px_0_#050505]" />
                      </m.div>
                    ) : (
                      <div
                        aria-hidden="true"
                        className={`p5-skew pointer-events-none absolute inset-0 z-0 border-2 bg-[#060606] shadow-[3px_3px_0_#050505] transition-colors ${
                          dayIsToday ? 'border-[#FFE600]' : 'border-white'
                        }`}
                      />
                    )}

                    <span className="relative z-10 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="font-display text-sm uppercase tracking-wider">
                          {DAY_SHORT_EN[day]}
                        </span>
                        <span className="truncate font-condensed text-xs font-bold uppercase tracking-wide text-neutral-200">
                          {DAY_LABELS_RU[day]}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-1.5">
                        {dayIsToday && (
                          <span className="bg-[#FFE600] px-1.5 py-0.5 font-display text-[9px] uppercase leading-none text-[#050505]">
                            TODAY
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 font-condensed text-xs font-bold leading-none ${
                            active
                              ? 'bg-[#050505] text-white'
                              : 'bg-white text-[#050505]'
                          }`}
                        >
                          {count}
                        </span>
                      </span>
                    </span>
                  </m.button>
                );
              })}
            </div>
          </LayoutGroup>
        </aside>

        {/* Right Column: Dynamic Lesson Cards with Diagonal Slam-In */}
        <div className="min-w-0 space-y-4 lg:col-span-8 xl:col-span-9">
          {selectedDay === 'SATURDAY' && saturdayNotes.length > 0 && (
            <div className="border-2 border-[#FFE600] border-l-[6px] border-l-[#E60012] bg-[#060606] px-3.5 py-2.5 text-xs text-white shadow-[5px_5px_0_#050505]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[#FFE600]" />
                  <span className="font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
                    ПРИМЕЧАНИЯ ПО СУББОТЕ
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onToggleSaturdayNotes}
                  aria-expanded={!saturdayNotesCollapsed}
                  className="p5-skew inline-flex items-center border border-white/70 bg-[#050505] px-2.5 py-1 text-white transition-colors hover:border-[#FFE600] hover:text-[#FFE600]"
                >
                  <span className="p5-unskew inline-flex items-center gap-1 font-condensed text-[11px] font-bold uppercase tracking-wider">
                    {saturdayNotesCollapsed ? (
                      <>
                        <span>Показать</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Свернуть</span>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </>
                    )}
                  </span>
                </button>
              </div>

              {!saturdayNotesCollapsed && (
                <p className="mt-1.5 leading-snug text-neutral-200">
                  {saturdayNotes.slice(0, 2).join(' · ')}
                </p>
              )}
            </div>
          )}

          {dayLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-2 border-white bg-[#060606] px-6 py-12 text-center shadow-[6px_6px_0_#E60012]">
              <p className="font-display text-sm uppercase tracking-wider text-white sm:text-base">
                На {DAY_LABELS_RU[selectedDay].toLowerCase()} пар не
                запланировано.
              </p>
              <button
                type="button"
                onClick={() => onAddLessonForDay(selectedDay)}
                className="p5-skew mt-4 border-2 border-[#050505] bg-white px-4 py-2 text-[#050505] shadow-[4px_4px_0_#E60012] hover:border-white hover:bg-[#E60012] hover:text-white"
              >
                <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                  <Plus className="h-4 w-4" />
                  <span>Добавить пару на этот день</span>
                </span>
              </button>
            </div>
          ) : (
            <m.div
              key={`${selectedDay}-${selectedGroup}-${scopeMode}-${focusedTeacherId ?? ''}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={
                selectedGroup === 'ALL'
                  ? 'grid gap-x-5 gap-y-6 pt-3 xl:grid-cols-2'
                  : 'max-w-4xl space-y-6 pt-3'
              }
            >
              {dayLessons.map((lesson, idx) => (
                <m.div key={lesson.id} variants={itemVariants}>
                  <LessonCard
                    lesson={lesson}
                    selectedGroup={selectedGroup}
                    compact={false}
                    isToday={isToday}
                    tiltIndex={idx}
                    showGroupLineOverride={showGroupsAlways}
                    isCurrent={currentLessonIds.has(lesson.id)}
                    onClick={() => onSelectLesson(lesson)}
                  />
                </m.div>
              ))}
            </m.div>
          )}
        </div>
      </div>
    </div>
  );
}
