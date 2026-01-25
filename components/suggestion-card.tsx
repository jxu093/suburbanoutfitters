import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Linking, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import type { Item } from '@/types';
import { getItemImageUri } from '@/utils/item-helpers';
import { ThemedText } from './themed-text';

/**
 * Suggestion from AI for an item from the user's closet
 */
export type ClosetSuggestion = {
  item: Item;
  reasoning: string;
  matchScore?: number;
};

/**
 * Suggestion from AI for an item to purchase
 */
export type PurchaseSuggestion = {
  category: string;
  description: string;
  colors?: string[];
  style?: string[];
  reasoning: string;
  searchQuery: string;
};

type ClosetSuggestionCardProps = {
  suggestion: ClosetSuggestion;
  onSelect: (item: Item) => void;
  onDismiss?: () => void;
};

/**
 * Card displaying an AI-suggested item from the user's closet
 */
export function ClosetSuggestionCard({ suggestion, onSelect, onDismiss }: ClosetSuggestionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { item, reasoning, matchScore } = suggestion;

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Ionicons name="shirt-outline" size={14} color={colors.tint} />
          <ThemedText style={[styles.badgeText, { color: colors.tint }]}>From Your Closet</ThemedText>
        </View>
        {matchScore !== undefined && (
          <View style={[styles.scoreBadge, { backgroundColor: colors.fillSecondary }]}>
            <ThemedText style={[styles.scoreText, { color: colors.tint }]}>
              {Math.round(matchScore * 100)}% match
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Image
          source={{ uri: getItemImageUri(item) }}
          style={styles.itemImage}
        />
        <View style={styles.itemInfo}>
          <ThemedText style={styles.itemName} numberOfLines={1}>{item.name}</ThemedText>
          <ThemedText style={[styles.reasoning, { color: colors.textSecondary }]} numberOfLines={3}>
            {reasoning}
          </ThemedText>
        </View>
      </View>

      <View style={styles.cardActions}>
        {onDismiss && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.dismissBtn, { borderColor: colors.border }]}
            onPress={onDismiss}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
            <ThemedText style={[styles.actionText, { color: colors.textSecondary }]}>Skip</ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.selectBtn]}
          onPress={() => onSelect(item)}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <ThemedText style={styles.selectText}>Add to Outfit</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type PurchaseSuggestionCardProps = {
  suggestion: PurchaseSuggestion;
  onDismiss?: () => void;
};

/**
 * Card displaying an AI-suggested item to purchase
 */
export function PurchaseSuggestionCard({ suggestion, onDismiss }: PurchaseSuggestionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { category, description, colors: itemColors, style, reasoning, searchQuery } = suggestion;

  const handleSearch = async () => {
    const query = encodeURIComponent(searchQuery);
    const url = `https://www.google.com/search?tbm=shop&q=${query}`;
    await Linking.openURL(url);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: '#4285F420' }]}>
          <Ionicons name="globe-outline" size={14} color="#4285F4" />
          <ThemedText style={[styles.badgeText, { color: '#4285F4' }]}>Shopping Suggestion</ThemedText>
        </View>
        <ThemedText style={[styles.categoryLabel, { color: colors.textSecondary }]}>
          {category}
        </ThemedText>
      </View>

      <View style={styles.purchaseContent}>
        <ThemedText style={styles.description}>{description}</ThemedText>
        <ThemedText style={[styles.reasoning, { color: colors.textSecondary }]}>
          {reasoning}
        </ThemedText>

        {itemColors && itemColors.length > 0 && (
          <View style={styles.tagRow}>
            <ThemedText style={[styles.tagLabel, { color: colors.textSecondary }]}>Colors:</ThemedText>
            {itemColors.slice(0, 3).map((color) => (
              <View key={color} style={[styles.tag, { backgroundColor: colors.fillSecondary }]}>
                <ThemedText style={[styles.tagText, { color: colors.text }]}>{color}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {style && style.length > 0 && (
          <View style={styles.tagRow}>
            <ThemedText style={[styles.tagLabel, { color: colors.textSecondary }]}>Style:</ThemedText>
            {style.slice(0, 3).map((s) => (
              <View key={s} style={[styles.tag, { backgroundColor: colors.fillSecondary }]}>
                <ThemedText style={[styles.tagText, { color: colors.text }]}>{s}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        {onDismiss && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.dismissBtn, { borderColor: colors.border }]}
            onPress={onDismiss}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
            <ThemedText style={[styles.actionText, { color: colors.textSecondary }]}>Skip</ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.searchBtn]}
          onPress={handleSearch}
        >
          <Ionicons name="search" size={18} color="#fff" />
          <ThemedText style={styles.selectText}>Search for This</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type SuggestionListProps = {
  closetSuggestions?: ClosetSuggestion[];
  purchaseSuggestions?: PurchaseSuggestion[];
  onSelectClosetItem: (item: Item) => void;
  onDismissClosetSuggestion?: (index: number) => void;
  onDismissPurchaseSuggestion?: (index: number) => void;
  emptyMessage?: string;
};

/**
 * List of suggestions mixing closet and purchase recommendations
 */
export function SuggestionList({
  closetSuggestions = [],
  purchaseSuggestions = [],
  onSelectClosetItem,
  onDismissClosetSuggestion,
  onDismissPurchaseSuggestion,
  emptyMessage = 'No suggestions available',
}: SuggestionListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (closetSuggestions.length === 0 && purchaseSuggestions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="sparkles-outline" size={48} color={colors.textSecondary} />
        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
          {emptyMessage}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {closetSuggestions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shirt-outline" size={18} color={colors.tint} />
            <ThemedText style={styles.sectionTitle}>From Your Closet</ThemedText>
          </View>
          {closetSuggestions.map((suggestion, index) => (
            <ClosetSuggestionCard
              key={suggestion.item.id}
              suggestion={suggestion}
              onSelect={onSelectClosetItem}
              onDismiss={onDismissClosetSuggestion ? () => onDismissClosetSuggestion(index) : undefined}
            />
          ))}
        </View>
      )}

      {purchaseSuggestions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe-outline" size={18} color="#4285F4" />
            <ThemedText style={styles.sectionTitle}>Shopping Ideas</ThemedText>
          </View>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Items that would complement your outfit
          </ThemedText>
          {purchaseSuggestions.map((suggestion, index) => (
            <PurchaseSuggestionCard
              key={`${suggestion.category}-${index}`}
              suggestion={suggestion}
              onDismiss={onDismissPurchaseSuggestion ? () => onDismissPurchaseSuggestion(index) : undefined}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.card,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    paddingBottom: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.chip,
    backgroundColor: 'transparent',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: Radii.chip,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryLabel: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  cardContent: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: Radii.sm,
  },
  itemInfo: {
    flex: 1,
    gap: Spacing.xxs,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  reasoning: {
    fontSize: 13,
    lineHeight: 18,
  },
  purchaseContent: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginTop: Spacing.xxs,
  },
  tagLabel: {
    fontSize: 12,
  },
  tag: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radii.chip,
  },
  tagText: {
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.sm,
    paddingTop: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.button,
  },
  dismissBtn: {
    flex: 0,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },
  selectBtn: {
    backgroundColor: '#9c27b0',
  },
  searchBtn: {
    backgroundColor: '#4285F4',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  listContainer: {
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
