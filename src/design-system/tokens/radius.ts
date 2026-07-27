/**
 * Border radius tokens.
 *
 * A shared radius scale keeps corner roundness consistent across cards,
 * buttons, inputs, and other surfaces.
 */

export type RadiusScale = {
  sm: 4;
  md: 8;
  lg: 12;
  xl: 16;
  full: 9999;
};

export type RadiusTokens = RadiusScale;

export const radius: RadiusTokens = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
