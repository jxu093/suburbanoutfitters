module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '<rootDir>/__tests__/closet.ui.test.tsx',
    '<rootDir>/__tests__/outfits.ui.test.tsx',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
      isolatedModules: true,
    },
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  // Allow transforming react-native and testing libs which ship untranspiled ESM code
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@testing-library|@react-navigation|expo|@expo)/)'
  ],
  // Remove testMatch override to allow Jest to discover tests naturally while ignoring specified paths.
  // testMatch: ['<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
