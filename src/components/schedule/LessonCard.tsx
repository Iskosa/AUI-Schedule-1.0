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

interface LessonCardProps {
  lesson: EffectiveLesson;
  selectedGroup: GroupFilter;
  compact?: boolean;
  onClick: () => void;
}

export function LessonCard({
  lesson,
  selectedGroup,
  compact = false,
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
      className={`group cursor-pointer rounded-xl border text-left transition ${
        noteSeverity === 'warning'
          ? 'border-amber-500/40 bg-[#171821] hover:border-amber-400/70'
          : pinnedSubgroup
            ? 'border-blue-500/40 bg-[#151b2a] hover:border-blue-400/70'
            : 'border-[#252e42] bg-[#151a26] hover:border-slate-500 hover:bg-[#192030]'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Top row: time + type + flags */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="font-mono text-xs font-semibold text-blue-300">
          {lesson.startTime}–{lesson.endTime}
        </span>

        <div className="flex flex-wrap items-center gap-1">
          {lesson.isOnline && (
            <span className="inline-flex items-center gap-1 rounded border border-cyan-500/35 bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-cyan-300">
              <Globe className="h-2.5 w-2.5" />
              ONLINE
            </span>
          )}
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
              LESSON_TYPE_STYLES[lesson.type]
            }`}
          >
            {LESSON_TYPE_LABELS[lesson.type]}
          </span>
          {(lesson.isCustom || lesson.isModified) && (
            <span className="rounded border border-emerald-500/35 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
              {lesson.isCustom ? 'Своя' : 'Изм.'}
            </span>
          )}
        </div>
      </div>

      {/* Subject */}
      <h3
        className={`mt-2 break-words font-semibold text-slate-100 group-hover:text-white ${
          compact ? 'text-sm leading-snug' : 'text-base'
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
              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                GROUP_BADGE_STYLES[gid]
              }`}
            >
              {gid}
            </span>
          ))}
        </div>
      )}

      {/* Teacher / Subgroup / Room */}
      <div className="mt-2.5 space-y-1.5 text-xs text-slate-300">
        {pinnedSubgroup ? (
          <div className="rounded-lg border border-blue-500/35 bg-blue-500/10 px-2.5 py-1.5 text-blue-100">
            <div className="flex items-center gap-1.5 font-semibold text-blue-300">
              <Pin className="h-3 w-3 shrink-0" />
              <span className="truncate">Моя подгруппа</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs">
              <span className="font-medium text-white">
                {pinnedSubgroup.teacherName}
              </span>
              {pinnedSubgroup.room && (
                <span className="inline-flex items-center gap-1 font-mono text-blue-200">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {pinnedSubgroup.room}
                </span>
              )}
            </div>
          </div>
        ) : hasSubgroups ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Users className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span className="font-medium">
                {lesson.subgroups!.length} подгруппы / потока
              </span>
            </div>
            {compact ? (
              <p className="line-clamp-2 break-words text-[11px] text-slate-400">
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
                    className="rounded-md border border-[#252e42] bg-[#1a2030] px-2 py-0.5 text-[11px] text-slate-200"
                  >
                    {sg.teacherName}
                    {sg.room ? ` · ${sg.room}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {lesson.teacherName && (
              <span className="inline-flex min-w-0 items-center gap-1 text-slate-300">
                <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="break-words">{lesson.teacherName}</span>
              </span>
            )}
            {lesson.room && (
              <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>{lesson.room}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Meet link & note flags */}
      {(meetUrl || noteSeverity !== 'none' || (!hasSubgroups && lesson.notes && !meetUrl)) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[#252e42]/70 pt-2">
          {meetUrl && (
            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-md border border-blue-500/40 bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-300 transition hover:bg-blue-500/25"
            >
              <span>Google Meet</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}

          {noteSeverity === 'warning' && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Конфликт субботы</span>
            </span>
          )}

          {noteSeverity === 'info' && (
            <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-300">
              <Info className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">
                {lesson.notes?.includes('единственное очное')
                  ? lesson.notes.replace(' (согл. Satur_comments)', '')
                  : 'Web-based'}
              </span>
            </span>
          )}

          {noteSeverity === 'none' && !hasSubgroups && lesson.notes && !meetUrl && (
            <span className="line-clamp-1 text-[11px] text-slate-400">
              {lesson.notes}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
