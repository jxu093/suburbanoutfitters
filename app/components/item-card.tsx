import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { LIST_TAGS, isListTag, getListDisplayName, createListTag } from '../constants';
import { Colors, Radii, Shadows, Spacing } from '../constants/theme';
import { useItems } from '../hooks/use-items';
import type { Item } from '../types';
import { ThemedText } from './themed-text';
import { useToast } from './toast';

export default function ItemCard({ item }: { item: Item }) {
  const { items, update, remove } = useItems();
  const { showToast } = useToast();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get all unique list tags from all items
  const allListTags = Array.from(
    new Set(
      items.flatMap((i) => (i.tags ?? []).filter(isListTag))
    )
  );

  // Get the CURRENT item from the items array to ensure we have the latest state
  // This fixes the bug where the icon doesn't update immediately after clicking
  const currentItem = items.find((i) => i.id === item.id) ?? item;

  // Check if item is in favorites (use currentItem for fresh state)
  const isFavorite = currentItem.tags?.includes(LIST_TAGS.FAVORITES) ?? false;

  async function toggleHidden() {
    if (item.hidden) {
      await update(item.id!, { hidden: false, hiddenUntil: null });
      showToast('Item unhidden');
      return;
    }

    Alert.alert('Hide item', 'For how long would you like to hide this item?', [
      {
        text: '1 day',
        onPress: async () => {
          await update(item.id!, { hidden: true, hiddenUntil: Date.now() + 24 * 60 * 60 * 1000 });
          showToast('Hidden for 1 day');
        },
      },
      {
        text: '7 days',
        onPress: async () => {
          await update(item.id!, { hidden: true, hiddenUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 });
          showToast('Hidden for 7 days');
        },
      },
      {
        text: 'Forever',
        onPress: async () => {
          await update(item.id!, { hidden: true, hiddenUntil: null });
          showToast('Item hidden');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ], { cancelable: true });
  }

  function confirmDelete() {
    Alert.alert('Delete item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(item.id!);
          showToast('Item deleted');
        },
      },
    ]);
  }

  async function toggleFavorite() {
    // Prevent rapid clicking causing race conditions
    if (isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      // Use currentItem to get fresh tags
      const currentTags = currentItem.tags ?? [];
      // Recalculate isFavorite fresh each time to avoid stale closure
      const isFavoriteNow = currentTags.includes(LIST_TAGS.FAVORITES);
      if (isFavoriteNow) {
        await update(item.id!, { tags: currentTags.filter((t) => t !== LIST_TAGS.FAVORITES) });
        showToast('Removed from favorites');
      } else {
        await update(item.id!, { tags: [...currentTags, LIST_TAGS.FAVORITES] });
        showToast('Added to favorites');
      }
    } finally {
      setIsTogglingFavorite(false);
    }
  }

  async function addToList(listTag: string) {
    const currentTags = item.tags ?? [];
    if (!currentTags.includes(listTag)) {
      await update(item.id!, { tags: [...currentTags, listTag] });
      showToast(`Added to ${getListDisplayName(listTag)}`);
    }
  }

  async function removeFromList(listTag: string) {
    const currentTags = item.tags ?? [];
    await update(item.id!, { tags: currentTags.filter((t) => t !== listTag) });
    showToast(`Removed from ${getListDisplayName(listTag)}`);
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
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.separator }, Shadows.card]}>
      <Link href={`/item/${item.id}`}>
        <Image source={{ uri: item.thumbUri ?? item.imageUri ?? undefined }} style={styles.image} />
      </Link>
      <ThemedText type="headline" numberOfLines={1} style={styles.name}>{item.name}</ThemedText>
      {item.category ? <ThemedText type="secondary" numberOfLines={1}>{item.category}</ThemedText> : null}

      <View style={styles.actions}>
        <Pressable
          testID="favorite-button"
          onPress={toggleFavorite}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.fill : 'transparent' }]}
        >
          <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={20} color={isFavorite ? colors.star : colors.icon} />
        </Pressable>
        <Pressable
          onPress={showListMenu}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.fill : 'transparent' }]}
        >
          <Ionicons name="list-outline" size={20} color={colors.icon} />
        </Pressable>
        <Pressable
          onPress={toggleHidden}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.fill : 'transparent' }]}
        >
          <Ionicons name={item.hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.icon} />
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.fill : 'transparent' }]}
        >
          <Ionicons name="trash-outline" size={20} color={colors.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radii.card,
    borderWidth: 1,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  image: {
    width: 160,
    height: 120,
    borderRadius: Radii.sm,
    resizeMode: 'cover',
  },
  name: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xxs,
    marginTop: Spacing.xs,
    justifyContent: 'center',
  },
  iconBtn: {
    padding: Spacing.sm,
    borderRadius: Radii.sm,
  },
});
