/**
 * Phase 1: Foundation Tests
 *
 * Tests for the foundational AI types, storage functions, and image service extensions.
 * Covers: AIItemAttributes, UserProfile, OutfitFeedback, AIAnalysisResult, AIOutfitSuggestion,
 * database migrations, settings storage, and base64 image conversion.
 */

import type {
  AIItemAttributes,
  Item,
  UserProfile,
  OutfitFeedback,
  AIAnalysisResult,
  AIOutfitSuggestion,
  AIProviderName,
  AIProviderConfig,
} from '../types';

describe('Phase 1: Foundation', () => {
  describe('AIItemAttributes Type', () => {
    it('supports empty attributes', () => {
      const attrs: AIItemAttributes = {};
      expect(attrs).toBeDefined();
      expect(Object.keys(attrs)).toHaveLength(0);
    });

    it('supports all category values', () => {
      const categories = ['top', 'bottom', 'shoes', 'outerwear', 'hat', 'accessory', 'dress', 'suit'];
      categories.forEach((cat) => {
        const attrs: AIItemAttributes = { aiCategory: cat };
        expect(attrs.aiCategory).toBe(cat);
      });
    });

    it('supports subcategory for detailed classification', () => {
      const subcategories = [
        { category: 'top', sub: 'henley' },
        { category: 'top', sub: 'button-down' },
        { category: 'bottom', sub: 'chinos' },
        { category: 'shoes', sub: 'sneakers' },
        { category: 'outerwear', sub: 'blazer' },
      ];

      subcategories.forEach(({ category, sub }) => {
        const attrs: AIItemAttributes = { aiCategory: category, aiSubcategory: sub };
        expect(attrs.aiSubcategory).toBe(sub);
      });
    });

    it('supports multi-color arrays', () => {
      const attrs: AIItemAttributes = {
        aiColors: ['navy', 'white', 'gold'],
      };
      expect(attrs.aiColors).toHaveLength(3);
      expect(attrs.aiColors).toContain('navy');
    });

    it('supports color family classification', () => {
      const families: Array<AIItemAttributes['aiColorFamily']> = ['warm', 'cool', 'neutral', null];
      families.forEach((family) => {
        const attrs: AIItemAttributes = { aiColorFamily: family };
        expect(attrs.aiColorFamily).toBe(family);
      });
    });

    it('supports style arrays', () => {
      const attrs: AIItemAttributes = {
        aiStyle: ['casual', 'preppy', 'minimalist'],
      };
      expect(attrs.aiStyle).toHaveLength(3);
    });

    it('supports formality scale 1-5', () => {
      for (let i = 1; i <= 5; i++) {
        const attrs: AIItemAttributes = { aiFormality: i };
        expect(attrs.aiFormality).toBe(i);
      }
    });

    it('supports occasion arrays', () => {
      const attrs: AIItemAttributes = {
        aiOccasions: ['work', 'weekend', 'date-night', 'gym', 'formal-event'],
      };
      expect(attrs.aiOccasions).toHaveLength(5);
    });

    it('supports pattern classification', () => {
      const patterns = ['solid', 'striped', 'plaid', 'floral', 'geometric', 'abstract'];
      patterns.forEach((pattern) => {
        const attrs: AIItemAttributes = { aiPattern: pattern };
        expect(attrs.aiPattern).toBe(pattern);
      });
    });

    it('supports material classification', () => {
      const materials = ['cotton', 'denim', 'silk', 'wool', 'synthetic', 'leather'];
      materials.forEach((material) => {
        const attrs: AIItemAttributes = { aiMaterial: material };
        expect(attrs.aiMaterial).toBe(material);
      });
    });

    it('supports season arrays', () => {
      const attrs: AIItemAttributes = {
        aiSeasons: ['spring', 'summer', 'fall', 'winter'],
      };
      expect(attrs.aiSeasons).toHaveLength(4);
    });

    it('supports weather suitability arrays', () => {
      const attrs: AIItemAttributes = {
        aiWeatherSuitability: ['hot', 'warm', 'mild', 'cool', 'cold'],
      };
      expect(attrs.aiWeatherSuitability).toHaveLength(5);
    });

    it('supports analysis metadata', () => {
      const now = Date.now();
      const attrs: AIItemAttributes = {
        aiAnalyzedAt: now,
        aiConfidence: 0.95,
      };
      expect(attrs.aiAnalyzedAt).toBe(now);
      expect(attrs.aiConfidence).toBe(0.95);
    });

    it('confidence is between 0 and 1', () => {
      const attrs: AIItemAttributes = { aiConfidence: 0.85 };
      expect(attrs.aiConfidence).toBeGreaterThanOrEqual(0);
      expect(attrs.aiConfidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Item extends AIItemAttributes', () => {
    it('Item includes all AI attributes', () => {
      const item: Item = {
        id: 1,
        name: 'Test Shirt',
        category: 'top',
        imageUri: 'file://test.jpg',
        thumbUri: 'file://test-thumb.jpg',
        tags: ['summer'],
        createdAt: Date.now(),
        // AI attributes
        aiCategory: 'top',
        aiSubcategory: 'henley',
        aiColors: ['blue', 'white'],
        aiColorFamily: 'cool',
        aiStyle: ['casual'],
        aiFormality: 2,
        aiOccasions: ['weekend'],
        aiPattern: 'striped',
        aiMaterial: 'cotton',
        aiSeasons: ['summer'],
        aiWeatherSuitability: ['warm'],
        aiAnalyzedAt: Date.now(),
        aiConfidence: 0.9,
      };

      expect(item.name).toBe('Test Shirt');
      expect(item.aiCategory).toBe('top');
      expect(item.aiConfidence).toBe(0.9);
    });

    it('Item works with partial AI attributes', () => {
      const item: Item = {
        name: 'Basic Shirt',
        category: 'top',
        aiCategory: 'top',
        aiColors: ['white'],
      };

      expect(item.aiCategory).toBe('top');
      expect(item.aiFormality).toBeUndefined();
    });

    it('Item works without any AI attributes', () => {
      const item: Item = {
        name: 'Legacy Item',
        category: 'bottom',
      };

      expect(item.name).toBe('Legacy Item');
      expect(item.aiCategory).toBeUndefined();
    });
  });

  describe('UserProfile Type', () => {
    it('supports empty profile', () => {
      const profile: UserProfile = {};
      expect(profile).toBeDefined();
    });

    it('supports all body types', () => {
      const bodyTypes: Array<UserProfile['bodyType']> = [
        'rectangle',
        'triangle',
        'inverted-triangle',
        'hourglass',
        'oval',
        null,
      ];

      bodyTypes.forEach((type) => {
        const profile: UserProfile = { bodyType: type };
        expect(profile.bodyType).toBe(type);
      });
    });

    it('supports all skin tones', () => {
      const tones: Array<UserProfile['skinTone']> = ['dark', 'tan', 'pale', null];

      tones.forEach((tone) => {
        const profile: UserProfile = { skinTone: tone };
        expect(profile.skinTone).toBe(tone);
      });
    });

    it('supports all height options', () => {
      const heights: Array<UserProfile['height']> = ['petite', 'average', 'tall', null];

      heights.forEach((height) => {
        const profile: UserProfile = { height };
        expect(profile.height).toBe(height);
      });
    });

    it('supports style preferences', () => {
      const profile: UserProfile = {
        preferredStyles: ['minimalist', 'classic', 'preppy'],
        avoidedStyles: ['bohemian', 'sporty', 'grunge'],
      };

      expect(profile.preferredStyles).toHaveLength(3);
      expect(profile.avoidedStyles).toHaveLength(3);
    });

    it('supports color preferences', () => {
      const profile: UserProfile = {
        preferredColors: ['navy', 'black', 'white', 'grey'],
        avoidedColors: ['orange', 'yellow', 'neon'],
      };

      expect(profile.preferredColors).toContain('navy');
      expect(profile.avoidedColors).toContain('orange');
    });

    it('supports formality default', () => {
      const profile: UserProfile = { formalityDefault: 3 };
      expect(profile.formalityDefault).toBe(3);
    });

    it('supports lifestyle options', () => {
      const profile: UserProfile = {
        lifestyle: ['office-job', 'active', 'parent', 'social'],
      };
      expect(profile.lifestyle).toHaveLength(4);
    });

    it('tracks feedback counts', () => {
      const profile: UserProfile = {
        acceptedCount: 50,
        rejectedCount: 10,
      };

      const acceptRate = profile.acceptedCount! / (profile.acceptedCount! + profile.rejectedCount!);
      expect(acceptRate).toBeCloseTo(0.833, 2);
    });

    it('tracks profile completion state', () => {
      const complete: UserProfile = { profileCompleted: true, skippedProfile: false };
      const skipped: UserProfile = { profileCompleted: false, skippedProfile: true };

      expect(complete.profileCompleted).toBe(true);
      expect(skipped.skippedProfile).toBe(true);
    });

    it('supports lastUpdated timestamp', () => {
      const now = Date.now();
      const profile: UserProfile = { lastUpdated: now };
      expect(profile.lastUpdated).toBe(now);
    });
  });

  describe('OutfitFeedback Type', () => {
    it('requires outfitItemIds and action', () => {
      const feedback: OutfitFeedback = {
        outfitItemIds: [1, 2, 3],
        action: 'accept',
      };

      expect(feedback.outfitItemIds).toEqual([1, 2, 3]);
      expect(feedback.action).toBe('accept');
    });

    it('supports all action types', () => {
      const actions: Array<OutfitFeedback['action']> = ['accept', 'reject', 'save', 'wear'];

      actions.forEach((action) => {
        const feedback: OutfitFeedback = { outfitItemIds: [1], action };
        expect(feedback.action).toBe(action);
      });
    });

    it('supports optional context', () => {
      const feedback: OutfitFeedback = {
        id: 1,
        outfitItemIds: [1, 2, 3, 4],
        action: 'accept',
        occasion: 'work',
        weather: 'cool',
        createdAt: Date.now(),
      };

      expect(feedback.occasion).toBe('work');
      expect(feedback.weather).toBe('cool');
    });
  });

  describe('AIAnalysisResult Type', () => {
    it('supports empty result', () => {
      const result: AIAnalysisResult = {};
      expect(result).toBeDefined();
    });

    it('supports full analysis result', () => {
      const result: AIAnalysisResult = {
        category: 'top',
        subcategory: 'oxford',
        colors: ['blue', 'white'],
        colorFamily: 'cool',
        style: ['preppy', 'classic'],
        formality: 4,
        occasions: ['work', 'date-night'],
        pattern: 'solid',
        material: 'cotton',
        seasons: ['spring', 'fall'],
        weatherSuitability: ['mild', 'cool'],
        confidence: 0.92,
      };

      expect(result.category).toBe('top');
      expect(result.confidence).toBe(0.92);
      expect(result.colors).toContain('blue');
    });

    it('maps directly to AIItemAttributes', () => {
      const result: AIAnalysisResult = {
        category: 'shoes',
        subcategory: 'loafers',
        colors: ['brown'],
        formality: 4,
      };

      const attrs: AIItemAttributes = {
        aiCategory: result.category,
        aiSubcategory: result.subcategory,
        aiColors: result.colors,
        aiFormality: result.formality,
      };

      expect(attrs.aiCategory).toBe(result.category);
    });
  });

  describe('AIOutfitSuggestion Type', () => {
    it('requires itemIds', () => {
      const suggestion: AIOutfitSuggestion = {
        itemIds: [1, 2, 3],
      };

      expect(suggestion.itemIds).toHaveLength(3);
    });

    it('supports optional metadata', () => {
      const suggestion: AIOutfitSuggestion = {
        itemIds: [1, 2, 3, 4],
        reasoning: 'Great color coordination with complementary earth tones',
        occasions: ['work', 'business-casual'],
        style: 'smart casual',
        score: 8,
      };

      expect(suggestion.reasoning).toContain('color coordination');
      expect(suggestion.score).toBe(8);
    });
  });

  describe('AIProviderConfig Type', () => {
    it('requires provider and apiKey', () => {
      const config: AIProviderConfig = {
        provider: 'claude',
        apiKey: 'sk-test-key',
      };

      expect(config.provider).toBe('claude');
      expect(config.apiKey).toBe('sk-test-key');
    });

    it('supports all provider names', () => {
      const providers: AIProviderName[] = ['claude', 'openai', 'gemini'];

      providers.forEach((provider) => {
        const config: AIProviderConfig = { provider, apiKey: 'test' };
        expect(config.provider).toBe(provider);
      });
    });

    it('supports optional model override', () => {
      const config: AIProviderConfig = {
        provider: 'claude',
        apiKey: 'test',
        model: 'claude-sonnet-4-20250514',
      };

      expect(config.model).toBe('claude-sonnet-4-20250514');
    });
  });
});

describe('Phase 1: Storage Integration', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('Settings Storage', () => {
    it('stores and retrieves string settings', async () => {
      const settings: Record<string, string> = {};

      jest.doMock('expo-sqlite', () => ({
        openDatabaseSync: () => ({
          execAsync: jest.fn().mockResolvedValue(undefined),
          runAsync: jest.fn().mockImplementation(async (sql: string, args: any[]) => {
            if (sql.toLowerCase().includes('insert or replace into settings')) {
              settings[args[0]] = args[1];
            }
            return { lastInsertRowId: 1 };
          }),
          getAllAsync: jest.fn().mockResolvedValue([]),
          getFirstAsync: jest.fn().mockImplementation(async (sql: string, args: any[]) => {
            if (sql.toLowerCase().includes('select value from settings')) {
              return settings[args[0]] ? { value: settings[args[0]] } : null;
            }
            return null;
          }),
        }),
      }));

      const storage = require('../services/storage');
      await storage.initDB();

      // Test set and get
      await storage.setSetting('ai_provider', 'claude');
      const value = await storage.getSetting('ai_provider');
      expect(value).toBe('claude');
    });

    it('returns null for missing settings', async () => {
      jest.doMock('expo-sqlite', () => ({
        openDatabaseSync: () => ({
          execAsync: jest.fn().mockResolvedValue(undefined),
          runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
          getAllAsync: jest.fn().mockResolvedValue([]),
          getFirstAsync: jest.fn().mockResolvedValue(null),
        }),
      }));

      const storage = require('../services/storage');
      await storage.initDB();

      const value = await storage.getSetting('nonexistent');
      expect(value).toBeNull();
    });
  });

  describe('AI Cache Storage', () => {
    it('caches and retrieves AI analysis results', async () => {
      const cache: Record<number, { attributes: string }> = {};

      jest.doMock('expo-sqlite', () => ({
        openDatabaseSync: () => ({
          execAsync: jest.fn().mockResolvedValue(undefined),
          runAsync: jest.fn().mockImplementation(async (sql: string, args: any[]) => {
            if (sql.toLowerCase().includes('insert or replace into ai_cache')) {
              cache[args[0]] = { attributes: args[1] };
            }
            if (sql.toLowerCase().includes('delete from ai_cache where itemid')) {
              delete cache[args[0]];
            }
            return {};
          }),
          getAllAsync: jest.fn().mockResolvedValue([]),
          getFirstAsync: jest.fn().mockImplementation(async (sql: string, args: any[]) => {
            if (sql.toLowerCase().includes('select attributes from ai_cache')) {
              const cached = cache[args[0]];
              if (cached) {
                return { attributes: cached.attributes };
              }
            }
            return null;
          }),
        }),
      }));

      const storage = require('../services/storage');
      await storage.initDB();

      const analysisJson = JSON.stringify({ category: 'top', colors: ['blue'] });
      await storage.setCachedAIAnalysis(1, analysisJson);

      const cached = await storage.getCachedAIAnalysis(1);
      expect(cached).toBe(analysisJson);
    });
  });

  describe('User Profile Storage', () => {
    it('saves and retrieves user profile', async () => {
      let savedProfile: any = null;

      jest.doMock('expo-sqlite', () => ({
        openDatabaseSync: () => ({
          execAsync: jest.fn().mockResolvedValue(undefined),
          runAsync: jest.fn().mockImplementation(async (sql: string, args: any[]) => {
            if (sql.toLowerCase().includes('insert into user_profile')) {
              savedProfile = {
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
                profileCompleted: args[12],
              };
              return { lastInsertRowId: 1 };
            }
            return { lastInsertRowId: 1 };
          }),
          getAllAsync: jest.fn().mockResolvedValue([]),
          getFirstAsync: jest.fn().mockImplementation(async (sql: string) => {
            if (sql.toLowerCase().includes('select * from user_profile')) {
              return savedProfile;
            }
            return null;
          }),
        }),
      }));

      const storage = require('../services/storage');
      await storage.initDB();

      await storage.saveUserProfile({
        bodyType: 'hourglass',
        skinTone: 'tan',
        height: 'average',
        preferredStyles: '["classic","minimalist"]',
        profileCompleted: 1,
      });

      const profile = await storage.getUserProfile();
      expect(profile).not.toBeNull();
      expect(profile.bodyType).toBe('hourglass');
    });
  });

  describe('Outfit Feedback Storage', () => {
    it('creates and retrieves outfit feedback', async () => {
      const feedbackStore: any[] = [];

      jest.doMock('expo-sqlite', () => ({
        openDatabaseSync: () => ({
          execAsync: jest.fn().mockResolvedValue(undefined),
          runAsync: jest.fn().mockImplementation(async (sql: string, args: any[]) => {
            if (sql.toLowerCase().includes('insert into outfit_feedback')) {
              feedbackStore.push({
                id: feedbackStore.length + 1,
                outfitItemIds: args[0],
                action: args[1],
                occasion: args[2],
                weather: args[3],
                createdAt: args[4],
              });
              return { lastInsertRowId: feedbackStore.length };
            }
            return {};
          }),
          getAllAsync: jest.fn().mockImplementation(async () => feedbackStore),
          getFirstAsync: jest.fn().mockResolvedValue(null),
        }),
      }));

      const storage = require('../services/storage');
      await storage.initDB();

      const id = await storage.createOutfitFeedback({
        outfitItemIds: '[1,2,3]',
        action: 'accept',
        occasion: 'work',
      });

      expect(id).toBe(1);

      const feedback = await storage.getOutfitFeedback(10);
      expect(feedback).toHaveLength(1);
      expect(feedback[0].action).toBe('accept');
    });
  });
});

describe('Phase 1: Database Migrations', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('creates all AI-related tables', async () => {
    const executedSql: string[] = [];

    jest.doMock('expo-sqlite', () => ({
      openDatabaseSync: () => ({
        execAsync: jest.fn().mockImplementation(async (sql: string) => {
          executedSql.push(sql);
          return undefined;
        }),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      }),
    }));

    const storage = require('../services/storage');
    await storage.initDB();

    const allSql = executedSql.join(' ');

    // Core tables
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS settings');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS items');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS outfits');

    // AI-specific tables
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS user_profile');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS outfit_feedback');
    expect(allSql).toContain('CREATE TABLE IF NOT EXISTS ai_cache');
  });

  it('adds AI columns to items table', async () => {
    const executedSql: string[] = [];

    jest.doMock('expo-sqlite', () => ({
      openDatabaseSync: () => ({
        execAsync: jest.fn().mockImplementation(async (sql: string) => {
          executedSql.push(sql);
          return undefined;
        }),
        runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
      }),
    }));

    const storage = require('../services/storage');
    await storage.initDB();

    const allSql = executedSql.join(' ');

    // AI columns on items table
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiCategory');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiSubcategory');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiColors');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiColorFamily');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiStyle');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiFormality');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiOccasions');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiPattern');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiMaterial');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiSeasons');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiWeatherSuitability');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiAnalyzedAt');
    expect(allSql).toContain('ALTER TABLE items ADD COLUMN aiConfidence');
  });
});
