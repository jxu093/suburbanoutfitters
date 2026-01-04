/**
 * Tests for color matching utilities
 */

import {
  extractColors,
  areColorsHarmonious,
  isNeutralColor,
  calculateColorCompatibility,
  calculateOutfitColorHarmony,
  filterColorCompatibleItems,
} from '../app/utils/color-matching';

describe('Color Matching Utilities', () => {
  describe('extractColors', () => {
    test('extracts colors from item name', () => {
      const item = { name: 'Blue T-Shirt', tags: [] };
      const colors = extractColors(item);
      expect(colors).toContain('blue');
    });

    test('extracts colors from item tags', () => {
      const item = { name: 'Casual Shirt', tags: ['navy', 'cotton'] };
      const colors = extractColors(item);
      expect(colors).toContain('navy');
    });

    test('extracts multiple colors', () => {
      const item = { name: 'Black and White Striped Shirt', tags: [] };
      const colors = extractColors(item);
      expect(colors).toContain('black');
      expect(colors).toContain('white');
    });

    test('handles items with no colors', () => {
      const item = { name: 'Casual Shirt', tags: ['cotton'] };
      const colors = extractColors(item);
      expect(colors).toHaveLength(0);
    });

    test('is case insensitive', () => {
      const item = { name: 'NAVY Blazer', tags: ['BLACK trim'] };
      const colors = extractColors(item);
      expect(colors).toContain('navy');
      expect(colors).toContain('black');
    });
  });

  describe('areColorsHarmonious', () => {
    test('same colors are harmonious', () => {
      expect(areColorsHarmonious('blue', 'blue')).toBe(true);
    });

    test('classic pairings are harmonious', () => {
      expect(areColorsHarmonious('black', 'white')).toBe(true);
      expect(areColorsHarmonious('navy', 'white')).toBe(true);
      expect(areColorsHarmonious('navy', 'khaki')).toBe(true);
      expect(areColorsHarmonious('denim', 'white')).toBe(true);
    });

    test('gray and grey are treated as same', () => {
      expect(areColorsHarmonious('gray', 'grey')).toBe(true);
      expect(areColorsHarmonious('gray', 'pink')).toBe(true);
      expect(areColorsHarmonious('grey', 'pink')).toBe(true);
    });

    test('neutrals go with most colors', () => {
      expect(areColorsHarmonious('black', 'red')).toBe(true);
      expect(areColorsHarmonious('white', 'blue')).toBe(true);
      expect(areColorsHarmonious('gray', 'purple')).toBe(true);
    });
  });

  describe('isNeutralColor', () => {
    test('identifies neutral colors', () => {
      expect(isNeutralColor('black')).toBe(true);
      expect(isNeutralColor('white')).toBe(true);
      expect(isNeutralColor('gray')).toBe(true);
      expect(isNeutralColor('grey')).toBe(true);
      expect(isNeutralColor('beige')).toBe(true);
      expect(isNeutralColor('tan')).toBe(true);
    });

    test('identifies non-neutral colors', () => {
      expect(isNeutralColor('red')).toBe(false);
      expect(isNeutralColor('blue')).toBe(false);
      expect(isNeutralColor('green')).toBe(false);
      expect(isNeutralColor('purple')).toBe(false);
    });
  });

  describe('calculateColorCompatibility', () => {
    test('returns 1 when no colors detected', () => {
      const item1 = { name: 'Shirt', tags: [] };
      const item2 = { name: 'Pants', tags: [] };
      expect(calculateColorCompatibility(item1, item2)).toBe(1);
    });

    test('returns 1 when both have only neutral colors', () => {
      const item1 = { name: 'Black Shirt', tags: [] };
      const item2 = { name: 'White Pants', tags: [] };
      expect(calculateColorCompatibility(item1, item2)).toBe(1);
    });

    test('returns high score for harmonious colors', () => {
      const item1 = { name: 'Navy Blazer', tags: [] };
      const item2 = { name: 'White Shirt', tags: [] };
      const score = calculateColorCompatibility(item1, item2);
      expect(score).toBeGreaterThan(0.5);
    });

    test('returns 1 when one item has no detectable colors', () => {
      const item1 = { name: 'Blue Shirt', tags: [] };
      const item2 = { name: 'Cotton Pants', tags: [] };
      expect(calculateColorCompatibility(item1, item2)).toBe(1);
    });
  });

  describe('calculateOutfitColorHarmony', () => {
    test('returns 1 for single item', () => {
      const items = [{ name: 'Blue Shirt', tags: [] }];
      expect(calculateOutfitColorHarmony(items)).toBe(1);
    });

    test('returns 1 for empty array', () => {
      expect(calculateOutfitColorHarmony([])).toBe(1);
    });

    test('calculates harmony for multiple items', () => {
      const items = [
        { name: 'Navy Blazer', tags: [] },
        { name: 'White Shirt', tags: [] },
        { name: 'Khaki Pants', tags: [] },
      ];
      const harmony = calculateOutfitColorHarmony(items);
      expect(harmony).toBeGreaterThan(0.5);
    });
  });

  describe('filterColorCompatibleItems', () => {
    test('returns all candidates when no existing items', () => {
      const candidates = [
        { name: 'Red Shirt', tags: [] },
        { name: 'Blue Shirt', tags: [] },
      ];
      const result = filterColorCompatibleItems(candidates, []);
      expect(result).toHaveLength(2);
    });

    test('filters items based on color compatibility', () => {
      const candidates = [
        { name: 'Navy Shirt', tags: [] },
        { name: 'Random Shirt', tags: [] }, // No color = compatible
      ];
      const existing = [{ name: 'White Pants', tags: [] }];
      const result = filterColorCompatibleItems(candidates, existing, 0.5);
      expect(result.length).toBeGreaterThan(0);
    });

    test('respects minCompatibility threshold', () => {
      const candidates = [
        { name: 'Navy Shirt', tags: [] },
      ];
      const existing = [{ name: 'White Pants', tags: [] }];

      // With low threshold, should include
      const lowThreshold = filterColorCompatibleItems(candidates, existing, 0.1);
      expect(lowThreshold.length).toBeGreaterThan(0);
    });
  });
});
