import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Check, Plus, Search, X } from 'lucide-react';
import {
  DAY_LABELS_RU,
  DAYS,
  GROUP_BADGE_STYLES,
  LESSON_TYPE_LABELS,
  TARGET_GROUPS,
  TIME_PRESETS,
} from '../../constants/schedule';
import type { LessonDraftInput } from '../../hooks/useScheduleStore';
import type {
  DayOfWeek,
  EffectiveLesson,
  EffectiveTeacher,
  GroupId,
  LessonType,
} from '../../types/schedule';
import { findLessonConflicts } from '../../utils/conflicts';
import { parseTimeToMinutes } from '../../utils/time';
import { Modal } from '../common/Modal';

interface LessonEditorModalProps {
  open: boolean;
  editingLesson: EffectiveLesson | null;
  defaultDay: DayOfWeek;
  defaultGroup?: GroupId;
  teachers: EffectiveTeacher[];
  teachersById: Record<string, EffectiveTeacher>;
  existingLessons: EffectiveLesson[];
  onClose: () => void;
  onSave: (
    draft: LessonDraftInput,
    editingLesson: EffectiveLesson | null
  ) => void;
}

const LESSON_TYPES: LessonType[] = ['regular', 'fixed', 'elective', 'advisor'];

export function LessonEditorModal({
  open,
  editingLesson,
  defaultDay,
  defaultGroup,
  teachers,
  teachersById,
  existingLessons,
  onClose,
  onSave,
}: LessonEditorModalProps) {
  const [subject, setSubject] = useState('');
  const [day, setDay] = useState<DayOfWeek>(defaultDay);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:25');
  const [type, setType] = useState<LessonType>('regular');
  const [groupIds, setGroupIds] = useState<GroupId[]>(['COMSE26A']);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [room, setRoom] = useState('');
  const [subgroupRooms, setSubgroupRooms] = useState<Record<string, string>>(
    {}
  );
  const [isOnline, setIsOnline] = useState(false);
  const [notes, setNotes] = useState('');
  const [teacherQuery, setTeacherQuery] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setTeacherQuery('');

    if (editingLesson) {
      setSubject(editingLesson.subject);
      setDay(editingLesson.day);
      setStartTime(editingLesson.startTime);
      setEndTime(editingLesson.endTime);
      setType(editingLesson.type);
      setGroupIds(editingLesson.groupIds);
      setTeacherIds(editingLesson.teacherIds);
      setRoom(editingLesson.room ?? '');
      const sgMap: Record<string, string> = {};
      for (const sg of editingLesson.subgroups ?? []) {
        if (sg.teacherId) sgMap[sg.teacherId] = sg.room;
      }
      setSubgroupRooms(sgMap);
      setIsOnline(editingLesson.isOnline);
      setNotes(editingLesson.notes ?? '');
    } else {
      setSubject('');
      setDay(defaultDay);
      setStartTime('08:00');
      setEndTime('09:25');
      setType('regular');
      setGroupIds(defaultGroup ? [defaultGroup] : ['COMSE26A']);
      setTeacherIds([]);
      setRoom('');
      setSubgroupRooms({});
      setIsOnline(false);
      setNotes('');
    }
  }, [open, editingLesson, defaultDay, defaultGroup]);

  const filteredTeachers = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.courses.some((c) => c.toLowerCase().includes(q)) ||
        (t.room && t.room.toLowerCase().includes(q))
    );
  }, [teachers, teacherQuery]);

  const conflicts = useMemo(
    () =>
      findLessonConflicts(
        {
          day,
          startTime,
          endTime,
          groupIds,
          teacherIds,
        },
        existingLessons,
        teachersById,
        editingLesson?.id
      ),
    [
      day,
      startTime,
      endTime,
      groupIds,
      teacherIds,
      existingLessons,
      teachersById,
      editingLesson,
    ]
  );

  const toggleGroup = (gid: GroupId) => {
    setGroupIds((prev) =>
      prev.includes(gid) ? prev.filter((item) => item !== gid) : [...prev, gid]
    );
  };

  const toggleTeacher = (tid: string) => {
    setTeacherIds((prev) => {
      if (prev.includes(tid)) {
        return prev.filter((id) => id !== tid);
      }
      return [...prev, tid];
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setFormError('Укажите название предмета.');
      return;
    }
    if (groupIds.length === 0) {
      setFormError('Выберите хотя бы одну группу.');
      return;
    }
    if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
      setFormError('Время окончания должно быть позже времени начала.');
      return;
    }

    const isStream = teacherIds.length > 1;
    const subgroups = isStream
      ? teacherIds.map((tid) => ({
          teacherId: tid,
          teacherName: teachersById[tid]?.name ?? tid,
          room: (subgroupRooms[tid] ?? room ?? '').trim(),
        }))
      : undefined;

    onSave(
      {
        day,
        startTime,
        endTime,
        subject: subject.trim(),
        type,
        groupIds,
        teacherIds,
        room: room.trim() || null,
        isOnline,
        subgroups,
        notes: notes.trim() || null,
      },
      editingLesson
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingLesson ? 'Редактировать пару' : 'Добавить пару'}
      subtitle="Изменения сохраняются в localStorage overlay"
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p5-shadow-sm border-2 border-white bg-[#E60012] px-3.5 py-2.5 text-sm font-bold text-white">
            {formError}
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
            Предмет *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Например, Programming language (Java)"
            className="p5-input w-full px-3.5 py-2.5 text-sm placeholder-neutral-500"
          />
        </div>

        {/* Groups */}
        <div>
          <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
            Группы *
          </label>
          <div className="flex flex-wrap gap-2">
            {TARGET_GROUPS.map((gid) => {
              const selected = groupIds.includes(gid);
              return (
                <button
                  key={gid}
                  type="button"
                  onClick={() => toggleGroup(gid)}
                  className={`p5-skew p5-shadow-sm border-2 px-3 py-1.5 transition-transform ${
                    selected
                      ? `-translate-y-0.5 ${GROUP_BADGE_STYLES[gid]} ring-2 ring-[#FFE600]`
                      : 'border-white/50 bg-[#161616] text-neutral-300 hover:border-[#FFE600] hover:text-[#FFE600]'
                  }`}
                >
                  <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
                    {selected && <Check className="h-3 w-3" />}
                    <span>{gid}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day + Time */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
              День недели
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayOfWeek)}
              className="p5-input w-full px-3 py-2.5 text-sm"
            >
              {DAYS.map((d) => (
                <option key={d} value={d} className="bg-[#0D0D0D] text-white">
                  {DAY_LABELS_RU[d]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
              Начало
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="p5-input w-full px-3 py-2 text-sm [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
              Окончание
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="p5-input w-full px-3 py-2 text-sm [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Quick Time Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-condensed text-[11px] font-bold uppercase tracking-wider text-[#FFE600]">
            Слоты AIU:
          </span>
          {TIME_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setStartTime(preset.startTime);
                setEndTime(preset.endTime);
              }}
              className={`rounded-none border-2 px-2 py-1 font-condensed text-[11px] font-bold uppercase ${
                startTime === preset.startTime && endTime === preset.endTime
                  ? 'border-[#0D0D0D] bg-[#FFE600] text-[#0D0D0D]'
                  : 'border-white/40 bg-[#161616] text-neutral-200 hover:border-[#FFE600] hover:text-[#FFE600]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Conflict Detector Comic Banner */}
        {conflicts.length > 0 && (
          <div className="border-[3px] border-[#FFE600] bg-[#E60012] p-3.5 text-xs text-white shadow-[4px_4px_0_#FFE600]">
            <div className="inline-flex items-center gap-1.5 border border-[#FFE600] bg-[#0D0D0D] px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>ВНИМАНИЕ! НАКЛАДКИ ПО ВРЕМЕНИ ({conflicts.length})</span>
            </div>
            <ul className="mt-2 space-y-1 pl-5 text-white">
              {conflicts.map((c, idx) => (
                <li
                  key={`${c.kind}-${c.entityId}-${c.lessonId}-${idx}`}
                  className="list-disc"
                >
                  {c.kind === 'group' ? 'Группа' : 'Преподаватель'}{' '}
                  <span className="font-bold text-[#FFE600]">
                    {c.entityName}
                  </span>{' '}
                  занята на паре «{c.lessonSubject}» ({c.startTime}–{c.endTime})
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Type + Online */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
              Тип занятия
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LessonType)}
              className="p5-input w-full px-3 py-2.5 text-sm"
            >
              {LESSON_TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#0D0D0D] text-white">
                  {LESSON_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-2.5 border-2 border-white bg-[#161616] px-3.5 py-2.5 text-sm font-semibold text-white hover:border-[#FFE600]">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="h-4 w-4 rounded-none accent-[#E60012]"
              />
              <span>Онлайн-занятие (Online / Web-based)</span>
            </label>
          </div>
        </div>

        {/* Teachers multi-select */}
        <div className="space-y-2.5 border-2 border-white/70 bg-[#161616] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
              Преподаватели ({teacherIds.length})
            </label>
            <span className="text-[11px] text-neutral-300">
              Выберите 1 или нескольких (для потоковых пар)
            </span>
          </div>

          {teacherIds.length > 0 && (
            <div className="space-y-1.5">
              {teacherIds.map((tid) => {
                const t = teachersById[tid];
                const label = t?.name ?? tid;
                return (
                  <div
                    key={tid}
                    className="flex flex-wrap items-center justify-between gap-2 border-2 border-[#FFE600] bg-[#0D0D0D] px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-bold text-white">{label}</span>
                    <div className="flex items-center gap-2">
                      {teacherIds.length > 1 && (
                        <input
                          type="text"
                          value={subgroupRooms[tid] ?? ''}
                          onChange={(e) =>
                            setSubgroupRooms((prev) => ({
                              ...prev,
                              [tid]: e.target.value,
                            }))
                          }
                          placeholder="Ауд. подгруппы"
                          className="p5-input w-28 px-2 py-1 text-xs placeholder-neutral-500"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => toggleTeacher(tid)}
                        aria-label={`Убрать ${label}`}
                        className="border border-white/40 bg-[#161616] p-1 text-white hover:bg-[#E60012]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-neutral-300" />
            <input
              type="text"
              value={teacherQuery}
              onChange={(e) => setTeacherQuery(e.target.value)}
              placeholder="Поиск преподавателя..."
              className="p5-input w-full py-2 pr-3 pl-8 text-xs placeholder-neutral-500"
            />
          </div>

          <div className="max-h-36 overflow-y-auto border-2 border-white/60 bg-[#0D0D0D] p-1">
            {filteredTeachers.length === 0 ? (
              <div className="p-2 text-center text-xs text-neutral-400">
                Преподаватели не найдены
              </div>
            ) : (
              filteredTeachers.map((t) => {
                const selected = teacherIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTeacher(t.id)}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs ${
                      selected
                        ? 'bg-[#E60012] font-bold text-white'
                        : 'text-neutral-200 hover:bg-[#161616] hover:text-[#FFE600]'
                    }`}
                  >
                    <span className="truncate">
                      {t.name}
                      {t.isCustom && (
                        <span className="ml-1.5 text-[10px] text-[#FFE600]">
                          (свой)
                        </span>
                      )}
                    </span>
                    <span className="ml-2 shrink-0 font-condensed text-[11px] font-bold uppercase">
                      {selected ? 'Выбран' : <Plus className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Single / Fallback Room */}
        {teacherIds.length <= 1 && (
          <div>
            <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
              Аудитория
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Например, B101, BIGLAB, LAB4(211)"
              className="p5-input w-full px-3.5 py-2.5 text-sm placeholder-neutral-500"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
            Заметки / ссылка Google Meet
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Например, Meet: https://meet.google.com/..."
            className="p5-input w-full px-3.5 py-2 text-sm placeholder-neutral-500"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t-2 border-white/20 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="p5-skew p5-shadow-sm border-2 border-white bg-[#161616] px-4 py-2 text-white transition-transform hover:-translate-y-0.5 hover:border-[#FFE600] hover:text-[#FFE600]"
          >
            <span className="p5-unskew block font-condensed text-sm font-bold uppercase tracking-wider">
              Отмена
            </span>
          </button>
          <button
            type="submit"
            className="p5-skew border-2 border-[#0D0D0D] bg-[#FFE600] px-5 py-2 text-[#0D0D0D] shadow-[4px_4px_0_#E60012] transition-transform hover:-translate-y-0.5 hover:border-white hover:bg-[#E60012] hover:text-white"
          >
            <span className="p5-unskew block font-condensed text-sm font-bold uppercase tracking-wider">
              {editingLesson ? 'Сохранить изменения' : 'Добавить пару'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
