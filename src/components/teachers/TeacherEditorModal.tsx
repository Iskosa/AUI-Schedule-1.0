import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DAY_LABELS_RU, DAYS } from '../../constants/schedule';
import type { TeacherDraftInput } from '../../hooks/useScheduleStore';
import type {
  DayOfWeek,
  EffectiveTeacher,
  OfficeHour,
} from '../../types/schedule';
import { Modal } from '../common/Modal';

interface TeacherEditorModalProps {
  open: boolean;
  editingTeacher: EffectiveTeacher | null;
  onClose: () => void;
  onSave: (
    draft: TeacherDraftInput,
    editingTeacher: EffectiveTeacher | null
  ) => void;
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

  const updateOfficeHour = (idx: number, patch: Partial<OfficeHour>) => {
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
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        editingTeacher
          ? 'Редактировать преподавателя'
          : 'Добавить преподавателя'
      }
      subtitle="Данные сохраняются в локальном overlay"
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p5-shadow-sm border-2 border-white bg-[#E60012] px-3.5 py-2.5 text-sm font-bold text-white">
            {formError}
          </div>
        )}

        <div>
          <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
            ФИО преподавателя *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Aibek Testov"
            className="p5-input w-full px-3.5 py-2.5 text-sm placeholder-neutral-500"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
              Предметы (через запятую)
            </label>
            <input
              type="text"
              value={coursesText}
              onChange={(e) => setCoursesText(e.target.value)}
              placeholder="Algorithms, Calculus I"
              className="p5-input w-full px-3.5 py-2.5 text-sm placeholder-neutral-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
              Кабинет
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Например, B207"
              className="p5-input w-full px-3.5 py-2.5 text-sm placeholder-neutral-500"
            />
          </div>
        </div>

        {/* Office Hours */}
        <div className="space-y-2.5 border-2 border-white/70 bg-[#161616] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
              Office Hours ({officeHours.length})
            </label>
            <button
              type="button"
              onClick={addOfficeHourSlot}
              className="p5-skew p5-shadow-sm border-2 border-[#0D0D0D] bg-[#FFE600] px-2.5 py-1 text-[#0D0D0D] transition hover:border-white hover:bg-[#E60012] hover:text-white"
            >
              <span className="p5-unskew inline-flex items-center gap-1 font-condensed text-xs font-bold uppercase tracking-wider">
                <Plus className="h-3.5 w-3.5" />
                <span>Добавить слот</span>
              </span>
            </button>
          </div>

          {officeHours.length === 0 ? (
            <p className="text-xs text-neutral-400">
              Слоты Office Hours не добавлены.
            </p>
          ) : (
            <div className="space-y-2">
              {officeHours.map((oh, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 border-2 border-white/40 bg-[#0D0D0D] p-2.5 sm:grid-cols-12 sm:items-center"
                >
                  <select
                    value={oh.day}
                    onChange={(e) =>
                      updateOfficeHour(idx, {
                        day: e.target.value as DayOfWeek,
                      })
                    }
                    className="p5-input px-2 py-1.5 text-xs sm:col-span-4"
                  >
                    {DAYS.map((d) => (
                      <option
                        key={d}
                        value={d}
                        className="bg-[#0D0D0D] text-white"
                      >
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
                    className="p5-input px-2 py-1.5 text-xs [color-scheme:dark] sm:col-span-2"
                  />

                  <input
                    type="time"
                    value={oh.endTime}
                    onChange={(e) =>
                      updateOfficeHour(idx, { endTime: e.target.value })
                    }
                    className="p5-input px-2 py-1.5 text-xs [color-scheme:dark] sm:col-span-2"
                  />

                  <input
                    type="text"
                    value={oh.room ?? ''}
                    onChange={(e) =>
                      updateOfficeHour(idx, { room: e.target.value || null })
                    }
                    placeholder="Каб."
                    className="p5-input px-2 py-1.5 text-xs placeholder-neutral-500 sm:col-span-3"
                  />

                  <button
                    type="button"
                    onClick={() => removeOfficeHour(idx)}
                    aria-label="Удалить слот Office Hours"
                    className="flex items-center justify-center border border-white/40 bg-[#161616] p-1.5 text-white transition hover:bg-[#E60012] sm:col-span-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
            Заметки
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Контакты, ссылки или примечания..."
            className="p5-input w-full px-3.5 py-2 text-sm placeholder-neutral-500"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t-2 border-white/20 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="p5-skew p5-shadow-sm border-2 border-white bg-[#161616] px-4 py-2 text-white transition hover:-translate-y-0.5 hover:border-[#FFE600] hover:text-[#FFE600]"
          >
            <span className="p5-unskew block font-condensed text-sm font-bold uppercase tracking-wider">
              Отмена
            </span>
          </button>
          <button
            type="submit"
            className="p5-skew border-2 border-[#0D0D0D] bg-[#FFE600] px-5 py-2 text-[#0D0D0D] shadow-[4px_4px_0_#E60012] transition hover:-translate-y-0.5 hover:border-white hover:bg-[#E60012] hover:text-white"
          >
            <span className="p5-unskew block font-condensed text-sm font-bold uppercase tracking-wider">
              {editingTeacher ? 'Сохранить' : 'Добавить'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
