/**
 * E2E Integration Tests
 *
 * Tests complete user flows that span multiple phases:
 * - Adding an item with AI analysis
 * - Setting up user profile
 * - Generating AI outfit suggestions
 * - Matching inspiration photos
 * - Shopping for missing items
 */

import type {
  Item,
  UserProfile,
  AIAnalysisResult,
  AIOutfitSuggestion,
  OutfitFeedback,
} from '../types';
import type { InspirationMatch, ItemSummary, OutfitContext } from '../services/ai/ai-provider';
import { itemToSummary, AIProviderError } from '../services/ai/ai-provider';
import { ClaudeProvider } from '../services/ai/claude-provider';
import { buildOutfitPrompt, buildInspirationPrompt, ITEM_ANALYSIS_PROMPT } from '../services/ai/prompts';
import { affiliateService } from '../services/affiliate/affiliate-service';

// Mock fetch for all API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('E2E: Complete Add Item Flow', () => {
  /**
   * Flow: User adds new clothing item
   * 1. User takes/selects photo
   * 2. AI analyzes image
   * 3. Attributes are extracted
   * 4. Item is saved with AI tags
   * 5. Item is available in wardrobe
   */

  const mockAnalysisResult: AIAnalysisResult = {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('analyzes photo and extracts all attributes', async () => {
    const provider = new ClaudeProvider('test-key');

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: JSON.stringify(mockAnalysisResult) }],
        }),
    });

    // Step 1: Analyze the image
    const analysisResult = await provider.analyzeImage('base64-image-data');

    // Step 2: Verify all attributes extracted
    expect(analysisResult.category).toBe('top');
    expect(analysisResult.subcategory).toBe('oxford');
    expect(analysisResult.colors).toContain('blue');
    expect(analysisResult.style).toContain('preppy');
    expect(analysisResult.formality).toBe(4);
    expect(analysisResult.confidence).toBeGreaterThan(0.9);
  });

  it('maps analysis result to item attributes', () => {
    // Step 3: Create item with AI attributes
    const item: Item = {
      id: 1,
      name: 'Blue Oxford Shirt',
      category: mockAnalysisResult.category!,
      imageUri: 'file:///images/shirt.jpg',
      thumbUri: 'file:///thumbs/shirt.jpg',
      // Map AI analysis to item
      aiCategory: mockAnalysisResult.category,
      aiSubcategory: mockAnalysisResult.subcategory,
      aiColors: mockAnalysisResult.colors,
      aiColorFamily: mockAnalysisResult.colorFamily,
      aiStyle: mockAnalysisResult.style,
      aiFormality: mockAnalysisResult.formality,
      aiOccasions: mockAnalysisResult.occasions,
      aiPattern: mockAnalysisResult.pattern,
      aiMaterial: mockAnalysisResult.material,
      aiSeasons: mockAnalysisResult.seasons,
      aiWeatherSuitability: mockAnalysisResult.weatherSuitability,
      aiConfidence: mockAnalysisResult.confidence,
      aiAnalyzedAt: Date.now(),
    };

    expect(item.aiCategory).toBe('top');
    expect(item.aiColors).toEqual(['blue', 'white']);
  });

  it('item is ready for outfit generation', () => {
    const item: Item = {
      id: 1,
      name: 'Blue Oxford Shirt',
      category: 'top',
      aiCategory: 'top',
      aiColors: ['blue', 'white'],
      aiStyle: ['preppy', 'classic'],
      aiFormality: 4,
    };

    // Convert to summary for AI prompts
    const summary = itemToSummary(item);

    expect(summary.id).toBe(1);
    expect(summary.colors).toEqual(['blue', 'white']);
    expect(summary.style).toEqual(['preppy', 'classic']);
  });
});

