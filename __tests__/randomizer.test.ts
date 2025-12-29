import { pickRandomOutfit } from '../app/services/randomizer';

describe('randomizer', () => {
  const sampleItems = [
    { id: 1, name: 'Shirt', category: 'tops' },
    { id: 2, name: 'Jacket', category: 'outer' },
    { id: 3, name: 'Jeans', category: 'bottoms' },
    { id: 4, name: 'Hat', category: 'accessories' },
    { id: 5, name: 'Scarf', category: 'accessories' },
  ];

  test('returns between min and max items', () => {
    const out = pickRandomOutfit(sampleItems as any, { minItems: 2, maxItems: 4 });
    expect(out.length).toBeGreaterThanOrEqual(2);
    expect(out.length).toBeLessThanOrEqual(4);
  });

  test('tries to avoid duplicate categories when avoidSameCategory is true', () => {
    const out = pickRandomOutfit(sampleItems as any, { minItems: 3, maxItems: 4, avoidSameCategory: true });
    // Note: This test uses old sample data with non-normalized categories
    // The randomizer now uses normalized categories, so we need to check normalized values
    const { normalizeCategory } = require('../app/constants');
    const normalizedCats = out.map((o) => normalizeCategory(o.category)).filter(Boolean);
    const unique = new Set(normalizedCats);
    expect(unique.size).toBe(normalizedCats.length);
  });

  const fullItems = [
    { id: 1, name: 'T-Shirt', category: 'top', tags: ['casual', 'summer'], hidden: false },
    { id: 2, name: 'Jeans', category: 'bottom', tags: ['casual', 'winter'], hidden: false },
    { id: 3, name: 'Jacket', category: 'outerwear', tags: ['cool', 'winter'], hidden: false },
    { id: 4, name: 'Shorts', category: 'bottom', tags: ['casual', 'summer'], hidden: false },
    { id: 5, name: 'Dress Shirt', category: 'top', tags: ['formal', 'spring'], hidden: false },
    { id: 6, name: 'Winter Coat', category: 'outerwear', tags: ['cold', 'winter'], hidden: false },
    { id: 7, name: 'Sneakers', category: 'shoes', tags: ['casual'], hidden: false },
    { id: 8, name: 'Sandals', category: 'shoes', tags: ['summer'], hidden: false },
    { id: 9, name: 'Hat', category: 'accessory', tags: ['summer'], hidden: false },
    { id: 10, name: 'Scarf', category: 'accessory', tags: ['winter'], hidden: false },
    { id: 11, name: 'Hidden Item', category: 'misc', tags: ['test'], hidden: true },
  ];

  test('filters out hidden items', () => {
    const out = pickRandomOutfit(fullItems as any, { minItems: 1, maxItems: 1 });
    expect(out.every(item => !item.hidden)).toBe(true);
  });

  test('filters by required categories', () => {
    const out = pickRandomOutfit(fullItems as any, { minItems: 1, maxItems: 5, requiredCategories: ['top'] });
    expect(out.every((item) => item.category === 'top')).toBe(true);
  });

  test('filters by excluded categories', () => {
    const out = pickRandomOutfit(fullItems as any, { minItems: 1, maxItems: 5, excludedCategories: ['outerwear'] });
    expect(out.every((item) => item.category !== 'outerwear')).toBe(true);
  });

  test('filters by required tags', () => {
    const out = pickRandomOutfit(fullItems as any, { minItems: 1, maxItems: 5, requiredTags: ['winter'] });
    expect(out.every((item) => item.tags?.includes('winter'))).toBe(true);
  });

  test('filters by excluded tags', () => {
    const out = pickRandomOutfit(fullItems as any, { minItems: 1, maxItems: 5, excludedTags: ['summer'] });
    expect(out.every((item) => !item.tags?.includes('summer'))).toBe(true);
  });

  test('filters by weather condition: hot', () => {
    const out = pickRandomOutfit(fullItems as any, { minItems: 1, maxItems: 5, weatherCondition: 'hot' });
    // Expect no jackets, coats, heavy sweaters, long sleeves, outerwear, mid layer
    expect(out.every(item =>
      !['jacket', 'coat', 'sweater', 'long sleeve'].some(tag => item.tags?.includes(tag)) &&
      !['outerwear', 'mid layer'].includes(item.category || '')
    )).toBe(true);
  });

  test('filters by weather condition: cold', () => {
    const out = pickRandomOutfit(fullItems as any, { minItems: 1, maxItems: 5, weatherCondition: 'cold' });
    // Expect jackets, coats, sweaters, outerwear, and no shorts/skirts
    expect(out.every(item =>
      (['jacket', 'coat', 'sweater', 'outerwear'].some(tag => item.tags?.includes(tag)) ||
       ['outerwear', 'mid layer'].includes(item.category || '')) &&
      !['shorts', 'skirt'].includes(item.category || '')
    )).toBe(true);
  });

  test('filters by combination of conditions (e.g., required category and weather)', () => {
    const out = pickRandomOutfit(fullItems as any, {
      minItems: 1,
      maxItems: 5,
      requiredCategories: ['bottom'],
      weatherCondition: 'hot',
    });
    expect(out.every(item => item.category === 'bottom' && item.name === 'Shorts')).toBe(true);
  });

  test('avoids duplicate categories using normalized categories (aliases)', () => {
    // Test with category aliases that should normalize to the same category
    const itemsWithAliases = [
      { id: 1, name: 'T-Shirt', category: 'shirt', hidden: false }, // normalizes to 'top'
      { id: 2, name: 'Blouse', category: 'blouse', hidden: false }, // normalizes to 'top'
      { id: 3, name: 'Jeans', category: 'jeans', hidden: false }, // normalizes to 'bottom'
      { id: 4, name: 'Pants', category: 'pants', hidden: false }, // normalizes to 'bottom'
      { id: 5, name: 'Shorts', category: 'shorts', hidden: false }, // normalizes to 'bottom'
      { id: 6, name: 'Sneakers', category: 'sneakers', hidden: false }, // normalizes to 'shoes'
      { id: 7, name: 'Boots', category: 'boots', hidden: false }, // normalizes to 'shoes'
      { id: 8, name: 'Jacket', category: 'jacket', hidden: false }, // normalizes to 'outerwear'
      { id: 9, name: 'Coat', category: 'coat', hidden: false }, // normalizes to 'outerwear'
    ];

    // Run multiple times to ensure consistency (randomness should still respect constraints)
    for (let i = 0; i < 10; i++) {
      const out = pickRandomOutfit(itemsWithAliases as any, {
        minItems: 3,
        maxItems: 6,
        avoidSameCategory: true
      });

      // Extract normalized categories
      const { normalizeCategory } = require('../app/constants');
      const normalizedCategories = out.map(item => normalizeCategory(item.category)).filter(Boolean);

      // Check that all normalized categories are unique
      const uniqueNormalized = new Set(normalizedCategories);
      expect(uniqueNormalized.size).toBe(normalizedCategories.length);

      // Verify no duplicate normalized categories
      expect(normalizedCategories.length).toBe(uniqueNormalized.size);
    }
  });

  test('does not generate outfits with multiple items from same normalized category', () => {
    // Create items that have different raw categories but same normalized category
    const itemsWithBottoms = [
      { id: 1, name: 'Blue Jeans', category: 'jeans', hidden: false },
      { id: 2, name: 'Black Pants', category: 'pants', hidden: false },
      { id: 3, name: 'Khaki Shorts', category: 'shorts', hidden: false },
      { id: 4, name: 'Gray Trousers', category: 'trousers', hidden: false },
      { id: 5, name: 'T-Shirt', category: 'top', hidden: false },
      { id: 6, name: 'Sneakers', category: 'shoes', hidden: false },
    ];

    const out = pickRandomOutfit(itemsWithBottoms as any, {
      minItems: 3,
      maxItems: 4,
      avoidSameCategory: true
    });

    // Count how many items normalize to 'bottom'
    const { normalizeCategory } = require('../app/constants');
    const bottomItems = out.filter(item => normalizeCategory(item.category) === 'bottom');

    // Should have at most 1 bottom item
    expect(bottomItems.length).toBeLessThanOrEqual(1);
  });
});
