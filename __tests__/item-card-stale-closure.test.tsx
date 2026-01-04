/**
 * This test catches the stale closure bug in toggleFavorite
 * where isFavorite is calculated once and doesn't update in the closure
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Track all update calls
const updateCalls: any[] = [];
const mockUpdate = jest.fn((id: number, changes: any) => {
  updateCalls.push({ id, changes });
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
    items: [],
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

describe('ItemCard stale closure bug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateCalls.length = 0;
  });

  test('FAILS: clicking favorite twice uses stale isFavorite value', async () => {
    const ItemCard = require('../app/components/item-card').default;
    const { LIST_TAGS } = require('../app/constants');

    // Start with non-favorited item
    let currentItem = {
      id: 1,
      name: 'Test Item',
      category: 'top',
      tags: ['casual'],
      hidden: false,
    };

    const { rerender, getByTestId } = render(<ItemCard item={currentItem} />);

    // Get the favorite button
    const favoriteButton = getByTestId('favorite-button');

    // First click - should ADD to favorites
    fireEvent.press(favoriteButton);

    await waitFor(() => {
      expect(updateCalls.length).toBe(1);
    });

    // Verify first call adds favorite
    expect(updateCalls[0]).toEqual({
      id: 1,
      changes: { tags: ['casual', LIST_TAGS.FAVORITES] },
    });

    // Simulate the state update - item now has favorite tag
    currentItem = {
      ...currentItem,
      tags: ['casual', LIST_TAGS.FAVORITES],
    };

    // Re-render with updated item (this is what happens in real app)
    rerender(<ItemCard item={currentItem} />);

    // Second click - should REMOVE from favorites
    // But due to stale closure bug, it might try to ADD again
    const { getByTestId: getByTestId2 } = render(<ItemCard item={currentItem} />);
    const favoriteButton2 = getByTestId2('favorite-button');

    fireEvent.press(favoriteButton2);

    await waitFor(() => {
      expect(updateCalls.length).toBe(2);
    });

    // This should REMOVE the favorite tag
    // If there's a stale closure bug, it will try to ADD it again
    console.log('Second update call:', updateCalls[1]);

    // This assertion will FAIL if there's a stale closure bug
    expect(updateCalls[1].changes.tags).toEqual(['casual']);
    expect(updateCalls[1].changes.tags).not.toContain(LIST_TAGS.FAVORITES);
  });

  test('isFavorite should be recalculated on each render', () => {
    const ItemCard = require('../app/components/item-card').default;
    const { LIST_TAGS } = require('../app/constants');

    // Render with non-favorited item
    const { getByTestId, rerender } = render(
      <ItemCard
        item={{
          id: 1,
          name: 'Test',
          category: 'top',
          tags: ['casual'],
          hidden: false,
        }}
      />
    );

    // Should show outline star
    expect(getByTestId('icon-star-outline')).toBeDefined();

    // Re-render with favorited item
    rerender(
      <ItemCard
        item={{
          id: 1,
          name: 'Test',
          category: 'top',
          tags: ['casual', LIST_TAGS.FAVORITES],
          hidden: false,
        }}
      />
    );

    // Should now show filled star
    // This works because isFavorite is recalculated on render
    expect(getByTestId('icon-star')).toBeDefined();
  });
});
