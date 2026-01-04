import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '../hooks/use-theme-color';
import { Typography } from '../constants/theme';

export type ThemedTextType =
  | 'default'
  | 'title'
  | 'defaultSemiBold'
  | 'subtitle'
  | 'link'
  // iOS Dynamic Type variants
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subhead'
  | 'footnote'
  | 'caption1'
  | 'caption2'
  | 'secondary';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemedTextType;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const secondaryColor = useThemeColor({}, 'textSecondary');
  const linkColor = useThemeColor({}, 'link');

  const getTextColor = () => {
    if (type === 'secondary') return secondaryColor;
    if (type === 'link') return linkColor;
    return color;
  };

  return (
    <Text
      style={[
        { color: getTextColor() },
        styles[type] || styles.default,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Legacy types (for backwards compatibility)
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
  // iOS Dynamic Type variants
  largeTitle: Typography.largeTitle,
  title1: Typography.title1,
  title2: Typography.title2,
  title3: Typography.title3,
  headline: Typography.headline,
  body: Typography.body,
  callout: Typography.callout,
  subhead: Typography.subhead,
  footnote: Typography.footnote,
  caption1: Typography.caption1,
  caption2: Typography.caption2,
  secondary: {
    fontSize: 15,
    lineHeight: 20,
  },
});
