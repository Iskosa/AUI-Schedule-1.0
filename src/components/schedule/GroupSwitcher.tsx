import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Users } from 'lucide-react';
import { TARGET_GROUPS } from '../../constants/schedule';
import type { GroupFilter } from '../../types/schedule';
import { getCursorSpring } from '../../utils/p5Motion';

interface GroupSwitcherProps {
  selectedGroup: GroupFilter;
  onSelectGroup: (group: GroupFilter) => void;
}

export function GroupSwitcher({
  selectedGroup,
  onSelectGroup,
}: GroupSwitcherProps) {
  const reduced = useReducedMotion();
  const cursorSpring = getCursorSpring(reduced);
  const tapProps = reduced
    ? {}
    : {
        whileTap: { x: 2, y: 2 },
        transition: { type: 'spring' as const, stiffness: 800, damping: 30 },
      };

  return (
    <LayoutGroup id="p5-groups">
      <div
        role="group"
        aria-label="Выбор группы"
        className="flex flex-wrap items-center gap-1.5 sm:gap-2"
      >
        {TARGET_GROUPS.map((gid) => {
          const active = selectedGroup === gid;
          return (
            <motion.button
              key={gid}
              type="button"
              onClick={() => onSelectGroup(gid)}
              {...tapProps}
              className="relative px-3 py-1.5 text-white transition-colors"
            >
              {active ? (
                <motion.div
                  layoutId="p5-group-cursor"
                  aria-hidden="true"
                  transition={cursorSpring}
                  className="pointer-events-none absolute inset-0 z-0"
                >
                  <div className="p5-skew h-full w-full -rotate-[1.2deg] border-2 border-white bg-[#E60012] shadow-[4px_4px_0_#050505]" />
                </motion.div>
              ) : (
                <div
                  aria-hidden="true"
                  className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white bg-[#060606] shadow-[3px_3px_0_#050505] transition-colors hover:border-[#E60012]"
                />
              )}
              <span className="relative z-10 inline-flex items-center font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                {gid}
              </span>
            </motion.button>
          );
        })}

        <motion.button
          type="button"
          onClick={() => onSelectGroup('ALL')}
          {...tapProps}
          className="relative px-3 py-1.5 text-white transition-colors"
        >
          {selectedGroup === 'ALL' ? (
            <motion.div
              layoutId="p5-group-cursor"
              aria-hidden="true"
              transition={cursorSpring}
              className="pointer-events-none absolute inset-0 z-0"
            >
              <div className="p5-skew h-full w-full -rotate-[1.2deg] border-2 border-white bg-[#E60012] shadow-[4px_4px_0_#050505]" />
            </motion.div>
          ) : (
            <div
              aria-hidden="true"
              className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white bg-[#060606] shadow-[3px_3px_0_#050505]"
            />
          )}
          <span className="relative z-10 inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            <span>ВСЕ</span>
          </span>
        </motion.button>
      </div>
    </LayoutGroup>
  );
}
