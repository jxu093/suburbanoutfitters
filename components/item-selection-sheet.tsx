import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { getCategoryDisplayName, type Category } from '@/constants';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export type SelectionOption = 'browse' | 'suggest-closet' | 'suggest-new';

type ItemSelectionSheetProps = {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
  onSelect: (option: SelectionOption) => void;
  isAIConfigured: boolean;
};

/**
 * Bottom sheet with three options for selecting an item:
 * 1. Browse Closet - Opens existing item picker
 * 2. Suggest from Closet - AI suggests items from wardrobe
 * 3. Find Something New - AI suggests items to purchase
 */
export function ItemSelectionSheet({
  visible,
  category,
  onClose,
  onSelect,
  isAIConfigured,
}: ItemSelectionSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSelect = (option: SelectionOption) => {
    onSelect(option);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheetContainer}>
          <TouchableOpacity activeOpacity={1}>
            <ThemedView style={[styles.sheet, { borderColor: colors.border }]} useSafeArea={false}>
              <View style={styles.handle} />

              <ThemedText type="subtitle" style={styles.title}>
                Add {category ? getCategoryDisplayName(category) : 'Item'}
              </ThemedText>

              <View style={styles.options}>
                {/* Browse Closet */}
                <TouchableOpacity
                  style={[styles.optionBtn, { borderColor: colors.border }]}
                  onPress={() => handleSelect('browse')}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.tint + '20' }]}>
                    <Ionicons name="shirt-outline" size={28} color={colors.tint} />
                  </View>
                  <View style={styles.optionText}>
                    <ThemedText style={styles.optionTitle}>Browse Closet</ThemedText>
                    <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                      Pick from your wardrobe
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Suggest from Closet */}
                <TouchableOpacity
                  style={[
                    styles.optionBtn,
                    { borderColor: colors.border },
                    !isAIConfigured && styles.optionDisabled,
                  ]}
                  onPress={() => isAIConfigured && handleSelect('suggest-closet')}
                  disabled={!isAIConfigured}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#9c27b020' }]}>
                    <Ionicons name="sparkles" size={28} color="#9c27b0" />
                  </View>
                  <View style={styles.optionText}>
                    <ThemedText style={styles.optionTitle}>Suggest from Closet</ThemedText>
                    <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                      {isAIConfigured
                        ? 'AI picks items that pair well'
                        : 'Configure AI in Settings first'}
                    </ThemedText>
                  </View>
                  {isAIConfigured && (
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>

                {/* Find Something New */}
                <TouchableOpacity
                  style={[
                    styles.optionBtn,
                    { borderColor: colors.border },
                    !isAIConfigured && styles.optionDisabled,
                  ]}
                  onPress={() => isAIConfigured && handleSelect('suggest-new')}
                  disabled={!isAIConfigured}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#4285F420' }]}>
                    <Ionicons name="globe-outline" size={28} color="#4285F4" />
                  </View>
                  <View style={styles.optionText}>
                    <ThemedText style={styles.optionTitle}>Find Something New</ThemedText>
                    <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                      {isAIConfigured
                        ? 'Get shopping suggestions'
                        : 'Configure AI in Settings first'}
                    </ThemedText>
                  </View>
                  {isAIConfigured && (
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.fillSecondary }]}
                onPress={onClose}
              >
                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '80%',
  },
  sheet: {
    flex: 0, // Override ThemedView's flex: 1
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: Spacing.xxxl,
    ...Shadows.card,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  options: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: Spacing.xxs,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 13,
  },
  cancelBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radii.button,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
