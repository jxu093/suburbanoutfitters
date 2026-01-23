# TODO - AI Stylist Feature

Transform Suburban Outfitter from a digital closet into an AI-powered personal stylist.

---

## Phase 1: Foundation ✅

- [x] Extend `Item` type with AI attributes in `app/types/index.ts`
  - Added `AIItemAttributes` type with: aiCategory, aiSubcategory, aiColors, aiColorFamily, aiStyle, aiFormality, aiOccasions, aiPattern, aiMaterial, aiSeasons, aiWeatherSuitability, aiAnalyzedAt, aiConfidence
  - Extended `Item` type to include all AI attributes
- [x] Add `UserProfile` type (bodyType, skinTone, height, style preferences)
  - Body types: rectangle, triangle, inverted-triangle, hourglass, oval
  - Skin tones: dark, tan, pale
  - Heights: petite, average, tall
  - Style preferences: preferredStyles, avoidedStyles, preferredColors, avoidedColors
  - Lifestyle options and formality default
  - Feedback tracking: acceptedCount, rejectedCount
- [x] Add database migrations in `app/services/storage.ts`
  - New columns on items table for all AI attributes
  - New `user_profile` table with all profile fields
  - New `outfit_feedback` table (outfitItemIds, action, occasion, weather, createdAt)
  - New `ai_cache` table (itemId, analysis JSON, timestamp)
  - New `settings` table (key-value pairs for API keys, etc.)
- [x] Create AI provider abstraction layer
  - `app/services/ai/ai-provider.ts` - AIProvider interface, ItemSummary, OutfitContext, InspirationMatch types
  - `app/services/ai/claude-provider.ts` - Claude API implementation with vision support
  - `app/services/ai/ai-service.ts` - Main orchestrator singleton with caching
  - `app/services/ai/prompts.ts` - ITEM_ANALYSIS_PROMPT, buildOutfitPrompt, buildInspirationPrompt, buildPairingPrompt
  - `app/services/ai/index.ts` - Module exports
- [x] Add API key storage in settings table
  - `getSetting()`/`setSetting()` functions in storage.ts
  - `ai_api_key` and `ai_provider` settings
- [x] Extend `app/services/image-service.ts` with base64 conversion for AI APIs
  - `resizeForAIAnalysis()` - Resizes to 512px and returns base64
  - `readImageAsBase64()` - Reads any image as base64
  - `pickImageForAIAnalysis()` - Pick + resize in one step

---

## Phase 2: Auto-Tagging ✅

- [x] Implement `analyzeClothingItem()` in AI service
  - Takes image base64, optionally item ID for caching
  - Returns: category, subcategory, colors, colorFamily, style, formality, occasions, pattern, material, seasons, weatherSuitability, confidence
  - Uses Claude's vision API with structured JSON response
- [x] Add "AI Analyze" button to Add Item screen (`app/(tabs)/add.tsx`)
  - Purple "Analyze with AI" button appears after selecting image
  - Shows loading spinner during analysis
  - Toast notifications for success/error
- [x] Auto-fill form fields from AI analysis (category, name)
  - Category dropdown auto-selected from AI result
  - Name field populated with subcategory if available
- [x] Display AI attributes on Item Detail screen (`app/(tabs)/item/[id].tsx`)
  - Shows all AI-detected attributes in organized sections
  - Color chips, style tags, occasion badges
  - Formality scale, weather suitability indicators
- [x] Add "Re-analyze" option for existing items
  - "Re-analyze with AI" button on item detail screen
  - Clears cache and runs fresh analysis
- [x] Implement analysis caching (indefinite TTL, item-keyed)
  - `getCachedAIAnalysis()`/`setCachedAIAnalysis()` in storage.ts
  - Cache keyed by item ID, stores JSON analysis result
- [x] Create `AIAttributeTags` component (`app/components/ai-attribute-tags.tsx`)
  - Reusable component for displaying AI attributes
  - Supports different display modes (compact, full)

---

## Phase 3: Smart Outfit Generation ✅

- [x] Build outfit generation prompts (include wardrobe context, weather, occasion)
  - `buildOutfitPrompt()` in prompts.ts
  - Includes all wardrobe items with AI attributes
  - Includes user profile for personalization
  - Includes recent feedback for learning
  - Returns itemIds, reasoning, style, score
- [x] Create AI Generate screen (`app/(tabs)/outfits/ai-generate.tsx`)
  - Occasion selector: casual, work, date, formal, weekend (pill buttons)
  - Weather auto-detected from location via expo-location
  - "Generate Outfit" button with purple styling
  - Loading state with activity indicator
  - Outfit preview showing matched items in grid
- [x] Implement feedback tracking in `outfit_feedback` table
  - `createOutfitFeedback()` in storage.ts
  - Tracks: outfitItemIds (JSON), action (accept/reject), occasion, weather, createdAt
  - `getOutfitFeedback(limit)` retrieves recent feedback for learning
