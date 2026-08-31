/**
 * Tests for the ReportScreen component.
 *
 * Verifies that the screen:
 * - Renders the title, subtitle, and form fields with accessibility labels
 * - Renders the category selector and submit button
 * - Renders the thank-you confirmation after a successful submission
 *
 * Form submission via react-hook-form is tested through the API mock here
 * which verifies the mutation flow end-to-end.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import { renderWithTheme } from '@/design-system/test-utils/render';

import { ReportScreen } from '../screens/ReportScreen';

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
  useLocalSearchParams: () => ({ title: '', type: '' }),
  usePathname: () => '/',
  Link: ({ children }: { children: unknown }) => children,
  Stack: ({ children }: { children: unknown }) => children,
  Tabs: ({ children }: { children: unknown }) => children,
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

const mockSubmitReport = jest.fn();

jest.mock('../api', () => ({
  submitReport: (...a: unknown[]) => mockSubmitReport(...a),
}));

jest.mock('@/core/api/client', () => ({
  getBareClient: () => ({ post: jest.fn() }),
  apiRequest: jest.fn(),
  setInstallationId: jest.fn(),
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
// ReportScreen
// ============================================

describe('ReportScreen', () => {
  it('renders the title, heading, and subtitle', async () => {
    const { getByText } = await renderWithQueryClient(React.createElement(ReportScreen));

    expect(getByText('report.title')).toBeTruthy();
    expect(getByText('report.heading')).toBeTruthy();
    expect(getByText('report.subtitle')).toBeTruthy();
  });

  it('renders the subject, details, and email inputs with accessibility labels', async () => {
    const { getByLabelText } = await renderWithQueryClient(React.createElement(ReportScreen));

    expect(getByLabelText('report.subject')).toBeTruthy();
    expect(getByLabelText('report.details')).toBeTruthy();
    expect(getByLabelText('report.email')).toBeTruthy();
  });

  it('renders the category selector tabs', async () => {
    const { getByText } = await renderWithQueryClient(React.createElement(ReportScreen));

    expect(getByText('report.categoryBug')).toBeTruthy();
    expect(getByText('report.categoryFeedback')).toBeTruthy();
    expect(getByText('report.categoryAbuse')).toBeTruthy();
  });

  it('renders the submit button', async () => {
    const { getByText } = await renderWithQueryClient(React.createElement(ReportScreen));

    expect(getByText('report.submit')).toBeTruthy();
  });

  it('shows the thank-you confirmation after a successful submission', async () => {
    mockSubmitReport.mockResolvedValueOnce(undefined);

    const { getByLabelText, getByText } = await renderWithQueryClient(
      React.createElement(ReportScreen),
    );

    // Fill required fields.
    fireEvent.changeText(getByLabelText('report.subject'), 'A bug');
    fireEvent.changeText(getByLabelText('report.details'), 'Something went wrong');

    // Submit.
    fireEvent.press(getByText('report.submit'));

    await waitFor(() => {
      expect(getByText('report.thankYouTitle')).toBeTruthy();
      expect(getByText('report.thankYouBody')).toBeTruthy();
    });

    expect(mockSubmitReport).toHaveBeenCalledTimes(1);
  });
});
