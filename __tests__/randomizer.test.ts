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
    const cats = out.map((o) => o.category);
    const unique = new Set(cats);
    expect(unique.size).toBe(cats.length);
  });
});
