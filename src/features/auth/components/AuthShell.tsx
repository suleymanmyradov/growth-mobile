/**
 * AuthShell — shared layout for auth screens.
 *
 * Wraps the `Screen` primitive with a `KeyboardAvoidingView` and a vertically
 * centered, scrollable content container using the auth/onboarding gutter
 * (24 units, `mobile.md` §5.3). Auth screens compose their header + form +
 * footer inside this shell so keyboard avoidance and spacing stay consistent.
 */
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type AuthShellProps = {
  children: ReactNode;
  /** Override the vertical alignment; defaults to centered. */
  justify?: 'center' | 'between';
};

export function AuthShell({ children, justify = 'center' }: AuthShellProps): ReactNode {
  const { spacing } = useTheme();

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: 24,
              paddingVertical: spacing.xxxl,
              justifyContent: justify === 'between' ? 'space-between' : 'center',
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: spacing.lg, width: '100%' }}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
});
