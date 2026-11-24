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
import { RansomTitle } from '../common/RansomTitle';

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
      <div className="p5-confidant-bg p5-shadow flex h-full min-h-[300px] flex-col items-center justify-center gap-3 border-2 border-white p-6 text-center">
        <div className="p5-skew border-2 border-white bg-[#E60012] px-4 py-1.5 shadow-[4px_4px_0_#0D0D0D]">
          <span className="p5-unskew inline-flex items-center gap-2 font-display text-sm uppercase tracking-wider text-white">
            <span className="text-[#FFE600]">★</span>
            <span>CONFIDANT DOSSIER</span>
            <span className="text-[#FFE600]">★</span>
          </span>
        </div>
        <p className="max-w-md font-condensed text-sm font-bold uppercase tracking-wider text-neutral-200">
          Выберите преподавателя из списка слева, чтобы увидеть пары, группы и Office Hours.
        </p>
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

  const filledStars = Math.min(5, teacherLessons.length);

  return (
    <div className="p5-shadow overflow-x-clip border-2 border-white border-t-[6px] border-t-[#E60012] bg-[#0D0D0D]">
      {/* Confidant Hero Header */}
      <div className="p5-confidant-bg space-y-3 border-b-2 border-white p-4 sm:p-5">
        {onBackToList && (
          <button
            type="button"
            onClick={onBackToList}
            className="p5-skew p5-shadow-sm inline-block border-2 border-[#0D0D0D] bg-white px-3 py-1.5 text-[#0D0D0D] hover:bg-[#FFE600] lg:hidden"
          >
            <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>К списку преподавателей</span>
            </span>
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p5-skew border-2 border-[#0D0D0D] bg-white px-2.5 py-0.5 text-[#0D0D0D] shadow-[3px_3px_0_#E60012]">
              <span className="p5-unskew block font-condensed text-xs font-bold uppercase tracking-widest">
                CONFIDANT
              </span>
            </span>
            <div
              className="flex items-center gap-1 border-2 border-white bg-[#0D0D0D] px-2 py-0.5"
              aria-label={`Нагрузка: ${teacherLessons.length} пар в неделю`}
            >
              <span className="text-sm leading-none tracking-tight">
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
            </div>
            <span className="border-2 border-[#0D0D0D] bg-[#FFE600] px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
              {teacherLessons.length} ПАР/НЕД
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(teacher)}
              className="p5-skew p5-shadow-sm border-2 border-white bg-[#161616] px-3 py-1.5 text-white transition-transform hover:-translate-y-0.5 hover:border-[#FFE600] hover:text-[#FFE600]"
            >
              <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
                <Pencil className="h-3.5 w-3.5 text-[#FFE600]" />
                <span>Редактировать</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(teacher)}
              className="p5-skew p5-shadow-sm border-2 border-white bg-[#E60012] px-3 py-1.5 text-white transition-transform hover:-translate-y-0.5 hover:bg-white hover:text-[#0D0D0D]"
            >
              <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
                <Trash2 className="h-3.5 w-3.5" />
                <span>{teacher.isCustom ? 'Удалить' : 'Скрыть'}</span>
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <RansomTitle text={teacher.name} as="h2" size="lg" />

          {(teacher.isCustom || teacher.isModified) && (
            <div className="flex flex-wrap items-center gap-2">
              {teacher.isCustom && (
                <span className="border-2 border-[#0D0D0D] bg-[#FFE600] px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
                  Добавлен вручную
                </span>
              )}
              {teacher.isModified && (
                <span className="border-2 border-white bg-[#0D0D0D] px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
                  Изменён локально
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-200">
            <span className="inline-flex items-center gap-1.5 border border-white/40 bg-[#0D0D0D] px-2 py-1">
              <MapPin className="h-3.5 w-3.5 text-[#E60012]" />
              <span className="font-condensed font-bold uppercase tracking-wider text-neutral-300">
                Кабинет:
              </span>
              <strong className="font-condensed text-sm font-bold uppercase text-[#FFE600]">
                {teacher.room || 'Не указан'}
              </strong>
            </span>

            {lessonRooms.length > 0 && (
              <span className="inline-flex items-center gap-1.5 border border-white/40 bg-[#0D0D0D] px-2 py-1">
                <span className="font-condensed font-bold uppercase tracking-wider text-neutral-300">
                  Аудитории:
                </span>
                <strong className="font-condensed text-xs font-bold uppercase text-white">
                  {lessonRooms.join(', ')}
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confidant Dossier Body */}
      <div className="space-y-4 p-4 sm:p-5">
        {/* Office Hours */}
        <div
          className={`p5-shadow-sm border-2 bg-[#161616] p-3.5 ${
            teacher.officeHours.length > 0
              ? 'border-[#FFE600]'
              : 'border-white/30'
          }`}
        >
          <div className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
            <Clock className="h-3.5 w-3.5" />
            <span>Office Hours ({teacher.officeHours.length})</span>
          </div>
          {teacher.officeHours.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {teacher.officeHours.map((oh, idx) => (
                <div
                  key={`${oh.day}-${oh.startTime}-${idx}`}
                  className="border-2 border-[#0D0D0D] bg-[#FFE600] px-3 py-1 font-condensed text-xs font-bold uppercase tracking-wide text-[#0D0D0D] shadow-[3px_3px_0_#E60012]"
                >
                  <span>{DAY_LABELS_RU[oh.day]}</span>{' '}
                  <span className="tabular-nums">
                    {oh.startTime}–{oh.endTime}
                  </span>
                  {oh.room && <span className="ml-1.5">({oh.room})</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-neutral-400">
              Office Hours не указаны
            </p>
          )}
        </div>

        {/* Courses & Groups */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p5-shadow-sm border-2 border-white bg-[#161616] p-3.5">
            <div className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Предметы</span>
            </div>
            {teacher.courses.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {teacher.courses.map((course, idx) => (
                  <span
                    key={`${course}-${idx}`}
                    className="border border-white/60 bg-[#0D0D0D] px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    {course}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-neutral-400">
                Предметы не указаны
              </p>
            )}
          </div>

          <div className="p5-shadow-sm border-2 border-white bg-[#161616] p-3.5">
            <div className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
              <Users className="h-3.5 w-3.5" />
              <span>Группы (из 4 целевых)</span>
            </div>
            {taughtGroups.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {taughtGroups.map((gid) => (
                  <span
                    key={gid}
                    className={`px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider ${GROUP_BADGE_STYLES[gid]}`}
                  >
                    {gid}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-neutral-400">
                В расписании 4 целевых групп пар нет
              </p>
            )}
          </div>
        </div>

        {/* Teacher Notes */}
        {teacher.notes && <NotesWithLinks notes={teacher.notes} />}

        {/* Lessons of this teacher */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-white">
            <CalendarDays className="h-3.5 w-3.5 text-[#E60012]" />
            <span>Пары в расписании ({teacherLessons.length})</span>
          </div>

          {teacherLessons.length === 0 ? (
            <div className="border-2 border-dashed border-white/30 bg-[#161616] p-4 text-center font-condensed text-xs font-bold uppercase tracking-wider text-neutral-400">
              У этого преподавателя нет пар среди 4 целевых групп.
            </div>
          ) : (
            <div className="space-y-2.5">
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
                    className="group p5-shadow-sm flex w-full flex-col gap-2 border-2 border-white bg-[#161616] p-3 text-left transition-transform hover:-translate-y-0.5 hover:bg-[#E60012]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="p5-skew inline-block border-2 border-[#0D0D0D] bg-white px-2.5 py-0.5 text-[#0D0D0D]">
                        <span className="p5-unskew block font-condensed text-xs font-bold uppercase tabular-nums tracking-wider">
                          {DAY_LABELS_RU[ls.day]} • {ls.startTime}–{ls.endTime}
                        </span>
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {isStream && (
                          <span className="border-2 border-[#0D0D0D] bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D]">
                            ПОТОК / ПОДГРУППА
                          </span>
                        )}
                        {ls.isOnline && (
                          <span className="inline-flex items-center gap-1 border-2 border-[#0D0D0D] bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-[#0D0D0D]">
                            <Globe className="h-2.5 w-2.5" />
                            ONLINE
                          </span>
                        )}
                        {effectiveRoom && (
                          <span className="inline-flex items-center gap-1 border border-white/60 bg-[#0D0D0D] px-2 py-0.5 font-condensed text-[11px] font-bold uppercase text-[#FFE600]">
                            <MapPin className="h-2.5 w-2.5" />
                            {effectiveRoom}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="font-display text-sm uppercase tracking-wide text-white">
                      {ls.subject}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {ls.groupIds.map((gid) => (
                        <span
                          key={gid}
                          className={`px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider ${GROUP_BADGE_STYLES[gid]}`}
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
    </div>
  );
}
