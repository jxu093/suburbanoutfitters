import * as SQLite from 'expo-sqlite';

const DB_NAME = 'wardrobe.db';

let db: any = null;
function getDB() {
  if (db) return db;

  // Prefer openDatabase, fallback to openDatabaseSync if available
  if (typeof (SQLite as any).openDatabase === 'function') {
    db = (SQLite as any).openDatabase(DB_NAME);
    return db;
  }

  if (typeof (SQLite as any).openDatabaseSync === 'function') {
    db = (SQLite as any).openDatabaseSync(DB_NAME);
    return db;
  }

  throw new Error('expo-sqlite: openDatabase is not available in this environment. Ensure you are running on a native device/emulator and that expo-sqlite is installed.');
}

export type DBItemRow = {
  id?: number;
  name: string;
  category?: string | null;
  imageUri?: string | null;
  thumbUri?: string | null;
  notes?: string | null;
  tags?: string | null; // JSON stringified
  createdAt?: number;
  wornAt?: number | null;
  hidden?: number | null; // 0 or 1
  hiddenUntil?: number | null; // unix ms timestamp when hidden expires
};

function txExec(sql: string, args: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    const database = getDB();
    database.transaction((tx: any) => {
      tx.executeSql(
        sql,
        args,
        (_: any, result: any) => resolve(result),
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

async function ensureSchema() {
  // create table if not exists
  await txExec(
    `CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT,
      category TEXT,
      imageUri TEXT,
      thumbUri TEXT,
      notes TEXT,
      tags TEXT,
      createdAt INTEGER,
      wornAt INTEGER,
      hidden INTEGER
    );`
  );

  // add hiddenUntil column if missing
  const res: any = await txExec(`PRAGMA table_info(items);`);
  const cols = (res.rows?._array ?? []) as any[];
  const hasHiddenUntil = cols.some((c) => c.name === 'hiddenUntil');
  if (!hasHiddenUntil) {
    await txExec(`ALTER TABLE items ADD COLUMN hiddenUntil INTEGER;`);
  }

  // Create outfits table if missing
  const outfitsRes: any = await txExec(`PRAGMA table_info(outfits);`);
  const outfitsCols = (outfitsRes.rows?._array ?? []) as any[];
  if (outfitsCols.length === 0) {
    await txExec(
      `CREATE TABLE IF NOT EXISTS outfits (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT,
        itemIds TEXT,
        notes TEXT,
        createdAt INTEGER
      );`
    );
  }
}

export async function initDB() {
  await ensureSchema();
  // run a cleanup pass to unhide expired items
  await unhideExpired();
}

export async function createItem(item: DBItemRow) {
  const now = Date.now();
  const res: any = await txExec(
    `INSERT INTO items (name, category, imageUri, thumbUri, notes, tags, createdAt, wornAt, hidden, hiddenUntil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      item.name,
      item.category ?? null,
      item.imageUri ?? null,
      item.thumbUri ?? null,
      item.notes ?? null,
      item.tags ?? null,
      item.createdAt ?? now,
      item.wornAt ?? null,
      item.hidden ?? 0,
      item.hiddenUntil ?? null,
    ]
  );

  // res.insertId is available in web/cordova, but in expo-sqlite the insertId is in res.insertId
  const insertId = res.insertId ?? null;
  return insertId;
}

export async function setHiddenUntil(id: number, ts: number | null) {
  await txExec(`UPDATE items SET hidden = ?, hiddenUntil = ? WHERE id = ?;`, [ts ? 1 : 0, ts, id]);
}

export async function unhideExpired() {
  const now = Date.now();
  await txExec(`UPDATE items SET hidden = 0, hiddenUntil = NULL WHERE hiddenUntil IS NOT NULL AND hiddenUntil <= ?;`, [now]);
}
export async function getItems(): Promise<DBItemRow[]> {
  // cleanup expired hidden flags before returning
  await unhideExpired();
  const res: any = await txExec(`SELECT * FROM items ORDER BY createdAt DESC;`);
  const rows = res.rows?._array ?? [];
  return rows as DBItemRow[];
}

export async function getItemById(id: number): Promise<DBItemRow | null> {
  const res: any = await txExec(`SELECT * FROM items WHERE id = ? LIMIT 1;`, [id]);
  const rows = res.rows?._array ?? [];
  return rows[0] ?? null;
}

export async function updateItem(id: number, changes: Partial<DBItemRow>) {
  const fields = Object.keys(changes);
  if (fields.length === 0) return;
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const args = fields.map((f) => (changes as any)[f]);
  args.push(id);

  await txExec(`UPDATE items SET ${setClause} WHERE id = ?;`, args);
}

export async function deleteItem(id: number) {
  await txExec(`DELETE FROM items WHERE id = ?;`, [id]);
}

// Outfits CRUD
export type DBOutfitRow = {
  id?: number;
  name: string;
  itemIds: string; // JSON string of item id array
  notes?: string | null;
  createdAt?: number;
};

export async function createOutfit(outfit: DBOutfitRow) {
  const now = Date.now();
  const res: any = await txExec(
    `INSERT INTO outfits (name, itemIds, notes, createdAt) VALUES (?, ?, ?, ?);`,
    [outfit.name, outfit.itemIds, outfit.notes ?? null, outfit.createdAt ?? now]
  );
  return res.insertId ?? null;
}

export async function getOutfits(): Promise<DBOutfitRow[]> {
  const res: any = await txExec(`SELECT * FROM outfits ORDER BY createdAt DESC;`);
  const rows = res.rows?._array ?? [];
  return rows as DBOutfitRow[];
}

export async function getOutfitById(id: number): Promise<DBOutfitRow | null> {
  const res: any = await txExec(`SELECT * FROM outfits WHERE id = ? LIMIT 1;`, [id]);
  const rows = res.rows?._array ?? [];
  return rows[0] ?? null;
}

export async function updateOutfit(id: number, changes: Partial<DBOutfitRow>) {
  const fields = Object.keys(changes);
  if (fields.length === 0) return;
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const args = fields.map((f) => (changes as any)[f]);
  args.push(id);

  await txExec(`UPDATE outfits SET ${setClause} WHERE id = ?;`, args);
}

export async function deleteOutfit(id: number) {
  await txExec(`DELETE FROM outfits WHERE id = ?;`, [id]);
}
