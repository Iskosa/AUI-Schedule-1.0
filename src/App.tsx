import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { BackupModal } from './components/common/BackupModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { P5TransitionSlash } from './components/common/P5TransitionSlash';
import { AppShell } from './components/layout/AppShell';
import { LiveHudBar } from './components/layout/LiveHudBar';
import { DayView } from './components/schedule/DayView';
import { GroupSwitcher } from './components/schedule/GroupSwitcher';
import { LessonDetailModal } from './components/schedule/LessonDetailModal';
import { LessonEditorModal } from './components/schedule/LessonEditorModal';
import { ScheduleToolbar } from './components/schedule/ScheduleToolbar';
import { WeekView } from './components/schedule/WeekView';
import { TeacherEditorModal } from './components/teachers/TeacherEditorModal';
import { TeachersView } from './components/teachers/TeachersView';
import { useLiveClock } from './hooks/useLiveClock';
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
import { computeLiveHudState } from './utils/time';

type ConfirmState =
  | { kind: 'deleteLesson'; lesson: EffectiveLesson }
  | { kind: 'deleteTeacher'; teacher: EffectiveTeacher }
  | { kind: 'resetExcel' }
  | null;

export default function App() {
  const store = useScheduleStore();
  const now = useLiveClock(1000);
  const reduced = useReducedMotion();

  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [slashId, setSlashId] = useState(0);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
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
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const currentLessonIds = useMemo(
    () =>
      new Set(
        computeLiveHudState(now, store.lessons, 'ALL').currentLessons.map(
          (ls) => ls.id
        )
      ),
    [now, store.lessons]
  );

  const detailLesson = detailLessonId
    ? store.lessons.find((ls) => ls.id === detailLessonId) ?? null
    : null;

  const triggerSlash = () => {
    setSlashId((n) => n + 1);
  };

  const handleToggleSfx = () => {
    setSfxEnabled(toggleSfx());
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (tab !== activeTab) {
      playSwitch();
      triggerSlash();
    }
    setActiveTab(tab);
  };

  const handleSelectGroup = (group: GroupFilter) => {
    if (group !== store.selectedGroup) {
      playSwitch();
      triggerSlash();
    }
    store.setSelectedGroup(group);
  };

  const handleChangeViewMode = (mode: ViewMode) => {
    if (mode !== store.viewMode) playSwitch();
    store.setViewMode(mode);
  };

  const handleSelectDay = (day: DayOfWeek) => {
    if (day !== store.selectedDay) playSwitch();
    store.setSelectedDay(day);
  };

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

  if (store.loading && !store.baseData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] p-6 text-white">
        <div className="p5-skew border-2 border-white bg-[#141414] px-6 py-4 shadow-[5px_5px_0_#E60012]">
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
      <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] p-6">
        <div className="max-w-md space-y-3 border-2 border-[#E60012] bg-[#141414] p-6 text-center shadow-[5px_5px_0_#E60012]">
          <AlertCircle className="mx-auto h-8 w-8 text-[#E60012]" />
          <h1 className="font-display text-base uppercase text-white">
            Ошибка загрузки данных
          </h1>
          <p className="text-sm text-neutral-200">{store.error}</p>
          <button
            type="button"
            onClick={() => void store.reloadBaseData()}
            className="p5-skew inline-block border-2 border-white bg-[#E60012] px-4 py-2 text-white shadow-[4px_4px_0_#0B0B0B] transition hover:-translate-y-0.5 hover:bg-white hover:text-[#0B0B0B]"
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

  const scheduleContentKey = `${store.selectedGroup}-${store.viewMode}-${
    store.viewMode === 'day' ? store.selectedDay : 'week'
  }`;

  return (
    <>
      <P5TransitionSlash slashId={slashId} />

      <AppShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        semester={store.baseData?.meta.semester}
        teacherCount={store.teachers.length}
        overlayChangeCount={store.overlayChangeCount}
        sfxEnabled={sfxEnabled}
        onToggleSfx={handleToggleSfx}
        onOpenBackup={() => {
          playOpen();
          setBackupOpen(true);
        }}
        hud={
          <LiveHudBar
            now={now}
            lessons={store.lessons}
            selectedGroup={store.selectedGroup}
            selectedDay={store.selectedDay}
            viewMode={store.viewMode}
            onSelectLesson={handleOpenLessonDetail}
          />
        }
      >
        {activeTab === 'schedule' ? (
          <div key="tab-schedule" className="space-y-3">
            <GroupSwitcher
              selectedGroup={store.selectedGroup}
              onSelectGroup={handleSelectGroup}
              groups={store.baseData?.groups ?? []}
              teachers={store.teachers}
              onOpenTeacher={handleOpenTeacher}
            />

            <ScheduleToolbar
              viewMode={store.viewMode}
              onChangeViewMode={handleChangeViewMode}
              selectedDay={store.selectedDay}
              onSelectDay={handleSelectDay}
              lessons={store.lessons}
              selectedGroup={store.selectedGroup}
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
                  lessons={store.lessons}
                  selectedGroup={store.selectedGroup}
                  saturdayNotes={store.baseData?.meta.saturdayNotes ?? []}
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
        ) : (
          <div key="tab-teachers">
            <TeachersView
              teachers={store.teachers}
              lessons={store.lessons}
              targetGroupTeacherIds={store.targetGroupTeacherIds}
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
            />
          </div>
        )}
      </AppShell>

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
          setToast('Настройка подгруппы обновлена');
        }}
        onOpenTeacher={handleOpenTeacher}
      />

      <LessonEditorModal
        open={lessonEditorState.open}
        editingLesson={lessonEditorState.editingLesson}
        defaultDay={lessonEditorState.defaultDay}
        defaultGroup={
          store.selectedGroup === 'ALL' ? 'COMSE26A' : store.selectedGroup
        }
        teachers={store.teachers}
        teachersById={store.teachersById}
        existingLessons={store.lessons}
        onClose={() => {
          playCancel();
          setLessonEditorState((prev) => ({ ...prev, open: false }));
        }}
        onSave={handleSaveLesson}
      />

      <TeacherEditorModal
        open={teacherEditorState.open}
        editingTeacher={teacherEditorState.editingTeacher}
        onClose={() => {
          playCancel();
          setTeacherEditorState((prev) => ({ ...prev, open: false }));
        }}
        onSave={handleSaveTeacher}
      />

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
          <motion.div
            key="p5-toast"
            role="status"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: reduced ? 0.08 : 0.16 }}
            className="p5-skew fixed right-4 bottom-4 z-50 border-2 border-white bg-[#0B0B0B] px-4 py-2.5 text-sm font-bold text-[#FFE600] shadow-[5px_5px_0_#E60012]"
          >
            <span className="p5-unskew block font-condensed uppercase tracking-wide">
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
