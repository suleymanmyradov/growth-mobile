/**
 * CheckInChart — a simple bar chart showing daily check-in counts for the week.
 *
 * Ported from the web frontend's `CheckInChart` with `getDailyCheckInCounts`:
 * shows 7 bars (Mon-Sun) with check-in counts. Uses pure View-based bars
 * (no chart library dependency).
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, SectionLabel, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface CheckInChartProps {
  /** Daily counts, e.g. { Mon: 3, Tue: 2, ... }. Keys are day abbreviations. */
  dailyCounts: Record<string, number>;
}

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CheckInChart({ dailyCounts }: CheckInChartProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const entries = DAY_ORDER.map((day) => [day, dailyCounts[day] ?? 0] as const);
  const maxCount = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionLabel>{t('progress.checkInChart')}</SectionLabel>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {entries.map(([day, count]) => (
            <View key={day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                {count}
              </ThemedText>
              <View
                style={{
                  width: '100%',
                  flex: 1,
                  backgroundColor: colors.input,
                  borderRadius: 4,
                  overflow: 'hidden',
                  justifyContent: 'flex-end',
                }}
              >
                <View
                  style={{
                    width: '100%',
                    height: `${(count / maxCount) * 100}%`,
                    backgroundColor: count > 0 ? colors.accent : 'transparent',
                    borderRadius: 4,
                    minHeight: count > 0 ? 4 : 0,
                  }}
                />
              </View>
              <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                {day}
              </ThemedText>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
