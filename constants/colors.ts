// Design tokens — extracted from Tabylga Parts 1-2.html :root
// Never add values here that aren't in the design file.

export const colors = {
  // ── Surfaces ──────────────────────────────────────────────
  surface: {
    /** App background — warm off-white #FAFAF7 */
    primary: '#FAFAF7',
    /** Cards, inputs, bottom sheets */
    card: '#FFFFFF',
    /** Dark surfaces (splash, AI screen bg) */
    inverse: '#1A1A1A',
    /** Canvas / page background (design tool only, maps to surface.primary in app) */
    canvas: '#EFEFEA',
  },

  // ── Brand ─────────────────────────────────────────────────
  brand: {
    /** Deep teal — primary actions, nav active, links */
    primary: '#1E4D6B',
    /** Pressed state for primary */
    primaryHover: '#163A52',
    /** Tinted background for primary-tinted surfaces */
    primaryLight: '#E8EEF2',

    /** Terracotta — CTA buttons, floating actions */
    cta: '#C65D3A',
    /** Pressed state for CTA */
    ctaHover: '#A84A2B',
    /** Tinted background for CTA-tinted surfaces */
    ctaLight: '#FBEEE8',
  },

  // ── Semantic status ───────────────────────────────────────
  status: {
    success: '#7A9B6E',
    successLight: '#EDF2EA',
    warning: '#D4A574',
    warningLight: '#FAF4EA',
    error: '#B84A3E',
    errorLight: '#F8EAE8',
  },

  // ── Text ──────────────────────────────────────────────────
  text: {
    /** Headings, body copy, default */
    primary: '#1A1A1A',
    /** Secondary labels, descriptions */
    secondary: '#6B6B65',
    /** Placeholders, hints, disabled */
    tertiary: '#9B9B95',
    /** Text on dark/inverse surfaces */
    onDark: '#FAFAF7',
    /** Text on brand primary fill */
    onPrimary: '#FFFFFF',
  },

  // ── Borders & Dividers ───────────────────────────────────
  border: {
    /** Horizontal rules, list separators */
    divider: '#E8E8E3',
    /** Input default border */
    input: '#D4D4CF',
    /** Input focused border (matches brand.primary) */
    inputFocused: '#1E4D6B',
  },
} as const;

export type Colors = typeof colors;
