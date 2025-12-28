import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import ItemGrid from '../../../app/components/item-grid';
import { ThemedText } from '../../../app/components/themed-text';
import { ThemedView } from '../../../app/components/themed-view';
import { useItems } from '../../../app/hooks/use-items';

export default function ClosetScreen() {
  const { items, loading, refresh } = useItems();
  const [q, setQ] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [items]);

  const visible = useMemo(() => {
    return items.filter((i) => {
      if (!showHidden && i.hidden) return false;
      if (selectedTag && (!i.tags || !i.tags.includes(selectedTag))) return false;
      if (!q) return true;
      const s = `${i.name} ${i.category ?? ''} ${i.tags?.join(' ') ?? ''}`.toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [items, q, showHidden, selectedTag]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title">Closet</ThemedText>
        <Link href="/add">
          <Button title="Add" onPress={() => {}} />
        </Link>
      </View>

      <View style={styles.controls}>
        <TextInput placeholder="Search" style={styles.input} value={q} onChangeText={setQ} />
        <Button title={showHidden ? 'Hide hidden' : 'Show hidden'} onPress={() => setShowHidden((s) => !s)} />
        <Button title="Refresh" onPress={refresh} />
      </View>

      <View style={styles.tagFilters}>
        {allTags.map((tag) => (
          <Button
            key={tag}
            title={tag}
            onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
            color={selectedTag === tag ? 'blue' : 'gray'}
          />
        ))}
        {selectedTag && <Button title="Clear Tag Filter" onPress={() => setSelectedTag(null)} />}
      </View>

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
  controls: { padding: 12, gap: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8 },
  empty: { padding: 20, alignItems: 'center' },
  tagFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
});
