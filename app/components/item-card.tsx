import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Alert, Button, StyleSheet, View } from 'react-native';
import { useItems } from '../hooks/use-items';
import type { Item } from '../types';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export default function ItemCard({ item }: { item: Item }) {
  const { update, remove } = useItems();

  async function toggleHidden() {
    if (item.hidden) {
      // currently hidden -> unhide
      await update(item.id!, { hidden: false, hiddenUntil: null });
      return;
    }

    // Offer choices for how long to hide
    Alert.alert('Hide item', 'For how long would you like to hide this item?', [
      { text: '1 day', onPress: async () => await update(item.id!, { hidden: true, hiddenUntil: Date.now() + 24 * 60 * 60 * 1000 }) },
      { text: '7 days', onPress: async () => await update(item.id!, { hidden: true, hiddenUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 }) },
      { text: 'Forever', onPress: async () => await update(item.id!, { hidden: true, hiddenUntil: null }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function markWorn() {
    await update(item.id!, { wornAt: Date.now() });
  }

  function confirmDelete() {
    Alert.alert('Delete item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => await remove(item.id!) },
    ]);
  }

  return (
    <ThemedView style={styles.card}>
      <Link href={`/item/${item.id}`}>
        <Image source={{ uri: item.thumbUri ?? item.imageUri ?? undefined }} style={styles.image} />
      </Link>
      <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
      {item.category ? <ThemedText type="subtitle">{item.category}</ThemedText> : null}

      <View style={styles.actions}>
        <Button title={item.hidden ? 'Unhide' : 'Hide'} onPress={toggleHidden} />
        <Button title="Wear" onPress={markWorn} />
        <Button title="Delete" color="#d9534f" onPress={confirmDelete} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 6,
    alignItems: 'center',
  },
  image: {
    width: 160,
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    width: '100%',
    justifyContent: 'space-between',
  },
});