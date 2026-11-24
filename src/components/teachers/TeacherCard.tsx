import { BookOpen, Clock, MapPin } from 'lucide-react';
import type { EffectiveTeacher } from '../../types/schedule';

interface TeacherCardProps {
  teacher: EffectiveTeacher;
  lessonCount: number;
  isSelected: boolean;
  onSelect: () => void;
}

function formatLessonCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ПАРА`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} ПАРЫ`;
  }
  return `${count} ПАР`;
}

export function TeacherCard({
  teacher,
  lessonCount,
  isSelected,
  onSelect,
}: TeacherCardProps) {
  const filledStars = Math.min(5, lessonCount);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p5-skew w-full border-2 text-left transition duration-150 ${
        isSelected
          ? '-translate-y-0.5 border-[#FFE600] bg-[#E60012] text-white shadow-[5px_5px_0_#FFE600]'
          : 'p5-shadow-sm border-white bg-[#0D0D0D] text-white hover:-translate-y-0.5 hover:border-[#FFE600] hover:bg-[#161616]'
      }`}
    >
      <div className="p5-unskew space-y-2 p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="break-words font-display text-sm uppercase tracking-wide text-white">
                {teacher.name}
              </h3>
              {teacher.isCustom && (
                <span className="border border-[#0D0D0D] bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D]">
                  СВОЙ
                </span>
              )}
              {teacher.isModified && (
                <span className="border border-white bg-[#161616] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#FFE600]">
                  ИЗМ.
                </span>
              )}
            </div>

            {teacher.room && (
              <div className="mt-1 inline-flex items-center gap-1 border border-white/40 bg-[#161616] px-1.5 py-0.5 font-condensed text-[11px] font-bold uppercase text-[#FFE600]">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{teacher.room}</span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {/* P5R Confidant Rank Stars */}
            <div
              className="flex items-center gap-1 border border-white/40 bg-[#161616] px-1.5 py-0.5"
              aria-label={`Нагрузка: ${lessonCount} пар в неделю`}
            >
              <span className="inline-flex items-center text-xs leading-none tracking-tight">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <span
                    key={idx}
                    className={
                      idx <= filledStars ? 'text-[#FFE600]' : 'text-white/25'
                    }
                  >
                    {idx <= filledStars ? '★' : '☆'}
                  </span>
                ))}
              </span>
              <span className="font-condensed text-[10px] font-bold uppercase tracking-wider text-white">
                {formatLessonCountLabel(lessonCount)}
              </span>
              {lessonCount >= 5 && (
                <span className="bg-[#FFE600] px-1 font-condensed text-[9px] font-bold uppercase leading-tight text-[#0D0D0D]">
                  MAX
                </span>
              )}
            </div>

            {teacher.officeHours.length > 0 && (
              <span className="inline-flex items-center gap-1 border-2 border-[#0D0D0D] bg-[#FFE600] px-2 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D]">
                <Clock className="h-3 w-3 shrink-0" />
                <span>OFFICE HOURS · {teacher.officeHours.length}</span>
              </span>
            )}
          </div>
        </div>

        {teacher.courses.length > 0 && (
          <div className="flex items-start gap-1.5 border-t border-white/15 pt-1.5 text-xs text-neutral-300">
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FFE600]" />
            <span className="line-clamp-2 break-words">
              {teacher.courses.join(' · ')}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
