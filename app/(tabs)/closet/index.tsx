import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import ItemGrid from '../../../app/components/item-grid';
import { ThemedText } from '../../../app/components/themed-text';
import { ThemedView } from '../../../app/components/themed-view';
import { isListTag, getListDisplayName, LIST_TAGS } from '../../../app/constants';
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
        <ThemedText type="title">Closet</ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={showIconLegend} style={styles.helpBtn}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
          </TouchableOpacity>
          <Button title="Add" onPress={() => router.push('/add')} />
        </View>
      </View>

      <View style={styles.controls}>
        <TextInput placeholder="Search" style={styles.input} value={q} onChangeText={setQ} />
        <View style={styles.controlsRow}>
          <Button title={showHidden ? 'Hide hidden' : 'Show hidden'} onPress={() => setShowHidden((s) => !s)} />
          <Button title="Refresh" onPress={refresh} />
        </View>
      </View>

      {/* List filters */}
      {listTags.length > 0 && (
        <View style={styles.listFilters}>
          <ThemedText type="defaultSemiBold" style={styles.filterLabel}>Lists:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <Button
              title={`★ Favorites`}
              onPress={() => setSelectedList(selectedList === LIST_TAGS.FAVORITES ? null : LIST_TAGS.FAVORITES)}
              color={selectedList === LIST_TAGS.FAVORITES ? '#f0ad4e' : 'gray'}
            />
            {listTags.filter((t) => t !== LIST_TAGS.FAVORITES).map((tag) => (
              <Button
                key={tag}
                title={getListDisplayName(tag)}
                onPress={() => setSelectedList(selectedList === tag ? null : tag)}
                color={selectedList === tag ? 'blue' : 'gray'}
              />
            ))}
            {selectedList && <Button title="Clear" onPress={() => setSelectedList(null)} />}
          </ScrollView>
        </View>
      )}

      {/* Tag filters */}
      {regularTags.length > 0 && (
        <View style={styles.tagFilters}>
          <ThemedText type="defaultSemiBold" style={styles.filterLabel}>Tags:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {regularTags.map((tag) => (
              <Button
                key={tag}
                title={tag}
                onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
                color={selectedTag === tag ? 'blue' : 'gray'}
              />
            ))}
            {selectedTag && <Button title="Clear" onPress={() => setSelectedTag(null)} />}
          </ScrollView>
        </View>
      )}

      {loading ? <ThemedText>Loading...</ThemedText> : <ItemGrid items={visible} />}

      {visible.length === 0 && !loading ? (
        <View style={styles.empty}>
          <ThemedText>No items — add your first item</ThemedText>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  helpBtn: { padding: 4 },
  controls: { padding: 12, gap: 8 },
  controlsRow: { flexDirection: 'row', gap: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8 },
  empty: { padding: 20, alignItems: 'center' },
  listFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 8,
  },
  tagFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 8,
  },
  filterLabel: {
    minWidth: 50,
  },
  filterScroll: {
    flexDirection: 'row',
  },
});
