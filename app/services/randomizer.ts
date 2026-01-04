import type { Item } from '../types';
import { isItemHidden } from '../utils/item-helpers';
import { type WeatherCondition, normalizeCategory, CATEGORIES, type Category } from '../constants';
import { filterColorCompatibleItems, calculateOutfitColorHarmony } from '../utils/color-matching';

export type { WeatherCondition };

export type RandomizeOptions = {
  minItems?: number;
  maxItems?: number;
  avoidSameCategory?: boolean;
  requiredCategories?: string[]; // e.g., ['top', 'bottom']
  excludedCategories?: string[];
  requiredTags?: string[];
  excludedTags?: string[];
  weatherCondition?: WeatherCondition;
  // Rule-based options
  useColorMatching?: boolean;
  colorMatchThreshold?: number; // 0-1, default 0.5
  useWeatherRules?: boolean;
  preferFavorites?: boolean;
  ensureCompleteOutfit?: boolean; // Try to include top + bottom at minimum
};

// Default options for quick randomize (basic mode)
export const DEFAULT_OPTIONS: RandomizeOptions = {
  minItems: 2,
  maxItems: 4,
  avoidSameCategory: true,
  useColorMatching: false,
  useWeatherRules: false,
  preferFavorites: false,
  ensureCompleteOutfit: false,
};

// Smart options for rule-based generation
export const SMART_OPTIONS: RandomizeOptions = {
  minItems: 3,
  maxItems: 5,
  avoidSameCategory: true,
  useColorMatching: true,
  colorMatchThreshold: 0.5,
  useWeatherRules: true,
  preferFavorites: true,
  ensureCompleteOutfit: true,
};

// Simple temperature to condition mapping
export function getTempCategory(temp: number): WeatherCondition {
  if (temp >= 30) return 'hot'; // 30 C or 86 F
  if (temp >= 20) return 'warm'; // 20 C or 68 F
  if (temp >= 10) return 'mild'; // 10 C or 50 F
  if (temp >= 0) return 'cool';  // 0 C or 32 F
  if (temp >= -10) return 'cold'; // -10 C or 14 F
  return 'freezing';
}

// Enhanced weather suitability with more nuanced rules
function isItemSuitableForWeather(item: Item, condition?: WeatherCondition): boolean {
  if (!condition) return true;

  const itemCategory = normalizeCategory(item.category);
  const itemTags = item.tags?.map(tag => tag.toLowerCase()) || [];
  const itemName = item.name?.toLowerCase() || '';

  // Helper to check if item has certain keywords
  const hasKeyword = (...keywords: string[]) =>
    keywords.some(kw => itemTags.includes(kw) || itemName.includes(kw));

  switch (condition) {
    case 'hot':
      // Exclude heavy items in hot weather
      if (hasKeyword('jacket', 'coat', 'sweater', 'hoodie', 'long sleeve', 'wool', 'fleece')) return false;
      if (itemCategory === 'outerwear') return false;
      // Prefer shorts, tanks, light items
      return true;

    case 'warm':
      // Exclude heavy outerwear
      if (hasKeyword('coat', 'heavy', 'winter', 'wool', 'parka', 'down')) return false;
      if (itemCategory === 'outerwear' && hasKeyword('heavy', 'winter', 'coat')) return false;
      return true;

    case 'mild':
      // Most items work
      return true;

    case 'cool':
      // Prefer layers, long pants
      if (itemCategory === 'bottom' && hasKeyword('shorts')) return false;
      return true;

    case 'cold':
      // Need warm items
      if (hasKeyword('shorts', 'tank', 'sleeveless', 'sandal')) return false;
      if (itemCategory === 'shoes' && hasKeyword('sandal', 'flip flop')) return false;
      return true;

    case 'freezing':
      // Only heavy winter items
      if (hasKeyword('shorts', 'tank', 'sleeveless', 'sandal', 'light')) return false;
      if (itemCategory === 'shoes' && !hasKeyword('boot', 'winter')) return false;
      return true;
  }
}

