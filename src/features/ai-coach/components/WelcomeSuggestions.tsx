/**
 * WelcomeSuggestions — tappable starter prompts shown when a conversation has
 * no messages yet. Tapping a suggestion sends it as the user's first message.
 *
 * Mirrors the web frontend's `ThreadWelcomeSuggestions`: a small set of
 * product-defined prompts that help a user start a coaching conversation. The
 * prompt text (not just the label) is sent so the coach has full context.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface WelcomeSuggestionsProps {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

interface Suggestion {
  key: string;
  messageKey: string;
}

const SUGGESTIONS: Suggestion[] = [
  { key: 'planDay', messageKey: 'planDayMessage' },
  { key: 'quitWeekThree', messageKey: 'quitWeekThreeMessage' },
  { key: 'reviewWeek', messageKey: 'reviewWeekMessage' },
];

export function WelcomeSuggestions({ onSelect, disabled }: WelcomeSuggestionsProps): ReactNode {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ padding: spacing.xl, alignItems: 'center', gap: spacing.md }}>
      <ThemedText variant="cardTitle" style={{ textAlign: 'center' }}>
        {t('coach.welcomeTitle')}
      </ThemedText>
      <ThemedText variant="body" style={{ color: colors.mutedForeground, textAlign: 'center' }}>
        {t('coach.welcomeBody')}
      </ThemedText>
      <View
        style={{
          flexWrap: 'wrap',
          flexDirection: 'row',
          gap: spacing.sm,
          justifyContent: 'center',
        }}
      >
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion.key}
            onPress={() => onSelect(t(`coach.suggestion.${suggestion.messageKey}`))}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={t(`coach.suggestion.${suggestion.key}`)}
            style={({ pressed }) => [
              styles.chip,
              {
                borderColor: colors.border,
                borderRadius: radius.pill,
                backgroundColor: pressed ? colors.surface : colors.background,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <ThemedText variant="label">{t(`coach.suggestion.${suggestion.key}`)}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
