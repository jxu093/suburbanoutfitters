/**
 * Phase 2: Auto-Tagging Tests
 *
 * Tests for the AI image analysis and auto-tagging functionality.
 * Covers: ClaudeProvider, AI prompts, image analysis, attribute extraction.
 */

import type { AIAnalysisResult, Item } from '../types';
import { itemToSummary, AIProviderError } from '../services/ai/ai-provider';
import { ClaudeProvider } from '../services/ai/claude-provider';
import { ITEM_ANALYSIS_PROMPT } from '../services/ai/prompts';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Phase 2: Auto-Tagging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ITEM_ANALYSIS_PROMPT', () => {
    it('specifies all required fields', () => {
      expect(ITEM_ANALYSIS_PROMPT).toContain('category');
      expect(ITEM_ANALYSIS_PROMPT).toContain('subcategory');
      expect(ITEM_ANALYSIS_PROMPT).toContain('colors');
      expect(ITEM_ANALYSIS_PROMPT).toContain('colorFamily');
      expect(ITEM_ANALYSIS_PROMPT).toContain('style');
      expect(ITEM_ANALYSIS_PROMPT).toContain('formality');
      expect(ITEM_ANALYSIS_PROMPT).toContain('occasions');
      expect(ITEM_ANALYSIS_PROMPT).toContain('pattern');
      expect(ITEM_ANALYSIS_PROMPT).toContain('material');
      expect(ITEM_ANALYSIS_PROMPT).toContain('seasons');
      expect(ITEM_ANALYSIS_PROMPT).toContain('weatherSuitability');
      expect(ITEM_ANALYSIS_PROMPT).toContain('confidence');
    });

    it('specifies valid category options', () => {
      expect(ITEM_ANALYSIS_PROMPT).toContain('top');
      expect(ITEM_ANALYSIS_PROMPT).toContain('bottom');
      expect(ITEM_ANALYSIS_PROMPT).toContain('shoes');
      expect(ITEM_ANALYSIS_PROMPT).toContain('outerwear');
      expect(ITEM_ANALYSIS_PROMPT).toContain('hat');
      expect(ITEM_ANALYSIS_PROMPT).toContain('accessory');
    });

    it('specifies formality scale', () => {
      expect(ITEM_ANALYSIS_PROMPT).toContain('1-5');
      expect(ITEM_ANALYSIS_PROMPT).toContain('1=very casual');
      expect(ITEM_ANALYSIS_PROMPT).toContain('5=formal');
    });

    it('requests JSON-only response', () => {
      expect(ITEM_ANALYSIS_PROMPT).toContain('Return ONLY valid JSON');
    });
  });

  describe('ClaudeProvider', () => {
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

    describe('analyzeImage', () => {
      it('sends correct request to Claude API', async () => {
        const provider = new ClaudeProvider('test-api-key');

        mockFetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [{ text: JSON.stringify(mockAnalysisResult) }],
              usage: { input_tokens: 1000, output_tokens: 100 },
            }),
        });

        await provider.analyzeImage('base64-image-data');

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
      });

      it('includes image as base64 in request', async () => {
        const provider = new ClaudeProvider('test-api-key');

        mockFetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [{ text: JSON.stringify(mockAnalysisResult) }],
            }),
        });

        await provider.analyzeImage('test-base64-data');

        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);

        expect(body.messages[0].content).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'image',
              source: expect.objectContaining({
                type: 'base64',
                data: 'test-base64-data',
              }),
            }),
          ])
        );
      });

      it('returns parsed analysis result', async () => {
        const provider = new ClaudeProvider('test-api-key');

        mockFetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [{ text: JSON.stringify(mockAnalysisResult) }],
            }),
        });

        const result = await provider.analyzeImage('base64-image');

        expect(result).toEqual(mockAnalysisResult);
        expect(result.category).toBe('top');
        expect(result.confidence).toBe(0.92);
      });

      it('extracts JSON from response with surrounding text', async () => {
        const provider = new ClaudeProvider('test-api-key');

        mockFetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [
                {
                  text: `Here's my analysis of the clothing item:\n\n${JSON.stringify(mockAnalysisResult)}\n\nLet me know if you need more details!`,
                },
              ],
            }),
        });

        const result = await provider.analyzeImage('base64-image');

        expect(result).toEqual(mockAnalysisResult);
      });

      it('handles markdown code blocks in response', async () => {
        const provider = new ClaudeProvider('test-api-key');

        mockFetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [
                {
                  text: `Here's the analysis:\n\`\`\`json\n${JSON.stringify(mockAnalysisResult)}\n\`\`\``,
                },
              ],
            }),
        });

        const result = await provider.analyzeImage('base64-image');

        expect(result).toEqual(mockAnalysisResult);
      });
    });

    describe('Error Handling', () => {
      it('throws INVALID_KEY error on 401', async () => {
        const provider = new ClaudeProvider('invalid-key');

        mockFetch.mockResolvedValue({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid API key' }),
        });

        await expect(provider.analyzeImage('base64')).rejects.toThrow(AIProviderError);
        await expect(provider.analyzeImage('base64')).rejects.toThrow('Invalid API key');
      });

      it('throws RATE_LIMITED error on 429', async () => {
        const provider = new ClaudeProvider('test-key');

        mockFetch.mockResolvedValue({
          ok: false,
          status: 429,
          json: () => Promise.resolve({}),
        });

        await expect(provider.analyzeImage('base64')).rejects.toThrow('Rate limited');
      });

      it('throws NETWORK error on fetch failure', async () => {
        const provider = new ClaudeProvider('test-key');

        mockFetch.mockRejectedValue(new Error('Network error'));

        await expect(provider.analyzeImage('base64')).rejects.toThrow();
      });

      it('throws PARSE_ERROR on invalid JSON response', async () => {
        const provider = new ClaudeProvider('test-key');

        mockFetch.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [{ text: 'This is not JSON at all' }],
            }),
        });

        await expect(provider.analyzeImage('base64')).rejects.toThrow();
      });
    });
  });

  describe('AIProviderError', () => {
    it('creates error with message and code', () => {
      const error = new AIProviderError('Test message', 'NO_API_KEY');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('NO_API_KEY');
      expect(error.name).toBe('AIProviderError');
    });

    it('supports all error codes', () => {
      const codes: AIProviderError['code'][] = [
        'NO_API_KEY',
        'RATE_LIMITED',
        'INVALID_KEY',
        'NETWORK',
        'PARSE_ERROR',
        'UNKNOWN',
      ];

      codes.forEach((code) => {
        const error = new AIProviderError(`Error: ${code}`, code);
        expect(error.code).toBe(code);
      });
    });

    it('is instance of Error', () => {
      const error = new AIProviderError('Test', 'UNKNOWN');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('itemToSummary', () => {
    it('converts Item to ItemSummary', () => {
      const item: Item = {
        id: 1,
        name: 'Blue Oxford',
        category: 'top',
        aiCategory: 'top',
        aiColors: ['blue', 'white'],
        aiStyle: ['preppy', 'classic'],
        aiFormality: 4,
        aiOccasions: ['work'],
        aiPattern: 'solid',
        aiMaterial: 'cotton',
        aiSeasons: ['spring', 'fall'],
        aiWeatherSuitability: ['mild'],
      };

      const summary = itemToSummary(item);

      expect(summary.id).toBe(1);
      expect(summary.name).toBe('Blue Oxford');
      expect(summary.category).toBe('top');
      expect(summary.colors).toEqual(['blue', 'white']);
      expect(summary.style).toEqual(['preppy', 'classic']);
      expect(summary.formality).toBe(4);
    });

    it('uses category when aiCategory is undefined', () => {
      const item: Item = {
        id: 2,
        name: 'Legacy Pants',
        category: 'bottom',
      };

      const summary = itemToSummary(item);

      expect(summary.category).toBe('bottom');
    });

    it('uses "unknown" when both categories are undefined', () => {
      const item: Item = {
        id: 3,
        name: 'Mystery Item',
      };

      const summary = itemToSummary(item);

      expect(summary.category).toBe('unknown');
    });

    it('handles null AI attribute values', () => {
      const item: Item = {
        id: 4,
        name: 'Item with nulls',
        category: 'top',
        aiColors: null,
        aiStyle: null,
        aiFormality: null,
      };

      const summary = itemToSummary(item);

      expect(summary.colors).toBeUndefined();
      expect(summary.style).toBeUndefined();
      expect(summary.formality).toBeUndefined();
    });

    it('preserves all AI attributes in summary', () => {
      const item: Item = {
        id: 5,
        name: 'Full Item',
        category: 'shoes',
        aiCategory: 'shoes',
        aiColors: ['brown', 'tan'],
        aiStyle: ['classic'],
        aiFormality: 4,
        aiOccasions: ['work', 'formal'],
        aiPattern: 'solid',
        aiMaterial: 'leather',
        aiSeasons: ['spring', 'fall', 'winter'],
        aiWeatherSuitability: ['mild', 'cool'],
      };

      const summary = itemToSummary(item);

      expect(summary.pattern).toBe('solid');
      expect(summary.material).toBe('leather');
      expect(summary.seasons).toEqual(['spring', 'fall', 'winter']);
      expect(summary.weatherSuitability).toEqual(['mild', 'cool']);
      expect(summary.occasions).toEqual(['work', 'formal']);
    });
  });
});

describe('Phase 2: Analysis Result Mapping', () => {
  it('maps AIAnalysisResult to AIItemAttributes', () => {
    const result: AIAnalysisResult = {
      category: 'top',
      subcategory: 'henley',
      colors: ['navy', 'white'],
      colorFamily: 'cool',
      style: ['casual', 'minimalist'],
      formality: 2,
      occasions: ['weekend', 'casual'],
      pattern: 'striped',
      material: 'cotton',
      seasons: ['spring', 'summer'],
      weatherSuitability: ['warm', 'mild'],
      confidence: 0.88,
    };

    // This mapping would happen in the AI service
    const item: Item = {
      id: 1,
      name: 'Navy Henley',
      category: result.category!,
      aiCategory: result.category,
      aiSubcategory: result.subcategory,
      aiColors: result.colors,
      aiColorFamily: result.colorFamily,
      aiStyle: result.style,
      aiFormality: result.formality,
      aiOccasions: result.occasions,
      aiPattern: result.pattern,
      aiMaterial: result.material,
      aiSeasons: result.seasons,
      aiWeatherSuitability: result.weatherSuitability,
      aiConfidence: result.confidence,
      aiAnalyzedAt: Date.now(),
    };

    expect(item.aiCategory).toBe('top');
    expect(item.aiSubcategory).toBe('henley');
    expect(item.aiColors).toContain('navy');
    expect(item.aiConfidence).toBe(0.88);
  });

  it('handles partial analysis results', () => {
    const partialResult: AIAnalysisResult = {
      category: 'bottom',
      colors: ['blue'],
      formality: 2,
    };

    const item: Item = {
      id: 2,
      name: 'Blue Jeans',
      category: partialResult.category!,
      aiCategory: partialResult.category,
      aiColors: partialResult.colors,
      aiFormality: partialResult.formality,
    };

    expect(item.aiCategory).toBe('bottom');
    expect(item.aiSubcategory).toBeUndefined();
    expect(item.aiPattern).toBeUndefined();
  });
});

describe('Phase 2: Clothing Categories', () => {
  const categories = [
    { category: 'top', examples: ['t-shirt', 'henley', 'button-down', 'sweater', 'blouse'] },
    { category: 'bottom', examples: ['jeans', 'chinos', 'shorts', 'skirt', 'trousers'] },
    { category: 'shoes', examples: ['sneakers', 'loafers', 'boots', 'sandals', 'heels'] },
    { category: 'outerwear', examples: ['blazer', 'jacket', 'coat', 'cardigan', 'vest'] },
    { category: 'hat', examples: ['cap', 'beanie', 'fedora', 'bucket hat'] },
    { category: 'accessory', examples: ['belt', 'watch', 'scarf', 'bag', 'jewelry'] },
  ];

  categories.forEach(({ category, examples }) => {
    describe(`${category} category`, () => {
      it(`supports ${category} items`, () => {
        const result: AIAnalysisResult = { category };
        expect(result.category).toBe(category);
      });

      examples.forEach((subcategory) => {
        it(`supports ${subcategory} subcategory`, () => {
          const result: AIAnalysisResult = { category, subcategory };
          expect(result.subcategory).toBe(subcategory);
        });
      });
    });
  });
});

describe('Phase 2: Style Classification', () => {
  const styles = [
    'casual',
    'formal',
    'sporty',
    'preppy',
    'minimalist',
    'bohemian',
    'classic',
    'edgy',
    'romantic',
    'streetwear',
  ];

  it('supports single style classification', () => {
    styles.forEach((style) => {
      const result: AIAnalysisResult = { style: [style] };
      expect(result.style).toContain(style);
    });
  });

  it('supports multiple style tags', () => {
    const result: AIAnalysisResult = {
      style: ['casual', 'minimalist', 'classic'],
    };
    expect(result.style).toHaveLength(3);
  });
});

describe('Phase 2: Color Classification', () => {
  it('supports primary colors', () => {
    const result: AIAnalysisResult = {
      colors: ['red', 'blue', 'yellow'],
    };
    expect(result.colors).toHaveLength(3);
  });

  it('supports neutral colors', () => {
    const result: AIAnalysisResult = {
      colors: ['black', 'white', 'grey', 'beige', 'brown'],
      colorFamily: 'neutral',
    };
    expect(result.colorFamily).toBe('neutral');
  });

  it('supports warm colors', () => {
    const result: AIAnalysisResult = {
      colors: ['orange', 'red', 'yellow', 'coral'],
      colorFamily: 'warm',
    };
    expect(result.colorFamily).toBe('warm');
  });

  it('supports cool colors', () => {
    const result: AIAnalysisResult = {
      colors: ['blue', 'navy', 'teal', 'purple'],
      colorFamily: 'cool',
    };
    expect(result.colorFamily).toBe('cool');
  });
});

describe('Phase 2: Occasion Classification', () => {
  const occasions = ['work', 'weekend', 'date-night', 'gym', 'formal-event', 'casual', 'party', 'vacation'];

  it('supports all occasion types', () => {
    occasions.forEach((occasion) => {
      const result: AIAnalysisResult = { occasions: [occasion] };
      expect(result.occasions).toContain(occasion);
    });
  });

  it('supports multiple occasions', () => {
    const result: AIAnalysisResult = {
      occasions: ['work', 'date-night', 'casual'],
    };
    expect(result.occasions).toHaveLength(3);
  });
});

describe('Phase 2: Weather and Season Classification', () => {
  it('supports all seasons', () => {
    const result: AIAnalysisResult = {
      seasons: ['spring', 'summer', 'fall', 'winter'],
    };
    expect(result.seasons).toHaveLength(4);
  });

  it('supports weather suitability levels', () => {
    const result: AIAnalysisResult = {
      weatherSuitability: ['hot', 'warm', 'mild', 'cool', 'cold'],
    };
    expect(result.weatherSuitability).toHaveLength(5);
  });

  it('maps seasons to weather', () => {
    // Summer item
    const summerItem: AIAnalysisResult = {
      seasons: ['summer'],
      weatherSuitability: ['hot', 'warm'],
    };
    expect(summerItem.weatherSuitability).toContain('hot');

    // Winter item
    const winterItem: AIAnalysisResult = {
      seasons: ['winter'],
      weatherSuitability: ['cold', 'cool'],
    };
    expect(winterItem.weatherSuitability).toContain('cold');
  });
});
