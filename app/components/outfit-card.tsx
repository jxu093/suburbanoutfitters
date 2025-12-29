import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useOutfits } from '../hooks/use-outfits';
import type { Item, Outfit } from '../types';
import OutfitPreview from './outfit-preview';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useToast } from './toast';

type OutfitCardProps = {
  outfit: Outfit;
  allItems: Item[];
};

export default function OutfitCard({ outfit, allItems }: OutfitCardProps) {
  const router = useRouter();
  const { remove } = useOutfits();
  const { showToast } = useToast();

  const outfitItems = useMemo(() => {
    return outfit.itemIds
      .map((id) => allItems.find((item) => item.id === id))
      .filter((item): item is Item => item !== undefined);
  }, [outfit.itemIds, allItems]);

  function confirmDelete() {
    Alert.alert('Delete outfit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(outfit.id!);
          showToast('Outfit deleted');
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.card}>
      <ThemedText type="defaultSemiBold">{outfit.name}</ThemedText>
      <OutfitPreview items={outfitItems} />

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.push(`/outfits/${outfit.id}`)} style={styles.openBtn}>
          <Ionicons name="open-outline" size={16} color="#007AFF" />
          <ThemedText style={styles.openBtnText}>Open</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color="#d9534f" />
        </TouchableOpacity>
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
    alignItems: 'center',
    marginTop: 8,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  openBtnText: {
    color: '#007AFF',
    fontSize: 14,
  },
  deleteBtn: {
    padding: 8,
  },
});
