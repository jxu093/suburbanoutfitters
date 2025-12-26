// Test setup - intentionally minimal to avoid transforming React Native ESM modules
// Define commonly expected globals for React Native environment
global.__DEV__ = true;

// Provide a simple Platform.select implementation to satisfy theme code
// Use react-native's jest mock base if available
try {
  jest.mock('react-native', () => {
    const rnMock = require('react-native/jest/mock');
    if (rnMock && rnMock.Platform) {
      rnMock.Platform.select = (obj) => obj?.default ?? obj?.ios ?? obj?.android ?? obj;
    }
    return rnMock;
  });
} catch (e) {
  // ignore if react-native jest mock not available
}
