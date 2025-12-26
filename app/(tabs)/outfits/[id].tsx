import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Button, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '../../../app/components/themed-text';
import { ThemedView } from '../../../app/components/themed-view';
import OutfitPreview from '../../../app/components/outfit-preview';
import { useOutfits } from '../../../app/hooks/use-outfits';
import { useItems } from '../../../app/hooks/use-items';

export default function OutfitScreen() {
  const params = useLocalSearchParams();
  const id = Number(params.id);
  const router = useRouter();
  const { outfits, remove, refresh, update } = useOutfits();
  const { items, refresh: refreshItems } = useItems();
  const [outfit, setOutfit] = useState<any>(null);
  const [outfitItems, setOutfitItems] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<any[]>([]);

  useEffect(() => {
    const found = outfits.find((o) => o.id === id) ?? null;
    setOutfit(found);
    if (found) {
      const ids = found.itemIds ?? [];
      const matched = items.filter((it) => ids.includes(it.id));
      setOutfitItems(matched);
    }
  }, [id, outfits, items]);

  if (!outfit) return (
    <ThemedView style={styles.container}>
      <ThemedText>Outfit not found</ThemedText>
    </ThemedView>
  );

  async function doDelete() {
    await remove(outfit.id);
    await refresh();
    router.replace('/outfits');
  }

  async function saveChanges() {
    const ids = selected.map((s) => s.id!);
    await update(outfit.id, { name: name.trim() || outfit.name, itemIds: ids });
    await refresh();
    setEditing(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {editing ? (
        <View style={styles.form}>
          <TextInput value={name} onChangeText={setName} style={styles.input} />
          <ThemedText type="subtitle">Select items</ThemedText>
          {items.map((it) => {
            const selectedFlag = selected.some((s) => s.id === it.id);
            return (
              <View key={it.id} style={styles.row}>
                <Button
                  title={selectedFlag ? 'Remove' : 'Add'}
                  testID={`toggle-item-${it.id}`}
                  onPress={() => setSelected((s) => (selectedFlag ? s.filter((x) => x.id !== it.id) : [...s, it]))}
                />
                <ThemedText>{it.name}</ThemedText>
              </View>
            );
          })}

          <View style={styles.actions}>
            <Button testID="save-button" title="Save" onPress={saveChanges} />
            <Button title="Cancel" onPress={() => setEditing(false)} />
          </View>
        </View>
      ) : (
        <>
          <ThemedText type="title">{outfit.name}</ThemedText>
          <OutfitPreview items={outfitItems} />
          <ThemedText>Items in outfit</ThemedText>
          {outfitItems.map((it) => (
            <ThemedText key={it.id}>{it.name}</ThemedText>
          ))}

          <View style={styles.actions}>
            <Button testID="edit-button" title="Edit" onPress={() => { setEditing(true); setName(outfit.name); setSelected(outfitItems); }} />
            <Button title="Delete" color="#d9534f" onPress={doDelete} />
            <Button title="Back" onPress={() => router.back()} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, gap: 12 },
  actions: { flexDirection: 'row', gap: 8 },
});