describe('E2E: Profile Setup and Personalized Suggestions', () => {
  /**
   * Flow: User sets up profile, gets personalized suggestions
   * 1. User completes profile (body type, skin tone, height)
   * 2. User sets style preferences
   * 3. User generates outfit
   * 4. AI considers profile in suggestions
   * 5. User provides feedback
   * 6. Future suggestions improve
   */

  const mockWardrobe: ItemSummary[] = [
    { id: 1, name: 'Navy Polo', category: 'top', colors: ['navy'], style: ['casual', 'preppy'], formality: 3 },
    { id: 2, name: 'Khaki Chinos', category: 'bottom', colors: ['khaki'], style: ['casual'], formality: 3 },
    { id: 3, name: 'White Sneakers', category: 'shoes', colors: ['white'], style: ['casual'], formality: 2 },
    { id: 4, name: 'Navy Blazer', category: 'outerwear', colors: ['navy'], style: ['classic'], formality: 4 },
    { id: 5, name: 'Brown Loafers', category: 'shoes', colors: ['brown'], style: ['classic'], formality: 4 },
  ];

  it('builds personalized prompt from user profile', () => {
    // Step 1: Complete profile
    const profile: UserProfile = {
      bodyType: 'rectangle',
      skinTone: 'pale',
      height: 'tall',
      preferredStyles: ['classic', 'minimalist'],
      avoidedStyles: ['bohemian'],
      preferredColors: ['navy', 'grey', 'white'],
      avoidedColors: ['orange', 'yellow'],
      formalityDefault: 3,
    };

    // Step 2: Generate outfit context
    const context: OutfitContext = {
      items: mockWardrobe,
      occasion: 'work',
      weather: 'cool',
      userProfile: profile,
    };

    // Step 3: Build prompt
    const prompt = buildOutfitPrompt(context);

    // Step 4: Verify personalization in prompt
    expect(prompt).toContain('Body type: rectangle');
    expect(prompt).toContain('Skin tone: pale');
    expect(prompt).toContain('jewel tones'); // Pale skin recommendation
    expect(prompt).toContain('Preferred styles: classic, minimalist');
    expect(prompt).toContain('Styles to avoid: bohemian');
    expect(prompt).toContain('Favorite colors: navy, grey, white');
    expect(prompt).toContain('Colors to avoid: orange, yellow');
  });

  it('incorporates feedback in future suggestions', () => {
    const profile: UserProfile = {
      skinTone: 'tan',
      acceptedCount: 10,
      rejectedCount: 3,
    };

    // Step 5: Record feedback
    const feedback = [
      { itemIds: [1, 2, 3], action: 'accept' as const, occasion: 'casual' },
      { itemIds: [1, 4, 5], action: 'accept' as const, occasion: 'work' },
      { itemIds: [3, 2, 5], action: 'reject' as const }, // Bad combo
    ];

    const context: OutfitContext = {
      items: mockWardrobe,
      userProfile: profile,
      recentFeedback: feedback,
    };

    const prompt = buildOutfitPrompt(context);

    // Step 6: Verify feedback is included
    expect(prompt).toContain('Recent Feedback');
    expect(prompt).toContain('accepted');
    expect(prompt).toContain('rejected');
    expect(prompt).toContain('[1, 2, 3]');
  });

  it('applies skin tone color recommendations', () => {
    const skinTones: Array<{ tone: UserProfile['skinTone']; expectedRecommendation: string }> = [
      { tone: 'pale', expectedRecommendation: 'jewel tones' },
      { tone: 'tan', expectedRecommendation: 'earth tones' },
      { tone: 'dark', expectedRecommendation: 'bold bright colors' },
    ];

    skinTones.forEach(({ tone, expectedRecommendation }) => {
      const context: OutfitContext = {
        items: mockWardrobe,
        userProfile: { skinTone: tone },
      };

      const prompt = buildOutfitPrompt(context);
      expect(prompt).toContain(expectedRecommendation);
    });
  });
});

