# Typography Design System

## Elegant & Dynamic Wedding Website

This documentation covers the comprehensive typography system built for the unconventional wedding website using TailwindCSS 4.

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Technical Implementation](#technical-implementation)
4. [Typography Hierarchy](#typography-hierarchy)
5. [Usage Guide](#usage-guide)
6. [Responsive Design](#responsive-design)
7. [Accessibility Features](#accessibility-features)
8. [Performance Optimizations](#performance-optimizations)
9. [Extending the System](#extending-the-system)
10. [Troubleshooting](#troubleshooting)

## Overview

The typography system provides a complete set of text styles designed for an elegant yet dynamic wedding website. It balances sophistication with vibrant energy, using carefully chosen fonts and mathematical scaling for optimal readability and visual hierarchy.

### Key Features

- **Fluid Responsive Scaling**: Uses CSS `clamp()` for smooth scaling across devices
- **Golden Ratio Typography Scale**: Mathematical progression for harmonic visual rhythm
- **Adobe Fonts Integration**: Professional typefaces (Trajan Pro 3 & Gotham)
- **TailwindCSS 4 Native**: Built with the new `@theme` directive approach
- **Accessibility First**: WCAG 2.1 compliant with motion and contrast preferences
- **Performance Optimized**: Efficient font loading and rendering

## Design Philosophy

### Aesthetic Goals

**Elegant & Sophisticated**:

- Generous letter-spacing for display text
- Classical serif font (Trajan Pro 3) for headings
- Clean, readable sans-serif (Gotham) for body text

**Vibrant & Dynamic**:

- Smooth CSS transitions on hover/interaction
- Fluid scaling that feels alive
- Subtle animations respect user preferences

### Typography Pairing

**Trajan Pro 3** (Display & Headings):

- Classical Roman inscriptional capitals
- Conveys timeless elegance and ceremony
- Used for: Display text, H1-H4 headings
- Weights: 400 (Regular), 700 (Bold)

**Gotham** (Body & UI):

- Modern geometric sans-serif
- Clean, readable, contemporary feel
- Used for: Body text, H5-H6, UI elements
- Weights: 300 (Light), 400 (Regular), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)

## Technical Implementation

### TailwindCSS 4 Configuration

The system uses the new `@theme` directive in `globals.css`:

```css
@theme {
  --font-display: "trajan-pro-3", serif;
  --font-body: "gotham", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  
  /* Typography variables with responsive sizing */
  --type-display-1-size: clamp(3.5rem, 8vw + 1rem, 8rem);
  --type-display-1-line: 0.9;
  --type-display-1-tracking: 0.05em;
  --type-display-1-weight: 400;
  /* ... additional variables */
}
```

### CSS Custom Properties Structure

Each typography style includes properties for:

- `size`: Font size with responsive clamp()
- `line`: Line height ratio
- `tracking`: Letter spacing
- `weight`: Font weight

### Utility Classes

Generated utility classes in `@layer utilities`:

```css
.type-display-1 {
  font-family: var(--font-display);
  font-size: var(--type-display-1-size);
  line-height: var(--type-display-1-line);
  letter-spacing: var(--type-display-1-tracking);
  font-weight: var(--type-display-1-weight);
  text-transform: uppercase;
  transition: var(--type-transition);
}
```

## Typography Hierarchy

### Display Styles

**Purpose**: Hero sections, major announcements, primary focal points

- `.type-display-1`: Largest impact text (3.5rem - 8rem)
- `.type-display-2`: Secondary display text (2.5rem - 5.5rem)

**Characteristics**:

- Trajan Pro 3 font family
- Uppercase transformation
- Generous letter-spacing (0.03em - 0.05em)
- Tight line-height (0.9 - 1.0)

### Heading Hierarchy

**Purpose**: Content structure and organization

- `.type-heading-1`: Main page headings (2.25rem - 4rem)
- `.type-heading-2`: Section headings (1.875rem - 3rem)
- `.type-heading-3`: Subsection headings (1.5rem - 2.25rem)
- `.type-heading-4`: Component headings (1.25rem - 1.75rem)
- `.type-heading-5`: Minor headings (1.125rem - 1.375rem)
- `.type-heading-6`: Smallest headings (1rem - 1.125rem)

**Font Usage**:

- H1-H4: Trajan Pro 3 (elegant, ceremonial)
- H5-H6: Gotham (clean, readable)

### Body Text Styles

**Purpose**: Reading content with optimal readability

- `.type-body-large`: Emphasized content (1.125rem - 1.375rem)
- `.type-body-base`: Default body text (1rem - 1.125rem)
- `.type-body-small`: Secondary content (0.875rem - 1rem)

**Characteristics**:

- Gotham font family
- Optimized line-heights (1.6 - 1.65)
- Subtle letter-spacing adjustments

### UI & Utility Styles

**Purpose**: Interface elements and specialized content

- `.type-lead`: Introduction paragraphs
- `.type-caption`: Image captions, helper text
- `.type-overline`: Category labels, eyebrows
- `.type-button`: Button text
- `.type-link`: Link styling with hover effects
- `.type-quote`: Blockquotes and testimonials
- `.type-label`: Form labels

## Usage Guide

### Basic Implementation

**Import the Typography Constants**:

```typescript
import { Typography } from './typography';
```

**Simple Usage**:

```jsx
<h1 className={Typography.Display.Large}>
  Emma & James
</h1>

<p className={Typography.Body.Base}>
  Join us for our wedding celebration...
</p>
```

**With Additional Classes**:

```jsx
<h2 className={`${Typography.Heading.H2} text-center text-gray-800 mb-8`}>
  Our Story
</h2>
```

### Using Helper Functions

**Combine Classes Utility**:

```jsx
import { Typography, combineTypographyClasses } from './typography';

<p className={combineTypographyClasses(
  Typography.UI.Lead, 
  'text-gray-600 mt-4 text-center'
)}>
  Wedding details...
</p>
```

### Advanced Customization

**Access CSS Variables Directly**:

```jsx
<div style={{
  fontSize: 'var(--type-heading-1-size)',
  fontFamily: 'var(--font-display)',
  letterSpacing: '0.1em' // Custom override
}}>
  Custom styled text
</div>
```

**Dynamic Typography Variables**:

```jsx
import { createResponsiveTypography, TypographyVariables } from './typography';

const customStyle = createResponsiveTypography(
  TypographyVariables.Heading1Size,
  '1.5rem',    // mobile
  '2rem',      // tablet
  '2.5rem',    // desktop
  '3rem'       // large
);
```

## Responsive Design

### Breakpoint Strategy

The system uses four primary breakpoints:

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px - 1440px
- **Large**: 1440px+

### Fluid Scaling Implementation

All typography uses CSS `clamp()` for smooth scaling:

```css
/* Example: Display Large */
--type-display-1-size: clamp(
  3.5rem,           /* Minimum size (mobile) */
  8vw + 1rem,       /* Preferred size (fluid) */
  8rem              /* Maximum size (large screens) */
);
```

### Responsive Behavior

- **Text never becomes too small** on mobile devices
- **Scales smoothly** between breakpoints without jumps
- **Maintains readability** at all screen sizes
- **Preserves hierarchy** across different devices

## Accessibility Features

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  .type-* {
    transition: none;
  }
}
```

### High Contrast Support

```css
@media (prefers-contrast: high) {
  .type-caption,
  .type-overline {
    opacity: 1; /* Increased visibility */
  }
}
```

### WCAG 2.1 Compliance

- **Color contrast**: Design system supports proper contrast ratios
- **Font sizes**: Minimum sizes ensure readability
- **Line heights**: Optimized for scanning and reading
- **Letter spacing**: Enhanced readability for headings

### Screen Reader Support

- Semantic HTML structure recommended
- Proper heading hierarchy (H1 → H2 → H3...)
- Meaningful text alternatives

## Performance Optimizations

### Font Loading

**Adobe Fonts Integration**:

```css
@import url('https://use.typekit.net/tqk3qdr.css');
```

### Optimized Rendering

```css
body {
  /* Improved text rendering */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-variant-ligatures: common-ligatures;
}
```

### CSS Loading Strategy

- Critical typography CSS inlined
- Non-critical styles loaded asynchronously
- Font display optimization for faster perceived performance

### Print Optimization

```css
@media print {
  .type-display-1,
  .type-display-2 {
    font-size: 2.5rem; /* Fixed sizes for print */
    letter-spacing: 0.02em;
  }
  /* ... additional print styles */
}
```

## Extending the System

### Adding New Typography Styles

1. **Define CSS Variables in @theme**:

```css
@theme {
  --type-custom-size: clamp(1rem, 2vw, 1.5rem);
  --type-custom-line: 1.4;
  --type-custom-tracking: 0.01em;
  --type-custom-weight: 500;
}
```

2. **Create Utility Class**:

```css
@layer utilities {
  .type-custom {
    font-family: var(--font-body);
    font-size: var(--type-custom-size);
    line-height: var(--type-custom-line);
    letter-spacing: var(--type-custom-tracking);
    font-weight: var(--type-custom-weight);
    transition: var(--type-transition);
  }
}
```

3. **Update TypeScript Constants**:

```typescript
export const Typography = {
  // ... existing styles
  Custom: 'type-custom',
} as const;
```

### Customizing Existing Styles

**Override CSS Variables**:

```css
:root {
  --type-heading-1-size: clamp(2rem, 4vw, 3.5rem); /* Custom sizing */
  --type-heading-1-tracking: 0.03em; /* Wider letter spacing */
}
```

**Component-Level Overrides**:

```jsx
<h1 
  className={Typography.Heading.H1}
  style={{ '--type-heading-1-tracking': '0.1em' }}
>
  Custom spaced heading
</h1>
```

### Adding Font Variations

**Include Additional Weights**:

```css
@theme {
  --font-display-light: "trajan-pro-3", serif;
  --font-display-light-weight: 300;
}
```

**Create Weight-Specific Classes**:

```css
.type-heading-1-light {
  font-family: var(--font-display-light);
  font-weight: var(--font-display-light-weight);
  /* ... other properties */
}
```

## Troubleshooting

### Common Issues

**Fonts Not Loading**:

- Verify Adobe Fonts URL is correct
- Check network connectivity
- Ensure font names match exactly

**Responsive Scaling Issues**:

- Check clamp() syntax in CSS variables
- Verify viewport meta tag is present
- Test across different screen sizes

**TypeScript Errors**:

- Ensure all typography constants are properly exported
- Check import paths are correct
- Verify TypeScript types are up to date

### Debug Techniques

**Inspect CSS Variables**:

```javascript
// In browser console
getComputedStyle(document.documentElement)
  .getPropertyValue('--type-heading-1-size')
```

**Test Responsive Behavior**:

```css
/* Temporary debugging styles */
.type-heading-1::after {
  content: ' (' attr(style) ')';
  font-size: 0.5em;
  opacity: 0.5;
}
```

### Performance Monitoring

**Measure Font Loading**:

```javascript
// Check if fonts are loaded
document.fonts.ready.then(() => {
  console.log('All fonts loaded');
});
```

**Monitor Layout Shifts**:

- Use Web Vitals tools
- Check for font swap during loading
- Optimize font-display settings

---

## Quick Reference

### Class Names Summary

| Purpose | Class | Font | Size Range |
|---------|-------|------|------------|
| Hero Text | `.type-display-1` | Trajan Pro 3 | 3.5rem - 8rem |
| Sub Hero | `.type-display-2` | Trajan Pro 3 | 2.5rem - 5.5rem |
| Page Title | `.type-heading-1` | Trajan Pro 3 | 2.25rem - 4rem |
| Section | `.type-heading-2` | Trajan Pro 3 | 1.875rem - 3rem |
| Subsection | `.type-heading-3` | Trajan Pro 3 | 1.5rem - 2.25rem |
| Component | `.type-heading-4` | Trajan Pro 3 | 1.25rem - 1.75rem |
| Minor | `.type-heading-5` | Gotham | 1.125rem - 1.375rem |
| Smallest | `.type-heading-6` | Gotham | 1rem - 1.125rem |
| Large Body | `.type-body-large` | Gotham | 1.125rem - 1.375rem |
| Body | `.type-body-base` | Gotham | 1rem - 1.125rem |
| Small Body | `.type-body-small` | Gotham | 0.875rem - 1rem |
| Lead | `.type-lead` | Gotham | 1.25rem - 1.625rem |
| Caption | `.type-caption` | Gotham | 0.75rem - 0.875rem |
| Overline | `.type-overline` | Gotham | 0.75rem - 0.875rem |
| Button | `.type-button` | Gotham | 0.875rem - 1rem |
| Link | `.type-link` | Gotham | Inherits |
| Quote | `.type-quote` | Gotham | 1.125rem - 1.5rem |
| Label | `.type-label` | Gotham | 0.875rem - 1rem |

### Import Statements

```typescript
// Basic usage
import { Typography } from './typography';

// Advanced usage
import { 
  Typography, 
  combineTypographyClasses,
  TypographyVariables,
  TypographyTokens,
  createResponsiveTypography 
} from './typography';
```

---

*This typography system was designed to create a beautiful, accessible, and maintainable foundation for the wedding website, balancing elegance with modern web standards.*
