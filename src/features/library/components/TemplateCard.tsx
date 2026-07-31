/**
 * TemplateCard — a card for a habit or goal template in the Templates segment.
 * Tapping routes to the native creation flow pre-filled with the template.
 *
 * Paper (`mobile.md` §8.5): template actions route to the appropriate native
 * creation flow. In-flow card with hairline border.
 */
import { ClipboardList, Target } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Card, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type TemplateCardProps = {
  kind: 'habit' | 'goal';
  id: string;
  name: string;
  description?: string;
  categoryName?: string;
  onPress: () => void;
};

export function TemplateCard({
  kind,
  name,
  description,
  categoryName,
  onPress,
}: TemplateCardProps): React.ReactNode {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const Icon = kind === 'habit' ? ClipboardList : Target;

  return (
    <Card padded={false}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('library.useTemplate', { name })}
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
      >
        <View
          style={{
            padding: spacing.lg,
            gap: spacing.xs,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          <Icon color={colors.accent} size={20} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            {categoryName ? (
              <ThemedText variant="label" style={{ color: colors.accent }}>
                {categoryName}
              </ThemedText>
            ) : null}
            <ThemedText variant="cardTitle" numberOfLines={2}>
              {name}
            </ThemedText>
            {description ? (
              <ThemedText
                variant="bodySmall"
                numberOfLines={3}
                style={{ color: colors.mutedForeground }}
              >
                {description}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Card>
  );
}
