import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock hooks and router before importing the component
const mockItems = [
  { id: 1, name: 'T-Shirt', category: 'top', tags: ['casual', 'summer'], hidden: false },
  { id: 2, name: 'Jeans', category: 'bottom', tags: ['casual', 'winter'], hidden: false },
  { id: 3, name: 'Jacket', category: 'outerwear', tags: ['cool', 'winter'], hidden: false },
  { id: 4, name: 'Hidden Top', category: 'top', tags: ['hidden'], hidden: true },
];
const mockRefresh = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children,
}));

jest.mock('../app/hooks/use-items', () => ({
  useItems: () => ({
    items: mockItems,
    loading: false,
    refresh: mockRefresh,
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    markAsWorn: jest.fn(),
  }),
}));

// Mock expo-image to avoid ESM issues
jest.mock('expo-image', () => ({ Image: (props: any) => null }));

// Provide a minimal theme mock
jest.mock('../app/constants/theme', () => ({
  Colors: {
    light: { text: '#000', background: '#fff', tint: '#0a7ea4', icon: '#000', tabIconDefault: '#000', tabIconSelected: '#0a7ea4' },
    dark: { text: '#fff', background: '#000', tint: '#fff', icon: '#fff', tabIconDefault: '#fff', tabIconSelected: '#fff' },
  },
  Fonts: { sans: 'system-ui', serif: 'serif', rounded: 'system-ui', mono: 'monospace' },
}));

// Mock ThemedText and ThemedView
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

// Mock ItemGrid as it's a child component and we only care about filters here
jest.mock('../app/components/item-grid', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ items }: { items: any[] }) => (
    <View testID="item-grid-mock">
      {items.map(item => (
        <Text key={item.id} testID={`item-name-${item.id}`}>
          {item.name}
        </Text>
      ))}
    </View>
  );
});

const ClosetScreen = require('../app/(tabs)/closet/index.tsx').default;

describe('ClosetScreen filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('filters items by search query', async () => {
    const { getByPlaceholderText, getByTestId, queryByTestId } = render(React.createElement(ClosetScreen));

    const searchInput = getByPlaceholderText('Search');
    fireEvent.changeText(searchInput, 'T-Shirt');

    await waitFor(() => {
      expect(getByTestId('item-name-1')).toHaveTextContent('T-Shirt');
      expect(queryByTestId('item-name-2')).toBeNull(); // Jeans
    });

    fireEvent.changeText(searchInput, 'Jeans');
    await waitFor(() => {
      expect(getByTestId('item-name-2')).toHaveTextContent('Jeans');
      expect(queryByTestId('item-name-1')).toBeNull(); // T-Shirt
    });
  });

  test('toggles visibility of hidden items', async () => {
    const { getByText, getByTestId, queryByTestId } = render(React.createElement(ClosetScreen));

    // Initially, hidden item should not be visible
    expect(queryByTestId('item-name-4')).toBeNull();

    // Show hidden items
    fireEvent.press(getByText('Show hidden'));
    await waitFor(() => {
      expect(getByText('Hide hidden')).toBeTruthy(); // Button text changes
      expect(getByTestId('item-name-4')).toHaveTextContent('Hidden Top');
    });

    // Hide hidden items again
    fireEvent.press(getByText('Hide hidden'));
    await waitFor(() => {
      expect(getByText('Show hidden')).toBeTruthy(); // Button text changes back
      expect(queryByTestId('item-name-4')).toBeNull();
    });
  });

  test('filters items by selected tag', async () => {
    const { getByText, getByTestId, queryByTestId } = render(React.createElement(ClosetScreen));

    // Select 'summer' tag
    fireEvent.press(getByText('summer'));

    await waitFor(() => {
      expect(getByTestId('item-name-1')).toHaveTextContent('T-Shirt'); // has summer tag
      expect(queryByTestId('item-name-2')).toBeNull(); // no summer tag
      expect(queryByTestId('item-name-3')).toBeNull(); // no summer tag
    });

    // Select 'winter' tag
    fireEvent.press(getByText('winter')); // This should clear 'summer' and select 'winter'
    await waitFor(() => {
      expect(queryByTestId('item-name-1')).toBeNull(); // no winter tag
      expect(getByTestId('item-name-2')).toHaveTextContent('Jeans'); // has winter tag
      expect(getByTestId('item-name-3')).toHaveTextContent('Jacket'); // has winter tag
    });

    // Clear tag filter
    fireEvent.press(getByText('Clear Tag Filter'));
    await waitFor(() => {
      expect(getByTestId('item-name-1')).toHaveTextContent('T-Shirt');
      expect(getByTestId('item-name-2')).toHaveTextContent('Jeans');
      expect(getByTestId('item-name-3')).toHaveTextContent('Jacket');
    });
  });

  test('refresh button calls refresh from useItems hook', async () => {
    const { getByText } = render(React.createElement(ClosetScreen));
    fireEvent.press(getByText('Refresh'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
