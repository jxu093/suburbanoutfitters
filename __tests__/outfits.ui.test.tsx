import React from 'react';

// Ensure a minimal react-native Platform implementation is available for theme constants
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native/jest/mock');
  // ensure Platform exists and has select
  rn.Platform = rn.Platform || { OS: 'ios' };
  rn.Platform.select = rn.Platform.select || ((obj: any) => obj?.default ?? obj?.ios ?? obj?.android ?? obj);
  return rn;
});

import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock hooks and router before importing the component
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockRemove = jest.fn().mockResolvedValue(undefined);
const mockRefresh = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
  Link: ({ children }: any) => children,
}));

jest.mock('../app/hooks/use-outfits', () => ({
  useOutfits: () => ({
    outfits: [{ id: 1, name: 'Test Outfit', itemIds: [1], notes: '', createdAt: Date.now() }],
    loading: false,
    refresh: mockRefresh,
    update: mockUpdate,
    remove: mockRemove,
    add: jest.fn(),
  }),
}));

jest.mock('../app/hooks/use-items', () => ({
  useItems: () => ({
    items: [
      { id: 1, name: 'Shirt' },
      { id: 2, name: 'Jeans' },
      { id: 3, name: 'Hat' },
    ],
    loading: false,
    refresh: jest.fn(),
  }),
}));

// Mock expo-image to avoid ESM issues
jest.mock('expo-image', () => ({ Image: (props: any) => null }));

// Provide a minimal theme mock (avoids needing react-native Platform.select during tests)
jest.mock('../app/constants/theme', () => ({
  Colors: {
    light: { text: '#000', background: '#fff', tint: '#0a7ea4', icon: '#000', tabIconDefault: '#000', tabIconSelected: '#0a7ea4' },
    dark: { text: '#fff', background: '#000', tint: '#fff', icon: '#fff', tabIconDefault: '#fff', tabIconSelected: '#fff' },
  },
  Fonts: { sans: 'system-ui', serif: 'serif', rounded: 'system-ui', mono: 'monospace' },
}));

const OutfitScreen = require('../app/(tabs)/outfits/[id].tsx').default;

describe('Outfit UI edit flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('edits outfit name and adds an item, then saves', async () => {
    const { getByText, getByTestId, getByDisplayValue } = render(React.createElement(OutfitScreen));

    // initial name
    expect(getByText('Test Outfit')).toBeTruthy();

    // open editor
    fireEvent.press(getByTestId('edit-button'));

    // change name
    const input = getByDisplayValue('Test Outfit');
    fireEvent.changeText(input, 'New Outfit Name');

    // add Jeans (id=2)
    fireEvent.press(getByTestId('toggle-item-2'));

    // save
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());

    const calledWith = mockUpdate.mock.calls[0];
    expect(calledWith[1].name).toBe('New Outfit Name');
    expect(calledWith[1].itemIds).toEqual([2]);
  });
});
