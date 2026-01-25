/**
 * Color matching utilities for outfit generation
 * Uses tag-based color detection and color theory rules
 */

// Standard color names that can be detected from item tags/names
export const COLOR_NAMES = [
  'black', 'white', 'gray', 'grey', 'navy', 'blue', 'red', 'green',
  'yellow', 'orange', 'purple', 'pink', 'brown', 'beige', 'tan',
  'cream', 'ivory', 'burgundy', 'maroon', 'olive', 'teal', 'coral',
  'gold', 'silver', 'khaki', 'denim', 'charcoal', 'indigo'
] as const;

export type ColorName = typeof COLOR_NAMES[number];

// Color groups for matching
export const COLOR_GROUPS = {
  neutrals: ['black', 'white', 'gray', 'grey', 'beige', 'tan', 'cream', 'ivory', 'khaki', 'charcoal'],
  warm: ['red', 'orange', 'yellow', 'coral', 'gold', 'burgundy', 'maroon', 'brown'],
  cool: ['blue', 'navy', 'green', 'purple', 'teal', 'indigo', 'silver'],
  earth: ['brown', 'olive', 'tan', 'khaki', 'beige', 'burgundy', 'maroon'],
  denim: ['denim', 'indigo', 'navy', 'blue'],
} as const;

// Colors that go well together (complementary/harmonious pairings)
const COLOR_HARMONIES: Record<string, string[]> = {
  black: ['white', 'gray', 'red', 'pink', 'yellow', 'gold', 'silver', 'navy', 'beige', 'cream'],
  white: ['black', 'navy', 'blue', 'red', 'gray', 'beige', 'tan', 'brown', 'olive', 'pink'],
  gray: ['black', 'white', 'pink', 'blue', 'navy', 'red', 'yellow', 'purple'],
  grey: ['black', 'white', 'pink', 'blue', 'navy', 'red', 'yellow', 'purple'],
  navy: ['white', 'cream', 'beige', 'tan', 'khaki', 'gray', 'pink', 'coral', 'gold'],
  blue: ['white', 'gray', 'navy', 'tan', 'brown', 'orange', 'coral', 'beige'],
  red: ['black', 'white', 'gray', 'navy', 'denim', 'beige', 'tan'],
  green: ['white', 'cream', 'brown', 'tan', 'beige', 'navy', 'khaki', 'gold'],
  yellow: ['navy', 'blue', 'gray', 'white', 'black', 'brown', 'denim'],
  orange: ['navy', 'blue', 'white', 'brown', 'tan', 'denim', 'cream'],
  purple: ['white', 'gray', 'black', 'cream', 'silver', 'gold', 'navy'],
  pink: ['white', 'gray', 'navy', 'black', 'cream', 'denim', 'silver'],
  brown: ['white', 'cream', 'beige', 'tan', 'blue', 'navy', 'green', 'orange'],
  beige: ['navy', 'brown', 'white', 'burgundy', 'olive', 'blue', 'black'],
  tan: ['navy', 'white', 'brown', 'burgundy', 'olive', 'blue', 'green'],
  cream: ['navy', 'brown', 'burgundy', 'olive', 'blue', 'black', 'green'],
  ivory: ['navy', 'brown', 'burgundy', 'olive', 'black', 'gold'],
  burgundy: ['white', 'cream', 'beige', 'tan', 'navy', 'gray', 'khaki'],
  maroon: ['white', 'cream', 'beige', 'tan', 'navy', 'gray', 'khaki'],
  olive: ['white', 'cream', 'tan', 'beige', 'brown', 'burgundy', 'navy'],
  teal: ['white', 'cream', 'coral', 'tan', 'navy', 'gray', 'beige'],
  coral: ['navy', 'white', 'teal', 'cream', 'gray', 'beige', 'denim'],
  gold: ['black', 'navy', 'burgundy', 'white', 'cream', 'brown'],
  silver: ['black', 'white', 'gray', 'navy', 'purple', 'pink'],
  khaki: ['navy', 'white', 'brown', 'burgundy', 'olive', 'blue', 'black'],
  denim: ['white', 'black', 'cream', 'tan', 'brown', 'red', 'yellow', 'pink', 'burgundy'],
  charcoal: ['white', 'pink', 'blue', 'cream', 'silver', 'gold', 'coral'],
  indigo: ['white', 'cream', 'tan', 'coral', 'gold', 'beige'],
};

