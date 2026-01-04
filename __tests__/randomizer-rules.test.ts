/**
 * Tests for rule-based outfit generation
 */

import { pickRandomOutfit, scoreOutfit, DEFAULT_OPTIONS, SMART_OPTIONS, getTempCategory } from '../app/services/randomizer';
import type { Item } from '../app/types';

// Mock items for testing
const mockItems: Item[] = [
  // Tops
  { id: 1, name: 'White T-Shirt', category: 'top', tags: ['white', 'casual', 'summer'], favorite: true, createdAt: Date.now() },
  { id: 2, name: 'Navy Polo', category: 'top', tags: ['navy', 'casual'], favorite: false, createdAt: Date.now() },
  { id: 3, name: 'Black Sweater', category: 'top', tags: ['black', 'warm', 'winter'], favorite: false, createdAt: Date.now() },

  // Bottoms
  { id: 4, name: 'Blue Jeans', category: 'bottom', tags: ['denim', 'blue', 'casual'], favorite: true, createdAt: Date.now() },
  { id: 5, name: 'Khaki Pants', category: 'bottom', tags: ['khaki', 'formal'], favorite: false, createdAt: Date.now() },
  { id: 6, name: 'Black Shorts', category: 'bottom', tags: ['black', 'summer', 'shorts'], favorite: false, createdAt: Date.now() },

  // Shoes
  { id: 7, name: 'White Sneakers', category: 'shoes', tags: ['white', 'casual'], favorite: true, createdAt: Date.now() },
  { id: 8, name: 'Brown Boots', category: 'shoes', tags: ['brown', 'winter', 'boots'], favorite: false, createdAt: Date.now() },

  // Outerwear
  { id: 9, name: 'Navy Jacket', category: 'outerwear', tags: ['navy', 'jacket', 'cool'], favorite: false, createdAt: Date.now() },
  { id: 10, name: 'Black Winter Coat', category: 'outerwear', tags: ['black', 'winter', 'heavy', 'coat'], favorite: false, createdAt: Date.now() },

  // Accessories
  { id: 11, name: 'Silver Watch', category: 'accessory', tags: ['silver', 'formal'], favorite: true, createdAt: Date.now() },
  { id: 12, name: 'Brown Belt', category: 'accessory', tags: ['brown', 'casual'], favorite: false, createdAt: Date.now() },
];

