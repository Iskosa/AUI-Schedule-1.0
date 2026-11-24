import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  Globe,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react';
import {
  DAY_LABELS_RU,
  GROUP_BADGE_STYLES,
  TARGET_GROUPS,
} from '../../constants/schedule';
import type {
  EffectiveLesson,
  EffectiveTeacher,
  GroupId,
} from '../../types/schedule';
import { NotesWithLinks } from '../common/NotesWithLinks';

interface TeacherDetailPanelProps {
  teacher: EffectiveTeacher | null;
  lessons: EffectiveLesson[];
  onBackToList?: () => void;
  onEdit: (teacher: EffectiveTeacher) => void;
  onDelete: (teacher: EffectiveTeacher) => void;
  onSelectLesson: (lesson: EffectiveLesson) => void;
}

export function TeacherDetailPanel({
  teacher,
  lessons,
  onBackToList,
  onEdit,
  onDelete,
  onSelectLesson,
}: TeacherDetailPanelProps) {
  if (!teacher) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-[#252e42] bg-[#121620]/60 p-6 text-center text-sm text-slate-400">
        Выберите преподавателя из списка слева, чтобы увидеть пары, группы и Office Hours.
      </div>
    );
  }

  const teacherLessons = lessons.filter((ls) =>
    ls.teacherIds.includes(teacher.id)
  );

  const taughtGroups = TARGET_GROUPS.filter((gid) =>
    teacherLessons.some((ls) => ls.groupIds.includes(gid))
  ) as GroupId[];

  const lessonRooms = Array.from(
    new Set(
      teacherLessons
        .map((ls) => {
          const sg = ls.subgroups?.find((item) => item.teacherId === teacher.id);
          return sg?.room || ls.room;
        })
        .filter((r): r is string => Boolean(r))
    )
  );

  return (
    <div className="space-y-4 rounded-2xl border border-[#252e42] bg-[#121620] p-4 sm:p-5">
      {onBackToList && (
        <button
          type="button"
          onClick={onBackToList}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#252e42] bg-[#1a2030] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 lg:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          К списку преподавателей
        </button>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#252e42] pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-xl font-bold text-white">
              {teacher.name}
            </h2>
            {teacher.isCustom && (
              <span className="rounded border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                Добавлен вручную
              </span>
            )}
            {teacher.isModified && (
              <span className="rounded border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
                Изменён
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              Кабинет: <strong className="font-mono text-white">{teacher.room || 'Не указан'}</strong>
            </span>
            {lessonRooms.length > 0 && (
              <span className="text-slate-400">
                Аудитории на парах:{' '}
                <strong className="font-mono text-slate-200">
                  {lessonRooms.join(', ')}
                </strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(teacher)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#252e42] bg-[#1a2030] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-blue-500/40 hover:bg-[#222a3f]"
          >
            <Pencil className="h-3.5 w-3.5 text-blue-400" />
            Редактировать
          </button>
          <button
            type="button"
            onClick={() => onDelete(teacher)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {teacher.isCustom ? 'Удалить' : 'Скрыть'}
          </button>
        </div>
      </div>

      {/* Courses & Groups */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#252e42] bg-[#1a2030]/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <BookOpen className="h-3.5 w-3.5" />
            Предметы
          </div>
          {teacher.courses.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {teacher.courses.map((course, idx) => (
                <span
                  key={`${course}-${idx}`}
                  className="rounded-lg border border-[#252e42] bg-[#121620] px-2.5 py-1 text-xs text-slate-200"
                >
                  {course}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Предметы не указаны</p>
          )}
        </div>

        <div className="rounded-xl border border-[#252e42] bg-[#1a2030]/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Users className="h-3.5 w-3.5" />
            Группы (из 4 целевых)
          </div>
          {taughtGroups.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {taughtGroups.map((gid) => (
                <span
                  key={gid}
                  className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${GROUP_BADGE_STYLES[gid]}`}
                >
                  {gid}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              В расписании 4 целевых групп пар нет
            </p>
          )}
        </div>
      </div>

      {/* Office Hours */}
      <div className="rounded-xl border border-[#252e42] bg-[#1a2030]/50 p-3.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          Office Hours ({teacher.officeHours.length})
        </div>
        {teacher.officeHours.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {teacher.officeHours.map((oh, idx) => (
              <div
                key={`${oh.day}-${oh.startTime}-${idx}`}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100"
              >
                <span className="font-semibold">{DAY_LABELS_RU[oh.day]}</span>{' '}
                <span className="font-mono text-amber-200">
                  {oh.startTime}–{oh.endTime}
                </span>
                {oh.room && (
                  <span className="ml-1.5 font-mono text-amber-300">({oh.room})</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Office Hours не указаны</p>
        )}
      </div>

      {/* Teacher Notes */}
      {teacher.notes && <NotesWithLinks notes={teacher.notes} />}

      {/* Lessons of this teacher */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <CalendarDays className="h-3.5 w-3.5" />
          Пары в расписании ({teacherLessons.length})
        </div>

        {teacherLessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#252e42] p-4 text-center text-xs text-slate-500">
            У этого преподавателя нет пар среди 4 целевых групп.
          </div>
        ) : (
          <div className="space-y-2">
            {teacherLessons.map((ls) => {
              const mySubgroup = ls.subgroups?.find(
                (sg) => sg.teacherId === teacher.id
              );
              const effectiveRoom = mySubgroup?.room || ls.room;
              const isStream = ls.teacherIds.length > 1;

              return (
                <button
                  key={ls.id}
                  type="button"
                  onClick={() => onSelectLesson(ls)}
                  className="flex w-full flex-col gap-1.5 rounded-xl border border-[#252e42] bg-[#151a26] p-3 text-left transition hover:border-blue-500/50 hover:bg-[#192030]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-blue-300">
                      {DAY_LABELS_RU[ls.day]} • {ls.startTime}–{ls.endTime}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isStream && (
                        <span className="rounded border border-amber-500/35 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                          Потоковая / подгруппа
                        </span>
                      )}
                      {ls.isOnline && (
                        <span className="inline-flex items-center gap-1 rounded border border-cyan-500/35 bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                          <Globe className="h-2.5 w-2.5" />
                          ONLINE
                        </span>
                      )}
                      {effectiveRoom && (
                        <span className="inline-flex items-center gap-1 rounded bg-[#1a2030] px-1.5 py-0.5 font-mono text-[11px] text-slate-200">
                          <MapPin className="h-2.5 w-2.5 text-slate-400" />
                          {effectiveRoom}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-white">
                    {ls.subject}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {ls.groupIds.map((gid) => (
                      <span
                        key={gid}
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${GROUP_BADGE_STYLES[gid]}`}
                      >
                        {gid}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
