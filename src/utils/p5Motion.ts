import type { Variants } from 'framer-motion';

export const P5_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function getCursorSpring(reduced: boolean | null) {
  return reduced
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 700, damping: 30, mass: 0.55 };
}

export function getStaggerContainerVariants(reduced: boolean | null): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : 0.04,
      },
    },
  };
}

export function getCardSlamItemVariants(reduced: boolean | null): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { duration: 0.08 },
      },
    };
  }

  return {
    hidden: { x: -56, y: 16, skewX: -12, scale: 0.94, opacity: 0 },
    visible: {
      x: 0,
      y: 0,
      skewX: 0,
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 560,
        damping: 26,
      },
    },
  };
}

export const getStaggerItemVariants = getCardSlamItemVariants;

export function getTapPressProps(reduced: boolean | null) {
  return reduced
    ? {}
    : {
        whileTap: { x: 3, y: 3 },
        transition: { type: 'spring' as const, stiffness: 800, damping: 30 },
      };
}

export function getModalMotionProps(reduced: boolean | null) {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.08 },
    };
  }

  return {
    initial: { opacity: 0, scale: 0.88, rotate: -3, y: 8 },
    animate: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 600, damping: 26 },
    },
    exit: {
      opacity: 0,
      scale: 0.92,
      rotate: 2,
      transition: { duration: 0.12, ease: P5_EASE },
    },
  };
}

export function getModalTitleMotionProps(reduced: boolean | null) {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.08 },
    };
  }

  return {
    initial: { opacity: 0, x: -30, y: -6, rotate: -6 },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      rotate: -2,
      transition: {
        type: 'spring' as const,
        stiffness: 640,
        damping: 24,
        delay: 0.06,
      },
    },
  };
}

export function getHudFlipMotionProps(reduced: boolean | null) {
  if (reduced) {
    return {
      initial: false as const,
      animate: { opacity: 1 },
    };
  }

  return {
    initial: { rotateX: -72, y: -6, scale: 0.94, opacity: 0.35 },
    animate: {
      rotateX: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 640, damping: 24 },
    },
  };
}

export function getPanelMotionProps(reduced: boolean | null) {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.08 },
    };
  }

  return {
    initial: { opacity: 0, x: -24, skewX: -4 },
    animate: { opacity: 1, x: 0, skewX: 0 },
    transition: { type: 'spring' as const, stiffness: 580, damping: 28 },
  };
}
