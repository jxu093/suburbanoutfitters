import type { AIAnalysisResult, AIOutfitSuggestion, Item } from '../app/types';
import { itemToSummary, AIProviderError } from '../app/services/ai/ai-provider';
import { ClaudeProvider } from '../app/services/ai/claude-provider';
import { buildOutfitPrompt, buildInspirationPrompt, buildPairingPrompt } from '../app/services/ai/prompts';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('itemToSummary', () => {
  test('converts Item to ItemSummary correctly', () => {
    const item: Item = {
      id: 1,
      name: 'Blue Oxford Shirt',
      category: 'top',
      aiCategory: 'top',
      aiSubcategory: 'oxford',
      aiColors: ['blue', 'white'],
      aiColorFamily: 'cool',
      aiStyle: ['preppy', 'casual'],
      aiFormality: 3,
      aiOccasions: ['work', 'weekend'],
      aiPattern: 'solid',
      aiMaterial: 'cotton',
      aiSeasons: ['spring', 'fall'],
      aiWeatherSuitability: ['mild', 'cool'],
    };

    const summary = itemToSummary(item);

    expect(summary).toEqual({
      id: 1,
      name: 'Blue Oxford Shirt',
      category: 'top',
      colors: ['blue', 'white'],
      style: ['preppy', 'casual'],
      formality: 3,
      occasions: ['work', 'weekend'],
      pattern: 'solid',
      material: 'cotton',
      seasons: ['spring', 'fall'],
      weatherSuitability: ['mild', 'cool'],
    });
  });

  test('uses category as fallback when aiCategory is missing', () => {
    const item: Item = {
      id: 2,
      name: 'Simple Pants',
      category: 'bottom',
    };

    const summary = itemToSummary(item);

    expect(summary.category).toBe('bottom');
  });

  test('uses "unknown" when both category and aiCategory are missing', () => {
    const item: Item = {
      id: 3,
      name: 'Mystery Item',
    };

    const summary = itemToSummary(item);

    expect(summary.category).toBe('unknown');
  });

  test('handles null AI attribute values', () => {
    const item: Item = {
      id: 4,
      name: 'Item with nulls',
      category: 'top',
      aiColors: null,
      aiStyle: null,
    };

    const summary = itemToSummary(item);

    expect(summary.colors).toBeUndefined();
    expect(summary.style).toBeUndefined();
  });
});

describe('AIProviderError', () => {
  test('creates error with code', () => {
    const error = new AIProviderError('Test error', 'NO_API_KEY');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('NO_API_KEY');
    expect(error.name).toBe('AIProviderError');
  });

  test('supports all error codes', () => {
    const codes = ['NO_API_KEY', 'RATE_LIMITED', 'INVALID_KEY', 'NETWORK', 'PARSE_ERROR', 'UNKNOWN'] as const;

    codes.forEach((code) => {
      const error = new AIProviderError(`Error: ${code}`, code);
      expect(error.code).toBe(code);
    });
  });
});

describe('ClaudeProvider', () => {
  const mockAnalysisResult: AIAnalysisResult = {
    category: 'top',
    subcategory: 't-shirt',
    colors: ['navy', 'white'],
    colorFamily: 'cool',
    style: ['casual', 'minimalist'],
    formality: 2,
    occasions: ['weekend', 'casual'],
    pattern: 'striped',
    material: 'cotton',
    seasons: ['spring', 'summer'],
    weatherSuitability: ['warm', 'mild'],
    confidence: 0.92,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('analyzeImage calls Claude API with correct format', async () => {
    const provider = new ClaudeProvider('test-api-key');

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: JSON.stringify(mockAnalysisResult) }],
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
    });

    const result = await provider.analyzeImage('base64-image-data');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
          'anthropic-version': '2023-06-01',
        }),
      })
    );

    expect(result).toEqual(mockAnalysisResult);
  });

  test('throws INVALID_KEY error on 401 response', async () => {
    const provider = new ClaudeProvider('invalid-key');

    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid API key' }),
    });

    await expect(provider.analyzeImage('base64-image')).rejects.toThrow('Invalid API key');
  });

  test('throws RATE_LIMITED error on 429 response', async () => {
    const provider = new ClaudeProvider('test-key');

    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({}),
    });

    await expect(provider.analyzeImage('base64-image')).rejects.toThrow('Rate limited');
  });

  test('throws PARSE_ERROR when response is not valid JSON', async () => {
    const provider = new ClaudeProvider('test-key');

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: 'This is not JSON' }],
        }),
    });

    await expect(provider.analyzeImage('base64-image')).rejects.toThrow();
  });

  test('extracts JSON from response with extra text', async () => {
    const provider = new ClaudeProvider('test-key');

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ text: `Here's the analysis:\n${JSON.stringify(mockAnalysisResult)}\n\nHope this helps!` }],
        }),
    });

    const result = await provider.analyzeImage('base64-image');

    expect(result).toEqual(mockAnalysisResult);
  });
});

