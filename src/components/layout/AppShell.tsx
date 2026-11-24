import type { ReactNode } from 'react';
import { CalendarDays, Database, Users, Volume2, VolumeX } from 'lucide-react';
import type { ActiveTab } from '../../types/schedule';
import { RansomTitle } from '../common/RansomTitle';

interface AppShellProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  semester?: string;
  teacherCount: number;
  overlayChangeCount: number;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
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
  sfxEnabled,
  onToggleSfx,
  onOpenBackup,
  hud,
  children,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0D0D0D] text-white">
      {/* P5R diagonal geometric backdrop — strictly non-interactive */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      >
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <rect width="1440" height="900" fill="#0D0D0D" />

          {/* Secondary darker crimson wedge in lower-left */}
          <polygon points="0,680 460,900 0,900" fill="#B0000E" opacity="0.72" />
          <polygon points="0,730 340,900 0,900" fill="#E60012" opacity="0.5" />

          {/* Primary sweeping diagonal Phantom Red slash from top-right */}
          <polygon points="940,0 1440,0 1440,860 660,900" fill="#E60012" opacity="0.88" />
          <polygon points="1030,0 1440,0 1440,660 820,900" fill="#B0000E" opacity="0.6" />
          <polygon points="1180,0 1440,0 1440,420 1050,620" fill="#0D0D0D" opacity="0.45" />

          {/* Crisp high-contrast diagonal speed slashes */}
          <line x1="934" y1="0" x2="652" y2="900" stroke="#FFFFFF" strokeWidth="4" opacity="0.85" />
          <line x1="964" y1="0" x2="686" y2="900" stroke="#0D0D0D" strokeWidth="10" />
          <line x1="1260" y1="0" x2="980" y2="900" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.35" />
          <line x1="0" y1="674" x2="466" y2="900" stroke="#FFFFFF" strokeWidth="3" opacity="0.55" />

          {/* Nested geometric P5R 5-point stars in top-right */}
          <g transform="translate(1310 130) rotate(14)">
            <polygon
              points="0,-92 24,-30 90,-28 38,14 56,78 0,40 -56,78 -38,14 -90,-28 -24,-30"
              fill="#FFFFFF"
              opacity="0.92"
            />
            <polygon
              points="0,-64 17,-21 63,-19 26,10 39,54 0,28 -39,54 -26,10 -63,-19 -17,-21"
              fill="#0D0D0D"
            />
            <polygon
              points="0,-38 10,-12 37,-11 16,6 23,32 0,16 -23,32 -16,6 -37,-11 -10,-12"
              fill="#E60012"
            />
          </g>

          {/* Nested geometric P5R 5-point stars in bottom-left */}
          <g transform="translate(110 800) rotate(-18)">
            <polygon
              points="0,-78 21,-25 76,-23 32,12 47,66 0,34 -47,66 -32,12 -76,-23 -21,-25"
              fill="#0D0D0D"
              stroke="#FFFFFF"
              strokeWidth="4"
            />
            <polygon
              points="0,-46 12,-15 45,-14 19,7 28,39 0,20 -28,39 -19,7 -45,-14 -12,-15"
              fill="#E60012"
            />
            <polygon
              points="0,-22 6,-7 21,-7 9,3 13,18 0,9 -13,18 -9,3 -21,-7 -6,-7"
              fill="#FFFFFF"
            />
          </g>
        </svg>
        <div className="p5-halftone absolute inset-0 opacity-75" />
      </div>

      {/* Sticky P5R Top Navigation Shell */}
      <header className="sticky top-0 z-30 border-b-4 border-[#E60012] bg-[#0D0D0D] shadow-[0_5px_0_#0D0D0D]">
        <div
          aria-hidden="true"
          className="p5-halftone pointer-events-none absolute inset-0 opacity-40"
        />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="p5-skew shrink-0 border-2 border-white bg-[#E60012] px-2.5 py-1.5 shadow-[4px_4px_0_#0D0D0D]">
              <span className="p5-unskew block font-display text-sm tracking-wider text-white">
                AIU
              </span>
            </div>
            <div className="min-w-0 space-y-1">
              <RansomTitle text="AIU SCHEDULE" as="h1" size="md" />
              <p className="truncate font-condensed text-[11px] font-bold uppercase tracking-widest text-[#FFE600]">
                {semester || '2026-2027 FALL SEMESTER'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <nav
              aria-label="Основные разделы"
              className="flex flex-wrap items-center gap-2"
            >
              <button
                type="button"
                onClick={() => onTabChange('schedule')}
                className={`p5-skew border-2 px-3 py-1.5 transition ${
                  activeTab === 'schedule'
                    ? '-translate-y-0.5 border-white bg-[#E60012] text-white shadow-[4px_4px_0_#0D0D0D]'
                    : 'border-white bg-[#161616] text-white shadow-[3px_3px_0_#0D0D0D] hover:-translate-y-0.5 hover:border-[#FFE600] hover:text-[#FFE600]'
                }`}
              >
                <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                  <CalendarDays className="h-4 w-4" />
                  <span>Расписание</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('teachers')}
                className={`p5-skew border-2 px-3 py-1.5 transition ${
                  activeTab === 'teachers'
                    ? '-translate-y-0.5 border-white bg-[#E60012] text-white shadow-[4px_4px_0_#0D0D0D]'
                    : 'border-white bg-[#161616] text-white shadow-[3px_3px_0_#0D0D0D] hover:-translate-y-0.5 hover:border-[#FFE600] hover:text-[#FFE600]'
                }`}
              >
                <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                  <Users className="h-4 w-4" />
                  <span>Преподаватели</span>
                  <span
                    className={`px-1.5 py-0.5 font-condensed text-[11px] font-bold leading-none ${
                      activeTab === 'teachers'
                        ? 'border border-white bg-[#0D0D0D] text-[#FFE600]'
                        : 'bg-white text-[#0D0D0D]'
                    }`}
                  >
                    {teacherCount}
                  </span>
                </span>
              </button>
            </nav>

            <button
              type="button"
              onClick={onToggleSfx}
              aria-pressed={sfxEnabled}
              aria-label={
                sfxEnabled
                  ? 'Выключить звуки интерфейса'
                  : 'Включить звуки интерфейса'
              }
              className={`p5-skew border-2 px-2.5 py-1.5 transition hover:-translate-y-0.5 ${
                sfxEnabled
                  ? 'border-[#0D0D0D] bg-[#FFE600] text-[#0D0D0D] shadow-[3px_3px_0_#E60012] hover:border-white hover:bg-[#E60012] hover:text-white'
                  : 'border-white/80 bg-[#161616] text-neutral-300 shadow-[3px_3px_0_#0D0D0D] hover:border-[#FFE600] hover:text-[#FFE600]'
              }`}
            >
              <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                {sfxEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                <span>{sfxEnabled ? 'SFX ON' : 'SFX OFF'}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenBackup}
              className="p5-skew border-2 border-white bg-[#0D0D0D] px-3 py-1.5 text-white shadow-[3px_3px_0_#E60012] transition hover:-translate-y-0.5 hover:bg-white hover:text-[#0D0D0D]"
            >
              <span className="p5-unskew inline-flex items-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                <Database className="h-4 w-4 text-[#E60012]" />
                <span className="hidden sm:inline">Бэкап / Сброс</span>
                <span className="sm:hidden">Бэкап</span>
                {overlayChangeCount > 0 && (
                  <span className="border border-[#0D0D0D] bg-[#FFE600] px-1.5 py-0.5 font-condensed text-[11px] font-bold leading-none text-[#0D0D0D]">
                    {overlayChangeCount}
                  </span>
                )}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-5 px-3 py-4 sm:px-6 sm:py-6">
        {hud}
        {children}
      </main>
    </div>
  );
}
