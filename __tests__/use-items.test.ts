import { renderHook, act, waitFor } from '@testing-library/react';
import { useItems } from '../app/hooks/use-items';
import * as storage from '../app/services/storage';
import type { Item } from '../app/types';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: '/mock/image.jpg', width: 100, height: 100 }),
  SaveFormat: { JPEG: 'jpeg' },
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock expo-sqlite with a minimal in-memory implementation
jest.mock('expo-sqlite', () => ({
  openDatabase: () => ({
    transaction: (cb: (tx: any) => void) => {
      const tx = {
        executeSql: jest.fn((sql, args, success) => {
          // Simplified mock: always success with empty array or a mock insertId
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

describe('useItems hook', () => {
  let mockItems: Item[] = [];

  beforeEach(() => {
    mockItems = [
      { id: 1, name: 'T-Shirt', category: 'top', hidden: false, createdAt: Date.now() - 100000 },
      { id: 2, name: 'Jeans', category: 'bottom', hidden: false, createdAt: Date.now() - 50000 },
    ];

    // Mock storage functions
    jest.spyOn(storage, 'initDB').mockImplementation(async () => {
      return undefined;
    });
    jest.spyOn(storage, 'getItems').mockImplementation(async () => {
      return mockItems.map(item => ({...item, tags: item.tags ? JSON.stringify(item.tags) : null, hidden: item.hidden ? 1 : 0 })) as any;
    });
    jest.spyOn(storage, 'createItem').mockImplementation(async (item) => {
      const newItem = { ...item, id: mockItems.length + 1, createdAt: Date.now() };
      mockItems.push(newItem as any);
      return newItem.id;
    });
    jest.spyOn(storage, 'updateItem').mockImplementation(async (id, changes) => {
      const index = mockItems.findIndex(item => item.id === id);
      if (index !== -1) {
        mockItems[index] = { ...mockItems[index], ...changes as Item };
      }
    });
    jest.spyOn(storage, 'deleteItem').mockImplementation(async (id) => {
      mockItems = mockItems.filter(item => item.id !== id);
    });
    jest.spyOn(storage, 'setHiddenUntil').mockImplementation(async (id, ts) => {
      const index = mockItems.findIndex(item => item.id === id);
      if (index !== -1) {
        mockItems[index].hidden = !!ts;
        mockItems[index].hiddenUntil = ts;
      }
    });
    jest.spyOn(storage, 'unhideExpired').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('initializes DB and loads items on mount', async () => {
    const { result } = renderHook(() => useItems());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(storage.initDB).toHaveBeenCalledTimes(1);
    expect(storage.getItems).toHaveBeenCalledTimes(1);
    expect(result.current.items.length).toBe(mockItems.length);
    expect(result.current.items[0]).toMatchObject({
      id: mockItems[0].id,
      name: mockItems[0].name,
      category: mockItems[0].category,
    });
  });

  test('markAsWorn hides an item for 7 days and updates wornAt', async () => {
    const { result } = renderHook(() => useItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const itemId = mockItems[0].id!;
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);

    await act(async () => {
      await result.current.markAsWorn(itemId);
    });

    expect(storage.updateItem).toHaveBeenCalledWith(itemId,
      expect.objectContaining({
        wornAt: now,
        hidden: 1,
        hiddenUntil: now + (7 * 24 * 60 * 60 * 1000),
      })
    );

    const updatedItem = result.current.items.find((item: Item) => item.id === itemId);
    expect(updatedItem?.wornAt).toBe(now);
    expect(updatedItem?.hidden).toBe(true);
    expect(updatedItem?.hiddenUntil).toBe(now + (7 * 24 * 60 * 60 * 1000));
  });

  test('add function adds a new item and refreshes the list', async () => {
    const { result } = renderHook(() => useItems());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newItem: Item = { name: 'Socks', category: 'accessory', tags: ['footwear'] };

    let newId: number | null = null;
    await act(async () => {
      newId = await result.current.add(newItem);
    });

    expect(storage.createItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: newItem.name,
        category: newItem.category,
        tags: JSON.stringify(newItem.tags),
      })
    );
    expect(newId).not.toBeNull();
    // With optimistic updates, getItems is only called once on mount (not after add)
    expect(storage.getItems).toHaveBeenCalledTimes(1);
  });
});
