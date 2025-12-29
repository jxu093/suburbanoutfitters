import { View, SafeAreaView, Platform, StatusBar, type ViewProps } from 'react-native';

import { useThemeColor } from '../hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  useSafeArea?: boolean;
};

export function ThemedView({ style, lightColor, darkColor, useSafeArea = true, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const Component = useSafeArea ? SafeAreaView : View;

  // Calculate padding for Android status bar
  const paddingTop = Platform.OS === 'android' && useSafeArea ? StatusBar.currentHeight : 0;

  return <Component style={[{ backgroundColor, flex: 1, paddingTop }, style]} {...otherProps} />;
}
