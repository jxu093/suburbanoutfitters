describe('outfits storage simple CRUD', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('create and get outfits with in-memory sqlite', async () => {
    const rows: any[] = [];
    let nextId = 1;

    jest.doMock('expo-sqlite', () => ({
      openDatabase: (name: string) => ({
        transaction: (cb: (tx: any) => void) => {
          const tx = {
            executeSql: (sql: string, args: any[] = [], success?: (t: any, res: any) => void) => {
              const s = sql.trim();
              if (/^CREATE TABLE/i.test(s)) { success?.(tx, { rows: { _array: [] } }); return; }
              if (/^PRAGMA table_info\(outfits\)/i.test(s)) { success?.(tx, { rows: { _array: [] } }); return; }
              if (/^INSERT INTO outfits/i.test(s)) {
                const row = { id: nextId++, name: args[0], itemIds: args[1], notes: args[2], createdAt: args[3] };
                rows.unshift(row);
                success?.(tx, { insertId: row.id });
                return;
              }
              if (/^SELECT \* FROM outfits/i.test(s)) { success?.(tx, { rows: { _array: rows.slice() } }); return; }
              if (/^SELECT \* FROM outfits WHERE id = \?/i.test(s)) { const id = args[0]; const found = rows.find(r => r.id === id); success?.(tx, { rows: { _array: found ? [found] : [] } }); return; }
              if (/^UPDATE outfits SET/i.test(s)) { const id = args[args.length - 1]; const target = rows.find(r => r.id === id); if (target) {
                const setPart = s.match(/UPDATE outfits SET (.*) WHERE/i)?.[1] ?? '';
                const fields = setPart.split(',').map(f => f.split('=')[0].trim());
                fields.forEach((f, i) => { target[f] = args[i]; });
              } success?.(tx, { rows: { _array: [] } }); return; }
              if (/^DELETE FROM outfits WHERE id = \?/i.test(s)) { const id = args[0]; const idx = rows.findIndex(r => r.id === id); if (idx!==-1) rows.splice(idx,1); success?.(tx, { rows: { _array: [] } }); return; }
              success?.(tx, { rows: { _array: [] } });
            }
          };
          cb(tx);
        }
      })
    }));

    const storage = require('../app/services/storage');

    const id = await storage.createOutfit({ name: 'Test Outfit', itemIds: JSON.stringify([1,2]) } as any);
    expect(typeof id).toBe('number');

    let outfits = await storage.getOutfits();
    expect(outfits.length).toBe(1);
    expect(outfits[0].name).toBe('Test Outfit');

    // update outfit
    await storage.updateOutfit(id, { name: 'Updated Outfit', itemIds: JSON.stringify([2,3]) });
    outfits = await storage.getOutfits();
    expect(outfits[0].name).toBe('Updated Outfit');
    expect(JSON.parse(outfits[0].itemIds)).toEqual([2,3]);

    await storage.deleteOutfit(id);
    const after = await storage.getOutfits();
    expect(after.length).toBe(0);
  });
});