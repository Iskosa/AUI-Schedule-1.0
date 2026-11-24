import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { MapPin, UserCheck, Users } from 'lucide-react';
import { TARGET_GROUPS } from '../../constants/schedule';
import type {
  EffectiveTeacher,
  GroupFilter,
  GroupInfo,
} from '../../types/schedule';
import { getCursorSpring } from '../../utils/p5Motion';

interface GroupSwitcherProps {
  selectedGroup: GroupFilter;
  onSelectGroup: (group: GroupFilter) => void;
  groups: GroupInfo[];
  teachers: EffectiveTeacher[];
  onOpenTeacher: (teacherId: string) => void;
}

export function GroupSwitcher({
  selectedGroup,
  onSelectGroup,
  groups,
  teachers,
  onOpenTeacher,
}: GroupSwitcherProps) {
  const reduced = useReducedMotion();
  const cursorSpring = getCursorSpring(reduced);
  const tapProps = reduced
    ? {}
    : {
        whileTap: { x: 2, y: 2 },
        transition: { type: 'spring' as const, stiffness: 800, damping: 30 },
      };

  const activeGroupInfo =
    selectedGroup === 'ALL'
      ? null
      : groups.find((g) => g.id === selectedGroup) ?? null;

  const advisorTeacher = activeGroupInfo?.advisor
    ? teachers.find(
        (t) =>
          t.name.trim().toLowerCase() ===
          activeGroupInfo.advisor?.trim().toLowerCase()
      )
    : null;

  return (
    <section
      aria-label="Выбор группы"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
    >
      <LayoutGroup id="p5-groups">
        <div className="flex flex-wrap items-center gap-2">
          {TARGET_GROUPS.map((gid) => {
            const active = selectedGroup === gid;
            return (
              <motion.button
                key={gid}
                type="button"
                onClick={() => onSelectGroup(gid)}
                {...tapProps}
                className={`relative px-3 py-1.5 transition-colors ${
                  active ? 'text-white' : 'text-neutral-300 hover:text-white'
                }`}
              >
                {active ? (
                  <motion.div
                    layoutId="p5-group-cursor"
                    aria-hidden="true"
                    transition={cursorSpring}
                    className="pointer-events-none absolute inset-0 z-0"
                  >
                    <div className="p5-skew h-full w-full -rotate-[1.2deg] border border-white bg-[#E60012] shadow-[3px_3px_0_#000000]" />
                  </motion.div>
                ) : (
                  <div
                    aria-hidden="true"
                    className="p5-skew pointer-events-none absolute inset-0 z-0 border border-white/20 bg-[#141414]/80 transition-colors hover:border-white/60"
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
            className={`relative px-3 py-1.5 transition-colors ${
              selectedGroup === 'ALL'
                ? 'text-white'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            {selectedGroup === 'ALL' ? (
              <motion.div
                layoutId="p5-group-cursor"
                aria-hidden="true"
                transition={cursorSpring}
                className="pointer-events-none absolute inset-0 z-0"
              >
                <div className="p5-skew h-full w-full -rotate-[1.2deg] border border-white bg-[#E60012] shadow-[3px_3px_0_#000000]" />
              </motion.div>
            ) : (
              <div
                aria-hidden="true"
                className="p5-skew pointer-events-none absolute inset-0 z-0 border border-white/20 bg-[#141414]/80"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
              <Users className="h-3.5 w-3.5" />
              <span>Все 4 группы</span>
            </span>
          </motion.button>
        </div>
      </LayoutGroup>

      {activeGroupInfo && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
          <span className="font-condensed font-semibold uppercase tracking-wide text-neutral-300">
            {activeGroupInfo.weeklyHours} ч/нед
          </span>
          {activeGroupInfo.advisor && (
            <span className="flex flex-wrap items-center gap-1">
              <span aria-hidden="true" className="text-white/25">
                ·
              </span>
              <UserCheck className="h-3.5 w-3.5 text-[#FFE600]" />
              <span>Эдвайзер:</span>
              {advisorTeacher ? (
                <button
                  type="button"
                  onClick={() => onOpenTeacher(advisorTeacher.id)}
                  className="font-semibold text-[#FFE600] underline decoration-[#E60012] decoration-2 underline-offset-4 transition hover:text-white"
                >
                  {activeGroupInfo.advisor}
                </button>
              ) : (
                <span className="font-semibold text-white">
                  {activeGroupInfo.advisor}
                </span>
              )}
              {activeGroupInfo.advisorRoom && (
                <span className="inline-flex items-center gap-0.5 text-neutral-400">
                  (<MapPin className="h-3 w-3 text-[#E60012]" />
                  {activeGroupInfo.advisorRoom})
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
