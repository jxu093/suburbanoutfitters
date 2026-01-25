import { buildOutfitPrompt, buildPairingPrompt } from '../services/ai/prompts';
import type { OutfitContext, ItemSummary } from '../services/ai/ai-provider';
import type { UserProfile } from '../types';

describe('AI Outfit Generation Prompts', () => {
  const mockItems: ItemSummary[] = [
    {
      id: 1,
      name: 'Blue Oxford Shirt',
      category: 'top',
      colors: ['blue', 'white'],
      style: ['casual', 'preppy'],
      formality: 3,
      occasions: ['work', 'casual'],
      pattern: 'solid',
    },
    {
      id: 2,
      name: 'Khaki Chinos',
      category: 'bottom',
      colors: ['khaki'],
      style: ['casual', 'classic'],
      formality: 3,
      occasions: ['work', 'casual'],
      pattern: 'solid',
    },
    {
      id: 3,
      name: 'Brown Loafers',
      category: 'shoes',
      colors: ['brown'],
      style: ['classic'],
      formality: 4,
      occasions: ['work', 'formal'],
      pattern: 'solid',
      material: 'leather',
    },
    {
      id: 4,
      name: 'Navy Blazer',
      category: 'outerwear',
      colors: ['navy'],
      style: ['classic', 'preppy'],
      formality: 4,
      occasions: ['work', 'formal'],
      pattern: 'solid',
      material: 'wool',
    },
  ];

  describe('buildOutfitPrompt', () => {
    it('builds a basic prompt with items', () => {
      const context: OutfitContext = {
        items: mockItems,
      };

      const prompt = buildOutfitPrompt(context);

      expect(prompt).toContain('personal stylist AI');
      expect(prompt).toContain('Blue Oxford Shirt');
      expect(prompt).toContain('Khaki Chinos');
      expect(prompt).toContain('Brown Loafers');
      expect(prompt).toContain('itemIds');
      expect(prompt).toContain('reasoning');
    });

    it('includes occasion when provided', () => {
      const context: OutfitContext = {
        items: mockItems,
        occasion: 'work',
      };

      const prompt = buildOutfitPrompt(context);

      expect(prompt).toContain('## Occasion: work');
    });

    it('includes weather when provided', () => {
      const context: OutfitContext = {
        items: mockItems,
        weather: 'cool',
      };

      const prompt = buildOutfitPrompt(context);

      expect(prompt).toContain('## Weather: cool');
    });

    it('includes user profile when provided', () => {
      const profile: UserProfile = {
        bodyType: 'rectangle',
        skinTone: 'pale',
        height: 'average',
        preferredStyles: ['classic', 'minimalist'],
        avoidedStyles: ['bohemian'],
        preferredColors: ['navy', 'grey'],
        avoidedColors: ['orange'],
      };

      const context: OutfitContext = {
        items: mockItems,
        userProfile: profile,
      };

      const prompt = buildOutfitPrompt(context);

      expect(prompt).toContain('## User Profile');
      expect(prompt).toContain('Body type: rectangle');
      expect(prompt).toContain('Skin tone: pale');
      expect(prompt).toContain('Height: average');
      expect(prompt).toContain('Preferred styles: classic, minimalist');
      expect(prompt).toContain('Styles to avoid: bohemian');
    });

    it('includes skin tone color recommendations', () => {
      const context: OutfitContext = {
        items: mockItems,
        userProfile: { skinTone: 'pale' },
      };

      const prompt = buildOutfitPrompt(context);

      expect(prompt).toContain('jewel tones');
      expect(prompt).toContain('navy');
    });

    it('includes dark skin tone recommendations', () => {
      const context: OutfitContext = {
        items: mockItems,
        userProfile: { skinTone: 'dark' },
      };

      const prompt = buildOutfitPrompt(context);

      expect(prompt).toContain('bold bright colors');
      expect(prompt).toContain('white');
    });

    it('includes tan skin tone recommendations', () => {
      const context: OutfitContext = {
        items: mockItems,
        userProfile: { skinTone: 'tan' },
      };

      const prompt = buildOutfitPrompt(context);

      expect(prompt).toContain('earth tones');
      expect(prompt).toContain('coral');
    });

    it('includes recent feedback when provided', () => {
      const context: OutfitContext = {
        items: mockItems,
        recentFeedback: [
          { itemIds: [1, 2], action: 'accept', occasion: 'work' },
          { itemIds: [3, 4], action: 'reject' },
        ],
      };

      const prompt = buildOutfitPrompt(context);

      expect(prompt).toContain('## Recent Feedback');
      expect(prompt).toContain('Items [1, 2] were accepted for work');
      expect(prompt).toContain('Items [3, 4] were rejected');
    });

    it('formats item details correctly', () => {
      const context: OutfitContext = {
        items: mockItems.slice(0, 1),
      };

      const prompt = buildOutfitPrompt(context);

      expect(prompt).toContain('ID:1');
      expect(prompt).toContain('Blue Oxford Shirt');
      expect(prompt).toContain('top');
      expect(prompt).toContain('colors: blue, white');
      expect(prompt).toContain('style: casual, preppy');
      expect(prompt).toContain('formality: 3/5');
    });
  });

  describe('buildPairingPrompt', () => {
    it('builds a prompt for item pairing', () => {
      const targetItem = mockItems[0];
      const candidates = mockItems.slice(1);

      const prompt = buildPairingPrompt(targetItem, candidates);

      expect(prompt).toContain('## Target Item');
      expect(prompt).toContain('Blue Oxford Shirt');
      expect(prompt).toContain('## Available Items to Pair With');
      expect(prompt).toContain('Khaki Chinos');
      expect(prompt).toContain('Brown Loafers');
    });

    it('includes occasion when provided', () => {
      const targetItem = mockItems[0];
      const candidates = mockItems.slice(1);

      const prompt = buildPairingPrompt(targetItem, candidates, 'date');

      expect(prompt).toContain('## Occasion: date');
    });

    it('requests response as JSON array', () => {
      const targetItem = mockItems[0];
      const candidates = mockItems.slice(1);

      const prompt = buildPairingPrompt(targetItem, candidates);

      expect(prompt).toContain('Return ONLY a JSON array of item IDs');
    });
  });
});

describe('Outfit Feedback Types', () => {
  it('feedback actions include accept and reject', () => {
    type Action = 'accept' | 'reject' | 'save' | 'wear';
    const actions: Action[] = ['accept', 'reject', 'save', 'wear'];

    expect(actions).toContain('accept');
    expect(actions).toContain('reject');
  });
});
