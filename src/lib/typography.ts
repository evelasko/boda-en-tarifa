/**
 * Typography Design System Constants
 * Elegant & Dynamic Wedding Website
 * 
 * This file provides TypeScript constants for the typography system,
 * making it easier to use typography classes in components and maintain consistency.
 */

// Typography class names
export const Typography = {
  // Display styles for hero sections and major announcements
  Display: {
    Large: 'type-display-1',
    Medium: 'type-display-2',
  },
  
  // Heading hierarchy
  Heading: {
    H1: 'type-heading-1',
    H2: 'type-heading-2', 
    H3: 'type-heading-3',
    H4: 'type-heading-4',
    H5: 'type-heading-5',
    H6: 'type-heading-6',
  },
  
  // Body text styles
  Body: {
    Large: 'type-body-large',
    Base: 'type-body-base',
    Small: 'type-body-small',
  },
  
  // UI and utility styles
  UI: {
    Lead: 'type-lead',
    Caption: 'type-caption',
    Overline: 'type-overline',
    Button: 'type-button',
    Link: 'type-link',
    Quote: 'type-quote',
    Label: 'type-label',
  },
} as const;

// CSS custom property names for advanced usage
export const TypographyVariables = {
  // Font families
  FontDisplay: '--font-display',
  FontBody: '--font-body',
  
  // Display styles
  Display1Size: '--type-display-1-size',
  Display1Line: '--type-display-1-line',
  Display1Tracking: '--type-display-1-tracking',
  Display1Weight: '--type-display-1-weight',
  
  Display2Size: '--type-display-2-size',
  Display2Line: '--type-display-2-line',
  Display2Tracking: '--type-display-2-tracking',
  Display2Weight: '--type-display-2-weight',
  
  // Heading styles
  Heading1Size: '--type-heading-1-size',
  Heading1Line: '--type-heading-1-line',
  Heading1Tracking: '--type-heading-1-tracking',
  Heading1Weight: '--type-heading-1-weight',
  
  Heading2Size: '--type-heading-2-size',
  Heading2Line: '--type-heading-2-line',
  Heading2Tracking: '--type-heading-2-tracking',
  Heading2Weight: '--type-heading-2-weight',
  
  Heading3Size: '--type-heading-3-size',
  Heading3Line: '--type-heading-3-line',
  Heading3Tracking: '--type-heading-3-tracking',
  Heading3Weight: '--type-heading-3-weight',
  
  Heading4Size: '--type-heading-4-size',
  Heading4Line: '--type-heading-4-line',
  Heading4Tracking: '--type-heading-4-tracking',
  Heading4Weight: '--type-heading-4-weight',
  
  Heading5Size: '--type-heading-5-size',
  Heading5Line: '--type-heading-5-line',
  Heading5Tracking: '--type-heading-5-tracking',
  Heading5Weight: '--type-heading-5-weight',
  
  Heading6Size: '--type-heading-6-size',
  Heading6Line: '--type-heading-6-line',
  Heading6Tracking: '--type-heading-6-tracking',
  Heading6Weight: '--type-heading-6-weight',
  
  // Body styles
  BodyLargeSize: '--type-body-large-size',
  BodyLargeLine: '--type-body-large-line',
  BodyLargeTracking: '--type-body-large-tracking',
  BodyLargeWeight: '--type-body-large-weight',
  
  BodyBaseSize: '--type-body-base-size',
  BodyBaseLine: '--type-body-base-line',
  BodyBaseTracking: '--type-body-base-tracking',
  BodyBaseWeight: '--type-body-base-weight',
  
  BodySmallSize: '--type-body-small-size',
  BodySmallLine: '--type-body-small-line',
  BodySmallTracking: '--type-body-small-tracking',
  BodySmallWeight: '--type-body-small-weight',
  
  // UI styles
  LeadSize: '--type-lead-size',
  LeadLine: '--type-lead-line',
  LeadTracking: '--type-lead-tracking',
  LeadWeight: '--type-lead-weight',
  
  CaptionSize: '--type-caption-size',
  CaptionLine: '--type-caption-line',
  CaptionTracking: '--type-caption-tracking',
  CaptionWeight: '--type-caption-weight',
  
  OverlineSize: '--type-overline-size',
  OverlineLine: '--type-overline-line',
  OverlineTracking: '--type-overline-tracking',
  OverlineWeight: '--type-overline-weight',
  
  ButtonSize: '--type-button-size',
  ButtonLine: '--type-button-line',
  ButtonTracking: '--type-button-tracking',
  ButtonWeight: '--type-button-weight',
  
  LinkDecoration: '--type-link-decoration',
  LinkDecorationThickness: '--type-link-decoration-thickness',
  LinkUnderlineOffset: '--type-link-underline-offset',
  LinkWeight: '--type-link-weight',
  
  QuoteSize: '--type-quote-size',
  QuoteLine: '--type-quote-line',
  QuoteTracking: '--type-quote-tracking',
  QuoteWeight: '--type-quote-weight',
  
  LabelSize: '--type-label-size',
  LabelLine: '--type-label-line',
  LabelTracking: '--type-label-tracking',
  LabelWeight: '--type-label-weight',
  
  // Transition for dynamic effects
  Transition: '--type-transition',
} as const;

