import {
  Clock,
  Globe,
  MapPin,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import {
  DAY_LABELS_RU,
  GROUP_BADGE_STYLES,
  LESSON_TYPE_LABELS,
  LESSON_TYPE_STYLES,
} from '../../constants/schedule';
import type { EffectiveLesson, EffectiveTeacher } from '../../types/schedule';
import { Modal } from '../common/Modal';
import { NotesWithLinks } from '../common/NotesWithLinks';

interface LessonDetailModalProps {
  lesson: EffectiveLesson | null;
  teachersById: Record<string, EffectiveTeacher>;
  onClose: () => void;
  onEdit: (lesson: EffectiveLesson) => void;
  onDelete: (lesson: EffectiveLesson) => void;
  onTogglePinSubgroup: (lessonId: string, teacherId: string) => void;
  onOpenTeacher: (teacherId: string) => void;
}

export function LessonDetailModal({
  lesson,
  teachersById,
  onClose,
  onEdit,
  onDelete,
  onTogglePinSubgroup,
  onOpenTeacher,
}: LessonDetailModalProps) {
  if (!lesson) {
    return (
      <Modal open={false} onClose={onClose} title="">
        <></>
      </Modal>
    );
  }

  const hasSubgroups = Boolean(lesson.subgroups && lesson.subgroups.length > 0);
  const singleTeacher =
    lesson.teacherId && teachersById[lesson.teacherId]
      ? teachersById[lesson.teacherId]
      : null;

  return (
    <Modal
      open={Boolean(lesson)}
      onClose={onClose}
      title={lesson.subject}
      subtitle={`${DAY_LABELS_RU[lesson.day]} • ${lesson.startTime}–${lesson.endTime}`}
    >
      <div className="space-y-4">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
              LESSON_TYPE_STYLES[lesson.type]
            }`}
          >
            {LESSON_TYPE_LABELS[lesson.type]}
          </span>
          {lesson.isOnline && (
            <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/35 bg-cyan-500/15 px-2 py-0.5 text-xs font-semibold text-cyan-300">
              <Globe className="h-3.5 w-3.5" />
              Online
            </span>
          )}
          {lesson.isCustom && (
            <span className="rounded-md border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
              Добавлена вручную
            </span>
          )}
          {lesson.isModified && (
            <span className="rounded-md border border-amber-500/35 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
              Изменена локально
            </span>
          )}
        </div>

        {/* Time & Groups */}
        <div className="grid gap-3 rounded-xl border border-[#252e42] bg-[#1a2030]/60 p-3.5 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              Время и день
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-100">
              {DAY_LABELS_RU[lesson.day]}, {lesson.startTime}–{lesson.endTime}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users className="h-3.5 w-3.5" />
              Группы
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {lesson.groupIds.map((gid) => (
                <span
                  key={gid}
                  className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                    GROUP_BADGE_STYLES[gid]
                  }`}
                >
                  {gid}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Subgroups or Single Teacher */}
        {hasSubgroups ? (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Потоки / подгруппы ({lesson.subgroups!.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Можно закрепить «мою подгруппу» в localStorage
              </span>
            </div>
            <div className="space-y-2">
              {lesson.subgroups!.map((sg, idx) => {
                const isPinned =
                  Boolean(sg.teacherId) &&
                  lesson.pinnedSubgroupTeacherId === sg.teacherId;
                const teacherExists = Boolean(
                  sg.teacherId && teachersById[sg.teacherId]
                );

                return (
                  <div
                    key={`${sg.teacherId ?? sg.teacherName}-${idx}`}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 transition ${
                      isPinned
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-[#252e42] bg-[#1a2030]/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {teacherExists && sg.teacherId ? (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenTeacher(sg.teacherId!);
                            }}
                            className="text-left text-sm font-semibold text-blue-300 underline decoration-blue-400/40 underline-offset-2 transition hover:text-blue-200"
                          >
                            {sg.teacherName}
                          </button>
                        ) : (
                          <span className="text-sm font-semibold text-slate-100">
                            {sg.teacherName}
                          </span>
                        )}
                        {isPinned && (
                          <span className="rounded bg-blue-600/30 px-1.5 py-0.5 text-[10px] font-bold text-blue-200">
                            МОЯ ПОДГРУППА
                          </span>
                        )}
                      </div>
                      {sg.room && (
                        <div className="mt-0.5 flex items-center gap-1 font-mono text-xs text-slate-300">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{sg.room}</span>
                        </div>
                      )}
                    </div>

                    {sg.teacherId && (
                      <button
                        type="button"
                        onClick={() => onTogglePinSubgroup(lesson.id, sg.teacherId!)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                          isPinned
                            ? 'border-blue-400/50 bg-blue-600 text-white hover:bg-blue-500'
                            : 'border-[#252e42] bg-[#121620] text-slate-300 hover:border-blue-500/40 hover:text-white'
                        }`}
                      >
                        {isPinned ? (
                          <>
                            <PinOff className="h-3.5 w-3.5" />
                            <span>Открепить</span>
                          </>
                        ) : (
                          <>
                            <Pin className="h-3.5 w-3.5" />
                            <span>Моя подгруппа</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 rounded-xl border border-[#252e42] bg-[#1a2030]/60 p-3.5 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <User className="h-3.5 w-3.5" />
                Преподаватель
              </div>
              <div className="mt-1">
                {singleTeacher ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTeacher(singleTeacher.id);
                    }}
                    className="text-left text-sm font-semibold text-blue-400 underline decoration-blue-400/40 underline-offset-2 transition hover:text-blue-300"
                  >
                    {singleTeacher.name}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-slate-200">
                    {lesson.teacherName || 'Не указан'}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                Аудитория
              </div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-100">
                {lesson.room || (lesson.isOnline ? 'Online (без аудитории)' : 'Не указана')}
              </div>
            </div>
          </div>
        )}

        {/* Notes & clickable links */}
        {lesson.notes && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Заметки и ссылки
            </h3>
            <NotesWithLinks notes={lesson.notes} />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#252e42] pt-3">
          <button
            type="button"
            onClick={() => onDelete(lesson)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 sm:text-sm"
          >
            <Trash2 className="h-4 w-4" />
            <span>{lesson.isBase ? 'Скрыть / удалить' : 'Удалить пару'}</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(lesson)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 sm:text-sm"
          >
            <Pencil className="h-4 w-4" />
            <span>Редактировать</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
