import type { ItemSummary, NLContext, OutfitContext, ShoppingContext, SlotContext } from './ai-provider';
import type { UserProfile } from '@/types';

// Prompt for analyzing a clothing item image
export const ITEM_ANALYSIS_PROMPT = `Analyze this clothing item image and return a JSON object with the following properties:

{
  "category": "top" | "bottom" | "shoes" | "outerwear" | "hat" | "accessory",
  "subcategory": "specific type like henley, chinos, sneakers, etc.",
  "colors": ["array of detected colors"],
  "colorFamily": "warm" | "cool" | "neutral",
  "style": ["casual", "formal", "sporty", "preppy", "minimalist", "bohemian", etc.],
  "formality": 1-5 (1=very casual, 5=formal),
  "occasions": ["work", "weekend", "date-night", "gym", "formal-event", etc.],
  "pattern": "solid" | "striped" | "plaid" | "floral" | "geometric" | "abstract" | etc.,
  "material": "cotton" | "denim" | "silk" | "wool" | "synthetic" | "leather" | etc.,
  "seasons": ["spring", "summer", "fall", "winter"],
  "weatherSuitability": ["hot", "warm", "mild", "cool", "cold"],
  "confidence": 0-1 confidence score
}

Be specific and accurate. Return ONLY valid JSON, no explanation.`;

// Build prompt for outfit generation
export function buildOutfitPrompt(context: OutfitContext): string {
  const { items, occasion, weather, userProfile, recentFeedback } = context;

  let prompt = `You are a personal stylist AI. Generate a stylish outfit from the user's wardrobe.

## User's Wardrobe Items:
${formatItemsForPrompt(items)}

## Requirements:
- Select items that work well together visually and stylistically
- Ensure the outfit is complete (at minimum: top + bottom, or a dress)
- Consider color harmony and style coherence
`;

  if (occasion) {
    prompt += `\n## Occasion: ${occasion}\n`;
  }

  if (weather) {
    prompt += `\n## Weather: ${weather}\n`;
  }

  if (userProfile) {
    prompt += `\n## User Profile:\n${formatUserProfileForPrompt(userProfile)}\n`;
  }

  if (recentFeedback && recentFeedback.length > 0) {
    prompt += `\n## Recent Feedback (learn from this):\n`;
    recentFeedback.slice(0, 5).forEach((fb) => {
      prompt += `- Items [${fb.itemIds.join(', ')}] were ${fb.action}ed${fb.occasion ? ` for ${fb.occasion}` : ''}\n`;
    });
  }

  prompt += `
## Response Format:
Return ONLY a JSON object:
{
  "itemIds": [array of selected item IDs],
  "reasoning": "brief explanation of why these items work together",
  "style": "overall style description",
  "score": 1-10 outfit rating
}`;

  return prompt;
}

// Build prompt for inspiration matching
export function buildInspirationPrompt(wardrobeItems: ItemSummary[]): string {
  return `You are a personal stylist AI. Analyze this inspiration outfit photo and find matching items from the user's wardrobe.

## User's Wardrobe:
${formatItemsForPrompt(wardrobeItems)}

## Task:
1. Identify each clothing item in the inspiration photo
2. Find the closest matching items from the user's wardrobe
3. Identify any items that are missing from their wardrobe

## Response Format:
Return ONLY a JSON object:
{
  "matchedItemIds": [array of wardrobe item IDs that match the inspiration],
  "missingItems": [
    {
      "category": "category of missing item",
      "description": "what the missing item looks like",
      "colors": ["suggested colors"],
      "style": ["style tags"]
    }
  ],
  "overallStyle": ["style tags for the inspiration outfit"],
  "colorPalette": ["main colors in the inspiration"],
  "matchScore": 0-1 how well the wardrobe can recreate this look
}`;
}

// Build prompt for item pairing suggestions
export function buildPairingPrompt(
  targetItem: ItemSummary,
  candidates: ItemSummary[],
  occasion?: string
): string {
  let prompt = `You are a personal stylist AI. Suggest items that pair well with this piece.

## Target Item:
${formatSingleItemForPrompt(targetItem)}

## Available Items to Pair With:
${formatItemsForPrompt(candidates)}

## Task:
Select items that would look great with the target item, considering:
- Color harmony
- Style compatibility
- Occasion appropriateness
`;

  if (occasion) {
    prompt += `\n## Occasion: ${occasion}\n`;
  }

  prompt += `
## Response Format:
Return ONLY a JSON array of item IDs, ordered by how well they pair:
[id1, id2, id3, ...]`;

  return prompt;
}

// Helper: format items for prompts
function formatItemsForPrompt(items: ItemSummary[]): string {
  return items
    .map((item) => formatSingleItemForPrompt(item))
    .join('\n');
}

