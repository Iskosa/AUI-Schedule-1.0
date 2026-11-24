import type { ReactNode } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Database, Users, Volume2, VolumeX } from 'lucide-react';
import type { ActiveTab } from '../../types/schedule';
import { getCursorSpring, getTapPressProps } from '../../utils/p5Motion';
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
  const reduced = useReducedMotion();
  const cursorSpring = getCursorSpring(reduced);
  const tapProps = getTapPressProps(reduced);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0B0B0B] text-white">
      {/* Minimal P5R geometric backdrop — clean negative space with 2 bold diagonal crimson planes */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      >
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <rect width="1440" height="900" fill="#0B0B0B" />

          {/* Sweeping Phantom Red diagonal plane along the right edge */}
          <polygon
            points="1185,0 1440,0 1440,900 1015,900"
            fill="#9E000D"
            opacity="0.52"
          />
          <polygon
            points="1285,0 1440,0 1440,760 1130,900"
            fill="#E60012"
            opacity="0.34"
          />

          {/* Understated dark-crimson corner plane in bottom-left */}
          <polygon
            points="0,770 210,900 0,900"
            fill="#8A000B"
            opacity="0.42"
          />
        </svg>
        <div className="p5-halftone absolute inset-0 opacity-35" />
      </div>

      {/* Compact Sticky P5R Top Navigation Shell */}
      <header className="sticky top-0 z-30 overflow-hidden border-b-2 border-[#E60012] bg-[#0B0B0B]/95 backdrop-blur-sm">
        {/* Subtle slow GPU-rotated 5-point P5R star in header corner */}
        <svg
          aria-hidden="true"
          viewBox="-100 -100 200 200"
          className="p5-star-spin pointer-events-none absolute -top-7 -right-5 h-24 w-24 text-[#E60012]/25 select-none"
        >
          <polygon
            points="0,-92 24,-30 90,-28 38,14 56,78 0,40 -56,78 -38,14 -90,-28 -24,-30"
            fill="currentColor"
          />
        </svg>

        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:flex-nowrap sm:gap-4 sm:px-6">
          {/* Brand */}
          <div className="order-1 flex min-w-0 items-center gap-2.5">
            <div className="p5-skew shrink-0 border border-white bg-[#E60012] px-2 py-0.5 shadow-[2px_2px_0_#000000]">
              <span className="p5-unskew block font-display text-xs tracking-wider text-white">
                AIU
              </span>
            </div>
            <div className="flex min-w-0 items-baseline gap-2.5">
              <RansomTitle text="AIU SCHEDULE" as="h1" size="sm" />
              <span className="hidden truncate font-condensed text-[10px] font-bold uppercase tracking-widest text-neutral-400 lg:inline-block">
                {semester || '2026-2027 FALL SEMESTER'}
              </span>
            </div>
          </div>

          {/* Main Section Tabs with flying layoutId crimson cursor */}
          <LayoutGroup id="p5-header-nav">
            <nav
              aria-label="Основные разделы"
              className="order-3 flex w-full items-center gap-2 sm:order-2 sm:w-auto sm:justify-center"
            >
              <motion.button
                type="button"
                onClick={() => onTabChange('schedule')}
                {...tapProps}
                className={`relative flex-1 px-3 py-1.5 sm:flex-initial ${
                  activeTab === 'schedule'
                    ? 'text-white'
                    : 'text-neutral-300 hover:text-[#FFE600]'
                }`}
              >
                {activeTab === 'schedule' ? (
                  <motion.div
                    layoutId="p5-nav-cursor"
                    aria-hidden="true"
                    transition={cursorSpring}
                    className="pointer-events-none absolute inset-0 z-0"
                  >
                    <div className="p5-skew h-full w-full -rotate-[1deg] border border-white bg-[#E60012] shadow-[3px_3px_0_#000000]" />
                  </motion.div>
                ) : (
                  <div
                    aria-hidden="true"
                    className="p5-skew pointer-events-none absolute inset-0 z-0 border border-white/20 bg-[#141414]/80"
                  />
                )}
                <span className="relative z-10 inline-flex items-center justify-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Расписание</span>
                </span>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => onTabChange('teachers')}
                {...tapProps}
                className={`relative flex-1 px-3 py-1.5 sm:flex-initial ${
                  activeTab === 'teachers'
                    ? 'text-white'
                    : 'text-neutral-300 hover:text-[#FFE600]'
                }`}
              >
                {activeTab === 'teachers' ? (
                  <motion.div
                    layoutId="p5-nav-cursor"
                    aria-hidden="true"
                    transition={cursorSpring}
                    className="pointer-events-none absolute inset-0 z-0"
                  >
                    <div className="p5-skew h-full w-full -rotate-[1deg] border border-white bg-[#E60012] shadow-[3px_3px_0_#000000]" />
                  </motion.div>
                ) : (
                  <div
                    aria-hidden="true"
                    className="p5-skew pointer-events-none absolute inset-0 z-0 border border-white/20 bg-[#141414]/80"
                  />
                )}
                <span className="relative z-10 inline-flex items-center justify-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider sm:text-sm">
                  <Users className="h-3.5 w-3.5" />
                  <span>Преподаватели</span>
                  <span
                    className={`px-1.5 py-0.5 font-condensed text-[10px] font-bold leading-none ${
                      activeTab === 'teachers'
                        ? 'bg-[#0B0B0B] text-[#FFE600]'
                        : 'bg-white/15 text-neutral-200'
                    }`}
                  >
                    {teacherCount}
                  </span>
                </span>
              </motion.button>
            </nav>
          </LayoutGroup>

          {/* Minimalist Corner Utilities */}
          <div className="order-2 flex shrink-0 items-center gap-1.5 sm:order-3">
            <motion.button
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
              className={`p5-skew flex h-8 w-8 items-center justify-center border transition-colors ${
                sfxEnabled
                  ? 'border-[#FFE600]/80 bg-[#141414] text-[#FFE600] hover:bg-[#FFE600] hover:text-[#0B0B0B]'
                  : 'border-white/25 bg-[#141414] text-neutral-400 hover:border-white/60 hover:text-white'
              }`}
            >
              <span className="p5-unskew block">
                {sfxEnabled ? (
                  <Volume2 className="h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
              </span>
            </motion.button>

            <motion.button
              type="button"
              onClick={onOpenBackup}
              title="Бэкап / Сброс данных"
              aria-label="Бэкап и сброс данных"
              {...tapProps}
              className="p5-skew relative flex h-8 w-8 items-center justify-center border border-white/25 bg-[#141414] text-neutral-200 transition-colors hover:border-white hover:bg-white hover:text-[#0B0B0B]"
            >
              <span className="p5-unskew block">
                <Database className="h-3.5 w-3.5" />
              </span>
              {overlayChangeCount > 0 && (
                <span className="p5-unskew absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center bg-[#FFE600] px-1 font-condensed text-[9px] font-bold leading-none text-[#0B0B0B]">
                  {overlayChangeCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-3 px-3 py-3 sm:px-6 sm:py-4">
        {hud}
        {children}
      </main>
    </div>
  );
}
