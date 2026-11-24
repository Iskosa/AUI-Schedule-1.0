import { MapPin, UserCheck, Users } from 'lucide-react';
import { GROUP_LABELS, TARGET_GROUPS } from '../../constants/schedule';
import type { EffectiveTeacher, GroupFilter, GroupInfo } from '../../types/schedule';

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
  const activeGroupInfo =
    selectedGroup === 'ALL'
      ? null
      : groups.find((g) => g.id === selectedGroup) ?? null;

  const advisorTeacher = activeGroupInfo?.advisor
    ? teachers.find(
        (t) => t.name.trim().toLowerCase() === activeGroupInfo.advisor?.trim().toLowerCase()
      )
    : null;

  return (
    <section
      aria-label="Выбор группы"
      className="p5-shadow p5-halftone space-y-3 border-2 border-white border-l-[6px] border-l-[#E60012] bg-[#161616] p-3.5 sm:p-4"
    >
      <div className="flex flex-wrap items-center gap-2.5 px-0.5">
        {TARGET_GROUPS.map((gid) => {
          const active = selectedGroup === gid;
          return (
            <button
              key={gid}
              type="button"
              onClick={() => onSelectGroup(gid)}
              className={`p5-skew border-2 border-white px-3.5 py-2 transition ${
                active
                  ? '-translate-y-1 bg-[#E60012] text-white shadow-[5px_5px_0_#0D0D0D]'
                  : 'bg-[#0D0D0D] text-white shadow-[4px_4px_0_#0D0D0D] hover:-translate-y-0.5 hover:border-[#FFE600] hover:text-[#FFE600]'
              }`}
            >
              <span className="p5-unskew inline-flex items-center font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                {gid}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onSelectGroup('ALL')}
          className={`p5-skew border-2 border-white px-3.5 py-2 transition ${
            selectedGroup === 'ALL'
              ? '-translate-y-1 bg-[#E60012] text-white shadow-[5px_5px_0_#0D0D0D]'
              : 'bg-[#0D0D0D] text-white shadow-[4px_4px_0_#0D0D0D] hover:-translate-y-0.5 hover:border-[#FFE600] hover:text-[#FFE600]'
          }`}
        >
          <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            <span>Все 4 группы</span>
          </span>
        </button>
      </div>

      {activeGroupInfo && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t-2 border-white/20 pt-2.5 text-xs text-neutral-200">
          <span className="bg-white px-2 py-0.5 font-condensed font-bold uppercase tracking-wider text-[#0D0D0D]">
            {GROUP_LABELS[activeGroupInfo.id]}
          </span>
          <span className="font-semibold">
            Нагрузка по плану: {activeGroupInfo.weeklyHours} ч/нед
          </span>
          {activeGroupInfo.earliest && activeGroupInfo.latest && (
            <span className="font-semibold">
              Обычное окно: {activeGroupInfo.earliest}–{activeGroupInfo.latest}
            </span>
          )}
          {activeGroupInfo.advisor && (
            <span className="flex flex-wrap items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-[#FFE600]" />
              <span>Эдвайзер:</span>
              {advisorTeacher ? (
                <button
                  type="button"
                  onClick={() => onOpenTeacher(advisorTeacher.id)}
                  className="font-bold text-[#FFE600] underline decoration-[#E60012] decoration-2 underline-offset-4 transition hover:text-white"
                >
                  {activeGroupInfo.advisor}
                </button>
              ) : (
                <span className="font-bold text-white">{activeGroupInfo.advisor}</span>
              )}
              {activeGroupInfo.advisorRoom && (
                <span className="inline-flex items-center gap-0.5 text-neutral-300">
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
