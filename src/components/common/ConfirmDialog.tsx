import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidthClass="max-w-md">
      <div className="space-y-4">
        <div className="p5-shadow-sm flex items-start gap-3 border-2 border-[#FFE600] border-l-[6px] border-l-[#E60012] bg-[#161616] p-3.5 text-sm text-white">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#FFE600]" />
          <p className="leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p5-skew p5-shadow-sm border-2 border-white bg-[#161616] px-4 py-2 text-white transition hover:-translate-y-0.5 hover:border-[#FFE600] hover:text-[#FFE600]"
          >
            <span className="p5-unskew block font-condensed text-sm font-bold uppercase tracking-wider">
              {cancelLabel}
            </span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`p5-skew border-2 px-4 py-2 transition hover:-translate-y-0.5 ${
              danger
                ? 'border-white bg-[#E60012] text-white shadow-[4px_4px_0_#FFE600] hover:bg-white hover:text-[#0D0D0D]'
                : 'border-[#0D0D0D] bg-[#FFE600] text-[#0D0D0D] shadow-[4px_4px_0_#E60012] hover:border-white hover:bg-[#E60012] hover:text-white'
            }`}
          >
            <span className="p5-unskew block font-condensed text-sm font-bold uppercase tracking-wider">
              {confirmLabel}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
