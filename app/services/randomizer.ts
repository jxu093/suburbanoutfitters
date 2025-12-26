import type { Item } from '../types';

export type RandomizeOptions = {
  minItems?: number;
  maxItems?: number;
  avoidSameCategory?: boolean;
};

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
  const { minItems = 2, maxItems = 4, avoidSameCategory = true } = opts;
  if (!items || items.length === 0) return [];

  const shuffled = shuffle(items);
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

  // If we couldn't meet target due to category constraints, fill from remaining
  if (chosen.length < target) {
    for (const it of shuffled) {
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
