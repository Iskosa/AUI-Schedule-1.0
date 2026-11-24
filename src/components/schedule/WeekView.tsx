import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { DAY_LABELS_RU, DAY_SHORT_EN, DAYS } from '../../constants/schedule';
import type {
  DayOfWeek,
  EffectiveLesson,
  GroupFilter,
} from '../../types/schedule';
import { getCardSlamItemVariants } from '../../utils/p5Motion';
import { filterLessonsByGroup } from '../../utils/time';
import { LessonCard } from './LessonCard';

interface WeekViewProps {
  lessons: EffectiveLesson[];
  selectedGroup: GroupFilter;
  todayDay: DayOfWeek | 'SUNDAY';
  currentLessonIds: Set<string>;
  onSelectLesson: (lesson: EffectiveLesson) => void;
  onFocusDay: (day: DayOfWeek) => void;
}

export function WeekView({
  lessons,
  selectedGroup,
  todayDay,
  currentLessonIds,
  onSelectLesson,
  onFocusDay,
}: WeekViewProps) {
  const reduced = useReducedMotion();
  const itemVariants = getCardSlamItemVariants(reduced);
  const filtered = filterLessonsByGroup(lessons, selectedGroup);

  return (
    <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-4">
      {DAYS.map((day, colIdx) => {
        const dayLessons = filtered.filter((ls) => ls.day === day);
        const isToday = day === todayDay;
        const hasSaturdayConflict =
          day === 'SATURDAY' && dayLessons.some((ls) => !ls.isOnline);

        const colVariants = {
          hidden: {},
          visible: {
            transition: {
              staggerChildren: reduced ? 0 : 0.035,
              delayChildren: reduced ? 0 : colIdx * 0.03,
            },
          },
        };

        return (
          <div key={day} className="flex min-w-0 flex-col">
            {/* Characteristic P5R slanted day header directly on graphic backdrop */}
            <button
              type="button"
              onClick={() => onFocusDay(day)}
              title="Открыть в режиме «День»"
              className="group relative mb-2 w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE600]"
            >
              {isToday && (
                <span className="absolute -top-3 right-1 z-20 -rotate-2 border-2 border-white bg-[#E60012] px-1.5 py-0.5 font-display text-[10px] uppercase leading-none tracking-wider text-white shadow-[2px_2px_0_#050505]">
                  TODAY
                </span>
              )}

              <div
                className={`p5-skew -rotate-1 border-2 px-3 py-2 transition-all duration-100 group-hover:rotate-0 ${
                  isToday
                    ? 'border-[#050505] bg-[#FFE600] text-[#050505] shadow-[5px_5px_0_#050505]'
                    : 'border-white bg-[#060606] text-white shadow-[4px_4px_0_#050505] group-hover:bg-[#E60012]'
                }`}
              >
                <div className="p5-unskew flex items-center justify-between gap-1.5">
                  <div className="min-w-0">
                    <div
                      className={`font-display text-2xl uppercase leading-none tracking-wider ${
                        isToday ? 'text-[#050505]' : 'text-white'
                      }`}
                    >
                      {DAY_SHORT_EN[day]}
                    </div>
                    <div
                      className={`mt-0.5 truncate font-condensed text-[11px] font-bold uppercase tracking-wider ${
                        isToday
                          ? 'text-[#050505]/85'
                          : 'text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {DAY_LABELS_RU[day]}
                    </div>
                  </div>

                  <span className="flex shrink-0 items-center gap-1">
                    {hasSaturdayConflict && (
                      <AlertTriangle
                        className="h-3.5 w-3.5 text-[#FFE600]"
                        aria-label="Есть спорная очная пара в субботу"
                      />
                    )}
                    <span
                      className={`px-1.5 py-1 font-display text-xs leading-none ${
                        isToday
                          ? 'bg-[#050505] text-[#FFE600]'
                          : 'bg-white text-[#050505] group-hover:bg-[#050505] group-hover:text-white'
                      }`}
                    >
                      {dayLessons.length}
                    </span>
                  </span>
                </div>
              </div>
            </button>

            {/* Lessons stack — zero box around column, contrasting vertical bar on TODAY */}
            <div className={isToday ? 'relative flex-1 pl-3' : 'flex-1'}>
              {isToday && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2 bottom-1 left-0 w-1.5 bg-[#FFE600] shadow-[2px_2px_0_#050505]"
                />
              )}

              {dayLessons.length === 0 ? (
                <div className="mt-3">
                  <div className="p5-skew border-2 border-white/80 bg-[#060606] py-5 text-center shadow-[4px_4px_0_#050505]">
                    <span className="p5-unskew block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Нет пар
                    </span>
                  </div>
                </div>
              ) : (
                <motion.div
                  variants={colVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-5 pt-3"
                >
                  {dayLessons.map((lesson, idx) => (
                    <motion.div key={lesson.id} variants={itemVariants}>
                      <LessonCard
                        lesson={lesson}
                        selectedGroup={selectedGroup}
                        compact
                        isToday={isToday}
                        tiltIndex={idx + colIdx}
                        isCurrent={currentLessonIds.has(lesson.id)}
                        onClick={() => onSelectLesson(lesson)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