function formatSingleItemForPrompt(item: ItemSummary): string {
  const parts = [`ID:${item.id} - ${item.name} (${item.category})`];

  if (item.colors?.length) parts.push(`colors: ${item.colors.join(', ')}`);
  if (item.style?.length) parts.push(`style: ${item.style.join(', ')}`);
  if (item.formality) parts.push(`formality: ${item.formality}/5`);
  if (item.pattern) parts.push(`pattern: ${item.pattern}`);
  if (item.occasions?.length) parts.push(`occasions: ${item.occasions.join(', ')}`);

  return parts.join(' | ');
}

// Helper: format user profile for prompts
function formatUserProfileForPrompt(profile: UserProfile): string {
  const lines: string[] = [];

  if (profile.bodyType) {
    lines.push(`Body type: ${profile.bodyType}`);
  }
  if (profile.skinTone) {
    lines.push(`Skin tone: ${profile.skinTone}`);
    // Add color recommendations based on skin tone
    const colorRecs = getSkinToneColorRecommendations(profile.skinTone);
    if (colorRecs) {
      lines.push(`Recommended colors for skin tone: ${colorRecs}`);
    }
  }
  if (profile.height) {
    lines.push(`Height: ${profile.height}`);
  }
  if (profile.preferredStyles?.length) {
    lines.push(`Preferred styles: ${profile.preferredStyles.join(', ')}`);
  }
  if (profile.avoidedStyles?.length) {
    lines.push(`Styles to avoid: ${profile.avoidedStyles.join(', ')}`);
  }
  if (profile.preferredColors?.length) {
    lines.push(`Favorite colors: ${profile.preferredColors.join(', ')}`);
  }
  if (profile.avoidedColors?.length) {
    lines.push(`Colors to avoid: ${profile.avoidedColors.join(', ')}`);
  }
  if (profile.formalityDefault) {
    lines.push(`Default formality preference: ${profile.formalityDefault}/5`);
  }

  return lines.join('\n');
}

// Color recommendations based on skin tone
function getSkinToneColorRecommendations(skinTone: string): string | null {
  switch (skinTone) {
    case 'pale':
      return 'jewel tones (emerald, sapphire, ruby), navy, burgundy, soft pastels, avoid washed-out colors';
    case 'tan':
      return 'earth tones, coral, turquoise, warm whites, olive, mustard';
    case 'dark':
      return 'bold bright colors, white, cream, pastels, jewel tones, avoid colors too close to skin tone';
    default:
      return null;
  }
}

// Build prompt for shopping recommendations
export function buildShoppingRecommendationPrompt(context: ShoppingContext): string {
  const { currentItems, occasion, weather, userProfile, budget } = context;

  let prompt = `You are a personal stylist AI helping someone shop for new clothing. Based on what they already have selected, suggest NEW items they should buy to complete or enhance their outfit.

## Current Items in Outfit:
${currentItems.length > 0 ? formatItemsForPrompt(currentItems) : 'No items selected yet - suggest a complete outfit'}

## Task:
Suggest 2-4 NEW items to purchase that would:
- Complete the outfit if items are missing (e.g., they have pants but need a top)
- Enhance the look with complementary pieces
- Add versatility to their wardrobe
`;

  if (occasion) {
    prompt += `\n## Occasion: ${occasion}\nSuggest items appropriate for this occasion.\n`;
  }

  if (weather) {
    prompt += `\n## Weather: ${weather}\nSuggest weather-appropriate items.\n`;
  }

  if (budget) {
    prompt += `\n## Budget Preference: ${budget}\nAdjust price ranges accordingly (budget=lower prices, luxury=higher end).\n`;
  }

  if (userProfile) {
    prompt += `\n## User Profile:\n${formatUserProfileForPrompt(userProfile)}\nTailor suggestions to their preferences and body type.\n`;
  }

  prompt += `
## Response Format:
Return ONLY a JSON object:
{
  "recommendations": [
    {
      "category": "top" | "bottom" | "shoes" | "outerwear" | "hat" | "accessory",
      "description": "specific item description (e.g., 'Light blue chambray button-down shirt')",
      "colors": ["suggested colors for this item"],
      "style": ["style tags like casual, preppy, minimalist"],
      "priceRange": { "min": 30, "max": 60 },
      "reasoning": "why this pairs well with the current selection",
      "searchQuery": "search terms for shopping (e.g., 'mens chambray shirt light blue')"
    }
  ],
  "overallAdvice": "brief styling tip for the complete look"
}

Be specific with descriptions - include color, material, and style details. Make search queries practical for shopping sites.`;

  return prompt;
}

