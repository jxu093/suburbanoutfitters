describe('storage.getItems / sqlite availability', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('throws a helpful error when expo-sqlite has no openDatabase', async () => {
    // mock expo-sqlite with no openDatabase or openDatabaseSync
    jest.doMock('expo-sqlite', () => ({ }));

    const storage = require('../app/services/storage');

    await expect(storage.getItems()).rejects.toThrow(
      /openDatabase is not available in this environment/i
    );
  });

  test('resolves when expo-sqlite provides openDatabase', async () => {
    // mock expo-sqlite with a minimal openDatabase implementation
    jest.doMock('expo-sqlite', () => ({
      openDatabase: (name: string) => ({
        transaction: (cb: (tx: any) => void) => {
          const tx = {
            executeSql: (_sql: string, _args: any[], success: (t: any, result: any) => void) => {
              success(tx, { rows: { _array: [] } });
            },
          };
          cb(tx);
        },
      }),
    }));

    const storage = require('../app/services/storage');

    await expect(storage.getItems()).resolves.toEqual([]);
  });
});