// Type definitions for better TypeScript support
export type TypographyClass = 
  | typeof Typography.Display[keyof typeof Typography.Display]
  | typeof Typography.Heading[keyof typeof Typography.Heading] 
  | typeof Typography.Body[keyof typeof Typography.Body]
  | typeof Typography.UI[keyof typeof Typography.UI];

export type TypographyVariable = typeof TypographyVariables[keyof typeof TypographyVariables];

// Utility function to combine typography classes with other Tailwind classes
export const combineTypographyClasses = (
  typographyClass: TypographyClass,
  additionalClasses?: string
): string => {
  return [typographyClass, additionalClasses].filter(Boolean).join(' ');
};

// Type for CSS custom properties
type CSSCustomProperties = {
  [key: string]: string | number;
};

// Breakpoint-specific overrides using CSS custom properties
export const createResponsiveTypography = (
  variable: TypographyVariable,
  mobileValue: string,
  tabletValue?: string,
  desktopValue?: string,
  largeValue?: string
): CSSCustomProperties => {
  const style: CSSCustomProperties = {};
  
  // Base mobile value
  style[variable] = mobileValue;
  
  // Apply responsive values using CSS custom properties
  if (tabletValue) {
    style[`${variable}-tablet`] = tabletValue;
  }
  if (desktopValue) {
    style[`${variable}-desktop`] = desktopValue;
  }
  if (largeValue) {
    style[`${variable}-large`] = largeValue;
  }
  
  return style;
};

// Design tokens for the typography system
export const TypographyTokens = {
  // Font stacks
  FontFamilies: {
    Display: '"trajan-pro-3", serif',
    Body: '"gotham", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  
  // Scale ratio
  ScaleRatio: 1.618, // Golden ratio
  
  // Font weights available
  FontWeights: {
    Light: 300,
    Regular: 400,
    SemiBold: 600,
    Bold: 700,
    ExtraBold: 800,
  },
  
  // Line height ratios
  LineHeights: {
    Tight: 0.9,
    Snug: 1.1,
    Normal: 1.2,
    Relaxed: 1.5,
    Loose: 1.65,
  },
  
  // Letter spacing values
  LetterSpacing: {
    Tighter: '-0.01em',
    Tight: '-0.005em',
    Normal: '0',
    Wide: '0.005em',
    Wider: '0.01em',
    Widest: '0.025em',
    Display: '0.05em',
  },
  
  // Responsive breakpoints (matches typical design system)
  Breakpoints: {
    Mobile: '320px',
    Tablet: '768px', 
    Desktop: '1024px',
    Large: '1440px',
  },
} as const;

export default Typography; 