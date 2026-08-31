/**
 * ToolFallback — collapsible display for a tool call that doesn't have a
 * dedicated UI (e.g. non-proposal tools).
 *
 * Ported from the web frontend's `components/ai-conversation/tool-fallback.tsx`:
 * shows the tool name with expand/collapse to reveal args and result.
 * On mobile, the collapse toggle uses a Pressable with chevron icons.
 */
import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export interface ToolFallbackProps {
  toolName: string;
  argsText: string;
  result?: unknown;
}

export function ToolFallback({ toolName, argsText, result }: ToolFallbackProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          borderRadius: radius.card,
        },
      ]}
    >
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <Check color={colors.accent} size={14} />
        <ThemedText variant="caption" style={{ flex: 1 }}>
          {t('coach.toolUsed')}: <ThemedText variant="label">{toolName}</ThemedText>
        </ThemedText>
        <Pressable
          onPress={() => setCollapsed((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={
            collapsed ? t('coach.toolShowDetails') : t('coach.toolHideDetails')
          }
          hitSlop={8}
          style={{ padding: 8, minHeight: 36, justifyContent: 'center' }}
        >
          {collapsed ? (
            <ChevronDown color={colors.mutedForeground} size={16} />
          ) : (
            <ChevronUp color={colors.mutedForeground} size={16} />
          )}
        </Pressable>
      </View>

      {!collapsed ? (
        <View style={{ gap: spacing.sm, paddingTop: spacing.sm, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }}>
          <View style={{ paddingHorizontal: spacing.md }}>
            <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
              {argsText}
            </ThemedText>
          </View>
          {result !== undefined ? (
            <View
              style={{
                paddingHorizontal: spacing.md,
                paddingTop: spacing.sm,
                borderTopColor: colors.border,
                borderTopWidth: StyleSheet.hairlineWidth,
              }}
            >
              <ThemedText variant="label">{t('coach.toolResult')}</ThemedText>
              <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
  },
});
