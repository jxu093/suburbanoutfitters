import * as SQLite from 'expo-sqlite';

const DB_NAME = 'wardrobe.db';
const CURRENT_DB_VERSION = 3; // Increment when adding migrations

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
  // AI attributes (added in v2)
  aiCategory?: string | null;
  aiSubcategory?: string | null;
  aiColors?: string | null; // JSON stringified array
  aiColorFamily?: string | null;
  aiStyle?: string | null; // JSON stringified array
  aiFormality?: number | null;
  aiOccasions?: string | null; // JSON stringified array
  aiPattern?: string | null;
  aiMaterial?: string | null;
  aiSeasons?: string | null; // JSON stringified array
  aiWeatherSuitability?: string | null; // JSON stringified array
  aiAnalyzedAt?: number | null;
  aiConfidence?: number | null;
};

// User profile for AI personalization
export type DBUserProfileRow = {
  id?: number;
  bodyType?: string | null;
  skinTone?: string | null;
  height?: string | null;
  preferredStyles?: string | null; // JSON stringified array
  avoidedStyles?: string | null; // JSON stringified array
  preferredColors?: string | null; // JSON stringified array
  avoidedColors?: string | null; // JSON stringified array
  formalityDefault?: number | null;
  lifestyle?: string | null; // JSON stringified array
  acceptedCount?: number | null;
  rejectedCount?: number | null;
  lastUpdated?: number | null;
  profileCompleted?: number | null; // 0 or 1
  skippedProfile?: number | null; // 0 or 1
};

// Outfit feedback for learning
export type DBOutfitFeedbackRow = {
  id?: number;
  outfitItemIds: string; // JSON stringified array
  action: string;
  occasion?: string | null;
  weather?: string | null;
  createdAt?: number;
};

// AI analysis cache
export type DBAICacheRow = {
  itemId: number;
  attributes: string; // JSON stringified AIAnalysisResult
  createdAt?: number;
  expiresAt?: number | null;
};

// Settings (for API keys, etc.)
export type DBSettingsRow = {
  key: string;
  value: string;
};

async function ensureSchema() {
  const database = getDB();

  // Create settings table first (needed for version tracking)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

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

  // Run migrations
  await runMigrations();
}

async function getDBVersion(): Promise<number> {
  const database = getDB();
  try {
    const result = await database.getFirstAsync<{ value: string }>(
      `SELECT value FROM settings WHERE key = 'db_version'`
    );
    return result ? parseInt(result.value, 10) : 1;
  } catch {
    return 1;
  }
}

async function setDBVersion(version: number): Promise<void> {
  const database = getDB();
  await database.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('db_version', ?)`,
    [version.toString()]
  );
}

async function runMigrations(): Promise<void> {
  const currentVersion = await getDBVersion();

  if (currentVersion < 2) {
    await migrateToV2();
    await setDBVersion(2);
  }

  if (currentVersion < 3) {
    await migrateToV3();
    await setDBVersion(3);
  }

  // Add future migrations here:
  // if (currentVersion < 4) { await migrateToV4(); await setDBVersion(4); }
}

async function migrateToV2(): Promise<void> {
  const database = getDB();

  // Add AI columns to items table (SQLite requires one ALTER per column)
  const aiColumns = [
    'aiCategory TEXT',
    'aiSubcategory TEXT',
    'aiColors TEXT',
    'aiColorFamily TEXT',
    'aiStyle TEXT',
    'aiFormality INTEGER',
    'aiOccasions TEXT',
    'aiPattern TEXT',
    'aiMaterial TEXT',
    'aiSeasons TEXT',
    'aiWeatherSuitability TEXT',
    'aiAnalyzedAt INTEGER',
    'aiConfidence REAL',
  ];

  for (const col of aiColumns) {
    try {
      await database.execAsync(`ALTER TABLE items ADD COLUMN ${col};`);
    } catch {
      // Column may already exist, ignore
    }
  }

  // Create user_profile table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY NOT NULL,
      bodyType TEXT,
      skinTone TEXT,
      height TEXT,
      preferredStyles TEXT,
      avoidedStyles TEXT,
      preferredColors TEXT,
      avoidedColors TEXT,
      formalityDefault INTEGER,
      lifestyle TEXT,
      acceptedCount INTEGER DEFAULT 0,
      rejectedCount INTEGER DEFAULT 0,
      lastUpdated INTEGER,
      profileCompleted INTEGER DEFAULT 0,
      skippedProfile INTEGER DEFAULT 0
    );
  `);

  // Create outfit_feedback table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS outfit_feedback (
      id INTEGER PRIMARY KEY NOT NULL,
      outfitItemIds TEXT NOT NULL,
      action TEXT NOT NULL,
      occasion TEXT,
      weather TEXT,
      createdAt INTEGER
    );
  `);

  // Create ai_cache table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS ai_cache (
      itemId INTEGER PRIMARY KEY,
      attributes TEXT NOT NULL,
      createdAt INTEGER,
      expiresAt INTEGER
    );
  `);

  // Create indexes for new tables
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_outfit_feedback_createdAt ON outfit_feedback(createdAt);`);
  await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_ai_cache_expiresAt ON ai_cache(expiresAt);`);
}