- [x] Add AI mode to existing outfit builder (`app/components/outfit-builder.tsx`)
  - "AI" button suggests items that pair well with current selection
  - Uses `suggestPairings()` from AI service
- [x] Display outfit harmony/style score (1-10 star rating)
  - Score displayed as star rating on generated outfit
  - Reasoning shown below the outfit preview
  - Accept/Reject/Regenerate buttons for feedback

---

## Phase 4: User Profile & Personalization ✅

- [x] Create Profile Setup screen (`app/(tabs)/settings/profile.tsx`)
  - Body type selector: Visual picker with 5 body type options
    - Rectangle (▭), Triangle (△), Inverted Triangle (▽), Hourglass (⧗), Oval (⬭)
    - Each with description text
  - Skin tone picker: 3 options with color swatches
    - Fair/Pale, Medium/Tan, Dark/Deep
    - Each with undertone description
  - Height selector: petite, average, tall
  - Skip option and "Continue to Style Quiz" button
  - Saves to user_profile table via `saveUserProfile()`
- [x] Create Style Quiz screen (`app/(tabs)/settings/style-quiz.tsx`)
  - 10 style options: minimalist, classic, bohemian, preppy, streetwear, romantic, edgy, sporty, vintage, artsy
    - Tap to prefer (green checkmark), long-press to avoid (red X)
  - 14 color options with visual swatches
    - Tap to prefer, long-press to avoid
  - 8 lifestyle options: office-job, remote-work, active, social, parent, student, creative, traveler
    - Multi-select enabled
  - Formality preference: 1-5 scale slider
    - 1=Very casual, 5=Formal
  - Saves all preferences to user_profile table
- [x] Prompt for profile on first AI feature use (skippable)
  - Modal appears on first AI Stylist visit
  - Sparkles icon with purple accent
  - Benefits list with icons:
    - Colors that complement your skin tone
    - Fits that flatter your body type
    - Styles you love, not ones you avoid
  - "Set Up Profile" primary button → navigates to profile.tsx
  - "Maybe later" secondary button → sets skippedProfile flag
- [x] Store profile + preferences in `user_profile` table
  - `getUserProfile()` - retrieves profile row
  - `saveUserProfile()` - upserts profile data
  - JSON-stringified arrays for: preferredStyles, avoidedStyles, preferredColors, avoidedColors, lifestyle
- [x] Include profile in AI prompts for personalized recommendations
  - `formatUserProfileForPrompt()` in prompts.ts
  - Skin tone → color recommendations:
    - Pale: jewel tones, navy, burgundy, soft pastels
    - Tan: earth tones, coral, turquoise, warm whites
    - Dark: bold bright colors, white, cream, pastels
  - Body type → fit/silhouette recommendations
  - Height → proportion guidance
  - Style preferences → preferred/avoided styles included
- [x] Implement feedback-based learning (weight by accept/reject history)
  - `incrementProfileFeedbackCount('accept'|'reject')` in storage.ts
  - Feedback counts tracked in user_profile table
  - Recent feedback (last 10) included in outfit generation prompts
  - AI learns from accept/reject patterns per occasion

---

## Phase 5: Inspiration Matching ✅

- [x] Implement inspiration photo analysis
  - `matchInspiration()` in claude-provider.ts
  - Sends inspiration image + wardrobe context to Claude vision API
  - Detects items in photo: category, colors, style for each piece
  - Extracts overall aesthetic and color palette
- [x] Create wardrobe matching algorithm
  - `buildInspirationPrompt()` in prompts.ts formats wardrobe for matching
  - AI compares inspiration items to user's wardrobe
  - Returns matchedItemIds (items user owns that match)
  - Returns missingItems (items needed to complete the look)
  - matchScore: 0-1 indicating how well wardrobe can recreate the look
- [x] Build Inspiration screen (`app/(tabs)/outfits/inspiration.tsx`)
  - Image picker for inspo photo (Pinterest, Instagram, magazine, etc.)
  - Dashed upload area with cloud icon
  - Loading state with "Analyzing..." during AI processing
  - Side-by-side view: inspiration photo | matched wardrobe grid (2x2)
  - Match score badge: green (≥70%), orange (40-69%), red (<40%)
  - Score description explaining match quality
  - Style tags showing detected aesthetic
  - Color palette chips
  - Matched items horizontal scroll (tap to view item)
  - Missing items section with:
    - Category, description, suggested colors, style tags
    - Shopping guidance for completing the look
- [x] Save matched outfit functionality
  - "Save as Outfit" button (requires 2+ matched items)
  - Creates outfit named "Inspired Look - [date]"
  - Includes style notes from analysis
  - "Try Another" button to clear and start over
