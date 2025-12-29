import { categorizeItems, SilhouetteSlot } from '../app/utils/outfit-categorization';
import type { Item } from '../app/types';

// Helper to create test items
function createItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    name: 'Test Item',
    imageUri: 'test.jpg',
    category: null,
    tags: [],
    ...overrides,
  };
}

describe('categorizeItems', () => {
  test('returns empty slots when no items provided', () => {
    const result = categorizeItems([]);
    expect(result.hat).toEqual([]);
    expect(result.outerwear).toEqual([]);
    expect(result.top).toEqual([]);
    expect(result.bottom).toEqual([]);
    expect(result.shoes).toEqual([]);
    expect(result.accessory).toEqual([]);
  });

  test('categorizes items with direct category match', () => {
    const items: Item[] = [
      createItem({ id: 1, category: 'top', name: 'Shirt' }),
      createItem({ id: 2, category: 'bottom', name: 'Pants' }),
      createItem({ id: 3, category: 'shoes', name: 'Sneakers' }),
      createItem({ id: 4, category: 'hat', name: 'Cap' }),
      createItem({ id: 5, category: 'outerwear', name: 'Jacket' }),
      createItem({ id: 6, category: 'accessory', name: 'Watch' }),
    ];

    const result = categorizeItems(items);

    expect(result.top.length).toBe(1);
    expect(result.top[0].name).toBe('Shirt');
    expect(result.bottom.length).toBe(1);
    expect(result.bottom[0].name).toBe('Pants');
    expect(result.shoes.length).toBe(1);
    expect(result.shoes[0].name).toBe('Sneakers');
    expect(result.hat.length).toBe(1);
    expect(result.hat[0].name).toBe('Cap');
    expect(result.outerwear.length).toBe(1);
    expect(result.outerwear[0].name).toBe('Jacket');
    expect(result.accessory.length).toBe(1);
    expect(result.accessory[0].name).toBe('Watch');
  });

  test('handles case-insensitive category matching', () => {
    const items: Item[] = [
      createItem({ id: 1, category: 'TOP', name: 'Shirt' }),
      createItem({ id: 2, category: 'Bottom', name: 'Pants' }),
      createItem({ id: 3, category: 'SHOES', name: 'Sneakers' }),
    ];

    const result = categorizeItems(items);

    expect(result.top.length).toBe(1);
    expect(result.bottom.length).toBe(1);
    expect(result.shoes.length).toBe(1);
  });

  test('normalizes aliases to correct slots', () => {
    const items: Item[] = [
      createItem({ id: 1, category: 'shirt', name: 'T-Shirt' }),
      createItem({ id: 2, category: 'jeans', name: 'Blue Jeans' }),
      createItem({ id: 3, category: 'sneakers', name: 'Nike Sneakers' }),
      createItem({ id: 4, category: 'jacket', name: 'Leather Jacket' }),
      createItem({ id: 5, category: 'cap', name: 'Baseball Cap' }),
      createItem({ id: 6, category: 'belt', name: 'Leather Belt' }),
    ];

    const result = categorizeItems(items);

    expect(result.top.length).toBe(1);
    expect(result.top[0].name).toBe('T-Shirt');
    expect(result.bottom.length).toBe(1);
    expect(result.bottom[0].name).toBe('Blue Jeans');
    expect(result.shoes.length).toBe(1);
    expect(result.shoes[0].name).toBe('Nike Sneakers');
    expect(result.outerwear.length).toBe(1);
    expect(result.outerwear[0].name).toBe('Leather Jacket');
    expect(result.hat.length).toBe(1);
    expect(result.hat[0].name).toBe('Baseball Cap');
    expect(result.accessory.length).toBe(1);
    expect(result.accessory[0].name).toBe('Leather Belt');
  });

  test('places uncategorized items in accessory slot', () => {
    const items: Item[] = [
      createItem({ id: 1, category: null, name: 'Unknown 1' }),
      createItem({ id: 2, category: undefined, name: 'Unknown 2' }),
      createItem({ id: 3, category: 'random-category', name: 'Random Item' }),
      createItem({ id: 4, category: 'xyz', name: 'XYZ Item' }),
    ];

    const result = categorizeItems(items);

    expect(result.accessory.length).toBe(4);
    expect(result.top.length).toBe(0);
    expect(result.bottom.length).toBe(0);
    expect(result.shoes.length).toBe(0);
    expect(result.hat.length).toBe(0);
    expect(result.outerwear.length).toBe(0);
  });

  test('handles multiple items in same category', () => {
    const items: Item[] = [
      createItem({ id: 1, category: 'top', name: 'Shirt 1' }),
      createItem({ id: 2, category: 'top', name: 'Shirt 2' }),
      createItem({ id: 3, category: 'shirt', name: 'Shirt 3' }), // alias
      createItem({ id: 4, category: 'bottom', name: 'Pants 1' }),
      createItem({ id: 5, category: 'jeans', name: 'Pants 2' }), // alias
    ];

    const result = categorizeItems(items);

    expect(result.top.length).toBe(3);
    expect(result.bottom.length).toBe(2);
  });

  test('preserves item order within each slot', () => {
    const items: Item[] = [
      createItem({ id: 1, category: 'top', name: 'A' }),
      createItem({ id: 2, category: 'top', name: 'B' }),
      createItem({ id: 3, category: 'top', name: 'C' }),
    ];

    const result = categorizeItems(items);

    expect(result.top[0].name).toBe('A');
    expect(result.top[1].name).toBe('B');
    expect(result.top[2].name).toBe('C');
  });

  test('handles mixed categorized and uncategorized items', () => {
    const items: Item[] = [
      createItem({ id: 1, category: 'top', name: 'Shirt' }),
      createItem({ id: 2, category: null, name: 'Unknown' }),
      createItem({ id: 3, category: 'bottom', name: 'Pants' }),
      createItem({ id: 4, category: 'misc', name: 'Misc Item' }),
      createItem({ id: 5, category: 'shoes', name: 'Sneakers' }),
    ];

    const result = categorizeItems(items);

    expect(result.top.length).toBe(1);
    expect(result.bottom.length).toBe(1);
    expect(result.shoes.length).toBe(1);
    expect(result.accessory.length).toBe(2); // Unknown + Misc Item
  });

  test('all slots are present in result even when empty', () => {
    const items: Item[] = [
      createItem({ id: 1, category: 'top', name: 'Shirt' }),
    ];

    const result = categorizeItems(items);
    const expectedSlots: SilhouetteSlot[] = ['hat', 'outerwear', 'top', 'bottom', 'shoes', 'accessory'];

    expectedSlots.forEach((slot) => {
      expect(result).toHaveProperty(slot);
      expect(Array.isArray(result[slot])).toBe(true);
    });
  });
});
