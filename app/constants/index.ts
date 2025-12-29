// Re-export theme constants
export { Colors, Fonts } from './theme';

// Time durations for hiding items
export const HIDE_DURATION_MS = {
  ONE_DAY: 24 * 60 * 60 * 1000,
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
} as const;

// Weather conditions for outfit filtering
export const WEATHER_CONDITIONS = ['hot', 'warm', 'mild', 'cool', 'cold', 'freezing'] as const;
export type WeatherCondition = (typeof WEATHER_CONDITIONS)[number];

// Image processing configuration
export const IMAGE_CONFIG = {
  MAX_WIDTH: 1200,
  THUMB_WIDTH: 300,
  QUALITY: 0.7,
  THUMB_QUALITY: 0.6,
} as const;

// Special tag prefixes for lists
export const LIST_TAG_PREFIX = '_list:';

// Built-in list tags
export const LIST_TAGS = {
  FAVORITES: `${LIST_TAG_PREFIX}favorites`,
} as const;

// Helper to check if a tag is a list tag
export function isListTag(tag: string): boolean {
  return tag.startsWith(LIST_TAG_PREFIX);
}

// Helper to get display name from list tag
export function getListDisplayName(tag: string): string {
  if (!isListTag(tag)) return tag;
  return tag.slice(LIST_TAG_PREFIX.length);
}

// Helper to create a list tag from a name
export function createListTag(name: string): string {
  return `${LIST_TAG_PREFIX}${name.toLowerCase().replace(/\s+/g, '-')}`;
}

// Fixed categories for items
export const CATEGORIES = ['top', 'bottom', 'shoes', 'outerwear', 'hat', 'accessory'] as const;
export type Category = (typeof CATEGORIES)[number];

// Common aliases mapping to fixed categories
const CATEGORY_ALIASES: Record<string, Category> = {
  // Tops
  shirt: 'top',
  't-shirt': 'top',
  tshirt: 'top',
  blouse: 'top',
  sweater: 'top',
  tank: 'top',
  'tank top': 'top',
  polo: 'top',
  tee: 'top',
  // Bottoms
  pants: 'bottom',
  jeans: 'bottom',
  shorts: 'bottom',
  skirt: 'bottom',
  trousers: 'bottom',
  leggings: 'bottom',
  // Outerwear
  jacket: 'outerwear',
  coat: 'outerwear',
  hoodie: 'outerwear',
  blazer: 'outerwear',
  cardigan: 'outerwear',
  vest: 'outerwear',
  // Hats
  cap: 'hat',
  beanie: 'hat',
  // Shoes
  sneakers: 'shoes',
  boots: 'shoes',
  sandals: 'shoes',
  heels: 'shoes',
  flats: 'shoes',
  loafers: 'shoes',
  // Accessories
  belt: 'accessory',
  watch: 'accessory',
  jewelry: 'accessory',
  bag: 'accessory',
  scarf: 'accessory',
  sunglasses: 'accessory',
  necklace: 'accessory',
  bracelet: 'accessory',
  earrings: 'accessory',
};

// Normalize free-text category to fixed category
export function normalizeCategory(input: string | null | undefined): Category | null {
  if (!input) return null;
  const lower = input.toLowerCase().trim();

  // Direct match
  if (CATEGORIES.includes(lower as Category)) return lower as Category;

  // Alias match
  if (lower in CATEGORY_ALIASES) return CATEGORY_ALIASES[lower];

  return null;
}

// Get display name for category (capitalized)
export function getCategoryDisplayName(category: Category): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
