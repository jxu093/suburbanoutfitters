import type { Item } from '../types';

/**
 * Determines if an item is currently hidden.
 * An item is hidden if:
 * - hidden flag is true, OR
 * - hiddenUntil is set and hasn't expired yet
 */
export function isItemHidden(item: Item): boolean {
  if (item.hidden) return true;
  if (item.hiddenUntil && item.hiddenUntil > Date.now()) return true;
  return false;
}

/**
 * Filters out hidden items from an array
 */
export function filterVisibleItems(items: Item[]): Item[] {
  return items.filter((item) => !isItemHidden(item));
}

/**
 * Filters to only hidden items from an array
 */
export function filterHiddenItems(items: Item[]): Item[] {
  return items.filter((item) => isItemHidden(item));
}
