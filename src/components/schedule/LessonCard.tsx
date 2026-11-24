import {
  AlertTriangle,
  ExternalLink,
  Globe,
  Info,
  MapPin,
  Pin,
  User,
  Users,
} from 'lucide-react';
import {
  GROUP_BADGE_STYLES,
  LESSON_TYPE_LABELS,
  LESSON_TYPE_STYLES,
} from '../../constants/schedule';
import type { EffectiveLesson, GroupFilter } from '../../types/schedule';
import { extractFirstUrl, getNoteSeverity } from '../../utils/links';
import { playOpen } from '../../utils/p5Sound';

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
  const meetUrl = extractFirstUrl(lesson.notes);
  const noteSeverity = getNoteSeverity(lesson.notes);

  const pinnedSubgroup =
    lesson.pinnedSubgroupTeacherId && lesson.subgroups
      ? lesson.subgroups.find(
          (sg) => sg.teacherId === lesson.pinnedSubgroupTeacherId
        ) ?? null
      : null;

  const hasSubgroups = Boolean(lesson.subgroups && lesson.subgroups.length > 0);
  const showGroupBadges =
    selectedGroup === 'ALL' || lesson.groupIds.length > 1;
  const isHighlighted = isCurrent || noteSeverity === 'warning';

  const hasFooter =
    Boolean(meetUrl) ||
    noteSeverity !== 'none' ||
    (!hasSubgroups && Boolean(lesson.notes) && !meetUrl);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative cursor-pointer text-left transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE600] md:hover:-translate-y-0.5 ${
        compact ? 'drop-shadow-[3px_3px_0_#0D0D0D]' : 'p5-drop-shadow'
      }`}
    >
      <div
        className={`p5-clip-card p-[2px] transition-colors duration-150 sm:p-[3px] ${
          isHighlighted ? 'bg-[#FFE600]' : 'bg-white'
        } group-focus-visible:bg-white md:group-hover:bg-white`}
      >
        <div
          className={`p5-clip-card relative border-l-[5px] bg-[#161616] text-white transition-colors duration-150 group-focus-visible:bg-[#E60012] md:group-hover:bg-[#E60012] ${
            isHighlighted
              ? 'border-l-[#FFE600]'
              : 'border-l-[#E60012] group-focus-visible:border-l-[#FFE600] md:group-hover:border-l-[#FFE600]'
          } ${compact ? 'px-2.5 py-2.5' : 'px-4 py-3.5 sm:px-5 sm:py-4'}`}
        >
          <div
            aria-hidden="true"
            className="p5-halftone pointer-events-none absolute inset-0 opacity-25"
          />

          <div className="relative z-10">
            {/* Top row: skewed time + type + flags */}
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span
                className={`p5-skew p5-shadow-sm inline-block border-2 border-[#0D0D0D] ${
                  isCurrent
                    ? 'bg-[#FFE600] text-[#0D0D0D]'
                    : 'bg-white text-[#0D0D0D]'
                }`}
              >
                <span
                  className={`p5-unskew inline-flex items-center gap-1.5 font-condensed font-bold uppercase tracking-wider tabular-nums text-[#0D0D0D] ${
                    compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs sm:text-sm'
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

              <div className="flex flex-wrap items-center gap-1">
                {lesson.isOnline && (
                  <span className="inline-flex items-center gap-1 border-2 border-[#0D0D0D] bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D]">
                    <Globe className="h-2.5 w-2.5" />
                    ONLINE
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider ${
                    LESSON_TYPE_STYLES[lesson.type]
                  } ${
                    lesson.type === 'elective'
                      ? 'group-focus-visible:border-[#FFE600] group-focus-visible:bg-[#0D0D0D] group-focus-visible:text-[#FFE600] md:group-hover:border-[#FFE600] md:group-hover:bg-[#0D0D0D] md:group-hover:text-[#FFE600]'
                      : ''
                  }`}
                >
                  {LESSON_TYPE_LABELS[lesson.type]}
                </span>
                {(lesson.isCustom || lesson.isModified) && (
                  <span className="border-2 border-white bg-[#0D0D0D] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#FFE600]">
                    {lesson.isCustom ? 'СВОЯ' : 'ИЗМ.'}
                  </span>
                )}
              </div>
            </div>

            {/* Subject */}
            <h3
              className={`break-words uppercase tracking-wide text-white ${
                compact
                  ? 'mt-2 font-condensed text-[13px] font-bold leading-tight'
                  : 'mt-2.5 font-display text-sm leading-snug sm:text-base'
              }`}
            >
              {lesson.subject}
            </h3>

            {/* Group badges */}
            {showGroupBadges && (
              <div className="mt-2 flex flex-wrap gap-1">
                {lesson.groupIds.map((gid) => (
                  <span
                    key={gid}
                    className={`px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider ${GROUP_BADGE_STYLES[gid]}`}
                  >
                    {gid}
                  </span>
                ))}
              </div>
            )}

            {/* Teacher / Subgroup / Room */}
            <div className="mt-2.5 space-y-1.5 text-xs text-neutral-200 md:group-hover:text-white">
              {pinnedSubgroup ? (
                <div className="p5-shadow-sm border-2 border-[#FFE600] border-l-4 border-l-[#E60012] bg-[#0D0D0D] px-2.5 py-1.5 text-white">
                  <div className="flex items-center gap-1.5 font-condensed text-[11px] font-bold uppercase tracking-wider text-[#FFE600]">
                    <Pin className="h-3 w-3 shrink-0" />
                    <span className="truncate">Моя подгруппа</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
                    <span className="font-bold text-white">
                      {pinnedSubgroup.teacherName}
                    </span>
                    {pinnedSubgroup.room && (
                      <span className="inline-flex items-center gap-1 bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[11px] font-bold uppercase text-[#0D0D0D]">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {pinnedSubgroup.room}
                      </span>
                    )}
                  </div>
                </div>
              ) : hasSubgroups ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-white">
                    <Users className="h-3.5 w-3.5 shrink-0 text-[#FFE600]" />
                    <span>{lesson.subgroups!.length} подгруппы / потока</span>
                  </div>
                  {compact ? (
                    <p className="line-clamp-2 break-words text-[11px] leading-snug text-neutral-200 md:group-hover:text-white">
                      {lesson.subgroups!
                        .map((sg) =>
                          sg.room ? `${sg.teacherName} (${sg.room})` : sg.teacherName
                        )
                        .join(' · ')}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {lesson.subgroups!.map((sg, idx) => (
                        <span
                          key={`${sg.teacherId ?? sg.teacherName}-${idx}`}
                          className="border border-white/60 bg-[#0D0D0D] px-2 py-0.5 text-[11px] font-semibold text-white"
                        >
                          {sg.teacherName}
                          {sg.room ? ` · ${sg.room}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  {lesson.teacherName && (
                    <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-white">
                      <User className="h-3.5 w-3.5 shrink-0 text-[#E60012] transition-colors group-focus-visible:text-[#FFE600] md:group-hover:text-[#FFE600]" />
                      <span className="break-words">{lesson.teacherName}</span>
                    </span>
                  )}
                  {lesson.room && (
                    <span className="inline-flex items-center gap-1 border border-white/50 bg-[#0D0D0D] px-1.5 py-0.5 font-condensed text-xs font-bold uppercase text-[#FFE600]">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{lesson.room}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Footer: Meet link & note flags */}
            {hasFooter && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t-2 border-white/20 pt-2">
                {meetUrl && (
                  <a
                    href={meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={meetUrl}
                    onClick={(e) => {
                      e.stopPropagation();
                      playOpen();
                    }}
                    className="p5-skew p5-shadow-sm inline-block border-2 border-[#0D0D0D] bg-[#FFE600] px-2.5 py-0.5 text-[#0D0D0D] transition hover:border-white hover:bg-[#0D0D0D] hover:text-[#FFE600]"
                  >
                    <span className="p5-unskew inline-flex items-center gap-1 font-condensed text-[11px] font-bold uppercase tracking-wider">
                      <span>GOOGLE MEET</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </span>
                  </a>
                )}

                {noteSeverity === 'warning' && (
                  <span className="inline-flex items-center gap-1 border-2 border-[#FFE600] bg-[#0D0D0D] px-2 py-0.5 font-condensed text-[11px] font-bold uppercase tracking-wider text-[#FFE600]">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>КОНФЛИКТ СУББОТЫ</span>
                  </span>
                )}

                {noteSeverity === 'info' &&
                  (lesson.notes?.includes('единственное очное') ? (
                    <span className="inline-flex items-center gap-1 border-2 border-[#0D0D0D] bg-[#FFE600] px-2 py-0.5 font-condensed text-[11px] font-bold uppercase tracking-wide text-[#0D0D0D]">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span className="line-clamp-1">
                        {lesson.notes.replace(' (согл. Satur_comments)', '')}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 border-2 border-white bg-[#0D0D0D] px-2 py-0.5 font-condensed text-[11px] font-bold uppercase tracking-wider text-white">
                      <Info className="h-3 w-3 shrink-0 text-[#FFE600]" />
                      <span>WEB-BASED</span>
                    </span>
                  ))}

                {noteSeverity === 'none' &&
                  !hasSubgroups &&
                  lesson.notes &&
                  !meetUrl && (
                    <span className="line-clamp-1 text-[11px] text-neutral-300 md:group-hover:text-white">
                      {lesson.notes}
                    </span>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