- [x] Added "Inspo" button to outfits index screen
  - Pink (#e91e63) button next to AI Stylist
  - Routes to /outfits/inspiration

---

## Phase 6: Shopping Integration ✅

- [x] Create affiliate service (`app/services/affiliate/affiliate-service.ts`)
  - `buildSearchQuery()` - Builds search queries from item attributes (category, colors, style, material)
  - `getAmazonSearchUrl()` - Generates Amazon search URLs with affiliate tag
  - `getGoogleShoppingUrl()` - Generates Google Shopping search URLs
  - `getShoppingLinksForMissingItem()` - Links for inspiration missing items
  - `getShoppingLinksForSimilarItem()` - Links for finding similar items
  - `openProductUrl()` - Opens URLs with app deep linking fallback
  - Configurable affiliate tag via settings
- [x] Create product card component (`app/components/affiliate-product-card.tsx`)
  - `MissingItemCard` - Card displaying missing item with Amazon/Google shop buttons
  - `ShopSimilarButton` - Inline shop buttons (compact or full modes)
  - `ShopMissingItems` - Section showing all missing items with "Complete the Look" header
  - Amazon button (orange) and Google button (blue) styling
- [x] Add "Shop similar" section to:
  - AI outfit suggestions - Each item shows compact shop buttons
  - Inspiration match results - Missing items replaced with `ShopMissingItems` component
- [x] Implement deep linking (open Amazon app or web)
  - iOS: `com.amazon.mobile.shopping://` scheme
  - Android: Intent-based deep linking
  - Fallback to browser if app not installed
  - Uses `Linking.canOpenURL()` and `Linking.openURL()`

---

## New Files Created

```
app/services/ai/
├── ai-provider.ts          # Provider interface + types ✅
├── ai-service.ts           # Main orchestrator ✅
├── claude-provider.ts      # Claude API implementation ✅
├── prompts.ts              # Prompt templates ✅
└── index.ts                # Module exports ✅

app/(tabs)/outfits/
├── ai-generate.tsx         # Smart outfit generator ✅
└── inspiration.tsx         # Inspiration matching ✅

app/(tabs)/settings/
├── profile.tsx             # Body type, skin tone, height ✅
└── style-quiz.tsx          # Style preferences ✅

app/components/
├── ai-attribute-tags.tsx   # Display AI tags ✅
├── affiliate-product-card.tsx # Shopping buttons & cards ✅

app/services/affiliate/
├── affiliate-service.ts    # Affiliate links & deep linking ✅
└── index.ts                # Module exports ✅

__tests__/
├── ai-service.test.ts      # AI service tests ✅
├── ai-outfit-generation.test.ts # Outfit generation tests ✅
├── user-profile.test.ts    # User profile tests ✅
├── inspiration.test.ts     # Inspiration matching tests ✅
├── affiliate-service.test.ts # Affiliate service tests ✅
├── storage-ai.test.ts      # AI storage tests ✅
├── types-ai.test.ts        # AI type tests ✅
```

---

## Files Modified

- `app/types/index.ts` - Added AIItemAttributes, UserProfile, OutfitFeedback, AIAnalysisResult, AIOutfitSuggestion types ✅
- `app/services/storage.ts` - Added migrations, AI CRUD (cache, settings, profile, feedback) ✅
- `app/services/image-service.ts` - Added base64 conversion, resizeForAIAnalysis ✅
- `app/(tabs)/add.tsx` - Added AI analyze button, auto-fill from AI analysis ✅
- `app/(tabs)/item/[id].tsx` - Added AI attributes display, re-analyze button ✅
- `app/(tabs)/outfits/index.tsx` - Added "AI Stylist" and "Inspo" buttons ✅
- `app/components/outfit-builder.tsx` - Added AI suggest pairings button ✅
- `app/(tabs)/_layout.tsx` - Added settings and AI screens (hidden from tab bar) ✅
- `app/(tabs)/outfits/ai-generate.tsx` - Added profile prompt modal, profile link, feedback tracking, shop similar section ✅
- `app/(tabs)/outfits/inspiration.tsx` - Replaced missing items with ShopMissingItems component ✅

---

## Cost Management Notes

- Use 512px thumbnails for AI analysis (not full resolution)
- Cache item analysis indefinitely (items don't change)
- Require explicit user action to trigger analysis (no auto-analyze)
- Estimated cost: ~$0.003 per item analysis, ~$0.004 per outfit generation, ~$0.006 per inspiration match

---

## Testing

```bash
npm test                    # Run unit tests (247 tests passing)
npm run lint               # Run linter
npm start                  # Manual testing in simulator
```

### Manual Test Cases

1. **Auto-tagging**: Add item with photo → verify AI attributes populate
2. **Smart generation**: Generate "casual weekend" outfit → verify appropriate items
3. **Profile**: Set skin tone to "pale" → verify pastel/jewel tone recommendations
4. **Inspiration**: Upload Pinterest screenshot → verify wardrobe matches shown
5. **Feedback**: Accept/reject outfits → verify future suggestions improve
6. **Shopping**: Tap Amazon/Google buttons on missing items → verify opens shopping search
