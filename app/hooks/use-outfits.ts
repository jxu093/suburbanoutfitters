import { useEffect, useState } from 'react';
import { createOutfit, deleteOutfit, getOutfits, initDB, updateOutfit } from '../services/storage';
import type { Outfit } from '../types';

function parseOutfits(rows: any[]): Outfit[] {
  return rows.map((r: any) => ({ ...r, itemIds: JSON.parse(r.itemIds) })) as Outfit[];
}

export function useOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const rows = await getOutfits();
      setOutfits(parseOutfits(rows));
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load outfits'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await initDB();
        const rows = await getOutfits();

        if (!cancelled) {
          setOutfits(parseOutfits(rows));
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

  async function add(outfit: Outfit) {
    const now = Date.now();
    const createdAt = outfit.createdAt ?? now;
    const id = await createOutfit({ ...outfit, itemIds: JSON.stringify(outfit.itemIds), createdAt });

    // Optimistically update local state instead of full refresh
    const newOutfit: Outfit = {
      ...outfit,
      id,
      createdAt,
    };
    setOutfits((prev) => [newOutfit, ...prev]);

    return id;
  }

  async function update(id: number, changes: Partial<Outfit>) {
    const dbChanges: any = { ...changes };
    if (changes.itemIds) dbChanges.itemIds = JSON.stringify(changes.itemIds);
    await updateOutfit(id, dbChanges);

    // Optimistically update local state instead of full refresh
    setOutfits((prev) =>
      prev.map((outfit) => (outfit.id === id ? { ...outfit, ...changes } : outfit))
    );
  }

  async function remove(id: number) {
    await deleteOutfit(id);

    // Optimistically update local state instead of full refresh
    setOutfits((prev) => prev.filter((o) => o.id !== id));
  }

  return { outfits, loading, error, refresh, add, update, remove };
}
