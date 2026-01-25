import React from 'react';
import { render } from '@testing-library/react-native';
import type { AIItemAttributes } from '../types';

// Mock dependencies before importing the component
jest.mock('../components/themed-text', () => ({
  ThemedText: ({ children, ...props }: any) => {
    const { Text } = require('react-native');
    return <Text {...props}>{children}</Text>;
  },
}));

// Now import the component
import { AIAttributeTags } from '../components/ai-attribute-tags';

describe('AIAttributeTags', () => {
  describe('rendering', () => {
    it('returns null when no AI attributes are present', () => {
      const emptyItem: AIItemAttributes = {};
      const { toJSON } = render(<AIAttributeTags item={emptyItem} />);
      expect(toJSON()).toBeNull();
    });

    it('returns null when all AI attributes are null', () => {
      const nullItem: AIItemAttributes = {
        aiColors: null,
        aiStyle: null,
        aiOccasions: null,
        aiPattern: null,
        aiMaterial: null,
        aiSeasons: null,
        aiFormality: null,
      };
      const { toJSON } = render(<AIAttributeTags item={nullItem} />);
      expect(toJSON()).toBeNull();
    });

    it('returns null when arrays are empty', () => {
      const emptyArraysItem: AIItemAttributes = {
        aiColors: [],
        aiStyle: [],
        aiOccasions: [],
        aiSeasons: [],
      };
      const { toJSON } = render(<AIAttributeTags item={emptyArraysItem} />);
      expect(toJSON()).toBeNull();
    });

    it('renders colors when present', () => {
      const item: AIItemAttributes = {
        aiColors: ['navy', 'white'],
      };
      const { getByText } = render(<AIAttributeTags item={item} />);
      expect(getByText('navy')).toBeTruthy();
      expect(getByText('white')).toBeTruthy();
    });

    it('renders style tags when present', () => {
      const item: AIItemAttributes = {
        aiStyle: ['casual', 'preppy'],
      };
      const { getByText } = render(<AIAttributeTags item={item} />);
      expect(getByText('casual')).toBeTruthy();
      expect(getByText('preppy')).toBeTruthy();
    });

    it('renders occasions when present', () => {
      const item: AIItemAttributes = {
        aiOccasions: ['work', 'weekend'],
      };
      const { getByText } = render(<AIAttributeTags item={item} />);
      expect(getByText('work')).toBeTruthy();
      expect(getByText('weekend')).toBeTruthy();
    });

    it('renders pattern when present', () => {
      const item: AIItemAttributes = {
        aiPattern: 'striped',
      };
      const { getByText } = render(<AIAttributeTags item={item} />);
      expect(getByText('striped')).toBeTruthy();
    });

    it('renders material when present', () => {
      const item: AIItemAttributes = {
        aiMaterial: 'cotton',
      };
      const { getByText } = render(<AIAttributeTags item={item} />);
      expect(getByText('cotton')).toBeTruthy();
    });

    it('renders seasons when present', () => {
      const item: AIItemAttributes = {
        aiSeasons: ['spring', 'fall'],
      };
      const { getByText } = render(<AIAttributeTags item={item} />);
      expect(getByText('spring')).toBeTruthy();
      expect(getByText('fall')).toBeTruthy();
    });

    it('renders formality labels correctly', () => {
      const formalityTests = [
        { value: 1, label: 'Very Casual' },
        { value: 2, label: 'Casual' },
        { value: 3, label: 'Smart Casual' },
        { value: 4, label: 'Business' },
        { value: 5, label: 'Formal' },
      ];

      for (const test of formalityTests) {
        const item: AIItemAttributes = {
          aiFormality: test.value,
        };
        const { getByText, unmount } = render(<AIAttributeTags item={item} />);
        expect(getByText(test.label)).toBeTruthy();
        unmount();
      }
    });

    it('renders all attributes together', () => {
      const fullItem: AIItemAttributes = {
        aiColors: ['blue'],
        aiStyle: ['minimalist'],
        aiOccasions: ['work'],
        aiPattern: 'solid',
        aiMaterial: 'cotton',
        aiSeasons: ['summer'],
        aiFormality: 3,
      };
      const { getByText } = render(<AIAttributeTags item={fullItem} />);

      expect(getByText('blue')).toBeTruthy();
      expect(getByText('minimalist')).toBeTruthy();
      expect(getByText('work')).toBeTruthy();
      expect(getByText('solid')).toBeTruthy();
      expect(getByText('cotton')).toBeTruthy();
      expect(getByText('summer')).toBeTruthy();
      expect(getByText('Smart Casual')).toBeTruthy();
    });
  });

  describe('compact mode', () => {
    it('renders inline in compact mode', () => {
      const item: AIItemAttributes = {
        aiColors: ['red'],
        aiStyle: ['casual'],
        aiPattern: 'plaid',
      };
      const { toJSON } = render(<AIAttributeTags item={item} compact />);
      // In compact mode, it should still render (not null)
      expect(toJSON()).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles unknown formality values', () => {
      const item: AIItemAttributes = {
        aiFormality: 10, // Invalid value
      };
      const { getByText } = render(<AIAttributeTags item={item} />);
      expect(getByText('Formality 10')).toBeTruthy();
    });

    it('handles single item arrays', () => {
      const item: AIItemAttributes = {
        aiColors: ['black'],
      };
      const { getByText } = render(<AIAttributeTags item={item} />);
      expect(getByText('black')).toBeTruthy();
    });
  });
});
