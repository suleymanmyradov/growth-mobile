/**
 * Screen — a full-screen wrapper with safe-area insets, background color,
 * optional header (title + optional back action), and scroll support.
 *
 * Route files should use this to keep screens thin and consistent.
 */
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/theme';
import { ThemedText } from './ThemedText';

export type ScreenProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  headerRight?: ReactNode;
  scrollable?: boolean;
  style?: ViewProps['style'];
};

export function Screen({
  children,
  title,
  subtitle,
  onBack,
  headerRight,
  scrollable = false,
  style,
}: ScreenProps): ReactNode {
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();
  const hasHeader = title || onBack || headerRight;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {hasHeader ? (
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderBottomColor: colors.border,
              borderBottomWidth: StyleSheet.hairlineWidth,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                hitSlop={8}
                style={styles.backButton}
              >
                <ArrowLeft color={colors.primaryText} size={24} />
              </Pressable>
            ) : null}
            {title ? (
              <View style={styles.headerTitle}>
                <ThemedText
                  variant="heading"
                  style={{ fontSize: typography.fontSize.lg }}
                  numberOfLines={1}
                >
                  {title}
                </ThemedText>
                {subtitle ? (
                  <ThemedText variant="caption" style={{ color: colors.secondaryText }}>
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>
            ) : null}
          </View>
          {headerRight ? <View>{headerRight}</View> : null}
        </View>
      ) : null}
      <View style={[styles.content, style]}>
        {scrollable ? <ScrollView>{children}</ScrollView> : children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  backButton: { padding: 4, minHeight: 44, minWidth: 44, justifyContent: 'center' },
  headerTitle: { flex: 1 },
  content: { flex: 1 },
});
