/**
 * Paper color tokens for light and dark themes.
 *
 * The approved native "Paper" design (see `mobile.md` and `Mobile Redesign
 * (standalone).html`) uses a warm neutral ground with one sage accent. This
 * replaces the older Apple-inspired multi-accent palette.
 *
 * Semantic names decouple component code from concrete color values so the
 * palette can be swapped per system color scheme without touching components.
 *
 * Phase J removed the temporary back-compat aliases (`error`, `secondaryText`,
 * `primaryText`, `warning`, `warningForeground`) once all consumers migrated to
 * the Paper semantic tokens (`destructive`, `mutedForeground`, `foreground`).
 *
 * The older `calm*`, `growth*`, `energy*`, and `chart1`–`chart5` tokens had no
 * feature consumers at the Phase A baseline, so they are dropped from the
 * schema now rather than carried as dead aliases.
 */
export type ColorTokens = {
  /** App-wide background. Warm paper ground. */
  background: string;
  /** Foreground text on background. */
  foreground: string;
  /** Raised surface sitting on top of the background (cards). */
  surface: string;
  /** Foreground on `surface`. */
  surfaceForeground: string;
  /** Surface raised above `surface` (modals, popovers, sheets). */
  surfaceElevated: string;
  /** Foreground on `surfaceElevated`. */
  surfaceElevatedForeground: string;
  /** Primary brand color. In Paper this is the foreground ink. */
  primary: string;
  /** Foreground on `primary`. */
  primaryForeground: string;
  /** Secondary fill (muted surface). */
  secondary: string;
  /** Foreground on `secondary`. */
  secondaryForeground: string;
  /** Muted fill for rest states. Same value as `secondary` in Paper. */
  muted: string;
  /** Muted foreground text. */
  mutedForeground: string;
  /** Accent color — the single sage green. */
  accent: string;
  /** Foreground on `accent`. */
  accentForeground: string;
  /** Hairline borders and dividers. */
  border: string;
  /** Input field borders. */
  input: string;
  /** Focus ring color. */
  ring: string;
  /** Destructive actions and error states (terracotta). */
  destructive: string;
  /** Foreground on `destructive`. */
  destructiveForeground: string;
  /** Success and positive feedback states. Same sage as `accent`. */
  success: string;
  /** Foreground on `success`. Same as `accentForeground`. */
  successForeground: string;
  /** Soft success fill for tinted backgrounds. */
  successSoft: string;
  /** Semi-transparent scrim used behind modals and sheets. */
  overlay: string;
};

export const lightColors: ColorTokens = {
  background: '#F6F4EF',
  foreground: '#1C1A17',
  surface: '#FFFFFF',
  surfaceForeground: '#1C1A17',
  surfaceElevated: '#FFFFFF',
  surfaceElevatedForeground: '#1C1A17',
  primary: '#1C1A17',
  primaryForeground: '#F6F4EF',
  secondary: '#EAE6DE',
  secondaryForeground: '#1C1A17',
  muted: '#EAE6DE',
  mutedForeground: '#6E6A63',
  accent: '#4F6B57',
  accentForeground: '#F6F4EF',
  border: 'rgba(28,26,23,0.10)',
  input: 'rgba(28,26,23,0.14)',
  ring: '#4F6B57',
  destructive: '#B4553F',
  destructiveForeground: '#F6F4EF',
  success: '#4F6B57',
  successForeground: '#F6F4EF',
  successSoft: '#F1F4EF',
  overlay: 'rgba(28,26,23,0.40)',
};

export const darkColors: ColorTokens = {
  background: '#161514',
  foreground: '#F0EDE6',
  surface: '#201E1B',
  surfaceForeground: '#F0EDE6',
  surfaceElevated: '#201E1B',
  surfaceElevatedForeground: '#F0EDE6',
  primary: '#F0EDE6',
  primaryForeground: '#161514',
  secondary: '#2E2B27',
  secondaryForeground: '#F0EDE6',
  muted: '#2E2B27',
  mutedForeground: '#8C877E',
  accent: '#7FA189',
  accentForeground: '#161514',
  border: 'rgba(255,255,255,0.08)',
  input: 'rgba(255,255,255,0.14)',
  ring: '#7FA189',
  destructive: '#C9705A',
  destructiveForeground: '#161514',
  success: '#7FA189',
  successForeground: '#161514',
  successSoft: '#2A322C',
  overlay: 'rgba(0,0,0,0.60)',
};
