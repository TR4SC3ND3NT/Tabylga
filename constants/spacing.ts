// Spacing & radius tokens — extracted from Tabylga Parts 1-2.html
// All values in pixels (React Native density-independent points).

// ── Spacing scale ─────────────────────────────────────────────
// Maps to Tailwind p-1 … p-16 via tailwind.config.js extension.
export const spacing = {
  /** 4px — micro gaps (dot separators, icon-text gap) */
  1: 4,
  /** 8px — tight gaps (pill padding, star gaps) */
  2: 8,
  /** 10px — OTP box gap, small input padding */
  2.5: 10,
  /** 12px — standard gap (pill height padding, section gap) */
  3: 12,
  /** 14px — chip padding, country pill padding */
  3.5: 14,
  /** 16px — base padding (input horizontal, card inner) */
  4: 16,
  /** 18px — resend timer gap, bottom-sheet handle margin */
  4.5: 18,
  /** 20px — screen horizontal padding (standard) */
  5: 20,
  /** 24px — section spacing, bottom nav padding-bottom */
  6: 24,
  /** 28px — auth form section gap */
  7: 28,
  /** 32px — card image + text gap, hero padding */
  8: 32,
  /** 40px — page header gap */
  10: 40,
  /** 48px — large vertical rhythm */
  12: 48,
  /** 54px — status bar height (safe area top) */
  statusBar: 54,
  /** 56px — standard interactive element height (button, input) */
  inputHeight: 56,
  /** 64px — extra-large spacing */
  16: 64,
  /** 80px — bottom nav bar total height */
  bottomNav: 80,
} as const;

// ── Icon sizes ────────────────────────────────────────────────
export const iconSize = {
  /** 12px — inline micro icons (badge sparkle, pill dot) */
  xs: 12,
  /** 14px — star rating icons */
  sm: 14,
  /** 16px — dropdown chevrons */
  md: 16,
  /** 18px — helper / contextual icons */
  lg: 18,
  /** 22px — nav tab icons */
  nav: 22,
  /** 24px — standard touch-target icon */
  xl: 24,
} as const;

// ── Border radii ──────────────────────────────────────────────
export const radius = {
  /** 8px — skeleton loaders, small chips */
  sm: 8,
  /** 12px — inputs, country pill, OTP boxes, helper cards */
  md: 12,
  /** 16px — primary buttons, card components */
  lg: 16,
  /** 24px — bottom sheet top corners, hero image, modal */
  xl: 24,
  /** 44px — phone frame (reference only) */
  phone: 44,
  /** 999px — pills, chips, fully round elements */
  pill: 999,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type IconSize = typeof iconSize;
