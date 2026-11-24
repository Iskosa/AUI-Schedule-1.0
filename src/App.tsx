import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  m,
  useReducedMotion,
} from 'framer-motion';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { P5TransitionSlash } from './components/common/P5TransitionSlash';
import { AppShell } from './components/layout/AppShell';
import { LiveHudBar } from './components/layout/LiveHudBar';
import { DayView } from './components/schedule/DayView';
import { GroupOnboardingBanner } from './components/schedule/GroupOnboardingBanner';
import { LessonDetailModal } from './components/schedule/LessonDetailModal';
import { ScheduleToolbar } from './components/schedule/ScheduleToolbar';
import { WeekView } from './components/schedule/WeekView';
import { DAYS, TARGET_GROUPS } from './constants/schedule';
import {
  useScheduleStore,
  type LessonDraftInput,
  type TeacherDraftInput,
} from './hooks/useScheduleStore';
import type {
  ActiveTab,
  DayOfWeek,
  EffectiveLesson,
  EffectiveTeacher,
  GroupFilter,
  GroupId,
  ViewMode,
} from './types/schedule';
import {
  isSfxEnabled,
  playCancel,
  playConfirm,
  playOpen,
  playSwitch,
  toggleSfx,
} from './utils/p5Sound';
import { extractStreamSubjects, getPinnedTeacherIds } from './utils/streams';
import {
  computeLiveHudState,
  filterLessonsByGroup,
  getDefaultStudyDay,
  getWeekdayOrSunday,
} from './utils/time';

const TeachersView = lazy(() =>
  import('./components/teachers/TeachersView').then((mod) => ({
    default: mod.TeachersView,
  }))
);
const SettingsView = lazy(() =>
  import('./components/settings/SettingsView').then((mod) => ({
    default: mod.SettingsView,
  }))
);
const P5MenuOverlay = lazy(() =>
  import('./components/layout/P5MenuOverlay').then((mod) => ({
    default: mod.P5MenuOverlay,
  }))
);
const BackupModal = lazy(() =>
  import('./components/common/BackupModal').then((mod) => ({
    default: mod.BackupModal,
  }))
);
const LessonEditorModal = lazy(() =>
  import('./components/schedule/LessonEditorModal').then((mod) => ({
    default: mod.LessonEditorModal,
  }))
);
const TeacherEditorModal = lazy(() =>
  import('./components/teachers/TeacherEditorModal').then((mod) => ({
    default: mod.TeacherEditorModal,
  }))
);
const QuickSetupModal = lazy(() =>
  import('./components/schedule/QuickSetupModal').then((mod) => ({
    default: mod.QuickSetupModal,
  }))
);

type ConfirmState =
  | { kind: 'deleteLesson'; lesson: EffectiveLesson }
  | { kind: 'deleteTeacher'; teacher: EffectiveTeacher }
  | { kind: 'resetExcel' }
  | null;

function useActivated(active: boolean): boolean {
  const [activated, setActivated] = useState(active);
  if (active && !activated) {
    setActivated(true);
  }
  return activated;
}

function TabLoadingFallback() {
  return (
    <div className="flex min-h-[260px] items-center justify-center p-6">
      <div className="p5-skew border-2 border-white bg-[#060606] px-5 py-3 shadow-[4px_4px_0_#E60012]">
        <div className="p5-unskew flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-[#E60012]" />
          <span className="font-condensed text-xs font-bold uppercase tracking-wider text-white">
            Загрузка раздела...
          </span>
        </div>
      </div>
    </div>
  );
}

function computeLiveDaySnapshot(lessons: EffectiveLesson[]) {
  const now = new Date();
  const todayDay = getWeekdayOrSunday(now);
  const currentIds = computeLiveHudState(now, lessons, 'ALL').currentLessons.map(
    (ls) => ls.id
  );
  currentIds.sort();
  return {
    todayDay,
    currentIdsKey: currentIds.join('|'),
    currentLessonIds: new Set(currentIds),
  };
}

