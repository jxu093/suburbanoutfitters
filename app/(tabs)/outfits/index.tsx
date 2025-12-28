import { FlatList, StyleSheet, View, Button } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView } from '../../../app/components/themed-view';
import { ThemedText } from '../../../app/components/themed-text';
import OutfitCard from '../../../app/components/outfit-card';
import { useOutfits } from '../../../app/hooks/use-outfits';
import { useItems } from '../../../app/hooks/use-items';

export default function OutfitsListScreen() {
  const { outfits, loading: outfitsLoading, refresh } = useOutfits();
  const { items, loading: itemsLoading } = useItems();

  const loading = outfitsLoading || itemsLoading;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title">Outfits</ThemedText>
        <Link href="/outfits/builder">
          <Button title="Builder" onPress={() => {}} />
        </Link>
      </View>

      <View style={styles.controls}>
        <Button title="Refresh" onPress={refresh} />
      </View>

      {loading ? <ThemedText>Loading...</ThemedText> : null}

      <FlatList data={outfits} keyExtractor={(o) => String(o.id)} renderItem={({ item }) => <OutfitCard outfit={item} allItems={items} />} contentContainerStyle={styles.list} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, alignItems: 'center' },
  controls: { padding: 12 },
  list: { padding: 12, gap: 12 },
});