describe('E2E: Inspiration Matching to Shopping', () => {
  /**
   * Flow: User uploads inspiration, matches wardrobe, shops for missing items
   * 1. User uploads inspiration photo
   * 2. AI analyzes inspiration outfit
   * 3. AI matches items from wardrobe
   * 4. AI identifies missing pieces
   * 5. User can shop for missing items
   * 6. User saves matched outfit
   */

  const mockWardrobe: ItemSummary[] = [
    { id: 1, name: 'White T-Shirt', category: 'top', colors: ['white'], style: ['casual', 'minimalist'] },
    { id: 2, name: 'Blue Jeans', category: 'bottom', colors: ['blue', 'indigo'], style: ['casual'] },
    { id: 3, name: 'Black Sneakers', category: 'shoes', colors: ['black'], style: ['casual', 'sporty'] },
  ];

  const mockMatchResult: InspirationMatch = {
    matchedItemIds: [1, 2],
    missingItems: [
      {
        category: 'shoes',
        description: 'White leather sneakers with minimal branding',
        colors: ['white'],
        style: ['minimalist', 'clean'],
      },
      {
        category: 'accessory',
        description: 'Silver watch with leather strap',
        colors: ['silver', 'brown'],
        style: ['classic'],
      },
    ],
    overallStyle: ['casual', 'minimalist', 'clean'],
    colorPalette: ['white', 'blue', 'silver'],
    matchScore: 0.6,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes full inspiration matching flow', async () => {
    const provider = new ClaudeProvider('test-key');

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: JSON.stringify(mockMatchResult) }],
        }),
    });

    // Step 1-2: Upload and analyze inspiration
    const result = await provider.matchInspiration('base64-inspiration-image', mockWardrobe);

    // Step 3: Verify matched items
    expect(result.matchedItemIds).toContain(1); // White T-Shirt
    expect(result.matchedItemIds).toContain(2); // Blue Jeans
    expect(result.matchedItemIds).not.toContain(3); // Black Sneakers not matched

    // Step 4: Verify missing items identified
    expect(result.missingItems).toHaveLength(2);
    expect(result.missingItems[0].category).toBe('shoes');
    expect(result.missingItems[0].description).toContain('White leather sneakers');
  });

  it('generates shopping links for missing items', () => {
    // Step 5: Generate shopping links for each missing item
    mockMatchResult.missingItems.forEach((missing) => {
      const links = affiliateService.getShoppingLinksForMissingItem({
        category: missing.category,
        description: missing.description,
        colors: missing.colors,
        style: missing.style,
      });

      expect(links.amazon).toContain('amazon.com');
      expect(links.google).toContain('google.com');
      expect(links.amazon).toContain(encodeURIComponent(missing.description));
    });
  });

  it('provides match score interpretation', () => {
    const { matchScore } = mockMatchResult;

    // 60% match - partial match
    expect(matchScore).toBeGreaterThanOrEqual(0.4);
    expect(matchScore).toBeLessThan(0.7);

    const matchQuality =
      matchScore >= 0.7 ? 'great' :
      matchScore >= 0.4 ? 'partial' : 'low';

    expect(matchQuality).toBe('partial');
  });

  it('allows saving matched items as outfit', () => {
    // Step 6: User can save the matched items as an outfit
    const matchedItems = mockWardrobe.filter((item) =>
      mockMatchResult.matchedItemIds.includes(item.id)
    );

    expect(matchedItems).toHaveLength(2);
    expect(matchedItems.map((i) => i.name)).toContain('White T-Shirt');
    expect(matchedItems.map((i) => i.name)).toContain('Blue Jeans');

    // Outfit would be saved with these item IDs
    const outfitItemIds = matchedItems.map((i) => i.id);
    expect(outfitItemIds).toEqual([1, 2]);
  });
});

describe('E2E: AI Outfit Generation with Shopping', () => {
  /**
   * Flow: Generate AI outfit, user can shop similar items
   * 1. User requests outfit for occasion/weather
   * 2. AI generates outfit suggestion
   * 3. User reviews suggestion
   * 4. User can shop for similar items
   * 5. User accepts/rejects outfit
   * 6. Feedback recorded for learning
   */

  const mockWardrobe: ItemSummary[] = [
    { id: 1, name: 'Blue Oxford', category: 'top', colors: ['blue'], style: ['preppy'], formality: 4 },
    { id: 2, name: 'Khaki Chinos', category: 'bottom', colors: ['khaki'], style: ['casual'], formality: 3 },
    { id: 3, name: 'Brown Loafers', category: 'shoes', colors: ['brown'], style: ['classic'], formality: 4 },
    { id: 4, name: 'Navy Blazer', category: 'outerwear', colors: ['navy'], style: ['formal'], formality: 4 },
  ];

  const mockSuggestion: AIOutfitSuggestion = {
    itemIds: [1, 2, 3, 4],
    reasoning: 'Classic business casual outfit with cohesive earth and blue tones. The blazer elevates the look for work meetings.',
    style: 'smart casual',
    score: 8,
    occasions: ['work', 'business-casual'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates outfit for specific occasion', async () => {
    const provider = new ClaudeProvider('test-key');

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: JSON.stringify(mockSuggestion) }],
        }),
    });

    // Step 1-2: Request and generate outfit
    const result = await provider.generateOutfitSuggestion({
      items: mockWardrobe,
      occasion: 'work meeting',
      weather: 'cool',
    });

    // Step 3: Review suggestion
    expect(result.itemIds).toEqual([1, 2, 3, 4]);
    expect(result.reasoning).toContain('business casual');
    expect(result.score).toBe(8);
  });

  it('provides shop similar for each outfit item', () => {
    // Step 4: Shop similar for each item in suggestion
    const suggestedItems = mockWardrobe.filter((item) =>
      mockSuggestion.itemIds.includes(item.id)
    );

    suggestedItems.forEach((item) => {
      const links = affiliateService.getShoppingLinksForSimilarItem({
        name: item.name,
        category: item.category,
        colors: item.colors,
        style: item.style,
      });

      expect(links.amazon).toContain('amazon.com');
      expect(links.amazon).toContain(encodeURIComponent(item.name));
    });
  });

  it('tracks user feedback', () => {
    // Step 5-6: Accept outfit and record feedback
    const feedback: OutfitFeedback = {
      outfitItemIds: mockSuggestion.itemIds,
      action: 'accept',
      occasion: 'work meeting',
      weather: 'cool',
      createdAt: Date.now(),
    };

    expect(feedback.action).toBe('accept');
    expect(feedback.outfitItemIds).toEqual([1, 2, 3, 4]);
    expect(feedback.occasion).toBe('work meeting');
  });
});

