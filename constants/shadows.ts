// Shadow tokens — extracted from Tabylga Parts 1-2.html
// CSS originals:
//   --shadow-card:      0 2px 8px rgba(26,26,26,0.04)
//   --shadow-card-elev: 0 8px 24px rgba(26,26,26,0.08)
//   --shadow-floating:  0 8px 16px rgba(198,93,58,0.25)
//   --shadow-modal:     0 -4px 24px rgba(26,26,26,0.12)
//
// React Native shadow props apply to iOS.
// elevation applies to Android (maps to a standard Material depth).

import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  | 'shadowColor'
  | 'shadowOffset'
  | 'shadowOpacity'
  | 'shadowRadius'
  | 'elevation'
>;

/** Card at rest — subtle lift, barely perceptible */
export const shadowCard: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: {
    elevation: 2,
  },
  default: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
})!;

/** Card elevated — hovered / focused card, stronger lift */
export const shadowCardElevated: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  android: {
    elevation: 8,
  },
  default: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
})!;

/** Floating action button — CTA terracotta glow */
export const shadowFloating: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#C65D3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  android: {
    elevation: 12,
  },
  default: {
    shadowColor: '#C65D3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
})!;

/** Modal / bottom sheet — upward shadow from bottom edge */
export const shadowModal: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  android: {
    elevation: 16,
  },
  default: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
})!;

export const shadows = {
  card: shadowCard,
  cardElevated: shadowCardElevated,
  floating: shadowFloating,
  modal: shadowModal,
} as const;