// Get items recommended for weather (not just filtered out)
function getWeatherRecommendedItems(items: Item[], condition: WeatherCondition): Item[] {
  const recommended: Item[] = [];

  for (const item of items) {
    const itemCategory = normalizeCategory(item.category);
    const itemTags = item.tags?.map(tag => tag.toLowerCase()) || [];
    const itemName = item.name?.toLowerCase() || '';
    const hasKeyword = (...keywords: string[]) =>
      keywords.some(kw => itemTags.includes(kw) || itemName.includes(kw));

    let isRecommended = false;

    switch (condition) {
      case 'hot':
        isRecommended = hasKeyword('light', 'summer', 'breathable', 'shorts', 'tank', 't-shirt', 'sandal');
        break;
      case 'warm':
        isRecommended = hasKeyword('light', 'casual', 't-shirt', 'shorts') || itemCategory === 'top';
        break;
      case 'mild':
        isRecommended = true; // Everything works
        break;
      case 'cool':
        isRecommended = hasKeyword('jacket', 'sweater', 'hoodie', 'long sleeve', 'jeans', 'pants');
        break;
      case 'cold':
        isRecommended = hasKeyword('jacket', 'coat', 'sweater', 'hoodie', 'wool', 'warm', 'fleece');
        break;
      case 'freezing':
        isRecommended = hasKeyword('coat', 'parka', 'winter', 'heavy', 'wool', 'down', 'boots');
        break;
    }

    if (isRecommended) {
      recommended.push(item);
    }
  }

  return recommended;
}

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Group items by category
function groupByCategory(items: Item[]): Map<Category, Item[]> {
  const groups = new Map<Category, Item[]>();

  for (const item of items) {
    const category = normalizeCategory(item.category);
    if (!category) continue;

    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(item);
  }

  return groups;
}

/**
 * Enhanced rule-based outfit picker
 */
export function pickRandomOutfit(items: Item[], opts: RandomizeOptions = {}): Item[] {
  const {
    minItems = 2,
    maxItems = 4,
    avoidSameCategory = true,
    requiredCategories,
    excludedCategories,
    requiredTags,
    excludedTags,
    weatherCondition,
    useColorMatching = false,
    colorMatchThreshold = 0.5,
    useWeatherRules = false,
    preferFavorites = false,
    ensureCompleteOutfit = false,
  } = opts;

  if (!items || items.length === 0) return [];

  // Step 1: Basic filtering
  let filterableItems = items.filter((item) => {
    if (isItemHidden(item)) return false;

    // Filter by required categories
    if (requiredCategories && requiredCategories.length > 0 && item.category) {
      if (!requiredCategories.includes(item.category)) return false;
    }
    // Filter by excluded categories
    if (excludedCategories && excludedCategories.length > 0 && item.category) {
      if (excludedCategories.includes(item.category)) return false;
    }
    // Filter by required tags
    if (requiredTags && requiredTags.length > 0 && item.tags) {
      if (!requiredTags.every((tag) => item.tags?.includes(tag))) return false;
    }
    // Filter by excluded tags
    if (excludedTags && excludedTags.length > 0 && item.tags) {
      if (excludedTags.some((tag) => item.tags?.includes(tag))) return false;
    }

    // Weather filtering
    if (useWeatherRules && weatherCondition) {
      if (!isItemSuitableForWeather(item, weatherCondition)) return false;
    }

    return true;
  });

  if (filterableItems.length === 0) return [];

  // Step 2: Sort by preference (favorites first if enabled)
  if (preferFavorites) {
    filterableItems.sort((a, b) => {
      const aFav = a.favorite ? 1 : 0;
      const bFav = b.favorite ? 1 : 0;
      return bFav - aFav;
    });
  }

  // Step 3: Group by category
  const byCategory = groupByCategory(filterableItems);
  const chosen: Item[] = [];
  const usedCategories = new Set<Category>();

  // Step 4: If ensuring complete outfit, start with core categories
  if (ensureCompleteOutfit) {
    const coreCategories: Category[] = ['top', 'bottom'];

    for (const category of coreCategories) {
      const categoryItems = byCategory.get(category);
      if (!categoryItems || categoryItems.length === 0) continue;

      let candidates = shuffle(categoryItems);

      // Apply color matching if enabled and we have existing items
      if (useColorMatching && chosen.length > 0) {
        const compatible = filterColorCompatibleItems(candidates, chosen, colorMatchThreshold);
        if (compatible.length > 0) {
          candidates = compatible;
        }
      }

      // Prefer favorites
      if (preferFavorites) {
        const favorites = candidates.filter(i => i.favorite);
        if (favorites.length > 0 && Math.random() > 0.3) {
          candidates = favorites;
        }
      }

      // Weather recommendations
      if (useWeatherRules && weatherCondition) {
        const recommended = getWeatherRecommendedItems(candidates, weatherCondition);
        if (recommended.length > 0 && Math.random() > 0.3) {
          candidates = recommended;
        }
      }

      if (candidates.length > 0) {
        chosen.push(candidates[0]);
        usedCategories.add(category);
      }
    }
  }

  // Step 5: Fill remaining slots
  const target = Math.min(maxItems, Math.max(minItems, Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems));

  // Get remaining categories to consider
  const remainingCategories = CATEGORIES.filter(c => !usedCategories.has(c));

  for (const category of shuffle(remainingCategories)) {
    if (chosen.length >= target) break;

    const categoryItems = byCategory.get(category);
    if (!categoryItems || categoryItems.length === 0) continue;

    let candidates = shuffle(categoryItems);

    // Apply color matching
    if (useColorMatching && chosen.length > 0) {
      const compatible = filterColorCompatibleItems(candidates, chosen, colorMatchThreshold);
      if (compatible.length > 0) {
        candidates = compatible;
      }
    }

    // Prefer favorites
    if (preferFavorites) {
      const favorites = candidates.filter(i => i.favorite);
      if (favorites.length > 0 && Math.random() > 0.3) {
        candidates = favorites;
      }
    }

    if (candidates.length > 0) {
      chosen.push(candidates[0]);
      usedCategories.add(category);
    }
  }

  // Step 6: If we still need more items and !avoidSameCategory, add more from any category
  if (!avoidSameCategory && chosen.length < target) {
    const allRemaining = filterableItems.filter(i => !chosen.includes(i));
    let candidates = shuffle(allRemaining);

    if (useColorMatching && chosen.length > 0) {
      const compatible = filterColorCompatibleItems(candidates, chosen, colorMatchThreshold);
      if (compatible.length > 0) {
        candidates = compatible;
      }
    }

    for (const item of candidates) {
      if (chosen.length >= target) break;
      chosen.push(item);
    }
  }

  return chosen;
}

