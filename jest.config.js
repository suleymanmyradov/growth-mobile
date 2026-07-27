module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-clone-referenced-element|@shopify/flash-list|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@gorhom/bottom-sheet|react-native-svg|lucide-react-native|@tanstack/react-query|zustand|react-i18next|i18next)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
