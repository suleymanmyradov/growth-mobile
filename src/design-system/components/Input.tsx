/**
 * Text input with Paper styling, label, error/help message, and accessibility.
 *
 * Paper rules (`mobile.md` §7/§5.3):
 * - Inputs are 48 high.
 * - Accent focus ring without glow; destructive (invalid) ring on error.
 * - Label rendered above; error/help below in the appropriate semantic color.
 * - Accessibility label and hint wired to the native TextInput.
 */
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';

import { useTheme } from '../theme/theme';
import { ThemedText } from './ThemedText';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewProps['style'];
};

export function Input({
  label,
  error,
  hint,
  containerStyle,
  style,
  accessibilityLabel,
  ...rest
}: InputProps): ReactNode {
  const { colors, spacing, radius, typography } = useTheme();
  const hasError = !!error;
  const [focused, setFocused] = useState(false);

  const ringColor = hasError ? colors.destructive : focused ? colors.accent : colors.input;

  return (
    <View style={containerStyle}>
      {label ? (
        <ThemedText variant="label" style={{ color: colors.foreground, marginBottom: spacing.xs }}>
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={hint}
        accessibilityValue={{ text: rest.value ?? '' }}
        placeholderTextColor={colors.mutedForeground}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.surface,
            borderColor: ringColor,
            borderWidth: focused || hasError ? 2 : 1,
            borderRadius: radius.field,
            paddingHorizontal: spacing.md,
            fontSize: typography.fontSize.md,
            minHeight: 48,
          },
          style,
        ]}
        {...rest}
      />
      {hasError ? (
        <Text style={[styles.message, { color: colors.destructive, marginTop: spacing.xs }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.message, { color: colors.mutedForeground, marginTop: spacing.xs }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {},
  message: { fontSize: 12, lineHeight: 16 },
});
