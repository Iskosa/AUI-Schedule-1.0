import { useMemo } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { ArrowRight, UserCheck, Users } from 'lucide-react';
import { GROUP_BADGE_STYLES, TARGET_GROUPS } from '../../constants/schedule';
import type {
  EffectiveLesson,
  GroupFilter,
  GroupId,
  GroupInfo,
} from '../../types/schedule';
import { getTapPressProps } from '../../utils/p5Motion';
import { Modal } from '../common/Modal';

interface WelcomeGroupModalProps {
  open: boolean;
  groups: GroupInfo[];
  allLessons: EffectiveLesson[];
  onSelectGroup: (group: GroupFilter) => void;
}

export function WelcomeGroupModal({
  open,
  groups,
  allLessons,
  onSelectGroup,
}: WelcomeGroupModalProps) {
  const reduced = useReducedMotion();
  const tapProps = getTapPressProps(reduced);

  const weeklyCountByGroup = useMemo(() => {
    const counts: Record<GroupId, number> = {
      COMSE26A: 0,
      COMSE26B: 0,
      COMSEH26: 0,
      COMCIF26: 0,
    };
    for (const ls of allLessons) {
      for (const gid of ls.groupIds) {
        if (gid in counts) {
          counts[gid] += 1;
        }
      }
    }
    return counts;
  }, [allLessons]);

  return (
    <Modal
      open={open}
      onClose={() => onSelectGroup('ALL')}
      title="Выбери свою группу"
      subtitle="Потом можно переключить в любой момент"
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TARGET_GROUPS.map((gid) => {
            const info = groups.find((g) => g.id === gid);
            return (
              <m.button
                key={gid}
                type="button"
                onClick={() => onSelectGroup(gid)}
                {...tapProps}
                className="group relative flex flex-col justify-between gap-2.5 border-2 border-white bg-[#050505] p-3.5 text-left shadow-[4px_4px_0_#E60012] transition-colors hover:border-[#FFE600] hover:bg-[#141414]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 font-display text-base uppercase leading-none tracking-wider ${GROUP_BADGE_STYLES[gid]}`}
                  >
                    {gid}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#FFE600] transition-transform group-hover:translate-x-0.5" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  {info?.advisor && (
                    <span className="inline-flex min-w-0 items-center gap-1 font-condensed font-bold text-neutral-200">
                      <UserCheck className="h-3.5 w-3.5 shrink-0 text-[#E60012]" />
                      <span className="truncate">{info.advisor}</span>
                    </span>
                  )}
                  <span className="font-condensed text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {weeklyCountByGroup[gid]} пар/нед
                  </span>
                </div>
              </m.button>
            );
          })}
        </div>

        <div className="flex justify-center border-t border-white/15 pt-3">
          <button
            type="button"
            onClick={() => onSelectGroup('ALL')}
            className="inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider text-neutral-300 underline decoration-white/40 underline-offset-4 transition-colors hover:text-[#FFE600] hover:decoration-[#FFE600]"
          >
            <Users className="h-3.5 w-3.5 text-[#E60012]" />
            <span>Показать все 4 группы</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