describe('E2E: Error Handling Across Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles API key errors gracefully', async () => {
    const provider = new ClaudeProvider('invalid-key');

    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid API key' }),
    });

    await expect(provider.analyzeImage('base64')).rejects.toThrow(AIProviderError);
  });

  it('handles rate limiting gracefully', async () => {
    const provider = new ClaudeProvider('valid-key');

    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({}),
    });

    await expect(provider.analyzeImage('base64')).rejects.toThrow('Rate limited');
  });

  it('handles network errors gracefully', async () => {
    const provider = new ClaudeProvider('valid-key');

    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(provider.analyzeImage('base64')).rejects.toThrow();
  });

  it('handles malformed AI responses', async () => {
    const provider = new ClaudeProvider('valid-key');

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: 'This is not valid JSON' }],
        }),
    });

    await expect(provider.analyzeImage('base64')).rejects.toThrow();
  });

  it('shopping links work even without AI', () => {
    // Shopping should work independently of AI
    const links = affiliateService.getShoppingLinks('blue jeans');

    expect(links.amazon).toContain('amazon.com');
    expect(links.google).toContain('google.com');
  });
});

describe('E2E: Item Pairing Flow', () => {
  /**
   * Flow: User selects item, gets pairing suggestions
   * 1. User views item in wardrobe
   * 2. User requests "What goes with this?"
   * 3. AI suggests compatible items
   * 4. User can shop for similar items
   */

  const mockWardrobe: ItemSummary[] = [
    { id: 1, name: 'Navy Blazer', category: 'outerwear', colors: ['navy'], style: ['formal'], formality: 4 },
    { id: 2, name: 'White Dress Shirt', category: 'top', colors: ['white'], style: ['formal'], formality: 5 },
    { id: 3, name: 'Grey Wool Trousers', category: 'bottom', colors: ['grey'], style: ['formal'], formality: 4 },
    { id: 4, name: 'Brown Oxfords', category: 'shoes', colors: ['brown'], style: ['formal'], formality: 5 },
    { id: 5, name: 'Blue Jeans', category: 'bottom', colors: ['blue'], style: ['casual'], formality: 2 },
    { id: 6, name: 'White Sneakers', category: 'shoes', colors: ['white'], style: ['casual'], formality: 2 },
  ];

  it('suggests compatible items for selected piece', async () => {
    const provider = new ClaudeProvider('test-key');

    // Step 1: User selects Navy Blazer
    const selectedItem = mockWardrobe[0];

    // Step 2: Get candidates (all items except the selected one)
    const candidates = mockWardrobe.filter((i) => i.id !== selectedItem.id);

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: '[2, 3, 4]' }], // Formal items that pair well
        }),
    });

    // Step 3: AI suggests pairings
    const result = await provider.suggestPairings(selectedItem, candidates, 'work');

    expect(result).toContain(2); // White Dress Shirt
    expect(result).toContain(3); // Grey Wool Trousers
    expect(result).toContain(4); // Brown Oxfords
    expect(result).not.toContain(5); // Blue Jeans - too casual
  });

  it('allows shopping for similar pairing items', () => {
    // Step 4: Shop similar for paired items
    const pairedItem = mockWardrobe[1]; // White Dress Shirt

    const links = affiliateService.getShoppingLinksForSimilarItem({
      name: pairedItem.name,
      category: pairedItem.category,
      colors: pairedItem.colors,
      style: pairedItem.style,
    });

    expect(links.amazon).toContain('White%20Dress%20Shirt');
    expect(links.google).toContain('White%20Dress%20Shirt');
  });
});

