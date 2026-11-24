import { Fragment, useEffect, type ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  getModalMotionProps,
  getModalTitleMotionProps,
  getTapPressProps,
} from '../../utils/p5Motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: ReactNode;
}

function renderDialogueTitle(title: string): ReactNode {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return title;

  return words.map((word, wordIdx) => {
    const chars = Array.from(word);
    const first = chars[0] ?? '';
    const rest = chars.slice(1).join('');
    const highlightFirst = wordIdx === 0;
    const highlightSecond = wordIdx === 1;

    return (
      <Fragment key={`${word}-${wordIdx}`}>
        {wordIdx > 0 && ' '}
        <span className="inline-block whitespace-nowrap">
          {highlightFirst ? (
            <span className="mr-0.5 inline-block -rotate-3 bg-[#E60012] px-1 text-white">
              {first}
            </span>
          ) : highlightSecond ? (
            <span className="mr-0.5 inline-block rotate-2 bg-[#0B0B0B] px-1 text-[#FFE600]">
              {first}
            </span>
          ) : (
            first
          )}
          {rest}
        </span>
      </Fragment>
    );
  });
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-2xl',
  children,
}: ModalProps) {
  const reduced = useReducedMotion();
  const modalMotion = getModalMotionProps(reduced);
  const modalTitleMotion = getModalTitleMotionProps(reduced);
  const tapProps = getTapPressProps(reduced);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B0B]/85 p-3 sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.08 : 0.14 }}
          onClick={onClose}
        >
          <div
            aria-hidden="true"
            className="p5-halftone-red pointer-events-none absolute inset-0 opacity-45"
          />

          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            {...modalMotion}
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 flex max-h-[88vh] w-full flex-col ${maxWidthClass}`}
          >
            {/* Protruding Nameplate (slams in 60ms after box) + Close Button */}
            <div className="pointer-events-none relative z-20 -mb-4 flex items-start justify-between gap-2 px-1.5 sm:-mb-5 sm:px-3">
              <m.div
                {...modalTitleMotion}
                className={`pointer-events-auto min-w-0 max-w-full border-[3px] border-[#0B0B0B] bg-white px-3 py-1.5 text-[#0B0B0B] shadow-[4px_4px_0_#E60012] sm:px-4 sm:py-2 ${
                  reduced ? '-rotate-2' : ''
                }`}
              >
                <h2 className="break-words font-display text-xs uppercase leading-snug tracking-wide sm:text-base">
                  {renderDialogueTitle(title)}
                </h2>
              </m.div>

              <m.button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                {...tapProps}
                className="pointer-events-auto p5-skew shrink-0 border-[3px] border-white bg-[#E60012] p-1.5 text-white shadow-[3px_3px_0_#0B0B0B] transition-colors hover:bg-white hover:text-[#0B0B0B]"
              >
                <X className="p5-unskew h-4 w-4 sm:h-5 sm:w-5" />
              </m.button>
            </div>

            {/* Clipped Dialogue Box */}
            <div className="p5-drop-shadow-red flex min-h-0 flex-1 flex-col">
              <div className="p5-clip-modal flex min-h-0 flex-1 flex-col bg-white p-[3px]">
                <div className="p5-clip-modal flex min-h-0 flex-1 flex-col bg-[#0B0B0B] text-white">
                  {subtitle ? (
                    <div className="shrink-0 border-b border-white/15 bg-[#141414] px-4 pt-6 pb-2.5 sm:px-5 sm:pt-7">
                      <p className="break-words font-condensed text-xs font-bold uppercase tracking-wider text-[#FFE600]">
                        {subtitle}
                      </p>
                    </div>
                  ) : (
                    <div className="h-6 shrink-0 sm:h-7" aria-hidden="true" />
                  )}

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6 sm:px-5 sm:pt-5 sm:pb-7">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
