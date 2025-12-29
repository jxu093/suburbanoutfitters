# TODO

## UI changes
1. ✅ FIXED: Favorite star icon now updates immediately (fixed stale closure bug and added rapid-click prevention)
1. The buttons within the item are overflowing if the item is collapsed to share half the width of the screen with another item. Replace the Lists, Hide, Wear and Delete buttons with small icons so they take up less space. Add a help icon in the corner that shows a popup with a legend of what the icons mean.
1. On an individual item page, instead of a Back button in text alongside Edit and Delete, add a "Back" icon in the top left corner. And on the same page, show the same info as the closet screen, such as tags and favorited status. Users should be able to add to lists and add tags from this page.
1. On Android, the screen still overlaps with the top bar (status bar overlap issue)
1. Make the thumbnails bigger in the full screen preview
1. Integrate AI in image uploader to automatically populate the fields such as category 

## E2E Testing

Current unit tests use mocks that can drift from actual Expo SDK APIs (as seen with expo-sqlite and expo-file-system SDK 54 migration). Adding E2E tests would catch these runtime issues.

### Recommended: Maestro

Maestro is the easiest E2E solution for Expo apps - uses YAML scripts, no native build config needed.

**Setup:**
```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run tests
maestro test e2e/
```

**Critical flows to test:**
- Add item with image (picker + save)
- View closet and filter by category/tag
- Create outfit from items
- Generate random outfit
- Hide/unhide items

**Example test file (`e2e/add-item.yaml`):**
```yaml
appId: com.suburbanoutfitter
---
- launchApp
- tapOn: "Add"
- inputText:
    id: "name-input"
    text: "Test Shirt"
- tapOn: "Category"
- inputText: "top"
- tapOn: "Choose from library"
# Maestro handles system dialogs automatically
- tapOn: "Save Item"
- assertVisible: "Saved"
```

### Alternative: Detox

More powerful but higher setup cost. Consider if Maestro doesn't meet needs.

---

## Other TODOs

- [ ] Weather API key: Currently using placeholder in `app/services/weather.ts` - add real OpenWeatherMap API key
- [ ] Tag input component: Better UX for adding/removing tags (currently comma-separated text input)
