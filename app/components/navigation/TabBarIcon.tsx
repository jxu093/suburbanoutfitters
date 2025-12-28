import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps } from 'react';

import { Colors } from '../../constants/theme'; // Corrected import path
import { useColorScheme } from '../../hooks/use-color-scheme';

export function TabBarIcon({ style, ...rest }: ComponentProps<typeof Ionicons>) {
  const colorScheme = useColorScheme();
  return <Ionicons size={28} style={[{ marginBottom: -3 }, style]} {...rest} color={Colors[colorScheme ?? 'light'].tint} />;
}