/**
 * Extract colors from item tags and name
 */
export function extractColors(item: { name?: string; tags?: string[] }): ColorName[] {
  const colors: ColorName[] = [];
  const searchText = [
    item.name?.toLowerCase() || '',
    ...(item.tags?.map(t => t.toLowerCase()) || [])
  ].join(' ');

  for (const color of COLOR_NAMES) {
    if (searchText.includes(color)) {
      colors.push(color);
    }
  }

  return colors;
}

/**
 * Check if two colors are harmonious (match well together)
 */
export function areColorsHarmonious(color1: ColorName, color2: ColorName): boolean {
  // Handle gray/grey variants first
  const c1 = color1 === 'grey' ? 'gray' : color1;
  const c2 = color2 === 'grey' ? 'gray' : color2;

  // Same color always matches (after normalization)
  if (c1 === c2) return true;

  // Check if either color lists the other as harmonious
  const harmonies1 = COLOR_HARMONIES[c1] || [];
  const harmonies2 = COLOR_HARMONIES[c2] || [];

  return harmonies1.includes(c2) || harmonies2.includes(c1);
}

/**
 * Check if a color is neutral (goes with most things)
 */
export function isNeutralColor(color: ColorName): boolean {
  return COLOR_GROUPS.neutrals.includes(color as any);
}

/**
 * Calculate color compatibility score between two items (0-1)
 * Returns 1 if no colors detected (neutral compatibility)
 */
export function calculateColorCompatibility(
  item1: { name?: string; tags?: string[] },
  item2: { name?: string; tags?: string[] }
): number {
  const colors1 = extractColors(item1);
  const colors2 = extractColors(item2);

  // If either item has no detectable colors, assume neutral/compatible
  if (colors1.length === 0 || colors2.length === 0) {
    return 1;
  }

  // If both have only neutral colors, they're compatible
  const allNeutral1 = colors1.every(isNeutralColor);
  const allNeutral2 = colors2.every(isNeutralColor);
  if (allNeutral1 && allNeutral2) {
    return 1;
  }

  // Check pairwise color compatibility
  let matchCount = 0;
  let totalPairs = 0;

  for (const c1 of colors1) {
    for (const c2 of colors2) {
      totalPairs++;
      if (areColorsHarmonious(c1, c2)) {
        matchCount++;
      }
    }
  }

  return totalPairs > 0 ? matchCount / totalPairs : 1;
}

/**
 * Calculate overall outfit color harmony score (0-1)
 */
export function calculateOutfitColorHarmony(items: { name?: string; tags?: string[] }[]): number {
  if (items.length < 2) return 1;

  let totalScore = 0;
  let pairCount = 0;

  // Check all pairs of items
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      totalScore += calculateColorCompatibility(items[i], items[j]);
      pairCount++;
    }
  }

  return pairCount > 0 ? totalScore / pairCount : 1;
}

/**
 * Filter items to find those color-compatible with existing selection
 */
export function filterColorCompatibleItems<T extends { name?: string; tags?: string[] }>(
  candidates: T[],
  existingItems: { name?: string; tags?: string[] }[],
  minCompatibility: number = 0.5
): T[] {
  if (existingItems.length === 0) return candidates;

  return candidates.filter(candidate => {
    const avgCompatibility = existingItems.reduce((sum, existing) =>
      sum + calculateColorCompatibility(candidate, existing), 0
    ) / existingItems.length;

    return avgCompatibility >= minCompatibility;
  });
}
