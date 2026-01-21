# TODO - AI Stylist Feature

Transform Suburban Outfitter from a digital closet into an AI-powered personal stylist.

---

## Phase 1: Foundation

- [ ] Extend `Item` type with AI attributes in `app/types/index.ts`
  - aiCategory, aiColors, aiStyle, aiFormality, aiOccasions, aiPattern, aiMaterial, aiSeasons, aiWeatherSuitability
- [ ] Add `UserProfile` type (bodyType, skinTone, height, style preferences)
- [ ] Add database migrations in `app/services/storage.ts`
  - New columns on items table for AI attributes
  - New `user_profile` table
  - New `outfit_feedback` table
  - New `ai_cache` table
  - New `settings` table
- [ ] Create AI provider abstraction layer
  - `app/services/ai/ai-provider.ts` - Interface
  - `app/services/ai/claude-provider.ts` - Claude implementation
  - `app/services/ai/ai-service.ts` - Main orchestrator
  - `app/services/ai/prompts.ts` - Prompt templates
  - `app/services/ai/ai-storage.ts` - Cache + settings
- [ ] Add API key storage in settings table
- [ ] Extend `app/services/image-service.ts` with base64 conversion for AI APIs

---

## Phase 2: Auto-Tagging

- [ ] Implement `analyzeClothingItem()` in AI service
  - Takes image, returns: category, colors, style, formality, occasions, pattern, material, seasons
- [ ] Add "AI Analyze" button to Add Item screen (`app/(tabs)/add.tsx`)
- [ ] Auto-fill form fields from AI analysis
- [ ] Display AI attributes on Item Detail screen
- [ ] Add "Re-analyze" option for existing items
- [ ] Implement analysis caching (indefinite TTL, item-keyed)

---

## Phase 3: Smart Outfit Generation

- [ ] Build outfit generation prompts (include wardrobe context, weather, occasion)
- [ ] Create AI Generate screen (`app/(tabs)/outfits/ai-generate.tsx`)
  - Occasion selector (work, casual, date, formal, etc.)
  - Weather input (auto from location or manual)
  - Generate button with loading state
  - Outfit preview with accept/reject/regenerate
- [ ] Implement feedback tracking in `outfit_feedback` table
- [ ] Add AI mode toggle to existing outfit builder
- [ ] Display outfit harmony/style score

---

## Phase 4: User Profile & Personalization

- [ ] Create Profile Setup screen (`app/(tabs)/settings/profile.tsx`)
  - Body type selector (visual picker)
  - Skin tone: dark / tan / pale
  - Height: petite / average / tall
- [ ] Create Style Quiz screen (`app/(tabs)/settings/style-quiz.tsx`)
  - Preferred/avoided styles
  - Color preferences
  - Lifestyle context
- [ ] Prompt for profile on first AI feature use (skippable)
- [ ] Store profile + preferences in `user_profile` table
- [ ] Include profile in AI prompts for personalized recommendations
  - Skin tone → color recommendations
  - Body type → fit/silhouette recommendations
  - Height → proportion guidance
- [ ] Implement feedback-based learning (weight by accept/reject history)

---

## Phase 5: Inspiration Matching

- [ ] Implement inspiration photo analysis
  - Detect items in photo (category, colors, style)
  - Extract overall aesthetic
- [ ] Create wardrobe matching algorithm
  - Find similar items from user's closet
  - Score by similarity
- [ ] Build Inspiration screen (`app/(tabs)/outfits/inspiration.tsx`)
  - Image picker for inspo photo
  - Loading state (2-5s analysis)
  - Side-by-side: inspo | matched outfit
  - Missing items section
- [ ] Save matched outfit functionality

---

## Phase 6: Shopping Integration

- [ ] Set up Amazon Product Advertising API
- [ ] Create affiliate service (`app/services/affiliate/affiliate-service.ts`)
- [ ] Create product card component (`app/components/affiliate-product-card.tsx`)
- [ ] Add "Shop similar" section to:
  - AI outfit suggestions
  - Inspiration match results
  - Item pairing suggestions
- [ ] Implement deep linking (open Amazon app or web)

---

## New Files to Create

```
app/services/ai/
├── ai-provider.ts          # Provider interface + types
├── ai-service.ts           # Main orchestrator
├── claude-provider.ts      # Claude API implementation
├── prompts.ts              # Prompt templates
└── ai-storage.ts           # Cache + API key management

app/services/affiliate/
├── affiliate-service.ts    # Amazon API integration
└── product-search.ts       # Similar item search

app/(tabs)/outfits/
├── ai-generate.tsx         # Smart outfit generator
└── inspiration.tsx         # Inspiration matching

app/(tabs)/settings/
├── profile.tsx             # Body type, skin tone, height
└── style-quiz.tsx          # Style preferences

app/components/
├── ai-attribute-tags.tsx   # Display AI tags
├── outfit-feedback-modal.tsx
├── affiliate-product-card.tsx
├── body-type-selector.tsx
└── skin-tone-picker.tsx
```

---

## Files to Modify

- `app/types/index.ts` - Add AIItemAttributes, UserProfile types
- `app/services/storage.ts` - Add migrations, new CRUD operations
- `app/services/image-service.ts` - Add base64 conversion
- `app/(tabs)/add.tsx` - Add AI analyze button
- `app/components/outfit-builder.tsx` - Add AI mode toggle

---

## Cost Management Notes

- Use 512px thumbnails for AI analysis (not full resolution)
- Cache item analysis indefinitely (items don't change)
- Require explicit user action to trigger analysis (no auto-analyze)
- Estimated cost: ~$0.003 per item analysis, ~$0.004 per outfit generation

---

## Testing

```bash
npm test                    # Run unit tests
npm run lint               # Run linter
npm start                  # Manual testing in simulator
```

### Manual Test Cases

1. **Auto-tagging**: Add item with photo → verify AI attributes populate
2. **Smart generation**: Generate "casual weekend" outfit → verify appropriate items
3. **Profile**: Set skin tone to "pale" → verify pastel/jewel tone recommendations
4. **Inspiration**: Upload Pinterest screenshot → verify wardrobe matches shown
5. **Feedback**: Accept/reject outfits → verify future suggestions improve
