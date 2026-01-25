import { useColorScheme as _useColorScheme } from 'react-native';

export type ColorSchemeName = 'light' | 'dark' | null;

export function useColorScheme(): ColorSchemeName {
  // React Native's hook returns 'light' | 'dark' | null
  return _useColorScheme() as ColorSchemeName;
}