/**
 * Generate multiple outfit options
 */
export function generateMany(items: Item[], count: number, opts: RandomizeOptions = {}) {
  const results: Item[][] = [];

  for (let i = 0; i < count; i++) {
    const outfit = pickRandomOutfit(items, opts);
    // Avoid duplicates by checking if this exact combination exists
    const outfitIds = outfit.map(i => i.id).sort().join(',');
    const isDuplicate = results.some(r =>
      r.map(i => i.id).sort().join(',') === outfitIds
    );

    if (!isDuplicate || results.length < count / 2) {
      results.push(outfit);
    } else {
      // Try once more with slightly different options
      const altOutfit = pickRandomOutfit(items, { ...opts, minItems: (opts.minItems || 2) + 1 });
      results.push(altOutfit);
    }
  }

  return results;
}

/**
 * Score an outfit based on rules (for display/sorting)
 */
export function scoreOutfit(outfit: Item[], weatherCondition?: WeatherCondition): number {
  let score = 0;

  // Base score for having items
  score += outfit.length * 10;

  // Color harmony bonus
  const colorHarmony = calculateOutfitColorHarmony(outfit);
  score += colorHarmony * 30;

  // Category completeness bonus
  const categories = new Set(outfit.map(i => normalizeCategory(i.category)).filter(Boolean));
  if (categories.has('top')) score += 15;
  if (categories.has('bottom')) score += 15;
  if (categories.has('shoes')) score += 10;

  // Weather appropriateness bonus
  if (weatherCondition) {
    const weatherAppropriate = outfit.every(i => isItemSuitableForWeather(i, weatherCondition));
    if (weatherAppropriate) score += 20;
  }

  // Favorites bonus
  const favoriteCount = outfit.filter(i => i.favorite).length;
  score += favoriteCount * 5;

  return Math.round(score);
}
