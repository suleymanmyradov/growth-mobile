/**
 * Test render helper for design-system components.
 *
 * Wraps a node in the ThemeProvider that components need and renders it,
 * returning the @testing-library/react-native RenderResult. Uses the
 * loaded-fonts=false path (system fallbacks) so tests don't depend on
 * expo-font asset loading. `render` is async in this library version.
 *
 * SafeAreaProvider is intentionally omitted: the native safe-area provider does
 * not render children under the test renderer. Components that need safe-area
 * insets mock `react-native-safe-area-context` per-file.
 */
import { render, type RenderResult } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '../theme/theme';

export async function renderWithTheme(ui: ReactNode): Promise<RenderResult> {
  return render(<ThemeProvider fontsLoaded={false}>{ui}</ThemeProvider>);
}
