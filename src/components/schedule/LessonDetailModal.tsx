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
            className={`px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider ${LESSON_TYPE_STYLES[lesson.type]}`}
          >
            {LESSON_TYPE_LABELS[lesson.type]}
          </span>
          {lesson.isOnline && (
            <span className="inline-flex items-center gap-1 border-2 border-[#0D0D0D] bg-[#FFE600] px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
              <Globe className="h-3.5 w-3.5" />
              ONLINE
            </span>
          )}
          {lesson.isCustom && (
            <span className="border-2 border-[#0D0D0D] bg-[#FFE600] px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
              Добавлена вручную
            </span>
          )}
          {lesson.isModified && (
            <span className="border-2 border-white bg-[#161616] px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
              Изменена локально
            </span>
          )}
        </div>

        {/* Time & Groups */}
        <div className="p5-shadow-sm grid gap-3 border-2 border-white bg-[#161616] p-3.5 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
              <Clock className="h-3.5 w-3.5" />
              <span>Время и день</span>
            </div>
            <div className="mt-1 font-condensed text-base font-bold uppercase tracking-wide text-white">
              {DAY_LABELS_RU[lesson.day]}, {lesson.startTime}–{lesson.endTime}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
              <Users className="h-3.5 w-3.5" />
              <span>Группы</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {lesson.groupIds.map((gid) => (
                <span
                  key={gid}
                  className={`px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider ${GROUP_BADGE_STYLES[gid]}`}
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
              <h3 className="font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
                Потоки / подгруппы ({lesson.subgroups!.length})
              </h3>
              <span className="text-[11px] text-neutral-300">
                Закрепите свою подгруппу (localStorage)
              </span>
            </div>
            <div className="space-y-2.5">
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
                    className={`p5-shadow-sm flex flex-wrap items-center justify-between gap-2.5 border-2 px-3.5 py-2.5 transition ${
                      isPinned
                        ? 'border-[#FFE600] border-l-[6px] border-l-[#E60012] bg-[#161616]'
                        : 'border-white/70 bg-[#161616]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {teacherExists && sg.teacherId ? (
                          <button
                            type="button"
                            onClick={() => onOpenTeacher(sg.teacherId!)}
                            className="text-left text-sm font-bold text-[#FFE600] underline decoration-[#E60012] decoration-2 underline-offset-4 transition hover:text-white"
                          >
                            {sg.teacherName}
                          </button>
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {sg.teacherName}
                          </span>
                        )}
                        {isPinned && (
                          <span className="border border-[#0D0D0D] bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D]">
                            ★ МОЯ ПОДГРУППА
                          </span>
                        )}
                      </div>
                      {sg.room && (
                        <div className="mt-1 inline-flex items-center gap-1 border border-white/40 bg-[#0D0D0D] px-1.5 py-0.5 font-condensed text-xs font-bold uppercase text-[#FFE600]">
                          <MapPin className="h-3 w-3" />
                          <span>{sg.room}</span>
                        </div>
                      )}
                    </div>

                    {sg.teacherId && (
                      <button
                        type="button"
                        onClick={() =>
                          onTogglePinSubgroup(lesson.id, sg.teacherId!)
                        }
                        className={`p5-skew border-2 px-3 py-1.5 transition hover:-translate-y-0.5 ${
                          isPinned
                            ? 'border-white bg-[#E60012] text-white shadow-[3px_3px_0_#0D0D0D] hover:bg-white hover:text-[#0D0D0D]'
                            : 'border-[#0D0D0D] bg-[#FFE600] text-[#0D0D0D] shadow-[3px_3px_0_#E60012] hover:border-white hover:bg-[#E60012] hover:text-white'
                        }`}
                      >
                        <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
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
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p5-shadow-sm grid gap-3 border-2 border-white bg-[#161616] p-3.5 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
                <User className="h-3.5 w-3.5" />
                <span>Преподаватель</span>
              </div>
              <div className="mt-1">
                {singleTeacher ? (
                  <button
                    type="button"
                    onClick={() => onOpenTeacher(singleTeacher.id)}
                    className="text-left text-sm font-bold text-[#FFE600] underline decoration-[#E60012] decoration-2 underline-offset-4 transition hover:text-white"
                  >
                    {singleTeacher.name}
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-white">
                    {lesson.teacherName || 'Не указан'}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
                <MapPin className="h-3.5 w-3.5" />
                <span>Аудитория</span>
              </div>
              <div className="mt-1 font-condensed text-base font-bold uppercase text-white">
                {lesson.room ||
                  (lesson.isOnline ? 'Online (без аудитории)' : 'Не указана')}
              </div>
            </div>
          </div>
        )}

        {/* Notes & clickable links */}
        {lesson.notes && (
          <div className="space-y-1.5">
            <h3 className="font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
              Заметки и ссылки
            </h3>
            <NotesWithLinks notes={lesson.notes} />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-white/20 pt-3">
          <button
            type="button"
            onClick={() => onDelete(lesson)}
            className="p5-skew p5-shadow-sm border-2 border-white bg-[#0D0D0D] px-3.5 py-2 text-white transition hover:-translate-y-0.5 hover:bg-[#E60012]"
          >
            <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
              <Trash2 className="h-4 w-4 text-[#FFE600]" />
              <span>{lesson.isBase ? 'Скрыть / удалить' : 'Удалить пару'}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(lesson)}
            className="p5-skew border-2 border-[#0D0D0D] bg-[#FFE600] px-4 py-2 text-[#0D0D0D] shadow-[4px_4px_0_#E60012] transition hover:-translate-y-0.5 hover:border-white hover:bg-[#E60012] hover:text-white"
          >
            <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
              <Pencil className="h-4 w-4" />
              <span>Редактировать</span>
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
