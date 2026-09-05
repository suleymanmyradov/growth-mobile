const { withAppDelegate, withInfoPlist } = require('@expo/config-plugins');

/**
 * Injects `RCTBundleURLProvider.sharedSettings().jsLocation = "<host>"` into
 * the iOS AppDelegate so a development build on a physical device knows where
 * Metro is running. Without this, RCTBundleURLProvider defaults to `localhost`,
 * which is unreachable from the phone.
 *
 * Only active for local (non-EAS) development builds. EAS builds set
 * `EAS_BUILD_PROFILE` and are skipped. The host is read from
 * `EXPO_PUBLIC_METRO_HOST` (fallback: auto-detect via os.hostname LAN IP is
 * not reliable across platforms, so we require an explicit env var or fall
 * back to a configurable default).
 *
 * Usage in app.config.ts:
 *   ['./plugins/withDevBundleHost', { host: process.env.EXPO_PUBLIC_METRO_HOST }]
 */
function withDevBundleHost(config, options = {}) {
  const isEasBuild = Boolean(process.env.EAS_BUILD_PROFILE);
  const host = options?.host;
  if (!host || isEasBuild) return config;

  config = withInfoPlist(config, (config) => {
    config.modResults.NSLocalNetworkUsageDescription ??=
      'Allow Growth to connect to the local development server.';
    return config;
  });

  return withAppDelegate(config, (config) => {
    const swift = config.modResults;
    if (swift.language !== 'swift') return config;

    // Inject jsLocation assignment right before the return in bundleURL()
    // The DEBUG branch looks like:
    //   return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "...")
    // We prepend a jsLocation setter.
    const oldLine =
      '    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")';
    const newLines = `    RCTBundleURLProvider.sharedSettings().jsLocation = "${host}"
    return RCTBundleURLProvider.jsBundleURL(
      forBundleRoot: ".expo/.virtual-metro-entry",
      packagerHost: "${host}",
      enableDev: true,
      enableMinification: false,
      inlineSourceMap: false
    )`;

    if (swift.contents.includes(oldLine)) {
      swift.contents = swift.contents.replace(oldLine, newLines);
    }

    return config;
  });
}

module.exports = withDevBundleHost;
