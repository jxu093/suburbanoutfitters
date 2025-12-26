module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
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
};
