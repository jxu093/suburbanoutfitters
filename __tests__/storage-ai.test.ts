// Tests for AI-related storage functions
// These tests verify the SQL queries and function signatures are correct

describe('AI Storage Functions - Integration test with in-memory mock', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('full CRUD flow for AI-related storage functions', async () => {
    // In-memory stores
    const settings: Record<string, string> = {};
    let profile: any = null;
    const feedback: any[] = [];
    const aiCache: Record<number, any> = {};
    let feedbackNextId = 1;

    // Create mock database
    jest.doMock('expo-sqlite', () => ({
      openDatabaseSync: () => ({
        execAsync: jest.fn().mockResolvedValue(undefined),
        runAsync: jest.fn().mockImplementation(async (sql: string, args: any[] = []) => {
          const sqlLower = sql.toLowerCase().trim();

          // Settings
          if (sqlLower.includes('insert or replace into settings')) {
            settings[args[0]] = args[1];
            return { lastInsertRowId: 1 };
          }
          if (sqlLower.includes('delete from settings')) {
            delete settings[args[0]];
            return {};
          }

          // User profile
          if (sqlLower.includes('insert into user_profile')) {
            profile = {
              id: 1,
              bodyType: args[0],
              skinTone: args[1],
              height: args[2],
              preferredStyles: args[3],
              avoidedStyles: args[4],
              preferredColors: args[5],
              avoidedColors: args[6],
              formalityDefault: args[7],
              lifestyle: args[8],
              acceptedCount: args[9],
              rejectedCount: args[10],
              lastUpdated: args[11],
              profileCompleted: args[12],
              skippedProfile: args[13],
            };
            return { lastInsertRowId: 1 };
          }
          if (sqlLower.includes('update user_profile')) {
            // Simple update - just set lastUpdated
            if (profile) profile.lastUpdated = Date.now();
            return {};
          }

          // Outfit feedback
          if (sqlLower.includes('insert into outfit_feedback')) {
            feedback.push({
              id: feedbackNextId++,
              outfitItemIds: args[0],
              action: args[1],
              occasion: args[2],
              weather: args[3],
              createdAt: args[4],
            });
            return { lastInsertRowId: feedbackNextId - 1 };
          }

          // AI cache
          if (sqlLower.includes('insert or replace into ai_cache')) {
            aiCache[args[0]] = {
              itemId: args[0],
              attributes: args[1],
              createdAt: args[2],
              expiresAt: args[3],
            };
            return {};
          }
          if (sqlLower.includes('delete from ai_cache where itemid')) {
            delete aiCache[args[0]];
            return {};
          }
          if (sqlLower.includes('delete from ai_cache where expiresat')) {
            // Clear expired
            const now = args[0];
            for (const key of Object.keys(aiCache)) {
              const item = aiCache[Number(key)];
              if (item.expiresAt && item.expiresAt <= now) {
                delete aiCache[Number(key)];
              }
            }
            return {};
          }

          return { lastInsertRowId: 1 };
        }),
        getAllAsync: jest.fn().mockImplementation(async (sql: string, args: any[] = []) => {
          if (sql.toLowerCase().includes('outfit_feedback')) {
            return feedback.slice(0, args[0] || 100);
          }
          return [];
        }),
        getFirstAsync: jest.fn().mockImplementation(async (sql: string, args: any[] = []) => {
          const sqlLower = sql.toLowerCase();

          // Settings
          if (sqlLower.includes('select value from settings')) {
            return settings[args[0]] ? { value: settings[args[0]] } : null;
          }

          // User profile
          if (sqlLower.includes('select * from user_profile')) {
            return profile;
          }

          // AI cache
          if (sqlLower.includes('select attributes from ai_cache')) {
            const cached = aiCache[args[0]];
            if (cached && (!cached.expiresAt || cached.expiresAt > args[1])) {
              return { attributes: cached.attributes };
            }
            return null;
          }

          return null;
        }),
      }),
    }));

    const storage = require('../services/storage');

    // Initialize DB
    await storage.initDB();

    // Test Settings
    expect(await storage.getSetting('test_key')).toBeNull();
    await storage.setSetting('test_key', 'test_value');
    expect(await storage.getSetting('test_key')).toBe('test_value');
    await storage.deleteSetting('test_key');
    expect(await storage.getSetting('test_key')).toBeNull();

    // Test User Profile
    expect(await storage.getUserProfile()).toBeNull();
    const profileId = await storage.saveUserProfile({
      bodyType: 'hourglass',
      skinTone: 'tan',
    });
    expect(profileId).toBe(1);
    const savedProfile = await storage.getUserProfile();
    expect(savedProfile).not.toBeNull();
    expect(savedProfile.bodyType).toBe('hourglass');

    // Test Outfit Feedback
    const feedbackId = await storage.createOutfitFeedback({
      outfitItemIds: '[1,2,3]',
      action: 'accept',
      occasion: 'weekend',
    });
    expect(feedbackId).toBe(1);
    const feedbackList = await storage.getOutfitFeedback(10);
    expect(feedbackList.length).toBe(1);
    expect(feedbackList[0].action).toBe('accept');

    // Test AI Cache
    expect(await storage.getCachedAIAnalysis(1)).toBeNull();
    await storage.setCachedAIAnalysis(1, '{"category":"top"}');
    const cached = await storage.getCachedAIAnalysis(1);
    expect(cached).toBe('{"category":"top"}');
    await storage.deleteCachedAIAnalysis(1);
    expect(await storage.getCachedAIAnalysis(1)).toBeNull();
  });
});

describe('Database Migrations', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('initDB creates all required tables', async () => {
    const execCalls: string[] = [];

    jest.doMock('expo-sqlite', () => ({
      openDatabaseSync: () => ({
        execAsync: jest.fn().mockImplementation(async (sql: string) => {
          execCalls.push(sql);
          return undefined;
        }),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      }),
    }));

    const storage = require('../services/storage');
    await storage.initDB();

    const allSql = execCalls.join(' ');

    // Core tables
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS settings');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS items');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS outfits');

    // AI tables (from migration)
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS user_profile');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS outfit_feedback');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS ai_cache');

    // AI columns on items
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiCategory');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiColors');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiFormality');
  });
});
