/**
 * Hotel Factories - Design System & Theme Configuration
 * Centralized design tokens for colors, typography, spacing, shadows, radii, and component variants.
 *
 * Color Palette Overview:
 * - brand: Minimal luxury hospitality (black, slate, zinc)
 * - coral: Signature accent (bookings, active tabs, highlights)
 * - gold: Festive offers, ratings, luxury highlights
 * - emerald: Success, free cancellation, verified badges
 * - blue: OTA features, map markers, informational badges
 * - teal: OTA search CTAs and highlights (NEW)
 * - neutral: Slate greys and background colors
 * - status: Success, warning, error, info states
 * - additional: Gradient colors and specific element colors (NEW)
 *
 * Usage:
 *   import theme, { colors, typography, spacing, shadows, radii } from '@/theme';
 *   // or
 *   import { colors } from '../theme';
 *
 * To add a new color to the theme:
 * 1. Add it to the appropriate section below
 * 2. Add CSS custom property in tailwind.css @theme block
 * 3. Update components to use theme colors instead of inline hex
 */

export const colors = {
  // Primary brand color using classic minimal luxury black
  brand: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
    primary: '#000000',
    primaryHover: '#18181b',
    primaryDark: '#000000',
    primaryLight: '#f4f4f5',
    primarySurface: '#e4e4e7'
  },

  // Primary alias matching brand.primary (black)
  primary: {
    DEFAULT: '#000000',
    hover: '#18181b',
    dark: '#000000',
    light: '#f4f4f5',
    surface: '#e4e4e7'
  },

  // Gray Palette (Tailwind Gray)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },

  // Signature Coral / Action Accent (Bookings, Active Tabs, Highlights)
  coral: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#d84e55',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#7a1b20',
    DEFAULT: '#d84e55',
    hover: '#be123c',
    active: '#9f1239',
    light: '#fff1f2'
  },

  // Gold / Amber (Festive Offers, Ratings, Luxury Highlights)
  gold: {
    50: '#fef3c7',
    100: '#fde68a',
    200: '#fcd34d',
    300: '#fbbf24',
    400: '#f59e0b',
    500: '#d97706',
    600: '#b45309',
    700: '#92400e',
    DEFAULT: '#d97706',
    light: '#fef3c7',
    hover: '#b45309'
  },

  // Emerald / Success (Free cancellation, verified badges, confirmations)
  emerald: {
    50: '#d1fae5',
    100: '#a7f3d0',
    200: '#6ee7b7',
    300: '#34d399',
    400: '#10b981',
    500: '#059669',
    600: '#047857',
    700: '#065f46',
    DEFAULT: '#059669',
    light: '#d1fae5',
    hover: '#047857'
  },

  // Blue / Info (OTA features, map markers, informational badges)
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#2563eb',
    600: '#1d4ed8',
    700: '#003b95',
    800: '#00224f',
    DEFAULT: '#2563eb',
    light: '#dbeafe',
    deep: '#003b95'
  },

  // Neutrals & Slate Greys
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#09090b',
    1000: '#000000'
  },

  // Semantic UI tokens
  ui: {
    background: '#f8fafc',
    card: '#ffffff',
    cardMuted: '#f1f5f9',
    text: '#161c29',
    textSecondary: '#334155',
    muted: '#64748b',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    divider: '#e4e4e7',
    darkHero: '#141c2e',
    overlay: 'rgba(0, 0, 0, 0.45)',
    backdrop: 'rgba(15, 23, 42, 0.65)'
  },

  // Status Colors
  status: {
    success: '#059669',
    successLight: '#d1fae5',
    warning: '#d97706',
    warningLight: '#fef3c7',
    error: '#e11d48',
    errorLight: '#ffe4e6',
    info: '#2563eb',
    infoLight: '#dbeafe'
  },

  // Teal / OTA Colors (Search, CTAs, Highlights)
  // Used in SearchScreen for search CTA buttons, tags, and gradient backgrounds
  teal: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#2563eb',
    600: '#1d4ed8',
    700: '#0891b2',
    800: '#0e7490',
    900: '#0f8b4d',
    950: '#0c7a41',
    DEFAULT: '#2563eb',
    hover: '#1d4ed8',
    active: '#14532d',
    light: '#eff6ff'
  },

  // Additional UI colors used in gradients and components
  // gradientStart: Dark start color for search screen gradients
  // gradientMiddle: Middle color for search screen gradients
  // gradientEnd: End color for search screen gradients (primary teal CTA)
  // ctaHover: Hover state for CTA buttons
  // darkRed: Used for badges and accent elements
  additional: {
    // Gradient colors from SearchScreen
    gradientStart: '#075985',
    gradientMiddle: '#0369a1',
    gradientEnd: '#0ea5e9',
    // Button/element colors
    ctaHover: '#0284c7',
    // Dark red used in badges
    darkRed: '#450e11'
  }
};

