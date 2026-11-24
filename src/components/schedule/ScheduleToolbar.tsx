import { LayoutGroup, m, useReducedMotion } from 'framer-motion';
import {
  Calendar,
  Columns3,
  MapPin,
  Pin,
  Plus,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import type {
  EffectiveTeacher,
  GroupFilter,
  GroupId,
  GroupInfo,
  ScheduleScopeMode,
  ViewMode,
} from '../../types/schedule';
import { getCursorSpring } from '../../utils/p5Motion';
import { GroupSwitcher } from './GroupSwitcher';

interface ScheduleToolbarProps {
  selectedGroup: GroupFilter;
  pinnedGroup: GroupId | null;
  onSelectGroup: (group: GroupFilter) => void;
  onPinGroup: (group: GroupId) => void;
  groups: GroupInfo[];
  teachers: EffectiveTeacher[];
  onOpenTeacher: (teacherId: string) => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onAddLesson: () => void;
  pinnedSubjectsCount: number;
  totalStreamSubjectsCount: number;
  onOpenQuickSetup: () => void;
  scheduleScopeMode?: ScheduleScopeMode;
  focusedTeacherName?: string | null;
  onClearTeacherScope?: () => void;
}

export function ScheduleToolbar({
  selectedGroup,
  pinnedGroup,
  onSelectGroup,
  onPinGroup,
  groups,
  teachers,
  onOpenTeacher,
  viewMode,
  onChangeViewMode,
  onAddLesson,
  pinnedSubjectsCount,
  totalStreamSubjectsCount,
  onOpenQuickSetup,
  scheduleScopeMode = 'group',
  focusedTeacherName = null,
  onClearTeacherScope,
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
      {/* Left: Groups + Quick Pin Controls or Teacher Scope Pill */}
      <div className="flex flex-wrap items-center gap-2">
        <GroupSwitcher
          selectedGroup={selectedGroup}
          pinnedGroup={pinnedGroup}
          onSelectGroup={onSelectGroup}
        />

        {scheduleScopeMode === 'group' &&
          selectedGroup !== 'ALL' &&
          selectedGroup !== pinnedGroup && (
            <m.button
              type="button"
              onClick={() => onPinGroup(selectedGroup)}
              {...tapProps}
              title={`Закрепить ${selectedGroup} как свою группу`}
              className="p5-skew border-2 border-[#050505] bg-[#FFE600] px-2.5 py-1 text-[#050505] shadow-[3px_3px_0_#E60012] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
            >
              <span className="p5-unskew inline-flex items-center gap-1 font-condensed text-xs font-bold uppercase tracking-wider">
                <Pin className="h-3 w-3" />
                <span>Закрепить {selectedGroup}</span>
              </span>
            </m.button>
          )}

        {scheduleScopeMode === 'group' &&
          pinnedGroup &&
          selectedGroup !== pinnedGroup && (
            <m.button
              type="button"
              onClick={() => onSelectGroup(pinnedGroup)}
              {...tapProps}
              title="Вернуться к своей закреплённой группе"
              className="p5-skew border-2 border-white bg-[#060606] px-2.5 py-1 text-[#FFE600] shadow-[3px_3px_0_#050505] transition-colors hover:border-[#FFE600] hover:bg-[#E60012] hover:text-white"
            >
              <span className="p5-unskew inline-flex items-center gap-1 font-condensed text-xs font-bold uppercase tracking-wider">
                <span>★ {pinnedGroup}</span>
              </span>
            </m.button>
          )}

        {scheduleScopeMode === 'teacher' && focusedTeacherName && (
          <div className="p5-skew inline-flex items-center border-2 border-[#050505] bg-[#FFE600] px-2.5 py-1 text-[#050505] shadow-[3px_3px_0_#E60012]">
            <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
              <UserCheck className="h-3.5 w-3.5 text-[#E60012]" />
              <span>УЧИТЕЛЬ: {focusedTeacherName}</span>
              {onClearTeacherScope && (
                <button
                  type="button"
                  onClick={onClearTeacherScope}
                  title="Вернуться к расписанию группы"
                  aria-label="Выйти из режима преподавателя"
                  className="ml-1 inline-flex items-center gap-0.5 bg-[#050505] px-1.5 py-0.5 text-[10px] text-white transition-colors hover:bg-[#E60012]"
                >
                  <X className="h-3 w-3" />
                  <span>К ГРУППЕ</span>
                </button>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Right: Advisor Indicator + View Mode Switcher + Add Lesson CTA */}
      <div className="flex flex-wrap items-center gap-2">
        {scheduleScopeMode === 'group' && activeGroupInfo?.advisor && (
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
            <m.button
              type="button"
              onClick={() => onChangeViewMode('day')}
              {...tapProps}
              className={`relative px-3 py-1.5 transition-colors ${
                viewMode === 'day' ? 'text-[#050505]' : 'text-white'
              }`}
            >
              {viewMode === 'day' ? (
                <m.div
                  layoutId="p5-viewmode-cursor"
                  aria-hidden="true"
                  transition={cursorSpring}
                  className="pointer-events-none absolute inset-0 z-0"
                >
                  <div className="p5-skew h-full w-full -rotate-[1deg] border-2 border-[#050505] bg-white shadow-[4px_4px_0_#050505]" />
                </m.div>
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
            </m.button>

            <m.button
              type="button"
              onClick={() => onChangeViewMode('week')}
              {...tapProps}
              className={`relative px-3 py-1.5 transition-colors ${
                viewMode === 'week' ? 'text-[#050505]' : 'text-white'
              }`}
            >
              {viewMode === 'week' ? (
                <m.div
                  layoutId="p5-viewmode-cursor"
                  aria-hidden="true"
                  transition={cursorSpring}
                  className="pointer-events-none absolute inset-0 z-0"
                >
                  <div className="p5-skew h-full w-full -rotate-[1deg] border-2 border-[#050505] bg-white shadow-[4px_4px_0_#050505]" />
                </m.div>
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
            </m.button>
          </div>
        </LayoutGroup>

        {/* Quick Stream Teachers & My Group CTA */}
        <m.button
          type="button"
          onClick={onOpenQuickSetup}
          {...tapProps}
          title="Выбрать свою группу и преподавателей потоков"
          className={`p5-skew border-2 px-3 py-1.5 shadow-[3px_3px_0_#050505] transition-colors ${
            totalStreamSubjectsCount > 0 &&
            pinnedSubjectsCount < totalStreamSubjectsCount
              ? 'border-[#050505] bg-[#FFE600] text-[#050505] hover:border-white hover:bg-[#E60012] hover:text-white'
              : 'border-white bg-[#060606] text-white hover:border-[#FFE600] hover:text-[#FFE600]'
          }`}
        >
          <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            <span>Мои преп.</span>
            {totalStreamSubjectsCount > 0 && (
              <span
                className={`px-1 py-0.5 font-condensed text-[10px] font-bold leading-none ${
                  pinnedSubjectsCount < totalStreamSubjectsCount
                    ? 'bg-[#050505] text-[#FFE600]'
                    : 'bg-[#E60012] text-white'
                }`}
              >
                {pinnedSubjectsCount}/{totalStreamSubjectsCount}
              </span>
            )}
          </span>
        </m.button>

        {/* Add Lesson CTA */}
        <m.button
          type="button"
          onClick={onAddLesson}
          {...tapProps}
          className="p5-skew border-2 border-[#050505] bg-white px-3.5 py-1.5 text-[#050505] shadow-[4px_4px_0_#050505] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
        >
          <span className="p5-unskew inline-flex items-center justify-center gap-1 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>Пара</span>
          </span>
        </m.button>
      </div>
    </section>
  );
}
