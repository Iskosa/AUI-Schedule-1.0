import { useRef, useState, type ChangeEvent } from 'react';
import { Download, RefreshCw, RotateCcw, Upload } from 'lucide-react';
import type { ScheduleOverlay } from '../../types/schedule';
import { playConfirm } from '../../utils/p5Sound';
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
        playConfirm();
        setStatusMessage({
          type: 'success',
          text: `Резервная копия «${file.name}» успешно импортирована.`,
        });
      } else {
        setStatusMessage({ type: 'error', text: result.error });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Ошибка чтения выбранного файла.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleReload = async () => {
    setReloading(true);
    setStatusMessage(null);
    try {
      await onReloadBase();
      playConfirm();
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
        <div className="p5-shadow-sm border-2 border-white bg-[#161616] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-condensed text-sm font-bold uppercase tracking-wider text-white">
              Активные изменения в overlay
            </span>
            <span className="border-2 border-[#0D0D0D] bg-[#FFE600] px-2.5 py-0.5 font-condensed text-xs font-bold text-[#0D0D0D]">
              {changeCount}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/20 pt-3 text-xs text-neutral-300">
            <div>Добавлено пар: {overlay.addedLessons.length}</div>
            <div>Изменено пар: {Object.keys(overlay.editedLessons).length}</div>
            <div>Скрыто пар: {overlay.deletedLessonIds.length}</div>
            <div>
              Закреплено подгрупп: {Object.keys(overlay.pinnedSubgroups).length}
            </div>
            <div>Своих преподавателей: {overlay.customTeachers.length}</div>
            <div>
              Изменено преподав.: {Object.keys(overlay.editedTeachers).length}
            </div>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p5-shadow-sm border-2 px-3.5 py-2.5 text-sm font-semibold ${
              statusMessage.type === 'success'
                ? 'border-[#FFE600] bg-[#161616] text-[#FFE600]'
                : 'border-white bg-[#E60012] text-white'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              onExport();
              playConfirm();
              setStatusMessage({
                type: 'success',
                text: 'Файл резервной копии JSON скачан.',
              });
            }}
            className="p5-skew p5-shadow-sm border-2 border-[#0D0D0D] bg-[#FFE600] px-4 py-2.5 text-[#0D0D0D] transition hover:-translate-y-0.5 hover:border-white hover:bg-[#E60012] hover:text-white"
          >
            <span className="p5-unskew flex items-center justify-center gap-2 font-condensed text-sm font-bold uppercase tracking-wider">
              <Download className="h-4 w-4" />
              <span>Экспорт JSON</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p5-skew p5-shadow-sm border-2 border-white bg-[#161616] px-4 py-2.5 text-white transition hover:-translate-y-0.5 hover:border-[#FFE600] hover:text-[#FFE600]"
          >
            <span className="p5-unskew flex items-center justify-center gap-2 font-condensed text-sm font-bold uppercase tracking-wider">
              <Upload className="h-4 w-4 text-[#FFE600]" />
              <span>Импорт JSON</span>
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex flex-col gap-2.5 border-t-2 border-white/20 pt-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            disabled={reloading}
            onClick={() => void handleReload()}
            className="p5-skew p5-shadow-sm border-2 border-white bg-[#161616] px-3.5 py-2 text-white transition hover:-translate-y-0.5 hover:border-[#FFE600] hover:text-[#FFE600] disabled:opacity-50"
          >
            <span className="p5-unskew flex items-center justify-center gap-2 font-condensed text-xs font-bold uppercase tracking-wider">
              <RefreshCw
                className={`h-3.5 w-3.5 ${reloading ? 'animate-spin' : ''}`}
              />
              <span>Обновить base schedule.json</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onRequestReset}
            className="p5-skew p5-shadow-sm border-2 border-white bg-[#E60012] px-3.5 py-2 text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-[#0D0D0D]"
          >
            <span className="p5-unskew flex items-center justify-center gap-2 font-condensed text-xs font-bold uppercase tracking-wider">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Сбросить к данным из Excel</span>
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
