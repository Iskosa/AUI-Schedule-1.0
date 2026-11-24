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
    <div className="relative min-h-screen overflow-x-clip bg-[#050505] text-white">
      {/* Living P5R diagonal crimson/black split comic backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      >
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <rect width="1440" height="900" fill="#050505" />

          {/* Sweeping deep crimson diagonal split with angular comic step */}
          <polygon
            points="780,0 1440,0 1440,900 320,900 505,530 565,555"
            fill="#C80010"
          />

          {/* Secondary vivid scarlet jagged plane across the right wing */}
          <polygon
            points="1060,0 1440,0 1440,620 820,900 945,460"
            fill="#E60012"
            opacity="0.88"
          />

          {/* Pitch-black jagged wedge biting into the bottom-right crimson */}
          <polygon
            points="1440,560 1440,900 950,900 1245,705"
            fill="#050505"
          />

          {/* Sharp crimson shard piercing the bottom-left black field */}
          <polygon
            points="0,680 230,900 0,900"
            fill="#D90012"
          />
          <polygon
            points="0,785 115,900 0,900"
            fill="#050505"
          />

          {/* Crisp stark white comic cut-in seam along the main diagonal split */}
          <polyline
            points="780,0 565,555 505,530 320,900"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            opacity="0.22"
          />
        </svg>

        {/* Graphic comic halftone dots concentrated toward viewport edges */}
        <div className="p5-halftone-edge-right absolute inset-0" />
        <div className="p5-halftone-edge-left absolute inset-0" />

        {/* Subtle slow GPU-rotated 5-point P5R star watermark */}
        <svg
          viewBox="-100 -100 200 200"
          className="p5-star-spin absolute -right-14 -bottom-14 h-72 w-72 text-[#E60012]/20"
        >
          <polygon
            points="0,-92 24,-30 90,-28 38,14 56,78 0,40 -56,78 -38,14 -90,-28 -24,-30"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Compact Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 overflow-hidden border-b-[3px] border-[#E60012] bg-[#050505]">
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
              <motion.button
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
                  <motion.div
                    layoutId="p5-nav-cursor"
                    aria-hidden="true"
                    transition={cursorSpring}
                    className="pointer-events-none absolute inset-0 z-0"
                  >
                    <div className="p5-skew h-full w-full -rotate-[1deg] border-2 border-white bg-[#E60012] shadow-[4px_4px_0_#000000]" />
                  </motion.div>
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
              </motion.button>

              <motion.button
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
                  <motion.div
                    layoutId="p5-nav-cursor"
                    aria-hidden="true"
                    transition={cursorSpring}
                    className="pointer-events-none absolute inset-0 z-0"
                  >
                    <div className="p5-skew h-full w-full -rotate-[1deg] border-2 border-white bg-[#E60012] shadow-[4px_4px_0_#000000]" />
                  </motion.div>
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
              </motion.button>
            </nav>
          </LayoutGroup>

          {/* Compact Corner Utilities: SFX & Backup */}
          <div className="order-2 flex shrink-0 items-center gap-2 sm:order-3">
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
            </motion.button>

            <motion.button
              type="button"
              onClick={onOpenBackup}
              title="Бэкап / Сброс данных"
              aria-label="Бэкап и сброс данных"
              {...tapProps}
              className="p5-skew relative flex h-8 w-8 items-center justify-center border-2 border-white bg-[#050505] text-white shadow-[2px_2px_0_#E60012] transition-colors hover:bg-white hover:text-[#050505]"
            >
              <span className="p5-unskew block">
                <Database className="h-3.5 w-3.5" />
              </span>
              {overlayChangeCount > 0 && (
                <span className="p5-unskew absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center border border-[#050505] bg-[#FFE600] px-1 font-condensed text-[9px] font-bold leading-none text-[#050505]">
                  {overlayChangeCount}
                </span>
              )}
            </motion.button>
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
