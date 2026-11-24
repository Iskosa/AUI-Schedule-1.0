import { useMemo, useState } from 'react';
import { LayoutGroup, m, useReducedMotion } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import { TARGET_GROUPS } from '../../constants/schedule';
import type {
  EffectiveLesson,
  EffectiveTeacher,
  GroupId,
  GroupInfo,
} from '../../types/schedule';
import {
  getCardSlamItemVariants,
  getCursorSpring,
  getPanelMotionProps,
  getStaggerContainerVariants,
  getTapPressProps,
} from '../../utils/p5Motion';
import { playSwitch } from '../../utils/p5Sound';
import { RansomTitle } from '../common/RansomTitle';
import { TeacherCard } from './TeacherCard';
import { TeacherDetailPanel } from './TeacherDetailPanel';

type TeacherGroupScope = 'all' | 'target4' | GroupId;

interface TeachersViewProps {
  teachers: EffectiveTeacher[];
  lessons: EffectiveLesson[];
  allLessons: EffectiveLesson[];
  groups: GroupInfo[];
  teachersById: Record<string, EffectiveTeacher>;
  subjectTeacherOverrides: Record<string, string>;
  targetGroupTeacherIds: Set<string>;
  pinnedGroup: GroupId | null;
  pinnedTeacherIds: Set<string>;
  selectedTeacherId: string | null;
  onSelectTeacher: (teacherId: string | null) => void;
  onAddTeacher: () => void;
  onEditTeacher: (teacher: EffectiveTeacher) => void;
  onDeleteTeacher: (teacher: EffectiveTeacher) => void;
  onSelectLesson: (lesson: EffectiveLesson) => void;
  onSetSubjectPinnedSubgroup: (subject: string, teacherId: string | null) => void;
  onShowTeacherSchedule: (teacherId: string) => void;
}

