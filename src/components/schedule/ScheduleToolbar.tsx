import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Calendar, Columns3, MapPin, Plus, UserCheck } from 'lucide-react';
import type {
  EffectiveTeacher,
  GroupFilter,
  GroupInfo,
  ViewMode,
} from '../../types/schedule';
import { getCursorSpring } from '../../utils/p5Motion';
import { GroupSwitcher } from './GroupSwitcher';

interface ScheduleToolbarProps {
  selectedGroup: GroupFilter;
  onSelectGroup: (group: GroupFilter) => void;
  groups: GroupInfo[];
  teachers: EffectiveTeacher[];
  onOpenTeacher: (teacherId: string) => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onAddLesson: () => void;
}

export function ScheduleToolbar({
  selectedGroup,
  onSelectGroup,
  groups,
  teachers,
  onOpenTeacher,
  viewMode,
  onChangeViewMode,
  onAddLesson,
}: ScheduleToolbarProps) {
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
      aria-label="Панель управления расписанием"
      className="flex flex-wrap items-center justify-between gap-2.5"
    >
      {/* Left: Groups */}
      <GroupSwitcher
        selectedGroup={selectedGroup}
        onSelectGroup={onSelectGroup}
      />

      {/* Right: Advisor Indicator + View Mode Switcher + Add Lesson CTA */}
      <div className="flex flex-wrap items-center gap-2">
        {activeGroupInfo?.advisor && (
          <div className="p5-skew border-2 border-white bg-[#060606] px-2.5 py-1 shadow-[3px_3px_0_#050505]">
            <div className="p5-unskew flex items-center gap-1.5 text-xs">
              <UserCheck className="h-3.5 w-3.5 shrink-0 text-[#E60012]" />
              {advisorTeacher ? (
                <button
                  type="button"
                  onClick={() => onOpenTeacher(advisorTeacher.id)}
                  title={`Эдвайзер группы ${activeGroupInfo.id}`}
                  className="font-condensed font-bold tracking-wide text-white underline decoration-[#E60012] decoration-2 underline-offset-4 transition-colors hover:text-[#FFE600]"
                >
                  {activeGroupInfo.advisor}
                </button>
              ) : (
                <span className="font-condensed font-bold tracking-wide text-white">
                  {activeGroupInfo.advisor}
                </span>
              )}
              {activeGroupInfo.advisorRoom && (
                <span className="inline-flex items-center gap-0.5 font-condensed text-[11px] font-bold uppercase text-neutral-300">
                  <MapPin className="h-3 w-3 text-[#E60012]" />
                  {activeGroupInfo.advisorRoom}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Day / Week View Mode Switcher */}
        <LayoutGroup id="p5-viewmode">
          <div
            role="group"
            aria-label="Режим отображения расписания"
            className="inline-flex items-center gap-1.5"
          >
            <motion.button
              type="button"
              onClick={() => onChangeViewMode('day')}
              {...tapProps}
              className={`relative px-3 py-1.5 transition-colors ${
                viewMode === 'day' ? 'text-[#050505]' : 'text-white'
              }`}
            >
              {viewMode === 'day' ? (
                <motion.div
                  layoutId="p5-viewmode-cursor"
                  aria-hidden="true"
                  transition={cursorSpring}
                  className="pointer-events-none absolute inset-0 z-0"
                >
                  <div className="p5-skew h-full w-full -rotate-[1deg] border-2 border-[#050505] bg-white shadow-[4px_4px_0_#050505]" />
                </motion.div>
              ) : (
                <div
                  aria-hidden="true"
                  className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white bg-[#060606] shadow-[3px_3px_0_#050505]"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                <Calendar className="h-3.5 w-3.5" />
                <span>День</span>
              </span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onChangeViewMode('week')}
              {...tapProps}
              className={`relative px-3 py-1.5 transition-colors ${
                viewMode === 'week' ? 'text-[#050505]' : 'text-white'
              }`}
            >
              {viewMode === 'week' ? (
                <motion.div
                  layoutId="p5-viewmode-cursor"
                  aria-hidden="true"
                  transition={cursorSpring}
                  className="pointer-events-none absolute inset-0 z-0"
                >
                  <div className="p5-skew h-full w-full -rotate-[1deg] border-2 border-[#050505] bg-white shadow-[4px_4px_0_#050505]" />
                </motion.div>
              ) : (
                <div
                  aria-hidden="true"
                  className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white bg-[#060606] shadow-[3px_3px_0_#050505]"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                <Columns3 className="h-3.5 w-3.5" />
                <span>Неделя</span>
              </span>
            </motion.button>
          </div>
        </LayoutGroup>

        {/* Add Lesson CTA */}
        <motion.button
          type="button"
          onClick={onAddLesson}
          {...tapProps}
          className="p5-skew border-2 border-[#050505] bg-white px-3.5 py-1.5 text-[#050505] shadow-[4px_4px_0_#050505] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
        >
          <span className="p5-unskew inline-flex items-center justify-center gap-1 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>Пара</span>
          </span>
        </motion.button>
      </div>
    </section>
  );
}
