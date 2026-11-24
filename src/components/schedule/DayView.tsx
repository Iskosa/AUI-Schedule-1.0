import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Plus } from 'lucide-react';
import { DAY_LABELS_RU, DAY_SHORT_EN } from '../../constants/schedule';
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

interface DayViewProps {
  selectedDay: DayOfWeek;
  lessons: EffectiveLesson[];
  selectedGroup: GroupFilter;
  saturdayNotes: string[];
  currentLessonIds: Set<string>;
  onSelectLesson: (lesson: EffectiveLesson) => void;
  onAddLessonForDay: (day: DayOfWeek) => void;
}

export function DayView({
  selectedDay,
  lessons,
  selectedGroup,
  saturdayNotes,
  currentLessonIds,
  onSelectLesson,
  onAddLessonForDay,
}: DayViewProps) {
  const reduced = useReducedMotion();
  const containerVariants = getStaggerContainerVariants(reduced);
  const itemVariants = getStaggerItemVariants(reduced);

  const dayLessons = filterLessonsByGroup(lessons, selectedGroup).filter(
    (ls) => ls.day === selectedDay
  );

  const countLabel =
    dayLessons.length === 1
      ? 'ПАРА'
      : dayLessons.length >= 2 && dayLessons.length <= 4
        ? 'ПАРЫ'
        : 'ПАР';

  return (
    <div className="space-y-4">
      {/* P5R Day Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p5-skew p5-shadow-sm border-2 border-[#0D0D0D] bg-[#E60012] px-2.5 py-1 text-white">
            <span className="p5-unskew block font-display text-xs uppercase tracking-wider sm:text-sm">
              {DAY_SHORT_EN[selectedDay]}
            </span>
          </div>
          <div className="p5-skew border-2 border-[#0D0D0D] bg-white px-3.5 py-1 text-[#0D0D0D] shadow-[4px_4px_0_#E60012]">
            <h2 className="p5-unskew font-display text-base uppercase tracking-wide sm:text-lg">
              {DAY_LABELS_RU[selectedDay]}
            </h2>
          </div>
          <span className="border-2 border-[#FFE600] bg-[#0D0D0D] px-2.5 py-1 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
            {dayLessons.length} {countLabel}
          </span>
        </div>
      </div>

      {selectedDay === 'SATURDAY' && saturdayNotes.length > 0 && (
        <div className="p5-shadow-sm flex items-start gap-2.5 border-2 border-[#FFE600] border-l-[6px] border-l-[#E60012] bg-[#0D0D0D] px-4 py-3 text-xs text-white">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FFE600]" />
          <div className="space-y-1">
            <div className="font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
              Примечания по субботе (Satur_comments)
            </div>
            <p className="leading-relaxed text-neutral-200">
              {saturdayNotes.slice(0, 2).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {dayLessons.length === 0 ? (
        <div className="p5-halftone p5-shadow flex flex-col items-center justify-center border-2 border-dashed border-white/40 bg-[#161616] px-6 py-10 text-center">
          <p className="font-condensed text-sm font-bold uppercase tracking-wider text-neutral-300">
            На {DAY_LABELS_RU[selectedDay].toLowerCase()} пар не запланировано.
          </p>
          <button
            type="button"
            onClick={() => onAddLessonForDay(selectedDay)}
            className="p5-skew mt-4 border-2 border-[#0D0D0D] bg-[#FFE600] px-4 py-2 text-[#0D0D0D] shadow-[4px_4px_0_#E60012] transition hover:-translate-y-0.5 hover:border-white hover:bg-[#E60012] hover:text-white"
          >
            <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
              <Plus className="h-4 w-4" />
              <span>Добавить пару на этот день</span>
            </span>
          </button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2"
        >
          {dayLessons.map((lesson) => (
            <motion.div key={lesson.id} variants={itemVariants}>
              <LessonCard
                lesson={lesson}
                selectedGroup={selectedGroup}
                isCurrent={currentLessonIds.has(lesson.id)}
                onClick={() => onSelectLesson(lesson)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
