describe('storage.getItems / sqlite availability', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('throws a helpful error when expo-sqlite has no openDatabaseSync', async () => {
    // mock expo-sqlite with no openDatabaseSync
    jest.doMock('expo-sqlite', () => ({}));

    const storage = require('../app/services/storage');

    await expect(storage.getItems()).rejects.toThrow();
  });

  test('resolves when expo-sqlite provides openDatabaseSync', async () => {
    // mock expo-sqlite with a minimal openDatabaseSync implementation
    jest.doMock('expo-sqlite', () => ({
      openDatabaseSync: (name: string) => ({
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
        execAsync: jest.fn().mockResolvedValue(undefined),
      }),
    }));

    const storage = require('../app/services/storage');

    await expect(storage.getItems()).resolves.toEqual([]);
  });
});