export default function App() {
  const store = useScheduleStore();
  const systemReduced = useReducedMotion();
  const reduced = store.reduceMotion || systemReduced;

  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [menuOpen, setMenuOpen] = useState(false);
  const [slashId, setSlashId] = useState(0);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
  const [lastCreatedTeacherId, setLastCreatedTeacherId] = useState<
    string | null
  >(null);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => isSfxEnabled());

  const [detailLessonId, setDetailLessonId] = useState<string | null>(null);
  const [lessonEditorState, setLessonEditorState] = useState<{
    open: boolean;
    editingLesson: EffectiveLesson | null;
    defaultDay: DayOfWeek;
  }>({
    open: false,
    editingLesson: null,
    defaultDay: store.selectedDay,
  });

  const [teacherEditorState, setTeacherEditorState] = useState<{
    open: boolean;
    editingTeacher: EffectiveTeacher | null;
  }>({
    open: false,
    editingTeacher: null,
  });

  const [backupOpen, setBackupOpen] = useState(false);
  const [quickSetupOpen, setQuickSetupOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const menuActivated = useActivated(menuOpen);
  const lessonEditorActivated = useActivated(lessonEditorState.open);
  const teacherEditorActivated = useActivated(teacherEditorState.open);
  const backupActivated = useActivated(backupOpen);
  const quickSetupActivated = useActivated(quickSetupOpen);

  useEffect(() => {
    document.documentElement.classList.toggle(
      'p5-reduce-motion',
      store.reduceMotion
    );
  }, [store.reduceMotion]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const [liveSnapshot, setLiveSnapshot] = useState(() =>
    computeLiveDaySnapshot(store.lessons)
  );

  useEffect(() => {
    let timeoutId: number | undefined;

    const sync = () => {
      const next = computeLiveDaySnapshot(store.lessons);
      setLiveSnapshot((prev) =>
        prev.todayDay === next.todayDay &&
        prev.currentIdsKey === next.currentIdsKey
          ? prev
          : next
      );
    };

    const scheduleNext = () => {
      const current = new Date();
      const msUntilNextMinute =
        60_000 - (current.getSeconds() * 1000 + current.getMilliseconds()) + 50;
      timeoutId = window.setTimeout(() => {
        sync();
        scheduleNext();
      }, msUntilNextMinute);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        sync();
        scheduleNext();
      }
    };

    sync();
    scheduleNext();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [store.lessons]);

  const { todayDay, currentLessonIds } = liveSnapshot;

  const detailLesson = detailLessonId
    ? store.lessons.find((ls) => ls.id === detailLessonId) ?? null
    : null;

  const focusedTeacherName = store.focusedTeacherId
    ? store.teachersById[store.focusedTeacherId]?.name ?? null
    : null;

  const streamStats = useMemo(() => {
    const scoped = filterLessonsByGroup(store.allLessons, store.selectedGroup);
    const groups = extractStreamSubjects(
      scoped,
      store.teachersById,
      store.subjectTeacherOverrides
    );
    return {
      total: groups.length,
      pinned: groups.filter((g) => Boolean(g.pinnedTeacherId)).length,
    };
  }, [store.allLessons, store.selectedGroup, store.teachersById, store.subjectTeacherOverrides]);

  const pinnedTeacherIds = useMemo(
    () => getPinnedTeacherIds(store.allLessons),
    [store.allLessons]
  );

  const triggerSlash = useCallback(() => {
    setSlashId((n) => n + 1);
  }, []);

  const handlePinGroup = useCallback(
    (group: GroupId | null) => {
      playConfirm();
      store.pinGroup(group);
      setToast(
        group
          ? `Группа ${group} закреплена`
          : 'Закрепление группы снято'
      );
    },
    [store]
  );

  const handleSetSubjectPinnedSubgroup = useCallback(
    (subject: string, teacherId: string | null) => {
      playConfirm();
      store.setSubjectPinnedSubgroup(subject, teacherId);
      setToast(
        teacherId
          ? `Преподаватель закреплён для «${subject}»`
          : `Закрепление для «${subject}» сброшено`
      );
    },
    [store]
  );

  const handleShowTeacherSchedule = useCallback(
    (teacherId: string) => {
      playSwitch();
      store.setScheduleScopeMode('teacher', teacherId);
      if (activeTab !== 'schedule') {
        triggerSlash();
        setActiveTab('schedule');
      }
    },
    [activeTab, store, triggerSlash]
  );

  const handleToggleSfx = () => {
    setSfxEnabled(toggleSfx());
  };

  const handleTabChange = useCallback(
    (tab: ActiveTab) => {
      if (tab !== activeTab) {
        playSwitch();
        triggerSlash();
      }
      setActiveTab(tab);
    },
    [activeTab, triggerSlash]
  );

  const handleSelectGroup = useCallback(
    (group: GroupFilter) => {
      if (group !== store.selectedGroup || store.scheduleScopeMode !== 'group') {
        playSwitch();
        triggerSlash();
      }
      store.setSelectedGroup(group);
    },
    [store, triggerSlash]
  );

  const handleChangeViewMode = (mode: ViewMode) => {
    if (mode !== store.viewMode) playSwitch();
    store.setViewMode(mode);
  };

  const handleSelectDay = useCallback(
    (day: DayOfWeek) => {
      if (day !== store.selectedDay) playSwitch();
      store.setSelectedDay(day);
    },
    [store]
  );

  const handleJumpToToday = useCallback(() => {
    const studyToday = getDefaultStudyDay(new Date());
    playSwitch();
    store.setSelectedDay(studyToday);
    if (activeTab !== 'schedule') {
      triggerSlash();
      setActiveTab('schedule');
    }
  }, [activeTab, store, triggerSlash]);

  const handleSelectTeacher = (teacherId: string | null) => {
    if (teacherId) {
      playSwitch();
    } else {
      playCancel();
    }
    setSelectedTeacherId(teacherId);
  };

  const handleOpenTeacher = (teacherId: string) => {
    playSwitch();
    if (activeTab !== 'teachers') {
      triggerSlash();
    }
    setDetailLessonId(null);
    setSelectedTeacherId(teacherId);
    setActiveTab('teachers');
  };

  const handleOpenLessonDetail = (lesson: EffectiveLesson) => {
    playOpen();
    setDetailLessonId(lesson.id);
  };

  const handleSaveLesson = (
    draft: LessonDraftInput,
    editingLesson: EffectiveLesson | null
  ) => {
    if (editingLesson) {
      store.updateLesson(editingLesson, draft);
      setToast('Пара обновлена');
    } else {
      store.addLesson(draft);
      setToast('Новая пара добавлена');
    }
    setLessonEditorState((prev) => ({ ...prev, open: false }));
    playConfirm();
  };

  const handleSaveTeacher = (
    draft: TeacherDraftInput,
    editingTeacher: EffectiveTeacher | null
  ) => {
    if (editingTeacher) {
      store.updateTeacher(editingTeacher, draft);
      setToast('Карточка преподавателя обновлена');
    } else {
      const created = store.addTeacher(draft);
      setSelectedTeacherId(created.id);
      setLastCreatedTeacherId(created.id);
      setToast('Преподаватель добавлен');
    }
    setTeacherEditorState((prev) => ({ ...prev, open: false }));
    playConfirm();
  };

  const handleConfirmAction = () => {
    if (!confirmState) return;
    if (confirmState.kind === 'deleteLesson') {
      store.deleteLesson(confirmState.lesson);
      if (detailLessonId === confirmState.lesson.id) {
        setDetailLessonId(null);
      }
      setToast(
        confirmState.lesson.isBase
          ? 'Базовая пара скрыта через overlay'
          : 'Пара удалена'
      );
    } else if (confirmState.kind === 'deleteTeacher') {
      store.deleteTeacher(confirmState.teacher);
      if (selectedTeacherId === confirmState.teacher.id) {
        setSelectedTeacherId(null);
      }
      setToast(
        confirmState.teacher.isCustom
          ? 'Преподаватель удалён'
          : 'Преподаватель скрыт через overlay'
      );
    } else if (confirmState.kind === 'resetExcel') {
      store.resetToExcel();
      setDetailLessonId(null);
      setBackupOpen(false);
      setToast('Локальные правки сброшены к данным из Excel');
    }
    playConfirm();
    setConfirmState(null);
  };

  // Global desktop keyboard shortcuts: Esc (Pause Menu), 1-4 (Groups), ArrowLeft/Right (Days)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable = Boolean(
        target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable)
      );
      if (isEditable) return;

      const hasOpenModal = Boolean(
        detailLessonId ||
          lessonEditorState.open ||
          teacherEditorState.open ||
          backupOpen ||
          quickSetupOpen ||
          confirmState
      );

      if (e.key === 'Escape') {
        if (hasOpenModal) return;
        e.preventDefault();
        setMenuOpen((prev) => {
          const next = !prev;
          if (next) {
            playOpen();
          } else {
            playCancel();
          }
          return next;
        });
        return;
      }

      if (menuOpen || hasOpenModal || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1;
        const targetGroup = TARGET_GROUPS[idx];
        if (!targetGroup) return;
        e.preventDefault();
        if (activeTab !== 'schedule') {
          setActiveTab('schedule');
          triggerSlash();
        }
        handleSelectGroup(targetGroup);
        return;
      }

      if (
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
        activeTab === 'schedule' &&
        store.viewMode === 'day'
      ) {
        e.preventDefault();
        const currIdx = DAYS.indexOf(store.selectedDay);
        const safeIdx = currIdx === -1 ? 0 : currIdx;
        const delta = e.key === 'ArrowRight' ? 1 : -1;
        const nextDay = DAYS[(safeIdx + delta + DAYS.length) % DAYS.length];
        handleSelectDay(nextDay);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeTab,
    backupOpen,
    confirmState,
    detailLessonId,
    handleSelectDay,
    handleSelectGroup,
    lessonEditorState.open,
    menuOpen,
    quickSetupOpen,
    store.selectedDay,
    store.viewMode,
    teacherEditorState.open,
    triggerSlash,
  ]);

  if (store.loading && !store.baseData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6 text-white">
        <div className="p5-skew border-2 border-white bg-[#060606] px-6 py-4 shadow-[5px_5px_0_#E60012]">
          <div className="p5-unskew flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#E60012]" />
            <span className="font-condensed text-sm font-bold uppercase tracking-wider">
              Загрузка расписания...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (store.error && !store.baseData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
        <div className="max-w-md space-y-3 border-2 border-[#E60012] bg-[#060606] p-6 text-center shadow-[5px_5px_0_#E60012]">
          <AlertCircle className="mx-auto h-8 w-8 text-[#E60012]" />
          <h1 className="font-display text-base uppercase text-white">
            Ошибка загрузки данных
          </h1>
          <p className="text-sm text-neutral-200">{store.error}</p>
          <button
            type="button"
            onClick={() => void store.reloadBaseData()}
            className="p5-skew inline-block border-2 border-white bg-[#E60012] px-4 py-2 text-white shadow-[4px_4px_0_#050505] transition-transform hover:-translate-y-0.5 hover:bg-white hover:text-[#050505]"
          >
            <span className="p5-unskew inline-flex items-center gap-2 font-condensed text-sm font-bold uppercase tracking-wider">
              <RefreshCw className="h-4 w-4" />
              <span>Повторить</span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  const scheduleContentKey = `${store.selectedGroup}-${store.scheduleScopeMode}-${
    store.focusedTeacherId ?? 'none'
  }-${store.viewMode}-${store.viewMode === 'day' ? store.selectedDay : 'week'}`;

  return (
    <MotionConfig reducedMotion={store.reduceMotion ? 'always' : 'user'}>
      <P5TransitionSlash slashId={slashId} />

      <AppShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        semester={store.baseData?.meta.semester}
        teacherCount={store.teachers.length}
        overlayChangeCount={store.overlayChangeCount}
        sfxEnabled={sfxEnabled}
        onToggleSfx={handleToggleSfx}
        menuOpen={menuOpen}
        onOpenMenu={() => {
          playOpen();
          setMenuOpen(true);
        }}
        hud={
          <LiveHudBar
            lessons={store.lessons}
            selectedGroup={store.selectedGroup}
            selectedDay={store.selectedDay}
            viewMode={store.viewMode}
            showSelectedDayChip={activeTab === 'schedule'}
            scopeMode={store.scheduleScopeMode}
            focusedTeacherId={store.focusedTeacherId}
            onSelectLesson={handleOpenLessonDetail}
            onJumpToToday={handleJumpToToday}
          />
        }
      >
        {activeTab === 'schedule' ? (
          <div key="tab-schedule" className="space-y-4">
            {!store.setupDismissed &&
              (!store.pinnedGroup || streamStats.pinned < streamStats.total) && (
                <GroupOnboardingBanner
                  groups={store.baseData?.groups ?? []}
                  pinnedGroup={store.pinnedGroup}
                  pinnedSubjectsCount={streamStats.pinned}
                  totalStreamSubjectsCount={streamStats.total}
                  onPinGroup={(gid) => handlePinGroup(gid)}
                  onOpenQuickSetup={() => {
                    playOpen();
                    setQuickSetupOpen(true);
                  }}
                  onDismiss={() => {
                    playCancel();
                    store.setSetupDismissed(true);
                  }}
                />
              )}

            <ScheduleToolbar
              selectedGroup={store.selectedGroup}
              pinnedGroup={store.pinnedGroup}
              onSelectGroup={handleSelectGroup}
              onPinGroup={(gid) => handlePinGroup(gid)}
              groups={store.baseData?.groups ?? []}
              teachers={store.teachers}
              onOpenTeacher={handleOpenTeacher}
              viewMode={store.viewMode}
              onChangeViewMode={handleChangeViewMode}
              pinnedSubjectsCount={streamStats.pinned}
              totalStreamSubjectsCount={streamStats.total}
              onOpenQuickSetup={() => {
                playOpen();
                setQuickSetupOpen(true);
              }}
              scheduleScopeMode={store.scheduleScopeMode}
              focusedTeacherName={focusedTeacherName}
              onClearTeacherScope={() => {
                playSwitch();
                triggerSlash();
                store.setScheduleScopeMode('group');
              }}
              onAddLesson={() => {
                playOpen();
                setLessonEditorState({
                  open: true,
                  editingLesson: null,
                  defaultDay: store.selectedDay,
                });
              }}
            />

            <div key={scheduleContentKey}>
              {store.viewMode === 'day' ? (
                <DayView
                  selectedDay={store.selectedDay}
                  todayDay={todayDay}
                  onSelectDay={handleSelectDay}
                  lessons={store.lessons}
                  selectedGroup={store.selectedGroup}
                  scopeMode={store.scheduleScopeMode}
                  focusedTeacherId={store.focusedTeacherId}
                  saturdayNotes={store.baseData?.meta.saturdayNotes ?? []}
                  saturdayNotesCollapsed={store.saturdayNotesCollapsed}
                  onToggleSaturdayNotes={() => {
                    playSwitch();
                    store.setSaturdayNotesCollapsed(
                      !store.saturdayNotesCollapsed
                    );
                  }}
                  currentLessonIds={currentLessonIds}
                  onSelectLesson={handleOpenLessonDetail}
                  onAddLessonForDay={(day) => {
                    playOpen();
                    setLessonEditorState({
                      open: true,
                      editingLesson: null,
                      defaultDay: day,
                    });
                  }}
                />
              ) : (
                <WeekView
                  lessons={store.lessons}
                  selectedGroup={store.selectedGroup}
                  scopeMode={store.scheduleScopeMode}
                  focusedTeacherId={store.focusedTeacherId}
                  todayDay={todayDay}
                  currentLessonIds={currentLessonIds}
                  onSelectLesson={handleOpenLessonDetail}
                  onFocusDay={(day) => {
                    playSwitch();
                    store.setSelectedDay(day);
                    store.setViewMode('day');
                  }}
                />
              )}
            </div>
          </div>
        ) : activeTab === 'teachers' ? (
          <div key="tab-teachers">
            <Suspense fallback={<TabLoadingFallback />}>
              <TeachersView
                teachers={store.teachers}
                lessons={store.lessons}
                allLessons={store.allLessons}
                groups={store.baseData?.groups ?? []}
                teachersById={store.teachersById}
                subjectTeacherOverrides={store.subjectTeacherOverrides}
                targetGroupTeacherIds={store.targetGroupTeacherIds}
                pinnedGroup={store.pinnedGroup}
                pinnedTeacherIds={pinnedTeacherIds}
                selectedTeacherId={selectedTeacherId}
                onSelectTeacher={handleSelectTeacher}
                onAddTeacher={() => {
                  playOpen();
                  setTeacherEditorState({ open: true, editingTeacher: null });
                }}
                onEditTeacher={(teacher) => {
                  playOpen();
                  setTeacherEditorState({
                    open: true,
                    editingTeacher: teacher,
                  });
                }}
                onDeleteTeacher={(teacher) => {
                  playOpen();
                  setConfirmState({ kind: 'deleteTeacher', teacher });
                }}
                onSelectLesson={handleOpenLessonDetail}
                onSetSubjectPinnedSubgroup={handleSetSubjectPinnedSubgroup}
                onShowTeacherSchedule={handleShowTeacherSchedule}
              />
            </Suspense>
          </div>
        ) : (
          <div key="tab-settings">
            <Suspense fallback={<TabLoadingFallback />}>
              <SettingsView
                selectedGroup={store.selectedGroup}
                pinnedGroup={store.pinnedGroup}
                defaultGroup={store.defaultGroup}
                defaultViewMode={store.defaultViewMode ?? store.viewMode}
                hideSaturdayConflicts={store.hideSaturdayConflicts}
                sfxEnabled={sfxEnabled}
                reduceMotion={store.reduceMotion}
                scheduleScopeMode={store.scheduleScopeMode}
                focusedTeacherId={store.focusedTeacherId}
                allLessons={store.allLessons}
                teachers={store.teachers}
                teachersById={store.teachersById}
                groups={store.baseData?.groups ?? []}
                subjectTeacherOverrides={store.subjectTeacherOverrides}
                lastCreatedTeacherId={lastCreatedTeacherId}
                onPinGroup={handlePinGroup}
                onSetDefaultGroup={(group) => {
                  playConfirm();
                  store.setDefaultGroup(group);
                  setToast(`Группа по умолчанию: ${group === 'ALL' ? 'ВСЕ' : group}`);
                }}
                onSetDefaultViewMode={(mode) => {
                  playConfirm();
                  store.setDefaultViewMode(mode);
                  setToast(
                    `Вид по умолчанию: ${mode === 'day' ? 'День' : 'Неделя'}`
                  );
                }}
                onSetHideSaturdayConflicts={(hide) => {
                  playSwitch();
                  store.setHideSaturdayConflicts(hide);
                  setToast(
                    hide
                      ? 'Спорные субботние очные пары скрыты'
                      : 'Спорные субботние очные пары снова показаны'
                  );
                }}
                onToggleSfx={handleToggleSfx}
                onSetReduceMotion={(enabled) => {
                  playSwitch();
                  store.setReduceMotion(enabled);
                  setToast(
                    enabled
                      ? 'Анимации уменьшены'
                      : 'Полная кинетика P5R включена'
                  );
                }}
                onSetSubjectPinnedSubgroup={handleSetSubjectPinnedSubgroup}
                onSetSubjectTeacherOverride={(subject, teacherId) => {
                  playConfirm();
                  store.setSubjectTeacherOverride(subject, teacherId);
                  setToast(
                    teacherId
                      ? `Преподаватель для «${subject}» переопределён`
                      : `Переопределение для «${subject}» снято`
                  );
                }}
                onSetScheduleScopeMode={(mode, teacherId) => {
                  playSwitch();
                  store.setScheduleScopeMode(mode, teacherId);
                }}
                onAddTeacher={() => {
                  playOpen();
                  setTeacherEditorState({ open: true, editingTeacher: null });
                }}
                onBackToSchedule={() => handleTabChange('schedule')}
              />
            </Suspense>
          </div>
        )}
      </AppShell>

      {menuActivated && (
        <Suspense fallback={null}>
          <P5MenuOverlay
            open={menuOpen}
            onClose={() => {
              playCancel();
              setMenuOpen(false);
            }}
            activeTab={activeTab}
            selectedGroup={store.selectedGroup}
            pinnedGroup={store.pinnedGroup}
            scheduleScopeMode={store.scheduleScopeMode}
            focusedTeacherName={focusedTeacherName}
            teacherCount={store.teachers.length}
            pinnedSubjectsCount={streamStats.pinned}
            totalStreamSubjectsCount={streamStats.total}
            overrideCount={Object.keys(store.subjectTeacherOverrides).length}
            overlayChangeCount={store.overlayChangeCount}
            hideSaturdayConflicts={store.hideSaturdayConflicts}
            sfxEnabled={sfxEnabled}
            onToggleSfx={handleToggleSfx}
            onSelectSchedule={() => {
              setMenuOpen(false);
              handleTabChange('schedule');
            }}
            onSelectTeachers={() => {
              setMenuOpen(false);
              handleTabChange('teachers');
            }}
            onSelectSettings={() => {
              setMenuOpen(false);
              handleTabChange('settings');
            }}
            onAddLesson={() => {
              setMenuOpen(false);
              setLessonEditorState({
                open: true,
                editingLesson: null,
                defaultDay: store.selectedDay,
              });
            }}
            onOpenBackup={() => {
              setMenuOpen(false);
              setBackupOpen(true);
            }}
            onOpenQuickSetup={() => {
              setMenuOpen(false);
              playOpen();
              setQuickSetupOpen(true);
            }}
          />
        </Suspense>
      )}

      <LessonDetailModal
        lesson={detailLesson}
        teachersById={store.teachersById}
        onClose={() => {
          playCancel();
          setDetailLessonId(null);
        }}
        onEdit={(lesson) => {
          playOpen();
          setDetailLessonId(null);
          setLessonEditorState({
            open: true,
            editingLesson: lesson,
            defaultDay: lesson.day,
          });
        }}
        onDelete={(lesson) => {
          playOpen();
          setConfirmState({ kind: 'deleteLesson', lesson });
        }}
        onTogglePinSubgroup={(lessonId, teacherId) => {
          store.togglePinSubgroup(lessonId, teacherId);
          playConfirm();
          setToast('Преподаватель обновлён на все пары предмета');
        }}
        onOpenTeacher={handleOpenTeacher}
      />

      {lessonEditorActivated && (
        <Suspense fallback={null}>
          <LessonEditorModal
            open={lessonEditorState.open}
            editingLesson={lessonEditorState.editingLesson}
            defaultDay={lessonEditorState.defaultDay}
            defaultGroup={
              store.selectedGroup === 'ALL'
                ? store.pinnedGroup ?? 'COMSE26A'
                : store.selectedGroup
            }
            teachers={store.teachers}
            teachersById={store.teachersById}
            existingLessons={store.allLessons}
            onClose={() => {
              playCancel();
              setLessonEditorState((prev) => ({ ...prev, open: false }));
            }}
            onSave={handleSaveLesson}
          />
        </Suspense>
      )}

      {teacherEditorActivated && (
        <Suspense fallback={null}>
          <TeacherEditorModal
            open={teacherEditorState.open}
            editingTeacher={teacherEditorState.editingTeacher}
            onClose={() => {
              playCancel();
              setTeacherEditorState((prev) => ({ ...prev, open: false }));
            }}
            onSave={handleSaveTeacher}
          />
        </Suspense>
      )}

      {backupActivated && (
        <Suspense fallback={null}>
          <BackupModal
            open={backupOpen}
            onClose={() => {
              playCancel();
              setBackupOpen(false);
            }}
            overlay={store.overlay}
            changeCount={store.overlayChangeCount}
            onExport={store.exportBackup}
            onImport={(text) => {
              const res = store.importBackup(text);
              if (res.ok) setToast('Резервная копия импортирована');
              return res;
            }}
            onRequestReset={() => {
              playOpen();
              setConfirmState({ kind: 'resetExcel' });
            }}
            onReloadBase={store.reloadBaseData}
          />
        </Suspense>
      )}

      {quickSetupActivated && (
        <Suspense fallback={null}>
          <QuickSetupModal
            open={quickSetupOpen}
            onClose={() => {
              playCancel();
              setQuickSetupOpen(false);
            }}
            groups={store.baseData?.groups ?? []}
            selectedGroup={store.selectedGroup}
            pinnedGroup={store.pinnedGroup}
            allLessons={store.allLessons}
            teachersById={store.teachersById}
            subjectTeacherOverrides={store.subjectTeacherOverrides}
            onPinGroup={handlePinGroup}
            onSetSubjectPinnedSubgroup={handleSetSubjectPinnedSubgroup}
            onOpenSettings={() => {
              setQuickSetupOpen(false);
              handleTabChange('settings');
            }}
            onComplete={() => {
              playConfirm();
              store.setSetupDismissed(true);
              setQuickSetupOpen(false);
            }}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={
          confirmState?.kind === 'resetExcel'
            ? 'Сбросить к данным из Excel?'
            : confirmState?.kind === 'deleteTeacher'
              ? 'Удалить преподавателя?'
              : 'Удалить пару?'
        }
        message={
          confirmState?.kind === 'resetExcel'
            ? 'Все ваши добавленные пары, преподаватели, скрытия и закреплённые подгруппы в localStorage будут удалены. Базовый schedule.json останется.'
            : confirmState?.kind === 'deleteTeacher'
              ? confirmState.teacher.isCustom
                ? `Преподаватель «${confirmState.teacher.name}» будет удалён из локального списка.`
                : `Базовый преподаватель «${confirmState.teacher.name}» будет скрыт через overlay (можно вернуть через сброс).`
              : confirmState?.kind === 'deleteLesson'
                ? confirmState.lesson.isBase
                  ? `Пара «${confirmState.lesson.subject}» (${confirmState.lesson.startTime}–${confirmState.lesson.endTime}) будет скрыта через overlay. Её можно вернуть кнопкой «Сбросить к данным из Excel».`
                  : `Пользовательская пара «${confirmState.lesson.subject}» будет удалена.`
                : ''
        }
        confirmLabel={
          confirmState?.kind === 'resetExcel'
            ? 'Сбросить всё'
            : confirmState?.kind === 'deleteTeacher' &&
                !confirmState.teacher.isCustom
              ? 'Скрыть'
              : confirmState?.kind === 'deleteLesson' &&
                  confirmState.lesson.isBase
                ? 'Скрыть'
                : 'Удалить'
        }
        onConfirm={handleConfirmAction}
        onCancel={() => {
          playCancel();
          setConfirmState(null);
        }}
      />

      <AnimatePresence>
        {toast && (
          <m.div
            key="p5-toast"
            role="status"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: reduced ? 0.08 : 0.16 }}
            className="p5-skew fixed right-4 bottom-4 z-50 border-2 border-white bg-[#060606] px-4 py-2.5 text-sm font-bold text-[#FFE600] shadow-[5px_5px_0_#E60012]"
          >
            <span className="p5-unskew block font-condensed uppercase tracking-wide">
              {toast}
            </span>
          </m.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
