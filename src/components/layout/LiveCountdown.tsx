import { useLiveClock } from '../../hooks/useLiveClock';
import { formatClock, formatCountdown } from '../../utils/time';

export function LiveClockBadge() {
  const now = useLiveClock(1000);

  return (
    <span className="border-2 border-white bg-[#050505] px-2 py-0.5 font-condensed text-xs font-bold tabular-nums tracking-widest text-white shadow-[3px_3px_0_#050505] sm:text-sm">
      {formatClock(now)}
    </span>
  );
}

interface LiveCountdownProps {
  targetMs: number;
  label: string;
}

export function LiveCountdown({ targetMs, label }: LiveCountdownProps) {
  const now = useLiveClock(1000);
  const remainingSeconds = Math.max(
    0,
    Math.floor((targetMs - now.getTime()) / 1000)
  );

  return (
    <div className="p5-skew shrink-0 self-start border-2 border-[#050505] bg-[#FFE600] px-3.5 py-1.5 text-[#050505] shadow-[4px_4px_0_#E60012] sm:self-center">
      <div className="p5-unskew flex flex-col items-start sm:items-end">
        <span className="font-condensed text-[10px] font-bold uppercase leading-none tracking-widest text-[#050505]">
          {label}
        </span>
        <span className="mt-0.5 whitespace-nowrap font-display text-lg leading-none tabular-nums text-[#050505] sm:text-2xl">
          {formatCountdown(remainingSeconds)}
        </span>
      </div>
    </div>
  );
}
