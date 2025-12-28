import { useEffect, useState } from 'react';
import { createItem, getItems, initDB, updateItem, deleteItem } from '../services/storage';
import type { Item } from '../types';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const rows = await getItems();
    // Convert DB rows to Item shape (parse tags and booleans)
    const now = Date.now();
    const normalized = rows.map((r: any) => {
      const hiddenUntil = r.hiddenUntil ?? null;
      const isHidden = !!r.hidden || (hiddenUntil && hiddenUntil > now);
      return {
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : null,
        hidden: isHidden,
        hiddenUntil: hiddenUntil,
      };
    }) as Item[];

    setItems(normalized);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await initDB();
      const rows = await getItems();

      if (!cancelled) {
        const now = Date.now();
        const normalized = rows.map((r: any) => {
          const hiddenUntil = r.hiddenUntil ?? null;
          const isHidden = !!r.hidden || (hiddenUntil && hiddenUntil > now);
          return {
            ...r,
            tags: r.tags ? JSON.parse(r.tags) : null,
            hidden: isHidden,
            hiddenUntil: hiddenUntil,
          };
        }) as Item[];

        setItems(normalized);
        setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  async function add(item: Item) {
    const dbRow: any = {
      ...item,
      tags: item.tags ? JSON.stringify(item.tags) : null,
      hidden: item.hidden ? 1 : 0,
    };

    const id = await createItem(dbRow);
    await refresh();
    return id;
  }

  async function update(id: number, changes: Partial<Item>) {
    const dbChanges: any = { ...changes };
    if (changes.tags) dbChanges.tags = JSON.stringify(changes.tags);
    if (typeof changes.hidden === 'boolean') dbChanges.hidden = changes.hidden ? 1 : 0;
    if ('hiddenUntil' in changes) dbChanges.hiddenUntil = (changes as any).hiddenUntil ?? null;
    await updateItem(id, dbChanges);
    await refresh();
  }

  async function remove(id: number) {
    await deleteItem(id);
    await refresh();
  }

  async function markAsWorn(id: number) {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const hideUntilTimestamp = Date.now() + SEVEN_DAYS_MS;
    await update(id, { wornAt: Date.now(), hidden: true, hiddenUntil: hideUntilTimestamp });
  }

  return { items, loading, refresh, add, update, remove, markAsWorn };
}
