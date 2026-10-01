/**
 * TextPromptDialog — a cross-platform single-field text prompt.
 *
 * `Alert.prompt` is iOS-only; on Android the Me tab uses this dialog for the
 * same edit flows (timezone, check-in time). Modal + Input + Save/Cancel with
 * an optional validator that renders an inline error and blocks submit.
 *
 * Rendered conditionally by the parent (`prompt === 'x' && <TextPromptDialog>`)
 * — field state is seeded from `initialValue` on mount, so each open starts
 * fresh without a reset effect.
 */
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button, Input, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type TextPromptDialogProps = {
  title: string;
  hint?: string;
  initialValue: string;
  inputAccessibilityLabel?: string;
  /** Return an error message to reject the value, or null to accept. */
  validate?: (value: string) => string | null;
  onSubmit: (value: string) => void;
  onClose: () => void;
};

export function TextPromptDialog({
  title,
  hint,
  initialValue,
  inputAccessibilityLabel,
  validate,
  onSubmit,
  onClose,
}: TextPromptDialogProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    const message = validate?.(trimmed) ?? null;
    if (message) {
      setError(message);
      return;
    }
    onSubmit(trimmed);
    onClose();
  };

  return (
    <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel={t('common.dismiss')}
          />
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.card,
                padding: spacing.lg,
                marginHorizontal: spacing.xl,
              },
            ]}
          >
            <ThemedText variant="rowTitle" style={{ marginBottom: spacing.md }}>
              {title}
            </ThemedText>
            <Input
              value={value}
              onChangeText={setValue}
              hint={error ? undefined : hint}
              error={error ?? undefined}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel={inputAccessibilityLabel ?? title}
              containerStyle={{ marginBottom: spacing.md }}
            />
            <View style={[styles.actions, { gap: spacing.sm }]}>
              <Button variant="ghost" onPress={onClose}>
                {t('common.cancel')}
              </Button>
              <Button onPress={handleSubmit}>{t('common.save')}</Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'center' },
  card: {},
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
