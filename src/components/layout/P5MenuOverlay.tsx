import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, m, useReducedMotion } from 'framer-motion';
import {
  CalendarDays,
  Database,
  Plus,
  Settings,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  ActiveTab,
  GroupFilter,
  GroupId,
  ScheduleScopeMode,
} from '../../types/schedule';
import { getCursorSpring, getTapPressProps, P5_EASE } from '../../utils/p5Motion';
import { playOpen, playSwitch } from '../../utils/p5Sound';

interface P5MenuOverlayProps {
  open: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  selectedGroup: GroupFilter;
  pinnedGroup: GroupId | null;
  scheduleScopeMode: ScheduleScopeMode;
  focusedTeacherName: string | null;
  teacherCount: number;
  pinnedSubjectsCount: number;
  totalStreamSubjectsCount: number;
  overrideCount: number;
  overlayChangeCount: number;
  hideSaturdayConflicts: boolean;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  onSelectSchedule: () => void;
  onSelectTeachers: () => void;
  onSelectSettings: () => void;
  onAddLesson: () => void;
  onOpenBackup: () => void;
  onOpenQuickSetup: () => void;
}

export function P5MenuOverlay({
  open,
  onClose,
  activeTab,
  selectedGroup,
  pinnedGroup,
  scheduleScopeMode,
  focusedTeacherName,
  teacherCount,
  pinnedSubjectsCount,
  totalStreamSubjectsCount,
  overrideCount,
  overlayChangeCount,
  hideSaturdayConflicts,
  sfxEnabled,
  onToggleSfx,
  onSelectSchedule,
  onSelectTeachers,
  onSelectSettings,
  onAddLesson,
  onOpenBackup,
  onOpenQuickSetup,
}: P5MenuOverlayProps) {
  const reduced = useReducedMotion();
  const cursorSpring = getCursorSpring(reduced);
  const tapProps = getTapPressProps(reduced);

  const initialIndex =
    activeTab === 'teachers' ? 1 : activeTab === 'settings' ? 2 : 0;
  const [focusedIndex, setFocusedIndex] = useState<number>(initialIndex);

  useEffect(() => {
    if (open) {
      setFocusedIndex(
        activeTab === 'teachers' ? 1 : activeTab === 'settings' ? 2 : 0
      );
    }
  }, [open, activeTab]);

  const menuItems = useMemo(
    () => [
      {
        id: 'schedule',
        label: 'РАСПИСАНИЕ',
        subtitle: 'Сетка недели и дня',
        badge: null as string | null,
        icon: CalendarDays,
        onTrigger: onSelectSchedule,
      },
      {
        id: 'teachers',
        label: 'ПРЕПОДАВАТЕЛИ',
        subtitle: 'Досье и Office Hours',
        badge: String(teacherCount),
        icon: Users,
        onTrigger: onSelectTeachers,
      },
      {
        id: 'settings',
        label: 'НАСТРОЙКИ',
        subtitle: 'Мои преподаватели и профиль',
        badge: pinnedSubjectsCount > 0 ? `${pinnedSubjectsCount}` : null,
        icon: Settings,
        onTrigger: onSelectSettings,
      },
      {
        id: 'add-lesson',
        label: 'ДОБАВИТЬ ПАРУ',
        subtitle: 'Новая пара в overlay',
        badge: '+',
        icon: Plus,
        onTrigger: onAddLesson,
      },
      {
        id: 'backup',
        label: 'БЭКАП И СБРОС',
        subtitle: 'Экспорт, импорт, сброс Excel',
        badge: overlayChangeCount > 0 ? String(overlayChangeCount) : null,
        icon: Database,
        onTrigger: onOpenBackup,
      },
    ],
    [
      onSelectSchedule,
      onSelectTeachers,
      onSelectSettings,
      onAddLesson,
      onOpenBackup,
      teacherCount,
      pinnedSubjectsCount,
      overlayChangeCount,
    ]
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        playSwitch();
        setFocusedIndex((prev) => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        playSwitch();
        setFocusedIndex(
          (prev) => (prev - 1 + menuItems.length) % menuItems.length
        );
      } else if (e.key === 'Enter') {
        const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
        if (activeTag === 'BUTTON') return;
        e.preventDefault();
        playOpen();
        menuItems[focusedIndex]?.onTrigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, focusedIndex, menuItems]);

  const indentClasses = [
    'ml-0',
    'ml-2 sm:ml-6',
    'ml-4 sm:ml-12',
    'ml-6 sm:ml-18',
    'ml-8 sm:ml-24',
  ];

  return (
    <AnimatePresence>
      {open && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label="Меню паузы Persona 5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.06 : 0.16, ease: P5_EASE }}
          className="fixed inset-0 z-50 overflow-y-auto overflow-x-clip bg-[#050505]/95 text-white"
        >
          {/* Dynamic P5R Pause Menu Backdrop */}
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
              {/* Sweeping scarlet diagonal slash band */}
              <polygon
                points="280,0 1120,0 640,900 -120,900"
                fill="#C80010"
              />
              <polygon
                points="460,0 990,0 510,900 120,900"
                fill="#E60012"
              />
              {/* Huge pitch-black diagonal wedge */}
              <polygon
                points="0,0 560,0 190,900 0,900"
                fill="#050505"
              />
              <polygon
                points="1020,0 1440,0 1440,900 540,900"
                fill="#050505"
              />
              {/* Stark white geometric seam */}
              <polyline
                points="560,0 190,900"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                opacity="0.35"
              />
              <polyline
                points="1020,0 540,900"
                fill="none"
                stroke="#E60012"
                strokeWidth="5"
                opacity="0.85"
              />
            </svg>

            <div className="p5-halftone-svg absolute inset-0" />

            <svg
              viewBox="-100 -100 200 200"
              className="p5-star-spin hidden sm:block absolute -top-16 -right-16 h-80 w-80 text-[#E60012]/25"
            >
              <polygon
                points="0,-92 24,-30 90,-28 38,14 56,78 0,40 -56,78 -38,14 -90,-28 -24,-30"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="relative z-10 mx-auto flex min-h-full max-w-[1280px] flex-col justify-between px-4 py-5 sm:px-8 sm:py-8">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p5-skew inline-block border-2 border-white bg-[#E60012] px-3 py-1 shadow-[4px_4px_0_#050505]">
                  <span className="p5-unskew block font-display text-xs uppercase tracking-widest text-white sm:text-sm">
                    PAUSE MENU
                  </span>
                </span>
                <span className="hidden font-condensed text-xs font-bold uppercase tracking-widest text-neutral-300 sm:inline">
                  AIU SCHEDULE // PHANTOM EDITION
                </span>
              </div>

              <m.button
                type="button"
                onClick={onClose}
                {...tapProps}
                aria-label="Закрыть меню"
                className="p5-skew border-2 border-[#050505] bg-white px-3.5 py-1.5 text-[#050505] shadow-[4px_4px_0_#E60012] transition-colors hover:border-white hover:bg-[#E60012] hover:text-white"
              >
                <span className="p5-unskew inline-flex items-center gap-2 font-display text-xs uppercase tracking-wider sm:text-sm">
                  <span>ЗАКРЫТЬ</span>
                  <span className="bg-[#050505] px-1.5 py-0.5 font-condensed text-[10px] font-bold text-[#FFE600]">
                    ESC
                  </span>
                  <X className="h-4 w-4" />
                </span>
              </m.button>
            </div>

            {/* Center Content: Slanted Staircase Menu (Left) + Profile Card (Right) */}
            <div className="my-auto grid grid-cols-1 items-center gap-8 py-6 lg:grid-cols-12 lg:gap-10">
              {/* Slanted Staircase */}
              <m.nav
                aria-label="Навигация меню паузы"
                initial={reduced ? { opacity: 0 } : { x: -36, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={reduced ? { opacity: 0 } : { x: -24, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 580,
                  damping: 28,
                }}
                className="lg:col-span-7"
              >
                <LayoutGroup id="p5-pause-menu">
                  <ul className="space-y-3 sm:space-y-3.5">
                    {menuItems.map((item, idx) => {
                      const isFocused = focusedIndex === idx;
                      const Icon = item.icon;
                      return (
                        <li
                          key={item.id}
                          className={indentClasses[idx] ?? 'ml-0'}
                        >
                          <m.button
                            type="button"
                            onMouseEnter={() => {
                              if (focusedIndex !== idx) {
                                playSwitch();
                                setFocusedIndex(idx);
                              }
                            }}
                            onFocus={() => setFocusedIndex(idx)}
                            onClick={() => {
                              playOpen();
                              item.onTrigger();
                            }}
                            whileTap={
                              reduced ? undefined : { x: 4, y: 2, scale: 0.99 }
                            }
                            className="group relative flex w-full max-w-xl items-center justify-between gap-3 px-4 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE600] sm:px-6 sm:py-3"
                          >
                            {isFocused ? (
                              <m.div
                                layoutId="p5-pause-cursor"
                                aria-hidden="true"
                                transition={cursorSpring}
                                className="pointer-events-none absolute inset-0 z-0 filter-[drop-shadow(6px_6px_0_#E60012)]"
                              >
                                <div className="p5-clip-pause-cursor h-full w-full -rotate-[1deg] bg-white" />
                              </m.div>
                            ) : (
                              <div
                                aria-hidden="true"
                                className="p5-skew pointer-events-none absolute inset-0 z-0 border-2 border-white/30 bg-[#050505]/80 transition-colors group-hover:border-white"
                              />
                            )}

                            <span className="relative z-10 flex min-w-0 items-center gap-3 sm:gap-4">
                              <Icon
                                className={`h-6 w-6 shrink-0 sm:h-7 sm:w-7 ${
                                  isFocused ? 'text-[#E60012]' : 'text-[#E60012]'
                                }`}
                              />
                              <span className="min-w-0">
                                <span
                                  className={`block font-display text-[26px] uppercase leading-none tracking-tight sm:text-[34px] lg:text-[40px] ${
                                    isFocused
                                      ? 'text-[#050505]'
                                      : 'text-white [text-shadow:3px_3px_0_#050505]'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                <span
                                  className={`mt-1 hidden font-condensed text-xs font-bold uppercase tracking-wider sm:block ${
                                    isFocused
                                      ? 'text-[#050505]/75'
                                      : 'text-neutral-300'
                                  }`}
                                >
                                  {item.subtitle}
                                </span>
                              </span>
                            </span>

                            {item.badge && (
                              <span
                                className={`relative z-10 shrink-0 px-2 py-1 font-display text-xs leading-none sm:text-sm ${
                                  isFocused
                                    ? 'bg-[#E60012] text-white'
                                    : 'border border-white bg-[#050505] text-[#FFE600]'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </m.button>
                        </li>
                      );
                    })}
                  </ul>
                </LayoutGroup>
              </m.nav>

              {/* Right Summary Panel */}
              <m.aside
                initial={reduced ? { opacity: 0 } : { x: 32, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={reduced ? { opacity: 0 } : { x: 24, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 560,
                  damping: 28,
                }}
                className="lg:col-span-5"
              >
                <div className="border-[3px] border-white bg-[#060606] p-5 shadow-[7px_7px_0_#E60012,9px_9px_0_#050505]">
                  <div className="flex items-center justify-between gap-2 border-b-2 border-white/20 pb-3">
                    <div>
                      <div className="font-display text-base uppercase tracking-wider text-white sm:text-lg">
                        PHANTOM PROFILE
                      </div>
                      <div className="font-condensed text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                        AIU CS 1ST YEAR
                      </div>
                    </div>
                    <span className="p5-skew border border-white bg-[#E60012] px-2.5 py-0.5 font-condensed text-xs font-bold uppercase tracking-wider text-white">
                      <span className="p5-unskew block">ONLINE</span>
                    </span>
                  </div>

                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <dt className="font-condensed text-xs font-bold uppercase tracking-wider text-neutral-300">
                        Активный режим
                      </dt>
                      <dd className="font-display text-sm uppercase text-[#FFE600]">
                        {scheduleScopeMode === 'teacher' && focusedTeacherName
                          ? `УЧИТЕЛЬ: ${focusedTeacherName}`
                          : selectedGroup === 'ALL'
                            ? 'ВСЕ 4 ГРУППЫ'
                            : selectedGroup}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <dt className="font-condensed text-xs font-bold uppercase tracking-wider text-neutral-300">
                        Моя группа
                      </dt>
                      <dd
                        className={`font-display text-sm uppercase ${
                          pinnedGroup ? 'text-[#FFE600]' : 'text-neutral-400'
                        }`}
                      >
                        {pinnedGroup ? `★ ${pinnedGroup}` : 'Не выбрана'}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <dt className="font-condensed text-xs font-bold uppercase tracking-wider text-neutral-300">
                        Свои преподаватели
                      </dt>
                      <dd className="font-display text-sm text-white">
                        <span className="text-[#FFE600]">
                          {pinnedSubjectsCount}
                        </span>{' '}
                        / {totalStreamSubjectsCount} предметов
                      </dd>
                    </div>

                    {overrideCount > 0 && (
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <dt className="font-condensed text-xs font-bold uppercase tracking-wider text-neutral-300">
                          Переопределения
                        </dt>
                        <dd className="font-display text-sm text-[#FFE600]">
                          {overrideCount} предм.
                        </dd>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <dt className="font-condensed text-xs font-bold uppercase tracking-wider text-neutral-300">
                        Спорные сб. очные
                      </dt>
                      <dd
                        className={`font-condensed text-xs font-bold uppercase tracking-wider ${
                          hideSaturdayConflicts
                            ? 'text-[#FFE600]'
                            : 'text-white'
                        }`}
                      >
                        {hideSaturdayConflicts ? 'СКРЫТЫ' : 'ПОКАЗАНЫ'}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <m.button
                      type="button"
                      onClick={onOpenQuickSetup}
                      {...tapProps}
                      className="p5-skew border-2 border-white bg-[#050505] px-3 py-2 text-[#FFE600] shadow-[3px_3px_0_#E60012] transition-colors hover:border-[#FFE600] hover:bg-[#FFE600] hover:text-[#050505]"
                    >
                      <span className="p5-unskew inline-flex items-center justify-center gap-1.5 font-condensed text-xs font-bold uppercase tracking-wider">
                        <span>★ Группа и преп.</span>
                      </span>
                    </m.button>

                    <m.button
                      type="button"
                      onClick={onToggleSfx}
                      {...tapProps}
                      className={`p5-skew flex-1 border-2 px-3 py-2 transition-colors ${
                        sfxEnabled
                          ? 'border-[#050505] bg-[#FFE600] text-[#050505] shadow-[3px_3px_0_#E60012]'
                          : 'border-white bg-[#050505] text-white hover:border-[#FFE600] hover:text-[#FFE600]'
                      }`}
                    >
                      <span className="p5-unskew inline-flex items-center justify-center gap-2 font-condensed text-xs font-bold uppercase tracking-wider">
                        {sfxEnabled ? (
                          <Volume2 className="h-4 w-4" />
                        ) : (
                          <VolumeX className="h-4 w-4" />
                        )}
                        <span>SFX: {sfxEnabled ? 'ON' : 'OFF'}</span>
                      </span>
                    </m.button>

                    <m.button
                      type="button"
                      onClick={onClose}
                      {...tapProps}
                      className="p5-skew border-2 border-white bg-[#E60012] px-4 py-2 text-white shadow-[3px_3px_0_#050505] transition-colors hover:bg-white hover:text-[#050505]"
                    >
                      <span className="p5-unskew block font-condensed text-xs font-bold uppercase tracking-wider">
                        НАЗАД [ESC]
                      </span>
                    </m.button>
                  </div>
                </div>
              </m.aside>
            </div>

            {/* Bottom Keyboard Hints */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3 font-condensed text-[11px] font-bold uppercase tracking-widest text-neutral-400">
              <span>↑ / ↓ — НАВИГАЦИЯ · ENTER — ВЫБРАТЬ · ESC — ЗАКРЫТЬ</span>
              <span>LOCAL OVERLAY: AIU_P5R_SCHEDULE_OVERLAY_V1</span>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
