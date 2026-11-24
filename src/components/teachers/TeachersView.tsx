import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import type { EffectiveLesson, EffectiveTeacher } from '../../types/schedule';
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
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#252e42] bg-[#121620] p-3.5 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени преподавателя, предмету или кабинету..."
            className="w-full rounded-xl border border-[#252e42] bg-[#0b0d12] py-2 pr-9 pl-10 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Очистить поиск"
              className="absolute top-2 right-2.5 rounded p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[#252e42] bg-[#0b0d12] p-1">
            <button
              type="button"
              onClick={() => setOnlyTargetGroups(false)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                !onlyTargetGroups
                  ? 'bg-[#1a2030] text-white ring-1 ring-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все ({teachers.length})
            </button>
            <button
              type="button"
              onClick={() => setOnlyTargetGroups(true)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                onlyTargetGroups
                  ? 'bg-[#1a2030] text-white ring-1 ring-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Наши 4 группы ({targetCount})
            </button>
          </div>

          <button
            type="button"
            onClick={onAddTeacher}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Добавить преподавателя</span>
          </button>
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
            <div className="rounded-2xl border border-dashed border-[#252e42] bg-[#121620]/60 p-8 text-center text-sm text-slate-400">
              По запросу ничего не найдено.
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
              {filteredTeachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  lessonCount={lessonCountsByTeacher[teacher.id] ?? 0}
                  isSelected={activeTeacher?.id === teacher.id}
                  onSelect={() => onSelectTeacher(teacher.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail column */}
        <div
          className={`lg:col-span-7 ${
            activeTeacher ? 'block' : 'hidden lg:block'
          }`}
        >
          <TeacherDetailPanel
            teacher={activeTeacher}
            lessons={lessons}
            onBackToList={() => onSelectTeacher(null)}
            onEdit={onEditTeacher}
            onDelete={onDeleteTeacher}
            onSelectLesson={onSelectLesson}
          />
        </div>
      </div>
    </div>
  );
}
