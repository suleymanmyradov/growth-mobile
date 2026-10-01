/**
 * Device timezone detection + IANA validation.
 *
 * `settings.timezone` (an IANA id) drives server-side habit streaks and
 * reminder scheduling — the client is responsible for reporting the device's
 * real zone and for validating user-entered zones before they reach the
 * backend (an invalid name would fail every `AT TIME ZONE` query with a 500).
 */
import * as Localization from 'expo-localization';

/** The device's IANA timezone (e.g. "Europe/Berlin"), or null if unavailable. */
export function getDeviceTimezone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  } catch {
    // Intl unavailable — fall back to the native calendar below.
  }
  try {
    return Localization.getCalendars()[0]?.timeZone ?? null;
  } catch {
    return null;
  }
}

/** True when `tz` is a usable IANA timezone name ("Europe/Berlin", "UTC"). */
export function isValidTimezone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