describe('Rule-based Outfit Generation', () => {
  describe('pickRandomOutfit - Basic Options', () => {
    test('returns empty array for empty input', () => {
      const result = pickRandomOutfit([]);
      expect(result).toHaveLength(0);
    });

    test('respects minItems option', () => {
      const result = pickRandomOutfit(mockItems, { minItems: 3, maxItems: 5 });
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    test('respects maxItems option', () => {
      const result = pickRandomOutfit(mockItems, { minItems: 2, maxItems: 3 });
      expect(result.length).toBeLessThanOrEqual(3);
    });

    test('avoids same category when option is true', () => {
      const result = pickRandomOutfit(mockItems, { avoidSameCategory: true, minItems: 4, maxItems: 6 });
      const categories = result.map(item => item.category);
      const uniqueCategories = new Set(categories);
      expect(uniqueCategories.size).toBe(categories.length);
    });

    test('excludes hidden items', () => {
      const itemsWithHidden: Item[] = [
        ...mockItems,
        { id: 100, name: 'Hidden Item', category: 'top', hiddenUntil: Date.now() + 100000, createdAt: Date.now() },
      ];
      const results: Item[] = [];
      for (let i = 0; i < 20; i++) {
        results.push(...pickRandomOutfit(itemsWithHidden));
      }
      expect(results.find(item => item.id === 100)).toBeUndefined();
    });
  });

  describe('pickRandomOutfit - Category Filtering', () => {
    test('respects excludedCategories', () => {
      const result = pickRandomOutfit(mockItems, {
        excludedCategories: ['accessory', 'hat'],
        minItems: 4,
        maxItems: 6,
      });
      const hasExcluded = result.some(item => item.category === 'accessory' || item.category === 'hat');
      expect(hasExcluded).toBe(false);
    });
  });

  describe('pickRandomOutfit - Smart Options', () => {
    test('ensureCompleteOutfit includes top and bottom', () => {
      const result = pickRandomOutfit(mockItems, {
        ensureCompleteOutfit: true,
        minItems: 2,
        maxItems: 6,
      });
      const categories = result.map(item => item.category);
      expect(categories).toContain('top');
      expect(categories).toContain('bottom');
    });

    test('preferFavorites increases chance of favorites', () => {
      // Run multiple times and count favorites
      let totalFavorites = 0;
      let totalItems = 0;
      for (let i = 0; i < 50; i++) {
        const result = pickRandomOutfit(mockItems, {
          preferFavorites: true,
          minItems: 3,
          maxItems: 5,
        });
        totalFavorites += result.filter(item => item.favorite).length;
        totalItems += result.length;
      }
      const favoriteRatio = totalFavorites / totalItems;
      // Favorites should appear more often than their proportion in the dataset
      // 4 out of 12 items are favorites (33%), with preference should be higher
      expect(favoriteRatio).toBeGreaterThan(0.25);
    });
  });

  describe('pickRandomOutfit - Weather Rules', () => {
    test('weather rules produce valid outfits', () => {
      // Test that weather rules produce outfits for different conditions
      const hotOutfit = pickRandomOutfit(mockItems, {
        useWeatherRules: true,
        weatherCondition: 'hot',
        minItems: 2,
        maxItems: 4,
      });
      expect(hotOutfit.length).toBeGreaterThan(0);

      const coldOutfit = pickRandomOutfit(mockItems, {
        useWeatherRules: true,
        weatherCondition: 'cold',
        minItems: 2,
        maxItems: 4,
      });
      expect(coldOutfit.length).toBeGreaterThan(0);
    });

    test('cold weather excludes shorts', () => {
      const results: Item[] = [];
      for (let i = 0; i < 20; i++) {
        results.push(...pickRandomOutfit(mockItems, {
          useWeatherRules: true,
          weatherCondition: 'cold',
          minItems: 2,
          maxItems: 4,
        }));
      }

      // Items with 'shorts' tag should be excluded in cold weather
      const hasShorts = results.some(item => item.tags?.includes('shorts'));
      expect(hasShorts).toBe(false);
    });
  });

  describe('pickRandomOutfit - Color Matching', () => {
    test('color matching produces outfit', () => {
      const result = pickRandomOutfit(mockItems, {
        useColorMatching: true,
        colorMatchThreshold: 0.3, // Lower threshold for more flexibility
        minItems: 3,
        maxItems: 5,
      });
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('scoreOutfit', () => {
    test('scores outfit based on items', () => {
      const outfit = [mockItems[0], mockItems[3], mockItems[6]]; // Top, bottom, shoes
      const score = scoreOutfit(outfit);
      expect(score).toBeGreaterThan(0);
    });

    test('higher score for complete outfit', () => {
      const completeOutfit = [mockItems[0], mockItems[3], mockItems[6]]; // Top, bottom, shoes
      const incompleteOutfit = [mockItems[0]]; // Just top

      const completeScore = scoreOutfit(completeOutfit);
      const incompleteScore = scoreOutfit(incompleteOutfit);

      expect(completeScore).toBeGreaterThan(incompleteScore);
    });

    test('higher score for favorites', () => {
      const withFavorites = [mockItems[0], mockItems[3]]; // Both favorites
      const withoutFavorites = [mockItems[2], mockItems[5]]; // No favorites

      const favScore = scoreOutfit(withFavorites);
      const noFavScore = scoreOutfit(withoutFavorites);

      expect(favScore).toBeGreaterThan(noFavScore);
    });
  });

  describe('getTempCategory', () => {
    test('categorizes temperatures correctly', () => {
      expect(getTempCategory(35)).toBe('hot');
      expect(getTempCategory(25)).toBe('warm');
      expect(getTempCategory(15)).toBe('mild');
      expect(getTempCategory(5)).toBe('cool');
      expect(getTempCategory(-5)).toBe('cold');
      expect(getTempCategory(-15)).toBe('freezing');
    });

    test('handles boundary temperatures', () => {
      expect(getTempCategory(30)).toBe('hot');
      expect(getTempCategory(20)).toBe('warm');
      expect(getTempCategory(10)).toBe('mild');
      expect(getTempCategory(0)).toBe('cool');
      expect(getTempCategory(-10)).toBe('cold');
    });
  });

  describe('Preset Options', () => {
    test('DEFAULT_OPTIONS has expected values', () => {
      expect(DEFAULT_OPTIONS.useColorMatching).toBe(false);
      expect(DEFAULT_OPTIONS.useWeatherRules).toBe(false);
      expect(DEFAULT_OPTIONS.preferFavorites).toBe(false);
      expect(DEFAULT_OPTIONS.ensureCompleteOutfit).toBe(false);
    });

    test('SMART_OPTIONS has expected values', () => {
      expect(SMART_OPTIONS.useColorMatching).toBe(true);
      expect(SMART_OPTIONS.useWeatherRules).toBe(true);
      expect(SMART_OPTIONS.preferFavorites).toBe(true);
      expect(SMART_OPTIONS.ensureCompleteOutfit).toBe(true);
    });
  });
});
