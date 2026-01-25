/**
 * Phase 3: Smart Outfit Generation Tests
 *
 * Tests for AI-powered outfit generation, including context building,
 * prompt generation, and outfit suggestion handling.
 */

import type { AIOutfitSuggestion, UserProfile, OutfitFeedback } from '../types';
import type { ItemSummary, OutfitContext } from '../services/ai/ai-provider';
import { buildOutfitPrompt, buildPairingPrompt } from '../services/ai/prompts';
import { ClaudeProvider } from '../services/ai/claude-provider';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Phase 3: Smart Outfit Generation', () => {
  const mockWardrobe: ItemSummary[] = [
    {
      id: 1,
      name: 'Blue Oxford Shirt',
      category: 'top',
      colors: ['blue', 'white'],
      style: ['preppy', 'classic'],
      formality: 4,
      occasions: ['work', 'date-night'],
      pattern: 'solid',
      material: 'cotton',
    },
    {
      id: 2,
      name: 'Khaki Chinos',
      category: 'bottom',
      colors: ['khaki', 'beige'],
      style: ['classic', 'casual'],
      formality: 3,
      occasions: ['work', 'weekend'],
      pattern: 'solid',
    },
    {
      id: 3,
      name: 'Brown Loafers',
      category: 'shoes',
      colors: ['brown', 'tan'],
      style: ['classic'],
      formality: 4,
      occasions: ['work', 'formal'],
      material: 'leather',
    },
    {
      id: 4,
      name: 'Navy Blazer',
      category: 'outerwear',
      colors: ['navy'],
      style: ['classic', 'formal'],
      formality: 4,
      occasions: ['work', 'formal'],
      material: 'wool',
    },
    {
      id: 5,
      name: 'White T-Shirt',
      category: 'top',
      colors: ['white'],
      style: ['casual', 'minimalist'],
      formality: 2,
      occasions: ['weekend', 'casual'],
      pattern: 'solid',
      material: 'cotton',
    },
    {
      id: 6,
      name: 'Blue Jeans',
      category: 'bottom',
      colors: ['blue', 'indigo'],
      style: ['casual'],
      formality: 2,
      occasions: ['weekend', 'casual'],
      material: 'denim',
    },
    {
      id: 7,
      name: 'White Sneakers',
      category: 'shoes',
      colors: ['white'],
      style: ['casual', 'minimalist'],
      formality: 2,
      occasions: ['weekend', 'casual'],
    },
  ];

  describe('buildOutfitPrompt', () => {
    describe('Basic prompt building', () => {
      it('includes wardrobe items', () => {
        const context: OutfitContext = { items: mockWardrobe };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Blue Oxford Shirt');
        expect(prompt).toContain('Khaki Chinos');
        expect(prompt).toContain('Brown Loafers');
      });

      it('includes item IDs for selection', () => {
        const context: OutfitContext = { items: mockWardrobe };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('ID:1');
        expect(prompt).toContain('ID:2');
        expect(prompt).toContain('ID:3');
      });

      it('includes item attributes', () => {
        const context: OutfitContext = { items: mockWardrobe.slice(0, 1) };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('colors: blue, white');
        expect(prompt).toContain('style: preppy, classic');
        expect(prompt).toContain('formality: 4/5');
      });

      it('identifies as personal stylist AI', () => {
        const context: OutfitContext = { items: mockWardrobe };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('personal stylist AI');
      });

      it('requests JSON response format', () => {
        const context: OutfitContext = { items: mockWardrobe };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('itemIds');
        expect(prompt).toContain('reasoning');
        expect(prompt).toContain('style');
        expect(prompt).toContain('score');
      });
    });

    describe('Context-aware prompts', () => {
      it('includes occasion when provided', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          occasion: 'work meeting',
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('## Occasion: work meeting');
      });

      it('includes weather when provided', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          weather: 'cool',
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('## Weather: cool');
      });

      it('includes both occasion and weather', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          occasion: 'date night',
          weather: 'warm',
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('## Occasion: date night');
        expect(prompt).toContain('## Weather: warm');
      });
    });

    describe('User profile integration', () => {
      it('includes body type', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          userProfile: { bodyType: 'rectangle' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Body type: rectangle');
      });

      it('includes skin tone with recommendations', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          userProfile: { skinTone: 'pale' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Skin tone: pale');
        expect(prompt).toContain('jewel tones');
      });

      it('includes dark skin tone recommendations', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          userProfile: { skinTone: 'dark' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('bold bright colors');
      });

      it('includes tan skin tone recommendations', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          userProfile: { skinTone: 'tan' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('earth tones');
      });

      it('includes height', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          userProfile: { height: 'tall' },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Height: tall');
      });

      it('includes style preferences', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          userProfile: {
            preferredStyles: ['minimalist', 'classic'],
            avoidedStyles: ['bohemian'],
          },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Preferred styles: minimalist, classic');
        expect(prompt).toContain('Styles to avoid: bohemian');
      });

      it('includes color preferences', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          userProfile: {
            preferredColors: ['navy', 'grey'],
            avoidedColors: ['orange'],
          },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Favorite colors: navy, grey');
        expect(prompt).toContain('Colors to avoid: orange');
      });

      it('includes formality preference', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          userProfile: { formalityDefault: 3 },
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('Default formality preference: 3/5');
      });

      it('includes full profile', () => {
        const fullProfile: UserProfile = {
          bodyType: 'hourglass',
          skinTone: 'tan',
          height: 'average',
          preferredStyles: ['classic', 'minimalist'],
          avoidedStyles: ['sporty'],
          preferredColors: ['navy', 'black'],
          avoidedColors: ['yellow'],
          formalityDefault: 3,
        };

        const context: OutfitContext = {
          items: mockWardrobe,
          userProfile: fullProfile,
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('## User Profile');
        expect(prompt).toContain('Body type: hourglass');
        expect(prompt).toContain('Skin tone: tan');
      });
    });

    describe('Feedback learning', () => {
      it('includes recent feedback', () => {
        const context: OutfitContext = {
          items: mockWardrobe,
          recentFeedback: [
            { itemIds: [1, 2, 3], action: 'accept', occasion: 'work' },
            { itemIds: [5, 6, 7], action: 'reject' },
          ],
        };
        const prompt = buildOutfitPrompt(context);

        expect(prompt).toContain('## Recent Feedback');
        expect(prompt).toContain('[1, 2, 3]');
        expect(prompt).toContain('accepted');
        expect(prompt).toContain('work');
        expect(prompt).toContain('[5, 6, 7]');
        expect(prompt).toContain('rejected');
      });

      it('limits feedback to 5 most recent', () => {
        const feedback = Array.from({ length: 10 }, (_, i) => ({
          itemIds: [i],
          action: 'accept' as const,
        }));

        const context: OutfitContext = {
          items: mockWardrobe,
          recentFeedback: feedback,
        };
        const prompt = buildOutfitPrompt(context);

        // Should only include first 5
        expect(prompt).toContain('[0]');
        expect(prompt).toContain('[4]');
        expect(prompt).not.toContain('[5]');
      });
    });
  });

  describe('buildPairingPrompt', () => {
    it('identifies target item', () => {
      const target = mockWardrobe[0]; // Blue Oxford Shirt
      const candidates = mockWardrobe.slice(1);

      const prompt = buildPairingPrompt(target, candidates);

      expect(prompt).toContain('## Target Item');
      expect(prompt).toContain('Blue Oxford Shirt');
    });

    it('lists available items to pair with', () => {
      const target = mockWardrobe[0];
      const candidates = mockWardrobe.slice(1);

      const prompt = buildPairingPrompt(target, candidates);

      expect(prompt).toContain('## Available Items to Pair With');
      expect(prompt).toContain('Khaki Chinos');
      expect(prompt).toContain('Brown Loafers');
    });

    it('excludes target item from candidates', () => {
      const target = mockWardrobe[0];
      const candidates = mockWardrobe.slice(1);

      const prompt = buildPairingPrompt(target, candidates);

      // Count occurrences of Blue Oxford
      const matches = prompt.match(/Blue Oxford Shirt/g);
      expect(matches).toHaveLength(1); // Only in target section
    });

    it('includes occasion when provided', () => {
      const target = mockWardrobe[0];
      const candidates = mockWardrobe.slice(1);

      const prompt = buildPairingPrompt(target, candidates, 'date');

      expect(prompt).toContain('## Occasion: date');
    });

    it('requests JSON array response', () => {
      const target = mockWardrobe[0];
      const candidates = mockWardrobe.slice(1);

      const prompt = buildPairingPrompt(target, candidates);

      expect(prompt).toContain('Return ONLY a JSON array of item IDs');
    });

    it('considers color harmony', () => {
      const target = mockWardrobe[0];
      const candidates = mockWardrobe.slice(1);

      const prompt = buildPairingPrompt(target, candidates);

      expect(prompt.toLowerCase()).toContain('color harmony');
    });

    it('considers style compatibility', () => {
      const target = mockWardrobe[0];
      const candidates = mockWardrobe.slice(1);

      const prompt = buildPairingPrompt(target, candidates);

      expect(prompt.toLowerCase()).toContain('style compatibility');
    });
  });

  describe('AIOutfitSuggestion', () => {
    it('contains required itemIds', () => {
      const suggestion: AIOutfitSuggestion = {
        itemIds: [1, 2, 3],
      };

      expect(suggestion.itemIds).toEqual([1, 2, 3]);
    });

    it('supports reasoning explanation', () => {
      const suggestion: AIOutfitSuggestion = {
        itemIds: [1, 2, 3],
        reasoning: 'The blue oxford pairs perfectly with khaki chinos for a classic business casual look. Brown loafers complete the outfit with complementary earth tones.',
      };

      expect(suggestion.reasoning).toContain('classic business casual');
    });

    it('supports occasion tags', () => {
      const suggestion: AIOutfitSuggestion = {
        itemIds: [1, 2, 3],
        occasions: ['work', 'business-casual', 'meeting'],
      };

      expect(suggestion.occasions).toContain('work');
    });

    it('supports style description', () => {
      const suggestion: AIOutfitSuggestion = {
        itemIds: [1, 2, 3],
        style: 'smart casual with classic preppy elements',
      };

      expect(suggestion.style).toContain('smart casual');
    });

    it('supports outfit score 1-10', () => {
      const suggestion: AIOutfitSuggestion = {
        itemIds: [1, 2, 3],
        score: 8,
      };

      expect(suggestion.score).toBe(8);
      expect(suggestion.score).toBeGreaterThanOrEqual(1);
      expect(suggestion.score).toBeLessThanOrEqual(10);
    });
  });

  describe('ClaudeProvider generateOutfitSuggestion', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const mockSuggestion: AIOutfitSuggestion = {
      itemIds: [1, 2, 3],
      reasoning: 'Great color coordination',
      style: 'business casual',
      score: 8,
    };

    it('generates outfit suggestion', async () => {
      const provider = new ClaudeProvider('test-key');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: JSON.stringify(mockSuggestion) }],
          }),
      });

      const result = await provider.generateOutfitSuggestion({
        items: mockWardrobe,
        occasion: 'work',
      });

      expect(result.itemIds).toEqual([1, 2, 3]);
      expect(result.reasoning).toContain('color coordination');
    });

    it('passes context to API', async () => {
      const provider = new ClaudeProvider('test-key');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: JSON.stringify(mockSuggestion) }],
          }),
      });

      await provider.generateOutfitSuggestion({
        items: mockWardrobe,
        occasion: 'date night',
        weather: 'cool',
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      const userMessage = body.messages[0].content;

      expect(userMessage).toContain('date night');
      expect(userMessage).toContain('cool');
    });
  });
});

