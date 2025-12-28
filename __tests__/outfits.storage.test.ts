describe('outfits storage simple CRUD', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('create and get outfits with in-memory sqlite', async () => {
    const itemRows: any[] = [];
    const outfitRows: any[] = [];
    let nextOutfitId = 1;

    // Create mock database with new SDK 54 API
    jest.doMock('expo-sqlite', () => ({
      openDatabaseSync: () => ({
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockImplementation(async (sql: string, args: any[] = []) => {
          const s = sql.trim();

          if (/^INSERT INTO outfits/i.test(s)) {
            const row = { id: nextOutfitId++, name: args[0], itemIds: args[1], notes: args[2], createdAt: args[3] };
            outfitRows.unshift(row);
            return { lastInsertRowId: row.id };
          }

          if (/^UPDATE outfits SET/i.test(s)) {
            const id = args[args.length - 1];
            const target = outfitRows.find((r) => r.id === id);
            if (target) {
              const setPart = s.match(/UPDATE outfits SET (.*) WHERE/i)?.[1] ?? '';
              const fields = setPart.split(',').map((f) => f.split('=')[0].trim());
              fields.forEach((f, i) => {
                target[f] = args[i];
              });
            }
            return {};
          }

          if (/^DELETE FROM outfits WHERE id = \?/i.test(s)) {
            const id = args[0];
            const idx = outfitRows.findIndex((r) => r.id === id);
            if (idx !== -1) outfitRows.splice(idx, 1);
            return {};
          }

          // Handle items table operations (for unhideExpired called by getItems)
          if (/UPDATE items SET hidden = 0/i.test(s)) {
            return {};
          }

          return {};
        }),
        getAllAsync: jest.fn().mockImplementation(async (sql: string) => {
          const s = sql.trim();
          if (/^SELECT \* FROM outfits/i.test(s)) {
            return outfitRows.slice();
          }
          if (/^SELECT \* FROM items/i.test(s)) {
            return itemRows.slice();
          }
          return [];
        }),
        getFirstAsync: jest.fn().mockImplementation(async (sql: string, args: any[] = []) => {
          const s = sql.trim();
          if (/^SELECT \* FROM outfits WHERE id = \?/i.test(s)) {
            const id = args[0];
            return outfitRows.find((r) => r.id === id) ?? null;
          }
          return null;
        }),
      }),
    }));

    const storage = require('../app/services/storage');

    const id = await storage.createOutfit({ name: 'Test Outfit', itemIds: JSON.stringify([1, 2]) } as any);
    expect(typeof id).toBe('number');

    let outfits = await storage.getOutfits();
    expect(outfits.length).toBe(1);
    expect(outfits[0].name).toBe('Test Outfit');

    // update outfit
    await storage.updateOutfit(id, { name: 'Updated Outfit', itemIds: JSON.stringify([2, 3]) });
    outfits = await storage.getOutfits();
    expect(outfits[0].name).toBe('Updated Outfit');
    expect(JSON.parse(outfits[0].itemIds)).toEqual([2, 3]);

    await storage.deleteOutfit(id);
    const after = await storage.getOutfits();
    expect(after.length).toBe(0);
  });
});
