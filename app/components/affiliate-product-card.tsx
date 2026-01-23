import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '../constants/theme';
import { affiliateService } from '../services/affiliate';
import { ThemedText } from './themed-text';

type ShopButtonProps = {
  label: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
};

function ShopButton({ label, url, icon, color, onPress }: ShopButtonProps) {
  const handlePress = async () => {
    onPress?.();
    await affiliateService.openProductUrl(url);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.shopButton, { backgroundColor: color }]}>
      <Ionicons name={icon} size={16} color="#fff" />
      <ThemedText style={styles.shopButtonText}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

type MissingItemCardProps = {
  category: string;
  description: string;
  colors?: string[];
  style?: string[];
  onShopPress?: () => void;
};

/**
 * Card for displaying a missing item with shopping links
 * Used in inspiration matching results
 */
export function MissingItemCard({ category, description, colors, style, onShopPress }: MissingItemCardProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const links = affiliateService.getShoppingLinksForMissingItem({
    category,
    description,
    colors,
    style,
  });

  return (
    <View style={[styles.card, { backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Ionicons name="add-circle-outline" size={16} color="#9c27b0" />
          <ThemedText style={styles.categoryText}>{category}</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.description}>{description}</ThemedText>

      {colors && colors.length > 0 && (
        <View style={styles.tagRow}>
          <ThemedText style={[styles.tagLabel, { color: themeColors.textSecondary }]}>Colors:</ThemedText>
          {colors.map((color) => (
            <View key={color} style={[styles.tag, { backgroundColor: themeColors.fillSecondary }]}>
              <ThemedText style={[styles.tagText, { color: themeColors.text }]}>{color}</ThemedText>
            </View>
          ))}
        </View>
      )}

      {style && style.length > 0 && (
        <View style={styles.tagRow}>
          <ThemedText style={[styles.tagLabel, { color: themeColors.textSecondary }]}>Style:</ThemedText>
          {style.map((s) => (
            <View key={s} style={[styles.tag, { backgroundColor: themeColors.fillSecondary }]}>
              <ThemedText style={[styles.tagText, { color: themeColors.text }]}>{s}</ThemedText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.shopButtons}>
        <ShopButton
          label="Amazon"
          url={links.amazon}
          icon="logo-amazon"
          color="#FF9900"
          onPress={onShopPress}
        />
        <ShopButton
          label="Google"
          url={links.google}
          icon="search"
          color="#4285F4"
          onPress={onShopPress}
        />
      </View>
    </View>
  );
}

type ShopSimilarButtonProps = {
  query: string;
  category?: string;
  compact?: boolean;
  onPress?: () => void;
};

/**
 * Inline button to shop for similar items
 * Can be used anywhere you want to add shopping functionality
 */
export function ShopSimilarButton({ query, category, compact = false, onPress }: ShopSimilarButtonProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const links = affiliateService.getShoppingLinks(query, category);

  const handleAmazon = async () => {
    onPress?.();
    await affiliateService.openProductUrl(links.amazon);
  };

  const handleGoogle = async () => {
    onPress?.();
    await affiliateService.openProductUrl(links.google);
  };

  if (compact) {
    return (
      <View style={styles.compactButtons}>
        <TouchableOpacity onPress={handleAmazon} style={styles.compactButton}>
          <Ionicons name="logo-amazon" size={18} color="#FF9900" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGoogle} style={styles.compactButton}>
          <Ionicons name="search" size={18} color="#4285F4" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.shopSimilarContainer, { borderColor: themeColors.border }]}>
      <View style={styles.shopSimilarHeader}>
        <Ionicons name="cart-outline" size={16} color={themeColors.textSecondary} />
        <ThemedText style={[styles.shopSimilarTitle, { color: themeColors.textSecondary }]}>
          Shop Similar
        </ThemedText>
      </View>
      <View style={styles.shopButtons}>
        <ShopButton
          label="Amazon"
          url={links.amazon}
          icon="logo-amazon"
          color="#FF9900"
          onPress={onPress}
        />
        <ShopButton
          label="Google"
          url={links.google}
          icon="search"
          color="#4285F4"
          onPress={onPress}
        />
      </View>
    </View>
  );
}

type ShopMissingItemsProps = {
  items: {
    category: string;
    description: string;
    colors?: string[];
    style?: string[];
  }[];
  onShopPress?: () => void;
};

/**
 * Section displaying all missing items with shopping links
 * Used in inspiration matching results
 */
export function ShopMissingItems({ items, onShopPress }: ShopMissingItemsProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="cart-outline" size={20} color="#9c27b0" />
        <ThemedText style={styles.sectionTitle}>Complete the Look</ThemedText>
      </View>
      <ThemedText style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
        Shop for these missing pieces to recreate the inspiration
      </ThemedText>
      <View style={styles.itemsList}>
        {items.map((item, index) => (
          <MissingItemCard
            key={index}
            category={item.category}
            description={item.description}
            colors={item.colors}
            style={item.style}
            onShopPress={onShopPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: Radii.card,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginBottom: Spacing.xs,
  },
  tagLabel: {
    fontSize: 12,
    marginRight: Spacing.xxs,
  },
  tag: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radii.chip,
  },
  tagText: {
    fontSize: 11,
  },
  shopButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  shopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.button,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  compactButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  compactButton: {
    padding: Spacing.xs,
  },
  shopSimilarContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.md,
  },
  shopSimilarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  shopSimilarTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  itemsList: {
    gap: Spacing.sm,
  },
});
