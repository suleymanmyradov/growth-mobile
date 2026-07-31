/**
 * EntitlementBanner — shows the AI coaching entitlement/usage state on the
 * Coach tab.
 *
 * Paper (`mobile.md` §8.4): "Entitlement/usage banner with a specific Upgrade
 * action when limits are known." Renders a quiet banner when personalized AI is
 * available, and an Upgrade affordance when the plan does not include
 * personalized AI. Never trusts client entitlement alone for gating actions —
 * the backend enforces limits; this banner is informational only.
 */
import { Sparkles } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Entitlements } from '@/core/api/schemas';
import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface EntitlementBannerProps {
  entitlements: Entitlements;
  onUpgrade?: () => void;
}

export function EntitlementBanner({ entitlements, onUpgrade }: EntitlementBannerProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const canUseAi = entitlements.canUsePersonalizedAi;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 12,
        backgroundColor: canUseAi ? colors.surface : colors.accent + '14',
        borderWidth: 1,
        borderColor: canUseAi ? colors.border : colors.accent,
      }}
    >
      <Sparkles color={canUseAi ? colors.mutedForeground : colors.accent} size={18} />
      <View style={{ flex: 1 }}>
        <ThemedText variant="label" style={{ color: colors.foreground }}>
          {canUseAi ? t('coach.entitled') : t('coach.notEntitled')}
        </ThemedText>
      </View>
      {!canUseAi && onUpgrade ? (
        <Pressable
          onPress={onUpgrade}
          accessibilityRole="button"
          accessibilityLabel={t('coach.upgrade')}
          hitSlop={8}
          style={{
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.md,
            borderRadius: 999,
            backgroundColor: colors.accent,
            minHeight: 36,
            justifyContent: 'center',
          }}
        >
          <ThemedText style={{ color: colors.accentForeground, fontWeight: '600' }}>
            {t('coach.upgrade')}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
