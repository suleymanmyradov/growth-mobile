/**
 * Tests for the HelpScreen component.
 *
 * Verifies that the screen:
 * - Renders the title, heading, and subtitle
 * - Renders all help sections from the structured content
 * - Renders the footer link to Report a problem
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { renderWithTheme } from '@/design-system/test-utils/render';

import { helpSections } from '../help-content';
import { HelpScreen } from '../screens/HelpScreen';

// --- Mocks ---

jest.mock('@gorhom/bottom-sheet', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
  BottomSheetBackdrop: () => null,
  BottomSheetScrollView: ({ children }: { children: unknown }) => children,
  BottomSheetView: ({ children }: { children: unknown }) => children,
}));

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: (...a: unknown[]) => mockRouterPush(...a),
    back: (...a: unknown[]) => mockRouterBack(...a),
    replace: jest.fn(),
    navigate: jest.fn(),
  }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  Link: ({ children }: { children: unknown }) => children,
  Stack: ({ children }: { children: unknown }) => children,
  Tabs: ({ children }: { children: unknown }) => children,
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

// --- Helpers ---

let activeQueryClient: QueryClient | null = null;

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  activeQueryClient = queryClient;
  return renderWithTheme(React.createElement(QueryClientProvider, { client: queryClient }, ui));
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  if (activeQueryClient) {
    activeQueryClient.clear();
    activeQueryClient = null;
  }
});

// ============================================
// HelpScreen
// ============================================

describe('HelpScreen', () => {
  it('renders the title, heading, and subtitle', async () => {
    const { getByText } = await renderWithQueryClient(React.createElement(HelpScreen));

    expect(getByText('help.title')).toBeTruthy();
    expect(getByText('help.heading')).toBeTruthy();
    expect(getByText('help.subtitle')).toBeTruthy();
  });

  it('renders every help section title from the content', async () => {
    const { getAllByText } = await renderWithQueryClient(React.createElement(HelpScreen));

    for (const section of helpSections) {
      // SectionLabel renders the title; the card also renders it.
      expect(getAllByText(section.title).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('renders the footer link to Report a problem', async () => {
    const { getByLabelText } = await renderWithQueryClient(React.createElement(HelpScreen));

    expect(getByLabelText('help.reportLink')).toBeTruthy();
  });
});
