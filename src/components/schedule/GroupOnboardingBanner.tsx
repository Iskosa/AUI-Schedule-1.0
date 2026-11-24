import { m, useReducedMotion } from 'framer-motion';
import { ArrowRight, Pin, Sparkles, UserCheck, X } from 'lucide-react';
import { GROUP_BADGE_STYLES, TARGET_GROUPS } from '../../constants/schedule';
import type { GroupId, GroupInfo } from '../../types/schedule';
import { getTapPressProps } from '../../utils/p5Motion';

interface GroupOnboardingBannerProps {
  groups: GroupInfo[];
  pinnedGroup: GroupId | null;
  pinnedSubjectsCount: number;
  totalStreamSubjectsCount: number;
  onPinGroup: (group: GroupId) => void;
  onOpenQuickSetup: () => void;
  onDismiss: () => void;
}

export function GroupOnboardingBanner({
  groups,
  pinnedGroup,
  pinnedSubjectsCount,
  totalStreamSubjectsCount,
  onPinGroup,
  onOpenQuickSetup,
  onDismiss,
}: GroupOnboardingBannerProps) {
  const reduced = useReducedMotion();
  const tapProps = getTapPressProps(reduced);

  if (!pinnedGroup) {
    return (
      <section
        aria-label="Выбор и закрепление группы"
        className="border-2 border-[#FFE600] border-l-[6px] border-l-[#E60012] bg-[#060606] p-3 shadow-[5px_5px_0_#050505] sm:p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-2 font-display text-sm uppercase tracking-wider text-white sm:text-base">
              <span className="text-[#FFE600]" aria-hidden="true">
                ★
              </span>
              <span>ВЫБЕРИ И ЗАКРЕПИ СВОЮ ГРУППУ</span>
            </h2>
            <p className="mt-0.5 text-xs text-neutral-300">
              Расписание будет сразу открываться на вашей группе
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Скрыть подсказку"
            title="Скрыть"
            className="shrink-0 border border-white/40 bg-[#050505] p-1 text-neutral-300 transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TARGET_GROUPS.map((gid) => {
            const info = groups.find((g) => g.id === gid);
            return (
              <m.button
                key={gid}
                type="button"
                onClick={() => onPinGroup(gid)}
                {...tapProps}
                className="group flex flex-col justify-between gap-1.5 border-2 border-white bg-[#050505] p-2.5 text-left shadow-[3px_3px_0_#E60012] transition-colors hover:border-[#FFE600] hover:bg-[#141414]"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider ${GROUP_BADGE_STYLES[gid]}`}
                  >
                    {gid}
                  </span>
                  <Pin className="h-3.5 w-3.5 shrink-0 text-[#FFE600]" />
                </div>

                {info?.advisor && (
                  <div className="inline-flex min-w-0 items-center gap-1 font-condensed text-[11px] font-bold text-neutral-300">
                    <UserCheck className="h-3 w-3 shrink-0 text-[#E60012]" />
                    <span className="truncate">{info.advisor}</span>
                  </div>
                )}

                <span className="font-condensed text-[11px] font-bold uppercase tracking-wider text-[#FFE600] group-hover:text-white">
                  Закрепить →
                </span>
              </m.button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Настройка преподавателей по потокам"
      className="flex flex-wrap items-center justify-between gap-2.5 border-2 border-[#FFE600] border-l-[6px] border-l-[#E60012] bg-[#060606] px-3.5 py-2.5 shadow-[4px_4px_0_#050505]"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="border-2 border-[#050505] bg-[#FFE600] px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#050505]">
          ★ {pinnedGroup}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#FFE600]" />
          <span>
            Теперь закрепи своих преподавателей по потокам (
            <strong className="text-[#FFE600]">
              {pinnedSubjectsCount}/{totalStreamSubjectsCount}
            </strong>
            )
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <m.button
          type="button"
          onClick={onOpenQuickSetup}
          {...tapProps}
          className="p5-skew border-2 border-[#050505] bg-[#FFE600] px-3 py-1 text-[#050505] shadow-[3px_3px_0_#E60012] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
        >
          <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
            <span>Выбрать преподавателей</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </m.button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Скрыть подсказку"
          title="Скрыть"
          className="border border-white/40 bg-[#050505] p-1 text-neutral-300 transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
