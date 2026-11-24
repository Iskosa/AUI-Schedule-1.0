import type {
  ConflictItem,
  DayOfWeek,
  EffectiveLesson,
  EffectiveTeacher,
  GroupId,
} from '../types/schedule';
import { parseTimeToMinutes } from './time';

export interface LessonConflictCandidate {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  groupIds: GroupId[];
  teacherIds: string[];
}

export function findLessonConflicts(
  candidate: LessonConflictCandidate,
  existingLessons: EffectiveLesson[],
  teachersById: Record<string, EffectiveTeacher>,
  excludeLessonId?: string
): ConflictItem[] {
  const startA = parseTimeToMinutes(candidate.startTime);
  const endA = parseTimeToMinutes(candidate.endTime);
  if (endA <= startA) return [];

  const conflicts: ConflictItem[] = [];
  const candGroups = new Set(candidate.groupIds);
  const candTeachers = new Set(candidate.teacherIds);

  for (const ls of existingLessons) {
    if (excludeLessonId && ls.id === excludeLessonId) continue;
    if (ls.day !== candidate.day) continue;

    const startB = parseTimeToMinutes(ls.startTime);
    const endB = parseTimeToMinutes(ls.endTime);
    const overlaps = startA < endB && startB < endA;
    if (!overlaps) continue;

    for (const gid of ls.groupIds) {
      if (candGroups.has(gid)) {
        conflicts.push({
          kind: 'group',
          entityId: gid,
          entityName: gid,
          lessonId: ls.id,
          lessonSubject: ls.subject,
          day: ls.day,
          startTime: ls.startTime,
          endTime: ls.endTime,
        });
      }
    }

    for (const tid of ls.teacherIds) {
      if (candTeachers.has(tid)) {
        conflicts.push({
          kind: 'teacher',
          entityId: tid,
          entityName: teachersById[tid]?.name ?? tid,
          lessonId: ls.id,
          lessonSubject: ls.subject,
          day: ls.day,
          startTime: ls.startTime,
          endTime: ls.endTime,
        });
      }
    }
  }

  return conflicts;
}
