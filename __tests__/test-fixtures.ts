import type { Item, Outfit } from '../app/types';

// Shared mock items for testing
export const mockItems: Item[] = [
  {
    id: 1,
    name: 'T-Shirt',
    category: 'top',
    tags: ['casual', 'summer'],
    hidden: false,
    createdAt: Date.now() - 100000,
    imageUri: '/mock/tshirt.jpg',
    thumbUri: '/mock/thumbs/tshirt.jpg',
  },
  {
    id: 2,
    name: 'Jeans',
    category: 'bottom',
    tags: ['casual', 'winter'],
    hidden: false,
    createdAt: Date.now() - 90000,
    imageUri: '/mock/jeans.jpg',
    thumbUri: '/mock/thumbs/jeans.jpg',
  },
  {
    id: 3,
    name: 'Jacket',
    category: 'outerwear',
    tags: ['cool', 'winter'],
    hidden: false,
    createdAt: Date.now() - 80000,
    imageUri: '/mock/jacket.jpg',
    thumbUri: '/mock/thumbs/jacket.jpg',
  },
  {
    id: 4,
    name: 'Hidden Top',
    category: 'top',
    tags: ['hidden'],
    hidden: true,
    createdAt: Date.now() - 70000,
  },
  {
    id: 5,
    name: 'Sneakers',
    category: 'shoes',
    tags: ['casual', 'sport'],
    hidden: false,
    createdAt: Date.now() - 60000,
  },
];

// Shared mock outfits for testing
export const mockOutfits: Outfit[] = [
  {
    id: 1,
    name: 'Summer Casual',
    itemIds: [1, 2, 5],
    notes: 'Perfect for a beach day',
    createdAt: Date.now() - 50000,
  },
  {
    id: 2,
    name: 'Work Formal',
    itemIds: [3, 2],
    notes: 'Office meeting outfit',
    createdAt: Date.now() - 40000,
  },
  {
    id: 3,
    name: 'Winter Walk',
    itemIds: [3, 2, 5],
    notes: 'For cold weather outings',
    createdAt: Date.now() - 30000,
  },
];

// Helper to create a copy of mock items (to avoid mutation between tests)
export function createMockItems(): Item[] {
  return mockItems.map((item) => ({ ...item, tags: item.tags ? [...item.tags] : null }));
}

// Helper to create a copy of mock outfits (to avoid mutation between tests)
export function createMockOutfits(): Outfit[] {
  return mockOutfits.map((outfit) => ({ ...outfit, itemIds: [...outfit.itemIds] }));
}

// Convert items to DB row format
export function itemsToDBRows(items: Item[]) {
  return items.map((item) => ({
    ...item,
    tags: item.tags ? JSON.stringify(item.tags) : null,
    hidden: item.hidden ? 1 : 0,
  }));
}

// Convert outfits to DB row format
export function outfitsToDBRows(outfits: Outfit[]) {
  return outfits.map((outfit) => ({
    ...outfit,
    itemIds: JSON.stringify(outfit.itemIds),
  }));
}

// Mock File class for expo-file-system
class MockFile {
  uri: string;
  exists: boolean = false;
  constructor(...uris: any[]) {
    this.uri = uris.map((u) => (typeof u === 'string' ? u : u.uri || '')).join('/');
  }
  copy() {}
  delete() {}
  create() {}
}

// Mock Directory class for expo-file-system
class MockDirectory {
  uri: string;
  exists: boolean = false;
  constructor(...uris: any[]) {
    this.uri = uris.map((u) => (typeof u === 'string' ? u : u.uri || '')).join('/');
  }
  create() {
    this.exists = true;
  }
  list() {
    return [];
  }
}

// Common expo module mocks
export const expoMocks = {
  fileSystem: {
    File: MockFile,
    Directory: MockDirectory,
    Paths: {
      document: new MockDirectory('/mock/documents'),
      cache: new MockDirectory('/mock/cache'),
      bundle: new MockDirectory('/mock/bundle'),
    },
  },
  imageManipulator: {
    ImageManipulator: {
      manipulate: jest.fn().mockReturnValue({
        resize: jest.fn().mockReturnValue({
          renderAsync: jest.fn().mockResolvedValue({
            saveAsync: jest.fn().mockResolvedValue({ uri: '/mock/image.jpg', width: 100, height: 100 }),
          }),
        }),
      }),
    },
    SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
  },
  imagePicker: {
    requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
    launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
  },
  sqlite: {
    openDatabaseSync: () => ({
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null),
      execAsync: jest.fn().mockResolvedValue(undefined),
    }),
  },
};