export function TeachersView({
  teachers,
  lessons,
  allLessons,
  groups,
  teachersById,
  subjectTeacherOverrides,
  targetGroupTeacherIds,
  pinnedGroup,
  pinnedTeacherIds,
  selectedTeacherId,
  onSelectTeacher,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
  onSelectLesson,
  onSetSubjectPinnedSubgroup,
  onShowTeacherSchedule,
}: TeachersViewProps) {
  const [query, setQuery] = useState('');
  const [groupScope, setGroupScope] = useState<TeacherGroupScope>('all');
  const [hoveredTeacherId, setHoveredTeacherId] = useState<string | null>(null);

  const reduced = useReducedMotion();
  const cursorSpring = getCursorSpring(reduced);
  const tapProps = getTapPressProps(reduced);
  const panelMotion = getPanelMotionProps(reduced);
  const containerVariants = getStaggerContainerVariants(reduced);
  const itemVariants = getCardSlamItemVariants(reduced);

  const lessonCountsByTeacher = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ls of lessons) {
      for (const tid of ls.teacherIds) {
        counts[tid] = (counts[tid] ?? 0) + 1;
      }
    }
    return counts;
  }, [lessons]);

  const targetCount = useMemo(
    () => teachers.filter((t) => targetGroupTeacherIds.has(t.id)).length,
    [teachers, targetGroupTeacherIds]
  );

  const teacherIdsByGroup = useMemo(() => {
    const map: Record<GroupId, Set<string>> = {
      COMSE26A: new Set(),
      COMSE26B: new Set(),
      COMSEH26: new Set(),
      COMCIF26: new Set(),
    };
    for (const ls of allLessons) {
      for (const gid of ls.groupIds) {
        const set = map[gid];
        if (!set) continue;
        for (const tid of ls.teacherIds) {
          set.add(tid);
        }
        for (const sg of ls.baseSubgroups ?? ls.subgroups ?? []) {
          if (sg.teacherId) set.add(sg.teacherId);
        }
      }
    }
    for (const g of groups) {
      if (!g.advisor || !map[g.id]) continue;
      const advisorName = g.advisor.trim().toLowerCase();
      const advisor = teachers.find(
        (t) => t.name.trim().toLowerCase() === advisorName
      );
      if (advisor) {
        map[g.id].add(advisor.id);
      }
    }
    return map;
  }, [allLessons, groups, teachers]);

  const filteredTeachers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teachers.filter((t) => {
      if (groupScope === 'target4' && !targetGroupTeacherIds.has(t.id)) {
        return false;
      }
      if (
        groupScope !== 'all' &&
        groupScope !== 'target4' &&
        !teacherIdsByGroup[groupScope]?.has(t.id)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.courses.some((c) => c.toLowerCase().includes(q)) ||
        (t.room && t.room.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    });
  }, [teachers, query, groupScope, targetGroupTeacherIds, teacherIdsByGroup]);

  const activeTeacher =
    teachers.find((t) => t.id === selectedTeacherId) ?? null;

  return (
    <div className="space-y-3">
      {/* Confidants Top Search & Filter Bar */}
      <div className="space-y-2.5 border-2 border-white border-l-[6px] border-l-[#E60012] bg-[#060606] p-3 shadow-[5px_5px_0_#050505]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <RansomTitle text="CONFIDANTS" as="h2" size="sm" />
            <span className="bg-[#FFE600] px-2 py-0.5 font-condensed text-[11px] font-bold uppercase tracking-wider text-[#050505]">
              {filteredTeachers.length} / {teachers.length}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по имени преподавателя, предмету или кабинету..."
              className="p5-input w-full py-1.5 pr-9 pl-9 text-sm placeholder-neutral-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Очистить поиск"
                className="absolute top-1.5 right-1.5 border border-white/60 bg-[#050505] p-1 text-white hover:border-[#FFE600] hover:bg-[#E60012]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LayoutGroup id="p5-teacher-filters">
              <div className="inline-flex flex-wrap items-center gap-1.5">
                <m.button
                  type="button"
                  onClick={() => {
                    if (groupScope !== 'all') playSwitch();
                    setGroupScope('all');
                  }}
                  {...tapProps}
                  className={`relative px-2.5 py-1.5 transition-colors ${
                    groupScope === 'all'
                      ? 'text-white'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {groupScope === 'all' ? (
                    <m.div
                      layoutId="p5-teacher-filter-cursor"
                      aria-hidden="true"
                      transition={cursorSpring}
                      className="pointer-events-none absolute inset-0 z-0"
                    >
                      <div className="p5-skew h-full w-full -rotate-[1.2deg] border border-white bg-[#E60012] shadow-[3px_3px_0_#000000]" />
                    </m.div>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="p5-skew pointer-events-none absolute inset-0 z-0 border border-white/20 bg-[#0B0B0B]"
                    />
                  )}
                  <span className="relative z-10 block font-condensed text-xs font-bold uppercase tracking-wider">
                    Все ({teachers.length})
                  </span>
                </m.button>

                <m.button
                  type="button"
                  onClick={() => {
                    if (groupScope !== 'target4') playSwitch();
                    setGroupScope('target4');
                  }}
                  {...tapProps}
                  className={`relative px-2.5 py-1.5 transition-colors ${
                    groupScope === 'target4'
                      ? 'text-white'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {groupScope === 'target4' ? (
                    <m.div
                      layoutId="p5-teacher-filter-cursor"
                      aria-hidden="true"
                      transition={cursorSpring}
                      className="pointer-events-none absolute inset-0 z-0"
                    >
                      <div className="p5-skew h-full w-full -rotate-[1.2deg] border border-white bg-[#E60012] shadow-[3px_3px_0_#000000]" />
                    </m.div>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="p5-skew pointer-events-none absolute inset-0 z-0 border border-white/20 bg-[#0B0B0B]"
                    />
                  )}
                  <span className="relative z-10 block font-condensed text-xs font-bold uppercase tracking-wider">
                    4 группы ({targetCount})
                  </span>
                </m.button>

                {TARGET_GROUPS.map((gid) => {
                  const active = groupScope === gid;
                  const isPinned = pinnedGroup === gid;
                  return (
                    <m.button
                      key={gid}
                      type="button"
                      onClick={() => {
                        if (groupScope !== gid) playSwitch();
                        setGroupScope(gid);
                      }}
                      {...tapProps}
                      className={`relative px-2.5 py-1.5 transition-colors ${
                        active
                          ? 'text-white'
                          : 'text-neutral-300 hover:text-white'
                      }`}
                    >
                      {active ? (
                        <m.div
                          layoutId="p5-teacher-filter-cursor"
                          aria-hidden="true"
                          transition={cursorSpring}
                          className="pointer-events-none absolute inset-0 z-0"
                        >
                          <div className="p5-skew h-full w-full -rotate-[1.2deg] border border-white bg-[#E60012] shadow-[3px_3px_0_#000000]" />
                        </m.div>
                      ) : (
                        <div
                          aria-hidden="true"
                          className="p5-skew pointer-events-none absolute inset-0 z-0 border border-white/20 bg-[#0B0B0B]"
                        />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-1 font-condensed text-xs font-bold uppercase tracking-wider">
                        <span>{gid}</span>
                        {isPinned && (
                          <span className="text-[10px] leading-none text-[#FFE600]">
                            ★
                          </span>
                        )}
                      </span>
                    </m.button>
                  );
                })}
              </div>
            </LayoutGroup>

            <m.button
              type="button"
              onClick={onAddTeacher}
              {...tapProps}
              className="p5-skew border border-[#0B0B0B] bg-[#FFE600] px-3.5 py-1.5 text-[#0B0B0B] shadow-[3px_3px_0_#E60012] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white hover:shadow-[3px_3px_0_#000000]"
            >
              <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                <Plus className="h-3.5 w-3.5" />
                <span>Добавить преподавателя</span>
              </span>
            </m.button>
          </div>
        </div>
      </div>

      {/* Master-Detail Grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* List column */}
        <div
          className={`space-y-2 lg:col-span-5 ${
            activeTeacher ? 'hidden lg:block' : 'block'
          }`}
        >
          {filteredTeachers.length === 0 ? (
            <div className="border-2 border-dashed border-white/70 bg-[#060606] p-8 text-center font-condensed text-sm font-bold uppercase tracking-wider text-neutral-300 shadow-[4px_4px_0_#050505]">
              По запросу ничего не найдено.
            </div>
          ) : (
            <LayoutGroup id="p5-confidants-list">
              <m.div
                key={groupScope}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                onMouseLeave={() => setHoveredTeacherId(null)}
                className="max-h-[70vh] space-y-2 overflow-x-clip overflow-y-auto px-2.5 py-2"
              >
                {filteredTeachers.map((teacher) => (
                  <m.div key={teacher.id} variants={itemVariants}>
                    <TeacherCard
                      teacher={teacher}
                      lessonCount={lessonCountsByTeacher[teacher.id] ?? 0}
                      isSelected={activeTeacher?.id === teacher.id}
                      isHovered={hoveredTeacherId === teacher.id}
                      isPinned={pinnedTeacherIds.has(teacher.id)}
                      onHoverStart={() => setHoveredTeacherId(teacher.id)}
                      onSelect={() => onSelectTeacher(teacher.id)}
                    />
                  </m.div>
                ))}
              </m.div>
            </LayoutGroup>
          )}
        </div>

        {/* Detail column */}
        <div
          className={`lg:col-span-7 ${
            activeTeacher ? 'block' : 'hidden lg:block'
          }`}
        >
          <m.div
            key={activeTeacher?.id ?? 'empty'}
            {...panelMotion}
          >
            <TeacherDetailPanel
              teacher={activeTeacher}
              lessons={lessons}
              allLessons={allLessons}
              teachersById={teachersById}
              subjectTeacherOverrides={subjectTeacherOverrides}
              onBackToList={() => onSelectTeacher(null)}
              onEdit={onEditTeacher}
              onDelete={onDeleteTeacher}
              onSelectLesson={onSelectLesson}
              onSetSubjectPinnedSubgroup={onSetSubjectPinnedSubgroup}
              onShowTeacherSchedule={onShowTeacherSchedule}
            />
          </m.div>
        </div>
      </div>
    </div>
  );
}
