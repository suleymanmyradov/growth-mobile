/**
 * Text input with theme-aware styling, label, error message, and accessibility.
 *
 * - Minimum 44pt height for touch target.
 * - Label rendered above the input.
 * - Error message rendered below in the error color.
 * - Accessibility label and hint wired to the native TextInput.
 */
import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';

import { useTheme } from '../theme/theme';

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

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: colors.primaryText,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              marginBottom: spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={hint}
        accessibilityValue={{ text: rest.value ?? '' }}
        placeholderTextColor={colors.secondaryText}
        style={[
          styles.input,
          {
            color: colors.primaryText,
            backgroundColor: colors.surface,
            borderColor: hasError ? colors.error : colors.border,
            borderWidth: 1,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            fontSize: typography.fontSize.md,
            minHeight: 44,
          },
          style,
        ]}
        {...rest}
      />
      {hasError ? (
        <Text
          style={[
            styles.message,
            {
              color: colors.error,
              fontSize: typography.fontSize.xs,
              marginTop: spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          style={[
            styles.message,
            {
              color: colors.secondaryText,
              fontSize: typography.fontSize.xs,
              marginTop: spacing.xs,
            },
          ]}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {},
  input: {},
  message: {},
});
