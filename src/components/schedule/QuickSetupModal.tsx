import { useMemo } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { Check, MapPin, Pin, PinOff, SlidersHorizontal, UserCheck } from 'lucide-react';
import { GROUP_BADGE_STYLES, TARGET_GROUPS } from '../../constants/schedule';
import type {
  EffectiveLesson,
  EffectiveTeacher,
  GroupFilter,
  GroupId,
  GroupInfo,
} from '../../types/schedule';
import { getTapPressProps } from '../../utils/p5Motion';
import { extractStreamSubjects } from '../../utils/streams';
import { filterLessonsByGroup } from '../../utils/time';
import { Modal } from '../common/Modal';

interface QuickSetupModalProps {
  open: boolean;
  onClose: () => void;
  groups: GroupInfo[];
  selectedGroup: GroupFilter;
  pinnedGroup: GroupId | null;
  allLessons: EffectiveLesson[];
  teachersById: Record<string, EffectiveTeacher>;
  subjectTeacherOverrides: Record<string, string>;
  onPinGroup: (group: GroupId | null) => void;
  onSetSubjectPinnedSubgroup: (subject: string, teacherId: string | null) => void;
  onOpenSettings: () => void;
  onComplete: () => void;
}

export function QuickSetupModal({
  open,
  onClose,
  groups,
  selectedGroup,
  pinnedGroup,
  allLessons,
  teachersById,
  subjectTeacherOverrides,
  onPinGroup,
  onSetSubjectPinnedSubgroup,
  onOpenSettings,
  onComplete,
}: QuickSetupModalProps) {
  const reduced = useReducedMotion();
  const tapProps = getTapPressProps(reduced);

  const activeGroupForPreview: GroupFilter = pinnedGroup ?? selectedGroup;

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

  const streamSubjects = useMemo(
    () =>
      extractStreamSubjects(
        filterLessonsByGroup(allLessons, activeGroupForPreview),
        teachersById,
        subjectTeacherOverrides
      ),
    [allLessons, activeGroupForPreview, teachersById, subjectTeacherOverrides]
  );

  const pinnedCount = streamSubjects.filter((s) => Boolean(s.pinnedTeacherId)).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Моя группа и преподаватели"
      subtitle="Настройка для всех 4 групп — сохраняется в localStorage"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Section 1: Pin My Group */}
        <section aria-label="Выбор своей группы" className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 font-display text-sm uppercase tracking-wider text-white">
              <Pin className="h-4 w-4 text-[#FFE600]" />
              <span>1. Моя группа</span>
            </h3>

            {pinnedGroup && (
              <button
                type="button"
                onClick={() => onPinGroup(null)}
                className="inline-flex items-center gap-1 border border-white/40 bg-[#050505] px-2 py-0.5 font-condensed text-[11px] font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:border-[#E60012] hover:bg-[#E60012] hover:text-white"
              >
                <PinOff className="h-3 w-3" />
                <span>Снять закрепление</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {TARGET_GROUPS.map((gid) => {
              const info = groups.find((g) => g.id === gid);
              const isPinned = pinnedGroup === gid;
              return (
                <m.button
                  key={gid}
                  type="button"
                  onClick={() => onPinGroup(gid)}
                  {...tapProps}
                  className={`flex flex-col justify-between gap-1.5 border-2 p-3 text-left transition-colors ${
                    isPinned
                      ? 'border-[#FFE600] bg-[#141414] shadow-[4px_4px_0_#E60012]'
                      : 'border-white/50 bg-[#050505] hover:border-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider ${GROUP_BADGE_STYLES[gid]}`}
                    >
                      {gid}
                    </span>

                    <span
                      className={`px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none ${
                        isPinned
                          ? 'bg-[#FFE600] text-[#050505]'
                          : 'border border-white/30 text-neutral-300'
                      }`}
                    >
                      {isPinned ? '★ МОЯ' : 'ВЫБРАТЬ'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                    {info?.advisor && (
                      <span className="inline-flex min-w-0 items-center gap-1 font-condensed font-bold text-neutral-200">
                        <UserCheck className="h-3 w-3 shrink-0 text-[#E60012]" />
                        <span className="truncate">{info.advisor}</span>
                        {info.advisorRoom && (
                          <span className="text-neutral-400">
                            ({info.advisorRoom})
                          </span>
                        )}
                      </span>
                    )}
                    <span className="font-condensed text-[11px] font-bold uppercase text-neutral-400">
                      {weeklyCountByGroup[gid]} пар/нед
                    </span>
                  </div>
                </m.button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Stream Teachers */}
        <section
          aria-label="Закрепление преподавателей потоков"
          className="space-y-3 border-t-2 border-white/15 pt-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-1.5 font-display text-sm uppercase tracking-wider text-white">
                <span className="text-[#FFE600]" aria-hidden="true">
                  ★
                </span>
                <span>
                  2. Мои преподаватели потоков ({pinnedCount}/
                  {streamSubjects.length})
                </span>
              </h3>
              <p className="mt-0.5 text-xs text-neutral-300">
                Показываются слоты для:{' '}
                <strong className="text-[#FFE600]">
                  {activeGroupForPreview === 'ALL'
                    ? 'ВСЕХ 4 ГРУПП'
                    : activeGroupForPreview}
                </strong>
                . Нажмите на преподавателя, чтобы закрепить на всю неделю.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {streamSubjects.map((group) => (
              <div
                key={group.subjectKey}
                className="border-2 border-white/35 bg-[#050505] p-3"
              >
                <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-sm uppercase tracking-wide text-white">
                        {group.subject}
                      </h4>
                      {group.pinnedTeacherId && (
                        <span className="bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none text-[#050505]">
                          {group.isPartialPin ? '★ ЧАСТИЧНО' : '★ ЗАКРЕПЛЕН'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {group.slots.map((slot) => (
                        <span
                          key={slot}
                          className="border border-white/25 bg-[#121212] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-neutral-300"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>

                  {group.pinnedTeacherId && (
                    <button
                      type="button"
                      onClick={() =>
                        onSetSubjectPinnedSubgroup(group.subject, null)
                      }
                      className="inline-flex items-center gap-1 border border-white/40 bg-[#121212] px-2 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:border-[#E60012] hover:bg-[#E60012] hover:text-white"
                    >
                      <PinOff className="h-3 w-3" />
                      <span>Сбросить</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.teachers.map((opt) => {
                    const isSelected = group.pinnedTeacherId === opt.teacherId;
                    return (
                      <button
                        key={opt.teacherId}
                        type="button"
                        onClick={() =>
                          onSetSubjectPinnedSubgroup(
                            group.subject,
                            isSelected ? null : opt.teacherId
                          )
                        }
                        className={`flex items-center justify-between gap-2 border-2 px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? 'border-[#FFE600] bg-[#141414] text-[#FFE600] shadow-[3px_3px_0_#E60012]'
                            : 'border-white/35 bg-[#121212] text-white hover:border-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-condensed text-sm font-bold tracking-wide">
                            {opt.teacherName}
                          </div>
                          {opt.rooms.length > 0 && (
                            <div
                              className={`mt-0.5 inline-flex items-center gap-1 font-condensed text-[11px] font-bold uppercase ${
                                isSelected
                                  ? 'text-[#FFE600]'
                                  : 'text-neutral-300'
                              }`}
                            >
                              <MapPin className="h-3 w-3 shrink-0 text-[#E60012]" />
                              <span>{opt.rooms.join(' / ')}</span>
                            </div>
                          )}
                        </div>

                        <span
                          className={`shrink-0 px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none ${
                            isSelected
                              ? 'bg-[#FFE600] text-[#050505]'
                              : 'border border-white/30 text-neutral-400'
                          }`}
                        >
                          {isSelected ? '★ МОЙ' : 'ВЫБРАТЬ'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-white/20 pt-3">
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 border border-white/50 bg-[#050505] px-3 py-2 font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200 transition-colors hover:border-[#FFE600] hover:text-[#FFE600]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#E60012]" />
            <span>Другие предметы и настройки →</span>
          </button>

          <m.button
            type="button"
            onClick={onComplete}
            {...tapProps}
            className="p5-skew border-2 border-[#050505] bg-[#FFE600] px-5 py-2 text-[#050505] shadow-[4px_4px_0_#E60012] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
          >
            <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-sm font-bold uppercase tracking-wider">
              <Check className="h-4 w-4" />
              <span>ГОТОВО</span>
            </span>
          </m.button>
        </div>
      </div>
    </Modal>
  );
}
