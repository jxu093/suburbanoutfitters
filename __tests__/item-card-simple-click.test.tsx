/**
 * Simplest possible test: Does clicking the star button call update()?
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

const mockShowToast = jest.fn();

// Create a mutable items array that can be updated
let mockItemsArray: any[] = [];

const mockUpdate = jest.fn(async (id: number, changes: any) => {
  // Simulate what the real useItems.update does - update the array
  mockItemsArray = mockItemsArray.map((item) => {
    if (item.id !== id) return item;
    return { ...item, ...changes };
  });
});

// Mock all dependencies
jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children,
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
  return (props: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    // Make icon itself clickable for easier testing
    return <Text testID={`icon-${props.name}`}>{props.name}</Text>;
  };
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

describe('ItemCard - Simple click test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the items array before each test
    mockItemsArray = [];
  });

  test('Does clicking the star icon call update()?', async () => {
    const ItemCard = require('../app/components/item-card').default;
    const { LIST_TAGS } = require('../app/constants');

    const item = {
      id: 1,
      name: 'Test',
      category: 'top',
      tags: ['casual'],
      hidden: false,
    };

    // Initialize the mock items array with this item
    mockItemsArray = [item];

    const { getAllByRole, getByText, debug } = render(<ItemCard item={item} />);

    console.log('\n=== Rendered Component ===');
    debug();

    console.log('\n=== Looking for buttons ===');
    // Try to find buttons by their accessible role
    try {
      const buttons = getAllByRole('button');
      console.log(`Found ${buttons.length} buttons`);
    } catch (e) {
      console.log('No buttons found by role');
    }

    console.log('\n=== Looking for star icon ===');
    try {
      const starOutline = getByText('star-outline');
      console.log('Found star-outline icon');
    } catch (e) {
      console.log('star-outline not found');
    }

    console.log('\n=== Clicking the first TouchableOpacity (star icon) ===');
    const { UNSAFE_root } = render(<ItemCard item={item} />);
    const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
    console.log(`Found ${touchables.length} TouchableOpacity elements`);

    // First touchable should be the star button
    const starButton = touchables[0];
    console.log('Clicking star button...');
    fireEvent.press(starButton);

    // Give async operations time to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log('\n=== Test Status After Click ===');
    console.log('mockUpdate called:', mockUpdate.mock.calls.length, 'times');
    if (mockUpdate.mock.calls.length > 0) {
      console.log('mockUpdate called with:', mockUpdate.mock.calls[0]);
    }
    console.log('mockShowToast called:', mockShowToast.mock.calls.length, 'times');
    if (mockShowToast.mock.calls.length > 0) {
      console.log('mockShowToast called with:', mockShowToast.mock.calls[0]);
    }

    // The actual assertion - update SHOULD have been called
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(1, {
      tags: ['casual', LIST_TAGS.FAVORITES],
    });

    console.log('\n=== Checking icon state AFTER click ===');
    console.log('Item prop tags (original object):', item.tags);

    // Check what icon is showing - this is THE BUG
    const { getByTestId: getByTestId2, queryByTestId: queryByTestId2 } = render(<ItemCard item={item} />);
    const hasStarOutline = queryByTestId2('icon-star-outline') !== null;
    const hasStar = queryByTestId2('icon-star') !== null;

    console.log('Icon showing star-outline?', hasStarOutline);
    console.log('Icon showing star?', hasStar);

    // THIS IS THE BUG - even though update was called, the icon is still star-outline
    // because the item object hasn't changed
    console.log('\n=== THE BUG ===');
    if (hasStarOutline && !hasStar) {
      console.log('BUG CONFIRMED: Icon is still star-outline even though update was called!');
      console.log('The component is still rendering with the old item prop');
    }
  });
});
