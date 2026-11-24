import { Calendar, Columns3, Plus } from 'lucide-react';
import { DAY_SHORT_RU, DAYS } from '../../constants/schedule';
import type { DayOfWeek, EffectiveLesson, GroupFilter, ViewMode } from '../../types/schedule';
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
  const groupLessons = filterLessonsByGroup(lessons, selectedGroup);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#252e42] bg-[#121620] p-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div
          role="group"
          aria-label="Режим отображения расписания"
          className="inline-flex rounded-xl border border-[#252e42] bg-[#0b0d12] p-1"
        >
          <button
            type="button"
            onClick={() => onChangeViewMode('day')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              viewMode === 'day'
                ? 'bg-[#1a2030] text-white ring-1 ring-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>День</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('week')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              viewMode === 'week'
                ? 'bg-[#1a2030] text-white ring-1 ring-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns3 className="h-3.5 w-3.5" />
            <span>Неделя</span>
          </button>
        </div>

        {viewMode === 'day' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {DAYS.map((day) => {
              const count = groupLessons.filter((ls) => ls.day === day).length;
              const active = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-blue-500 bg-blue-600/20 text-blue-200'
                      : 'border-[#252e42] bg-[#1a2030]/70 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <span>{DAY_SHORT_RU[day]}</span>
                  <span
                    className={`rounded px-1 text-[10px] ${
                      active
                        ? 'bg-blue-500/30 text-blue-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAddLesson}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 sm:text-sm"
      >
        <Plus className="h-4 w-4" />
        <span>Добавить пару</span>
      </button>
    </div>
  );
}
