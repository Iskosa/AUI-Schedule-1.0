import { DAY_ORDER, DAY_SHORT_RU } from '../constants/schedule';
import type { EffectiveLesson, EffectiveTeacher } from '../types/schedule';

export interface StreamTeacherOption {
  teacherId: string;
  teacherName: string;
  rooms: string[];
}

export interface StreamSubjectGroup {
  subjectKey: string;
  subject: string;
  slots: string[];
  lessonCount: number;
  teachers: StreamTeacherOption[];
  pinnedTeacherId: string | null;
  isPartialPin: boolean;
  overrideTeacher: EffectiveTeacher | null;
}

export function extractStreamSubjects(
  lessons: EffectiveLesson[],
  teachersById: Record<string, EffectiveTeacher>,
  subjectTeacherOverrides: Record<string, string> = {}
): StreamSubjectGroup[] {
  const map = new Map<
    string,
    {
      subject: string;
      lessons: EffectiveLesson[];
    }
  >();

  for (const ls of lessons) {
    const sgs = ls.baseSubgroups ?? ls.subgroups;
    if (!sgs || sgs.length === 0) continue;
    const key = ls.subject.trim().toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.lessons.push(ls);
    } else {
      map.set(key, {
        subject: ls.subject,
        lessons: [ls],
      });
    }
  }

  const result: StreamSubjectGroup[] = [];
  for (const [subjectKey, entry] of map.entries()) {
    const sortedLessons = [...entry.lessons].sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    const slotLabels = Array.from(
      new Set(
        sortedLessons.map(
          (ls) => `${DAY_SHORT_RU[ls.day].toUpperCase()} ${ls.startTime}`
        )
      )
    );

    const teacherMap = new Map<string, StreamTeacherOption>();
    for (const ls of sortedLessons) {
      const sgs = ls.baseSubgroups ?? ls.subgroups ?? [];
      for (const sg of sgs) {
        const tid = sg.teacherId ?? sg.teacherName;
        const tName =
          (sg.teacherId && teachersById[sg.teacherId]?.name) || sg.teacherName;
        const existingOption = teacherMap.get(tid);
        const roomTrimmed = sg.room.trim();
        if (existingOption) {
          if (roomTrimmed && !existingOption.rooms.includes(roomTrimmed)) {
            existingOption.rooms.push(roomTrimmed);
          }
        } else {
          teacherMap.set(tid, {
            teacherId: tid,
            teacherName: tName,
            rooms: roomTrimmed ? [roomTrimmed] : [],
          });
        }
      }
    }

    const pinnedIds = sortedLessons
      .map((ls) => ls.pinnedSubgroupTeacherId)
      .filter((id): id is string => Boolean(id));
    const uniquePinned = Array.from(new Set(pinnedIds));

    let pinnedTeacherId: string | null = null;
    let isPartialPin = false;
    if (uniquePinned.length === 1) {
      pinnedTeacherId = uniquePinned[0];
      isPartialPin = pinnedIds.length < sortedLessons.length;
    } else if (uniquePinned.length > 1) {
      pinnedTeacherId = uniquePinned[0];
      isPartialPin = true;
    }

    const overrideId = subjectTeacherOverrides[subjectKey];
    const overrideTeacher =
      overrideId && teachersById[overrideId] ? teachersById[overrideId] : null;

    result.push({
      subjectKey,
      subject: entry.subject,
      slots: slotLabels,
      lessonCount: sortedLessons.length,
      teachers: Array.from(teacherMap.values()),
      pinnedTeacherId,
      isPartialPin,
      overrideTeacher,
    });
  }

  return result.sort((a, b) => a.subject.localeCompare(b.subject));
}

export function getPinnedTeacherIds(lessons: EffectiveLesson[]): Set<string> {
  const ids = new Set<string>();
  for (const ls of lessons) {
    if (ls.pinnedSubgroupTeacherId) {
      ids.add(ls.pinnedSubgroupTeacherId);
    }
    if (ls.teacherOverrideApplied && ls.teacherId) {
      ids.add(ls.teacherId);
    }
  }
  return ids;
}

export function getTeacherStreamOptions(
  teacherId: string,
  allLessons: EffectiveLesson[],
  teachersById: Record<string, EffectiveTeacher>,
  subjectTeacherOverrides: Record<string, string> = {}
): StreamSubjectGroup[] {
  return extractStreamSubjects(
    allLessons,
    teachersById,
    subjectTeacherOverrides
  ).filter((group) => group.teachers.some((t) => t.teacherId === teacherId));
}
