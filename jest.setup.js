// Test setup - intentionally minimal to avoid transforming React Native ESM modules
// Define commonly expected globals for React Native environment
global.__DEV__ = true;
global.IS_REACT_ACT_ENVIRONMENT = true; // Configure act environment for React 19

// Mock the entire 'react-native' module
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  const View = ReactNative.View;
  const Text = ReactNative.Text;

  return Object.setPrototypeOf(
    {
      ...ReactNative,
      // Mock StyleSheet directly
      StyleSheet: {
        create: (styles) => styles,
      },
      // Ensure Platform is correctly mocked
      Platform: {
        OS: 'ios',
        select: (obj) => obj?.default ?? obj?.ios ?? obj?.android ?? obj,
      },
      // Mock common native modules that might be accessed by internal React Native code
      // This helps prevent "__fbBatchedBridgeConfig is not set" errors
      NativeModules: {
        // Provide empty mocks for commonly accessed native modules if not needed
        // For example:
        // RNCAsyncStorage: {},
        // RNCNetInfo: {},
        // RNCSafeAreaContext: {},
      },
      // Mock react-native-gesture-handler to avoid breaking tests
      GestureHandlerRootView: View,
      PanGestureHandler: View,
      TapGestureHandler: View,
      FlingGestureHandler: View,
      PinchGestureHandler: View,
      RotationGestureHandler: View,
      ForceTouchGestureHandler: View,
      LongPressGestureHandler: View,
      ScrollView: View, // Basic mock for scroll views
      FlatList: View, // Basic mock for lists
      SectionList: View, // Basic mock for lists
      // Add other React Native components or APIs as needed
      View,
      Text,
      // Re-export original exports from 'react-native' that aren't explicitly mocked
    },
    ReactNative,
  );
});

// Mock any other modules that might cause issues, e.g., react-native-gesture-handler
// NOTE: This part is now mostly handled by the above react-native mock, but keeping it
// as a separate mock for specific modules might be necessary for some cases.
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    GestureHandlerRootView: View,
    PanGestureHandler: View,
    // Add other components as needed, e.g., TapGestureHandler, etc.
  };
});
