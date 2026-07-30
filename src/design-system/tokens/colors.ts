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
 * Temporary back-compat aliases (removed in Phase J once consumers migrate):
 * - `error` mirrors `destructive`.
 * - `secondaryText` mirrors `mutedForeground`.
 * - `primaryText` mirrors `foreground`.
 * - `warning` / `warningForeground` have no Paper equivalent; they alias
 *   `destructive` / `destructiveForeground` as an interim value so the two
 *   remaining callers compile while they are migrated to Paper semantics.
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
  /** High-contrast text. Temporary alias of `foreground`. */
  primaryText: string;
  /** Lower-contrast text. Temporary alias of `mutedForeground`. */
  secondaryText: string;
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
  /** Temporary alias of `destructive` for existing feature code. */
  error: string;
  /** Success and positive feedback states. Same sage as `accent`. */
  success: string;
  /** Foreground on `success`. Same as `accentForeground`. */
  successForeground: string;
  /** Soft success fill for tinted backgrounds. */
  successSoft: string;
  /** Temporary cautionary alias; no Paper equivalent. Aliases `destructive`. */
  warning: string;
  /** Foreground on `warning`. Temporary alias of `destructiveForeground`. */
  warningForeground: string;
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
  primaryText: '#1C1A17',
  secondaryText: '#6E6A63',
  border: 'rgba(28,26,23,0.10)',
  input: 'rgba(28,26,23,0.14)',
  ring: '#4F6B57',
  destructive: '#B4553F',
  destructiveForeground: '#F6F4EF',
  error: '#B4553F',
  success: '#4F6B57',
  successForeground: '#F6F4EF',
  successSoft: '#F1F4EF',
  warning: '#B4553F',
  warningForeground: '#F6F4EF',
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
  primaryText: '#F0EDE6',
  secondaryText: '#8C877E',
  border: 'rgba(255,255,255,0.08)',
  input: 'rgba(255,255,255,0.14)',
  ring: '#7FA189',
  destructive: '#C9705A',
  destructiveForeground: '#161514',
  error: '#C9705A',
  success: '#7FA189',
  successForeground: '#161514',
  successSoft: '#2A322C',
  warning: '#C9705A',
  warningForeground: '#161514',
  overlay: 'rgba(0,0,0,0.60)',
};
