import * as SQLite from 'expo-sqlite';

const DB_NAME = 'wardrobe.db';

let db: SQLite.SQLiteDatabase | null = null;

function getDB(): SQLite.SQLiteDatabase {
  if (db) return db;
  db = SQLite.openDatabaseSync(DB_NAME);
  return db;
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

async function ensureSchema() {
  const database = getDB();

  // create items table if not exists
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT,
      category TEXT,
      imageUri TEXT,
      thumbUri TEXT,
      notes TEXT,
      tags TEXT,
      createdAt INTEGER,
      wornAt INTEGER,
      hidden INTEGER,
      hiddenUntil INTEGER
    );
  `);

  // Create outfits table if not exists
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS outfits (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT,
      itemIds TEXT,
      notes TEXT,
      createdAt INTEGER
    );
  `);

  // Create indexes for better query performance
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);`);
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_items_hidden ON items(hidden);`);
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_items_createdAt ON items(createdAt);`);
}

export async function initDB() {
  await ensureSchema();
  // run a cleanup pass to unhide expired items
  await unhideExpired();
}

export async function createItem(item: DBItemRow): Promise<number> {
  const database = getDB();
  const now = Date.now();

  const result = await database.runAsync(
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

  return result.lastInsertRowId;
}

export async function setHiddenUntil(id: number, ts: number | null) {
  const database = getDB();
  await database.runAsync(`UPDATE items SET hidden = ?, hiddenUntil = ? WHERE id = ?;`, [ts ? 1 : 0, ts, id]);
}

export async function unhideExpired() {
  const database = getDB();
  const now = Date.now();
  await database.runAsync(`UPDATE items SET hidden = 0, hiddenUntil = NULL WHERE hiddenUntil IS NOT NULL AND hiddenUntil <= ?;`, [now]);
}

export async function getItems(): Promise<DBItemRow[]> {
  const database = getDB();
  // cleanup expired hidden flags before returning
  await unhideExpired();
  const rows = await database.getAllAsync<DBItemRow>(`SELECT * FROM items ORDER BY createdAt DESC;`);
  return rows;
}

export async function getItemById(id: number): Promise<DBItemRow | null> {
  const database = getDB();
  const row = await database.getFirstAsync<DBItemRow>(`SELECT * FROM items WHERE id = ? LIMIT 1;`, [id]);
  return row ?? null;
}

export async function updateItem(id: number, changes: Partial<DBItemRow>) {
  const database = getDB();
  const fields = Object.keys(changes);
  if (fields.length === 0) return;
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const args = fields.map((f) => (changes as any)[f]);
  args.push(id);

  await database.runAsync(`UPDATE items SET ${setClause} WHERE id = ?;`, args);
}

export async function deleteItem(id: number) {
  const database = getDB();
  await database.runAsync(`DELETE FROM items WHERE id = ?;`, [id]);
}

// Outfits CRUD
export type DBOutfitRow = {
  id?: number;
  name: string;
  itemIds: string; // JSON string of item id array
  notes?: string | null;
  createdAt?: number;
};

export async function createOutfit(outfit: DBOutfitRow): Promise<number> {
  const database = getDB();
  const now = Date.now();
  const result = await database.runAsync(
    `INSERT INTO outfits (name, itemIds, notes, createdAt) VALUES (?, ?, ?, ?);`,
    [outfit.name, outfit.itemIds, outfit.notes ?? null, outfit.createdAt ?? now]
  );
  return result.lastInsertRowId;
}

export async function getOutfits(): Promise<DBOutfitRow[]> {
  const database = getDB();
  const rows = await database.getAllAsync<DBOutfitRow>(`SELECT * FROM outfits ORDER BY createdAt DESC;`);
  return rows;
}

export async function getOutfitById(id: number): Promise<DBOutfitRow | null> {
  const database = getDB();
  const row = await database.getFirstAsync<DBOutfitRow>(`SELECT * FROM outfits WHERE id = ? LIMIT 1;`, [id]);
  return row ?? null;
}

export async function updateOutfit(id: number, changes: Partial<DBOutfitRow>) {
  const database = getDB();
  const fields = Object.keys(changes);
  if (fields.length === 0) return;
  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const args = fields.map((f) => (changes as any)[f]);
  args.push(id);

  await database.runAsync(`UPDATE outfits SET ${setClause} WHERE id = ?;`, args);
}

export async function deleteOutfit(id: number) {
  const database = getDB();
  await database.runAsync(`DELETE FROM outfits WHERE id = ?;`, [id]);
}
