import { useEffect, useState } from 'react';
import { createOutfit, deleteOutfit, getOutfits, initDB } from '../services/storage';
import type { Outfit } from '../types';

export function useOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const rows = await getOutfits();
    const mapped = rows.map((r: any) => ({ ...r, itemIds: JSON.parse(r.itemIds) })) as Outfit[];
    setOutfits(mapped);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await initDB();
      await refresh();
    })();
  }, []);

  async function add(outfit: Outfit) {
    const id = await createOutfit({ ...outfit, itemIds: JSON.stringify(outfit.itemIds), createdAt: outfit.createdAt });
    await refresh();
    return id;
  }

  async function update(id: number, changes: Partial<Outfit>) {
    const dbChanges: any = { ...changes };
    if (changes.itemIds) dbChanges.itemIds = JSON.stringify(changes.itemIds);
    await updateOutfit(id, dbChanges);
    await refresh();
  }

  async function remove(id: number) {
    await deleteOutfit(id);
    await refresh();
  }

  return { outfits, loading, refresh, add, update, remove };
}