describe('Prompt Builders', () => {
  const mockItems = [
    {
      id: 1,
      name: 'Navy T-Shirt',
      category: 'top',
      colors: ['navy'],
      style: ['casual'],
      formality: 2,
      occasions: ['weekend'],
    },
    {
      id: 2,
      name: 'Blue Jeans',
      category: 'bottom',
      colors: ['blue'],
      style: ['casual'],
      formality: 2,
      occasions: ['weekend'],
    },
  ];

  describe('buildOutfitPrompt', () => {
    test('includes wardrobe items', () => {
      const prompt = buildOutfitPrompt({ items: mockItems });

      expect(prompt).toContain('Navy T-Shirt');
      expect(prompt).toContain('Blue Jeans');
      expect(prompt).toContain('ID:1');
      expect(prompt).toContain('ID:2');
    });

    test('includes occasion when provided', () => {
      const prompt = buildOutfitPrompt({ items: mockItems, occasion: 'date night' });

      expect(prompt).toContain('Occasion: date night');
    });

    test('includes weather when provided', () => {
      const prompt = buildOutfitPrompt({ items: mockItems, weather: 'warm' });

      expect(prompt).toContain('Weather: warm');
    });

    test('includes user profile with skin tone recommendations', () => {
      const prompt = buildOutfitPrompt({
        items: mockItems,
        userProfile: {
          skinTone: 'pale',
          bodyType: 'hourglass',
          preferredStyles: ['minimalist'],
        },
      });

      expect(prompt).toContain('Skin tone: pale');
      expect(prompt).toContain('Body type: hourglass');
      expect(prompt).toContain('jewel tones'); // skin tone recommendation
    });

    test('includes recent feedback', () => {
      const prompt = buildOutfitPrompt({
        items: mockItems,
        recentFeedback: [
          { itemIds: [1, 2], action: 'accept', occasion: 'casual' },
          { itemIds: [1, 3], action: 'reject' },
        ],
      });

      expect(prompt).toContain('Recent Feedback');
      expect(prompt).toContain('[1, 2]');
      expect(prompt).toContain('accepted');
    });
  });

  describe('buildInspirationPrompt', () => {
    test('includes wardrobe items', () => {
      const prompt = buildInspirationPrompt(mockItems);

      expect(prompt).toContain('Navy T-Shirt');
      expect(prompt).toContain('Blue Jeans');
    });

    test('requests correct response format', () => {
      const prompt = buildInspirationPrompt(mockItems);

      expect(prompt).toContain('matchedItemIds');
      expect(prompt).toContain('missingItems');
      expect(prompt).toContain('matchScore');
    });
  });

  describe('buildPairingPrompt', () => {
    test('includes target item', () => {
      const prompt = buildPairingPrompt(mockItems[0], mockItems.slice(1));

      expect(prompt).toContain('Target Item');
      expect(prompt).toContain('Navy T-Shirt');
    });

    test('includes candidate items', () => {
      const prompt = buildPairingPrompt(mockItems[0], mockItems.slice(1));

      expect(prompt).toContain('Available Items');
      expect(prompt).toContain('Blue Jeans');
    });

    test('includes occasion when provided', () => {
      const prompt = buildPairingPrompt(mockItems[0], mockItems.slice(1), 'work');

      expect(prompt).toContain('Occasion: work');
    });
  });
});