describe('E2E: Weather-Aware Outfit Generation', () => {
  const mockWardrobe: ItemSummary[] = [
    { id: 1, name: 'Light Cotton Tee', category: 'top', colors: ['white'], weatherSuitability: ['hot', 'warm'] },
    { id: 2, name: 'Wool Sweater', category: 'top', colors: ['grey'], weatherSuitability: ['cool', 'cold'] },
    { id: 3, name: 'Linen Shorts', category: 'bottom', colors: ['beige'], weatherSuitability: ['hot'] },
    { id: 4, name: 'Wool Trousers', category: 'bottom', colors: ['charcoal'], weatherSuitability: ['cool', 'cold'] },
    { id: 5, name: 'Sandals', category: 'shoes', colors: ['brown'], weatherSuitability: ['hot', 'warm'] },
    { id: 6, name: 'Leather Boots', category: 'shoes', colors: ['brown'], weatherSuitability: ['cool', 'cold'] },
    { id: 7, name: 'Winter Coat', category: 'outerwear', colors: ['black'], weatherSuitability: ['cold'] },
  ];

  it('considers weather in outfit context', () => {
    // Hot weather outfit request
    const hotContext: OutfitContext = {
      items: mockWardrobe,
      weather: 'hot',
    };

    const hotPrompt = buildOutfitPrompt(hotContext);
    expect(hotPrompt).toContain('Weather: hot');

    // Cold weather outfit request
    const coldContext: OutfitContext = {
      items: mockWardrobe,
      weather: 'cold',
    };

    const coldPrompt = buildOutfitPrompt(coldContext);
    expect(coldPrompt).toContain('Weather: cold');
  });

  it('includes weather suitability in item summaries', () => {
    const summerItem = mockWardrobe[0];
    const winterItem = mockWardrobe[6];

    expect(summerItem.weatherSuitability).toContain('hot');
    expect(winterItem.weatherSuitability).toContain('cold');
  });
});

describe('E2E: Full Wardrobe to Outfit Journey', () => {
  /**
   * Complete journey from empty wardrobe to styled outfit
   */

  it('supports the complete user journey', async () => {
    const provider = new ClaudeProvider('test-key');

    // 1. User adds items to wardrobe with AI analysis
    const analysisResults: AIAnalysisResult[] = [
      { category: 'top', subcategory: 'polo', colors: ['navy'], style: ['casual', 'preppy'], formality: 3 },
      { category: 'bottom', subcategory: 'chinos', colors: ['khaki'], style: ['casual'], formality: 3 },
      { category: 'shoes', subcategory: 'loafers', colors: ['brown'], style: ['classic'], formality: 4 },
    ];

    // 2. Build wardrobe from analyzed items
    const wardrobe: ItemSummary[] = analysisResults.map((result, idx) => ({
      id: idx + 1,
      name: `${result.colors![0]} ${result.subcategory}`,
      category: result.category!,
      colors: result.colors,
      style: result.style,
      formality: result.formality,
    }));

    expect(wardrobe).toHaveLength(3);

    // 3. User sets up profile
    const profile: UserProfile = {
      skinTone: 'tan',
      preferredStyles: ['casual', 'classic'],
      profileCompleted: true,
    };

    // 4. User requests outfit
    const context: OutfitContext = {
      items: wardrobe,
      occasion: 'weekend brunch',
      weather: 'warm',
      userProfile: profile,
    };

    // 5. AI generates suggestion
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{
            text: JSON.stringify({
              itemIds: [1, 2, 3],
              reasoning: 'Perfect weekend casual look',
              style: 'smart casual',
              score: 9,
            }),
          }],
        }),
    });

    const suggestion = await provider.generateOutfitSuggestion(context);

    // 6. Verify complete outfit
    expect(suggestion.itemIds).toEqual([1, 2, 3]);
    expect(suggestion.score).toBe(9);

    // 7. User can shop for similar items
    wardrobe.forEach((item) => {
      const links = affiliateService.getShoppingLinksForSimilarItem({
        name: item.name,
        category: item.category,
        colors: item.colors,
      });
      expect(links.amazon).toBeDefined();
      expect(links.google).toBeDefined();
    });

    // 8. User accepts outfit - feedback recorded
    const feedback: OutfitFeedback = {
      outfitItemIds: suggestion.itemIds,
      action: 'accept',
      occasion: 'weekend brunch',
      createdAt: Date.now(),
    };

    expect(feedback.action).toBe('accept');
  });
});
