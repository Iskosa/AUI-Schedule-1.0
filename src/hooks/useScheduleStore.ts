import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BaseScheduleData,
  DayOfWeek,
  EffectiveLesson,
  EffectiveTeacher,
  GroupFilter,
  GroupId,
  Lesson,
  LessonType,
  OfficeHour,
  ScheduleOverlay,
  Subgroup,
  Teacher,
  ViewMode,
} from '../types/schedule';
import { mergeScheduleData } from '../utils/mergeSchedule';
import {
  countOverlayChanges,
  createDeterministicSlug,
  createEmptyOverlay,
  exportOverlayJson,
  loadOverlay,
  parseImportedOverlay,
  saveOverlay,
} from '../utils/storage';
import { getDefaultStudyDay } from '../utils/time';
import { useIsMobile } from './useIsMobile';

export interface LessonDraftInput {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  type: LessonType;
  groupIds: GroupId[];
  teacherIds: string[];
  room: string | null;
  isOnline: boolean;
  subgroups?: Subgroup[];
  notes: string | null;
}

export interface TeacherDraftInput {
  name: string;
  courses: string[];
  officeHours: OfficeHour[];
  room: string | null;
  notes: string | null;
}

export function useScheduleStore() {
  const isMobile = useIsMobile();
  const [baseData, setBaseData] = useState<BaseScheduleData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<ScheduleOverlay>(() => loadOverlay());

  const reloadBaseData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/schedule.json`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} при загрузке schedule.json`);
      }
      const data = (await res.json()) as BaseScheduleData;
      setBaseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadBaseData();
  }, [reloadBaseData]);

  useEffect(() => {
    saveOverlay(overlay);
  }, [overlay]);

  const updateOverlay = useCallback(
    (updater: (prev: ScheduleOverlay) => ScheduleOverlay) => {
      setOverlay((prev) => {
        const next = updater(prev);
        return {
          ...next,
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const merged = useMemo(() => mergeScheduleData(baseData, overlay), [baseData, overlay]);

  const selectedGroup: GroupFilter = overlay.settings.selectedGroup;
  const viewMode: ViewMode = overlay.settings.viewMode ?? (isMobile ? 'day' : 'week');
  const selectedDay: DayOfWeek =
    overlay.settings.selectedDay ?? getDefaultStudyDay(new Date());

  const setSelectedGroup = useCallback(
    (group: GroupFilter) => {
      updateOverlay((prev) => ({
        ...prev,
        settings: { ...prev.settings, selectedGroup: group },
      }));
    },
    [updateOverlay]
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      updateOverlay((prev) => ({
        ...prev,
        settings: { ...prev.settings, viewMode: mode },
      }));
    },
    [updateOverlay]
  );

  const setSelectedDay = useCallback(
    (day: DayOfWeek) => {
      updateOverlay((prev) => ({
        ...prev,
        settings: { ...prev.settings, selectedDay: day },
      }));
    },
    [updateOverlay]
  );

  const togglePinSubgroup = useCallback(
    (lessonId: string, teacherId: string) => {
      updateOverlay((prev) => {
        const nextPins = { ...prev.pinnedSubgroups };
        if (nextPins[lessonId] === teacherId) {
          delete nextPins[lessonId];
        } else {
          nextPins[lessonId] = teacherId;
        }
        return {
          ...prev,
          pinnedSubgroups: nextPins,
        };
      });
    },
    [updateOverlay]
  );

  const buildLessonFields = useCallback(
    (input: LessonDraftInput, teachersById: Record<string, EffectiveTeacher>) => {
      const uniqueTeacherIds = Array.from(new Set(input.teacherIds));
      const isStream = uniqueTeacherIds.length > 1;
      const teacherNames = uniqueTeacherIds
        .map((id) => teachersById[id]?.name ?? id)
        .filter(Boolean);

      const subgroups: Subgroup[] = isStream
        ? uniqueTeacherIds.map((tid) => {
            const existingSg = input.subgroups?.find((sg) => sg.teacherId === tid);
            const tName = teachersById[tid]?.name ?? existingSg?.teacherName ?? tid;
            const sgRoom = (existingSg?.room ?? input.room ?? '').trim();
            return {
              teacherId: tid,
              teacherName: tName,
              room: sgRoom,
            };
          })
        : [];

      const aggregatedRooms = Array.from(
        new Set(subgroups.map((sg) => sg.room.trim()).filter(Boolean))
      );

      return {
        day: input.day,
        startTime: input.startTime,
        endTime: input.endTime,
        subject: input.subject.trim(),
        type: input.type,
        groupIds: input.groupIds,
        teacherId: uniqueTeacherIds.length === 1 ? uniqueTeacherIds[0] : null,
        teacherIds: uniqueTeacherIds,
        teacherName: teacherNames.length > 0 ? teacherNames.join(' / ') : null,
        room: isStream
          ? aggregatedRooms.length > 0
            ? aggregatedRooms.join(' / ')
            : input.room?.trim() || null
          : input.room?.trim() || null,
        isOnline: input.isOnline,
        subgroups,
        notes: input.notes?.trim() || null,
      };
    },
    []
  );

  const addLesson = useCallback(
    (input: LessonDraftInput): Lesson => {
      const fields = buildLessonFields(input, merged.teachersById);
      const id = `custom-${input.day.slice(0, 3).toLowerCase()}-${input.startTime.replace(':', '')}-${createDeterministicSlug(input.subject)}-${Date.now().toString(36)}`;
      const newLesson: Lesson = {
        id,
        ...fields,
        subgroups: fields.subgroups.length > 0 ? fields.subgroups : undefined,
        isCustom: true,
      };

      updateOverlay((prev) => ({
        ...prev,
        addedLessons: [...prev.addedLessons, newLesson],
      }));

      return newLesson;
    },
    [buildLessonFields, merged.teachersById, updateOverlay]
  );

  const updateLesson = useCallback(
    (lesson: EffectiveLesson, input: LessonDraftInput) => {
      const fields = buildLessonFields(input, merged.teachersById);

      updateOverlay((prev) => {
        if (!lesson.isBase) {
          return {
            ...prev,
            addedLessons: prev.addedLessons.map((item) =>
              item.id === lesson.id
                ? {
                    ...item,
                    ...fields,
                    subgroups: fields.subgroups.length > 0 ? fields.subgroups : undefined,
                  }
                : item
            ),
          };
        }

        const nextPins = { ...prev.pinnedSubgroups };
        if (
          nextPins[lesson.id] &&
          !fields.subgroups.some((sg) => sg.teacherId === nextPins[lesson.id])
        ) {
          delete nextPins[lesson.id];
        }

        return {
          ...prev,
          editedLessons: {
            ...prev.editedLessons,
            [lesson.id]: fields,
          },
          pinnedSubgroups: nextPins,
        };
      });
    },
    [buildLessonFields, merged.teachersById, updateOverlay]
  );

  const deleteLesson = useCallback(
    (lesson: EffectiveLesson) => {
      updateOverlay((prev) => {
        const nextPins = { ...prev.pinnedSubgroups };
        delete nextPins[lesson.id];

        if (!lesson.isBase) {
          return {
            ...prev,
            addedLessons: prev.addedLessons.filter((item) => item.id !== lesson.id),
            pinnedSubgroups: nextPins,
          };
        }

        const nextEdited = { ...prev.editedLessons };
        delete nextEdited[lesson.id];

        return {
          ...prev,
          deletedLessonIds: Array.from(new Set([...prev.deletedLessonIds, lesson.id])),
          editedLessons: nextEdited,
          pinnedSubgroups: nextPins,
        };
      });
    },
    [updateOverlay]
  );

  const addTeacher = useCallback(
    (input: TeacherDraftInput): Teacher => {
      const trimmedName = input.name.trim();
      const baseSlug = createDeterministicSlug(trimmedName);
      let id = `custom-${baseSlug}`;
      let suffix = 2;
      while (merged.teachersById[id]) {
        id = `custom-${baseSlug}-${suffix}`;
        suffix += 1;
      }

      const newTeacher: Teacher = {
        id,
        name: trimmedName,
        courses: input.courses.map((c) => c.trim()).filter(Boolean),
        officeHours: input.officeHours,
        room: input.room?.trim() || null,
        notes: input.notes?.trim() || null,
        isCustom: true,
      };

      updateOverlay((prev) => ({
        ...prev,
        customTeachers: [...prev.customTeachers, newTeacher],
      }));

      return newTeacher;
    },
    [merged.teachersById, updateOverlay]
  );

  const updateTeacher = useCallback(
    (teacher: EffectiveTeacher, input: TeacherDraftInput) => {
      const cleanFields = {
        name: input.name.trim(),
        courses: input.courses.map((c) => c.trim()).filter(Boolean),
        officeHours: input.officeHours,
        room: input.room?.trim() || null,
        notes: input.notes?.trim() || null,
      };

      updateOverlay((prev) => {
        if (teacher.isCustom) {
          return {
            ...prev,
            customTeachers: prev.customTeachers.map((t) =>
              t.id === teacher.id ? { ...t, ...cleanFields } : t
            ),
          };
        }

        return {
          ...prev,
          editedTeachers: {
            ...prev.editedTeachers,
            [teacher.id]: cleanFields,
          },
        };
      });
    },
    [updateOverlay]
  );

  const deleteTeacher = useCallback(
    (teacher: EffectiveTeacher) => {
      updateOverlay((prev) => {
        if (teacher.isCustom) {
          return {
            ...prev,
            customTeachers: prev.customTeachers.filter((t) => t.id !== teacher.id),
          };
        }

        const nextEdited = { ...prev.editedTeachers };
        delete nextEdited[teacher.id];

        return {
          ...prev,
          deletedTeacherIds: Array.from(new Set([...prev.deletedTeacherIds, teacher.id])),
          editedTeachers: nextEdited,
        };
      });
    },
    [updateOverlay]
  );

  const exportBackup = useCallback(() => {
    exportOverlayJson(overlay);
  }, [overlay]);

  const importBackup = useCallback(
    (rawText: string): { ok: true } | { ok: false; error: string } => {
      const res = parseImportedOverlay(rawText);
      if (!res.ok) return res;
      setOverlay(res.overlay);
      return { ok: true };
    },
    []
  );

  const resetToExcel = useCallback(() => {
    setOverlay((prev) => ({
      ...createEmptyOverlay(),
      settings: prev.settings,
    }));
  }, []);

  const overlayChangeCount = useMemo(() => countOverlayChanges(overlay), [overlay]);

  return {
    baseData,
    loading,
    error,
    overlay,
    overlayChangeCount,
    teachers: merged.teachers,
    teachersById: merged.teachersById,
    lessons: merged.lessons,
    targetGroupTeacherIds: merged.targetGroupTeacherIds,
    selectedGroup,
    viewMode,
    selectedDay,
    setSelectedGroup,
    setViewMode,
    setSelectedDay,
    togglePinSubgroup,
    addLesson,
    updateLesson,
    deleteLesson,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    exportBackup,
    importBackup,
    resetToExcel,
    reloadBaseData,
  };
}
