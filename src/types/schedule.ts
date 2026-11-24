export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY';

export type GroupId = 'COMSE26B' | 'COMSE26A' | 'COMSEH26' | 'COMCIF26';
export type GroupFilter = GroupId | 'ALL';
export type LessonType = 'regular' | 'fixed' | 'elective' | 'advisor';
export type DayPhase = 'MORNING' | 'LUNCHTIME' | 'AFTERNOON' | 'EVENING';
export type ViewMode = 'day' | 'week';
export type ActiveTab = 'schedule' | 'teachers' | 'settings';
export type ScheduleScopeMode = 'group' | 'teacher';

export interface OfficeHour {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string | null;
}

export interface Subgroup {
  teacherId: string | null;
  teacherName: string;
  room: string;
}

export interface Teacher {
  id: string;
  name: string;
  courses: string[];
  officeHours: OfficeHour[];
  room: string | null;
  isCustom: boolean;
  notes?: string | null;
}

export interface EffectiveTeacher extends Teacher {
  isBase: boolean;
  isModified: boolean;
}

export interface Lesson {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  type: LessonType;
  groupIds: GroupId[];
  teacherId: string | null;
  teacherIds: string[];
  teacherName: string | null;
  room: string | null;
  isOnline: boolean;
  subgroups?: Subgroup[];
  notes: string | null;
  isCustom?: boolean;
}

export interface EffectiveLesson extends Lesson {
  isBase: boolean;
  isModified: boolean;
  pinnedSubgroupTeacherId: string | null;
  teacherOverrideApplied?: boolean;
  baseSubgroups?: Subgroup[];
}

export interface GroupInfo {
  id: GroupId;
  name: string;
  year: number;
  shift: string;
  weeklyHours: number;
  earliest: string | null;
  latest: string | null;
  advisor: string | null;
  advisorRoom: string | null;
}

export interface SaturdaySessionNote {
  groupsRaw: string;
  groupIds: GroupId[];
  course: string;
  details: string;
}

export interface ScheduleMeta {
  semester: string;
  generatedAt: string;
  sourceUrl: string;
  saturdayNotes: string[];
  saturdayOnlineSessions: SaturdaySessionNote[];
  oneOffSessions: SaturdaySessionNote[];
}

export interface BaseScheduleData {
  meta: ScheduleMeta;
  groups: GroupInfo[];
  teachers: Teacher[];
  lessons: Lesson[];
}

export type TeacherPatch = Partial<Omit<Teacher, 'id' | 'isCustom'>>;
export type LessonPatch = Partial<Omit<Lesson, 'id' | 'isCustom'>>;

export interface OverlaySettings {
  selectedGroup: GroupFilter;
  viewMode?: ViewMode;
  selectedDay?: DayOfWeek;
  defaultGroup?: GroupFilter;
  defaultViewMode?: ViewMode;
  pinnedGroup?: GroupId | null;
  groupPicked?: boolean;
  setupDismissed?: boolean;
  hideSaturdayConflicts?: boolean;
  reduceMotion?: boolean;
  saturdayNotesCollapsed?: boolean;
  scheduleScopeMode?: ScheduleScopeMode;
  focusedTeacherId?: string | null;
}

export interface ScheduleOverlay {
  version: 1;
  updatedAt: string;
  settings: OverlaySettings;
  customTeachers: Teacher[];
  editedTeachers: Record<string, TeacherPatch>;
  deletedTeacherIds: string[];
  addedLessons: Lesson[];
  editedLessons: Record<string, LessonPatch>;
  deletedLessonIds: string[];
  pinnedSubgroups: Record<string, string>;
  subjectTeacherOverrides?: Record<string, string>;
}

export interface ConflictItem {
  kind: 'group' | 'teacher';
  entityId: string;
  entityName: string;
  lessonId: string;
  lessonSubject: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}
