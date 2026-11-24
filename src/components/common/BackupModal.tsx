import { useRef, useState, type ChangeEvent } from 'react';
import { Download, RefreshCw, RotateCcw, Upload } from 'lucide-react';
import type { ScheduleOverlay } from '../../types/schedule';
import { Modal } from './Modal';

interface BackupModalProps {
  open: boolean;
  onClose: () => void;
  overlay: ScheduleOverlay;
  changeCount: number;
  onExport: () => void;
  onImport: (rawText: string) => { ok: true } | { ok: false; error: string };
  onRequestReset: () => void;
  onReloadBase: () => Promise<void>;
}

export function BackupModal({
  open,
  onClose,
  overlay,
  changeCount,
  onExport,
  onImport,
  onRequestReset,
  onReloadBase,
}: BackupModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [reloading, setReloading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = onImport(text);
      if (result.ok) {
        setStatusMessage({
          type: 'success',
          text: `Резервная копия «${file.name}» успешно импортирована.`,
        });
      } else {
        setStatusMessage({ type: 'error', text: result.error });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Ошибка чтения выбранного файла.' });
    } finally {
      e.target.value = '';
    }
  };

  const handleReload = async () => {
    setReloading(true);
    setStatusMessage(null);
    try {
      await onReloadBase();
      setStatusMessage({
        type: 'success',
        text: 'Базовый schedule.json перезагружен; ваши локальные правки сохранены.',
      });
    } finally {
      setReloading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Резервное копирование и сброс"
      subtitle="Локальные правки хранятся отдельно от базового schedule.json (overlay в localStorage)"
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#252e42] bg-[#1a2030]/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-200">
              Активные изменения в overlay
            </span>
            <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
              {changeCount}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div>Добавлено пар: {overlay.addedLessons.length}</div>
            <div>Изменено пар: {Object.keys(overlay.editedLessons).length}</div>
            <div>Скрыто пар: {overlay.deletedLessonIds.length}</div>
            <div>Закреплено подгрупп: {Object.keys(overlay.pinnedSubgroups).length}</div>
            <div>Своих преподавателей: {overlay.customTeachers.length}</div>
            <div>Изменено преподав.: {Object.keys(overlay.editedTeachers).length}</div>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`rounded-lg border px-3.5 py-2.5 text-sm ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-500/35 bg-rose-500/10 text-rose-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <div className="grid gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              onExport();
              setStatusMessage({
                type: 'success',
                text: 'Файл резервной копии JSON скачан.',
              });
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#252e42] bg-[#1a2030] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-blue-500/40 hover:bg-[#222a3f]"
          >
            <Download className="h-4 w-4 text-blue-400" />
            Экспорт JSON
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#252e42] bg-[#1a2030] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-emerald-500/40 hover:bg-[#222a3f]"
          >
            <Upload className="h-4 w-4 text-emerald-400" />
            Импорт JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex flex-col gap-2.5 border-t border-[#252e42] pt-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            disabled={reloading}
            onClick={() => void handleReload()}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reloading ? 'animate-spin' : ''}`} />
            Обновить base schedule.json
          </button>

          <button
            type="button"
            onClick={onRequestReset}
            className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Сбросить к данным из Excel
          </button>
        </div>
      </div>
    </Modal>
  );
}
