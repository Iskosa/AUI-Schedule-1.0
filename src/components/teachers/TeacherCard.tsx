import { BookOpen, Clock, MapPin } from 'lucide-react';
import type { EffectiveTeacher } from '../../types/schedule';

interface TeacherCardProps {
  teacher: EffectiveTeacher;
  lessonCount: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function TeacherCard({
  teacher,
  lessonCount,
  isSelected,
  onSelect,
}: TeacherCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3.5 text-left transition ${
        isSelected
          ? 'border-blue-500 bg-blue-600/15 ring-1 ring-blue-500/30'
          : 'border-[#252e42] bg-[#151a26] hover:border-slate-500 hover:bg-[#192030]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="break-words text-sm font-semibold text-white">
              {teacher.name}
            </h3>
            {teacher.isCustom && (
              <span className="rounded border border-emerald-500/35 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                Свой
              </span>
            )}
            {teacher.isModified && (
              <span className="rounded border border-amber-500/35 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                Изм.
              </span>
            )}
          </div>
          {teacher.room && (
            <div className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{teacher.room}</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 text-[11px]">
          <span className="rounded-md bg-[#1a2030] px-2 py-0.5 font-semibold text-slate-200">
            {lessonCount} {lessonCount === 1 ? 'пара' : lessonCount >= 2 && lessonCount <= 4 ? 'пары' : 'пар'}
          </span>
          {teacher.officeHours.length > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Clock className="h-3 w-3" />
              OH: {teacher.officeHours.length}
            </span>
          )}
        </div>
      </div>

      {teacher.courses.length > 0 && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="line-clamp-2 break-words">
            {teacher.courses.join(' · ')}
          </span>
        </div>
      )}
    </button>
  );
}
