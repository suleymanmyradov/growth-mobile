const { withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * Strips entitlements that a free Personal Apple Developer team cannot use, for
 * local (non-EAS) builds so the app can be code-signed without a paid account.
 *
 * Currently strips:
 *   - `aps-environment` (Push Notifications) — not supported by Personal teams.
 *     The Push Notifications capability in modern Xcode projects is implied by
 *     the presence of this entitlement, so removing it is sufficient (no pbxproj
 *     capability removal needed).
 *   - `com.apple.developer.applesignin` (Sign In with Apple) — not supported by
 *     Personal teams. Removing the entitlement removes the capability.
 *
 * EAS builds set `EAS_BUILD_PROFILE` at build time; when that is present we skip
 * stripping, so preview/production (and EAS development) builds keep these
 * capabilities enabled with their proper credentials.
 *
 * Usage in app.config.ts plugins array:
 *   ['./plugins/stripPushForLocalDev', { enabled: true }]
 */
function withPushStrippedForLocalDev(config, options = {}) {
  const enabled = options?.enabled !== false;
  const isEasBuild = Boolean(process.env.EAS_BUILD_PROFILE);
  if (!enabled || isEasBuild) return config;

  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    delete config.modResults['com.apple.developer.applesignin'];
    return config;
  });
}

module.exports = withPushStrippedForLocalDev;
