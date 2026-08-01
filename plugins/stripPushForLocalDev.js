const { withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * Strips the `aps-environment` entitlement for local (non-EAS) builds so the
 * app can be code-signed with a free Personal Apple Developer team, which does
 * not support the Push Notifications capability.
 *
 * EAS builds set `EAS_BUILD_PROFILE` at build time; when that is present we skip
 * stripping, so preview/production (and EAS development) builds keep push
 * notifications enabled with their proper credentials.
 *
 * The Push Notifications capability in modern Xcode projects is implied by the
 * presence of the `aps-environment` entitlement, so removing the entitlement is
 * sufficient — no pbxproj capability removal is needed.
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
    return config;
  });
}

module.exports = withPushStrippedForLocalDev;
