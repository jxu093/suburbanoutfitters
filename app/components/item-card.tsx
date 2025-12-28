import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Alert, Button, StyleSheet, View } from 'react-native';
import { LIST_TAGS, isListTag, getListDisplayName, createListTag } from '../constants';
import { useItems } from '../hooks/use-items';
import type { Item } from '../types';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export default function ItemCard({ item }: { item: Item }) {
  const { items, update, remove, markAsWorn } = useItems();

  // Get all unique list tags from all items
  const allListTags = Array.from(
    new Set(
      items.flatMap((i) => (i.tags ?? []).filter(isListTag))
    )
  );

  // Check if item is in favorites
  const isFavorite = item.tags?.includes(LIST_TAGS.FAVORITES) ?? false;

  async function toggleHidden() {
    if (item.hidden) {
      await update(item.id!, { hidden: false, hiddenUntil: null });
      return;
    }

    Alert.alert('Hide item', 'For how long would you like to hide this item?', [
      { text: '1 day', onPress: async () => await update(item.id!, { hidden: true, hiddenUntil: Date.now() + 24 * 60 * 60 * 1000 }) },
      { text: '7 days', onPress: async () => await update(item.id!, { hidden: true, hiddenUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 }) },
      { text: 'Forever', onPress: async () => await update(item.id!, { hidden: true, hiddenUntil: null }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function confirmDelete() {
    Alert.alert('Delete item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => await remove(item.id!) },
    ]);
  }

  async function toggleFavorite() {
    const currentTags = item.tags ?? [];
    if (isFavorite) {
      await update(item.id!, { tags: currentTags.filter((t) => t !== LIST_TAGS.FAVORITES) });
    } else {
      await update(item.id!, { tags: [...currentTags, LIST_TAGS.FAVORITES] });
    }
  }

  async function addToList(listTag: string) {
    const currentTags = item.tags ?? [];
    if (!currentTags.includes(listTag)) {
      await update(item.id!, { tags: [...currentTags, listTag] });
    }
  }

  async function removeFromList(listTag: string) {
    const currentTags = item.tags ?? [];
    await update(item.id!, { tags: currentTags.filter((t) => t !== listTag) });
  }

  function showListMenu() {
    const itemListTags = (item.tags ?? []).filter(isListTag);
    const availableLists = allListTags.filter((t) => !itemListTags.includes(t));

    const buttons: any[] = [];

    // Show lists item is currently in (to remove)
    itemListTags.forEach((tag) => {
      buttons.push({
        text: `✓ ${getListDisplayName(tag)}`,
        onPress: () => removeFromList(tag),
      });
    });

    // Show available lists to add to
    availableLists.forEach((tag) => {
      buttons.push({
        text: `Add to ${getListDisplayName(tag)}`,
        onPress: () => addToList(tag),
      });
    });

    // Option to create new list
    buttons.push({
      text: '+ Create new list',
      onPress: () => {
        Alert.prompt(
          'New List',
          'Enter a name for the new list:',
          async (name) => {
            if (name && name.trim()) {
              const newTag = createListTag(name.trim());
              await addToList(newTag);
            }
          },
          'plain-text'
        );
      },
    });

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Manage Lists', 'Add or remove from lists:', buttons);
  }

  return (
    <ThemedView style={styles.card}>
      <Link href={`/item/${item.id}`}>
        <Image source={{ uri: item.thumbUri ?? item.imageUri ?? undefined }} style={styles.image} />
      </Link>
      <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
      {item.category ? <ThemedText type="subtitle">{item.category}</ThemedText> : null}

      <View style={styles.actions}>
        <Button title={isFavorite ? '★' : '☆'} onPress={toggleFavorite} color={isFavorite ? '#f0ad4e' : 'gray'} />
        <Button title="Lists" onPress={showListMenu} />
        <Button title={item.hidden ? 'Unhide' : 'Hide'} onPress={toggleHidden} />
        <Button title="Wear" onPress={() => markAsWorn(item.id!)} />
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
