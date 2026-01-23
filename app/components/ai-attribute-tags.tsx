import { StyleSheet, useColorScheme, View } from 'react-native';
import type { AIItemAttributes } from '../types';
import { ThemedText } from './themed-text';
import { Colors, Radii, Spacing } from '../constants/theme';

type Props = {
  item: AIItemAttributes;
  compact?: boolean;
};

/**
 * Displays AI-analyzed attributes for a clothing item.
 * Shows colors, style tags, occasions, and other detected attributes.
 */
export function AIAttributeTags({ item, compact = false }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const hasAnyAttributes = !!(
    item.aiColors?.length ||
    item.aiStyle?.length ||
    item.aiOccasions?.length ||
    item.aiPattern ||
    item.aiMaterial ||
    item.aiSeasons?.length ||
    item.aiFormality
  );

  if (!hasAnyAttributes) {
    return null;
  }

  const renderTag = (label: string, color: string, key: string) => (
    <View key={key} style={[styles.tag, { backgroundColor: color }]}>
      <ThemedText style={styles.tagText}>{label}</ThemedText>
    </View>
  );

  const renderSection = (title: string, children: React.ReactNode) => {
    if (compact) return children;
    return (
      <View style={styles.section}>
        <ThemedText type="footnote" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {title}
        </ThemedText>
        <View style={styles.tagRow}>{children}</View>
      </View>
    );
  };

  // Color palette for tags
  const tagColors = {
    color: '#e3f2fd',      // Light blue
    style: '#f3e5f5',      // Light purple
    occasion: '#e8f5e9',   // Light green
    material: '#fff3e0',   // Light orange
    season: '#fce4ec',     // Light pink
    formality: '#f5f5f5',  // Light gray
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Colors */}
      {item.aiColors && item.aiColors.length > 0 && (
        renderSection('Colors',
          item.aiColors.map((color, i) => renderTag(color, tagColors.color, `color-${i}`))
        )
      )}

      {/* Style */}
      {item.aiStyle && item.aiStyle.length > 0 && (
        renderSection('Style',
          item.aiStyle.map((style, i) => renderTag(style, tagColors.style, `style-${i}`))
        )
      )}

      {/* Occasions */}
      {item.aiOccasions && item.aiOccasions.length > 0 && (
        renderSection('Occasions',
          item.aiOccasions.map((occ, i) => renderTag(occ, tagColors.occasion, `occ-${i}`))
        )
      )}

      {/* Pattern & Material */}
      {(item.aiPattern || item.aiMaterial) && (
        renderSection('Details', <>
          {item.aiPattern && renderTag(item.aiPattern, tagColors.material, 'pattern')}
          {item.aiMaterial && renderTag(item.aiMaterial, tagColors.material, 'material')}
        </>)
      )}

      {/* Seasons */}
      {item.aiSeasons && item.aiSeasons.length > 0 && (
        renderSection('Seasons',
          item.aiSeasons.map((season, i) => renderTag(season, tagColors.season, `season-${i}`))
        )
      )}

      {/* Formality */}
      {item.aiFormality && (
        renderSection('Formality',
          renderTag(getFormalityLabel(item.aiFormality), tagColors.formality, 'formality')
        )
      )}

      {/* Compact mode: show all tags inline */}
      {compact && (
        <View style={styles.compactRow}>
          {item.aiColors?.map((color, i) => renderTag(color, tagColors.color, `c-color-${i}`))}
          {item.aiStyle?.map((style, i) => renderTag(style, tagColors.style, `c-style-${i}`))}
          {item.aiPattern && renderTag(item.aiPattern, tagColors.material, 'c-pattern')}
        </View>
      )}
    </View>
  );
}

function getFormalityLabel(formality: number): string {
  switch (formality) {
    case 1: return 'Very Casual';
    case 2: return 'Casual';
    case 3: return 'Smart Casual';
    case 4: return 'Business';
    case 5: return 'Formal';
    default: return `Formality ${formality}`;
  }
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  containerCompact: {
    gap: Spacing.xs,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  compactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
