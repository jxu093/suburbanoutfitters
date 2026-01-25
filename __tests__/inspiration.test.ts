import type { InspirationMatch, ItemSummary } from '../services/ai/ai-provider';
import { buildInspirationPrompt } from '../services/ai/prompts';

describe('Inspiration Matching', () => {
  describe('InspirationMatch type', () => {
    it('represents matched item IDs from wardrobe', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 5, 12, 8],
        missingItems: [],
        overallStyle: ['casual', 'minimalist'],
        colorPalette: ['navy', 'white', 'grey'],
        matchScore: 0.85,
      };

      expect(match.matchedItemIds).toHaveLength(4);
      expect(match.matchedItemIds).toContain(1);
      expect(match.matchedItemIds).toContain(5);
    });

    it('represents missing items needed to complete the look', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 5],
        missingItems: [
          {
            category: 'shoes',
            description: 'White leather sneakers with minimal branding',
            colors: ['white'],
            style: ['casual', 'minimalist'],
          },
          {
            category: 'accessory',
            description: 'Silver watch with leather strap',
            colors: ['silver', 'brown'],
            style: ['classic'],
          },
        ],
        overallStyle: ['casual'],
        colorPalette: ['blue', 'white'],
        matchScore: 0.45,
      };

      expect(match.missingItems).toHaveLength(2);
      expect(match.missingItems[0].category).toBe('shoes');
      expect(match.missingItems[0].colors).toContain('white');
      expect(match.missingItems[1].description).toContain('Silver watch');
    });

    it('captures overall style of inspiration', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3],
        missingItems: [],
        overallStyle: ['bohemian', 'relaxed', 'artistic'],
        colorPalette: ['earthy', 'terracotta', 'cream'],
        matchScore: 0.72,
      };

      expect(match.overallStyle).toContain('bohemian');
      expect(match.overallStyle).toContain('artistic');
      expect(match.colorPalette).toContain('terracotta');
    });

    it('provides match score as percentage', () => {
      const highMatch: InspirationMatch = {
        matchedItemIds: [1, 2, 3, 4, 5],
        missingItems: [],
        overallStyle: ['casual'],
        colorPalette: ['black'],
        matchScore: 0.95,
      };

      const lowMatch: InspirationMatch = {
        matchedItemIds: [1],
        missingItems: [
          { category: 'top', description: 'Striped shirt', colors: ['blue', 'white'] },
          { category: 'bottom', description: 'Chinos', colors: ['khaki'] },
          { category: 'shoes', description: 'Loafers', colors: ['brown'] },
        ],
        overallStyle: ['preppy'],
        colorPalette: ['blue', 'khaki'],
        matchScore: 0.25,
      };

      expect(highMatch.matchScore).toBeGreaterThan(0.9);
      expect(lowMatch.matchScore).toBeLessThan(0.3);
    });
  });

  describe('buildInspirationPrompt', () => {
    const mockWardrobeItems: ItemSummary[] = [
      {
        id: 1,
        name: 'Navy Polo',
        category: 'top',
        colors: ['navy'],
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
    ];

    it('includes wardrobe context', () => {
      const prompt = buildInspirationPrompt(mockWardrobeItems);

      expect(prompt).toContain('Navy Polo');
      expect(prompt).toContain('Khaki Chinos');
      expect(prompt).toContain('White Sneakers');
    });

    it('includes item IDs for matching', () => {
      const prompt = buildInspirationPrompt(mockWardrobeItems);

      expect(prompt).toContain('ID:1');
      expect(prompt).toContain('ID:2');
      expect(prompt).toContain('ID:3');
    });

    it('specifies expected JSON response format', () => {
      const prompt = buildInspirationPrompt(mockWardrobeItems);

      expect(prompt).toContain('matchedItemIds');
      expect(prompt).toContain('missingItems');
      expect(prompt).toContain('overallStyle');
      expect(prompt).toContain('colorPalette');
      expect(prompt).toContain('matchScore');
    });

    it('instructs AI to identify items in inspiration', () => {
      const prompt = buildInspirationPrompt(mockWardrobeItems);

      expect(prompt.toLowerCase()).toContain('inspiration');
      expect(prompt.toLowerCase()).toContain('identify');
    });

    it('asks for missing items identification', () => {
      const prompt = buildInspirationPrompt(mockWardrobeItems);

      expect(prompt.toLowerCase()).toContain('missing');
    });
  });

  describe('Inspiration matching scenarios', () => {
    it('handles perfect match (all items found)', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3, 4, 5],
        missingItems: [],
        overallStyle: ['business casual'],
        colorPalette: ['navy', 'white', 'brown'],
        matchScore: 1.0,
      };

      expect(match.missingItems).toHaveLength(0);
      expect(match.matchScore).toBe(1.0);
    });

    it('handles partial match', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2],
        missingItems: [
          { category: 'shoes', description: 'Brown leather oxford shoes' },
        ],
        overallStyle: ['formal'],
        colorPalette: ['charcoal', 'white'],
        matchScore: 0.67,
      };

      expect(match.matchedItemIds.length).toBe(2);
      expect(match.missingItems.length).toBe(1);
    });

    it('handles no match (completely different wardrobe)', () => {
      const match: InspirationMatch = {
        matchedItemIds: [],
        missingItems: [
          { category: 'top', description: 'Silk blouse', colors: ['cream'] },
          { category: 'bottom', description: 'Wide-leg trousers', colors: ['black'] },
          { category: 'shoes', description: 'Heeled sandals', colors: ['nude'] },
          { category: 'accessory', description: 'Statement earrings', colors: ['gold'] },
        ],
        overallStyle: ['elegant', 'feminine'],
        colorPalette: ['cream', 'black', 'gold'],
        matchScore: 0.0,
      };

      expect(match.matchedItemIds).toHaveLength(0);
      expect(match.missingItems.length).toBeGreaterThan(0);
      expect(match.matchScore).toBe(0);
    });

    it('handles close-enough matches with style suggestions', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3],
        missingItems: [
          {
            category: 'accessory',
            description: 'Belt to tie the look together',
            colors: ['brown'],
            style: ['classic'],
          },
        ],
        overallStyle: ['smart casual', 'put-together'],
        colorPalette: ['earth tones'],
        matchScore: 0.8,
      };

      // Good match but could be improved with accessories
      expect(match.matchScore).toBeGreaterThanOrEqual(0.7);
      expect(match.missingItems[0].category).toBe('accessory');
    });
  });

  describe('Match score interpretation', () => {
    it('high score (>= 70%) indicates great match', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2, 3, 4],
        missingItems: [],
        overallStyle: ['casual'],
        colorPalette: ['blue'],
        matchScore: 0.85,
      };

      const isGreatMatch = match.matchScore >= 0.7;
      expect(isGreatMatch).toBe(true);
    });

    it('medium score (40-69%) indicates partial match', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1, 2],
        missingItems: [{ category: 'shoes', description: 'Sneakers' }],
        overallStyle: ['sporty'],
        colorPalette: ['white', 'black'],
        matchScore: 0.55,
      };

      const isPartialMatch = match.matchScore >= 0.4 && match.matchScore < 0.7;
      expect(isPartialMatch).toBe(true);
    });

    it('low score (< 40%) indicates many missing pieces', () => {
      const match: InspirationMatch = {
        matchedItemIds: [1],
        missingItems: [
          { category: 'top', description: 'Blazer' },
          { category: 'bottom', description: 'Dress pants' },
          { category: 'shoes', description: 'Oxfords' },
        ],
        overallStyle: ['formal'],
        colorPalette: ['charcoal'],
        matchScore: 0.2,
      };

      const isLowMatch = match.matchScore < 0.4;
      expect(isLowMatch).toBe(true);
    });
  });

  describe('Missing item structure', () => {
    it('includes category for shopping guidance', () => {
      const missingItem = {
        category: 'outerwear',
        description: 'Camel colored wool coat',
        colors: ['camel', 'tan'],
        style: ['classic', 'elegant'],
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

    it('color suggestions help with shopping', () => {
      const missingItem = {
        category: 'top',
        description: 'Oversized knit sweater',
        colors: ['cream', 'ivory', 'off-white'],
        style: ['cozy', 'casual'],
      };

      expect(missingItem.colors).toHaveLength(3);
      expect(missingItem.colors).toContain('cream');
    });

    it('style tags help find right aesthetic', () => {
      const missingItem = {
        category: 'accessory',
        description: 'Crossbody bag',
        colors: ['black'],
        style: ['minimalist', 'functional', 'everyday'],
      };

      expect(missingItem.style).toContain('minimalist');
      expect(missingItem.style).toContain('everyday');
    });
  });
});
