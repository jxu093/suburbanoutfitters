import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { getCategoryDisplayName, normalizeCategory, type Category } from '../constants';
import { Colors, Radii, Shadows, Spacing } from '../constants/theme';
import { useItems } from '../hooks/use-items';
import { useOutfits } from '../hooks/use-outfits';
import { pickRandomOutfit, type RandomizeOptions, DEFAULT_OPTIONS, SMART_OPTIONS } from '../services/randomizer';
import { getCurrentWeather, isWeatherApiConfigured, type WeatherData } from '../services/weather';
import type { Item, Outfit } from '../types';
import { isItemHidden } from '../utils/item-helpers';
import { categorizeItems } from '../utils/outfit-categorization';
import RandomizerOptionsModal from './randomizer-options-modal';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useToast } from './toast';

export default function OutfitBuilder() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { items } = useItems();
  const { add } = useOutfits();
  const { showToast } = useToast();
  const [current, setCurrent] = useState<Item[]>([]);
  const [selectingCategory, setSelectingCategory] = useState<Category | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState<RandomizeOptions>(DEFAULT_OPTIONS);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Fetch weather data on mount
  // DISABLED: Weather API key not active yet - uncomment when ready
  // useEffect(() => {
  //   async function fetchWeather() {
  //     if (!isWeatherApiConfigured()) {
  //       return;
  //     }

  //     setWeatherLoading(true);
  //     try {
  //       const { status } = await Location.requestForegroundPermissionsAsync();
  //       if (status !== 'granted') {
  //         console.log('Location permission denied');
  //         return;
  //       }

  //       const location = await Location.getCurrentPositionAsync({});
  //       const weatherData = await getCurrentWeather(location.coords.latitude, location.coords.longitude);
  //       setWeather(weatherData);
  //     } catch (error) {
  //       console.error('Failed to fetch weather:', error);
  //     } finally {
  //       setWeatherLoading(false);
  //     }
  //   }

  //   fetchWeather();
  // }, []);

  // Initialize from params if provided (preselected items from quick generate)
  useEffect(() => {
    if (params.preselected) {
      try {
        const ids = JSON.parse(params.preselected as string) as number[];
        const preselectedItems = items.filter((i) => ids.includes(i.id!));

        // Deduplicate by category - keep only first item per category
        const deduplicated: Item[] = [];
        const seenCategories = new Set<string>();

        for (const item of preselectedItems) {
          const normalized = normalizeCategory(item.category);
          if (normalized) {
            if (!seenCategories.has(normalized)) {
              seenCategories.add(normalized);
              deduplicated.push(item);
            }
          } else {
            // Items without categories are always added
            deduplicated.push(item);
          }
        }

        setCurrent(deduplicated);
      } catch {
        // ignore parse errors
      }
    }
  }, [params.preselected, items]);

  const available = useMemo(() => items.filter((i) => !isItemHidden(i)), [items]);

  const slots = categorizeItems(current);

  function removeItem(item: Item) {
    setCurrent((prev) => prev.filter((i) => i.id !== item.id));
  }

  function selectItemForCategory(category: Category) {
    setSelectingCategory(category);
  }

  function handleItemSelect(item: Item) {
    const itemCategory = normalizeCategory(item.category);
    if (itemCategory) {
      // Remove any existing item from the same category
      const withoutSameCategory = current.filter((i) => {
        const iCategory = normalizeCategory(i.category);
        return iCategory !== itemCategory;
      });
      setCurrent([...withoutSameCategory, item]);
    } else {
      setCurrent([...current, item]);
    }
    setSelectingCategory(null);
  }

  function randomize() {
    const options: RandomizeOptions = {
      ...randomizeOptions,
      weatherCondition: randomizeOptions.useWeatherRules ? (weather?.condition ?? randomizeOptions.weatherCondition) : undefined,
    };
    const outfit = pickRandomOutfit(available, options);
    setCurrent(outfit);
    showToast('Outfit randomized');
  }

  function smartRandomize() {
    const options: RandomizeOptions = {
      ...SMART_OPTIONS,
      weatherCondition: weather?.condition ?? 'mild',
    };
    const outfit = pickRandomOutfit(available, options);
    setCurrent(outfit);
    showToast('Smart outfit generated');
  }

  function handleOptionsApply(options: RandomizeOptions) {
    setRandomizeOptions(options);
    // Immediately generate with new options
    const outfit = pickRandomOutfit(available, {
      ...options,
      weatherCondition: options.useWeatherRules ? (weather?.condition ?? options.weatherCondition) : undefined,
    });
    setCurrent(outfit);
    showToast('Generated with new options');
  }

  function fillRemaining() {
    // Get categories that are currently empty
    const CATEGORIES_LIST: Category[] = ['hat', 'top', 'bottom', 'shoes', 'outerwear', 'accessory'];
    const filledCategories = new Set(
      current.map((item) => normalizeCategory(item.category)).filter((cat): cat is Category => cat !== null)
    );
    const emptyCategories = CATEGORIES_LIST.filter((cat) => !filledCategories.has(cat));

    if (emptyCategories.length === 0) {
      showToast('All categories filled', 'info');
      return;
    }

    // Pick random items for empty categories
    const newItems: Item[] = [];
    for (const category of emptyCategories) {
      const categoryItems = available.filter((item) => normalizeCategory(item.category) === category);
      if (categoryItems.length > 0) {
        const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
        newItems.push(randomItem);
      }
    }

    setCurrent([...current, ...newItems]);
    showToast(`Filled ${newItems.length} categories`);
  }

  function clearOutfit() {
    setCurrent([]);
  }

  async function saveOutfit() {
    if (!current || current.length === 0) {
      showToast('Add items to save', 'error');
      return;
    }
    const o: Outfit = { name: `Outfit ${new Date().toLocaleDateString()}`, itemIds: current.map((i) => i.id!) };
    await add(o);
    showToast('Outfit saved');
    // Stay on builder screen, just clear the current outfit
    setCurrent([]);
  }

  // Filter items for the currently selecting category
  const categoryItems = useMemo(() => {
    if (!selectingCategory) return [];
    return available.filter((item) => {
      const normalized = normalizeCategory(item.category);
      return normalized === selectingCategory;
    });
  }, [selectingCategory, available]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Build Outfit</ThemedText>
          <TouchableOpacity onPress={() => router.push('/outfits')} style={styles.savedBtn}>
            <Ionicons name="albums-outline" size={20} color={colors.tint} />
            <ThemedText style={[styles.savedBtnText, { color: colors.tint }]}>Saved</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Weather Display */}
        {weatherLoading && (
          <View style={[styles.weatherCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.tint} />
            <ThemedText style={styles.weatherLoadingText}>Loading weather...</ThemedText>
          </View>
        )}
        {!weatherLoading && weather && (
          <View style={[styles.weatherCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
            <View style={styles.weatherHeader}>
              <Ionicons
                name={
                  weather.condition === 'hot' || weather.condition === 'warm' ? 'sunny' :
                  weather.condition === 'cold' || weather.condition === 'freezing' ? 'snow' :
                  'partly-sunny'
                }
                size={28}
                color={
                  weather.condition === 'hot' || weather.condition === 'warm' ? '#ff9800' :
                  weather.condition === 'cold' || weather.condition === 'freezing' ? '#03a9f4' :
                  '#ffc107'
                }
              />
              <View style={styles.weatherInfo}>
                <ThemedText style={styles.weatherTemp}>{weather.temperature}°C</ThemedText>
                <ThemedText style={[styles.weatherDesc, { color: colors.textSecondary }]}>
                  {weather.description}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.weatherCity, { color: colors.textSecondary }]}>
              <Ionicons name="location-outline" size={12} /> {weather.city}
            </ThemedText>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={randomize} style={[styles.actionBtn, { borderColor: colors.border }]}>
            <Ionicons name="shuffle-outline" size={16} color={colors.tint} />
            <ThemedText style={[styles.actionBtnText, { color: colors.tint }]}>Randomize</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowOptionsModal(true)} style={[styles.optionsBtn, { borderColor: colors.border }]}>
            <Ionicons name="options-outline" size={16} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={smartRandomize} style={[styles.actionBtn, styles.smartBtn, { borderColor: colors.tint }]}>
            <Ionicons name="sparkles" size={16} color={colors.tint} />
            <ThemedText style={[styles.actionBtnText, { color: colors.tint }]}>Smart</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={fillRemaining} style={[styles.actionBtn, { borderColor: colors.border }]}>
            <Ionicons name="add-outline" size={16} color={colors.tint} />
            <ThemedText style={[styles.actionBtnText, { color: colors.tint }]}>Fill</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => setShowFullScreen(true)} style={[styles.actionBtn, { borderColor: colors.border }]}>
            <Ionicons name="expand-outline" size={16} color={colors.tint} />
            <ThemedText style={[styles.actionBtnText, { color: colors.tint }]}>Preview</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearOutfit} style={[styles.actionBtn, { borderColor: colors.border }]}>
            <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.actionBtnText, { color: colors.textSecondary }]}>Clear</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Full-screen silhouette preview with inline selection */}
        <View style={styles.silhouetteContainer}>
          <View style={styles.mainRow}>
            {/* Left column: Hat, Top, Bottom, Shoes */}
            <View style={styles.leftColumn}>
              <CategorySlot
                category="hat"
                items={slots.hat}
                onSelect={() => selectItemForCategory('hat')}
                onRemove={removeItem}
                colors={colors}
              />
              <CategorySlot
                category="top"
                items={slots.top}
                onSelect={() => selectItemForCategory('top')}
                onRemove={removeItem}
                colors={colors}
              />
              <CategorySlot
                category="bottom"
                items={slots.bottom}
                onSelect={() => selectItemForCategory('bottom')}
                onRemove={removeItem}
                colors={colors}
              />
              <CategorySlot
                category="shoes"
                items={slots.shoes}
                onSelect={() => selectItemForCategory('shoes')}
                onRemove={removeItem}
                colors={colors}
              />
            </View>

            {/* Right column: Outerwear, Accessory */}
            <View style={styles.rightColumn}>
              <CategorySlot
                category="outerwear"
                items={slots.outerwear}
                onSelect={() => selectItemForCategory('outerwear')}
                onRemove={removeItem}
                colors={colors}
              />
              <CategorySlot
                category="accessory"
                items={slots.accessory}
                onSelect={() => selectItemForCategory('accessory')}
                onRemove={removeItem}
                colors={colors}
              />
            </View>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity onPress={saveOutfit} style={[styles.saveBtn, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <ThemedText style={styles.saveBtnText}>Save Outfit</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Item selection modal */}
      <Modal visible={selectingCategory !== null} animationType="slide" onRequestClose={() => setSelectingCategory(null)}>
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectingCategory(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="title">
              Select {selectingCategory ? getCategoryDisplayName(selectingCategory) : ''}
            </ThemedText>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView contentContainerStyle={styles.itemGrid}>
            {categoryItems.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => handleItemSelect(item)} style={styles.gridItem}>
                <Image source={{ uri: item.thumbUri ?? item.imageUri ?? undefined }} style={styles.gridThumb} />
                <ThemedText numberOfLines={1} style={styles.gridItemName}>
                  {item.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
            {categoryItems.length === 0 && (
              <ThemedText style={styles.emptyText}>
                No {selectingCategory} items found. Add some to your closet first!
              </ThemedText>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Full-screen preview modal */}
      <Modal visible={showFullScreen} animationType="fade" transparent onRequestClose={() => setShowFullScreen(false)}>
        <TouchableOpacity
          style={styles.fullScreenContainer}
          activeOpacity={1}
          onPress={() => setShowFullScreen(false)}
        >
          <View style={styles.fullScreenContent}>
            <FullScreenPreview items={current} />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Randomizer options modal */}
      <RandomizerOptionsModal
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onApply={handleOptionsApply}
        initialOptions={randomizeOptions}
        weatherCondition={weather?.condition}
      />
    </ThemedView>
  );
}

function FullScreenPreview({ items }: { items: Item[] }) {
  const slots = categorizeItems(items);
  const CATEGORIES_ORDER: Category[] = ['hat', 'outerwear', 'top', 'bottom', 'shoes', 'accessory'];

  // Filter to only show populated categories
  const populatedSlots = CATEGORIES_ORDER.filter((cat) => slots[cat].length > 0);

  return (
    <View style={styles.previewLayout}>
      {populatedSlots.map((category) => (
        <View key={category} style={styles.previewCategoryRow}>
          {slots[category].map((item) => (
            <Image
              key={item.id}
              source={{ uri: item.thumbUri ?? item.imageUri ?? undefined }}
              style={styles.previewThumb}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function CategorySlot({
  category,
  items,
  onSelect,
  onRemove,
  colors,
}: {
  category: Category;
  items: Item[];
  onSelect: () => void;
  onRemove: (item: Item) => void;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.categorySlot}>
      <ThemedText style={[styles.categoryLabel, { color: colors.textSecondary }]}>{getCategoryDisplayName(category)}</ThemedText>
      <View style={styles.slotContent}>
        {items.length > 0 ? (
          items.map((item) => (
            <View key={item.id} style={styles.slotItemWrap}>
              <TouchableOpacity onPress={onSelect} style={[styles.slotItem, { borderColor: colors.success }]}>
                <Image source={{ uri: item.thumbUri ?? item.imageUri ?? undefined }} style={styles.slotThumb} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onRemove(item)} style={styles.removeBtn}>
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <TouchableOpacity onPress={onSelect} style={[styles.emptySlot, { borderColor: colors.border, backgroundColor: colors.secondaryBackground }]}>
            <Ionicons name="add-circle-outline" size={36} color={colors.border} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savedBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, padding: Spacing.sm },
  savedBtnText: { fontSize: 13, fontWeight: '600' },
  weatherCard: {
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  weatherLoadingText: { fontSize: 12, textAlign: 'center' },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  weatherDesc: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  weatherCity: {
    fontSize: 11,
    textAlign: 'right',
  },
  buttonRow: { flexDirection: 'row', gap: Spacing.xs },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  optionsBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartBtn: {
    borderWidth: 2,
  },
  actionBtnText: { fontSize: 11, fontWeight: '600' },
  silhouetteContainer: { gap: Spacing.lg, paddingVertical: Spacing.md },
  mainRow: { flexDirection: 'row', gap: Spacing.xl, justifyContent: 'center' },
  leftColumn: { gap: Spacing.lg, alignItems: 'center' },
  rightColumn: { gap: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  middleRow: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' },
  categorySlot: { alignItems: 'center', gap: Spacing.sm },
  categoryLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  slotContent: { flexDirection: 'row', gap: Spacing.sm },
  slotItemWrap: { position: 'relative' },
  slotItem: { borderRadius: Radii.md, overflow: 'hidden', borderWidth: 2 },
  slotThumb: { width: 90, height: 90, borderRadius: Radii.sm },
  removeBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: Radii.md },
  emptySlot: {
    width: 90,
    height: 90,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radii.button,
    marginTop: Spacing.sm,
    ...Shadows.button,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalContainer: { flex: 1, padding: Spacing.lg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  closeBtn: { padding: Spacing.xs },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, paddingBottom: Spacing.xxxl },
  gridItem: { width: '30%', alignItems: 'center', gap: Spacing.xs },
  gridThumb: { width: '100%', aspectRatio: 1, borderRadius: Radii.sm },
  gridItemName: { fontSize: 11, textAlign: 'center' },
  emptyText: { textAlign: 'center', padding: Spacing.xxxl },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContent: {
    width: '90%',
    maxWidth: 400,
  },
  previewLayout: {
    gap: Spacing.xl,
    alignItems: 'center',
  },
  previewCategoryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  previewThumb: {
    width: 150,
    height: 150,
    borderRadius: Radii.md,
  },
});
