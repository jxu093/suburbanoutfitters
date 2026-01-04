import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';

import { Colors, Radii, Spacing } from '../constants/theme';
import { ThemedText } from './themed-text';

export type ThemedChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  disabled?: boolean;
};

export function ThemedChip({
  label,
  selected = false,
  onPress,
  onClose,
  icon,
  color,
  disabled = false,
}: ThemedChipProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const activeColor = color || colors.tint;

  const getBackgroundColor = (pressed: boolean) => {
    if (selected) {
      return pressed ? activeColor + 'CC' : activeColor;
    }
    return pressed ? colors.fill : colors.fillSecondary;
  };

  const getTextColor = () => {
    if (selected) return '#fff';
    return colors.text;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: getBackgroundColor(pressed),
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={getTextColor()}
          style={styles.icon}
        />
      )}
      <ThemedText type="footnote" style={{ color: getTextColor(), fontWeight: '500' }}>
        {label}
      </ThemedText>
      {onClose && (
        <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
          <View style={[styles.closeCircle, { backgroundColor: selected ? 'rgba(255,255,255,0.3)' : colors.fill }]}>
            <Ionicons name="close" size={10} color={getTextColor()} />
          </View>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.chip,
    gap: Spacing.xs,
  },
  icon: {
    marginRight: Spacing.xxs,
  },
  closeBtn: {
    marginLeft: Spacing.xxs,
  },
  closeCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
