import { useEffect, useMemo, useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Check,
  MapPin,
  Pin,
  PinOff,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  DAY_ORDER,
  DAY_SHORT_RU,
  TARGET_GROUPS,
} from '../../constants/schedule';
import type {
  EffectiveLesson,
  EffectiveTeacher,
  GroupFilter,
  GroupInfo,
  ScheduleScopeMode,
  ViewMode,
} from '../../types/schedule';
import { getCursorSpring, getTapPressProps } from '../../utils/p5Motion';
import { filterLessonsByGroup } from '../../utils/time';
import { RansomTitle } from '../common/RansomTitle';

interface SettingsViewProps {
  selectedGroup: GroupFilter;
  defaultGroup: GroupFilter;
  defaultViewMode: ViewMode;
  hideSaturdayConflicts: boolean;
  sfxEnabled: boolean;
  reduceMotion: boolean;
  scheduleScopeMode: ScheduleScopeMode;
  focusedTeacherId: string | null;
  allLessons: EffectiveLesson[];
  teachers: EffectiveTeacher[];
  teachersById: Record<string, EffectiveTeacher>;
  groups: GroupInfo[];
  subjectTeacherOverrides: Record<string, string>;
  lastCreatedTeacherId: string | null;
  onSetDefaultGroup: (group: GroupFilter) => void;
  onSetDefaultViewMode: (mode: ViewMode) => void;
  onSetHideSaturdayConflicts: (hide: boolean) => void;
  onToggleSfx: () => void;
  onSetReduceMotion: (enabled: boolean) => void;
  onSetSubjectPinnedSubgroup: (subject: string, teacherId: string | null) => void;
  onSetSubjectTeacherOverride: (subject: string, teacherId: string | null) => void;
  onSetScheduleScopeMode: (
    mode: ScheduleScopeMode,
    teacherId?: string | null
  ) => void;
  onAddTeacher: () => void;
  onBackToSchedule: () => void;
}

interface StreamTeacherOption {
  teacherId: string;
  teacherName: string;
  rooms: string[];
}

interface StreamSubjectGroup {
  subjectKey: string;
  subject: string;
  slots: string[];
  lessonCount: number;
  teachers: StreamTeacherOption[];
  pinnedTeacherId: string | null;
  isPartialPin: boolean;
  overrideTeacher: EffectiveTeacher | null;
}

function P5SwitchRow({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-2 border-white/25 bg-[#050505] px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="font-condensed text-sm font-bold uppercase tracking-wide text-white">
          {label}
        </div>
        <p className="mt-0.5 text-xs leading-snug text-neutral-300">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`p5-skew shrink-0 border-2 px-3 py-1 transition-colors ${
          checked
            ? 'border-white bg-[#E60012] text-white shadow-[3px_3px_0_#050505]'
            : 'border-white/70 bg-[#060606] text-neutral-300 hover:border-white hover:text-white'
        }`}
      >
        <span className="p5-unskew block font-display text-xs uppercase tracking-wider">
          {checked ? 'ВКЛ' : 'ВЫКЛ'}
        </span>
      </button>
    </div>
  );
}

