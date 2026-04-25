// Design tokens — extracted from Tabylga Parts 1-2.html :root + Design System Summary
// Never add values here that aren't in the design file.

export const colors = {
  // ── Surfaces ──────────────────────────────────────────────
  surface: {
    /** App background — warm off-white (--surface-primary) */
    primary: '#F7F6F2',
    /** Cards, inputs, bottom sheets (--surface-card) */
    card: '#FFFFFF',
    /** Dark surfaces — splash, AI screen bg (--surface-inverse) */
    inverse: '#1A1A1A',
    /** Canvas / page background (design tool only) */
    canvas: '#EFEFEA',
  },

  // ── Brand ─────────────────────────────────────────────────
  brand: {
    /** Deep teal — primary actions, nav active, links (--primary: #1E4D6B) */
    primary: '#1E4D6B',
    /** Pressed state for primary (--primary-hover) */
    primaryHover: '#163A52',
    /** Tinted background for primary-tinted surfaces (--primary-light) */
    primaryLight: '#E8EEF2',

    /** Terracotta — CTA buttons, floating actions (--cta) */
    cta: '#C65D3A',
    /** Pressed state for CTA */
    ctaHover: '#A84A2B',
    /** Tinted background for CTA-tinted surfaces */
    ctaLight: '#FBEEE8',
  },

  // ── Semantic status ───────────────────────────────────────
  status: {
    /** Green — online badges, verified, credit amounts */
    success: '#7A9B6E',
    /** Forest green — success text color on light backgrounds */
    successText: '#4a6b40',
    successLight: '#EDF2EA',

    /** Amber — stars, offline, insight bubbles (--warning) */
    warning: '#D4A574',
    /** Warning text color for amber-tinted backgrounds */
    warningText: '#8a6530',
    /** Warning text on dark amber labels */
    warningDark: '#5a3a00',
    warningLight: '#FAF4EA',

    /** Rust — debit, alerts, unavailable, end call (--error) */
    error: '#B84A3E',
    /** Error text on light error backgrounds */
    errorText: '#8a3a30',
    errorLight: '#F8EAE8',
  },

  // ── Text ──────────────────────────────────────────────────
  text: {
    /** Warm black — headings, body copy, default (--text-primary: #2A2922) */
    primary: '#2A2922',
    /** Secondary labels, descriptions (--text-secondary: #7A7A6E) */
    secondary: '#7A7A6E',
    /** Placeholders, hints, disabled (--text-tertiary: #9B9B95) */
    tertiary: '#9B9B95',
    /** Text on dark/inverse surfaces */
    onDark: '#FAFAF7',
    /** Text on brand primary fill */
    onPrimary: '#FFFFFF',
  },

  // ── Borders & Dividers ───────────────────────────────────
  border: {
    /** Horizontal rules, list separators (--divider) */
    divider: '#E8E8E3',
    /** Input default border (--input-border) */
    input: '#D4D4CF',
    /** Input focused border matches brand.primary */
    inputFocused: '#1E4D6B',
  },
} as const;

export type Colors = typeof colors;
