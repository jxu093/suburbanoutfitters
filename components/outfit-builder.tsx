import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { getCategoryDisplayName, normalizeCategory, type Category } from '@/constants';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useItems } from '@/hooks/use-items';
import { useOutfits } from '@/hooks/use-outfits';
import { aiService } from '@/services/ai';
import { pickRandomOutfit, type RandomizeOptions, DEFAULT_OPTIONS } from '@/services/randomizer';
import { getCurrentWeather, isWeatherApiConfigured, type WeatherData } from '@/services/weather';
import type { AIShoppingRecommendations, AIPurchaseSuggestions, AISlotSuggestions, Item, Outfit } from '@/types';
import { getItemImageUri, isItemHidden } from '@/utils/item-helpers';
import { categorizeItems } from '@/utils/outfit-categorization';
import { ShoppingRecommendationsList } from '@/components/affiliate-product-card';
import { ItemSelectionSheet, type SelectionOption } from '@/components/item-selection-sheet';
import RandomizerOptionsModal from '@/components/randomizer-options-modal';
import { ClosetSuggestionCard, PurchaseSuggestionCard, type ClosetSuggestion, type PurchaseSuggestion } from '@/components/suggestion-card';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useToast } from './toast';

type AIMode = 'closet' | 'shop';
type SlotSelectionMode = 'browse' | 'suggest-closet' | 'suggest-new' | null;

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
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiMode, setAIMode] = useState<AIMode>('closet');
  const [shoppingRecommendations, setShoppingRecommendations] = useState<AIShoppingRecommendations | null>(null);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  // Three-way item selection state
  const [showSelectionSheet, setShowSelectionSheet] = useState(false);
  const [slotSelectionMode, setSlotSelectionMode] = useState<SlotSelectionMode>(null);
  const [isAIConfigured, setIsAIConfigured] = useState(false);
  const [slotSuggestions, setSlotSuggestions] = useState<AISlotSuggestions | null>(null);
  const [purchaseSuggestions, setPurchaseSuggestions] = useState<AIPurchaseSuggestions | null>(null);
  const [isLoadingSlotSuggestions, setIsLoadingSlotSuggestions] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Check if AI is configured on mount
  useEffect(() => {
    aiService.isConfigured().then(setIsAIConfigured);
  }, []);

  // Fetch weather data on mount
  useEffect(() => {
    async function fetchWeather() {
      if (!isWeatherApiConfigured()) {
        return;
      }

      setWeatherLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const weatherData = await getCurrentWeather(location.coords.latitude, location.coords.longitude);
        setWeather(weatherData);
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setWeatherLoading(false);
      }
    }

    fetchWeather();
  }, []);

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
    setShowSelectionSheet(true);
    // Reset previous suggestions
    setSlotSuggestions(null);
    setPurchaseSuggestions(null);
  }

  function handleSelectionOption(option: SelectionOption) {
    setShowSelectionSheet(false);
    setSlotSelectionMode(option);

    if (option === 'suggest-closet') {
      loadClosetSuggestions();
    } else if (option === 'suggest-new') {
      loadPurchaseSuggestions();
    }
    // 'browse' option just shows the regular item picker
  }

  async function loadClosetSuggestions() {
    if (!selectingCategory) return;

    setIsLoadingSlotSuggestions(true);
    try {
      const categoryItems = available.filter(
        (item) => normalizeCategory(item.category) === selectingCategory
      );

      if (categoryItems.length === 0) {
        showToast(`No ${selectingCategory} items in closet`, 'error');
        setSlotSelectionMode('browse');
        return;
      }

      const suggestions = await aiService.suggestItemsForSlot(
        selectingCategory,
        current,
        categoryItems,
        undefined, // occasion
        weather?.condition
      );

      setSlotSuggestions(suggestions);
    } catch (error: any) {
      console.error('AI slot suggestion error:', error);
      showToast('AI suggestions failed', 'error');
      setSlotSelectionMode('browse');
    } finally {
      setIsLoadingSlotSuggestions(false);
    }
  }

  async function loadPurchaseSuggestions() {
    if (!selectingCategory) return;

    setIsLoadingSlotSuggestions(true);
    try {
      const suggestions = await aiService.suggestPurchasesForSlot(
        selectingCategory,
        current,
        undefined, // occasion
        weather?.condition
      );

      setPurchaseSuggestions(suggestions);
    } catch (error: any) {
      console.error('AI purchase suggestion error:', error);
      showToast('AI suggestions failed', 'error');
      setSlotSelectionMode(null);
    } finally {
      setIsLoadingSlotSuggestions(false);
    }
  }

  function closeSlotSelection() {
    setSelectingCategory(null);
    setSlotSelectionMode(null);
    setSlotSuggestions(null);
    setPurchaseSuggestions(null);
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
    closeSlotSelection();
  }

  function randomize() {
    // Fill all categories with random items
    const CATEGORIES_LIST: Category[] = ['hat', 'top', 'bottom', 'shoes', 'outerwear', 'accessory'];
    const newItems: Item[] = [];

    for (const category of CATEGORIES_LIST) {
      const categoryItems = available.filter((item) => normalizeCategory(item.category) === category);
      if (categoryItems.length > 0) {
        const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
        newItems.push(randomItem);
      }
    }

    setCurrent(newItems);
    showToast('Outfit randomized');
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
    setShoppingRecommendations(null);
  }

  async function handleAIButton() {
    if (aiMode === 'closet') {
      await aiSuggestFromCloset();
    } else {
      await aiSuggestShopping();
    }
  }

  async function aiSuggestFromCloset() {
    // Need at least one item to suggest pairings for
    if (current.length === 0) {
      showToast('Add at least one item first', 'error');
      return;
    }

    const isConfigured = await aiService.isConfigured();
    if (!isConfigured) {
      showToast('Configure AI in Settings first', 'error');
      return;
    }

    setIsAISuggesting(true);
    try {
      // Use the first item as the base for pairing
      const baseItem = current[0];
      // Include all available items, not just analyzed ones - AI can work with basic info
      const candidates = available.filter(
        (item) => !current.some((c) => c.id === item.id)
      );

      if (candidates.length === 0) {
        showToast('No other items in closet to suggest', 'error');
        return;
      }

      const suggestedIds = await aiService.suggestPairings(baseItem, candidates);

      // Get the suggested items and add them (respecting category limits)
      const suggestedItems = suggestedIds
        .map((id) => candidates.find((item) => item.id === id))
        .filter((item): item is Item => item !== undefined);

      // Add items that don't conflict with existing categories
      const currentCategories = new Set(
        current.map((item) => normalizeCategory(item.category)).filter(Boolean)
      );

      const newItems: Item[] = [];
      for (const item of suggestedItems) {
        const category = normalizeCategory(item.category);
        if (category && !currentCategories.has(category)) {
          currentCategories.add(category);
          newItems.push(item);
        }
        if (newItems.length >= 3) break; // Limit to 3 suggestions at a time
      }

      if (newItems.length > 0) {
        setCurrent([...current, ...newItems]);
        showToast(`AI suggested ${newItems.length} items`, 'success');
      } else {
        showToast('No new suggestions - try removing some items', 'info');
      }
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      showToast('AI suggestion failed', 'error');
    } finally {
      setIsAISuggesting(false);
    }
  }

  async function aiSuggestShopping() {
    const isConfigured = await aiService.isConfigured();
    if (!isConfigured) {
      showToast('Configure AI in Settings first', 'error');
      return;
    }

    setIsAISuggesting(true);
    try {
      const weatherCondition = weather?.condition;
      const recommendations = await aiService.generateShoppingRecommendations(
        current,
        undefined, // occasion - could add UI for this
        weatherCondition,
        'moderate' // budget - could add UI for this
      );

      setShoppingRecommendations(recommendations);
      setShowShoppingModal(true);
      showToast(`Found ${recommendations.recommendations.length} items to shop`, 'success');
    } catch (error: any) {
      console.error('AI shopping error:', error);
      showToast('AI shopping suggestions failed', 'error');
    } finally {
      setIsAISuggesting(false);
    }
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
        {/* Header with inline weather */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ThemedText type="title">Build Outfit</ThemedText>
            {/* Compact weather display */}
            {weatherLoading && (
              <View style={styles.weatherInline}>
                <ActivityIndicator size="small" color={colors.textSecondary} />
              </View>
            )}
            {!weatherLoading && weather && (
              <View style={styles.weatherInline}>
                <Ionicons
                  name={
                    weather.condition === 'hot' || weather.condition === 'warm' ? 'sunny' :
                    weather.condition === 'cold' || weather.condition === 'freezing' ? 'snow' :
                    'partly-sunny'
                  }
                  size={16}
                  color={
                    weather.condition === 'hot' || weather.condition === 'warm' ? '#ff9800' :
                    weather.condition === 'cold' || weather.condition === 'freezing' ? '#03a9f4' :
                    '#ffc107'
                  }
                />
                <ThemedText style={styles.weatherTemp}>{weather.temperature}°</ThemedText>
                <ThemedText style={[styles.weatherCity, { color: colors.textSecondary }]}>{weather.city}</ThemedText>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/outfits/ai-chat')} style={styles.chatBtn}>
              <Ionicons name="chatbubbles-outline" size={20} color="#9c27b0" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/outfits')} style={styles.savedBtn}>
              <Ionicons name="albums-outline" size={20} color={colors.tint} />
              <ThemedText style={[styles.savedBtnText, { color: colors.tint }]}>Saved</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Mode Toggle */}
        <View style={styles.aiModeToggle}>
          <TouchableOpacity
            onPress={() => setAIMode('closet')}
            style={[
              styles.aiModeBtn,
              aiMode === 'closet' && styles.aiModeBtnActive,
              { borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="shirt-outline"
              size={16}
              color={aiMode === 'closet' ? '#fff' : colors.tint}
            />
            <ThemedText style={[
              styles.aiModeBtnText,
              aiMode === 'closet' ? styles.aiModeBtnTextActive : { color: colors.tint },
            ]}>
              My Closet
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAIMode('shop')}
            style={[
              styles.aiModeBtn,
              aiMode === 'shop' && styles.aiModeBtnActive,
              { borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="bag-outline"
              size={16}
              color={aiMode === 'shop' ? '#fff' : colors.tint}
            />
            <ThemedText style={[
              styles.aiModeBtnText,
              aiMode === 'shop' ? styles.aiModeBtnTextActive : { color: colors.tint },
            ]}>
              Shop New
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Action buttons - all in one row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleAIButton}
            disabled={isAISuggesting}
            style={[styles.actionBtn, styles.aiBtn]}
          >
            {isAISuggesting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name={aiMode === 'closet' ? 'sparkles' : 'bag'} size={16} color="#fff" />
            )}
            <ThemedText style={styles.aiBtnText}>{aiMode === 'closet' ? 'AI' : 'Shop'}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={randomize} style={[styles.actionBtn, { borderColor: colors.border }]}>
            <Ionicons name="shuffle-outline" size={16} color={colors.tint} />
            <ThemedText style={[styles.actionBtnText, { color: colors.tint }]}>Random</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowOptionsModal(true)} style={[styles.iconBtn, { borderColor: colors.border }]}>
            <Ionicons name="options-outline" size={18} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={fillRemaining} style={[styles.actionBtn, { borderColor: colors.border }]}>
            <Ionicons name="add-outline" size={16} color={colors.tint} />
            <ThemedText style={[styles.actionBtnText, { color: colors.tint }]}>Fill</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFullScreen(true)} style={[styles.iconBtn, { borderColor: colors.border }]}>
            <Ionicons name="expand-outline" size={18} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearOutfit} style={[styles.iconBtn, { borderColor: colors.border }]}>
            <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
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

      {/* Three-way item selection sheet */}
      <ItemSelectionSheet
        visible={showSelectionSheet}
        category={selectingCategory}
        onClose={() => {
          setShowSelectionSheet(false);
          if (!slotSelectionMode) {
            setSelectingCategory(null);
          }
        }}
        onSelect={handleSelectionOption}
        isAIConfigured={isAIConfigured}
      />

      {/* Browse closet modal */}
      <Modal
        visible={slotSelectionMode === 'browse' && selectingCategory !== null}
        animationType="slide"
        onRequestClose={closeSlotSelection}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSlotSelection} style={styles.closeBtn}>
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
                <Image source={{ uri: getItemImageUri(item) }} style={styles.gridThumb} />
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

      {/* AI closet suggestions modal */}
      <Modal
        visible={slotSelectionMode === 'suggest-closet' && selectingCategory !== null}
        animationType="slide"
        onRequestClose={closeSlotSelection}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSlotSelection} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.modalTitleRow}>
              <Ionicons name="sparkles" size={20} color="#9c27b0" />
              <ThemedText type="title">
                AI Suggests {selectingCategory ? getCategoryDisplayName(selectingCategory) : ''}
              </ThemedText>
            </View>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView contentContainerStyle={styles.suggestionsContent}>
            {isLoadingSlotSuggestions && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9c27b0" />
                <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Finding the best matches...
                </ThemedText>
              </View>
            )}

            {!isLoadingSlotSuggestions && slotSuggestions && slotSuggestions.suggestions.length > 0 && (
              <View style={styles.suggestionsList}>
                {slotSuggestions.advice && (
                  <ThemedText style={[styles.adviceText, { color: colors.textSecondary }]}>
                    {slotSuggestions.advice}
                  </ThemedText>
                )}
                {slotSuggestions.suggestions.map((suggestion) => {
                  const item = available.find((i) => i.id === suggestion.itemId);
                  if (!item) return null;
                  const closetSuggestion: ClosetSuggestion = {
                    item,
                    reasoning: suggestion.reasoning,
                    matchScore: suggestion.matchScore,
                  };
                  return (
                    <ClosetSuggestionCard
                      key={item.id}
                      suggestion={closetSuggestion}
                      onSelect={handleItemSelect}
                    />
                  );
                })}
              </View>
            )}

            {!isLoadingSlotSuggestions && (!slotSuggestions || slotSuggestions.suggestions.length === 0) && (
              <View style={styles.emptyContainer}>
                <Ionicons name="sparkles-outline" size={48} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No suggestions available. Try adding more items to your closet.
                </ThemedText>
                <TouchableOpacity
                  style={[styles.fallbackBtn, { borderColor: colors.border }]}
                  onPress={() => setSlotSelectionMode('browse')}
                >
                  <ThemedText style={{ color: colors.tint }}>Browse Closet Instead</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* AI purchase suggestions modal */}
      <Modal
        visible={slotSelectionMode === 'suggest-new' && selectingCategory !== null}
        animationType="slide"
        onRequestClose={closeSlotSelection}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSlotSelection} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.modalTitleRow}>
              <Ionicons name="globe-outline" size={20} color="#4285F4" />
              <ThemedText type="title">
                Shop {selectingCategory ? getCategoryDisplayName(selectingCategory) : ''}
              </ThemedText>
            </View>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView contentContainerStyle={styles.suggestionsContent}>
            {isLoadingSlotSuggestions && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Finding shopping ideas...
                </ThemedText>
              </View>
            )}

            {!isLoadingSlotSuggestions && purchaseSuggestions && purchaseSuggestions.suggestions.length > 0 && (
              <View style={styles.suggestionsList}>
                {purchaseSuggestions.advice && (
                  <ThemedText style={[styles.adviceText, { color: colors.textSecondary }]}>
                    {purchaseSuggestions.advice}
                  </ThemedText>
                )}
                {purchaseSuggestions.suggestions.map((suggestion, index) => {
                  const purchaseSuggestion: PurchaseSuggestion = {
                    category: suggestion.category,
                    description: suggestion.description,
                    colors: suggestion.colors,
                    style: suggestion.style,
                    reasoning: suggestion.reasoning,
                    searchQuery: suggestion.searchQuery,
                  };
                  return (
                    <PurchaseSuggestionCard
                      key={`${suggestion.category}-${index}`}
                      suggestion={purchaseSuggestion}
                    />
                  );
                })}
              </View>
            )}

            {!isLoadingSlotSuggestions && (!purchaseSuggestions || purchaseSuggestions.suggestions.length === 0) && (
              <View style={styles.emptyContainer}>
                <Ionicons name="globe-outline" size={48} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No shopping suggestions available.
                </ThemedText>
                <TouchableOpacity
                  style={[styles.fallbackBtn, { borderColor: colors.border }]}
                  onPress={() => setSlotSelectionMode('browse')}
                >
                  <ThemedText style={{ color: colors.tint }}>Browse Closet Instead</ThemedText>
                </TouchableOpacity>
              </View>
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

      {/* Shopping recommendations modal */}
      <Modal visible={showShoppingModal} animationType="slide" onRequestClose={() => setShowShoppingModal(false)}>
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowShoppingModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="title">Shop New Items</ThemedText>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView contentContainerStyle={styles.shoppingContent}>
            {shoppingRecommendations && (
              <ShoppingRecommendationsList
                recommendations={shoppingRecommendations.recommendations}
                overallAdvice={shoppingRecommendations.overallAdvice}
                onShopPress={() => {}}
              />
            )}
            {!shoppingRecommendations && (
              <ThemedText style={styles.emptyText}>
                No shopping recommendations yet. Try adding some items to your outfit first!
              </ThemedText>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

function FullScreenPreview({ items }: { items: Item[] }) {
  const slots = categorizeItems(items);

  const hasOuterwear = slots.outerwear.length > 0;
  const hasAccessory = slots.accessory.length > 0;
  const hasSideItems = hasOuterwear || hasAccessory;

  // Helper to render an item image
  const renderItem = (item: Item) => (
    <Image
      key={item.id}
      source={{ uri: getItemImageUri(item) }}
      style={styles.previewThumb}
    />
  );

  // If we have outerwear or accessories, use two-column layout
  if (hasSideItems) {
    return (
      <View style={styles.previewLayout}>
        {/* Hat - spans full width if present */}
        {slots.hat.length > 0 && (
          <View style={styles.previewCategoryRow}>
            {slots.hat.map(renderItem)}
          </View>
        )}

        {/* Top row: Top + Outerwear */}
        <View style={styles.previewTwoColumn}>
          <View style={styles.previewColumnLeft}>
            {slots.top.map(renderItem)}
          </View>
          <View style={styles.previewColumnRight}>
            {slots.outerwear.map(renderItem)}
          </View>
        </View>

        {/* Bottom row: Bottom + Accessory */}
        <View style={styles.previewTwoColumn}>
          <View style={styles.previewColumnLeft}>
            {slots.bottom.map(renderItem)}
          </View>
          <View style={styles.previewColumnRight}>
            {slots.accessory.map(renderItem)}
          </View>
        </View>

        {/* Shoes - spans full width if present */}
        {slots.shoes.length > 0 && (
          <View style={styles.previewCategoryRow}>
            {slots.shoes.map(renderItem)}
          </View>
        )}
      </View>
    );
  }

  // Simple single-column layout for basic outfits
  const CATEGORIES_ORDER: Category[] = ['hat', 'top', 'bottom', 'shoes'];
  const populatedSlots = CATEGORIES_ORDER.filter((cat) => slots[cat].length > 0);

  return (
    <View style={styles.previewLayout}>
      {populatedSlots.map((category) => (
        <View key={category} style={styles.previewCategoryRow}>
          {slots[category].map(renderItem)}
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
                <Image source={{ uri: getItemImageUri(item) }} style={styles.slotThumb} />
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
  headerLeft: { gap: Spacing.xs },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chatBtn: { padding: Spacing.sm },
  savedBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, padding: Spacing.sm },
  savedBtnText: { fontSize: 13, fontWeight: '600' },
  weatherInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  weatherTemp: {
    fontSize: 13,
    fontWeight: '600',
  },
  weatherCity: {
    fontSize: 12,
  },
  aiModeToggle: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  aiModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.button,
    borderWidth: 1,
  },
  aiModeBtnActive: {
    backgroundColor: '#9c27b0',
    borderColor: '#9c27b0',
  },
  aiModeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  aiModeBtnTextActive: {
    color: '#fff',
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
  iconBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { fontSize: 11, fontWeight: '600' },
  aiBtn: {
    backgroundColor: '#9c27b0',
    borderColor: '#9c27b0',
  },
  aiBtnText: { fontSize: 11, fontWeight: '600', color: '#fff' },
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
  shoppingContent: { paddingBottom: Spacing.xxxl },
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
  previewTwoColumn: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewColumnLeft: {
    alignItems: 'center',
  },
  previewColumnRight: {
    alignItems: 'center',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  suggestionsContent: {
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  suggestionsList: {
    gap: Spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  adviceText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  fallbackBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.button,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
});
