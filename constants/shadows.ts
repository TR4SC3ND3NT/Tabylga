// Shadow tokens for the brighter mobile interface.

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
    shadowColor: '#1368F2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  android: {
    elevation: 4,
  },
  default: {
    shadowColor: '#1368F2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
})!;

/** Card elevated — hovered / focused card, stronger lift */
export const shadowCardElevated: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#142033',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 34,
  },
  android: {
    elevation: 12,
  },
  default: {
    shadowColor: '#142033',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 34,
  },
})!;

/** Floating action button — CTA terracotta glow */
export const shadowFloating: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#FF4F7B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },
  android: {
    elevation: 12,
  },
  default: {
    shadowColor: '#FF4F7B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },
})!;

/** Modal / bottom sheet — upward shadow from bottom edge */
export const shadowModal: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#142033',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
  },
  android: {
    elevation: 16,
  },
  default: {
    shadowColor: '#142033',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
  },
})!;

export const shadows = {
  card: shadowCard,
  cardElevated: shadowCardElevated,
  floating: shadowFloating,
  modal: shadowModal,
} as const;
