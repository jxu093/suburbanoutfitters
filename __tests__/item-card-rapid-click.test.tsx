/**
 * Test for rapid clicking causing race conditions
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

const updateCalls: any[] = [];
let mockItemsArray: any[] = [];

const mockUpdate = jest.fn((id: number, changes: any) => {
  updateCalls.push({ id, changes, timestamp: Date.now() });
  // Update mockItemsArray to simulate real behavior
  mockItemsArray = mockItemsArray.map((item) => {
    if (item.id !== id) return item;
    return { ...item, ...changes };
  });
  return Promise.resolve();
});

// Mock dependencies
jest.mock('expo-router', () => ({
  Link: ({ children, href }: any) => {
    const { TouchableOpacity } = require('react-native');
    return <TouchableOpacity testID={`link-${href}`}>{children}</TouchableOpacity>;
  },
}));

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    const { View } = require('react-native');
    return <View testID="image" {...props} />;
  },
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID={`icon-${props.name}`} {...props} />;
});

jest.mock('../app/hooks/use-items', () => ({
  useItems: () => ({
    items: mockItemsArray,
    update: mockUpdate,
    remove: jest.fn(),
  }),
}));

jest.mock('../app/components/toast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

jest.mock('../app/components/themed-text', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

jest.mock('../app/components/themed-view', () => ({
  ThemedView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

describe('ItemCard rapid clicking race condition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateCalls.length = 0;
    mockItemsArray = [];
  });

  test('rapid clicking is prevented by isTogglingFavorite guard', async () => {
    const ItemCard = require('../app/components/item-card').default;
    const { LIST_TAGS } = require('../app/constants');

    const item = {
      id: 1,
      name: 'Test',
      category: 'top',
      tags: ['casual'],
      hidden: false,
    };

    // Initialize items array
    mockItemsArray = [item];

    const { getByTestId } = render(<ItemCard item={item} />);
    const favoriteButton = getByTestId('favorite-button');

    // Simulate rapid clicking
    console.log('=== Rapid clicking (3 times) ===');
    fireEvent.press(favoriteButton);
    fireEvent.press(favoriteButton);
    fireEvent.press(favoriteButton);

    // Wait a bit for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log('All update calls:');
    updateCalls.forEach((call, i) => {
      console.log(`  ${i + 1}. tags:`, call.changes.tags);
    });

    console.log(`Total update calls: ${updateCalls.length}`);

    // With our fix (isTogglingFavorite guard), rapid clicks are prevented
    // Only the first click should go through
    expect(updateCalls.length).toBeLessThanOrEqual(1);

    if (updateCalls.length > 0) {
      expect(updateCalls[0].changes.tags).toEqual(['casual', LIST_TAGS.FAVORITES]);
    }
  });

  test('demonstrates the fix: recalculating isFavorite from item.tags inside toggleFavorite', async () => {
    // This test shows what the fix would look like
    const { LIST_TAGS } = require('../app/constants');

    const item = {
      id: 1,
      name: 'Test',
      category: 'top',
      tags: ['casual'],
      hidden: false,
    };

    // Simulate the current buggy behavior
    const isFavorite = item.tags?.includes(LIST_TAGS.FAVORITES) ?? false;

    // This closure captures isFavorite = false
    const buggyToggleFavorite = () => {
      const currentTags = item.tags ?? [];
      if (isFavorite) {
        return { tags: currentTags.filter((t) => t !== LIST_TAGS.FAVORITES) };
      } else {
        return { tags: [...currentTags, LIST_TAGS.FAVORITES] };
      }
    };

    // Fixed version that recalculates each time
    const fixedToggleFavorite = () => {
      const currentTags = item.tags ?? [];
      // Recalculate isFavorite each time instead of using closure
      const isFavoriteNow = currentTags.includes(LIST_TAGS.FAVORITES);
      if (isFavoriteNow) {
        return { tags: currentTags.filter((t) => t !== LIST_TAGS.FAVORITES) };
      } else {
        return { tags: [...currentTags, LIST_TAGS.FAVORITES] };
      }
    };

    // Buggy version - all calls return the same result
    console.log('Buggy version - 3 calls:');
    console.log('1:', buggyToggleFavorite());
    console.log('2:', buggyToggleFavorite());
    console.log('3:', buggyToggleFavorite());

    // Fixed version - reads fresh value each time
    console.log('\nFixed version - 3 calls:');
    console.log('1:', fixedToggleFavorite());
    // Simulate item.tags being updated after first call
    item.tags = [...item.tags, LIST_TAGS.FAVORITES];
    console.log('2:', fixedToggleFavorite());
    // Simulate item.tags being updated after second call
    item.tags = item.tags.filter(t => t !== LIST_TAGS.FAVORITES);
    console.log('3:', fixedToggleFavorite());
  });
});
