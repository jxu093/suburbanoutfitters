import { useMemo, useState } from 'react';
import { Button, FlatList, StyleSheet } from 'react-native';
import { useItems } from '../hooks/use-items';
import { useOutfits } from '../hooks/use-outfits';
import { pickRandomOutfit } from '../services/randomizer';
import type { Item, Outfit } from '../types';
import OutfitPreview from './outfit-preview';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export default function OutfitBuilder() {
  const { items } = useItems();
  const { add } = useOutfits();
  const [current, setCurrent] = useState<Item[]>([]);

  const available = useMemo(() => items, [items]);

  function randomize() {
    const outfit = pickRandomOutfit(available, { minItems: 2, maxItems: 4 });
    setCurrent(outfit);
  }

  async function saveOutfit() {
    if (!current || current.length === 0) return;
    const o: Outfit = { name: `Outfit ${Date.now()}`, itemIds: current.map((i) => i.id!) };
    await add(o);
    alert('Outfit saved');
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Outfit Builder</ThemedText>

      <Button title="Randomize Outfit" onPress={randomize} />
      <Button title="Save Outfit" onPress={saveOutfit} />

      {current.length ? <OutfitPreview items={current} /> : <ThemedText>No outfit yet</ThemedText>}

      <ThemedText type="subtitle">Available items</ThemedText>
      <FlatList data={available} keyExtractor={(i) => String(i.id)} renderItem={({ item }) => <ThemedText>{item.name}</ThemedText>} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
});