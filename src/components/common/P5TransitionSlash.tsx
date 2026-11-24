import { useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';

interface P5TransitionSlashProps {
  slashId: number;
}

export function P5TransitionSlash({ slashId }: P5TransitionSlashProps) {
  const reduced = useReducedMotion();
  const [completedId, setCompletedId] = useState(0);

  if (reduced || slashId <= 0 || completedId >= slashId) {
    return null;
  }

  const activeId = slashId;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none"
    >
      <m.div
        key={activeId}
        initial={{ x: '-125%' }}
        animate={{ x: '125%' }}
        transition={{ duration: 0.24, ease: [0.2, 0.95, 0.25, 1] }}
        onAnimationComplete={() =>
          setCompletedId((prev) => Math.max(prev, activeId))
        }
        style={{ willChange: 'transform' }}
        className="relative -left-[30%] h-full w-[160%]"
      >
        {/* Trailing deep black ink band */}
        <div
          className="absolute inset-0 bg-[#050505]"
          style={{
            clipPath: 'polygon(18% 0%, 96% 0%, 78% 100%, 0% 100%)',
          }}
        />
        {/* Core Phantom Red jagged slash */}
        <div
          className="absolute inset-0 bg-[#E60012]"
          style={{
            clipPath: 'polygon(30% 0%, 89% 0%, 67% 100%, 11% 100%)',
          }}
        />
        {/* Inner black tear accent */}
        <div
          className="absolute inset-0 bg-[#050505]"
          style={{
            clipPath: 'polygon(43% 0%, 51% 0%, 30% 100%, 22% 100%)',
          }}
        />
        {/* Crisp stark white leading edge */}
        <div
          className="absolute inset-0 bg-white"
          style={{
            clipPath: 'polygon(86% 0%, 92% 0%, 70% 100%, 64% 100%)',
          }}
        />
        {/* Thin white trailing highlight */}
        <div
          className="absolute inset-0 bg-white/90"
          style={{
            clipPath: 'polygon(28% 0%, 30.5% 0%, 11.5% 100%, 9% 100%)',
          }}
        />
      </m.div>
    </div>
  );
}
