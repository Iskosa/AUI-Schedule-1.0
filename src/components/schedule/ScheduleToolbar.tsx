import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Calendar, Columns3, Plus } from 'lucide-react';
import { DAY_SHORT_EN, DAY_SHORT_RU, DAYS } from '../../constants/schedule';
import type {
  DayOfWeek,
  EffectiveLesson,
  GroupFilter,
  ViewMode,
} from '../../types/schedule';
import { getCursorSpring } from '../../utils/p5Motion';
import { filterLessonsByGroup } from '../../utils/time';

interface ScheduleToolbarProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  lessons: EffectiveLesson[];
  selectedGroup: GroupFilter;
  onAddLesson: () => void;
}

export function ScheduleToolbar({
  viewMode,
  onChangeViewMode,
  selectedDay,
  onSelectDay,
  lessons,
  selectedGroup,
  onAddLesson,
}: ScheduleToolbarProps) {
  const reduced = useReducedMotion();
  const cursorSpring = getCursorSpring(reduced);
  const tapProps = reduced
    ? {}
    : {
        whileTap: { x: 2, y: 2 },
        transition: { type: 'spring' as const, stiffness: 800, damping: 30 },
      };

  const groupLessons = filterLessonsByGroup(lessons, selectedGroup);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 pb-2.5">
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* View Mode Switcher */}
        <LayoutGroup id="p5-viewmode">
          <div
            role="group"
            aria-label="Режим отображения расписания"
            className="inline-flex items-center gap-1.5"
          >
            <motion.button
              type="button"
              onClick={() => onChangeViewMode('day')}
              {...tapProps}
              className={`relative px-3 py-1.5 transition-colors ${
                viewMode === 'day'
                  ? 'text-white'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              {viewMode === 'day' ? (
                <motion.div
                  layoutId="p5-viewmode-cursor"
                  aria-hidden="true"
                  transition={cursorSpring}
                  className="pointer-events-none absolute inset-0 z-0"
                >
                  <div className="p5-skew h-full w-full -rotate-[1.2deg] border border-white bg-[#E60012] shadow-[3px_3px_0_#000000]" />
                </motion.div>
              ) : (
                <div
                  aria-hidden="true"
                  className="p5-skew pointer-events-none absolute inset-0 z-0 border border-white/20 bg-[#141414]/80"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                <Calendar className="h-3.5 w-3.5" />
                <span>День</span>
              </span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onChangeViewMode('week')}
              {...tapProps}
              className={`relative px-3 py-1.5 transition-colors ${
                viewMode === 'week'
                  ? 'text-white'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              {viewMode === 'week' ? (
                <motion.div
                  layoutId="p5-viewmode-cursor"
                  aria-hidden="true"
                  transition={cursorSpring}
                  className="pointer-events-none absolute inset-0 z-0"
                >
                  <div className="p5-skew h-full w-full -rotate-[1.2deg] border border-white bg-[#E60012] shadow-[3px_3px_0_#000000]" />
                </motion.div>
              ) : (
                <div
                  aria-hidden="true"
                  className="p5-skew pointer-events-none absolute inset-0 z-0 border border-white/20 bg-[#141414]/80"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                <Columns3 className="h-3.5 w-3.5" />
                <span>Неделя</span>
              </span>
            </motion.button>
          </div>
        </LayoutGroup>

        {/* MON-SAT Day Selector with flying crimson cursor */}
        {viewMode === 'day' && (
          <LayoutGroup id="p5-days">
            <div className="flex flex-wrap items-center gap-1.5">
              {DAYS.map((day) => {
                const count = groupLessons.filter((ls) => ls.day === day).length;
                const active = selectedDay === day;
                return (
                  <motion.button
                    key={day}
                    type="button"
                    onClick={() => onSelectDay(day)}
                    {...tapProps}
                    className={`relative px-2.5 py-1 transition-colors ${
                      active
                        ? 'text-white'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    {active ? (
                      <motion.div
                        layoutId="p5-day-cursor"
                        aria-hidden="true"
                        transition={cursorSpring}
                        className="pointer-events-none absolute inset-0 z-0"
                      >
                        <div className="p5-skew h-full w-full -rotate-[1.2deg] border border-white bg-[#E60012] shadow-[3px_3px_0_#000000]" />
                      </motion.div>
                    ) : (
                      <div
                        aria-hidden="true"
                        className="p5-skew pointer-events-none absolute inset-0 z-0 border border-white/15 bg-[#141414]/75"
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      <span className="flex flex-col items-start leading-none">
                        <span className="font-condensed text-[9px] font-bold uppercase tracking-widest opacity-80">
                          {DAY_SHORT_EN[day]}
                        </span>
                        <span className="font-condensed text-xs font-bold uppercase sm:text-sm">
                          {DAY_SHORT_RU[day]}
                        </span>
                      </span>
                      <span
                        className={`px-1 py-0.5 font-condensed text-[10px] font-bold leading-none ${
                          active
                            ? 'bg-[#0B0B0B] text-[#FFE600]'
                            : 'bg-white/10 text-neutral-300'
                        }`}
                      >
                        {count}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </LayoutGroup>
        )}
      </div>

      {/* Add Lesson Button */}
      <motion.button
        type="button"
        onClick={onAddLesson}
        {...tapProps}
        className="p5-skew border border-[#0B0B0B] bg-[#FFE600] px-3.5 py-1.5 text-[#0B0B0B] shadow-[3px_3px_0_#E60012] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white hover:shadow-[3px_3px_0_#000000]"
      >
        <span className="p5-unskew inline-flex items-center justify-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
          <Plus className="h-3.5 w-3.5" />
          <span>Добавить пару</span>
        </span>
      </motion.button>
    </div>
  );
}
