// Typography tokens — extracted from Tabylga Parts 1-2.html
// Font families: Inter (UI) · Fraunces (editorial/display)
// All sizes in px — convert to React Native points (1:1 on standard density).

export const fontFamily = {
  /** Inter — all UI text, labels, body, buttons */
  sans: 'Inter',
  /** Fraunces — display headings, wordmark, editorial accents */
  display: 'Fraunces',
} as const;

export const fontSize = {
  /** 11px — nav tab labels, eyebrow labels (uppercase + tracking) */
  xs: 11,
  /** 12px — captions, badges, legal, skeleton labels */
  sm: 12,
  /** 13px — helper text, chips, star/review counts, secondary actions */
  base: 13,
  /** 14px — secondary nav links, screen sub-labels */
  md: 14,
  /** 15px — input text, body copy (tighter screens) */
  body: 15,
  /** 16px — default body, button labels, primary body paragraphs */
  lg: 16,
  /** 18px — section titles inside screens */
  xl: 18,
  /** 22px — OTP digits, section headers (editorial) */
  '2xl': 22,
  /** 28px — screen h1 (editorial) */
  '3xl': 28,
  /** 40px — wordmark (editorial) */
  '4xl': 40,
  /** 44px — page-level display (editorial) */
  display: 44,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.2,
  normal: 1.3,
  relaxed: 1.4,
  loose: 1.5,
} as const;

export const letterSpacing = {
  /** Editorial display headings */
  tighter: 0,
  /** Screen h1 (editorial) */
  tight: 0,
  /** Section heading (editorial) */
  snug: 0,
  /** Default — no extra tracking */
  normal: 0,
  /** Badges, pills */
  wide: 0,
  /** Screen idx labels */
  wider: 0,
  /** Eyebrow labels, all-caps */
  widest: 0,
  /** Monospace micro labels */
  mono: 0,
} as const;

// ── Predefined text style objects ────────────────────────────
// Use these as spread targets: { ...textStyles.bodyLarge, color: colors.text.secondary }
// Do NOT add fontFamily here — apply via NativeWind's font-sans / font-display classes.

export const textStyles = {
  /** 44px / semibold / editorial / tight — page-level hero copy */
  displayH1: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.display * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  /** 40px / semibold / editorial / tight — app wordmark */
  wordmark: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  /** 28px / semibold / editorial / snug — screen H1 */
  screenH1: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize['3xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  /** 22px / semibold / editorial / snug — section headers */
  sectionHeader: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize['2xl'] * lineHeight.snug,
    letterSpacing: letterSpacing.snug,
  },
  /** 18px / semibold / sans / relaxed — in-screen section titles */
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.relaxed,
  },
  /** 16px / semibold / sans / tight — primary button label */
  button: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.lg * lineHeight.tight,
  },
  /** 16px / regular / sans / loose — default body paragraph */
  bodyLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.lg * lineHeight.loose,
  },
  /** 15px / regular / sans / loose — input text, body (compact) */
  body: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.body * lineHeight.loose,
  },
  /** 14px / medium / sans / normal — secondary links, labels */
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.md * lineHeight.normal,
  },
  /** 13px / medium / sans / tight — chips, helper text */
  chip: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.tight,
  },
  /** 13px / semibold / sans / tight — star rating value */
  rating: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.base * lineHeight.tight,
  },
  /** 12px / medium / sans / normal — badges, captions */
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  /** 12px / regular / sans / loose — legal, terms fine print */
  legal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.loose,
  },
  /** 11px / medium / sans / tight — nav tab labels */
  navTab: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.xs * lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  },
  /** 12px / medium / sans / uppercase — eyebrow labels */
  eyebrow: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },
  /** 22px / semibold / sans — OTP digit */
  numericDisplay: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  /** 15px / semibold / sans — status bar time */
  statusBar: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    lineHeight: 15 * lineHeight.tight,
  },
} as const;

export type TextStyles = typeof textStyles;
