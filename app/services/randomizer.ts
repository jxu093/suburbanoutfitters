import type { Item } from '../types';
import { isItemHidden } from '../utils/item-helpers';
import { type WeatherCondition } from '../constants';

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
};

// Simple temperature to condition mapping (can be more sophisticated)
function getTempCategory(temp: number): WeatherCondition {
  if (temp >= 30) return 'hot'; // 30 C or 86 F
  if (temp >= 20) return 'warm'; // 20 C or 68 F
  if (temp >= 10) return 'mild'; // 10 C or 50 F
  if (temp >= 0) return 'cool';  // 0 C or 32 F
  if (temp >= -10) return 'cold'; // -10 C or 14 F
  return 'freezing';
}

// Heuristic for item suitability based on weather (simplified)
function isItemSuitableForWeather(item: Item, condition?: WeatherCondition): boolean {
  if (!condition) return true;

  const itemCategory = item.category?.toLowerCase();
  const itemTags = item.tags?.map(tag => tag.toLowerCase()) || [];

  switch (condition) {
    case 'hot':
      return !['jacket', 'coat', 'sweater', 'long sleeve', 'jeans', 'pants', 'long pants'].some(tag => itemTags.includes(tag)) &&
             !['outerwear', 'mid layer'].includes(itemCategory || '') &&
             !['jeans', 'pants'].includes(itemCategory || '') &&
             !['jeans', 'pants'].some(namePart => item.name.toLowerCase().includes(namePart)); // Also check item name for exclusion
    case 'warm':
      return !['coat', 'heavy sweater', 'winter jacket'].some(tag => itemTags.includes(tag)) &&
             !['outerwear'].includes(itemCategory || ''); // Exclude heavy outerwear for warm
    case 'mild':
      return true; // Most items are fine
    case 'cool':
      return ['jacket', 'sweater', 'long sleeve', 'outerwear', 'mid layer'].some(tag => itemTags.includes(tag)) ||
             ['pants', 'jeans'].includes(itemCategory || '');
    case 'cold':
      return ['jacket', 'coat', 'sweater', 'outerwear'].some(tag => itemTags.includes(tag)) &&
             !['shorts', 'skirt'].includes(itemCategory || '');
    case 'freezing':
      return ['heavy coat', 'winter jacket', 'scarf', 'gloves'].some(tag => itemTags.includes(tag)) ||
             ['outerwear', 'mid layer'].includes(itemCategory || '');
  }
}

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick a single outfit from available items with simple heuristics
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
  } = opts;

  if (!items || items.length === 0) return [];

  let filterableItems = items.filter((item) => {
    // Exclude hidden items
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

    // Filter by weather suitability
    if (!isItemSuitableForWeather(item, weatherCondition)) return false;

    return true;
  });

  const shuffled = shuffle(filterableItems);
  const chosen: Item[] = [];
  const categories = new Set<string | undefined>();
  const target = Math.min(maxItems, Math.max(minItems, Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems));

  for (const it of shuffled) {
    if (chosen.length >= target) break;
    if (avoidSameCategory) {
      const cat = it.category ?? undefined;
      if (cat && categories.has(cat)) continue;
      if (cat) categories.add(cat);
      chosen.push(it);
    } else {
      chosen.push(it);
    }
  }

  // If we couldn't meet target due to category constraints or limited items, fill from remaining filterable items
  if (chosen.length < target) {
    for (const it of filterableItems) {
      if (chosen.length >= target) break;
      if (!chosen.includes(it)) chosen.push(it);
    }
  }

  return chosen;
}

export function generateMany(items: Item[], count: number, opts: RandomizeOptions = {}) {
  const results: Item[][] = [];
  for (let i = 0; i < count; i++) {
    results.push(pickRandomOutfit(items, opts));
  }
  return results;
}