async function migrateToV3(): Promise<void> {
  const database = getDB();

  // Clean up any invalid image URIs that contain error text like "Asset not found"
  // These can cause ImageIO errors when passed to Image components
  await database.runAsync(
    `UPDATE items SET imageUri = NULL WHERE imageUri LIKE '%Asset not%' OR imageUri LIKE '%Asset no%'`
  );
  await database.runAsync(
    `UPDATE items SET thumbUri = NULL WHERE thumbUri LIKE '%Asset not%' OR thumbUri LIKE '%Asset no%'`
  );

  console.log('Migration V3: Cleaned up invalid image URIs');
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

// ============ Settings CRUD ============

export async function getSetting(key: string): Promise<string | null> {
  const database = getDB();
  const row = await database.getFirstAsync<DBSettingsRow>(
    `SELECT value FROM settings WHERE key = ?`,
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = getDB();
  await database.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const database = getDB();
  await database.runAsync(`DELETE FROM settings WHERE key = ?`, [key]);
}

// ============ User Profile CRUD ============

export async function getUserProfile(): Promise<DBUserProfileRow | null> {
  const database = getDB();
  const row = await database.getFirstAsync<DBUserProfileRow>(
    `SELECT * FROM user_profile LIMIT 1`
  );
  return row ?? null;
}

export async function saveUserProfile(profile: Partial<DBUserProfileRow>): Promise<number> {
  const database = getDB();
  const existing = await getUserProfile();
  const now = Date.now();

  if (existing?.id) {
    // Update existing profile
    const fields = Object.keys(profile).filter(k => k !== 'id');
    if (fields.length === 0) return existing.id;

    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const args = fields.map((f) => (profile as any)[f]);
    args.push(now); // lastUpdated
    args.push(existing.id);

    await database.runAsync(
      `UPDATE user_profile SET ${setClause}, lastUpdated = ? WHERE id = ?`,
      args
    );
    return existing.id;
  } else {
    // Insert new profile
    const result = await database.runAsync(
      `INSERT INTO user_profile (
        bodyType, skinTone, height, preferredStyles, avoidedStyles,
        preferredColors, avoidedColors, formalityDefault, lifestyle,
        acceptedCount, rejectedCount, lastUpdated, profileCompleted, skippedProfile
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.bodyType ?? null,
        profile.skinTone ?? null,
        profile.height ?? null,
        profile.preferredStyles ?? null,
        profile.avoidedStyles ?? null,
        profile.preferredColors ?? null,
        profile.avoidedColors ?? null,
        profile.formalityDefault ?? null,
        profile.lifestyle ?? null,
        profile.acceptedCount ?? 0,
        profile.rejectedCount ?? 0,
        now,
        profile.profileCompleted ?? 0,
        profile.skippedProfile ?? 0,
      ]
    );
    return result.lastInsertRowId;
  }
}

// ============ Outfit Feedback CRUD ============

export async function createOutfitFeedback(feedback: Omit<DBOutfitFeedbackRow, 'id'>): Promise<number> {
  const database = getDB();
  const now = Date.now();
  const result = await database.runAsync(
    `INSERT INTO outfit_feedback (outfitItemIds, action, occasion, weather, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [
      feedback.outfitItemIds,
      feedback.action,
      feedback.occasion ?? null,
      feedback.weather ?? null,
      feedback.createdAt ?? now,
    ]
  );
  return result.lastInsertRowId;
}

export async function getOutfitFeedback(limit = 100): Promise<DBOutfitFeedbackRow[]> {
  const database = getDB();
  const rows = await database.getAllAsync<DBOutfitFeedbackRow>(
    `SELECT * FROM outfit_feedback ORDER BY createdAt DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

export async function incrementProfileFeedbackCount(action: 'accept' | 'reject'): Promise<void> {
  const database = getDB();
  const column = action === 'accept' ? 'acceptedCount' : 'rejectedCount';
  await database.runAsync(
    `UPDATE user_profile SET ${column} = ${column} + 1, lastUpdated = ?`,
    [Date.now()]
  );
}

// ============ AI Cache CRUD ============

export async function getCachedAIAnalysis(itemId: number): Promise<string | null> {
  const database = getDB();
  const now = Date.now();
  const row = await database.getFirstAsync<DBAICacheRow>(
    `SELECT attributes FROM ai_cache WHERE itemId = ? AND (expiresAt IS NULL OR expiresAt > ?)`,
    [itemId, now]
  );
  return row?.attributes ?? null;
}

export async function setCachedAIAnalysis(
  itemId: number,
  attributes: string,
  expiresAt?: number | null
): Promise<void> {
  const database = getDB();
  const now = Date.now();
  await database.runAsync(
    `INSERT OR REPLACE INTO ai_cache (itemId, attributes, createdAt, expiresAt) VALUES (?, ?, ?, ?)`,
    [itemId, attributes, now, expiresAt ?? null]
  );
}

export async function deleteCachedAIAnalysis(itemId: number): Promise<void> {
  const database = getDB();
  await database.runAsync(`DELETE FROM ai_cache WHERE itemId = ?`, [itemId]);
}

export async function clearExpiredAICache(): Promise<void> {
  const database = getDB();
  const now = Date.now();
  await database.runAsync(
    `DELETE FROM ai_cache WHERE expiresAt IS NOT NULL AND expiresAt <= ?`,
    [now]
  );
}
