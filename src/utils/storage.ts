import { DAYS, STORAGE_KEY, TARGET_GROUPS } from '../constants/schedule';
import type {
  DayOfWeek,
  GroupFilter,
  GroupId,
  Lesson,
  ScheduleOverlay,
  ScheduleScopeMode,
  Teacher,
  ViewMode,
} from '../types/schedule';

export function createEmptyOverlay(): ScheduleOverlay {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    settings: {
      selectedGroup: 'ALL',
      defaultGroup: 'ALL',
      pinnedGroup: null,
      groupPicked: false,
      setupDismissed: false,
      hideSaturdayConflicts: false,
      reduceMotion: false,
      saturdayNotesCollapsed: false,
      scheduleScopeMode: 'group',
      focusedTeacherId: null,
    },
    customTeachers: [],
    editedTeachers: {},
    deletedTeacherIds: [],
    addedLessons: [],
    editedLessons: {},
    deletedLessonIds: [],
    pinnedSubgroups: {},
    subjectTeacherOverrides: {},
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
  return 'ALL';
}

function sanitizePinnedGroup(val: unknown): GroupId | null {
  if (typeof val === 'string' && TARGET_GROUPS.includes(val as GroupId)) {
    return val as GroupId;
  }
  return null;
}

function sanitizeOptionalGroupFilter(val: unknown): GroupFilter | undefined {
  if (val === undefined) return undefined;
  return sanitizeGroupFilter(val);
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

function sanitizeScopeMode(val: unknown): ScheduleScopeMode {
  return val === 'teacher' ? 'teacher' : 'group';
}

function sanitizeStringRecord(val: unknown): Record<string, string> {
  if (!isRecord(val)) return {};
  return Object.fromEntries(
    Object.entries(val).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === 'string' && typeof entry[1] === 'string'
    )
  );
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
  const pinnedSubgroups = sanitizeStringRecord(candidate.pinnedSubgroups);
  const subjectTeacherOverrides = sanitizeStringRecord(
    candidate.subjectTeacherOverrides
  );

  const selectedGroup = sanitizeGroupFilter(settingsRaw.selectedGroup);
  const defaultGroup =
    sanitizeOptionalGroupFilter(settingsRaw.defaultGroup) ?? selectedGroup;
  const pinnedGroup =
    'pinnedGroup' in settingsRaw
      ? sanitizePinnedGroup(settingsRaw.pinnedGroup)
      : defaultGroup !== 'ALL'
        ? defaultGroup
        : null;
  const setupDismissed =
    typeof settingsRaw.setupDismissed === 'boolean'
      ? settingsRaw.setupDismissed
      : Boolean(pinnedGroup && Object.keys(pinnedSubgroups).length > 0);
  const groupPicked =
    typeof settingsRaw.groupPicked === 'boolean'
      ? settingsRaw.groupPicked
      : true;

  return {
    version: 1,
    updatedAt:
      typeof candidate.updatedAt === 'string'
        ? candidate.updatedAt
        : new Date().toISOString(),
    settings: {
      selectedGroup,
      viewMode: sanitizeViewMode(settingsRaw.viewMode),
      selectedDay: sanitizeDay(settingsRaw.selectedDay),
      defaultGroup,
      defaultViewMode: sanitizeViewMode(settingsRaw.defaultViewMode),
      pinnedGroup,
      groupPicked,
      setupDismissed,
      hideSaturdayConflicts: Boolean(settingsRaw.hideSaturdayConflicts),
      reduceMotion: Boolean(settingsRaw.reduceMotion),
      saturdayNotesCollapsed: Boolean(settingsRaw.saturdayNotesCollapsed),
      scheduleScopeMode: sanitizeScopeMode(settingsRaw.scheduleScopeMode),
      focusedTeacherId:
        typeof settingsRaw.focusedTeacherId === 'string' &&
        settingsRaw.focusedTeacherId.trim() !== ''
          ? settingsRaw.focusedTeacherId
          : null,
    },
    customTeachers,
    editedTeachers,
    deletedTeacherIds,
    addedLessons,
    editedLessons,
    deletedLessonIds,
    pinnedSubgroups,
    subjectTeacherOverrides,
  };
}

export function loadOverlay(): ScheduleOverlay {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyOverlay();
    const parsed = JSON.parse(raw);
    const normalized = normalizeOverlay(parsed);
    if (!normalized) return createEmptyOverlay();
    if (normalized.settings.pinnedGroup) {
      return {
        ...normalized,
        settings: {
          ...normalized.settings,
          selectedGroup: normalized.settings.pinnedGroup,
          scheduleScopeMode: 'group',
        },
      };
    }
    return normalized;
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
    Object.keys(overlay.pinnedSubgroups).length +
    Object.keys(overlay.subjectTeacherOverrides ?? {}).length
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
