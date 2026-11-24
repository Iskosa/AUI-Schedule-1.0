import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { BackupModal } from './components/common/BackupModal';
import { ConfirmDialog } from './components/common/ConfirmDialog';
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
} from './types/schedule';

type ConfirmState =
  | { kind: 'deleteLesson'; lesson: EffectiveLesson }
  | { kind: 'deleteTeacher'; teacher: EffectiveTeacher }
  | { kind: 'resetExcel' }
  | null;

export default function App() {
  const store = useScheduleStore();
  const now = useLiveClock(1000);

  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

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

  const detailLesson = detailLessonId
    ? store.lessons.find((ls) => ls.id === detailLessonId) ?? null
    : null;

  const handleOpenTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setActiveTab('teachers');
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
    setConfirmState(null);
  };

  if (store.loading && !store.baseData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d12] p-6 text-slate-300">
        <div className="flex items-center gap-3 rounded-2xl border border-[#252e42] bg-[#121620] px-6 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <span className="text-sm font-medium">Загрузка расписания...</span>
        </div>
      </div>
    );
  }

  if (store.error && !store.baseData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d12] p-6">
        <div className="max-w-md space-y-3 rounded-2xl border border-rose-500/40 bg-[#121620] p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
          <h1 className="text-base font-bold text-white">Ошибка загрузки данных</h1>
          <p className="text-sm text-slate-300">{store.error}</p>
          <button
            type="button"
            onClick={() => void store.reloadBaseData()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <RefreshCw className="h-4 w-4" />
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        semester={store.baseData?.meta.semester}
        teacherCount={store.teachers.length}
        overlayChangeCount={store.overlayChangeCount}
        onOpenBackup={() => setBackupOpen(true)}
        hud={
          <LiveHudBar
            now={now}
            lessons={store.lessons}
            selectedGroup={store.selectedGroup}
            onSelectLesson={(ls) => setDetailLessonId(ls.id)}
          />
        }
      >
        {activeTab === 'schedule' ? (
          <div className="space-y-4">
            <GroupSwitcher
              selectedGroup={store.selectedGroup}
              onSelectGroup={store.setSelectedGroup}
              groups={store.baseData?.groups ?? []}
              teachers={store.teachers}
              onOpenTeacher={handleOpenTeacher}
            />

            <ScheduleToolbar
              viewMode={store.viewMode}
              onChangeViewMode={store.setViewMode}
              selectedDay={store.selectedDay}
              onSelectDay={store.setSelectedDay}
              lessons={store.lessons}
              selectedGroup={store.selectedGroup}
              onAddLesson={() =>
                setLessonEditorState({
                  open: true,
                  editingLesson: null,
                  defaultDay: store.selectedDay,
                })
              }
            />

            {store.viewMode === 'day' ? (
              <DayView
                selectedDay={store.selectedDay}
                lessons={store.lessons}
                selectedGroup={store.selectedGroup}
                saturdayNotes={store.baseData?.meta.saturdayNotes ?? []}
                onSelectLesson={(ls) => setDetailLessonId(ls.id)}
                onAddLessonForDay={(day) =>
                  setLessonEditorState({
                    open: true,
                    editingLesson: null,
                    defaultDay: day,
                  })
                }
              />
            ) : (
              <WeekView
                lessons={store.lessons}
                selectedGroup={store.selectedGroup}
                onSelectLesson={(ls) => setDetailLessonId(ls.id)}
                onFocusDay={(day) => {
                  store.setSelectedDay(day);
                  store.setViewMode('day');
                }}
              />
            )}
          </div>
        ) : (
          <TeachersView
            teachers={store.teachers}
            lessons={store.lessons}
            targetGroupTeacherIds={store.targetGroupTeacherIds}
            selectedTeacherId={selectedTeacherId}
            onSelectTeacher={setSelectedTeacherId}
            onAddTeacher={() =>
              setTeacherEditorState({ open: true, editingTeacher: null })
            }
            onEditTeacher={(teacher) =>
              setTeacherEditorState({ open: true, editingTeacher: teacher })
            }
            onDeleteTeacher={(teacher) =>
              setConfirmState({ kind: 'deleteTeacher', teacher })
            }
            onSelectLesson={(ls) => setDetailLessonId(ls.id)}
          />
        )}
      </AppShell>

      <LessonDetailModal
        lesson={detailLesson}
        teachersById={store.teachersById}
        onClose={() => setDetailLessonId(null)}
        onEdit={(lesson) => {
          setDetailLessonId(null);
          setLessonEditorState({
            open: true,
            editingLesson: lesson,
            defaultDay: lesson.day,
          });
        }}
        onDelete={(lesson) => setConfirmState({ kind: 'deleteLesson', lesson })}
        onTogglePinSubgroup={(lessonId, teacherId) => {
          store.togglePinSubgroup(lessonId, teacherId);
          setToast('Настройка подгруппы обновлена');
        }}
        onOpenTeacher={handleOpenTeacher}
      />

      <LessonEditorModal
        open={lessonEditorState.open}
        editingLesson={lessonEditorState.editingLesson}
        defaultDay={lessonEditorState.defaultDay}
        defaultGroup={
          store.selectedGroup === 'ALL' ? 'COMSE26B' : store.selectedGroup
        }
        teachers={store.teachers}
        teachersById={store.teachersById}
        existingLessons={store.lessons}
        onClose={() =>
          setLessonEditorState((prev) => ({ ...prev, open: false }))
        }
        onSave={handleSaveLesson}
      />

      <TeacherEditorModal
        open={teacherEditorState.open}
        editingTeacher={teacherEditorState.editingTeacher}
        onClose={() =>
          setTeacherEditorState((prev) => ({ ...prev, open: false }))
        }
        onSave={handleSaveTeacher}
      />

      <BackupModal
        open={backupOpen}
        onClose={() => setBackupOpen(false)}
        overlay={store.overlay}
        changeCount={store.overlayChangeCount}
        onExport={store.exportBackup}
        onImport={(text) => {
          const res = store.importBackup(text);
          if (res.ok) setToast('Резервная копия импортирована');
          return res;
        }}
        onRequestReset={() => setConfirmState({ kind: 'resetExcel' })}
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
            : confirmState?.kind === 'deleteTeacher' && !confirmState.teacher.isCustom
              ? 'Скрыть'
              : confirmState?.kind === 'deleteLesson' && confirmState.lesson.isBase
                ? 'Скрыть'
                : 'Удалить'
        }
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState(null)}
      />

      {toast && (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-50 rounded-xl border border-blue-500/40 bg-[#1a2030] px-4 py-2.5 text-sm font-medium text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </>
  );
}
