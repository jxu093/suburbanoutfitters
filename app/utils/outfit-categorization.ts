import { normalizeCategory, type Category } from '../constants';
import type { Item } from '../types';

export type SilhouetteSlot = 'hat' | 'outerwear' | 'top' | 'bottom' | 'shoes' | 'accessory';

export function categorizeItems(items: Item[]): Record<SilhouetteSlot, Item[]> {
  const slots: Record<SilhouetteSlot, Item[]> = {
    hat: [],
    outerwear: [],
    top: [],
    bottom: [],
    shoes: [],
    accessory: [],
  };

  items.forEach((item) => {
    // Try to match category directly or via normalization
    const cat = item.category?.toLowerCase() as Category | undefined;
    const normalized = cat && (cat in slots ? cat : normalizeCategory(item.category));

    if (normalized && normalized in slots) {
      slots[normalized as SilhouetteSlot].push(item);
    } else {
      // Default uncategorized to accessory
      slots.accessory.push(item);
    }
  });

  return slots;
}
