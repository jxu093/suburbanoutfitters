import {
  CATEGORIES,
  normalizeCategory,
  getCategoryDisplayName,
  isListTag,
  getListDisplayName,
  createListTag,
  LIST_TAG_PREFIX,
  Category,
} from '../app/constants';

describe('CATEGORIES', () => {
  test('contains all expected categories', () => {
    expect(CATEGORIES).toContain('top');
    expect(CATEGORIES).toContain('bottom');
    expect(CATEGORIES).toContain('shoes');
    expect(CATEGORIES).toContain('outerwear');
    expect(CATEGORIES).toContain('hat');
    expect(CATEGORIES).toContain('accessory');
  });

  test('has exactly 6 categories', () => {
    expect(CATEGORIES.length).toBe(6);
  });
});

describe('normalizeCategory', () => {
  test('returns null for null/undefined input', () => {
    expect(normalizeCategory(null)).toBeNull();
    expect(normalizeCategory(undefined)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(normalizeCategory('')).toBeNull();
    expect(normalizeCategory('   ')).toBeNull();
  });

  test('returns direct match for valid categories', () => {
    expect(normalizeCategory('top')).toBe('top');
    expect(normalizeCategory('bottom')).toBe('bottom');
    expect(normalizeCategory('shoes')).toBe('shoes');
    expect(normalizeCategory('outerwear')).toBe('outerwear');
    expect(normalizeCategory('hat')).toBe('hat');
    expect(normalizeCategory('accessory')).toBe('accessory');
  });

  test('handles case insensitivity', () => {
    expect(normalizeCategory('TOP')).toBe('top');
    expect(normalizeCategory('Bottom')).toBe('bottom');
    expect(normalizeCategory('SHOES')).toBe('shoes');
  });

  test('handles whitespace trimming', () => {
    expect(normalizeCategory('  top  ')).toBe('top');
    expect(normalizeCategory('\tbottom\n')).toBe('bottom');
  });

  // Top aliases
  test('normalizes top aliases', () => {
    expect(normalizeCategory('shirt')).toBe('top');
    expect(normalizeCategory('t-shirt')).toBe('top');
    expect(normalizeCategory('tshirt')).toBe('top');
    expect(normalizeCategory('blouse')).toBe('top');
    expect(normalizeCategory('sweater')).toBe('top');
    expect(normalizeCategory('tank')).toBe('top');
    expect(normalizeCategory('tank top')).toBe('top');
    expect(normalizeCategory('polo')).toBe('top');
    expect(normalizeCategory('tee')).toBe('top');
  });

  // Bottom aliases
  test('normalizes bottom aliases', () => {
    expect(normalizeCategory('pants')).toBe('bottom');
    expect(normalizeCategory('jeans')).toBe('bottom');
    expect(normalizeCategory('shorts')).toBe('bottom');
    expect(normalizeCategory('skirt')).toBe('bottom');
    expect(normalizeCategory('trousers')).toBe('bottom');
    expect(normalizeCategory('leggings')).toBe('bottom');
  });

  // Outerwear aliases
  test('normalizes outerwear aliases', () => {
    expect(normalizeCategory('jacket')).toBe('outerwear');
    expect(normalizeCategory('coat')).toBe('outerwear');
    expect(normalizeCategory('hoodie')).toBe('outerwear');
    expect(normalizeCategory('blazer')).toBe('outerwear');
    expect(normalizeCategory('cardigan')).toBe('outerwear');
    expect(normalizeCategory('vest')).toBe('outerwear');
  });

  // Hat aliases
  test('normalizes hat aliases', () => {
    expect(normalizeCategory('cap')).toBe('hat');
    expect(normalizeCategory('beanie')).toBe('hat');
  });

  // Shoes aliases
  test('normalizes shoes aliases', () => {
    expect(normalizeCategory('sneakers')).toBe('shoes');
    expect(normalizeCategory('boots')).toBe('shoes');
    expect(normalizeCategory('sandals')).toBe('shoes');
    expect(normalizeCategory('heels')).toBe('shoes');
    expect(normalizeCategory('flats')).toBe('shoes');
    expect(normalizeCategory('loafers')).toBe('shoes');
  });

  // Accessory aliases
  test('normalizes accessory aliases', () => {
    expect(normalizeCategory('belt')).toBe('accessory');
    expect(normalizeCategory('watch')).toBe('accessory');
    expect(normalizeCategory('jewelry')).toBe('accessory');
    expect(normalizeCategory('bag')).toBe('accessory');
    expect(normalizeCategory('scarf')).toBe('accessory');
    expect(normalizeCategory('sunglasses')).toBe('accessory');
    expect(normalizeCategory('necklace')).toBe('accessory');
    expect(normalizeCategory('bracelet')).toBe('accessory');
    expect(normalizeCategory('earrings')).toBe('accessory');
  });

  test('returns null for unknown categories', () => {
    expect(normalizeCategory('random')).toBeNull();
    expect(normalizeCategory('unknown')).toBeNull();
    expect(normalizeCategory('xyz')).toBeNull();
  });
});

describe('getCategoryDisplayName', () => {
  test('capitalizes first letter of each category', () => {
    expect(getCategoryDisplayName('top')).toBe('Top');
    expect(getCategoryDisplayName('bottom')).toBe('Bottom');
    expect(getCategoryDisplayName('shoes')).toBe('Shoes');
    expect(getCategoryDisplayName('outerwear')).toBe('Outerwear');
    expect(getCategoryDisplayName('hat')).toBe('Hat');
    expect(getCategoryDisplayName('accessory')).toBe('Accessory');
  });
});

describe('list tag helpers', () => {
  test('isListTag identifies list tags correctly', () => {
    expect(isListTag('_list:favorites')).toBe(true);
    expect(isListTag('_list:summer')).toBe(true);
    expect(isListTag('casual')).toBe(false);
    expect(isListTag('list:notvalid')).toBe(false);
  });

  test('getListDisplayName extracts display name', () => {
    expect(getListDisplayName('_list:favorites')).toBe('favorites');
    expect(getListDisplayName('_list:summer-wear')).toBe('summer-wear');
    expect(getListDisplayName('casual')).toBe('casual'); // non-list tags return as-is
  });

  test('createListTag creates valid list tag', () => {
    expect(createListTag('Favorites')).toBe('_list:favorites');
    expect(createListTag('Summer Wear')).toBe('_list:summer-wear');
    expect(createListTag('Work Clothes')).toBe('_list:work-clothes');
  });
});
