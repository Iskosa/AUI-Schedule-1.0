import type { ReactNode } from 'react';
import { LayoutGroup, m, useReducedMotion } from 'framer-motion';
import { CalendarDays, Menu, Users, Volume2, VolumeX } from 'lucide-react';
import type { ActiveTab } from '../../types/schedule';
import { getCursorSpring, getTapPressProps } from '../../utils/p5Motion';
import { RansomTitle } from '../common/RansomTitle';
import { AppBackground } from './AppBackground';

interface AppShellProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  semester?: string;
  teacherCount: number;
  overlayChangeCount: number;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  onOpenMenu: () => void;
  menuOpen: boolean;
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
  onOpenMenu,
  menuOpen,
  hud,
  children,
}: AppShellProps) {
  const reduced = useReducedMotion();
  const cursorSpring = getCursorSpring(reduced);
  const tapProps = getTapPressProps(reduced);

  return (
    <div className="relative isolate min-h-screen overflow-x-clip text-white">
      <AppBackground />

      {/* Compact Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 overflow-hidden border-b-[3px] border-[#E60012] bg-[#050505]">
        <svg
          aria-hidden="true"
          viewBox="-100 -100 200 200"
          className="p5-star-spin pointer-events-none hidden sm:block absolute -top-7 -right-5 h-24 w-24 text-[#E60012]/25 select-none"
        >
          <polygon
            points="0,-92 24,-30 90,-28 38,14 56,78 0,40 -56,78 -38,14 -90,-28 -24,-30"
            fill="currentColor"
          />
        </svg>

        <div className="relative mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-2 px-3 py-2 sm:flex-nowrap sm:gap-4 sm:px-6">
          {/* Brand */}
          <div className="order-1 flex min-w-0 items-baseline gap-2.5">
            <RansomTitle text="AIU SCHEDULE" as="h1" size="sm" />
            <span className="hidden truncate font-condensed text-[10px] font-bold uppercase tracking-widest text-neutral-300 xl:inline-block">
              {semester || '2026-2027 FALL SEMESTER'}
            </span>
          </div>

          {/* Main Section Tabs with flying layoutId crimson cursor */}
          <LayoutGroup id="p5-header-nav">
            <nav
              aria-label="Основные разделы"
              className="order-3 flex w-full items-center gap-2 sm:order-2 sm:w-auto sm:justify-center"
            >
              <m.button
                type="button"
                onClick={() => onTabChange('schedule')}
                {...tapProps}
                className={`relative flex-1 px-3.5 py-1.5 transition-colors sm:flex-initial ${
                  activeTab === 'schedule'
                    ? 'text-white'
                    : 'text-white hover:text-[#E60012]'
                }`}
              >
                {activeTab === 'schedule' ? (
                  <m.div
                    layoutId="p5-nav-cursor"
                    aria-hidden="true"
                    transition={cursorSpring}
                    className="pointer-events-none absolute inset-0 z-0"
                  >
                    <div className="p5-skew h-full w-full -rotate-[1deg] border-2 border-white bg-[#E60012] shadow-[4px_4px_0_#000000]" />
                  </m.div>
                ) : (
                  <div
                    aria-hidden="true"
                    className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white/80 bg-[#050505]"
                  />
                )}
                <span className="relative z-10 inline-flex items-center justify-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Расписание</span>
                </span>
              </m.button>

              <m.button
                type="button"
                onClick={() => onTabChange('teachers')}
                {...tapProps}
                className={`relative flex-1 px-3.5 py-1.5 transition-colors sm:flex-initial ${
                  activeTab === 'teachers'
                    ? 'text-white'
                    : 'text-white hover:text-[#E60012]'
                }`}
              >
                {activeTab === 'teachers' ? (
                  <m.div
                    layoutId="p5-nav-cursor"
                    aria-hidden="true"
                    transition={cursorSpring}
                    className="pointer-events-none absolute inset-0 z-0"
                  >
                    <div className="p5-skew h-full w-full -rotate-[1deg] border-2 border-white bg-[#E60012] shadow-[4px_4px_0_#000000]" />
                  </m.div>
                ) : (
                  <div
                    aria-hidden="true"
                    className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white/80 bg-[#050505]"
                  />
                )}
                <span className="relative z-10 inline-flex items-center justify-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                  <Users className="h-3.5 w-3.5" />
                  <span>Преподаватели</span>
                  <span
                    className={`px-1.5 py-0.5 font-condensed text-[10px] font-bold leading-none ${
                      activeTab === 'teachers'
                        ? 'bg-[#050505] text-white'
                        : 'bg-[#E60012] text-white'
                    }`}
                  >
                    {teacherCount}
                  </span>
                </span>
              </m.button>
            </nav>
          </LayoutGroup>

          {/* Compact SFX indicator + Prominent P5R MENU (ESC) button */}
          <div className="order-2 flex shrink-0 items-center gap-2 sm:order-3">
            <m.button
              type="button"
              onClick={onToggleSfx}
              aria-pressed={sfxEnabled}
              title={sfxEnabled ? 'Звуки интерфейса: ВКЛ' : 'Звуки интерфейса: ВЫКЛ'}
              aria-label={
                sfxEnabled
                  ? 'Выключить звуки интерфейса'
                  : 'Включить звуки интерфейса'
              }
              {...tapProps}
              className={`p5-skew flex h-8 w-8 items-center justify-center border-2 bg-[#050505] transition-colors ${
                sfxEnabled
                  ? 'border-white text-white shadow-[2px_2px_0_#E60012] hover:bg-white hover:text-[#050505]'
                  : 'border-white/40 text-neutral-400 hover:border-white hover:text-white'
              }`}
            >
              <span className="p5-unskew block">
                {sfxEnabled ? (
                  <Volume2 className="h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
              </span>
            </m.button>

            <m.button
              type="button"
              onClick={onOpenMenu}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              title="Открыть меню паузы (ESC)"
              {...tapProps}
              className="p5-skew relative flex h-8 items-center justify-center border-2 border-white bg-[#E60012] px-3 text-white shadow-[3px_3px_0_#050505] transition-colors hover:bg-white hover:text-[#050505]"
            >
              <span className="p5-unskew inline-flex items-center gap-1.5">
                <Menu className="h-3.5 w-3.5 shrink-0" />
                <span className="font-display text-xs uppercase leading-none tracking-wider">
                  MENU
                </span>
                <span className="hidden bg-[#050505] px-1 py-0.5 font-condensed text-[9px] font-bold leading-none text-white sm:inline-block">
                  ESC
                </span>
              </span>

              {overlayChangeCount > 0 && (
                <span className="p5-unskew absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center border border-[#050505] bg-[#FFE600] px-1 font-condensed text-[9px] font-bold leading-none text-[#050505]">
                  {overlayChangeCount}
                </span>
              )}
            </m.button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1380px] space-y-4 px-3 py-3 sm:px-6 sm:py-4">
        {hud}
        {children}
      </main>
    </div>
  );
}
