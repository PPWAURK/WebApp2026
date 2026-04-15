// Shared responsive breakpoints used across all screen components.
// Always import from here rather than hardcoding magic numbers in components.

/** Narrow content: compact card layouts, single-column grids */
export const BREAKPOINT_COMPACT = 560;

/** Tablet: medium layouts, tablet-width two-column forms */
export const BREAKPOINT_TABLET = 768;

/**
 * Desktop: sidebar becomes visible in AuthenticatedShell.
 * Matches DESKTOP_BREAKPOINT in AuthenticatedShell.styles.ts.
 */
export const BREAKPOINT_DESKTOP = 1024;

/** Wide desktop: full multi-column content layouts */
export const BREAKPOINT_WIDE = 1180;

/** Ultra-wide: expanded grid layouts for very large screens */
export const BREAKPOINT_ULTRA_WIDE = 1400;