// Build prompt for suggesting items from closet for a specific slot
export function buildSlotSuggestionPrompt(context: SlotContext): string {
  const { targetCategory, currentOutfitItems, candidateItems, occasion, weather, userProfile } = context;

  let prompt = `You are a personal stylist AI. The user is building an outfit and needs a "${targetCategory}" item. Suggest the best items from their closet that would pair well with their current selection.

## Current Items in Outfit:
${currentOutfitItems.length > 0 ? formatItemsForPrompt(currentOutfitItems) : 'No items selected yet - this will be the first piece'}

## Available ${targetCategory.toUpperCase()} Items to Choose From:
${formatItemsForPrompt(candidateItems)}

## Task:
Rank the available ${targetCategory} items by how well they would complete this outfit. Consider:
- Color harmony with existing pieces
- Style compatibility
- Creating a cohesive look
`;

  if (occasion) {
    prompt += `\n## Occasion: ${occasion}\nPrioritize items appropriate for this occasion.\n`;
  }

  if (weather) {
    prompt += `\n## Weather: ${weather}\nPrioritize weather-appropriate items.\n`;
  }

  if (userProfile) {
    prompt += `\n## User Profile:\n${formatUserProfileForPrompt(userProfile)}\nConsider their preferences.\n`;
  }

  prompt += `
## Response Format:
Return ONLY a JSON object:
{
  "suggestions": [
    {
      "itemId": <item ID from the available items>,
      "reasoning": "why this item works well with the outfit (be specific about color/style harmony)",
      "matchScore": 0.0-1.0
    }
  ],
  "advice": "optional brief styling tip"
}

Return up to 5 suggestions, ordered by best match first. Be specific in your reasoning - mention colors, patterns, and style elements.`;

  return prompt;
}

// Build prompt for suggesting purchases for a specific slot
export function buildSlotPurchasePrompt(context: SlotContext): string {
  const { targetCategory, currentOutfitItems, occasion, weather, userProfile } = context;

  let prompt = `You are a personal stylist AI. The user is building an outfit and needs a "${targetCategory}" item, but wants suggestions for NEW items to purchase rather than choosing from their closet.

## Current Items in Outfit:
${currentOutfitItems.length > 0 ? formatItemsForPrompt(currentOutfitItems) : 'No items selected yet - suggest a versatile starting piece'}

## Task:
Suggest 2-3 specific ${targetCategory} items the user could purchase that would:
- Pair beautifully with their current outfit pieces
- Fill a gap in their wardrobe
- Be versatile enough to work with other outfits too
`;

  if (occasion) {
    prompt += `\n## Occasion: ${occasion}\nSuggest items appropriate for this occasion.\n`;
  }

  if (weather) {
    prompt += `\n## Weather: ${weather}\nSuggest weather-appropriate items.\n`;
  }

  if (userProfile) {
    prompt += `\n## User Profile:\n${formatUserProfileForPrompt(userProfile)}\nTailor suggestions to their preferences and body type.\n`;
  }

  prompt += `
## Response Format:
Return ONLY a JSON object:
{
  "suggestions": [
    {
      "category": "${targetCategory}",
      "description": "specific item description (e.g., 'Olive green chinos with a slim fit')",
      "colors": ["suggested colors"],
      "style": ["style tags"],
      "reasoning": "why this would pair well with the current outfit",
      "searchQuery": "search terms for shopping"
    }
  ],
  "advice": "optional brief styling tip"
}

Focus on giving genuinely helpful suggestions. Be specific with descriptions - include color, fit, material, and style details.`;

  return prompt;
}

// Build prompt for natural language outfit building
export function buildNaturalLanguagePrompt(context: NLContext): string {
  const { prompt: userPrompt, currentOutfitItems, allClosetItems, userProfile, conversationHistory } = context;

  let systemPrompt = `You are a friendly personal stylist AI helping someone build outfits. You can:
1. Suggest items from their closet
2. Suggest items they could purchase
3. Answer styling questions
4. Build complete outfits from scratch

Always prioritize suggesting items from their closet first. Only suggest purchases if:
- They specifically ask about shopping
- Their closet doesn't have suitable items
- You want to mention a complementary piece they might want

## User's Closet (${allClosetItems.length} items):
${formatItemsForPrompt(allClosetItems)}

## Current Outfit Being Built:
${currentOutfitItems.length > 0 ? formatItemsForPrompt(currentOutfitItems) : 'Empty - starting fresh'}
`;

  if (userProfile) {
    systemPrompt += `\n## User Profile:\n${formatUserProfileForPrompt(userProfile)}\n`;
  }

  if (conversationHistory && conversationHistory.length > 0) {
    systemPrompt += `\n## Conversation History:\n`;
    conversationHistory.forEach((msg) => {
      systemPrompt += `${msg.role === 'user' ? 'User' : 'Stylist'}: ${msg.content}\n`;
    });
  }

  systemPrompt += `
## User's Current Request:
"${userPrompt}"

## Response Format:
Return ONLY a JSON object:
{
  "message": "Your natural, friendly response to the user. Be conversational and explain your suggestions.",
  "suggestedClosetItemIds": [array of item IDs from their closet, or empty array],
  "closetReasonings": {"itemId": "why this item works", ...},
  "purchaseSuggestions": [
    {
      "category": "category",
      "description": "specific item description",
      "colors": ["colors"],
      "style": ["styles"],
      "reasoning": "why this would work",
      "searchQuery": "search terms"
    }
  ],
  "followUpQuestions": ["optional questions to help narrow down", ...],
  "outfitComplete": true/false
}

Keep your message natural and helpful. If suggesting items, explain WHY they work together.
If the closet has good options, focus on those and only mention shopping as a secondary option.
If you need more information, include follow-up questions.`;

  return systemPrompt;
}

