import { DAY_ORDER } from '../constants/schedule';
import type {
  BaseScheduleData,
  EffectiveLesson,
  EffectiveTeacher,
  Lesson,
  ScheduleOverlay,
  Subgroup,
} from '../types/schedule';

export interface MergedSchedule {
  teachers: EffectiveTeacher[];
  teachersById: Record<string, EffectiveTeacher>;
  lessons: EffectiveLesson[];
  targetGroupTeacherIds: Set<string>;
}

function normalizeTeacherIds(lesson: Lesson): string[] {
  const ids = new Set<string>();
  if (lesson.teacherId) {
    ids.add(lesson.teacherId);
  }
  for (const tid of lesson.teacherIds ?? []) {
    if (tid) ids.add(tid);
  }
  for (const sg of lesson.subgroups ?? []) {
    if (sg.teacherId) ids.add(sg.teacherId);
  }
  return Array.from(ids);
}

function syncLessonTeachers(
  lesson: Lesson,
  teachersById: Record<string, EffectiveTeacher>
): Pick<Lesson, 'teacherIds' | 'teacherName' | 'subgroups'> {
  const teacherIds = normalizeTeacherIds(lesson);
  let subgroups: Subgroup[] | undefined =
    lesson.subgroups && lesson.subgroups.length > 0 ? lesson.subgroups : undefined;

  if (subgroups) {
    subgroups = subgroups.map((sg) => {
      if (sg.teacherId && teachersById[sg.teacherId]) {
        return {
          ...sg,
          teacherName: teachersById[sg.teacherId].name,
        };
      }
      return sg;
    });
  }

  let teacherName = lesson.teacherName;
  if (subgroups) {
    teacherName = subgroups.map((sg) => sg.teacherName).join(' / ');
  } else if (lesson.teacherId && teachersById[lesson.teacherId]) {
    teacherName = teachersById[lesson.teacherId].name;
  } else if (teacherIds.length > 0) {
    const resolved = teacherIds
      .map((id) => teachersById[id]?.name)
      .filter((name): name is string => Boolean(name));
    if (resolved.length > 0) {
      teacherName = resolved.join(' / ');
    }
  }

  return {
    teacherIds,
    teacherName,
    subgroups,
  };
}

export function mergeScheduleData(
  base: BaseScheduleData | null,
  overlay: ScheduleOverlay
): MergedSchedule {
  const deletedTeacherSet = new Set(overlay.deletedTeacherIds);
  const deletedLessonSet = new Set(overlay.deletedLessonIds);
  const subjectOverrides = overlay.subjectTeacherOverrides ?? {};

  const teachersList: EffectiveTeacher[] = [];

  if (base) {
    for (const bt of base.teachers) {
      if (deletedTeacherSet.has(bt.id)) continue;
      const patch = overlay.editedTeachers[bt.id];
      teachersList.push({
        ...bt,
        ...patch,
        id: bt.id,
        isCustom: false,
        isBase: true,
        isModified: Boolean(patch && Object.keys(patch).length > 0),
      });
    }
  }

  for (const ct of overlay.customTeachers) {
    if (deletedTeacherSet.has(ct.id)) continue;
    const patch = overlay.editedTeachers[ct.id];
    teachersList.push({
      ...ct,
      ...patch,
      id: ct.id,
      isCustom: true,
      isBase: false,
      isModified: false,
    });
  }

  teachersList.sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));

  const teachersById: Record<string, EffectiveTeacher> = {};
  for (const t of teachersList) {
    teachersById[t.id] = t;
  }

  const lessonsList: EffectiveLesson[] = [];

  const pushEffectiveLesson = (rawLesson: Lesson, isBase: boolean) => {
    if (deletedLessonSet.has(rawLesson.id)) return;
    const patch = isBase ? overlay.editedLessons[rawLesson.id] : undefined;
    const mergedRaw: Lesson = patch
      ? {
          ...rawLesson,
          ...patch,
          id: rawLesson.id,
        }
      : rawLesson;

    const synced = syncLessonTeachers(mergedRaw, teachersById);
    const baseSubgroups = synced.subgroups;
    const subjectKey = mergedRaw.subject.trim().toLowerCase();
    const overrideTeacherId = subjectOverrides[subjectKey] ?? null;
    const overrideTeacher =
      overrideTeacherId && teachersById[overrideTeacherId]
        ? teachersById[overrideTeacherId]
        : null;

    if (overrideTeacher) {
      const matchesSubgroup = synced.subgroups?.some(
        (sg) => sg.teacherId === overrideTeacher.id
      );

      if (matchesSubgroup && synced.subgroups) {
        const pinnedCandidate =
          overlay.pinnedSubgroups[mergedRaw.id] ?? overrideTeacher.id;
        const pinnedSubgroupTeacherId = synced.subgroups.some(
          (sg) => sg.teacherId === pinnedCandidate
        )
          ? pinnedCandidate
          : overrideTeacher.id;

        lessonsList.push({
          ...mergedRaw,
          ...synced,
          baseSubgroups,
          isBase,
          isCustom: !isBase,
          isModified: Boolean(patch && Object.keys(patch).length > 0),
          pinnedSubgroupTeacherId,
          teacherOverrideApplied: true,
        });
        return;
      }

      lessonsList.push({
        ...mergedRaw,
        teacherId: overrideTeacher.id,
        teacherIds: [overrideTeacher.id],
        teacherName: overrideTeacher.name,
        subgroups: undefined,
        baseSubgroups,
        isBase,
        isCustom: !isBase,
        isModified: true,
        pinnedSubgroupTeacherId: null,
        teacherOverrideApplied: true,
      });
      return;
    }

    const pinnedCandidate = overlay.pinnedSubgroups[mergedRaw.id] ?? null;
    const pinnedSubgroupTeacherId =
      pinnedCandidate &&
      synced.subgroups?.some((sg) => sg.teacherId === pinnedCandidate)
        ? pinnedCandidate
        : null;

    lessonsList.push({
      ...mergedRaw,
      ...synced,
      baseSubgroups,
      isBase,
      isCustom: !isBase,
      isModified: Boolean(patch && Object.keys(patch).length > 0),
      pinnedSubgroupTeacherId,
    });
  };

  if (base) {
    for (const bl of base.lessons) {
      pushEffectiveLesson(bl, true);
    }
  }

  for (const al of overlay.addedLessons) {
    pushEffectiveLesson(al, false);
  }

  lessonsList.sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.endTime !== b.endTime) return a.endTime.localeCompare(b.endTime);
    return a.subject.localeCompare(b.subject);
  });

  const targetGroupTeacherIds = new Set<string>();
  for (const ls of lessonsList) {
    for (const tid of ls.teacherIds) {
      targetGroupTeacherIds.add(tid);
    }
  }

  if (base) {
    const advisorNames = new Set(
      base.groups
        .map((g) => g.advisor?.trim().toLowerCase())
        .filter((n): n is string => Boolean(n))
    );
    for (const t of teachersList) {
      if (advisorNames.has(t.name.trim().toLowerCase()) || t.isCustom) {
        targetGroupTeacherIds.add(t.id);
      }
    }
  }

  return {
    teachers: teachersList,
    teachersById,
    lessons: lessonsList,
    targetGroupTeacherIds,
  };
}
