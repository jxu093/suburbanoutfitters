import { useItemsContext } from '../contexts/items-context';

// Re-export the context hook for backwards compatibility
export function useItems() {
  return useItemsContext();
}
