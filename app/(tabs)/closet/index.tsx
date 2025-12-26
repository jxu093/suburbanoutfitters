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

  const visible = useMemo(() => {
    return items.filter((i) => {
      if (!showHidden && i.hidden) return false;
      if (!q) return true;
      const s = `${i.name} ${i.category ?? ''} ${i.tags?.join(' ') ?? ''}`.toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [items, q, showHidden]);

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
});