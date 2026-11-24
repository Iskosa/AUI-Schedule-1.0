import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { DAY_LABELS_RU, DAY_SHORT_EN, DAYS } from '../../constants/schedule';
import type {
  DayOfWeek,
  EffectiveLesson,
  GroupFilter,
} from '../../types/schedule';
import {
  getStaggerContainerVariants,
  getStaggerItemVariants,
} from '../../utils/p5Motion';
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
  const containerVariants = getStaggerContainerVariants(reduced);
  const itemVariants = getStaggerItemVariants(reduced);
  const filtered = filterLessonsByGroup(lessons, selectedGroup);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      {DAYS.map((day) => {
        const dayLessons = filtered.filter((ls) => ls.day === day);
        const hasSaturdayConflict =
          day === 'SATURDAY' && dayLessons.some((ls) => !ls.isOnline);

        return (
          <motion.div
            key={day}
            variants={itemVariants}
            className="p5-shadow-sm flex min-w-0 flex-col overflow-x-clip border-2 border-white bg-[#161616] p-2.5 sm:p-3"
          >
            <button
              type="button"
              onClick={() => onFocusDay(day)}
              title="Открыть в режиме «День»"
              className="group mb-3 flex items-center justify-between gap-1.5 border-2 border-white bg-[#0D0D0D] px-2.5 py-2 text-left transition hover:bg-[#E60012]"
            >
              <div className="min-w-0">
                <div className="font-display text-xs uppercase leading-none tracking-wider text-[#E60012] transition group-hover:text-[#FFE600]">
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
                <span className="border border-white/50 bg-[#161616] px-1.5 py-0.5 font-condensed text-[11px] font-bold leading-none text-[#FFE600]">
                  {dayLessons.length}
                </span>
              </span>
            </button>

            {dayLessons.length === 0 ? (
              <div className="flex flex-1 items-center justify-center border-2 border-dashed border-white/25 bg-[#0D0D0D] py-8 text-center font-condensed text-xs font-bold uppercase tracking-wider text-neutral-400">
                Нет пар
              </div>
            ) : (
              <div className="space-y-2.5">
                {dayLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    selectedGroup={selectedGroup}
                    compact
                    isCurrent={currentLessonIds.has(lesson.id)}
                    onClick={() => onSelectLesson(lesson)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
