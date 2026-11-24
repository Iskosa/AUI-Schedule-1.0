import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DAY_LABELS_RU, DAYS } from '../../constants/schedule';
import type { TeacherDraftInput } from '../../hooks/useScheduleStore';
import type { DayOfWeek, EffectiveTeacher, OfficeHour } from '../../types/schedule';
import { Modal } from '../common/Modal';

interface TeacherEditorModalProps {
  open: boolean;
  editingTeacher: EffectiveTeacher | null;
  onClose: () => void;
  onSave: (draft: TeacherDraftInput, editingTeacher: EffectiveTeacher | null) => void;
}

export function TeacherEditorModal({
  open,
  editingTeacher,
  onClose,
  onSave,
}: TeacherEditorModalProps) {
  const [name, setName] = useState('');
  const [coursesText, setCoursesText] = useState('');
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');
  const [officeHours, setOfficeHours] = useState<OfficeHour[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (editingTeacher) {
      setName(editingTeacher.name);
      setCoursesText(editingTeacher.courses.join(', '));
      setRoom(editingTeacher.room ?? '');
      setNotes(editingTeacher.notes ?? '');
      setOfficeHours(editingTeacher.officeHours.map((oh) => ({ ...oh })));
    } else {
      setName('');
      setCoursesText('');
      setRoom('');
      setNotes('');
      setOfficeHours([]);
    }
  }, [open, editingTeacher]);

  const addOfficeHourSlot = () => {
    setOfficeHours((prev) => [
      ...prev,
      {
        day: 'FRIDAY',
        startTime: '14:00',
        endTime: '15:25',
        room: room.trim() || null,
      },
    ]);
  };

  const updateOfficeHour = (
    idx: number,
    patch: Partial<OfficeHour>
  ) => {
    setOfficeHours((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const removeOfficeHour = (idx: number) => {
    setOfficeHours((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Укажите ФИО преподавателя.');
      return;
    }

    const courses = coursesText
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const cleanOfficeHours = officeHours
      .filter((oh) => oh.startTime && oh.endTime)
      .map((oh) => ({
        day: oh.day,
        startTime: oh.startTime,
        endTime: oh.endTime,
        room: oh.room?.trim() || null,
      }));

    onSave(
      {
        name: name.trim(),
        courses,
        officeHours: cleanOfficeHours,
        room: room.trim() || null,
        notes: notes.trim() || null,
      },
      editingTeacher
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTeacher ? 'Редактировать преподавателя' : 'Добавить преподавателя'}
      subtitle="Данные сохраняются в локальном overlay"
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
            {formError}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">
            ФИО преподавателя *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Aibek Testov"
            className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Предметы (через запятую)
            </label>
            <input
              type="text"
              value={coursesText}
              onChange={(e) => setCoursesText(e.target.value)}
              placeholder="Algorithms, Calculus I"
              className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Кабинет
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Например, B207"
              className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Office Hours */}
        <div className="space-y-2 rounded-xl border border-[#252e42] bg-[#1a2030]/40 p-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Office Hours ({officeHours.length})
            </label>
            <button
              type="button"
              onClick={addOfficeHourSlot}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/25"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить слот
            </button>
          </div>

          {officeHours.length === 0 ? (
            <p className="text-xs text-slate-500">
              Слоты Office Hours не добавлены.
            </p>
          ) : (
            <div className="space-y-2">
              {officeHours.map((oh, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-[#252e42] bg-[#0b0d12] p-2.5 sm:grid-cols-12 sm:items-center"
                >
                  <select
                    value={oh.day}
                    onChange={(e) =>
                      updateOfficeHour(idx, { day: e.target.value as DayOfWeek })
                    }
                    className="rounded-lg border border-[#252e42] bg-[#121620] px-2 py-1.5 text-xs text-white sm:col-span-4"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {DAY_LABELS_RU[d]}
                      </option>
                    ))}
                  </select>

                  <input
                    type="time"
                    value={oh.startTime}
                    onChange={(e) =>
                      updateOfficeHour(idx, { startTime: e.target.value })
                    }
                    className="rounded-lg border border-[#252e42] bg-[#121620] px-2 py-1.5 text-xs text-white sm:col-span-2"
                  />

                  <input
                    type="time"
                    value={oh.endTime}
                    onChange={(e) =>
                      updateOfficeHour(idx, { endTime: e.target.value })
                    }
                    className="rounded-lg border border-[#252e42] bg-[#121620] px-2 py-1.5 text-xs text-white sm:col-span-2"
                  />

                  <input
                    type="text"
                    value={oh.room ?? ''}
                    onChange={(e) =>
                      updateOfficeHour(idx, { room: e.target.value || null })
                    }
                    placeholder="Каб."
                    className="rounded-lg border border-[#252e42] bg-[#121620] px-2 py-1.5 text-xs text-white placeholder-slate-500 sm:col-span-3"
                  />

                  <button
                    type="button"
                    onClick={() => removeOfficeHour(idx)}
                    aria-label="Удалить слот Office Hours"
                    className="flex items-center justify-center rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/15 sm:col-span-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">
            Заметки
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Контакты, ссылки или примечания..."
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
            {editingTeacher ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
