// Jest setup — runs before each test file.
// Mock native modules that aren't available in the test environment.

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => () => {}),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

jest.mock('expo-constants', () => {
  const expoConfig = {
    name: 'Evolella Dev',
    slug: 'evolella',
    extra: { appEnv: 'development' },
  };
  // Mirror the real module: expoConfig lives on the default export.
  return { __esModule: true, default: { expoConfig }, expoConfig };
});

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en', languageTag: 'en-US' }]),
}));

// Mock expo-router — the real package uses ESM that Jest can't parse.
// Tests that need router behavior can override these mocks per-file.
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  Link: ({ children }) => children,
  Stack: ({ children }) => children,
  Tabs: ({ children }) => children,
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
