import type { AIAnalysisResult, AIOutfitSuggestion, Item, UserProfile } from '../../types';
import {
  getCachedAIAnalysis,
  getOutfitFeedback,
  getSetting,
  getUserProfile,
  setCachedAIAnalysis,
  setSetting,
  updateItem,
} from '../storage';
import type { AIProvider, InspirationMatch, OutfitContext } from './ai-provider';
import { AIProviderError, itemToSummary } from './ai-provider';
import { ClaudeProvider } from './claude-provider';

// Settings keys
const AI_API_KEY = 'ai_api_key';
const AI_PROVIDER = 'ai_provider';

// TODO: Remove before committing! For development only.
const DEV_API_KEY = ''; // Paste your key here: 'sk-ant-api03-...'

class AIService {
  private provider: AIProvider | null = null;
  private initialized = false;

  // Initialize the AI service with stored credentials
  async initialize(): Promise<boolean> {
    if (this.initialized && this.provider) return true;

    const apiKey = (await getSetting(AI_API_KEY)) || DEV_API_KEY;
    const providerName = await getSetting(AI_PROVIDER);

    if (!apiKey) {
      return false;
    }

    this.provider = this.createProvider(providerName || 'claude', apiKey);
    this.initialized = true;
    return true;
  }

  // Check if AI service is configured
  async isConfigured(): Promise<boolean> {
    const apiKey = (await getSetting(AI_API_KEY)) || DEV_API_KEY;
    return !!apiKey;
  }

  // Configure the AI service
  async configure(apiKey: string, providerName = 'claude'): Promise<void> {
    // Test the API key by making a simple request
    const testProvider = this.createProvider(providerName, apiKey);

    // We don't have a test endpoint, so we'll just store the key
    // The first actual use will validate it
    await setSetting(AI_API_KEY, apiKey);
    await setSetting(AI_PROVIDER, providerName);

    this.provider = testProvider;
    this.initialized = true;
  }

  // Get current provider name
  async getProviderName(): Promise<string | null> {
    return getSetting(AI_PROVIDER);
  }

  // Create provider instance
  private createProvider(name: string, apiKey: string): AIProvider {
    switch (name) {
      case 'claude':
      default:
        return new ClaudeProvider(apiKey);
      // Future providers:
      // case 'openai': return new OpenAIProvider(apiKey);
      // case 'gemini': return new GeminiProvider(apiKey);
    }
  }

  // Ensure provider is ready
  private async ensureProvider(): Promise<AIProvider> {
    if (!this.provider) {
      const initialized = await this.initialize();
      if (!initialized || !this.provider) {
        throw new AIProviderError('AI service not configured. Please add your API key.', 'NO_API_KEY');
      }
    }
    return this.provider;
  }

  // Analyze a clothing item image
  async analyzeClothingItem(
    imageBase64: string,
    itemId?: number
  ): Promise<AIAnalysisResult> {
    // Check cache first (if itemId provided)
    if (itemId) {
      const cached = await getCachedAIAnalysis(itemId);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const provider = await this.ensureProvider();
    const result = await provider.analyzeImage(imageBase64);

    // Cache the result (if itemId provided)
    if (itemId) {
      await setCachedAIAnalysis(itemId, JSON.stringify(result));
    }

    return result;
  }

  // Analyze and update an item in the database
  async analyzeAndUpdateItem(imageBase64: string, itemId: number): Promise<AIAnalysisResult> {
    const result = await this.analyzeClothingItem(imageBase64, itemId);

    // Update the item with AI attributes
    await updateItem(itemId, {
      aiCategory: result.category ?? null,
      aiSubcategory: result.subcategory ?? null,
      aiColors: result.colors ? JSON.stringify(result.colors) : null,
      aiColorFamily: result.colorFamily ?? null,
      aiStyle: result.style ? JSON.stringify(result.style) : null,
      aiFormality: result.formality ?? null,
      aiOccasions: result.occasions ? JSON.stringify(result.occasions) : null,
      aiPattern: result.pattern ?? null,
      aiMaterial: result.material ?? null,
      aiSeasons: result.seasons ? JSON.stringify(result.seasons) : null,
      aiWeatherSuitability: result.weatherSuitability ? JSON.stringify(result.weatherSuitability) : null,
      aiAnalyzedAt: Date.now(),
      aiConfidence: result.confidence ?? null,
    });

    return result;
  }

  // Generate a smart outfit suggestion
  async generateSmartOutfit(
    items: Item[],
    occasion?: string,
    weather?: string,
    overrideProfile?: UserProfile
  ): Promise<AIOutfitSuggestion> {
    const provider = await this.ensureProvider();

    // Get user profile for personalization (use override if provided)
    const profileRow = overrideProfile ? null : await getUserProfile();
    const profile = overrideProfile || (profileRow ? parseUserProfile(profileRow) : null);

    // Get recent feedback for learning
    const feedbackRows = await getOutfitFeedback(10);
    const recentFeedback = feedbackRows.map((row) => ({
      itemIds: JSON.parse(row.outfitItemIds) as number[],
      action: row.action as 'accept' | 'reject',
      occasion: row.occasion ?? undefined,
    }));

    // Build context
    const context: OutfitContext = {
      items: items.filter((item) => item.id).map(itemToSummary),
      occasion,
      weather,
      userProfile: profile || undefined,
      recentFeedback: recentFeedback.length > 0 ? recentFeedback : undefined,
    };

    return provider.generateOutfitSuggestion(context);
  }

  // Match inspiration photo to wardrobe
  async matchInspiration(
    inspoImageBase64: string,
    wardrobeItems: Item[]
  ): Promise<InspirationMatch> {
    const provider = await this.ensureProvider();

    const itemSummaries = wardrobeItems
      .filter((item) => item.id)
      .map(itemToSummary);

    return provider.matchInspiration(inspoImageBase64, itemSummaries);
  }

  // Suggest items to pair with a given item
  async suggestPairings(
    item: Item,
    candidateItems: Item[],
    occasion?: string
  ): Promise<number[]> {
    const provider = await this.ensureProvider();

    const targetSummary = itemToSummary(item);
    const candidateSummaries = candidateItems
      .filter((i) => i.id && i.id !== item.id)
      .map(itemToSummary);

    return provider.suggestPairings(targetSummary, candidateSummaries, occasion);
  }
}

// Helper to parse user profile from DB row
function parseUserProfile(row: any): UserProfile {
  return {
    id: row.id,
    bodyType: row.bodyType,
    skinTone: row.skinTone,
    height: row.height,
    preferredStyles: row.preferredStyles ? JSON.parse(row.preferredStyles) : undefined,
    avoidedStyles: row.avoidedStyles ? JSON.parse(row.avoidedStyles) : undefined,
    preferredColors: row.preferredColors ? JSON.parse(row.preferredColors) : undefined,
    avoidedColors: row.avoidedColors ? JSON.parse(row.avoidedColors) : undefined,
    formalityDefault: row.formalityDefault,
    lifestyle: row.lifestyle ? JSON.parse(row.lifestyle) : undefined,
    acceptedCount: row.acceptedCount,
    rejectedCount: row.rejectedCount,
    lastUpdated: row.lastUpdated,
    profileCompleted: !!row.profileCompleted,
    skippedProfile: !!row.skippedProfile,
  };
}

// Singleton instance
export const aiService = new AIService();

// Re-export error class for convenience
export { AIProviderError };
