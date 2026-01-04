Plan Summary
Design System Enhancements:
Extended color palette with iOS semantic colors (star, separator, destructive, etc.)
8-point spacing scale for consistent padding/margins
iOS Dynamic Type typography scale
Card shadows and standardized corner radii
New Components:
ThemedButton - Replaces all native <Button> with styled variants (primary, secondary, destructive)
ThemedChip - Consistent filter/tag chips for the closet screen
Key Improvements:
All hardcoded colors replaced with theme-aware alternatives
Cards get subtle shadows and polished spacing
Consistent press feedback across interactive elements
Full dark mode compliance
Typography hierarchy following Apple HIG
Files Modified (11 total):
1 theme file enhanced
2 new components created
3 existing components polished
5 screens updated
The plan maintains all current layouts while significantly improving visual consistency and polish. Ready to proceed?
Claude’s Plan
UI/UX Visual Polish Plan - Apple HIG Style
Overview
Visual polish of the Suburban Outfitter app following Apple Human Interface Guidelines. Focus on consistent colors, typography, spacing, shadows, and micro-interactions while preserving current layouts.
Phase 1: Design System Foundation
1.1 Extend Theme Colors
File: theme.ts Add semantic colors missing from palette:

Light Mode Additions:
- warning: #FF9500 (iOS orange)
- separator: #C6C6C8
- fill: rgba(120,120,128,0.2)
- groupedBackground: #F2F2F7
- systemGray: #8E8E93
- systemGray5: #E5E5EA
- star: #FF9F0A (favorites)
- destructive: #FF3B30

Dark Mode Additions:
- separator: #38383A
- fill: rgba(120,120,128,0.36)
- star: #FFD60A
- destructive: #FF453A
1.2 Add Spacing Scale (8pt grid)

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24
};
1.3 Add Typography Scale (iOS Dynamic Type)

export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: '700', lineHeight: 41 },
  title1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  headline: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 17, fontWeight: '400', lineHeight: 22 },
  callout: { fontSize: 16, fontWeight: '400', lineHeight: 21 },
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption1: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
};
1.4 Add Shadows & Radii

export const Shadows = {
  card: { shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.1, shadowRadius: 3 },
  modal: { shadowColor: '#000', shadowOffset: {width:0,height:4}, shadowOpacity: 0.15, shadowRadius: 12 },
};

export const Radii = {
  sm: 8, md: 12, lg: 16, pill: 9999, button: 12, card: 12, input: 10
};
Phase 2: New Components
2.1 Create ThemedButton
File: app/components/themed-button.tsx (new) Replace all native <Button> components with styled TouchableOpacity:
Variants: primary (filled), secondary (outlined), tertiary (text), destructive (red)
Sizes: small, medium, large
Features: press opacity (0.7), disabled state, loading indicator, icon support
2.2 Create ThemedChip
File: app/components/themed-chip.tsx (new) For filter tags and list selectors:
Selected/unselected states using theme colors
Optional close button for removable tags
Consistent pill border-radius
2.3 Extend ThemedText
File: themed-text.tsx Add typography variants:
largeTitle, title1, title2, headline, body, callout, footnote, caption1, caption2, secondary
Fix hardcoded link color (#0a7ea4 → colors.link)
Phase 3: Card Component Polish
3.1 ItemCard
File: item-card.tsx
Current	Replace With
borderColor: '#eee'	colors.separator
color="#f0ad4e" (star)	colors.star
color="#666" (icons)	colors.icon
color="#d9534f" (delete)	colors.destructive
padding: 8, gap: 6	Spacing.sm
borderRadius: 8	Radii.card (12)
Add: ...Shadows.card for elevation
3.2 OutfitCard
File: outfit-card.tsx Same treatment as ItemCard - replace hardcoded colors, add shadow, standardize spacing.
Phase 4: Screen Updates
4.1 Closet Screen
File: closet/index.tsx
Replace <Button> with <ThemedButton> (Add, Show/Hide hidden, Refresh)
Replace filter buttons with <ThemedChip> components
Update TextInput styling: use colors.separator for border, Radii.input for corners
Replace color="#666" help icon with colors.icon
4.2 Add Item Screen
File: add.tsx
Replace <Button title="Save Item"> with <ThemedButton variant="primary" size="large">
Update input borders: #ccc → colors.separator
Update placeholder color: #999 → colors.textSecondary
Update download button: #0a7ea4 → colors.tint
4.3 Image Picker
File: image-picker.tsx
Replace buttons with ThemedButton secondary variant
Update reset button: #dc2626 → colors.destructive
4.4 Outfit Builder
File: outfit-builder.tsx
Already uses Colors object (good)
Standardize spacing values to use Spacing constants
Add subtle shadows to category slots
4.5 Toast Component
File: toast.tsx
Replace hardcoded: #4CAF50 → colors.success, #f44336 → colors.error, #2196F3 → colors.tint
Increase border-radius to pill shape
Add shadow for floating appearance
Phase 5: Polish & Micro-interactions
5.1 Press States
Add consistent press feedback using Pressable with opacity: 0.7 on press.
5.2 Haptic Feedback (optional)
Using expo-haptics:
Light impact on button presses
Success notification on save actions
Warning on destructive actions
Implementation Order
app/constants/theme.ts - Add Spacing, Typography, Shadows, Radii, extended Colors
app/components/themed-text.tsx - Add typography variants
app/components/themed-button.tsx - Create new component
app/components/themed-chip.tsx - Create new component
app/components/item-card.tsx - Apply card polish
app/components/outfit-card.tsx - Apply card polish
app/components/toast.tsx - Theme compliance
app/components/image-picker.tsx - Button replacement
app/(tabs)/closet/index.tsx - Screen update
app/(tabs)/add.tsx - Screen update
app/components/outfit-builder.tsx - Spacing standardization
Color Migration Quick Reference
Hardcoded	Theme Color
#f0ad4e	colors.star
#666	colors.icon / colors.textSecondary
#d9534f, #dc2626, #ef4444	colors.destructive
#ccc, #ddd, #eee	colors.separator / colors.border
#007AFF	colors.tint
#999	colors.textSecondary
#4CAF50	colors.success
#f44336	colors.error
#0a7ea4	colors.link
User approved the plan