export const typography = {
  fontFamilies: {
    sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    heading: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
  },
  fontSizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    md: '1.125rem',    // 18px
    lg: '1.25rem',     // 20px
    xl: '1.5rem',      // 24px
    '2xl': '1.875rem', // 30px
    '3xl': '2.25rem',  // 36px
    '4xl': '3rem',     // 48px
    '5xl': '3.75rem'   // 60px
  },
  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
};

export const spacing = {
  0: '0px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  48: '12rem',     // 192px
  56: '14rem',     // 224px
  64: '16rem'      // 256px
};

export const radii = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px'
};

export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  md: '0 4px 14px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 30px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 45px rgba(0, 0, 0, 0.14)',
  '2xl': '0 25px 60px rgba(0, 0, 0, 0.2)',
  card: '0 2px 10px rgba(0, 0, 0, 0.06)',
  cardHover: '0 12px 28px rgba(0, 0, 0, 0.12)',
  floating: '0 16px 40px -8px rgba(0, 0, 0, 0.18)',
  popover: '0 10px 38px -10px rgba(22, 23, 24, 0.35), 0 10px 20px -15px rgba(22, 23, 24, 0.2)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
};

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  backdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
  max: 9999
};

export const transitions = {
  fast: '0.15s ease',
  normal: '0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  slow: '0.35s cubic-bezier(0.16, 1, 0.3, 1)',
  spring: '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

export const breakpoints = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

/**
 * Reusable pre-defined Component Styles & Tokens
 */
export const componentStyles = {
  buttons: {
    primary: {
      backgroundColor: colors.brand.primary,
      color: '#ffffff',
      borderRadius: radii.md,
      fontWeight: typography.fontWeights.semibold,
      transition: transitions.fast,
      hover: {
        backgroundColor: colors.brand.primaryHover
      }
    },
    coral: {
      backgroundColor: colors.coral.DEFAULT,
      color: '#ffffff',
      borderRadius: radii.md,
      fontWeight: typography.fontWeights.bold,
      transition: transitions.fast,
      hover: {
        backgroundColor: colors.coral.hover
      }
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.brand.primary,
      border: `1px solid ${colors.neutral[300]}`,
      borderRadius: radii.md,
      fontWeight: typography.fontWeights.medium,
      transition: transitions.fast,
      hover: {
        backgroundColor: colors.neutral[100]
      }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.neutral[700],
      borderRadius: radii.md,
      fontWeight: typography.fontWeights.medium,
      transition: transitions.fast,
      hover: {
        backgroundColor: colors.neutral[100]
      }
    }
  },
  cards: {
    base: {
      backgroundColor: colors.ui.card,
      border: `1px solid ${colors.ui.border}`,
      borderRadius: radii.xl,
      boxShadow: shadows.sm,
      transition: transitions.normal
    },
    hoverable: {
      backgroundColor: colors.ui.card,
      border: `1px solid ${colors.ui.border}`,
      borderRadius: radii.xl,
      boxShadow: shadows.sm,
      transition: transitions.normal,
      hover: {
        boxShadow: shadows.cardHover,
        transform: 'translateY(-2px)'
      }
    }
  },
  badges: {
    rating: {
      backgroundColor: colors.emerald.DEFAULT,
      color: '#ffffff',
      borderRadius: radii.sm,
      fontWeight: typography.fontWeights.bold,
      fontSize: typography.fontSizes.xs
    },
    deal: {
      backgroundColor: colors.coral.light,
      color: colors.coral.DEFAULT,
      borderRadius: radii.full,
      fontWeight: typography.fontWeights.semibold,
      fontSize: typography.fontSizes.xs
    },
    festive: {
      backgroundColor: colors.gold.light,
      color: colors.gold.DEFAULT,
      borderRadius: radii.full,
      fontWeight: typography.fontWeights.semibold,
      fontSize: typography.fontSizes.xs
    }
  }
};

/**
 * Helper utility to convert Hex color to RGBA string with opacity
 */
export function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return hex;
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Helper to safely resolve a nested color path like 'brand.primary' or 'coral.500'
 */
export function getColor(colorPath, fallback = '#000000') {
  if (!colorPath) return fallback;
  const parts = colorPath.split('.');
  let current = colors;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return fallback;
    }
  }
  return typeof current === 'string' ? current : fallback;
}

/**
 * Master Theme Object
 */
export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  zIndex,
  transitions,
  breakpoints,
  components: componentStyles,
  utils: {
    hexToRgba,
    getColor
  }
};

export default theme;

