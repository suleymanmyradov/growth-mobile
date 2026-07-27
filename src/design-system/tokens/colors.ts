/**
 * Color tokens for light and dark themes.
 *
 * Semantic names decouple component code from concrete color values so the
 * palette can be swapped per system color scheme without touching components.
 */

export type ColorTokens = {
  /** App-wide background. */
  background: string;
  /** Raised surface sitting on top of the background (cards, sheets). */
  surface: string;
  /** Surface raised above `surface` (modals, popovers). */
  surfaceElevated: string;
  /** Primary brand color used for accents and interactive elements. */
  primary: string;
  /** High-contrast text intended for primary content. */
  primaryText: string;
  /** Lower-contrast text intended for secondary content. */
  secondaryText: string;
  /** Hairline borders and dividers. */
  border: string;
  /** Destructive actions and error states. */
  error: string;
  /** Success and positive feedback states. */
  success: string;
  /** Cautionary and warning states. */
  warning: string;
  /** Semi-transparent scrim used behind modals and sheets. */
  overlay: string;
};

export const lightColors: ColorTokens = {
  background: '#FFFFFF',
  surface: '#F7F7F8',
  surfaceElevated: '#FFFFFF',
  primary: '#4F46E5',
  primaryText: '#111827',
  secondaryText: '#6B7280',
  border: '#E5E7EB',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export const darkColors: ColorTokens = {
  background: '#0B0B0F',
  surface: '#15151B',
  surfaceElevated: '#1E1E26',
  primary: '#818CF8',
  primaryText: '#F9FAFB',
  secondaryText: '#9CA3AF',
  border: '#2A2A33',
  error: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  overlay: 'rgba(0, 0, 0, 0.6)',
};
