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
      className="space-y-2.5 rounded-2xl border border-[#252e42] bg-[#121620] p-3.5 sm:p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        {TARGET_GROUPS.map((gid) => {
          const active = selectedGroup === gid;
          return (
            <button
              key={gid}
              type="button"
              onClick={() => onSelectGroup(gid)}
              className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                active
                  ? 'border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-950/50'
                  : 'border-[#252e42] bg-[#1a2030] text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              {gid}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onSelectGroup('ALL')}
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
            selectedGroup === 'ALL'
              ? 'border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-950/50'
              : 'border-[#252e42] bg-[#1a2030] text-slate-300 hover:border-slate-600 hover:text-white'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Все 4 группы</span>
        </button>
      </div>

      {activeGroupInfo && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#252e42]/70 pt-2.5 text-xs text-slate-400">
          <span className="font-medium text-slate-200">
            {GROUP_LABELS[activeGroupInfo.id]}
          </span>
          <span>Нагрузка по плану: {activeGroupInfo.weeklyHours} ч/нед</span>
          {activeGroupInfo.earliest && activeGroupInfo.latest && (
            <span>
              Обычное окно: {activeGroupInfo.earliest}–{activeGroupInfo.latest}
            </span>
          )}
          {activeGroupInfo.advisor && (
            <span className="flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Эдвайзер:</span>
              {advisorTeacher ? (
                <button
                  type="button"
                  onClick={() => onOpenTeacher(advisorTeacher.id)}
                  className="font-medium text-blue-400 underline decoration-blue-400/40 underline-offset-2 transition hover:text-blue-300"
                >
                  {activeGroupInfo.advisor}
                </button>
              ) : (
                <span className="text-slate-200">{activeGroupInfo.advisor}</span>
              )}
              {activeGroupInfo.advisorRoom && (
                <span className="inline-flex items-center gap-0.5 text-slate-400">
                  (<MapPin className="h-3 w-3" />
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
