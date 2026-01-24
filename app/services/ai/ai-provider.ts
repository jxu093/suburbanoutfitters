import type { AIAnalysisResult, AIOutfitSuggestion, AIShoppingRecommendations, Item, UserProfile } from '../../types';

// AI Provider response wrapper
export type AIResponse = {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  model?: string;
};

// Context for outfit generation
export type OutfitContext = {
  items: ItemSummary[];
  occasion?: string;
  weather?: string;
  userProfile?: UserProfile;
  recentFeedback?: FeedbackSummary[];
};

// Simplified item info for AI prompts (to reduce token usage)
export type ItemSummary = {
  id: number;
  name: string;
  category: string;
  colors?: string[];
  style?: string[];
  formality?: number;
  occasions?: string[];
  pattern?: string;
  material?: string;
  seasons?: string[];
  weatherSuitability?: string[];
};

// Feedback summary for learning
export type FeedbackSummary = {
  itemIds: number[];
  action: 'accept' | 'reject';
  occasion?: string;
};

// Inspiration match result
export type InspirationMatch = {
  matchedItemIds: number[];
  missingItems: {
    category: string;
    description: string;
    colors?: string[];
    style?: string[];
  }[];
  overallStyle: string[];
  colorPalette: string[];
  matchScore: number;
};

// Context for shopping recommendations
export type ShoppingContext = {
  currentItems: ItemSummary[];
  occasion?: string;
  weather?: string;
  userProfile?: UserProfile;
  budget?: 'budget' | 'moderate' | 'premium' | 'luxury';
};

// Provider interface - all AI providers must implement this
export interface AIProvider {
  readonly name: string;

  // Analyze a clothing item image
  analyzeImage(imageBase64: string): Promise<AIAnalysisResult>;

  // Generate outfit suggestions
  generateOutfitSuggestion(context: OutfitContext): Promise<AIOutfitSuggestion>;

  // Match inspiration photo to wardrobe
  matchInspiration(
    inspoImageBase64: string,
    wardrobeItems: ItemSummary[]
  ): Promise<InspirationMatch>;

  // Suggest items to pair with a given item
  suggestPairings(
    item: ItemSummary,
    candidateItems: ItemSummary[],
    occasion?: string
  ): Promise<number[]>;

  // Generate shopping recommendations for new items to buy
  generateShoppingRecommendations(
    context: ShoppingContext
  ): Promise<AIShoppingRecommendations>;
}

// Convert full Item to ItemSummary for AI context
export function itemToSummary(item: Item): ItemSummary {
  return {
    id: item.id!,
    name: item.name,
    category: item.aiCategory || item.category || 'unknown',
    colors: item.aiColors ?? undefined,
    style: item.aiStyle ?? undefined,
    formality: item.aiFormality ?? undefined,
    occasions: item.aiOccasions ?? undefined,
    pattern: item.aiPattern ?? undefined,
    material: item.aiMaterial ?? undefined,
    seasons: item.aiSeasons ?? undefined,
    weatherSuitability: item.aiWeatherSuitability ?? undefined,
  };
}

// Error types for AI operations
export class AIProviderError extends Error {
  constructor(
    message: string,
    public code: 'NO_API_KEY' | 'RATE_LIMITED' | 'INVALID_KEY' | 'NETWORK' | 'PARSE_ERROR' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
