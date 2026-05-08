// Design tokens for the mobile-first Tabylga interface.

export const colors = {
  // ── Surfaces ──────────────────────────────────────────────
  surface: {
    /** App background */
    primary: '#F4F7FB',
    /** Cards, inputs, bottom sheets (--surface-card) */
    card: '#FFFFFF',
    /** Dark surfaces — splash, AI screen bg (--surface-inverse) */
    inverse: '#111827',
    /** Canvas / page background (design tool only) */
    canvas: '#E9F3FF',
    /** Soft elevated surface */
    raised: '#FDF7EF',
  },

  // ── Brand ─────────────────────────────────────────────────
  brand: {
    /** Electric lake blue — primary actions, nav active, links */
    primary: '#1368F2',
    /** Pressed state for primary (--primary-hover) */
    primaryHover: '#0A4FCC',
    /** Tinted background for primary-tinted surfaces (--primary-light) */
    primaryLight: '#E7F0FF',

    /** Raspberry coral — CTA buttons, floating actions (--cta) */
    cta: '#FF4F7B',
    /** Pressed state for CTA */
    ctaHover: '#D93661',
    /** Tinted background for CTA-tinted surfaces */
    ctaLight: '#FFE6EE',
  },

  // ── Expressive accents ───────────────────────────────────
  accent: {
    aqua: '#18C8B8',
    violet: '#775CFF',
    lemon: '#FFD166',
    mint: '#35C982',
    peach: '#FF9A5A',
  },

  // ── Semantic status ───────────────────────────────────────
  status: {
    /** Green — online badges, verified, credit amounts */
    success: '#24B26B',
    /** Forest green — success text color on light backgrounds */
    successText: '#087846',
    successLight: '#E0F8EC',

    /** Amber — stars, offline, insight bubbles (--warning) */
    warning: '#FFB82E',
    /** Warning text color for amber-tinted backgrounds */
    warningText: '#8A5900',
    /** Warning text on dark amber labels */
    warningDark: '#5A3900',
    warningLight: '#FFF2CC',

    /** Rust — debit, alerts, unavailable, end call (--error) */
    error: '#E5485D',
    /** Error text on light error backgrounds */
    errorText: '#9E2334',
    errorLight: '#FFE2E8',
  },

  // ── Text ──────────────────────────────────────────────────
  text: {
    /** Warm black — headings, body copy, default (--text-primary: #2A2922) */
    primary: '#142033',
    /** Secondary labels, descriptions (--text-secondary: #7A7A6E) */
    secondary: '#607089',
    /** Placeholders, hints, disabled (--text-tertiary: #9B9B95) */
    tertiary: '#98A6B8',
    /** Text on dark/inverse surfaces */
    onDark: '#F9FBFF',
    /** Text on brand primary fill */
    onPrimary: '#FFFFFF',
  },

  // ── Borders & Dividers ───────────────────────────────────
  border: {
    /** Horizontal rules, list separators (--divider) */
    divider: '#DCE6F2',
    /** Input default border (--input-border) */
    input: '#C8D6E7',
    /** Input focused border matches brand.primary */
    inputFocused: '#1368F2',
  },
} as const;

export type Colors = typeof colors;
