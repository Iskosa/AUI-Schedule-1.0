import { memo } from 'react';

const STAR_POINTS =
  '0,-92 24,-30 90,-28 38,14 56,78 0,40 -56,78 -38,14 -90,-28 -24,-30';

export const AppBackground = memo(function AppBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none bg-[#080808]"
    >
      {/* Plane 1: primary deep crimson diagonal split (simplified on <640px via CSS) */}
      <div className="p5-bg-plane-primary absolute inset-0 bg-[#C80010]" />

      {/* Plane 2: vivid scarlet secondary diagonal plane (desktop/tablet) */}
      <div
        className="hidden sm:block absolute inset-0 bg-[#E60012] opacity-90"
        style={{
          clipPath: 'polygon(76% 0, 100% 0, 100% 68%, 58% 100%, 67% 50%)',
        }}
      />

      {/* Counter-wedge: pitch-black negative space carving bottom-right corner */}
      <div
        className="hidden sm:block absolute inset-0 bg-[#080808]"
        style={{
          clipPath: 'polygon(100% 62%, 100% 100%, 66% 100%, 86% 76%)',
        }}
      />

      {/* Plane 3: sharp bottom-left crimson shard with inner black cutout */}
      <div
        className="hidden sm:block absolute inset-0 bg-[#E60012]"
        style={{ clipPath: 'polygon(0 75%, 16% 100%, 0 100%)' }}
      />
      <div
        className="hidden sm:block absolute inset-0 bg-[#080808]"
        style={{ clipPath: 'polygon(0 86%, 8% 100%, 0 100%)' }}
      />

      {/* Crisp white comic cut-in seam along main diagonal split */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="hidden sm:block absolute inset-0 h-full w-full"
      >
        <polyline
          points="835,0 619,540 547,522 346,900"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          opacity="0.18"
        />
      </svg>

      {/* Lightweight 12x12px inline SVG halftone tile */}
      <div className="p5-halftone-svg absolute inset-0 opacity-75 sm:opacity-100" />

      {/* Slow GPU-composited rotating 5-point P5R stars */}
      <svg
        viewBox="-100 -100 200 200"
        className="p5-star-spin absolute -right-14 -bottom-14 h-52 w-52 text-[#E60012]/20 sm:h-80 sm:w-80"
      >
        <polygon points={STAR_POINTS} fill="currentColor" />
      </svg>

      <svg
        viewBox="-100 -100 200 200"
        className="p5-star-spin-reverse hidden sm:block absolute top-24 -left-24 h-64 w-64 text-[#C80010]/18"
      >
        <polygon points={STAR_POINTS} fill="currentColor" />
      </svg>
    </div>
  );
});
