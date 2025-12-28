import { useMemo } from 'react';
import { StyleSheet, View, Button, Alert } from 'react-native';
import { Link } from 'expo-router';
import OutfitPreview from './outfit-preview';
import type { Item, Outfit } from '../types';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useOutfits } from '../hooks/use-outfits';

type OutfitCardProps = {
  outfit: Outfit;
  allItems: Item[];
};

export default function OutfitCard({ outfit, allItems }: OutfitCardProps) {
  const { remove } = useOutfits();

  const outfitItems = useMemo(() => {
    return outfit.itemIds
      .map((id) => allItems.find((item) => item.id === id))
      .filter((item): item is Item => item !== undefined);
  }, [outfit.itemIds, allItems]);

  function confirmDelete() {
    Alert.alert('Delete outfit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => await remove(outfit.id!) },
    ]);
  }

  return (
    <ThemedView style={styles.card}>
      <ThemedText type="defaultSemiBold">{outfit.name}</ThemedText>
      <OutfitPreview items={outfitItems} />

      <View style={styles.actions}>
        <Link href={`/outfits/${outfit.id}`}>
          <Button title="Open" onPress={() => {}} />
        </Link>
        <Button title="Delete" color="#d9534f" onPress={confirmDelete} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
