import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Globe, MapPin, Pin, User, Users } from 'lucide-react';
import type { EffectiveLesson, GroupFilter } from '../../types/schedule';
import { getNoteSeverity } from '../../utils/links';

interface LessonCardProps {
  lesson: EffectiveLesson;
  selectedGroup: GroupFilter;
  compact?: boolean;
  isCurrent?: boolean;
  onClick: () => void;
}

export function LessonCard({
  lesson,
  selectedGroup,
  compact = false,
  isCurrent = false,
  onClick,
}: LessonCardProps) {
  const reduced = useReducedMotion();
  const noteSeverity = getNoteSeverity(lesson.notes);

  const pinnedSubgroup =
    lesson.pinnedSubgroupTeacherId && lesson.subgroups
      ? lesson.subgroups.find(
          (sg) => sg.teacherId === lesson.pinnedSubgroupTeacherId
        ) ?? null
      : null;

  const hasSubgroups = Boolean(lesson.subgroups && lesson.subgroups.length > 0);
  const showWarningIcon = noteSeverity === 'warning';
  const showGroupLine = selectedGroup === 'ALL';

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      whileTap={reduced ? undefined : { x: 3, y: 3 }}
      transition={{ type: 'spring', stiffness: 800, damping: 30 }}
      className={`group relative cursor-pointer overflow-hidden border bg-[#141414] text-left shadow-[4px_4px_0_#000000] active:shadow-[1px_1px_0_#000000] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE600] ${
        isCurrent
          ? 'border-[#FFE600]/80'
          : 'border-white/15 hover:border-white/55'
      } ${
        reduced
          ? ''
          : 'transition-transform duration-100 ease-out md:hover:-translate-x-0.5 md:hover:-translate-y-0.5 md:hover:-rotate-[0.7deg]'
      } ${compact ? 'px-3.5 py-3 pl-4' : 'px-5 py-4 pl-6'}`}
    >
      {/* Left P5R accent strip — flashes wider & glows on hover */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-1 transition-all duration-100 ${
          isCurrent
            ? 'bg-[#FFE600] md:group-hover:w-2.5 md:group-hover:shadow-[0_0_12px_rgba(255,230,0,0.75)]'
            : 'bg-[#E60012] md:group-hover:w-2.5 md:group-hover:shadow-[0_0_14px_rgba(230,0,18,0.85)]'
        }`}
      />

      {/* Sharp top-right diagonal crimson corner flash on desktop hover */}
      {!reduced && (
        <span
          aria-hidden="true"
          style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
          className="pointer-events-none absolute top-0 right-0 h-5 w-5 origin-top-right scale-50 bg-[#E60012] opacity-0 transition-all duration-100 md:group-hover:scale-100 md:group-hover:opacity-100"
        />
      )}

      <div className="relative z-10 space-y-2">
        {/* Top row: Skewed time badge + up to 2 compact markers */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`p5-skew inline-block border border-[#0B0B0B] shadow-[2px_2px_0_#000000] ${
              isCurrent
                ? 'bg-[#FFE600] text-[#0B0B0B]'
                : 'bg-white text-[#0B0B0B]'
            }`}
          >
            <span
              className={`p5-unskew inline-flex items-center gap-1.5 font-condensed font-bold uppercase tracking-wider tabular-nums ${
                compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
              }`}
            >
              <span>
                {lesson.startTime}–{lesson.endTime}
              </span>
              {isCurrent && (
                <span className="bg-[#E60012] px-1 py-0.5 text-[9px] leading-none text-white">
                  NOW
                </span>
              )}
            </span>
          </span>

          {(lesson.isOnline || showWarningIcon) && (
            <div className="flex shrink-0 items-center gap-1.5">
              {lesson.isOnline && (
                <span className="inline-flex items-center gap-1 bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#0B0B0B]">
                  <Globe className="h-2.5 w-2.5" />
                  <span>ONLINE</span>
                </span>
              )}
              {showWarningIcon && (
                <span
                  title="Обратите внимание: пометка в расписании"
                  aria-label="Обратите внимание: конфликт / пометка в расписании"
                  className="inline-flex items-center justify-center text-[#FFE600]"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subject */}
        <h3
          className={`break-words uppercase tracking-wide text-white ${
            compact
              ? 'font-condensed text-sm font-bold leading-snug'
              : 'font-display text-sm leading-snug sm:text-base'
          }`}
        >
          {lesson.subject}
        </h3>

        {/* Room & Teacher or single-line Pinned Subgroup */}
        <div className="space-y-1 text-xs text-neutral-300">
          {pinnedSubgroup ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium text-[#FFE600]">
              <span className="inline-flex min-w-0 items-center gap-1">
                <Pin className="h-3 w-3 shrink-0" />
                <span className="truncate font-semibold">
                  {pinnedSubgroup.teacherName}
                </span>
              </span>
              {pinnedSubgroup.room && (
                <span className="inline-flex items-center gap-1 font-condensed font-bold uppercase text-[#FFE600]">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{pinnedSubgroup.room}</span>
                </span>
              )}
            </div>
          ) : hasSubgroups ? (
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Users className="h-3.5 w-3.5 shrink-0 text-[#E60012]" />
              <span className="truncate font-condensed text-xs font-semibold uppercase tracking-wide">
                {lesson.subgroups!.length} подгруппы · выбрать
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {lesson.room && (
                <span className="inline-flex items-center gap-1 font-condensed text-xs font-bold uppercase text-[#FFE600]">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{lesson.room}</span>
                </span>
              )}
              {lesson.teacherName && (
                <span className="inline-flex min-w-0 items-center gap-1 text-neutral-300">
                  <User className="h-3 w-3 shrink-0 text-[#E60012]" />
                  <span className="break-words">{lesson.teacherName}</span>
                </span>
              )}
            </div>
          )}

          {showGroupLine && (
            <div className="font-condensed text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              {lesson.groupIds.join(' · ')}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
