import type { Variants } from 'framer-motion';

export const P5_EASE: [number, number, number, number] = [0.2, 0.9, 0.25, 1];

export function getPanelMotionProps(reduced: boolean | null) {
  return {
    initial: reduced ? { opacity: 0 } : { opacity: 0, x: -16, y: 4 },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, x: 16, y: -4 },
    transition: { duration: reduced ? 0.08 : 0.17, ease: P5_EASE },
  };
}

export function getStaggerContainerVariants(reduced: boolean | null): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : 0.025,
      },
    },
  };
}

export function getStaggerItemVariants(reduced: boolean | null): Variants {
  return {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, x: -16, y: 4 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reduced ? 0.08 : 0.17,
        ease: P5_EASE,
      },
    },
  };
}

export function getModalMotionProps(reduced: boolean | null) {
  return {
    initial: reduced
      ? { opacity: 0 }
      : { opacity: 0, x: -20, y: 8, scale: 0.96 },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    exit: reduced
      ? { opacity: 0 }
      : { opacity: 0, x: 16, y: -4, scale: 0.96 },
    transition: { duration: reduced ? 0.08 : 0.17, ease: P5_EASE },
  };
}
