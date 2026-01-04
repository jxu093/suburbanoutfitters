import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createItem, getItems, initDB, updateItem, deleteItem } from '../services/storage';
import { deleteImageFiles } from '../services/image-service';
import type { Item } from '../types';
import type { DBItemRow } from '../services/storage';
import { HIDE_DURATION_MS } from '../constants';

// Convert DB rows to Item shape (parse tags and compute hidden state)
function normalizeItems(rows: DBItemRow[]): Item[] {
  const now = Date.now();
  return rows.map((r) => {
    const hiddenUntil = r.hiddenUntil ?? null;
    const isHidden = !!r.hidden || (hiddenUntil !== null && hiddenUntil > now);
    return {
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : null,
      hidden: isHidden,
      hiddenUntil: hiddenUntil,
    };
  }) as Item[];
}

interface ItemsContextValue {
  items: Item[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  add: (item: Item) => Promise<number>;
  update: (id: number, changes: Partial<Item>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  markAsWorn: (id: number) => Promise<void>;
}

const ItemsContext = createContext<ItemsContextValue | null>(null);

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await getItems();
      setItems(normalizeItems(rows));
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load items'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await initDB();
        const rows = await getItems();

        if (!cancelled) {
          setItems(normalizeItems(rows));
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Failed to initialize'));
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(async (item: Item) => {
    const now = Date.now();
    const dbRow: any = {
      ...item,
      tags: item.tags ? JSON.stringify(item.tags) : null,
      hidden: item.hidden ? 1 : 0,
      createdAt: item.createdAt ?? now,
    };

    const id = await createItem(dbRow);

    // Optimistically update local state instead of full refresh
    const newItem: Item = {
      ...item,
      id,
      createdAt: dbRow.createdAt,
      hidden: !!item.hidden,
    };
    setItems((prev) => [newItem, ...prev]);

    return id;
  }, []);

  const update = useCallback(async (id: number, changes: Partial<Item>) => {
    const dbChanges: any = { ...changes };
    if (changes.tags) dbChanges.tags = JSON.stringify(changes.tags);
    if (typeof changes.hidden === 'boolean') dbChanges.hidden = changes.hidden ? 1 : 0;
    if ('hiddenUntil' in changes) dbChanges.hiddenUntil = (changes as any).hiddenUntil ?? null;
    await updateItem(id, dbChanges);

    // Optimistically update local state instead of full refresh
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...changes };
        // Recompute hidden state if hiddenUntil changed
        if ('hiddenUntil' in changes) {
          const hiddenUntil = changes.hiddenUntil ?? null;
          updated.hidden = !!changes.hidden || (hiddenUntil !== null && hiddenUntil > Date.now());
        }
        return updated;
      })
    );
  }, []);

  const remove = useCallback(async (id: number) => {
    // Find the item to get its image URIs before deleting
    const item = items.find((i) => i.id === id);
    if (item) {
      await deleteImageFiles(item.imageUri, item.thumbUri);
    }
    await deleteItem(id);

    // Optimistically update local state instead of full refresh
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, [items]);

  const markAsWorn = useCallback(async (id: number) => {
    const hideUntilTimestamp = Date.now() + HIDE_DURATION_MS.SEVEN_DAYS;
    await update(id, { wornAt: Date.now(), hidden: true, hiddenUntil: hideUntilTimestamp });
  }, [update]);

  const value: ItemsContextValue = {
    items,
    loading,
    error,
    refresh,
    add,
    update,
    remove,
    markAsWorn,
  };

  return (
    <ItemsContext.Provider value={value}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItemsContext() {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItemsContext must be used within an ItemsProvider');
  }
  return context;
}
