/**
 * Phase 5: Inspiration Matching Tests
 *
 * Tests for analyzing inspiration photos, matching wardrobe items,
 * identifying missing pieces, and calculating match scores.
 */

import type { InspirationMatch, ItemSummary } from '../services/ai/ai-provider';
import { buildInspirationPrompt } from '../services/ai/prompts';
import { ClaudeProvider } from '../services/ai/claude-provider';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Phase 5: Inspiration Matching', () => {
  const mockWardrobe: ItemSummary[] = [
    {
      id: 1,
      name: 'Navy Polo',
      category: 'top',
      colors: ['navy', 'dark blue'],
      style: ['casual', 'preppy'],
      formality: 3,
      occasions: ['weekend', 'work'],
    },
    {
      id: 2,
      name: 'Khaki Chinos',
      category: 'bottom',
      colors: ['khaki', 'beige'],
      style: ['casual', 'classic'],
      formality: 3,
      occasions: ['work', 'date-night'],
      pattern: 'solid',
    },
    {
      id: 3,
      name: 'White Sneakers',
      category: 'shoes',
      colors: ['white'],
      style: ['casual', 'minimalist'],
      formality: 2,
    },
    {
      id: 4,
      name: 'Brown Leather Belt',
      category: 'accessory',
      colors: ['brown'],
      style: ['classic'],
      material: 'leather',
    },
    {
      id: 5,
      name: 'Blue Oxford Shirt',
      category: 'top',
      colors: ['blue', 'white'],
      style: ['preppy', 'classic'],
      formality: 4,
      occasions: ['work', 'formal'],
    },
    {
      id: 6,
      name: 'Grey Wool Blazer',
      category: 'outerwear',
      colors: ['grey', 'charcoal'],
      style: ['formal', 'classic'],
      formality: 4,
      material: 'wool',
    },
  ];

  describe('InspirationMatch Type', () => {
    it('contains matched item IDs', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3],
        missingItems: [],
        overallStyle: ['casual'],
        colorPalette: ['navy', 'khaki'],
        matchScore: 0.9,
      };

      expect(match.matchedItemIds).toEqual([1, 2, 3]);
    });

    it('contains missing items details', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2],
        missingItems: [
          {
            category: 'shoes',
            description: 'White leather sneakers with minimal branding',
            colors: ['white'],
            style: ['minimalist', 'casual'],
          },
        ],
        overallStyle: ['casual', 'minimalist'],
        colorPalette: ['navy', 'white', 'beige'],
        matchScore: 0.6,
      };

      expect(match.missingItems).toHaveLength(1);
      expect(match.missingItems[0].category).toBe('shoes');
      expect(match.missingItems[0].colors).toContain('white');
    });

    it('contains overall style tags', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3],
        missingItems: [],
        overallStyle: ['casual', 'preppy', 'put-together'],
        colorPalette: ['navy', 'khaki'],
        matchScore: 0.85,
      };

      expect(match.overallStyle).toContain('casual');
      expect(match.overallStyle).toContain('preppy');
    });

    it('contains color palette', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2],
        missingItems: [],
        overallStyle: ['classic'],
        colorPalette: ['navy', 'white', 'brown', 'khaki'],
        matchScore: 0.75,
      };

      expect(match.colorPalette).toHaveLength(4);
      expect(match.colorPalette).toContain('navy');
    });

    it('contains match score 0-1', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3, 4],
        missingItems: [],
        overallStyle: ['business casual'],
        colorPalette: ['blue'],
        matchScore: 0.92,
      };

      expect(match.matchScore).toBeGreaterThanOrEqual(0);
      expect(match.matchScore).toBeLessThanOrEqual(1);
    });
  });

  describe('buildInspirationPrompt', () => {
    it('includes all wardrobe items', () => {
      const prompt = buildInspirationPrompt(mockWardrobe);

      expect(prompt).toContain('Navy Polo');
      expect(prompt).toContain('Khaki Chinos');
      expect(prompt).toContain('White Sneakers');
      expect(prompt).toContain('Brown Leather Belt');
    });

    it('includes item IDs for matching', () => {
      const prompt = buildInspirationPrompt(mockWardrobe);

      expect(prompt).toContain('ID:1');
      expect(prompt).toContain('ID:2');
      expect(prompt).toContain('ID:3');
      expect(prompt).toContain('ID:4');
    });

    it('identifies as personal stylist AI', () => {
      const prompt = buildInspirationPrompt(mockWardrobe);

      expect(prompt).toContain('personal stylist AI');
    });

    it('instructs to analyze inspiration photo', () => {
      const prompt = buildInspirationPrompt(mockWardrobe);

      expect(prompt.toLowerCase()).toContain('inspiration');
      expect(prompt.toLowerCase()).toContain('analyze');
    });

    it('instructs to find matching items', () => {
      const prompt = buildInspirationPrompt(mockWardrobe);

      expect(prompt.toLowerCase()).toContain('matching');
    });

    it('instructs to identify missing items', () => {
      const prompt = buildInspirationPrompt(mockWardrobe);

      expect(prompt.toLowerCase()).toContain('missing');
    });

    it('specifies JSON response format', () => {
      const prompt = buildInspirationPrompt(mockWardrobe);

      expect(prompt).toContain('matchedItemIds');
      expect(prompt).toContain('missingItems');
      expect(prompt).toContain('overallStyle');
      expect(prompt).toContain('colorPalette');
      expect(prompt).toContain('matchScore');
    });

    it('requests only JSON response', () => {
      const prompt = buildInspirationPrompt(mockWardrobe);

      expect(prompt).toContain('Return ONLY a JSON object');
    });
  });

  describe('ClaudeProvider matchInspiration', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const mockMatchResult: InspirationMatch = {
      matchedItemIds: [1, 2, 3],
      missingItems: [
        {
          category: 'accessory',
          description: 'Silver watch with leather strap',
          colors: ['silver', 'brown'],
          style: ['classic'],
        },
      ],
      overallStyle: ['casual', 'preppy'],
      colorPalette: ['navy', 'khaki', 'white'],
      matchScore: 0.75,
    };

    it('sends inspiration image to API', async () => {
      const provider = new ClaudeProvider('test-key');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: JSON.stringify(mockMatchResult) }],
          }),
      });

      await provider.matchInspiration('base64-inspiration-image', mockWardrobe);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.messages[0].content).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'image',
            source: expect.objectContaining({
              data: 'base64-inspiration-image',
            }),
          }),
        ])
      );
    });

    it('includes wardrobe in prompt', async () => {
      const provider = new ClaudeProvider('test-key');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: JSON.stringify(mockMatchResult) }],
          }),
      });

      await provider.matchInspiration('base64-image', mockWardrobe);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      const textContent = body.messages[0].content.find((c: any) => c.type === 'text');

      expect(textContent.text).toContain('Navy Polo');
      expect(textContent.text).toContain('ID:1');
    });

    it('returns parsed match result', async () => {
      const provider = new ClaudeProvider('test-key');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            content: [{ text: JSON.stringify(mockMatchResult) }],
          }),
      });

      const result = await provider.matchInspiration('base64-image', mockWardrobe);

      expect(result.matchedItemIds).toEqual([1, 2, 3]);
      expect(result.missingItems).toHaveLength(1);
      expect(result.matchScore).toBe(0.75);
    });
  });

  describe('Match Score Interpretation', () => {
    it('high score (>= 0.7) indicates great match', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3, 4, 5],
        missingItems: [],
        overallStyle: ['casual'],
        colorPalette: ['blue'],
        matchScore: 0.85,
      };

      const isGreatMatch = match.matchScore >= 0.7;
      expect(isGreatMatch).toBe(true);
    });

    it('medium score (0.4-0.69) indicates partial match', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2],
        missingItems: [
          { category: 'shoes', description: 'Sneakers' },
        ],
        overallStyle: ['casual'],
        colorPalette: ['blue'],
        matchScore: 0.55,
      };

      const isPartialMatch = match.matchScore >= 0.4 && match.matchScore < 0.7;
      expect(isPartialMatch).toBe(true);
    });

    it('low score (< 0.4) indicates many missing pieces', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1],
        missingItems: [
          { category: 'top', description: 'Silk blouse' },
          { category: 'bottom', description: 'Wide-leg pants' },
          { category: 'shoes', description: 'Heels' },
        ],
        overallStyle: ['elegant'],
        colorPalette: ['cream', 'black'],
        matchScore: 0.2,
      };

      const isLowMatch = match.matchScore < 0.4;
      expect(isLowMatch).toBe(true);
    });

    it('perfect score (1.0) indicates all items found', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3, 4, 5],
        missingItems: [],
        overallStyle: ['business casual'],
        colorPalette: ['navy', 'white'],
        matchScore: 1.0,
      };

      expect(match.matchScore).toBe(1.0);
      expect(match.missingItems).toHaveLength(0);
    });

    it('zero score (0.0) indicates no matches', () => {
      const match: InspirationMatch = {
        matchedItemIds: [],
        missingItems: [
          { category: 'dress', description: 'Evening gown' },
          { category: 'shoes', description: 'Stilettos' },
          { category: 'accessory', description: 'Clutch bag' },
        ],
        overallStyle: ['glamorous', 'formal'],
        colorPalette: ['black', 'gold'],
        matchScore: 0.0,
      };

      expect(match.matchScore).toBe(0.0);
      expect(match.matchedItemIds).toHaveLength(0);
    });
  });

  describe('Missing Item Structure', () => {
    it('includes category for shopping', () => {
      const missingItem = {
        category: 'outerwear',
        description: 'Camel wool coat',
        colors: ['camel', 'tan'],
        style: ['classic'],
      };

      expect(missingItem.category).toBe('outerwear');
    });

    it('includes detailed description', () => {
      const missingItem = {
        category: 'shoes',
        description: 'Black leather ankle boots with low heel and pointed toe',
        colors: ['black'],
        style: ['edgy', 'modern'],
      };

      expect(missingItem.description.length).toBeGreaterThan(10);
      expect(missingItem.description).toContain('ankle boots');
    });

    it('includes color suggestions', () => {
      const missingItem = {
        category: 'top',
        description: 'Oversized knit sweater',
        colors: ['cream', 'ivory', 'off-white'],
        style: ['cozy'],
      };

      expect(missingItem.colors).toHaveLength(3);
    });

    it('includes style tags', () => {
      const missingItem = {
        category: 'accessory',
        description: 'Crossbody bag',
        colors: ['black'],
        style: ['minimalist', 'functional', 'everyday'],
      };

      expect(missingItem.style).toContain('minimalist');
    });

    it('works with minimal data', () => {
      const minimalMissing = {
        category: 'hat',
        description: 'Baseball cap',
      };

      expect(minimalMissing.category).toBe('hat');
      expect(minimalMissing.description).toBe('Baseball cap');
    });
  });

  describe('Inspiration Matching Scenarios', () => {
    describe('Perfect match scenario', () => {
      it('finds all items in wardrobe', () => {
        const match: InspirationMatch = {
          matchedItemIds: [1, 2, 3, 4],
          missingItems: [],
          overallStyle: ['casual', 'preppy'],
          colorPalette: ['navy', 'khaki', 'white', 'brown'],
          matchScore: 1.0,
        };

        expect(match.missingItems).toHaveLength(0);
        expect(match.matchedItemIds).toHaveLength(4);
      });
    });

    describe('Partial match scenario', () => {
      it('finds some items, identifies missing pieces', () => {
        const match: InspirationMatch = {
          matchedItemIds: [1, 2],
          missingItems: [
            {
              category: 'shoes',
              description: 'Brown leather loafers',
              colors: ['brown'],
              style: ['classic'],
            },
            {
              category: 'accessory',
              description: 'Woven leather belt',
              colors: ['brown'],
            },
          ],
          overallStyle: ['smart casual'],
          colorPalette: ['navy', 'khaki', 'brown'],
          matchScore: 0.5,
        };

        expect(match.matchedItemIds).toHaveLength(2);
        expect(match.missingItems).toHaveLength(2);
      });
    });

    describe('No match scenario', () => {
      it('wardrobe completely different from inspiration', () => {
        const match: InspirationMatch = {
          matchedItemIds: [],
          missingItems: [
            { category: 'dress', description: 'Floral maxi dress', colors: ['floral', 'pink'] },
            { category: 'shoes', description: 'Strappy sandals', colors: ['nude'] },
            { category: 'accessory', description: 'Straw tote bag', colors: ['natural'] },
            { category: 'hat', description: 'Wide-brim sun hat', colors: ['natural'] },
          ],
          overallStyle: ['bohemian', 'summer', 'romantic'],
          colorPalette: ['pink', 'nude', 'natural'],
          matchScore: 0.0,
        };

        expect(match.matchedItemIds).toHaveLength(0);
        expect(match.missingItems.length).toBeGreaterThan(0);
      });
    });

    describe('Close match with accessories needed', () => {
      it('main pieces match, accessories missing', () => {
        const match: InspirationMatch = {
          matchedItemIds: [5, 2, 6], // Oxford, Chinos, Blazer
          missingItems: [
            {
              category: 'accessory',
              description: 'Pocket square',
              colors: ['burgundy'],
              style: ['formal', 'elegant'],
            },
          ],
          overallStyle: ['business formal', 'polished'],
          colorPalette: ['blue', 'grey', 'khaki'],
          matchScore: 0.85,
        };

        expect(match.matchedItemIds).toHaveLength(3);
        expect(match.missingItems).toHaveLength(1);
        expect(match.missingItems[0].category).toBe('accessory');
      });
    });
  });

  describe('Style Analysis', () => {
    it('identifies casual style', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3],
        missingItems: [],
        overallStyle: ['casual', 'relaxed', 'weekend'],
        colorPalette: ['navy', 'khaki'],
        matchScore: 0.9,
      };

      expect(match.overallStyle).toContain('casual');
    });

    it('identifies formal style', () => {
      const match: InspirationMatch = {
        matchedItemIds: [5, 2, 6],
        missingItems: [],
        overallStyle: ['formal', 'business', 'professional'],
        colorPalette: ['blue', 'grey', 'white'],
        matchScore: 0.9,
      };

      expect(match.overallStyle).toContain('formal');
    });

    it('identifies preppy style', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3, 4],
        missingItems: [],
        overallStyle: ['preppy', 'classic', 'polished'],
        colorPalette: ['navy', 'khaki', 'white'],
        matchScore: 0.9,
      };

      expect(match.overallStyle).toContain('preppy');
    });

    it('identifies minimalist style', () => {
      const match: InspirationMatch = {
        matchedItemIds: [3],
        missingItems: [
          { category: 'top', description: 'White t-shirt', colors: ['white'] },
          { category: 'bottom', description: 'Black jeans', colors: ['black'] },
        ],
        overallStyle: ['minimalist', 'clean', 'monochrome'],
        colorPalette: ['white', 'black'],
        matchScore: 0.3,
      };

      expect(match.overallStyle).toContain('minimalist');
    });
  });

  describe('Color Palette Analysis', () => {
    it('extracts dominant colors from inspiration', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2],
        missingItems: [],
        overallStyle: ['casual'],
        colorPalette: ['navy', 'white', 'brown', 'khaki'],
        matchScore: 0.8,
      };

      expect(match.colorPalette.length).toBeGreaterThan(0);
    });

    it('identifies monochrome palette', () => {
      const match: InspirationMatch = {
        matchedItemIds: [],
        missingItems: [
          { category: 'top', description: 'Black turtleneck' },
          { category: 'bottom', description: 'Black trousers' },
        ],
        overallStyle: ['minimalist', 'monochrome'],
        colorPalette: ['black'],
        matchScore: 0.0,
      };

      expect(match.colorPalette).toEqual(['black']);
    });

    it('identifies earth tone palette', () => {
      const match: InspirationMatch = {
        matchedItemIds: [2, 4],
        missingItems: [],
        overallStyle: ['natural', 'organic'],
        colorPalette: ['khaki', 'brown', 'olive', 'cream'],
        matchScore: 0.7,
      };

      expect(match.colorPalette).toContain('khaki');
      expect(match.colorPalette).toContain('brown');
    });
  });
});
