import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '../constants/theme';
import { useOutfits } from '../hooks/use-outfits';
import type { Item, Outfit } from '../types';
import OutfitPreview from './outfit-preview';
import { ThemedText } from './themed-text';
import { useToast } from './toast';

type OutfitCardProps = {
  outfit: Outfit;
  allItems: Item[];
};

export default function OutfitCard({ outfit, allItems }: OutfitCardProps) {
  const router = useRouter();
  const { remove } = useOutfits();
  const { showToast } = useToast();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.separator }, Shadows.card]}>
      <ThemedText type="headline">{outfit.name}</ThemedText>
      <OutfitPreview items={outfitItems} />

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push(`/outfits/${outfit.id}`)}
          style={({ pressed }) => [styles.openBtn, { backgroundColor: pressed ? colors.fill : 'transparent' }]}
        >
          <Ionicons name="open-outline" size={16} color={colors.tint} />
          <ThemedText type="footnote" style={{ color: colors.tint, fontWeight: '600' }}>Open</ThemedText>
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          style={({ pressed }) => [styles.deleteBtn, { backgroundColor: pressed ? colors.fill : 'transparent' }]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: Radii.card,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
  },
  deleteBtn: {
    padding: Spacing.sm,
    borderRadius: Radii.sm,
  },
});
