/**
 * Animation utilities and variants for Framer Motion
 */

export const fadeInUp = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};

export const fadeIn = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const scaleIn = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
};

export const slideInLeft = {
  initial: {
    opacity: 0,
    x: -30,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
};

export const slideInRight = {
  initial: {
    opacity: 0,
    x: 30,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
};

// Parallax scroll animation helper
export const parallaxY = (offset: number = 50) => ({
  initial: { y: 0 },
  animate: { y: offset },
});

// Text reveal animation
export const textReveal = {
  initial: {
    opacity: 0,
    y: 20,
    clipPath: 'inset(100% 0% 0% 0%)',
  },
  animate: {
    opacity: 1,
    y: 0,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: {
      duration: 0.8,
      ease: [0.65, 0, 0.35, 1],
    },
  },
};

// Floating animation for decorative elements
export const float = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Page transition
export const pageTransition = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

// Scroll-triggered animations
export const scrollReveal = {
  offscreen: {
    opacity: 0,
    y: 50,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.65, 0, 0.35, 1],
    },
  },
};

// Mural layer animations
export const muralLayer = (delay: number = 0, speed: number = 0.5) => ({
  initial: { y: 0 },
  animate: {
    y: ['0%', '100%'],
    transition: {
      duration: 1 / speed,
      delay,
      ease: 'linear',
    },
  },
});

// Transition timing functions
export const transitions = {
  // Spring animation for interactive elements
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  // Smooth easing for reveals
  smooth: {
    duration: 0.8,
    ease: [0.43, 0.13, 0.23, 0.96],
  },
  // Quick transition for micro-interactions
  quick: {
    duration: 0.3,
    ease: 'easeOut',
  },
};