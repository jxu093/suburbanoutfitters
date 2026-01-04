import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, TouchableOpacity, View, useColorScheme } from 'react-native';
import { CATEGORIES, getCategoryDisplayName, WEATHER_CONDITIONS, type Category, type WeatherCondition } from '../constants';
import { Colors } from '../constants/theme';
import type { RandomizeOptions } from '../services/randomizer';
import { ThemedText } from './themed-text';

export type RandomizerOptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (options: RandomizeOptions) => void;
  initialOptions?: RandomizeOptions;
  weatherCondition?: WeatherCondition | null;
};

const WEATHER_LABELS: Record<WeatherCondition, string> = {
  hot: 'Hot (30°C+)',
  warm: 'Warm (20-30°C)',
  mild: 'Mild (10-20°C)',
  cool: 'Cool (0-10°C)',
  cold: 'Cold (-10 to 0°C)',
  freezing: 'Freezing (<-10°C)',
};

export default function RandomizerOptionsModal({
  visible,
  onClose,
  onApply,
  initialOptions = {},
  weatherCondition,
}: RandomizerOptionsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Options state
  const [useColorMatching, setUseColorMatching] = useState(initialOptions.useColorMatching ?? false);
  const [useWeatherRules, setUseWeatherRules] = useState(initialOptions.useWeatherRules ?? false);
  const [preferFavorites, setPreferFavorites] = useState(initialOptions.preferFavorites ?? false);
  const [ensureCompleteOutfit, setEnsureCompleteOutfit] = useState(initialOptions.ensureCompleteOutfit ?? true);
  const [selectedWeather, setSelectedWeather] = useState<WeatherCondition | undefined>(
    initialOptions.weatherCondition ?? weatherCondition ?? undefined
  );
  const [excludedCategories, setExcludedCategories] = useState<Category[]>(
    (initialOptions.excludedCategories as Category[]) ?? []
  );
  const [minItems, setMinItems] = useState(initialOptions.minItems ?? 2);
  const [maxItems, setMaxItems] = useState(initialOptions.maxItems ?? 5);

  function handleApply() {
    const options: RandomizeOptions = {
      useColorMatching,
      useWeatherRules,
      preferFavorites,
      ensureCompleteOutfit,
      weatherCondition: useWeatherRules ? selectedWeather : undefined,
      excludedCategories: excludedCategories.length > 0 ? excludedCategories : undefined,
      minItems,
      maxItems,
      avoidSameCategory: true,
    };
    onApply(options);
    onClose();
  }

  function toggleCategory(category: Category) {
    setExcludedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }

  function resetToDefaults() {
    setUseColorMatching(false);
    setUseWeatherRules(false);
    setPreferFavorites(false);
    setEnsureCompleteOutfit(true);
    setSelectedWeather(weatherCondition ?? undefined);
    setExcludedCategories([]);
    setMinItems(2);
    setMaxItems(5);
  }

  function applySmartDefaults() {
    setUseColorMatching(true);
    setUseWeatherRules(true);
    setPreferFavorites(true);
    setEnsureCompleteOutfit(true);
    setSelectedWeather(weatherCondition ?? 'mild');
    setMinItems(3);
    setMaxItems(5);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle">Randomizer Options</ThemedText>
          <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
            <ThemedText style={[styles.applyText, { color: colors.tint }]}>Apply</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Quick Presets */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Quick Presets</ThemedText>
            <View style={styles.presetRow}>
              <TouchableOpacity
                onPress={resetToDefaults}
                style={[styles.presetBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="refresh-outline" size={18} color={colors.text} />
                <ThemedText style={styles.presetText}>Basic</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applySmartDefaults}
                style={[styles.presetBtn, styles.smartPreset, { borderColor: colors.tint }]}
              >
                <Ionicons name="sparkles" size={18} color={colors.tint} />
                <ThemedText style={[styles.presetText, { color: colors.tint }]}>Smart</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rules Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Generation Rules</ThemedText>

            <View style={[styles.optionRow, { borderBottomColor: colors.border }]}>
              <View style={styles.optionInfo}>
                <View style={styles.optionHeader}>
                  <Ionicons name="color-palette-outline" size={20} color={colors.text} />
                  <ThemedText style={styles.optionLabel}>Color Matching</ThemedText>
                </View>
                <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Pick items with harmonious colors
                </ThemedText>
              </View>
              <Switch
                value={useColorMatching}
                onValueChange={setUseColorMatching}
                trackColor={{ false: colors.border, true: colors.tint }}
              />
            </View>

            <View style={[styles.optionRow, { borderBottomColor: colors.border }]}>
              <View style={styles.optionInfo}>
                <View style={styles.optionHeader}>
                  <Ionicons name="partly-sunny-outline" size={20} color={colors.text} />
                  <ThemedText style={styles.optionLabel}>Weather Rules</ThemedText>
                </View>
                <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Filter items by weather suitability
                </ThemedText>
              </View>
              <Switch
                value={useWeatherRules}
                onValueChange={setUseWeatherRules}
                trackColor={{ false: colors.border, true: colors.tint }}
              />
            </View>

            <View style={[styles.optionRow, { borderBottomColor: colors.border }]}>
              <View style={styles.optionInfo}>
                <View style={styles.optionHeader}>
                  <Ionicons name="star-outline" size={20} color={colors.text} />
                  <ThemedText style={styles.optionLabel}>Prefer Favorites</ThemedText>
                </View>
                <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Prioritize favorited items
                </ThemedText>
              </View>
              <Switch
                value={preferFavorites}
                onValueChange={setPreferFavorites}
                trackColor={{ false: colors.border, true: colors.tint }}
              />
            </View>

            <View style={[styles.optionRow, { borderBottomColor: colors.border }]}>
              <View style={styles.optionInfo}>
                <View style={styles.optionHeader}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.text} />
                  <ThemedText style={styles.optionLabel}>Complete Outfit</ThemedText>
                </View>
                <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Always include top + bottom
                </ThemedText>
              </View>
              <Switch
                value={ensureCompleteOutfit}
                onValueChange={setEnsureCompleteOutfit}
                trackColor={{ false: colors.border, true: colors.tint }}
              />
            </View>
          </View>

          {/* Weather Selection */}
          {useWeatherRules && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Weather Condition</ThemedText>
              <View style={styles.weatherGrid}>
                {WEATHER_CONDITIONS.map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    onPress={() => setSelectedWeather(condition)}
                    style={[
                      styles.weatherChip,
                      { borderColor: colors.border },
                      selectedWeather === condition && { borderColor: colors.tint, backgroundColor: colors.tint + '20' },
                    ]}
                  >
                    <Ionicons
                      name={
                        condition === 'hot' ? 'sunny' :
                        condition === 'warm' ? 'sunny-outline' :
                        condition === 'mild' ? 'partly-sunny-outline' :
                        condition === 'cool' ? 'cloud-outline' :
                        condition === 'cold' ? 'snow-outline' :
                        'snow'
                      }
                      size={16}
                      color={selectedWeather === condition ? colors.tint : colors.text}
                    />
                    <ThemedText
                      style={[
                        styles.weatherChipText,
                        selectedWeather === condition && { color: colors.tint },
                      ]}
                    >
                      {WEATHER_LABELS[condition]}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Category Exclusions */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Exclude Categories</ThemedText>
            <ThemedText style={[styles.sectionDesc, { color: colors.textSecondary }]}>
              Tap to exclude from generation
            </ThemedText>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => toggleCategory(category)}
                  style={[
                    styles.categoryChip,
                    { borderColor: colors.border },
                    excludedCategories.includes(category) && {
                      borderColor: '#ef4444',
                      backgroundColor: '#ef444420',
                    },
                  ]}
                >
                  {excludedCategories.includes(category) && (
                    <Ionicons name="close-circle" size={14} color="#ef4444" />
                  )}
                  <ThemedText
                    style={[
                      styles.categoryChipText,
                      excludedCategories.includes(category) && { color: '#ef4444' },
                    ]}
                  >
                    {getCategoryDisplayName(category)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Item Count */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Item Count</ThemedText>
            <View style={styles.countRow}>
              <View style={styles.countControl}>
                <ThemedText style={[styles.countLabel, { color: colors.textSecondary }]}>Min</ThemedText>
                <View style={styles.countButtons}>
                  <TouchableOpacity
                    onPress={() => setMinItems(Math.max(1, minItems - 1))}
                    style={[styles.countBtn, { borderColor: colors.border }]}
                  >
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <ThemedText style={styles.countValue}>{minItems}</ThemedText>
                  <TouchableOpacity
                    onPress={() => setMinItems(Math.min(maxItems, minItems + 1))}
                    style={[styles.countBtn, { borderColor: colors.border }]}
                  >
                    <Ionicons name="add" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.countControl}>
                <ThemedText style={[styles.countLabel, { color: colors.textSecondary }]}>Max</ThemedText>
                <View style={styles.countButtons}>
                  <TouchableOpacity
                    onPress={() => setMaxItems(Math.max(minItems, maxItems - 1))}
                    style={[styles.countBtn, { borderColor: colors.border }]}
                  >
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <ThemedText style={styles.countValue}>{maxItems}</ThemedText>
                  <TouchableOpacity
                    onPress={() => setMaxItems(Math.min(6, maxItems + 1))}
                    style={[styles.countBtn, { borderColor: colors.border }]}
                  >
                    <Ionicons name="add" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  applyBtn: {
    padding: 4,
  },
  applyText: {
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionDesc: {
    fontSize: 12,
    marginTop: -8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  presetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  smartPreset: {
    borderWidth: 2,
  },
  presetText: {
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
    marginLeft: 28,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  weatherChipText: {
    fontSize: 13,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
  },
  countRow: {
    flexDirection: 'row',
    gap: 24,
  },
  countControl: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  countLabel: {
    fontSize: 12,
  },
  countButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countValue: {
    fontSize: 20,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
});
