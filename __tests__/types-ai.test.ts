// Type tests for AI-related types
// These tests verify that types are correctly defined and compatible

import type {
  AIItemAttributes,
  Item,
  UserProfile,
  OutfitFeedback,
  AIAnalysisResult,
  AIOutfitSuggestion,
  AIProviderName,
  AIProviderConfig,
} from '../app/types';

describe('AI Types', () => {
  describe('AIItemAttributes', () => {
    test('all fields are optional', () => {
      const emptyAttributes: AIItemAttributes = {};
      expect(emptyAttributes).toBeDefined();
    });

    test('accepts full attribute set', () => {
      const fullAttributes: AIItemAttributes = {
        aiCategory: 'top',
        aiSubcategory: 'henley',
        aiColors: ['navy', 'white'],
        aiColorFamily: 'cool',
        aiStyle: ['casual', 'minimalist'],
        aiFormality: 2,
        aiOccasions: ['weekend', 'casual'],
        aiPattern: 'striped',
        aiMaterial: 'cotton',
        aiSeasons: ['spring', 'summer'],
        aiWeatherSuitability: ['warm', 'mild'],
        aiAnalyzedAt: Date.now(),
        aiConfidence: 0.92,
      };

      expect(fullAttributes.aiCategory).toBe('top');
      expect(fullAttributes.aiColors).toContain('navy');
      expect(fullAttributes.aiFormality).toBe(2);
    });

    test('colorFamily accepts only valid values', () => {
      const warmAttributes: AIItemAttributes = { aiColorFamily: 'warm' };
      const coolAttributes: AIItemAttributes = { aiColorFamily: 'cool' };
      const neutralAttributes: AIItemAttributes = { aiColorFamily: 'neutral' };
      const nullAttributes: AIItemAttributes = { aiColorFamily: null };

      expect(warmAttributes.aiColorFamily).toBe('warm');
      expect(coolAttributes.aiColorFamily).toBe('cool');
      expect(neutralAttributes.aiColorFamily).toBe('neutral');
      expect(nullAttributes.aiColorFamily).toBeNull();
    });
  });

  describe('Item with AI Attributes', () => {
    test('Item extends AIItemAttributes', () => {
      const item: Item = {
        id: 1,
        name: 'Navy T-Shirt',
        category: 'top',
        aiCategory: 'top',
        aiColors: ['navy'],
        aiFormality: 2,
      };

      expect(item.name).toBe('Navy T-Shirt');
      expect(item.aiCategory).toBe('top');
    });

    test('Item works without AI attributes', () => {
      const basicItem: Item = {
        name: 'Simple Shirt',
        category: 'top',
      };

      expect(basicItem.name).toBe('Simple Shirt');
      expect(basicItem.aiCategory).toBeUndefined();
    });
  });

  describe('UserProfile', () => {
    test('all fields are optional', () => {
      const emptyProfile: UserProfile = {};
      expect(emptyProfile).toBeDefined();
    });

    test('bodyType accepts valid values', () => {
      const profiles: UserProfile[] = [
        { bodyType: 'rectangle' },
        { bodyType: 'triangle' },
        { bodyType: 'inverted-triangle' },
        { bodyType: 'hourglass' },
        { bodyType: 'oval' },
        { bodyType: null },
      ];

      expect(profiles).toHaveLength(6);
    });

    test('skinTone accepts valid values', () => {
      const profiles: UserProfile[] = [
        { skinTone: 'dark' },
        { skinTone: 'tan' },
        { skinTone: 'pale' },
        { skinTone: null },
      ];

      expect(profiles).toHaveLength(4);
    });

    test('height accepts valid values', () => {
      const profiles: UserProfile[] = [
        { height: 'petite' },
        { height: 'average' },
        { height: 'tall' },
        { height: null },
      ];

      expect(profiles).toHaveLength(4);
    });

    test('accepts full profile', () => {
      const fullProfile: UserProfile = {
        id: 1,
        bodyType: 'hourglass',
        skinTone: 'tan',
        height: 'average',
        preferredStyles: ['minimalist', 'classic'],
        avoidedStyles: ['bohemian'],
        preferredColors: ['navy', 'white', 'black'],
        avoidedColors: ['yellow'],
        formalityDefault: 3,
        lifestyle: ['office-job', 'active'],
        acceptedCount: 10,
        rejectedCount: 2,
        lastUpdated: Date.now(),
        profileCompleted: true,
        skippedProfile: false,
      };

      expect(fullProfile.bodyType).toBe('hourglass');
      expect(fullProfile.preferredStyles).toContain('minimalist');
    });
  });

  describe('OutfitFeedback', () => {
    test('requires action and outfitItemIds', () => {
      const feedback: OutfitFeedback = {
        outfitItemIds: [1, 2, 3],
        action: 'accept',
      };

      expect(feedback.action).toBe('accept');
      expect(feedback.outfitItemIds).toEqual([1, 2, 3]);
    });

    test('action accepts valid values', () => {
      const feedbacks: OutfitFeedback[] = [
        { outfitItemIds: [1], action: 'accept' },
        { outfitItemIds: [2], action: 'reject' },
        { outfitItemIds: [3], action: 'save' },
        { outfitItemIds: [4], action: 'wear' },
      ];

      expect(feedbacks.map((f) => f.action)).toEqual(['accept', 'reject', 'save', 'wear']);
    });

    test('accepts optional fields', () => {
      const feedback: OutfitFeedback = {
        id: 1,
        outfitItemIds: [1, 2],
        action: 'accept',
        occasion: 'weekend',
        weather: 'warm',
        createdAt: Date.now(),
      };

      expect(feedback.occasion).toBe('weekend');
    });
  });

  describe('AIAnalysisResult', () => {
    test('all fields are optional', () => {
      const emptyResult: AIAnalysisResult = {};
      expect(emptyResult).toBeDefined();
    });

    test('accepts full analysis', () => {
      const result: AIAnalysisResult = {
        category: 'top',
        subcategory: 't-shirt',
        colors: ['blue', 'white'],
        colorFamily: 'cool',
        style: ['casual'],
        formality: 2,
        occasions: ['weekend'],
        pattern: 'striped',
        material: 'cotton',
        seasons: ['summer'],
        weatherSuitability: ['hot', 'warm'],
        confidence: 0.95,
      };

      expect(result.category).toBe('top');
      expect(result.confidence).toBe(0.95);
    });
  });

  describe('AIOutfitSuggestion', () => {
    test('requires itemIds', () => {
      const suggestion: AIOutfitSuggestion = {
        itemIds: [1, 2, 3],
      };

      expect(suggestion.itemIds).toEqual([1, 2, 3]);
    });

    test('accepts optional fields', () => {
      const suggestion: AIOutfitSuggestion = {
        itemIds: [1, 2, 3],
        reasoning: 'Great color coordination',
        occasions: ['work', 'casual'],
        style: 'smart casual',
        score: 8,
      };

      expect(suggestion.reasoning).toBe('Great color coordination');
      expect(suggestion.score).toBe(8);
    });
  });

  describe('AIProviderConfig', () => {
    test('requires provider and apiKey', () => {
      const config: AIProviderConfig = {
        provider: 'claude',
        apiKey: 'test-key',
      };

      expect(config.provider).toBe('claude');
      expect(config.apiKey).toBe('test-key');
    });

    test('provider accepts valid values', () => {
      const providers: AIProviderName[] = ['claude', 'openai', 'gemini'];
      expect(providers).toHaveLength(3);
    });

    test('accepts optional model', () => {
      const config: AIProviderConfig = {
        provider: 'claude',
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      };

      expect(config.model).toBe('claude-sonnet-4-20250514');
    });
  });
});
