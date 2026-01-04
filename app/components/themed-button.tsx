import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useColorScheme,
  type PressableProps,
} from 'react-native';

import { Colors, Radii, Shadows, Spacing } from '../constants/theme';
import { ThemedText } from './themed-text';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type ButtonSize = 'small' | 'medium' | 'large';

export type ThemedButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
};

export function ThemedButton({
  title,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  style,
  ...rest
}: ThemedButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isDisabled = disabled || loading;

  const getBackgroundColor = (pressed: boolean) => {
    if (variant === 'primary') {
      return pressed ? colors.tint + 'DD' : colors.tint;
    }
    if (variant === 'destructive') {
      return pressed ? colors.destructive + 'DD' : colors.destructive;
    }
    if (variant === 'secondary') {
      return pressed ? colors.fill : 'transparent';
    }
    // tertiary
    return pressed ? colors.fill : 'transparent';
  };

  const getBorderColor = () => {
    if (variant === 'secondary') return colors.separator;
    return 'transparent';
  };

  const getTextColor = () => {
    if (variant === 'primary') return '#fff';
    if (variant === 'destructive') return '#fff';
    if (variant === 'secondary') return colors.tint;
    return colors.tint;
  };

  const sizeStyles = {
    small: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      minHeight: 32,
    },
    medium: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      minHeight: 44,
    },
    large: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      minHeight: 50,
    },
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 22 : 18;
  const textType = size === 'small' ? 'footnote' : size === 'large' ? 'headline' : 'callout';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        variant === 'primary' && Shadows.button,
        style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={getTextColor()}
              style={styles.iconLeft}
            />
          )}
          <ThemedText
            type={textType as 'footnote' | 'headline' | 'callout'}
            style={[styles.text, { color: getTextColor() }]}
          >
            {title}
          </ThemedText>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={getTextColor()}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.button,
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: Spacing.xs,
  },
  iconRight: {
    marginLeft: Spacing.xs,
  },
});
