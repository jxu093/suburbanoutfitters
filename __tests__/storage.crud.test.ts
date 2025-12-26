describe('storage CRUD and hiddenUntil behavior', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('create, read, update, delete item flow with in-memory mock', async () => {
    // In-memory rows store
    const rows: any[] = [];
    let nextId = 1;

    jest.doMock('expo-sqlite', () => ({
      openDatabase: (name: string) => ({
        transaction: (cb: (tx: any) => void) => {
          const tx = {
            executeSql: (sql: string, args: any[] = [], success?: (t: any, res: any) => void) => {
              const sqlTrim = sql.trim();

              if (/^CREATE TABLE/i.test(sqlTrim)) {
                success?.(tx, { rows: { _array: [] } });
                return;
              }

              if (/^PRAGMA table_info\(items\)/i.test(sqlTrim)) {
                success?.(tx, { rows: { _array: [] } });
                return;
              }

              if (/^ALTER TABLE/i.test(sqlTrim)) {
                success?.(tx, { rows: { _array: [] } });
                return;
              }

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
                success?.(tx, { insertId: item.id });
                return;
              }

              if (/^SELECT \* FROM items ORDER BY createdAt DESC;/i.test(sqlTrim)) {
                success?.(tx, { rows: { _array: rows.slice() } });
                return;
              }

              if (/^SELECT \* FROM items WHERE id = \?/i.test(sqlTrim)) {
                const id = args[0];
                const found = rows.find((r) => r.id === id);
                success?.(tx, { rows: { _array: found ? [found] : [] } });
                return;
              }

              // unhideExpired update (must run before generic UPDATE handling)
              if (/UPDATE items SET hidden = 0, hiddenUntil = NULL WHERE hiddenUntil IS NOT NULL AND hiddenUntil <= \?;?/i.test(sqlTrim)) {
                const ts = args[0];
                for (const r of rows) {
                  if (r.hiddenUntil != null && r.hiddenUntil <= ts) {
                    r.hidden = 0;
                    r.hiddenUntil = null;
                  }
                }
                success?.(tx, { rows: { _array: [] } });
                return;
              }

              if (/^UPDATE items SET/i.test(sqlTrim)) {
                // naive update: map through fields by args
                // last arg is id
                const id = args[args.length - 1];
                const target = rows.find((r) => r.id === id);
                if (target) {
                  // parse set clause to determine number of fields
                  // We'll apply args in order to the fields
                  // But simpler: apply by matching column names in sql
                  const setPart = sqlTrim.match(/UPDATE items SET (.*) WHERE/i)?.[1] ?? '';
                  const fields = setPart.split(',').map((s) => s.split('=')[0].trim());
                  fields.forEach((f, i) => {
                    const col = f;
                    target[col] = args[i];
                  });
                }
                success?.(tx, { rows: { _array: [] } });
                return;
              }

              if (/^DELETE FROM items WHERE id = \?/i.test(sqlTrim)) {
                const id = args[0];
                const idx = rows.findIndex((r) => r.id === id);
                if (idx !== -1) rows.splice(idx, 1);
                success?.(tx, { rows: { _array: [] } });
                return;
              }

              // fallback
              success?.(tx, { rows: { _array: [] } });
            },
          };
          cb(tx);
        },
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
