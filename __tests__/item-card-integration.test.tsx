/**
 * Integration test to verify favorite button actually calls update
 * and that the icon reflects the change
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Create a mock update function we can track
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockRemove = jest.fn().mockResolvedValue(undefined);
const mockShowToast = jest.fn();

// Mock all dependencies before imports
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
    remove: mockRemove,
  }),
}));

jest.mock('../app/components/toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

jest.mock('../app/constants/theme', () => ({
  Colors: {
    light: {
      text: '#000',
      background: '#fff',
      border: '#ddd',
      success: '#4CAF50',
      error: '#f44336',
      textSecondary: '#666',
    },
  },
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

describe('ItemCard favorite button integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('clicking favorite button calls update with correct tags', async () => {
    const ItemCard = require('../app/components/item-card').default;
    const { LIST_TAGS } = require('../app/constants');

    const item = {
      id: 1,
      name: 'Test Item',
      category: 'top',
      tags: ['casual'],
      hidden: false,
    };

    const { getAllByTestId, getByTestId } = render(<ItemCard item={item} />);

    // Verify initial state
    expect(getByTestId('icon-star-outline')).toBeDefined();

    // Find all TouchableOpacity elements
    const { getAllByType } = require('@testing-library/react-native');
    const rendered = render(<ItemCard item={item} />);
    const touchables = rendered.root.findAllByType(require('react-native').TouchableOpacity);

    // The first button should be the favorite button (based on item-card.tsx line 152)
    const favoriteButton = touchables[1]; // Index 1 because 0 is the Link wrapper

    // Click the favorite button
    fireEvent.press(favoriteButton);

    // Verify update was called with the favorite tag added
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        tags: ['casual', LIST_TAGS.FAVORITES],
      });
    });

    // Verify toast was shown
    expect(mockShowToast).toHaveBeenCalledWith('Added to favorites');
  });

  test('clicking favorite button on favorited item removes favorite', async () => {
    const ItemCard = require('../app/components/item-card').default;
    const { LIST_TAGS } = require('../app/constants');

    const item = {
      id: 1,
      name: 'Test Item',
      category: 'top',
      tags: ['casual', LIST_TAGS.FAVORITES],
      hidden: false,
    };

    const rendered = render(<ItemCard item={item} />);
    const { getByTestId } = rendered;

    // Verify initial state
    expect(getByTestId('icon-star')).toBeDefined();

    // Find the favorite button
    const touchables = rendered.root.findAllByType(require('react-native').TouchableOpacity);
    const favoriteButton = touchables[1];

    // Click to unfavorite
    fireEvent.press(favoriteButton);

    // Verify update was called with favorite tag removed
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        tags: ['casual'],
      });
    });

    // Verify toast was shown
    expect(mockShowToast).toHaveBeenCalledWith('Removed from favorites');
  });
});
