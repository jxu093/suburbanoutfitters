# Suburban Outfitter App

A personal wardrobe management app built with Expo (SDK 54) and React Native. Users can catalog clothing items, create outfits, and get random outfit suggestions.

## Commands

```bash
npm start         # Start Expo dev server
npm run ios       # Run on iOS simulator
npm run android   # Run on Android emulator
npm test          # Run Jest tests (with --runInBand)
npm run lint      # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Database**: expo-sqlite (synchronous API via `openDatabaseSync`)
- **State**: React hooks (`use-items.ts`, `use-outfits.ts`) that wrap storage service
- **Images**: expo-image-picker + expo-image-manipulator for compression

### Directory Structure
```
app/
  (tabs)/           # Tab screens (closet, add, outfits, random)
  components/       # Reusable UI components
  hooks/            # Custom hooks (use-items, use-outfits)
  services/         # Business logic (storage, image-service, weather, randomizer)
  types/            # TypeScript types
  constants/        # Theme and app constants
__tests__/          # Jest tests
```

### Data Models

**Item**: Clothing item with name, category, image, tags, and visibility state (can be temporarily hidden)

**Outfit**: Named collection of item IDs

### Key Patterns
- SQLite uses JSON strings for arrays (tags, itemIds)
- Images stored in app document directory with thumbnails
- Hidden items have optional `hiddenUntil` timestamp for auto-unhide
- Hooks return `{ items, loading, error, refresh }` pattern

## Testing

Tests use Jest with React Testing Library. Mocks for Expo modules are in `jest.setup.js`.

Run single test file:
```bash
npm test -- __tests__/storage.test.ts
```

## TODOs

See [TODO.md](./TODO.md) for outstanding tasks and improvements.
