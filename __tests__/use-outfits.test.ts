import { renderHook, act, waitFor } from '@testing-library/react';
import { useOutfits } from '../app/hooks/use-outfits';
import * as storage from '../app/services/storage';
import type { Outfit } from '../app/types';

// Mock expo-sqlite with a minimal in-memory implementation
jest.mock('expo-sqlite', () => ({
  openDatabase: () => ({
    transaction: (cb: (tx: any) => void) => {
      const tx = {
        executeSql: jest.fn((sql, args, success) => {
          if (sql.startsWith('INSERT')) {
            success(tx, { insertId: 1 });
          } else {
            success(tx, { rows: { _array: [] } });
          }
        }),
      };
      cb(tx);
    },
  }),
}));

describe('useOutfits hook', () => {
  let mockOutfits: Outfit[] = [];

  beforeEach(() => {
    mockOutfits = [
      { id: 1, name: 'Summer Casual', itemIds: [1, 2], notes: 'Beach day outfit', createdAt: Date.now() - 100000 },
      { id: 2, name: 'Work Formal', itemIds: [3, 4, 5], notes: 'Office meeting', createdAt: Date.now() - 50000 },
    ];

    // Mock storage functions
    jest.spyOn(storage, 'initDB').mockResolvedValue(undefined);
    jest.spyOn(storage, 'getOutfits').mockImplementation(async () => {
      return mockOutfits.map((outfit) => ({
        ...outfit,
        itemIds: JSON.stringify(outfit.itemIds),
      })) as any;
    });
    jest.spyOn(storage, 'createOutfit').mockImplementation(async (outfit) => {
      const newOutfit = { ...outfit, id: mockOutfits.length + 1 };
      mockOutfits.push({
        ...newOutfit,
        itemIds: JSON.parse(newOutfit.itemIds),
      } as Outfit);
      return newOutfit.id;
    });
    jest.spyOn(storage, 'updateOutfit').mockImplementation(async (id, changes) => {
      const index = mockOutfits.findIndex((o) => o.id === id);
      if (index !== -1) {
        const parsed = changes.itemIds ? { ...changes, itemIds: JSON.parse(changes.itemIds) } : changes;
        mockOutfits[index] = { ...mockOutfits[index], ...parsed };
      }
    });
    jest.spyOn(storage, 'deleteOutfit').mockImplementation(async (id) => {
      mockOutfits = mockOutfits.filter((o) => o.id !== id);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('initializes DB and loads outfits on mount', async () => {
    const { result } = renderHook(() => useOutfits());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(storage.initDB).toHaveBeenCalledTimes(1);
    expect(storage.getOutfits).toHaveBeenCalledTimes(1);
    expect(result.current.outfits.length).toBe(mockOutfits.length);
    expect(result.current.outfits[0]).toMatchObject({
      id: mockOutfits[0].id,
      name: mockOutfits[0].name,
      itemIds: mockOutfits[0].itemIds,
    });
  });

  test('add function adds a new outfit', async () => {
    const { result } = renderHook(() => useOutfits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newOutfit: Outfit = { name: 'Weekend Fun', itemIds: [1, 3], notes: 'Casual weekend' };

    let newId: number | null = null;
    await act(async () => {
      newId = await result.current.add(newOutfit);
    });

    expect(storage.createOutfit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: newOutfit.name,
        itemIds: JSON.stringify(newOutfit.itemIds),
        notes: newOutfit.notes,
      })
    );
    expect(newId).not.toBeNull();
    // With optimistic updates, getOutfits is only called once on mount
    expect(storage.getOutfits).toHaveBeenCalledTimes(1);
  });

  test('update function updates an outfit', async () => {
    const { result } = renderHook(() => useOutfits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const outfitId = mockOutfits[0].id!;
    const changes = { name: 'Updated Summer Casual', notes: 'Updated notes' };

    await act(async () => {
      await result.current.update(outfitId, changes);
    });

    expect(storage.updateOutfit).toHaveBeenCalledWith(outfitId, expect.objectContaining(changes));

    // Check optimistic update worked
    const updated = result.current.outfits.find((o) => o.id === outfitId);
    expect(updated?.name).toBe(changes.name);
    expect(updated?.notes).toBe(changes.notes);
  });

  test('update function handles itemIds correctly', async () => {
    const { result } = renderHook(() => useOutfits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const outfitId = mockOutfits[0].id!;
    const newItemIds = [10, 20, 30];

    await act(async () => {
      await result.current.update(outfitId, { itemIds: newItemIds });
    });

    expect(storage.updateOutfit).toHaveBeenCalledWith(
      outfitId,
      expect.objectContaining({
        itemIds: JSON.stringify(newItemIds),
      })
    );

    const updated = result.current.outfits.find((o) => o.id === outfitId);
    expect(updated?.itemIds).toEqual(newItemIds);
  });

  test('remove function deletes an outfit', async () => {
    const { result } = renderHook(() => useOutfits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCount = result.current.outfits.length;
    const outfitId = mockOutfits[0].id!;

    await act(async () => {
      await result.current.remove(outfitId);
    });

    expect(storage.deleteOutfit).toHaveBeenCalledWith(outfitId);
    expect(result.current.outfits.length).toBe(initialCount - 1);
    expect(result.current.outfits.find((o) => o.id === outfitId)).toBeUndefined();
  });

  test('refresh function reloads outfits from database', async () => {
    const { result } = renderHook(() => useOutfits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial load
    expect(storage.getOutfits).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    // After refresh
    expect(storage.getOutfits).toHaveBeenCalledTimes(2);
  });

  test('error state is set when initialization fails', async () => {
    jest.spyOn(storage, 'initDB').mockRejectedValue(new Error('DB init failed'));

    const { result } = renderHook(() => useOutfits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('DB init failed');
  });
});
