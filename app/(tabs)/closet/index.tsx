import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, useColorScheme, View } from 'react-native';
import ItemGrid from '../../../app/components/item-grid';
import { ThemedButton } from '../../../app/components/themed-button';
import { ThemedChip } from '../../../app/components/themed-chip';
import { ThemedText } from '../../../app/components/themed-text';
import { ThemedView } from '../../../app/components/themed-view';
import { isListTag, getListDisplayName, LIST_TAGS } from '../../../app/constants';
import { Colors, Radii, Spacing } from '../../../app/constants/theme';
import { useItems } from '../../../app/hooks/use-items';
import { isItemHidden } from '../../../app/utils/item-helpers';

function showIconLegend() {
  Alert.alert(
    'Icon Legend',
    '★ Favorite - Add/remove from favorites\n' +
      '☰ Lists - Manage lists\n' +
      '👁 Hide - Temporarily hide item\n' +
      '🗑 Delete - Delete item'
  );
}

export default function ClosetScreen() {
  const router = useRouter();
  const { items, loading, refresh } = useItems();
  const [q, setQ] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Separate regular tags from list tags
  const { regularTags, listTags } = useMemo(() => {
    const regular = new Set<string>();
    const lists = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((tag) => {
        if (isListTag(tag)) {
          lists.add(tag);
        } else {
          regular.add(tag);
        }
      });
    });
    return { regularTags: Array.from(regular), listTags: Array.from(lists) };
  }, [items]);

  const visible = useMemo(() => {
    return items.filter((i) => {
      if (!showHidden && isItemHidden(i)) return false;
      // Filter by list
      if (selectedList && (!i.tags || !i.tags.includes(selectedList))) return false;
      // Filter by tag
      if (selectedTag && (!i.tags || !i.tags.includes(selectedTag))) return false;
      if (!q) return true;
      const s = `${i.name} ${i.category ?? ''} ${i.tags?.join(' ') ?? ''}`.toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [items, q, showHidden, selectedTag, selectedList]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="largeTitle">Closet</ThemedText>
        <View style={styles.headerActions}>
          <Pressable
            onPress={showIconLegend}
            style={({ pressed }) => [styles.helpBtn, { backgroundColor: pressed ? colors.fill : 'transparent' }]}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.icon} />
          </Pressable>
          <ThemedButton
            title="Add"
            variant="primary"
            size="small"
            icon="add"
            onPress={() => router.push('/add')}
          />
        </View>
      </View>

      <View style={styles.controls}>
        <View style={[styles.searchContainer, { backgroundColor: colors.fillSecondary, borderColor: colors.separator }]}>
          <Ionicons name="search" size={18} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            placeholder="Search items..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text }]}
            value={q}
            onChangeText={setQ}
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.icon} />
            </Pressable>
          )}
        </View>
        <View style={styles.controlsRow}>
          <ThemedButton
            title={showHidden ? 'Hide hidden' : 'Show hidden'}
            variant="secondary"
            size="small"
            icon={showHidden ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setShowHidden((s) => !s)}
          />
          <ThemedButton
            title="Refresh"
            variant="tertiary"
            size="small"
            icon="refresh-outline"
            onPress={refresh}
          />
        </View>
      </View>

      {/* List filters */}
      {listTags.length > 0 && (
        <View style={styles.filterSection}>
          <ThemedText type="footnote" style={[styles.filterLabel, { color: colors.textSecondary }]}>LISTS</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <ThemedChip
              label="Favorites"
              icon="star"
              selected={selectedList === LIST_TAGS.FAVORITES}
              color={colors.star}
              onPress={() => setSelectedList(selectedList === LIST_TAGS.FAVORITES ? null : LIST_TAGS.FAVORITES)}
            />
            {listTags.filter((t) => t !== LIST_TAGS.FAVORITES).map((tag) => (
              <ThemedChip
                key={tag}
                label={getListDisplayName(tag)}
                selected={selectedList === tag}
                onPress={() => setSelectedList(selectedList === tag ? null : tag)}
              />
            ))}
            {selectedList && (
              <ThemedChip
                label="Clear"
                icon="close"
                onPress={() => setSelectedList(null)}
              />
            )}
          </ScrollView>
        </View>
      )}

      {/* Tag filters */}
      {regularTags.length > 0 && (
        <View style={styles.filterSection}>
          <ThemedText type="footnote" style={[styles.filterLabel, { color: colors.textSecondary }]}>TAGS</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {regularTags.map((tag) => (
              <ThemedChip
                key={tag}
                label={tag}
                selected={selectedTag === tag}
                onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
              />
            ))}
            {selectedTag && (
              <ThemedChip
                label="Clear"
                icon="close"
                onPress={() => setSelectedTag(null)}
              />
            )}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ThemedText type="secondary">Loading...</ThemedText>
        </View>
      ) : (
        <ItemGrid items={visible} />
      )}

      {visible.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Ionicons name="shirt-outline" size={48} color={colors.systemGray3} />
          <ThemedText type="headline" style={{ marginTop: Spacing.md }}>No items yet</ThemedText>
          <ThemedText type="secondary" style={{ marginTop: Spacing.xs }}>Add your first clothing item</ThemedText>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  helpBtn: {
    padding: Spacing.xs,
    borderRadius: Radii.sm,
  },
  controls: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.input,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  filterLabel: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
});
