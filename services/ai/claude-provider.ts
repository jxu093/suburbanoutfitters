import type {
  AIAnalysisResult,
  AINaturalLanguageResponse,
  AIOutfitSuggestion,
  AIPurchaseSuggestions,
  AIShoppingRecommendations,
  AISlotSuggestions,
} from '@/types';
import type {
  AIProvider,
  AIResponse,
  InspirationMatch,
  ItemSummary,
  NLContext,
  OutfitContext,
  ShoppingContext,
  SlotContext,
} from './ai-provider';
import { AIProviderError } from './ai-provider';
import {
  ITEM_ANALYSIS_PROMPT,
  buildOutfitPrompt,
  buildInspirationPrompt,
  buildNaturalLanguagePrompt,
  buildPairingPrompt,
  buildShoppingRecommendationPrompt,
  buildSlotPurchasePrompt,
  buildSlotSuggestionPrompt,
} from './prompts';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || DEFAULT_MODEL;
  }

  private async callAPI(
    messages: { role: string; content: unknown }[],
    maxTokens = 1024
  ): Promise<AIResponse> {
    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new AIProviderError('Invalid API key', 'INVALID_KEY');
        }
        if (response.status === 429) {
          throw new AIProviderError('Rate limited, please try again later', 'RATE_LIMITED');
        }
        throw new AIProviderError(
          error.message || `API error: ${response.status}`,
          'UNKNOWN'
        );
      }

      const data = await response.json();

      return {
        content: data.content?.[0]?.text || '',
        usage: data.usage
          ? {
              inputTokens: data.usage.input_tokens,
              outputTokens: data.usage.output_tokens,
            }
          : undefined,
        model: data.model,
      };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError(
        error instanceof Error ? error.message : 'Network error',
        'NETWORK'
      );
    }
  }

  private parseJSON<T>(text: string): T {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new AIProviderError('No JSON found in response', 'PARSE_ERROR');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new AIProviderError('Failed to parse JSON response', 'PARSE_ERROR');
    }
  }

  async analyzeImage(imageBase64: string): Promise<AIAnalysisResult> {
    const response = await this.callAPI([
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: ITEM_ANALYSIS_PROMPT,
          },
        ],
      },
    ]);

    return this.parseJSON<AIAnalysisResult>(response.content);
  }

  async generateOutfitSuggestion(context: OutfitContext): Promise<AIOutfitSuggestion> {
    const prompt = buildOutfitPrompt(context);

    const response = await this.callAPI([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return this.parseJSON<AIOutfitSuggestion>(response.content);
  }

  async matchInspiration(
    inspoImageBase64: string,
    wardrobeItems: ItemSummary[]
  ): Promise<InspirationMatch> {
    const prompt = buildInspirationPrompt(wardrobeItems);

    const response = await this.callAPI([
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: inspoImageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ]);

    return this.parseJSON<InspirationMatch>(response.content);
  }

  async suggestPairings(
    item: ItemSummary,
    candidateItems: ItemSummary[],
    occasion?: string
  ): Promise<number[]> {
    const prompt = buildPairingPrompt(item, candidateItems, occasion);

    const response = await this.callAPI([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return this.parseJSON<number[]>(response.content);
  }

  async generateShoppingRecommendations(
    context: ShoppingContext
  ): Promise<AIShoppingRecommendations> {
    const prompt = buildShoppingRecommendationPrompt(context);

    const response = await this.callAPI([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return this.parseJSON<AIShoppingRecommendations>(response.content);
  }

  async suggestItemsForSlot(context: SlotContext): Promise<AISlotSuggestions> {
    const prompt = buildSlotSuggestionPrompt(context);

    const response = await this.callAPI([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return this.parseJSON<AISlotSuggestions>(response.content);
  }

  async suggestPurchasesForSlot(context: SlotContext): Promise<AIPurchaseSuggestions> {
    const prompt = buildSlotPurchasePrompt(context);

    const response = await this.callAPI([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return this.parseJSON<AIPurchaseSuggestions>(response.content);
  }

  async processNaturalLanguage(context: NLContext): Promise<AINaturalLanguageResponse> {
    const prompt = buildNaturalLanguagePrompt(context);

    const response = await this.callAPI(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      2048 // Allow longer responses for natural language
    );

    return this.parseJSON<AINaturalLanguageResponse>(response.content);
  }
}
