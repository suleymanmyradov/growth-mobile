/**
 * UpgradePrompt — a dismissible banner prompting free users to upgrade.
 *
 * Ported from the web frontend's `UpgradePrompt` + `useTrackUpgradeEvent`:
 * shows when the user is on a free plan and meets a trigger condition (e.g.
 * completion rate > 50%). Tracks the upgrade event for analytics.
 */
import { useRouter } from 'expo-router';
import { Sparkles, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useTrackUpgradeEvent } from '@/features/billing';

export interface UpgradePromptProps {
  /** Whether the user is on a free plan. */
  shouldShow: boolean;
  /** Trigger reason for analytics. */
  trigger: string;
}

export function UpgradePrompt({ shouldShow, trigger }: UpgradePromptProps): ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const [dismissed, setDismissed] = useState(false);
  const trackUpgrade = useTrackUpgradeEvent();

  if (!shouldShow || dismissed) return null;

  const handleUpgrade = () => {
    trackUpgrade.mutate({ eventType: 'upgrade_prompt_tapped', surface: 'progress', trigger });
    router.push('/(app)/paywall');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.accent,
          borderRadius: radius.card,
          padding: spacing.md,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <Sparkles color={colors.accent} size={20} />
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText variant="label">{t('progress.upgradeTitle')}</ThemedText>
          <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
            {t('progress.upgradeBody')}
          </ThemedText>
          <Button variant="outline" size="sm" onPress={handleUpgrade}>
            {t('billing.upgrade')}
          </Button>
        </View>
        <Pressable
          onPress={() => setDismissed(true)}
          accessibilityRole="button"
          accessibilityLabel={t('common.dismiss')}
          hitSlop={8}
          style={{ padding: 4, minHeight: 36, justifyContent: 'center' }}
        >
          <X color={colors.mutedForeground} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
});
