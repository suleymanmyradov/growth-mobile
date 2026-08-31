/**
 * FeatureLock — a Pro-gated wrapper that shows children when the user has the
 * required entitlement, or a locked state with an upgrade prompt when not.
 *
 * Ported from the web frontend's `FeatureLock` component: wraps content behind
 * a Pro gate with a lock icon, feature name, and an upgrade action that routes
 * to the paywall.
 */
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface FeatureLockProps {
  /** Whether the user has the required entitlement (e.g. isPro). */
  isUnlocked: boolean;
  /** Feature name shown in the locked state. */
  featureName: string;
  /** Optional description shown in the locked state. */
  description?: string;
  /** Content to render when unlocked. */
  children: ReactNode;
}

export function FeatureLock({
  isUnlocked,
  featureName,
  description,
  children,
}: FeatureLockProps): ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useTheme();

  if (isUnlocked) return children;

  return (
    <Card>
      <View style={{ gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.md }}>
        <Lock color={colors.mutedForeground} size={24} />
        <ThemedText variant="label">{featureName}</ThemedText>
        {description ? (
          <ThemedText
            variant="caption"
            style={{ color: colors.mutedForeground, textAlign: 'center' }}
          >
            {description}
          </ThemedText>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onPress={() => router.push('/(app)/paywall')}
          accessibilityLabel={t('billing.upgrade')}
        >
          {t('billing.upgrade')}
        </Button>
      </View>
    </Card>
  );
}
