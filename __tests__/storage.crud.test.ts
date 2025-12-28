describe('storage CRUD and hiddenUntil behavior', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('create, read, update, delete item flow with in-memory mock', async () => {
    // In-memory rows store
    const rows: any[] = [];
    let nextId = 1;

    // Create mock database with new SDK 54 API
    jest.doMock('expo-sqlite', () => ({
      openDatabaseSync: (name: string) => ({
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockImplementation(async (sql: string, args: any[] = []) => {
          const sqlTrim = sql.trim();

          if (/^INSERT INTO items/i.test(sqlTrim)) {
            const item: any = {
              id: nextId++,
              name: args[0],
              category: args[1],
              imageUri: args[2],
              thumbUri: args[3],
              notes: args[4],
              tags: args[5],
              createdAt: args[6],
              wornAt: args[7],
              hidden: args[8],
              hiddenUntil: args[9],
            };
            rows.unshift(item);
            return { lastInsertRowId: item.id };
          }

          if (/UPDATE items SET hidden = 0, hiddenUntil = NULL WHERE hiddenUntil IS NOT NULL/i.test(sqlTrim)) {
            const ts = args[0];
            for (const r of rows) {
              if (r.hiddenUntil != null && r.hiddenUntil <= ts) {
                r.hidden = 0;
                r.hiddenUntil = null;
              }
            }
            return {};
          }

          if (/^UPDATE items SET/i.test(sqlTrim)) {
            const id = args[args.length - 1];
            const target = rows.find((r) => r.id === id);
            if (target) {
              const setPart = sqlTrim.match(/UPDATE items SET (.*) WHERE/i)?.[1] ?? '';
              const fields = setPart.split(',').map((s) => s.split('=')[0].trim());
              fields.forEach((f, i) => {
                target[f] = args[i];
              });
            }
            return {};
          }

          if (/^DELETE FROM items WHERE id = \?/i.test(sqlTrim)) {
            const id = args[0];
            const idx = rows.findIndex((r) => r.id === id);
            if (idx !== -1) rows.splice(idx, 1);
            return {};
          }

          return {};
        }),
        getAllAsync: jest.fn().mockImplementation(async (sql: string) => {
          if (/^SELECT \* FROM items ORDER BY createdAt DESC/i.test(sql.trim())) {
            return rows.slice();
          }
          return [];
        }),
        getFirstAsync: jest.fn().mockImplementation(async (sql: string, args: any[] = []) => {
          if (/^SELECT \* FROM items WHERE id = \?/i.test(sql.trim())) {
            const id = args[0];
            return rows.find((r) => r.id === id) ?? null;
          }
          return null;
        }),
      }),
    }));

    const storage = require('../app/services/storage');

    // initDB should run and not throw
    await expect(storage.initDB()).resolves.not.toThrow();

    // create item
    const id = await storage.createItem({ name: 'Jacket' } as any);
    expect(typeof id).toBe('number');

    // get items
    const items = await storage.getItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].name).toBe('Jacket');

    // get item by id
    const item = await storage.getItemById(id);
    expect(item).not.toBeNull();
    expect(item!.name).toBe('Jacket');

    // update item
    await storage.updateItem(id, { name: 'Rain Jacket' });
    const updated = await storage.getItemById(id);
    expect(updated!.name).toBe('Rain Jacket');

    // hide until (in the past) using setHiddenUntil and ensure unhideExpired will clear it
    const past = Date.now() - 24 * 60 * 60 * 1000;
    await storage.setHiddenUntil(id, past);
    // call unhideExpired to clear it
    await storage.unhideExpired();
    const post = await storage.getItemById(id);
    expect(post).not.toBeNull();
    // hiddenUntil should have been cleared by unhideExpired
    expect(post!.hiddenUntil).toBeNull();

    // delete
    await storage.deleteItem(id);
    const after = await storage.getItemById(id);
    expect(after).toBeNull();
  });
});
