import type { Item } from '@/types';

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

/**
 * Validates and returns a valid image URI or undefined.
 * Filters out invalid URIs that contain text like "Asset not found" or other non-path strings.
 */
export function getValidImageUri(uri: string | null | undefined): string | undefined {
  if (!uri) return undefined;
  // A valid URI should start with a path or URL scheme
  if (uri.startsWith('/') || uri.startsWith('file://') || uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('asset://')) {
    return uri;
  }
  // Invalid URI (likely contains error text like "Asset not found")
  return undefined;
}

/**
 * Gets the best available image URI for an item (thumbnail preferred).
 * Returns undefined if no valid image is available.
 */
export function getItemImageUri(item: { thumbUri?: string | null; imageUri?: string | null }): string | undefined {
  return getValidImageUri(item.thumbUri) ?? getValidImageUri(item.imageUri);
}
