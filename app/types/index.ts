// AI-analyzed attributes for clothing items
export type AIItemAttributes = {
  aiCategory?: string | null;              // AI-detected category
  aiSubcategory?: string | null;           // e.g., "button-down", "chinos"
  aiColors?: string[] | null;              // ["navy", "white"]
  aiColorFamily?: 'warm' | 'cool' | 'neutral' | null;
  aiStyle?: string[] | null;               // ["casual", "preppy", "minimalist"]
  aiFormality?: number | null;             // 1-5 scale (1=very casual, 5=formal)
  aiOccasions?: string[] | null;           // ["work", "weekend", "date-night"]
  aiPattern?: string | null;               // "solid", "striped", "floral", etc.
  aiMaterial?: string | null;              // "cotton", "denim", "silk"
  aiSeasons?: string[] | null;             // ["spring", "summer", "fall", "winter"]
  aiWeatherSuitability?: string[] | null;  // ["hot", "warm", "mild", "cool", "cold"]
  aiAnalyzedAt?: number | null;            // Unix timestamp of last analysis
  aiConfidence?: number | null;            // 0-1 confidence score
};

export type Item = {
  id?: number;
  name: string;
  category?: string | null;
  imageUri?: string | null;
  thumbUri?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  createdAt?: number;
  wornAt?: number | null;
  hidden?: boolean | null;
  hiddenUntil?: number | null; // unix ms timestamp
} & AIItemAttributes;

export type Outfit = {
  id?: number;
  name: string;
  itemIds: number[];
  notes?: string;
  createdAt?: number;
};

// User profile for personalized AI recommendations
export type UserProfile = {
  id?: number;
  // Physical attributes (simple, non-intimidating options)
  bodyType?: 'rectangle' | 'triangle' | 'inverted-triangle' | 'hourglass' | 'oval' | null;
  skinTone?: 'dark' | 'tan' | 'pale' | null;
  height?: 'petite' | 'average' | 'tall' | null;

  // Style preferences
  preferredStyles?: string[] | null;       // ["minimalist", "classic"]
  avoidedStyles?: string[] | null;         // ["bohemian", "sporty"]
  preferredColors?: string[] | null;       // Colors they love
  avoidedColors?: string[] | null;         // Colors they avoid
  formalityDefault?: number | null;        // 1-5 typical formality preference
  lifestyle?: string[] | null;             // ["office-job", "active", "parent"]

  // Learning data
  acceptedCount?: number;
  rejectedCount?: number;
  lastUpdated?: number;

  // Profile completion state
  profileCompleted?: boolean;
  skippedProfile?: boolean;
};

// Track outfit feedback for learning
export type OutfitFeedback = {
  id?: number;
  outfitItemIds: number[];                 // Which items were in the outfit
  action: 'accept' | 'reject' | 'save' | 'wear';
  occasion?: string | null;
  weather?: string | null;
  createdAt?: number;
};

// AI service response types
export type AIAnalysisResult = {
  category?: string;
  subcategory?: string;
  colors?: string[];
  colorFamily?: 'warm' | 'cool' | 'neutral';
  style?: string[];
  formality?: number;
  occasions?: string[];
  pattern?: string;
  material?: string;
  seasons?: string[];
  weatherSuitability?: string[];
  confidence?: number;
};

export type AIOutfitSuggestion = {
  itemIds: number[];
  reasoning?: string;
  occasions?: string[];
  style?: string;
  score?: number;
};

// AI Provider types
export type AIProviderName = 'claude' | 'openai' | 'gemini';

export type AIProviderConfig = {
  provider: AIProviderName;
  apiKey: string;
  model?: string;
};
