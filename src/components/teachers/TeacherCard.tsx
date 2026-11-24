import { m, useReducedMotion } from 'framer-motion';
import { BookOpen, Clock, MapPin } from 'lucide-react';
import type { EffectiveTeacher } from '../../types/schedule';
import { getCursorSpring, getTapPressProps } from '../../utils/p5Motion';

interface TeacherCardProps {
  teacher: EffectiveTeacher;
  lessonCount: number;
  isSelected: boolean;
  isHovered: boolean;
  isPinned?: boolean;
  onHoverStart: () => void;
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
  isHovered,
  isPinned = false,
  onHoverStart,
  onSelect,
}: TeacherCardProps) {
  const reduced = useReducedMotion();
  const cursorSpring = getCursorSpring(reduced);
  const tapProps = getTapPressProps(reduced);
  const filledStars = Math.min(5, lessonCount);

  return (
    <m.button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHoverStart}
      onFocus={onHoverStart}
      {...tapProps}
      className="relative w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE600]"
    >
      {/* Base clean black card backing */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 border-2 border-white bg-[#060606] shadow-[4px_4px_0_#050505]"
      />

      {/* Running crimson Confidant hover stripe */}
      {isHovered && (
        <m.div
          layoutId="p5-confidant-hover-bar"
          aria-hidden="true"
          transition={cursorSpring}
          className="pointer-events-none absolute -inset-x-1 inset-y-0 z-0"
        >
          <div className="p5-skew h-full w-full -rotate-[0.8deg] border border-white/75 bg-[#E60012]/90 shadow-[4px_4px_0_#000000]" />
        </m.div>
      )}

      {/* Running active Confidant stripe with yellow highlight */}
      {isSelected && (
        <m.div
          layoutId="p5-confidant-active-bar"
          aria-hidden="true"
          transition={cursorSpring}
          className="pointer-events-none absolute -inset-x-1 inset-y-0 z-0"
        >
          <div className="p5-skew h-full w-full -rotate-[1deg] border-l-4 border-[#FFE600] bg-[#E60012] shadow-[5px_5px_0_#FFE600]" />
        </m.div>
      )}

      <div className="relative z-10 space-y-2 p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="break-words font-display text-sm uppercase tracking-wide text-white">
                {teacher.name}
              </h3>
              {isPinned && (
                <span className="border border-[#0B0B0B] bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#0B0B0B]">
                  ★ МОЙ
                </span>
              )}
              {teacher.isCustom && (
                <span className="bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#0B0B0B]">
                  СВОЙ
                </span>
              )}
              {teacher.isModified && (
                <span className="border border-white/40 bg-[#0B0B0B] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#FFE600]">
                  ИЗМ.
                </span>
              )}
            </div>

            {teacher.room && (
              <div className="mt-1 inline-flex items-center gap-1 bg-[#0B0B0B]/85 px-1.5 py-0.5 font-condensed text-[11px] font-bold uppercase text-[#FFE600]">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{teacher.room}</span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {/* P5R Confidant Rank Stars */}
            <div
              className="flex items-center gap-1 border border-white/20 bg-[#0B0B0B]/90 px-1.5 py-0.5"
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
                <span className="bg-[#FFE600] px-1 font-condensed text-[9px] font-bold uppercase leading-tight text-[#0B0B0B]">
                  MAX
                </span>
              )}
            </div>

            {teacher.officeHours.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#0B0B0B]">
                <Clock className="h-3 w-3 shrink-0" />
                <span>OFFICE HOURS · {teacher.officeHours.length}</span>
              </span>
            )}
          </div>
        </div>

        {teacher.courses.length > 0 && (
          <div
            className={`flex items-start gap-1.5 border-t pt-1.5 text-xs ${
              isSelected || isHovered
                ? 'border-white/25 text-white'
                : 'border-white/10 text-neutral-300'
            }`}
          >
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FFE600]" />
            <span className="line-clamp-2 break-words">
              {teacher.courses.join(' · ')}
            </span>
          </div>
        )}
      </div>
    </m.button>
  );
}
