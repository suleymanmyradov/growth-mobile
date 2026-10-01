import { describe, expect, it } from '@jest/globals';

import { getDeviceTimezone, isValidTimezone } from '../timezone';

describe('isValidTimezone', () => {
  it('accepts IANA names', () => {
    for (const tz of ['UTC', 'Europe/Berlin', 'America/New_York', 'Asia/Tokyo', 'Etc/GMT+5']) {
      expect(isValidTimezone(tz)).toBe(true);
    }
  });

  it('rejects invalid names', () => {
    for (const tz of ['', 'garbage', 'Europe/Nowhere', 'UTC+05:00', ' Europe/Berlin']) {
      expect(isValidTimezone(tz)).toBe(false);
    }
  });
});

describe('getDeviceTimezone', () => {
  it('returns the Intl-resolved zone', () => {
    expect(getDeviceTimezone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });
});