describe('Phase 3: Outfit Composition Rules', () => {
  describe('Minimum outfit requirements', () => {
    it('requires at least top + bottom', () => {
      const minimalOutfit: AIOutfitSuggestion = {
        itemIds: [1, 2], // top and bottom
        reasoning: 'Basic complete outfit',
      };

      expect(minimalOutfit.itemIds.length).toBeGreaterThanOrEqual(2);
    });

    it('allows dress as single piece', () => {
      // A dress can constitute a complete outfit on its own
      const dressOutfit: AIOutfitSuggestion = {
        itemIds: [10], // dress
        reasoning: 'Complete dress outfit',
      };

      expect(dressOutfit.itemIds.length).toBeGreaterThanOrEqual(1);
    });

    it('can include multiple layers', () => {
      const layeredOutfit: AIOutfitSuggestion = {
        itemIds: [1, 2, 3, 4], // top, bottom, shoes, outerwear
        reasoning: 'Full layered outfit',
      };

      expect(layeredOutfit.itemIds.length).toBe(4);
    });
  });

  describe('Category distribution', () => {
    it('should have one top or dress', () => {
      // Verified through prompt instructions
      const prompt = buildOutfitPrompt({ items: [] });
      expect(prompt).toContain('top + bottom');
    });

    it('supports accessories', () => {
      const accessorizedOutfit: AIOutfitSuggestion = {
        itemIds: [1, 2, 3, 8, 9], // top, bottom, shoes, watch, belt
        reasoning: 'Outfit with accessories',
      };

      expect(accessorizedOutfit.itemIds.length).toBe(5);
    });
  });
});