export function SettingsView({
  selectedGroup,
  defaultGroup,
  defaultViewMode,
  hideSaturdayConflicts,
  sfxEnabled,
  reduceMotion,
  scheduleScopeMode,
  focusedTeacherId,
  allLessons,
  teachers,
  teachersById,
  groups,
  subjectTeacherOverrides,
  lastCreatedTeacherId,
  onSetDefaultGroup,
  onSetDefaultViewMode,
  onSetHideSaturdayConflicts,
  onToggleSfx,
  onSetReduceMotion,
  onSetSubjectPinnedSubgroup,
  onSetSubjectTeacherOverride,
  onSetScheduleScopeMode,
  onAddTeacher,
  onBackToSchedule,
}: SettingsViewProps) {
  const reduced = useReducedMotion();
  const cursorSpring = getCursorSpring(reduced);
  const tapProps = getTapPressProps(reduced);

  const scopedLessons = useMemo(
    () => filterLessonsByGroup(allLessons, selectedGroup),
    [allLessons, selectedGroup]
  );

  // Group all stream subjects (having subgroups / baseSubgroups) by normalized subject name
  const streamSubjects = useMemo<StreamSubjectGroup[]>(() => {
    const map = new Map<
      string,
      {
        subject: string;
        lessons: EffectiveLesson[];
      }
    >();

    for (const ls of scopedLessons) {
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
  }, [scopedLessons, subjectTeacherOverrides, teachersById]);

  // All unique subjects available for arbitrary teacher override
  const allSubjectOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const ls of scopedLessons) {
      const key = ls.subject.trim().toLowerCase();
      if (!map.has(key)) map.set(key, ls.subject);
    }
    for (const ls of allLessons) {
      const key = ls.subject.trim().toLowerCase();
      if (subjectTeacherOverrides[key] && !map.has(key)) {
        map.set(key, ls.subject);
      }
    }
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [scopedLessons, allLessons, subjectTeacherOverrides]);

  const [overrideSubject, setOverrideSubject] = useState<string>(
    () => allSubjectOptions[0]?.label ?? ''
  );
  const [overrideTeacherId, setOverrideTeacherId] = useState<string>(
    () => teachers[0]?.id ?? ''
  );
  const [pickerTeacherId, setPickerTeacherId] = useState<string>(
    () => focusedTeacherId ?? teachers[0]?.id ?? ''
  );

  useEffect(() => {
    if (
      allSubjectOptions.length > 0 &&
      !allSubjectOptions.some(
        (opt) => opt.label.toLowerCase() === overrideSubject.toLowerCase()
      )
    ) {
      setOverrideSubject(allSubjectOptions[0].label);
    }
  }, [allSubjectOptions, overrideSubject]);

  useEffect(() => {
    if (lastCreatedTeacherId && teachersById[lastCreatedTeacherId]) {
      setOverrideTeacherId(lastCreatedTeacherId);
      setPickerTeacherId(lastCreatedTeacherId);
    }
  }, [lastCreatedTeacherId, teachersById]);

  useEffect(() => {
    if (focusedTeacherId && teachersById[focusedTeacherId]) {
      setPickerTeacherId(focusedTeacherId);
    }
  }, [focusedTeacherId, teachersById]);

  const activeOverrides = useMemo(() => {
    return Object.entries(subjectTeacherOverrides)
      .map(([subjectKey, teacherId]) => {
        const displaySubject =
          allSubjectOptions.find((opt) => opt.key === subjectKey)?.label ??
          subjectKey.toUpperCase();
        const teacher = teachersById[teacherId] ?? null;
        return { subjectKey, displaySubject, teacherId, teacher };
      })
      .filter((item) => Boolean(item.teacher));
  }, [subjectTeacherOverrides, allSubjectOptions, teachersById]);

  // Quick teacher shortcuts for Teacher View (pinned teachers + advisor)
  const quickScopeTeachers = useMemo(() => {
    const ids = new Set<string>();
    for (const group of streamSubjects) {
      if (group.pinnedTeacherId && teachersById[group.pinnedTeacherId]) {
        ids.add(group.pinnedTeacherId);
      }
    }
    const groupInfo =
      selectedGroup !== 'ALL'
        ? groups.find((g) => g.id === selectedGroup)
        : null;
    if (groupInfo?.advisor) {
      const advisor = teachers.find(
        (t) =>
          t.name.trim().toLowerCase() === groupInfo.advisor?.trim().toLowerCase()
      );
      if (advisor) ids.add(advisor.id);
    }
    return Array.from(ids)
      .map((id) => teachersById[id])
      .filter((t): t is EffectiveTeacher => Boolean(t));
  }, [streamSubjects, selectedGroup, groups, teachers, teachersById]);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-white border-l-[6px] border-l-[#E60012] bg-[#060606] px-4 py-3 shadow-[5px_5px_0_#050505]">
        <div className="flex flex-wrap items-center gap-3">
          <RansomTitle text="SETTINGS" as="h2" size="md" />
          <span className="p5-skew border-2 border-white bg-[#E60012] px-2.5 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-white">
            <span className="p5-unskew block">
              {selectedGroup === 'ALL' ? 'ВСЕ ГРУППЫ' : selectedGroup}
            </span>
          </span>
        </div>

        <motion.button
          type="button"
          onClick={onBackToSchedule}
          {...tapProps}
          className="p5-skew border-2 border-[#050505] bg-white px-3.5 py-1.5 text-[#050505] shadow-[4px_4px_0_#E60012] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
        >
          <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>К расписанию</span>
          </span>
        </motion.button>
      </div>

      {/* Main 2-Column P5R Settings Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        {/* LEFT COLUMN: МОИ ПРЕПОДАВАТЕЛИ */}
        <section
          aria-label="Мои преподаватели"
          className="space-y-4 lg:col-span-7"
        >
          {/* Stream Subjects Auto-Grouped */}
          <div className="space-y-3 border-2 border-white bg-[#060606] p-4 shadow-[6px_6px_0_#050505] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-white/20 pb-3">
              <div>
                <h3 className="flex items-center gap-2 font-display text-base uppercase tracking-wider text-white sm:text-lg">
                  <Pin className="h-4 w-4 text-[#FFE600]" />
                  <span>МОИ ПРЕПОДАВАТЕЛИ</span>
                </h3>
                <p className="mt-1 text-xs text-neutral-300">
                  Выберите преподавателя по потоковому предмету один раз — он
                  сразу закрепится на всех парах этого предмета за всю неделю.
                </p>
              </div>
              <span className="border border-white bg-[#E60012] px-2.5 py-1 font-condensed text-xs font-bold uppercase tracking-wider text-white">
                {streamSubjects.filter((s) => Boolean(s.pinnedTeacherId)).length}{' '}
                / {streamSubjects.length} ВЫБРАНО
              </span>
            </div>

            {streamSubjects.length === 0 ? (
              <div className="border-2 border-dashed border-white/30 bg-[#050505] p-6 text-center font-condensed text-xs font-bold uppercase tracking-wider text-neutral-400">
                Для выбранной группы потоковых предметов с подгруппами не
                найдено.
              </div>
            ) : (
              <div className="space-y-4">
                {streamSubjects.map((group) => (
                  <div
                    key={group.subjectKey}
                    className="border-2 border-white/35 bg-[#050505] p-3.5 shadow-[4px_4px_0_#000000]"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-display text-sm uppercase tracking-wide text-white sm:text-base">
                            {group.subject}
                          </h4>
                          {group.pinnedTeacherId && (
                            <span className="border border-[#050505] bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none tracking-wider text-[#050505]">
                              {group.isPartialPin
                                ? '★ ЧАСТИЧНО'
                                : '★ ЗАКРЕПЛЕН'}
                            </span>
                          )}
                          {group.overrideTeacher && (
                            <span className="border border-white bg-[#E60012] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none tracking-wider text-white">
                              ПЕРЕОПРЕДЕЛЁН: {group.overrideTeacher.name}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {group.slots.map((slot) => (
                            <span
                              key={slot}
                              className="border border-white/30 bg-[#060606] px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase tracking-wider text-neutral-200"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>

                      {group.pinnedTeacherId && (
                        <button
                          type="button"
                          onClick={() =>
                            onSetSubjectPinnedSubgroup(group.subject, null)
                          }
                          className="inline-flex items-center gap-1 border border-white/50 bg-[#060606] px-2 py-1 font-condensed text-[11px] font-bold uppercase tracking-wider text-neutral-200 transition-colors hover:border-[#E60012] hover:bg-[#E60012] hover:text-white"
                        >
                          <PinOff className="h-3 w-3" />
                          <span>Сбросить</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.teachers.map((opt) => {
                        const isSelected =
                          group.pinnedTeacherId === opt.teacherId;
                        return (
                          <button
                            key={opt.teacherId}
                            type="button"
                            onClick={() =>
                              onSetSubjectPinnedSubgroup(
                                group.subject,
                                isSelected ? null : opt.teacherId
                              )
                            }
                            className={`flex items-center justify-between gap-2 border-2 px-3 py-2 text-left transition-all ${
                              isSelected
                                ? 'border-[#FFE600] bg-[#060606] text-[#FFE600] shadow-[4px_4px_0_#E60012]'
                                : 'border-white/40 bg-[#060606] text-white hover:border-white'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate font-condensed text-sm font-bold tracking-wide">
                                {opt.teacherName}
                              </div>
                              {opt.rooms.length > 0 && (
                                <div
                                  className={`mt-0.5 inline-flex items-center gap-1 font-condensed text-[11px] font-bold uppercase ${
                                    isSelected
                                      ? 'text-[#FFE600]'
                                      : 'text-neutral-300'
                                  }`}
                                >
                                  <MapPin className="h-3 w-3 shrink-0 text-[#E60012]" />
                                  <span>{opt.rooms.join(' / ')}</span>
                                </div>
                              )}
                            </div>

                            <span
                              className={`shrink-0 px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase leading-none ${
                                isSelected
                                  ? 'bg-[#FFE600] text-[#050505]'
                                  : 'border border-white/30 text-neutral-400'
                              }`}
                            >
                              {isSelected ? '★ МОЙ' : 'ВЫБРАТЬ'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Override teacher for ANY subject + Add New Teacher */}
          <div className="space-y-3 border-2 border-white bg-[#060606] p-4 shadow-[6px_6px_0_#050505] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-white/20 pb-3">
              <div>
                <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-wider text-white sm:text-base">
                  <BookOpen className="h-4 w-4 text-[#E60012]" />
                  <span>ПЕРЕОПРЕДЕЛИТЬ ПРЕПОДАВАТЕЛЯ ДЛЯ ПРЕДМЕТА</span>
                </h3>
                <p className="mt-1 text-xs text-neutral-300">
                  Назначьте любого преподавателя (включая добавленного вручную)
                  на любой предмет расписания.
                </p>
              </div>

              <motion.button
                type="button"
                onClick={onAddTeacher}
                {...tapProps}
                className="p5-skew border-2 border-[#050505] bg-[#FFE600] px-3 py-1.5 text-[#050505] shadow-[3px_3px_0_#E60012] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
              >
                <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Новый преподаватель</span>
                </span>
              </motion.button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label
                  htmlFor="p5-override-subject"
                  className="mb-1 block font-condensed text-[11px] font-bold uppercase tracking-wider text-neutral-300"
                >
                  Предмет
                </label>
                <select
                  id="p5-override-subject"
                  value={overrideSubject}
                  onChange={(e) => setOverrideSubject(e.target.value)}
                  className="p5-input w-full px-2.5 py-2 text-xs font-semibold"
                >
                  {allSubjectOptions.map((opt) => (
                    <option key={opt.key} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label
                  htmlFor="p5-override-teacher"
                  className="mb-1 block font-condensed text-[11px] font-bold uppercase tracking-wider text-neutral-300"
                >
                  Преподаватель
                </label>
                <select
                  id="p5-override-teacher"
                  value={overrideTeacherId}
                  onChange={(e) => setOverrideTeacherId(e.target.value)}
                  className="p5-input w-full px-2.5 py-2 text-xs font-semibold"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.isCustom ? ' (Свой)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end sm:col-span-2">
                <button
                  type="button"
                  disabled={!overrideSubject || !overrideTeacherId}
                  onClick={() =>
                    onSetSubjectTeacherOverride(
                      overrideSubject,
                      overrideTeacherId
                    )
                  }
                  className="p5-skew w-full border-2 border-white bg-[#E60012] px-3 py-2 text-white shadow-[3px_3px_0_#050505] transition-colors hover:bg-white hover:text-[#050505] disabled:opacity-50"
                >
                  <span className="p5-unskew inline-flex items-center justify-center gap-1 font-condensed text-xs font-bold uppercase tracking-wider">
                    <Check className="h-3.5 w-3.5" />
                    <span>Ок</span>
                  </span>
                </button>
              </div>
            </div>

            {activeOverrides.length > 0 && (
              <div className="space-y-1.5 border-t border-white/15 pt-3">
                <div className="font-condensed text-[11px] font-bold uppercase tracking-wider text-[#FFE600]">
                  Активные переопределения ({activeOverrides.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeOverrides.map((ov) => (
                    <div
                      key={ov.subjectKey}
                      className="inline-flex items-center gap-2 border-2 border-white/60 bg-[#050505] px-2.5 py-1 text-xs"
                    >
                      <span className="font-condensed font-bold uppercase text-white">
                        {ov.displaySubject}
                      </span>
                      <span className="text-[#E60012]">→</span>
                      <span className="font-semibold text-[#FFE600]">
                        {ov.teacher?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onSetSubjectTeacherOverride(ov.displaySubject, null)
                        }
                        aria-label={`Сбросить переопределение для ${ov.displaySubject}`}
                        className="ml-1 border border-white/40 px-1.5 py-0.5 font-condensed text-[10px] font-bold uppercase text-neutral-300 transition hover:border-[#E60012] hover:bg-[#E60012] hover:text-white"
                      >
                        <RotateCcw className="inline h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scope Mode: Group vs Teacher */}
          <div className="space-y-3 border-2 border-white bg-[#060606] p-4 shadow-[6px_6px_0_#050505] sm:p-5">
            <div className="border-b-2 border-white/20 pb-3">
              <h3 className="flex items-center gap-2 font-display text-sm uppercase tracking-wider text-white sm:text-base">
                <UserCheck className="h-4 w-4 text-[#FFE600]" />
                <span>РЕЖИМ ПРОСМОТРА: ГРУППА / ПРЕПОДАВАТЕЛЬ</span>
              </h3>
              <p className="mt-1 text-xs text-neutral-300">
                В один клик переключите главный экран на расписание конкретного
                выбранного преподавателя.
              </p>
            </div>

            <LayoutGroup id="p5-settings-scope">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSetScheduleScopeMode('group')}
                  className="relative px-3.5 py-1.5 text-white"
                >
                  {scheduleScopeMode === 'group' ? (
                    <motion.div
                      layoutId="p5-scope-mode-cursor"
                      transition={cursorSpring}
                      className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white bg-[#E60012] shadow-[3px_3px_0_#050505]"
                    />
                  ) : (
                    <div className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white/60 bg-[#050505]" />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
                    <Users className="h-3.5 w-3.5" />
                    <span>По группе ({selectedGroup})</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSetScheduleScopeMode('teacher', pickerTeacherId || null)
                  }
                  className="relative px-3.5 py-1.5 text-white"
                >
                  {scheduleScopeMode === 'teacher' ? (
                    <motion.div
                      layoutId="p5-scope-mode-cursor"
                      transition={cursorSpring}
                      className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white bg-[#E60012] shadow-[3px_3px_0_#050505]"
                    />
                  ) : (
                    <div className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white/60 bg-[#050505]" />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Мой закреплённый преподаватель</span>
                  </span>
                </button>
              </div>
            </LayoutGroup>

            {quickScopeTeachers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-condensed text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Быстрый выбор:
                </span>
                {quickScopeTeachers.map((t) => {
                  const active =
                    scheduleScopeMode === 'teacher' && focusedTeacherId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setPickerTeacherId(t.id);
                        onSetScheduleScopeMode('teacher', t.id);
                      }}
                      className={`border px-2 py-0.5 font-condensed text-xs font-bold transition-colors ${
                        active
                          ? 'border-[#FFE600] bg-[#FFE600] text-[#050505]'
                          : 'border-white/50 bg-[#050505] text-white hover:border-[#FFE600] hover:text-[#FFE600]'
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <select
                aria-label="Выбор преподавателя для просмотра расписания"
                value={pickerTeacherId}
                onChange={(e) => {
                  const tid = e.target.value;
                  setPickerTeacherId(tid);
                  if (scheduleScopeMode === 'teacher') {
                    onSetScheduleScopeMode('teacher', tid);
                  }
                }}
                className="p5-input flex-1 px-3 py-2 text-xs font-semibold"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.isCustom ? ' (Свой)' : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!pickerTeacherId}
                onClick={() => {
                  onSetScheduleScopeMode('teacher', pickerTeacherId);
                  onBackToSchedule();
                }}
                className="p5-skew shrink-0 border-2 border-[#050505] bg-white px-4 py-2 text-[#050505] shadow-[4px_4px_0_#E60012] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
              >
                <span className="p5-unskew block font-condensed text-xs font-bold uppercase tracking-wider">
                  Смотреть расписание
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: ПРОФИЛЬ И ОТОБРАЖЕНИЕ */}
        <section
          aria-label="Профиль и отображение"
          className="space-y-4 border-2 border-white bg-[#060606] p-4 shadow-[6px_6px_0_#050505] sm:p-5 lg:col-span-5"
        >
          <div className="border-b-2 border-white/20 pb-3">
            <h3 className="flex items-center gap-2 font-display text-base uppercase tracking-wider text-white sm:text-lg">
              <SlidersHorizontal className="h-4 w-4 text-[#E60012]" />
              <span>ПРОФИЛЬ И ОТОБРАЖЕНИЕ</span>
            </h3>
            <p className="mt-1 text-xs text-neutral-300">
              Параметры сохраняются локально в `localStorage` и не сбрасываются
              при обновлении данных.
            </p>
          </div>

          {/* Default Group */}
          <div className="space-y-2">
            <div className="font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
              Группа по умолчанию
            </div>
            <div className="flex flex-wrap gap-1.5">
              {([...TARGET_GROUPS, 'ALL'] as GroupFilter[]).map((gid) => {
                const active = defaultGroup === gid;
                return (
                  <button
                    key={gid}
                    type="button"
                    onClick={() => onSetDefaultGroup(gid)}
                    className={`p5-skew border-2 px-3 py-1.5 transition-colors ${
                      active
                        ? 'border-white bg-[#E60012] text-white shadow-[3px_3px_0_#050505]'
                        : 'border-white/50 bg-[#050505] text-white hover:border-white'
                    }`}
                  >
                    <span className="p5-unskew block font-condensed text-xs font-bold uppercase tracking-wider">
                      {gid === 'ALL' ? 'ВСЕ' : gid}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default View Mode */}
          <div className="space-y-2">
            <div className="font-condensed text-xs font-bold uppercase tracking-wider text-neutral-200">
              Вид по умолчанию
            </div>
            <div className="flex gap-2">
              {(
                [
                  { id: 'day', label: 'День' },
                  { id: 'week', label: 'Неделя' },
                ] as const
              ).map((mode) => {
                const active = defaultViewMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onSetDefaultViewMode(mode.id)}
                    className={`p5-skew flex-1 border-2 px-3 py-1.5 transition-colors ${
                      active
                        ? 'border-[#050505] bg-white text-[#050505] shadow-[3px_3px_0_#E60012]'
                        : 'border-white/50 bg-[#050505] text-white hover:border-white'
                    }`}
                  >
                    <span className="p5-unskew block font-condensed text-xs font-bold uppercase tracking-wider">
                      {mode.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-1">
            <P5SwitchRow
              label="Скрывать спорные субботние очные пары"
              description="Временно скрывает очные субботние пары с флагом конфликта без удаления; онлайн-пара Manas Studies остаётся видимой."
              checked={hideSaturdayConflicts}
              onToggle={() =>
                onSetHideSaturdayConflicts(!hideSaturdayConflicts)
              }
            />

            <div className="flex items-center justify-between gap-3 border-2 border-white/25 bg-[#050505] px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-condensed text-sm font-bold uppercase tracking-wide text-white">
                  {sfxEnabled ? (
                    <Volume2 className="h-3.5 w-3.5 text-[#FFE600]" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 text-neutral-400" />
                  )}
                  <span>Звук меню (SFX)</span>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-neutral-300">
                  Синтезированные звуки навигации в стиле Persona 5.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={sfxEnabled}
                onClick={onToggleSfx}
                className={`p5-skew shrink-0 border-2 px-3 py-1 transition-colors ${
                  sfxEnabled
                    ? 'border-white bg-[#E60012] text-white shadow-[3px_3px_0_#050505]'
                    : 'border-white/70 bg-[#060606] text-neutral-300 hover:border-white hover:text-white'
                }`}
              >
                <span className="p5-unskew block font-display text-xs uppercase tracking-wider">
                  {sfxEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 border-2 border-white/25 bg-[#050505] px-3.5 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-condensed text-sm font-bold uppercase tracking-wide text-white">
                  <Sparkles className="h-3.5 w-3.5 text-[#E60012]" />
                  <span>Уменьшить анимации</span>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-neutral-300">
                  Отключает прыгающие пружины, диагональные slash-переходы и
                  наклоны карточек.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={reduceMotion}
                onClick={() => onSetReduceMotion(!reduceMotion)}
                className={`p5-skew shrink-0 border-2 px-3 py-1 transition-colors ${
                  reduceMotion
                    ? 'border-white bg-[#E60012] text-white shadow-[3px_3px_0_#050505]'
                    : 'border-white/70 bg-[#060606] text-neutral-300 hover:border-white hover:text-white'
                }`}
              >
                <span className="p5-unskew block font-display text-xs uppercase tracking-wider">
                  {reduceMotion ? 'ВКЛ' : 'ВЫКЛ'}
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
