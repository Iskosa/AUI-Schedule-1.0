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
  onSave: (draft: LessonDraftInput, editingLesson: EffectiveLesson | null) => void;
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
  const [groupIds, setGroupIds] = useState<GroupId[]>(['COMSE26B']);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [room, setRoom] = useState('');
  const [subgroupRooms, setSubgroupRooms] = useState<Record<string, string>>({});
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
      setGroupIds(defaultGroup ? [defaultGroup] : ['COMSE26B']);
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
    [day, startTime, endTime, groupIds, teacherIds, existingLessons, teachersById, editingLesson]
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
    onClose();
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
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
            {formError}
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">
            Предмет *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Например, Programming language (Java)"
            className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Groups */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">
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
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? `${GROUP_BADGE_STYLES[gid]} ring-1 ring-white/25`
                      : 'border-[#252e42] bg-[#1a2030] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                  <span>{gid}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day + Time */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              День недели
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayOfWeek)}
              className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS_RU[d]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Начало
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Окончание
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Time Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Слоты AIU:</span>
          {TIME_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setStartTime(preset.startTime);
                setEndTime(preset.endTime);
              }}
              className={`rounded-lg border px-2 py-1 text-[11px] transition ${
                startTime === preset.startTime && endTime === preset.endTime
                  ? 'border-blue-500 bg-blue-600/20 text-blue-200'
                  : 'border-[#252e42] bg-[#1a2030] text-slate-300 hover:border-slate-500'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Conflict Detector Box */}
        {conflicts.length > 0 && (
          <div className="rounded-xl border border-amber-500/45 bg-amber-500/10 p-3 text-xs text-amber-100">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Обнаружены накладки по времени ({conflicts.length}):</span>
            </div>
            <ul className="mt-1.5 space-y-1 pl-6 text-amber-200">
              {conflicts.map((c, idx) => (
                <li key={`${c.kind}-${c.entityId}-${c.lessonId}-${idx}`} className="list-disc">
                  {c.kind === 'group' ? 'Группа' : 'Преподаватель'}{' '}
                  <span className="font-semibold">{c.entityName}</span> занята на паре «
                  {c.lessonSubject}» ({c.startTime}–{c.endTime})
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Type + Online */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Тип занятия
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LessonType)}
              className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {LESSON_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LESSON_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[#252e42] bg-[#0b0d12] px-3.5 py-2.5 text-sm text-slate-200 transition hover:border-slate-600">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <span>Онлайн-занятие (Online / Web-based)</span>
            </label>
          </div>
        </div>

        {/* Teachers multi-select */}
        <div className="space-y-2 rounded-xl border border-[#252e42] bg-[#1a2030]/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-300">
              Преподаватели ({teacherIds.length})
            </label>
            <span className="text-[11px] text-slate-400">
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
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-medium text-blue-100">{label}</span>
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
                          className="w-28 rounded border border-[#252e42] bg-[#0b0d12] px-2 py-1 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => toggleTeacher(tid)}
                        aria-label={`Убрать ${label}`}
                        className="rounded p-0.5 text-slate-300 hover:bg-slate-800 hover:text-white"
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
            <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={teacherQuery}
              onChange={(e) => setTeacherQuery(e.target.value)}
              placeholder="Поиск преподавателя..."
              className="w-full rounded-lg border border-[#252e42] bg-[#0b0d12] py-2 pr-3 pl-8 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="max-h-36 overflow-y-auto rounded-lg border border-[#252e42] bg-[#0b0d12] p-1">
            {filteredTeachers.length === 0 ? (
              <div className="p-2 text-center text-xs text-slate-500">
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
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                      selected
                        ? 'bg-blue-600/20 text-blue-200'
                        : 'text-slate-300 hover:bg-[#1a2030]'
                    }`}
                  >
                    <span className="truncate font-medium">
                      {t.name}
                      {t.isCustom && (
                        <span className="ml-1.5 text-[10px] text-emerald-400">
                          (свой)
                        </span>
                      )}
                    </span>
                    <span className="ml-2 shrink-0 text-[11px] text-slate-400">
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Аудитория
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Например, B101, BIGLAB, LAB4(211)"
              className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">
            Заметки / ссылка Google Meet
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Например, Meet: https://meet.google.com/..."
            className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2.5 border-t border-[#252e42] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {editingLesson ? 'Сохранить изменения' : 'Добавить пару'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