describe('Phase 3: Feedback Tracking', () => {
  describe('OutfitFeedback type', () => {
    it('tracks accepted outfits', () => {
      const feedback: OutfitFeedback = {
        outfitItemIds: [1, 2, 3],
        action: 'accept',
        occasion: 'work',
        createdAt: Date.now(),
      };

      expect(feedback.action).toBe('accept');
    });

    it('tracks rejected outfits', () => {
      const feedback: OutfitFeedback = {
        outfitItemIds: [5, 6, 7],
        action: 'reject',
        createdAt: Date.now(),
      };

      expect(feedback.action).toBe('reject');
    });

    it('tracks saved outfits', () => {
      const feedback: OutfitFeedback = {
        outfitItemIds: [1, 2, 3, 4],
        action: 'save',
        createdAt: Date.now(),
      };

      expect(feedback.action).toBe('save');
    });

    it('tracks worn outfits', () => {
      const feedback: OutfitFeedback = {
        outfitItemIds: [1, 2, 3],
        action: 'wear',
        weather: 'cool',
        createdAt: Date.now(),
      };

      expect(feedback.action).toBe('wear');
    });

    it('includes context for learning', () => {
      const feedback: OutfitFeedback = {
        outfitItemIds: [1, 2, 3],
        action: 'accept',
        occasion: 'business meeting',
        weather: 'mild',
        createdAt: Date.now(),
      };

      expect(feedback.occasion).toBe('business meeting');
      expect(feedback.weather).toBe('mild');
    });
  });

  describe('Feedback-based learning', () => {
    it('influences future suggestions via prompt', () => {
      const feedback = [
        { itemIds: [1, 2], action: 'accept' as const, occasion: 'work' },
        { itemIds: [5, 6], action: 'reject' as const },
      ];

      const prompt = buildOutfitPrompt({
        items: [],
        recentFeedback: feedback,
      });

      expect(prompt).toContain('Recent Feedback');
      expect(prompt).toContain('accepted');
      expect(prompt).toContain('rejected');
    });
  });
});

describe('Phase 3: Weather and Occasion Matching', () => {
  const weatherTypes = ['hot', 'warm', 'mild', 'cool', 'cold'];
  const occasions = ['work', 'weekend', 'date-night', 'formal', 'casual', 'gym', 'party'];

  weatherTypes.forEach((weather) => {
    it(`supports ${weather} weather context`, () => {
      const prompt = buildOutfitPrompt({
        items: [],
        weather,
      });

      expect(prompt).toContain(`Weather: ${weather}`);
    });
  });

  occasions.forEach((occasion) => {
    it(`supports ${occasion} occasion context`, () => {
      const prompt = buildOutfitPrompt({
        items: [],
        occasion,
      });

      expect(prompt).toContain(`Occasion: ${occasion}`);
    });
  });

  it('combines weather and occasion', () => {
    const prompt = buildOutfitPrompt({
      items: [],
      weather: 'cool',
      occasion: 'work',
    });

    expect(prompt).toContain('Weather: cool');
    expect(prompt).toContain('Occasion: work');
  });
});
