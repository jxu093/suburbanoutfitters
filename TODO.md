# TODO

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
