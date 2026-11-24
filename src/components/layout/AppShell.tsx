import type { ReactNode } from 'react';
import { CalendarDays, Database, Users } from 'lucide-react';
import type { ActiveTab } from '../../types/schedule';

interface AppShellProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  semester?: string;
  teacherCount: number;
  overlayChangeCount: number;
  onOpenBackup: () => void;
  hud: ReactNode;
  children: ReactNode;
}

export function AppShell({
  activeTab,
  onTabChange,
  semester,
  teacherCount,
  overlayChangeCount,
  onOpenBackup,
  hud,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#0b0d12] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-[#252e42] bg-[#0b0d12]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 font-bold text-blue-400 ring-1 ring-blue-500/30">
              AIU
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
                AIU CS Schedule
              </h1>
              <p className="truncate text-xs text-slate-400">
                {semester || '2026-2027 FALL SEMESTER'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav
              aria-label="Основные разделы"
              className="flex rounded-xl border border-[#252e42] bg-[#121620] p-1"
            >
              <button
                type="button"
                onClick={() => onTabChange('schedule')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === 'schedule'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <span>Расписание</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('teachers')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === 'teachers'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Преподаватели</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    activeTab === 'teachers'
                      ? 'bg-blue-500/40 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {teacherCount}
                </span>
              </button>
            </nav>

            <button
              type="button"
              onClick={onOpenBackup}
              className="flex items-center gap-1.5 rounded-xl border border-[#252e42] bg-[#121620] px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-[#1a2030] sm:text-sm"
            >
              <Database className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">Бэкап / Сброс</span>
              <span className="sm:hidden">JSON</span>
              {overlayChangeCount > 0 && (
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300">
                  {overlayChangeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-4 sm:px-6 sm:py-6">
        {hud}
        {children}
      </main>
    </div>
  );
}
