import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Plus } from 'lucide-react';
import { DAY_LABELS_RU } from '../../constants/schedule';
import type {
  DayOfWeek,
  EffectiveLesson,
  GroupFilter,
} from '../../types/schedule';
import {
  getCardSlamItemVariants,
  getStaggerContainerVariants,
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
  const itemVariants = getCardSlamItemVariants(reduced);

  const dayLessons = filterLessonsByGroup(lessons, selectedGroup).filter(
    (ls) => ls.day === selectedDay
  );

  return (
    <div className="space-y-3">
      {selectedDay === 'SATURDAY' && saturdayNotes.length > 0 && (
        <div className="flex items-start gap-2.5 border border-[#FFE600]/50 border-l-4 border-l-[#E60012] bg-[#141414] px-3 py-2 text-xs text-white">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FFE600]" />
          <div className="space-y-0.5">
            <div className="font-condensed text-[11px] font-bold uppercase tracking-wider text-[#FFE600]">
              Примечания по субботе (Satur_comments)
            </div>
            <p className="leading-snug text-neutral-300">
              {saturdayNotes.slice(0, 2).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {dayLessons.length === 0 ? (
        <div className="p5-halftone flex flex-col items-center justify-center border border-dashed border-white/25 bg-[#141414] px-6 py-10 text-center">
          <p className="font-condensed text-sm font-bold uppercase tracking-wider text-neutral-300">
            На {DAY_LABELS_RU[selectedDay].toLowerCase()} пар не запланировано.
          </p>
          <button
            type="button"
            onClick={() => onAddLessonForDay(selectedDay)}
            className="p5-skew mt-4 border border-[#0B0B0B] bg-[#FFE600] px-4 py-2 text-[#0B0B0B] shadow-[3px_3px_0_#E60012] transition hover:border-white hover:bg-[#E60012] hover:text-white"
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
          className="grid gap-3.5 md:grid-cols-2"
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
