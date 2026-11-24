import { m, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Globe, MapPin, Pin, User, Users } from 'lucide-react';
import { LESSON_TYPE_LABELS } from '../../constants/schedule';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { EffectiveLesson, GroupFilter } from '../../types/schedule';
import { getNoteSeverity } from '../../utils/links';
import { formatLessonDuration } from '../../utils/time';

interface LessonCardProps {
  lesson: EffectiveLesson;
  selectedGroup: GroupFilter;
  compact?: boolean;
  isCurrent?: boolean;
  isToday?: boolean;
  tiltIndex?: number;
  showGroupLineOverride?: boolean;
  onClick: () => void;
}

function formatSubgroupBadge(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ПОДГРУППА ▸`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} ПОДГРУППЫ ▸`;
  }
  return `${count} ПОДГРУПП ▸`;
}

export function LessonCard({
  lesson,
  selectedGroup,
  compact = false,
  isCurrent = false,
  isToday = false,
  tiltIndex = 0,
  showGroupLineOverride = false,
  onClick,
}: LessonCardProps) {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const noteSeverity = getNoteSeverity(lesson.notes);

  const pinnedSubgroup =
    lesson.pinnedSubgroupTeacherId && lesson.subgroups
      ? lesson.subgroups.find(
          (sg) => sg.teacherId === lesson.pinnedSubgroupTeacherId
        ) ?? null
      : null;

  const hasSubgroups = Boolean(lesson.subgroups && lesson.subgroups.length > 0);
  const showWarningIcon = noteSeverity === 'warning';
  const showGroupLine = selectedGroup === 'ALL' || showGroupLineOverride;

  const uniqueSubgroupRooms = hasSubgroups
    ? Array.from(
        new Set(
          (lesson.subgroups ?? []).map((sg) => sg.room.trim()).filter(Boolean)
        )
      )
    : [];

  const resolvedRoomStamp = lesson.isOnline
    ? null
    : pinnedSubgroup?.room
      ? pinnedSubgroup.room
      : hasSubgroups
        ? uniqueSubgroupRooms.length === 1
          ? uniqueSubgroupRooms[0]
          : null
        : lesson.room;

  const durationLabel = formatLessonDuration(lesson.startTime, lesson.endTime);

  const restRotate = tiltIndex % 2 === 0 ? -0.8 : 0.6;
  const desktopTiltActive = !reduced && !isMobile;

  const borderShadowClass = isCurrent
    ? 'border-[#FFE600] shadow-[5px_5px_0_#E60012,7px_7px_0_#050505] md:hover:shadow-[6px_6px_0_#FFE600,8px_8px_0_#050505] active:shadow-[1px_1px_0_#000000]'
    : isToday
      ? 'border-white shadow-[5px_5px_0_#E60012,7px_7px_0_#050505] md:hover:shadow-[6px_6px_0_#FFFFFF,8px_8px_0_#050505] active:shadow-[1px_1px_0_#E60012]'
      : 'border-white shadow-[5px_5px_0_#000000] md:hover:shadow-[6px_6px_0_#E60012] active:shadow-[1px_1px_0_#000000]';

  return (
    <m.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      animate={{ rotate: desktopTiltActive ? restRotate : 0 }}
      whileHover={
        desktopTiltActive ? { y: -4, rotate: 0, scale: 1.02 } : undefined
      }
      whileTap={
        reduced ? undefined : { x: 4, y: 4, scale: 0.99, rotate: 0 }
      }
      transition={{ type: 'spring', stiffness: 750, damping: 28 }}
      className={`group relative cursor-pointer border-2 bg-[#060606] text-left hover:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE600] ${borderShadowClass} ${
        compact ? 'px-3.5 pt-1 pb-3.5 pl-4' : 'px-5 pt-1.5 pb-4 pl-6'
      }`}
    >
      {/* Clipped inner comic decorations: razor edge + flying crimson hover wedge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className={`absolute inset-y-0 left-0 w-1 ${
            isCurrent ? 'bg-[#FFE600]' : 'bg-[#E60012]'
          }`}
        />
        {!reduced && (
          <>
            <span
              style={{ clipPath: 'polygon(0 0, 100% 0, 42% 100%, 0 100%)' }}
              className="absolute inset-y-0 left-0 w-4 -translate-x-full bg-[#E60012] transition-transform duration-100 ease-out md:group-hover:translate-x-0"
            />
            <span
              style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
              className="absolute top-0 right-0 h-5 w-5 origin-top-right scale-50 bg-[#E60012] opacity-0 transition-[transform,opacity] duration-100 md:group-hover:scale-100 md:group-hover:opacity-100"
            />
          </>
        )}
      </div>

      <div className="relative z-10 space-y-2.5">
        {/* Top row: Protruding overlapping skewed time plaque + compact markers */}
        <div className="-mt-4 flex items-start justify-between gap-1.5">
          <span
            className={`p5-skew inline-block border-2 border-[#050505] shadow-[3px_3px_0_#050505] ${
              isCurrent
                ? 'bg-[#FFE600] text-[#050505]'
                : 'bg-white text-[#050505]'
            }`}
          >
            <span
              className={`p5-unskew inline-flex items-center gap-1.5 font-condensed font-bold uppercase tracking-wider tabular-nums ${
                compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'
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

          {compact && (lesson.isOnline || showWarningIcon) && (
            <div className="mt-2.5 flex shrink-0 items-center gap-1.5">
              {lesson.isOnline && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap border border-[#050505] bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none tracking-wider text-[#050505]">
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

        {compact ? (
          <>
            {/* Compact WeekView Card Content */}
            <h3 className="break-words font-condensed text-[15px] font-bold uppercase leading-snug tracking-wide text-white">
              {lesson.subject}
            </h3>

            <div className="space-y-1.5 text-xs">
              {pinnedSubgroup ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[#FFE600]">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Pin className="h-3 w-3 shrink-0" />
                    <span className="break-words font-semibold">
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
                <div>
                  <span className="inline-flex items-center gap-1 whitespace-nowrap border border-white/80 bg-[#E60012] px-2 py-0.5 font-condensed text-[11px] font-bold uppercase leading-tight tracking-wide text-white shadow-[2px_2px_0_#000000]">
                    <Users className="h-3 w-3 shrink-0" />
                    <span>{formatSubgroupBadge(lesson.subgroups!.length)}</span>
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {lesson.room && (
                    <span className="inline-flex items-center gap-1 font-condensed text-xs font-bold uppercase text-white">
                      <MapPin className="h-3 w-3 shrink-0 text-[#E60012]" />
                      <span>{lesson.room}</span>
                    </span>
                  )}
                  {lesson.teacherName && (
                    <span className="inline-flex min-w-0 items-center gap-1 text-neutral-200">
                      <User className="h-3 w-3 shrink-0 text-[#E60012]" />
                      <span className="break-words">{lesson.teacherName}</span>
                    </span>
                  )}
                </div>
              )}

              {showGroupLine && (
                <div className="border-t border-white/15 pt-1 font-condensed text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                  {lesson.groupIds.join(' · ')}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Wide Balanced DayView Card Layout */
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
            {/* Left Info Column */}
            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="break-words font-display text-base uppercase leading-snug tracking-wide text-white sm:text-xl">
                {lesson.subject}
              </h3>

              <div className="space-y-1.5 text-xs sm:text-sm">
                {pinnedSubgroup ? (
                  <div className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-[#FFE600]">
                    <Pin className="h-3.5 w-3.5 shrink-0" />
                    <span className="break-words">
                      {pinnedSubgroup.teacherName}
                    </span>
                  </div>
                ) : hasSubgroups ? (
                  <div>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap border border-white/80 bg-[#E60012] px-2.5 py-0.5 font-condensed text-xs font-bold uppercase leading-tight tracking-wide text-white shadow-[2px_2px_0_#000000]">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {formatSubgroupBadge(lesson.subgroups!.length)}
                      </span>
                    </span>
                  </div>
                ) : lesson.teacherName ? (
                  <div className="inline-flex min-w-0 items-center gap-1.5 text-neutral-200">
                    <User className="h-3.5 w-3.5 shrink-0 text-[#E60012]" />
                    <span className="break-words font-semibold">
                      {lesson.teacherName}
                    </span>
                  </div>
                ) : null}

                {showGroupLine && (
                  <div className="border-t border-white/15 pt-1 font-condensed text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                    {lesson.groupIds.join(' · ')}
                  </div>
                )}
              </div>
            </div>

            {/* Right Stylized Room Stamp + Duration / Type / Warning */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-2">
              {lesson.isOnline ? (
                <div className="p5-skew border-2 border-[#050505] bg-[#FFE600] px-3.5 py-1.5 text-[#050505] shadow-[4px_4px_0_#E60012]">
                  <span className="p5-unskew inline-flex items-center gap-1.5 font-display text-base uppercase leading-none tracking-wider sm:text-lg">
                    <Globe className="h-4 w-4 shrink-0" />
                    <span>ONLINE</span>
                  </span>
                </div>
              ) : resolvedRoomStamp ? (
                <div
                  className={`p5-skew border-2 bg-[#050505] px-3.5 py-1.5 shadow-[4px_4px_0_#E60012] ${
                    pinnedSubgroup
                      ? 'border-[#FFE600] text-[#FFE600]'
                      : 'border-white text-white'
                  }`}
                >
                  <span className="p5-unskew inline-flex items-center gap-1.5 font-display text-base uppercase leading-none tracking-wider sm:text-lg">
                    <MapPin
                      className={`h-4 w-4 shrink-0 ${
                        pinnedSubgroup ? 'text-[#FFE600]' : 'text-[#E60012]'
                      }`}
                    />
                    <span className="whitespace-nowrap">{resolvedRoomStamp}</span>
                  </span>
                </div>
              ) : hasSubgroups ? (
                <div className="p5-skew border-2 border-white/80 bg-[#050505] px-3 py-1.5 text-white shadow-[4px_4px_0_#E60012]">
                  <span className="p5-unskew inline-flex items-center gap-1.5 font-display text-sm uppercase leading-none tracking-wider sm:text-base">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E60012]" />
                    <span className="whitespace-nowrap">
                      {uniqueSubgroupRooms.length > 0
                        ? `${uniqueSubgroupRooms.length} АУД.`
                        : `${lesson.subgroups!.length} ПОТОКА`}
                    </span>
                  </span>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                {durationLabel && (
                  <span className="border border-white/30 bg-[#050505] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none tracking-wider text-neutral-300 tabular-nums">
                    {durationLabel}
                  </span>
                )}
                <span className="border border-white/50 bg-[#050505] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none tracking-wider text-white">
                  {LESSON_TYPE_LABELS[lesson.type]}
                </span>
                {showWarningIcon && (
                  <span
                    title="Обратите внимание: пометка в расписании"
                    aria-label="Обратите внимание: конфликт / пометка в расписании"
                    className="inline-flex items-center gap-1 border border-[#FFE600] bg-[#050505] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none text-[#FFE600]"
                  >
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>ВНИМАНИЕ</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </m.div>
  );
}
