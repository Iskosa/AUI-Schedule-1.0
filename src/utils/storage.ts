import { DAYS, STORAGE_KEY, TARGET_GROUPS } from '../constants/schedule';
import type {
  DayOfWeek,
  GroupFilter,
  Lesson,
  ScheduleOverlay,
  Teacher,
  ViewMode,
} from '../types/schedule';

export function createEmptyOverlay(): ScheduleOverlay {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    settings: {
      selectedGroup: 'COMSE26A',
    },
    customTeachers: [],
    editedTeachers: {},
    deletedTeacherIds: [],
    addedLessons: [],
    editedLessons: {},
    deletedLessonIds: [],
    pinnedSubgroups: {},
  };
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function sanitizeGroupFilter(val: unknown): GroupFilter {
  if (val === 'ALL') return 'ALL';
  if (typeof val === 'string' && TARGET_GROUPS.includes(val as never)) {
    return val as GroupFilter;
  }
  return 'COMSE26A';
}

function sanitizeViewMode(val: unknown): ViewMode | undefined {
  if (val === 'day' || val === 'week') return val;
  return undefined;
}

function sanitizeDay(val: unknown): DayOfWeek | undefined {
  if (typeof val === 'string' && DAYS.includes(val as DayOfWeek)) {
    return val as DayOfWeek;
  }
  return undefined;
}

export function normalizeOverlay(raw: unknown): ScheduleOverlay | null {
  if (!isRecord(raw)) return null;
  const candidate = isRecord(raw.overlay) ? raw.overlay : raw;
  if (candidate.version !== 1) return null;

  const settingsRaw = isRecord(candidate.settings) ? candidate.settings : {};
  const customTeachers = Array.isArray(candidate.customTeachers)
    ? (candidate.customTeachers as Teacher[])
    : [];
  const editedTeachers = isRecord(candidate.editedTeachers)
    ? (candidate.editedTeachers as ScheduleOverlay['editedTeachers'])
    : {};
  const deletedTeacherIds = Array.isArray(candidate.deletedTeacherIds)
    ? candidate.deletedTeacherIds.filter((id): id is string => typeof id === 'string')
    : [];
  const addedLessons = Array.isArray(candidate.addedLessons)
    ? (candidate.addedLessons as Lesson[])
    : [];
  const editedLessons = isRecord(candidate.editedLessons)
    ? (candidate.editedLessons as ScheduleOverlay['editedLessons'])
    : {};
  const deletedLessonIds = Array.isArray(candidate.deletedLessonIds)
    ? candidate.deletedLessonIds.filter((id): id is string => typeof id === 'string')
    : [];
  const pinnedSubgroups = isRecord(candidate.pinnedSubgroups)
    ? Object.fromEntries(
        Object.entries(candidate.pinnedSubgroups).filter(
          (entry): entry is [string, string] =>
            typeof entry[0] === 'string' && typeof entry[1] === 'string'
        )
      )
    : {};

  return {
    version: 1,
    updatedAt:
      typeof candidate.updatedAt === 'string'
        ? candidate.updatedAt
        : new Date().toISOString(),
    settings: {
      selectedGroup: sanitizeGroupFilter(settingsRaw.selectedGroup),
      viewMode: sanitizeViewMode(settingsRaw.viewMode),
      selectedDay: sanitizeDay(settingsRaw.selectedDay),
    },
    customTeachers,
    editedTeachers,
    deletedTeacherIds,
    addedLessons,
    editedLessons,
    deletedLessonIds,
    pinnedSubgroups,
  };
}

export function loadOverlay(): ScheduleOverlay {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyOverlay();
    const parsed = JSON.parse(raw);
    return normalizeOverlay(parsed) ?? createEmptyOverlay();
  } catch {
    return createEmptyOverlay();
  }
}

export function saveOverlay(overlay: ScheduleOverlay): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function countOverlayChanges(overlay: ScheduleOverlay): number {
  return (
    overlay.customTeachers.length +
    Object.keys(overlay.editedTeachers).length +
    overlay.deletedTeacherIds.length +
    overlay.addedLessons.length +
    Object.keys(overlay.editedLessons).length +
    overlay.deletedLessonIds.length +
    Object.keys(overlay.pinnedSubgroups).length
  );
}

export function exportOverlayJson(overlay: ScheduleOverlay): void {
  const payload = {
    app: 'aiu-p5r-schedule',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    overlay,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const datePart = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `aiu-schedule-backup-${datePart}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseImportedOverlay(
  rawText: string
): { ok: true; overlay: ScheduleOverlay } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(rawText);
    const normalized = normalizeOverlay(parsed);
    if (!normalized) {
      return {
        ok: false,
        error: 'Файл не соответствует формату резервной копии (version: 1).',
      };
    }
    return { ok: true, overlay: normalized };
  } catch {
    return {
      ok: false,
      error: 'Не удалось разобрать JSON. Проверьте корректность файла.',
    };
  }
}

export function createDeterministicSlug(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'item';
}
