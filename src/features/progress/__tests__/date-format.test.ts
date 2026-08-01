import { describe, expect, it } from '@jest/globals';

import { formatWeekLabel } from '../date-format';

describe('formatWeekLabel', () => {
  it('formats calendar dates without timezone shifts', () => {
    expect(formatWeekLabel('2026-07-27', '2026-08-02')).toBe(
      `${new Date(2026, 6, 27).toLocaleDateString()} – ${new Date(2026, 7, 2).toLocaleDateString()}`,
    );
  });

  it('returns null for invalid dates instead of rendering Invalid Date', () => {
    expect(formatWeekLabel('2026-02-30', 'not-a-date')).toBeNull();
  });
});
