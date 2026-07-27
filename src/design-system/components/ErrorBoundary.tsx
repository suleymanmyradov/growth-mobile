/**
 * Error boundary that catches rendering errors anywhere in its subtree and
 * shows a fallback UI with a Reload button.
 */
import { router } from 'expo-router';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Theme } from '../theme/theme';
import { useTheme } from '../theme/theme';

export type ErrorBoundaryProps = {
  children: ReactNode;
  /** Optional custom fallback rendered when an error is caught. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  reloadButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reloadText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

/**
 * Fallback UI rendered when the error boundary catches an error. Uses the
 * active theme for colors so it blends with the rest of the app.
 */
function DefaultFallback({ error, theme }: { error: Error; theme: Theme }): ReactNode {
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="error-boundary-fallback"
    >
      <Text style={[styles.title, { color: theme.colors.error }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: theme.colors.secondaryText }]}>{error.message}</Text>
      <Pressable
        style={[styles.reloadButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.reload()}
        accessibilityRole="button"
        accessibilityLabel="Reload"
      >
        <Text style={[styles.reloadText, { color: theme.colors.background }]}>Reload</Text>
      </Pressable>
    </View>
  );
}

/**
 * React error boundary. Class components are required for error boundaries
 * because React does not provide a hook equivalent of `componentDidCatch`.
 *
 * The Reload button calls `router.reload()` from `expo-router` to reload the
 * current route, falling back to resetting the boundary state.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error !== null) {
      if (fallback !== undefined) {
        return fallback(error, this.reset);
      }
      return <ThemedFallback error={error} />;
    }

    return children;
  }
}

/**
 * Wrapper that gives the default fallback access to the active theme via the
 * `useTheme` hook. Kept separate from the class boundary because hooks cannot
 * be called inside a class component.
 */
function ThemedFallback({ error }: { error: Error }): ReactNode {
  const theme = useTheme();
  return <DefaultFallback error={error} theme={theme} />;
}
