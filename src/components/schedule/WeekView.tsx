import { AlertTriangle } from 'lucide-react';
import { DAY_LABELS_RU, DAYS } from '../../constants/schedule';
import type { DayOfWeek, EffectiveLesson, GroupFilter } from '../../types/schedule';
import { filterLessonsByGroup } from '../../utils/time';
import { LessonCard } from './LessonCard';

interface WeekViewProps {
  lessons: EffectiveLesson[];
  selectedGroup: GroupFilter;
  onSelectLesson: (lesson: EffectiveLesson) => void;
  onFocusDay: (day: DayOfWeek) => void;
}

export function WeekView({
  lessons,
  selectedGroup,
  onSelectLesson,
  onFocusDay,
}: WeekViewProps) {
  const filtered = filterLessonsByGroup(lessons, selectedGroup);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {DAYS.map((day) => {
        const dayLessons = filtered.filter((ls) => ls.day === day);
        const hasSaturdayConflict =
          day === 'SATURDAY' && dayLessons.some((ls) => !ls.isOnline);

        return (
          <div
            key={day}
            className="flex min-w-0 flex-col rounded-2xl border border-[#252e42] bg-[#121620] p-3"
          >
            <button
              type="button"
              onClick={() => onFocusDay(day)}
              title="Открыть в режиме «День»"
              className="mb-3 flex items-center justify-between gap-2 border-b border-[#252e42] pb-2.5 text-left transition hover:text-blue-300"
            >
              <span className="truncate text-sm font-bold text-white">
                {DAY_LABELS_RU[day]}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {hasSaturdayConflict && (
                  <AlertTriangle
                    className="h-3.5 w-3.5 text-amber-400"
                    aria-label="Есть спорная очная пара в субботу"
                  />
                )}
                <span className="rounded-md bg-[#1a2030] px-1.5 py-0.5 text-[11px] font-semibold text-slate-300">
                  {dayLessons.length}
                </span>
              </span>
            </button>

            {dayLessons.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#252e42]/60 py-8 text-center text-xs text-slate-500">
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
                    onClick={() => onSelectLesson(lesson)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
