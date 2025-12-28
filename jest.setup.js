// Test setup - intentionally minimal to avoid transforming React Native ESM modules
// Define commonly expected globals for React Native environment
global.__DEV__ = true;
global.IS_REACT_ACT_ENVIRONMENT = true; // Configure act environment for React 19

// Mock react-native with simple component stubs (avoid requireActual to prevent native bridge errors)
jest.mock('react-native', () => {
  const React = require('react');

  // Create simple mock components
  const createMockComponent = (name) => {
    const Component = React.forwardRef((props, ref) => {
      return React.createElement(name, { ...props, ref }, props.children);
    });
    Component.displayName = name;
    return Component;
  };

  // Button component that renders title as text content for getByText queries
  const MockButton = React.forwardRef((props, ref) => {
    return React.createElement('Button', { ...props, ref }, props.title);
  });
  MockButton.displayName = 'Button';

  return {
    View: createMockComponent('View'),
    Text: createMockComponent('Text'),
    ScrollView: createMockComponent('ScrollView'),
    FlatList: createMockComponent('FlatList'),
    SectionList: createMockComponent('SectionList'),
    TextInput: createMockComponent('TextInput'),
    TouchableOpacity: createMockComponent('TouchableOpacity'),
    TouchableHighlight: createMockComponent('TouchableHighlight'),
    TouchableWithoutFeedback: createMockComponent('TouchableWithoutFeedback'),
    Pressable: createMockComponent('Pressable'),
    Image: createMockComponent('Image'),
    Button: MockButton,
    ActivityIndicator: createMockComponent('ActivityIndicator'),
    Modal: createMockComponent('Modal'),
    Alert: {
      alert: jest.fn(),
    },
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style) : style),
    },
    Platform: {
      OS: 'ios',
      select: (obj) => obj?.default ?? obj?.ios ?? obj?.android ?? obj,
    },
    Dimensions: {
      get: () => ({ width: 375, height: 812 }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    NativeModules: {},
    useColorScheme: () => 'light',
    useWindowDimensions: () => ({ width: 375, height: 812 }),
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const createMockComponent = (name) => {
    const Component = React.forwardRef((props, ref) => {
      return React.createElement(name, { ...props, ref }, props.children);
    });
    Component.displayName = name;
    return Component;
  };

  return {
    GestureHandlerRootView: createMockComponent('GestureHandlerRootView'),
    PanGestureHandler: createMockComponent('PanGestureHandler'),
    TapGestureHandler: createMockComponent('TapGestureHandler'),
    FlingGestureHandler: createMockComponent('FlingGestureHandler'),
    PinchGestureHandler: createMockComponent('PinchGestureHandler'),
    RotationGestureHandler: createMockComponent('RotationGestureHandler'),
    ForceTouchGestureHandler: createMockComponent('ForceTouchGestureHandler'),
    LongPressGestureHandler: createMockComponent('LongPressGestureHandler'),
    Swipeable: createMockComponent('Swipeable'),
    DrawerLayout: createMockComponent('DrawerLayout'),
    ScrollView: createMockComponent('ScrollView'),
    FlatList: createMockComponent('FlatList'),
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  Link: ({ children }) => children,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock expo-file-system with new SDK 54 API
class MockFile {
  constructor(...uris) {
    this.uri = uris.map((u) => (typeof u === 'string' ? u : u?.uri || '')).join('/');
    this.exists = false;
  }
  copy() {}
  delete() {}
  create() {}
}

class MockDirectory {
  constructor(...uris) {
    this.uri = uris.map((u) => (typeof u === 'string' ? u : u?.uri || '')).join('/');
    this.exists = false;
  }
  create() {
    this.exists = true;
  }
  list() {
    return [];
  }
}

jest.mock('expo-file-system', () => ({
  File: MockFile,
  Directory: MockDirectory,
  Paths: {
    document: new MockDirectory('/mock/documents'),
    cache: new MockDirectory('/mock/cache'),
    bundle: new MockDirectory('/mock/bundle'),
  },
}));

// Mock expo-image-manipulator with new fluent API
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: {
    manipulate: jest.fn().mockReturnValue({
      resize: jest.fn().mockReturnValue({
        renderAsync: jest.fn().mockResolvedValue({
          saveAsync: jest.fn().mockResolvedValue({ uri: '/mock/image.jpg', width: 100, height: 100 }),
        }),
      }),
    }),
  },
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

// Mock expo-sqlite with new SDK 54 sync API
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    execAsync: jest.fn().mockResolvedValue(undefined),
  })),
}));
