import { Calendar, Columns3, Plus } from 'lucide-react';
import { DAY_SHORT_EN, DAY_SHORT_RU, DAYS } from '../../constants/schedule';
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
    <div className="p5-shadow flex flex-col gap-3 border-2 border-white bg-[#161616] p-3.5 sm:p-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Режим отображения расписания"
          className="inline-flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            onClick={() => onChangeViewMode('day')}
            className={`p5-skew border-2 px-3 py-1.5 transition ${
              viewMode === 'day'
                ? '-translate-y-0.5 border-white bg-[#E60012] text-white shadow-[4px_4px_0_#0D0D0D]'
                : 'border-white/80 bg-[#0D0D0D] text-neutral-200 shadow-[3px_3px_0_#0D0D0D] hover:border-[#FFE600] hover:text-[#FFE600]'
            }`}
          >
            <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
              <Calendar className="h-3.5 w-3.5" />
              <span>День</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('week')}
            className={`p5-skew border-2 px-3 py-1.5 transition ${
              viewMode === 'week'
                ? '-translate-y-0.5 border-white bg-[#E60012] text-white shadow-[4px_4px_0_#0D0D0D]'
                : 'border-white/80 bg-[#0D0D0D] text-neutral-200 shadow-[3px_3px_0_#0D0D0D] hover:border-[#FFE600] hover:text-[#FFE600]'
            }`}
          >
            <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
              <Columns3 className="h-3.5 w-3.5" />
              <span>Неделя</span>
            </span>
          </button>
        </div>

        {viewMode === 'day' && (
          <div className="flex flex-wrap items-center gap-2">
            {DAYS.map((day) => {
              const count = groupLessons.filter((ls) => ls.day === day).length;
              const active = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={`p5-skew border-2 px-2.5 py-1.5 transition ${
                    active
                      ? '-translate-y-0.5 border-[#E60012] bg-white text-[#0D0D0D] shadow-[4px_4px_0_#E60012]'
                      : 'border-white/75 bg-[#0D0D0D] text-white shadow-[3px_3px_0_#0D0D0D] hover:-translate-y-0.5 hover:border-[#FFE600]'
                  }`}
                >
                  <span className="p5-unskew inline-flex items-center gap-1.5">
                    <span className="flex flex-col items-start leading-none">
                      <span className="font-condensed text-[9px] font-bold uppercase tracking-widest opacity-85">
                        {DAY_SHORT_EN[day]}
                      </span>
                      <span className="font-condensed text-xs font-bold uppercase sm:text-sm">
                        {DAY_SHORT_RU[day]}
                      </span>
                    </span>
                    <span
                      className={`px-1.5 py-0.5 font-condensed text-[11px] font-bold leading-none ${
                        active
                          ? 'bg-[#E60012] text-white'
                          : 'border border-white/40 bg-[#161616] text-[#FFE600]'
                      }`}
                    >
                      {count}
                    </span>
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
        className="p5-skew border-2 border-[#0D0D0D] bg-[#FFE600] px-4 py-2 text-[#0D0D0D] shadow-[4px_4px_0_#E60012] transition hover:-translate-y-0.5 hover:border-white hover:bg-[#E60012] hover:text-white hover:shadow-[4px_4px_0_#0D0D0D]"
      >
        <span className="p5-unskew inline-flex items-center justify-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
          <Plus className="h-4 w-4" />
          <span>Добавить пару</span>
        </span>
      </button>
    </div>
  );
}
