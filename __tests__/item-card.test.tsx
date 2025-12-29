import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Create mutable state that can be updated by tests
let mockItemsArray: any[] = [];

const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockRemove = jest.fn().mockResolvedValue(undefined);
const mockShowToast = jest.fn();

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

jest.mock('../app/constants/theme', () => ({
  Colors: {
    light: {
      text: '#000',
      background: '#fff',
      tint: '#0a7ea4',
      icon: '#000',
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

jest.mock('../app/hooks/use-items', () => ({
  useItems: () => ({
    items: mockItemsArray,
    update: mockUpdate,
    remove: mockRemove,
  }),
}));

jest.mock('../app/components/toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe('ItemCard favorite functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItemsArray = [];
  });

  test('renders star-outline icon when item is not favorited', () => {
    const ItemCard = require('../app/components/item-card').default;

    const item = {
      id: 1,
      name: 'Test Item',
      category: 'top',
      tags: ['casual'],
      hidden: false,
    };

    // Add item to mock array
    mockItemsArray = [item];

    const { getByTestId } = render(<ItemCard item={item} />);

    // Check for star-outline icon
    const starIcon = getByTestId('icon-star-outline');
    expect(starIcon).toBeDefined();
  });

  test('renders filled star icon when item is favorited', () => {
    const ItemCard = require('../app/components/item-card').default;
    const { LIST_TAGS } = require('../app/constants');

    const item = {
      id: 1,
      name: 'Test Item',
      category: 'top',
      tags: ['casual', LIST_TAGS.FAVORITES],
      hidden: false,
    };

    // Add item to mock array
    mockItemsArray = [item];

    const { getByTestId } = render(<ItemCard item={item} />);

    // Check for filled star icon
    const starIcon = getByTestId('icon-star');
    expect(starIcon).toBeDefined();
  });

  test('star icon updates when items array changes', async () => {
    const ItemCard = require('../app/components/item-card').default;
    const { LIST_TAGS } = require('../app/constants');

    // Start with non-favorited item
    const initialItem = {
      id: 1,
      name: 'Test Item',
      category: 'top',
      tags: ['casual'],
      hidden: false,
    };

    mockItemsArray = [initialItem];

    const { getByTestId, queryByTestId, rerender } = render(<ItemCard item={initialItem} />);

    // Verify initial state shows outline star
    expect(getByTestId('icon-star-outline')).toBeDefined();
    expect(queryByTestId('icon-star')).toBeNull();

    // Simulate the items array being updated (as happens in real app)
    const updatedItem = {
      ...initialItem,
      tags: ['casual', LIST_TAGS.FAVORITES],
    };
    mockItemsArray = [updatedItem];

    // Trigger re-render
    rerender(<ItemCard item={initialItem} />);

    // Verify the icon changed to filled star
    // This works because currentItem finds the updated item in mockItemsArray
    expect(getByTestId('icon-star')).toBeDefined();
    expect(queryByTestId('icon-star-outline')).toBeNull();
  });

  test('star icon updates when item is unfavorited', async () => {
    const ItemCard = require('../app/components/item-card').default;
    const { LIST_TAGS } = require('../app/constants');

    // Start with favorited item
    const initialItem = {
      id: 1,
      name: 'Test Item',
      category: 'top',
      tags: ['casual', LIST_TAGS.FAVORITES],
      hidden: false,
    };

    mockItemsArray = [initialItem];

    const { getByTestId, queryByTestId, rerender } = render(<ItemCard item={initialItem} />);

    // Verify initial state shows filled star
    expect(getByTestId('icon-star')).toBeDefined();
    expect(queryByTestId('icon-star-outline')).toBeNull();

    // Simulate the items array being updated
    const updatedItem = {
      ...initialItem,
      tags: ['casual'],
    };
    mockItemsArray = [updatedItem];

    rerender(<ItemCard item={initialItem} />);

    // Verify the icon changed to outline star
    expect(getByTestId('icon-star-outline')).toBeDefined();
    expect(queryByTestId('icon-star')).toBeNull();
  });
});
