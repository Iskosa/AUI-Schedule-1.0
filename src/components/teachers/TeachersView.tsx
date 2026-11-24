import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import type { EffectiveLesson, EffectiveTeacher } from '../../types/schedule';
import {
  getPanelMotionProps,
  getStaggerContainerVariants,
  getStaggerItemVariants,
} from '../../utils/p5Motion';
import { playSwitch } from '../../utils/p5Sound';
import { RansomTitle } from '../common/RansomTitle';
import { TeacherCard } from './TeacherCard';
import { TeacherDetailPanel } from './TeacherDetailPanel';

interface TeachersViewProps {
  teachers: EffectiveTeacher[];
  lessons: EffectiveLesson[];
  targetGroupTeacherIds: Set<string>;
  selectedTeacherId: string | null;
  onSelectTeacher: (teacherId: string | null) => void;
  onAddTeacher: () => void;
  onEditTeacher: (teacher: EffectiveTeacher) => void;
  onDeleteTeacher: (teacher: EffectiveTeacher) => void;
  onSelectLesson: (lesson: EffectiveLesson) => void;
}

export function TeachersView({
  teachers,
  lessons,
  targetGroupTeacherIds,
  selectedTeacherId,
  onSelectTeacher,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
  onSelectLesson,
}: TeachersViewProps) {
  const [query, setQuery] = useState('');
  const [onlyTargetGroups, setOnlyTargetGroups] = useState(false);

  const reduced = useReducedMotion();
  const panelMotion = getPanelMotionProps(reduced);
  const containerVariants = getStaggerContainerVariants(reduced);
  const itemVariants = getStaggerItemVariants(reduced);

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

  const filteredTeachers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teachers.filter((t) => {
      if (onlyTargetGroups && !targetGroupTeacherIds.has(t.id)) {
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
  }, [teachers, query, onlyTargetGroups, targetGroupTeacherIds]);

  const activeTeacher =
    teachers.find((t) => t.id === selectedTeacherId) ?? null;

  return (
    <div className="space-y-4">
      {/* Confidants Top Search & Filter Bar */}
      <div className="p5-confidant-bg p5-shadow space-y-3 border-2 border-white border-l-[6px] border-l-[#E60012] p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <RansomTitle text="CONFIDANTS" as="h2" size="md" />
            <span className="border-2 border-[#0D0D0D] bg-[#FFE600] px-2 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-[#0D0D0D]">
              ПРЕПОДАВАТЕЛИ • {filteredTeachers.length} / {teachers.length}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3.5 h-4 w-4 text-white" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по имени преподавателя, предмету или кабинету..."
              className="p5-input w-full py-2 pr-9 pl-10 text-sm placeholder-neutral-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Очистить поиск"
                className="absolute top-2 right-2 border border-white/40 bg-[#161616] p-1 text-white transition hover:border-[#FFE600] hover:bg-[#E60012]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onlyTargetGroups) playSwitch();
                  setOnlyTargetGroups(false);
                }}
                className={`p5-skew p5-shadow-sm border-2 px-3 py-1.5 transition ${
                  !onlyTargetGroups
                    ? '-translate-y-0.5 border-white bg-[#E60012] text-white'
                    : 'border-white bg-[#0D0D0D] text-white hover:border-[#FFE600] hover:text-[#FFE600]'
                }`}
              >
                <span className="p5-unskew block font-condensed text-xs font-bold uppercase tracking-wider">
                  Все ({teachers.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!onlyTargetGroups) playSwitch();
                  setOnlyTargetGroups(true);
                }}
                className={`p5-skew p5-shadow-sm border-2 px-3 py-1.5 transition ${
                  onlyTargetGroups
                    ? '-translate-y-0.5 border-white bg-[#E60012] text-white'
                    : 'border-white bg-[#0D0D0D] text-white hover:border-[#FFE600] hover:text-[#FFE600]'
                }`}
              >
                <span className="p5-unskew block font-condensed text-xs font-bold uppercase tracking-wider">
                  Наши 4 группы ({targetCount})
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onAddTeacher}
              className="p5-skew border-2 border-[#0D0D0D] bg-[#FFE600] px-4 py-2 text-[#0D0D0D] shadow-[4px_4px_0_#E60012] transition hover:-translate-y-0.5 hover:border-white hover:bg-[#E60012] hover:text-white"
            >
              <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                <Plus className="h-4 w-4" />
                <span>Добавить преподавателя</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Master-Detail Grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* List column */}
        <div
          className={`space-y-2.5 lg:col-span-5 ${
            activeTeacher ? 'hidden lg:block' : 'block'
          }`}
        >
          {filteredTeachers.length === 0 ? (
            <div className="p5-shadow border-2 border-dashed border-white/40 bg-[#161616] p-8 text-center font-condensed text-sm font-bold uppercase tracking-wider text-neutral-300">
              По запросу ничего не найдено.
            </div>
          ) : (
            <motion.div
              key={onlyTargetGroups ? 'target-only' : 'all-teachers'}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-h-[70vh] space-y-2.5 overflow-x-clip overflow-y-auto px-1.5 py-1"
            >
              {filteredTeachers.map((teacher) => (
                <motion.div key={teacher.id} variants={itemVariants}>
                  <TeacherCard
                    teacher={teacher}
                    lessonCount={lessonCountsByTeacher[teacher.id] ?? 0}
                    isSelected={activeTeacher?.id === teacher.id}
                    onSelect={() => onSelectTeacher(teacher.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Detail column */}
        <div
          className={`lg:col-span-7 ${
            activeTeacher ? 'block' : 'hidden lg:block'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTeacher?.id ?? 'empty'}
              {...panelMotion}
            >
              <TeacherDetailPanel
                teacher={activeTeacher}
                lessons={lessons}
                onBackToList={() => onSelectTeacher(null)}
                onEdit={onEditTeacher}
                onDelete={onDeleteTeacher}
                onSelectLesson={onSelectLesson}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
