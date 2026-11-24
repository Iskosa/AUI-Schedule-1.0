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
  currentLessonIds: Set<string>;
  onSelectLesson: (lesson: EffectiveLesson) => void;
  onFocusDay: (day: DayOfWeek) => void;
}

export function WeekView({
  lessons,
  selectedGroup,
  currentLessonIds,
  onSelectLesson,
  onFocusDay,
}: WeekViewProps) {
  const reduced = useReducedMotion();
  const itemVariants = getCardSlamItemVariants(reduced);
  const filtered = filterLessonsByGroup(lessons, selectedGroup);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {DAYS.map((day, colIdx) => {
        const dayLessons = filtered.filter((ls) => ls.day === day);
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
          <div
            key={day}
            className="flex min-w-0 flex-col border border-white/12 bg-[#121212]/80 p-2.5"
          >
            <button
              type="button"
              onClick={() => onFocusDay(day)}
              title="Открыть в режиме «День»"
              className="group mb-2.5 flex items-center justify-between gap-1.5 border-b border-white/15 pb-2 text-left transition-colors hover:border-[#E60012]"
            >
              <div className="min-w-0">
                <div className="font-display text-xs uppercase leading-none tracking-wider text-[#E60012] transition-colors group-hover:text-[#FFE600]">
                  {DAY_SHORT_EN[day]}
                </div>
                <div className="mt-0.5 truncate font-condensed text-xs font-bold uppercase tracking-wide text-white">
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
                <span className="bg-white/10 px-1.5 py-0.5 font-condensed text-[11px] font-bold leading-none text-neutral-200 transition-colors group-hover:bg-[#E60012] group-hover:text-white">
                  {dayLessons.length}
                </span>
              </span>
            </button>

            {dayLessons.length === 0 ? (
              <div className="flex flex-1 items-center justify-center border border-dashed border-white/15 bg-[#0B0B0B]/60 py-8 text-center font-condensed text-xs font-bold uppercase tracking-wider text-neutral-500">
                Нет пар
              </div>
            ) : (
              <motion.div
                variants={colVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2.5"
              >
                {dayLessons.map((lesson) => (
                  <motion.div key={lesson.id} variants={itemVariants}>
                    <LessonCard
                      lesson={lesson}
                      selectedGroup={selectedGroup}
                      compact
                      isCurrent={currentLessonIds.has(lesson.id)}
                      onClick={() => onSelectLesson(lesson)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
