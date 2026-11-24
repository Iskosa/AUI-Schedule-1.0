import { AlertTriangle, Plus } from 'lucide-react';
import { DAY_LABELS_RU } from '../../constants/schedule';
import type { DayOfWeek, EffectiveLesson, GroupFilter } from '../../types/schedule';
import { filterLessonsByGroup } from '../../utils/time';
import { LessonCard } from './LessonCard';

interface DayViewProps {
  selectedDay: DayOfWeek;
  lessons: EffectiveLesson[];
  selectedGroup: GroupFilter;
  saturdayNotes: string[];
  onSelectLesson: (lesson: EffectiveLesson) => void;
  onAddLessonForDay: (day: DayOfWeek) => void;
}

export function DayView({
  selectedDay,
  lessons,
  selectedGroup,
  saturdayNotes,
  onSelectLesson,
  onAddLessonForDay,
}: DayViewProps) {
  const dayLessons = filterLessonsByGroup(lessons, selectedGroup).filter(
    (ls) => ls.day === selectedDay
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-white">
          {DAY_LABELS_RU[selectedDay]}
          <span className="ml-2 text-sm font-normal text-slate-400">
            ({dayLessons.length}{' '}
            {dayLessons.length === 1 ? 'пара' : dayLessons.length >= 2 && dayLessons.length <= 4 ? 'пары' : 'пар'})
          </span>
        </h2>
      </div>

      {selectedDay === 'SATURDAY' && saturdayNotes.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-100">
              Примечания по субботе (Satur_comments)
            </div>
            <p className="leading-relaxed text-amber-200/90">
              {saturdayNotes.slice(0, 2).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {dayLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#252e42] bg-[#121620]/70 px-6 py-10 text-center">
          <p className="text-sm text-slate-400">
            На {DAY_LABELS_RU[selectedDay].toLowerCase()} пар не запланировано.
          </p>
          <button
            type="button"
            onClick={() => onAddLessonForDay(selectedDay)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#252e42] bg-[#1a2030] px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-500/40 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Добавить пару на этот день
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {dayLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              selectedGroup={selectedGroup}
              onClick={() => onSelectLesson(lesson)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
