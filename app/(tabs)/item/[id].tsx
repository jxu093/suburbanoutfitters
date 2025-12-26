import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, Image as RNImage, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '../../../app/components/themed-text';
import { ThemedView } from '../../../app/components/themed-view';
import { useItems } from '../../../app/hooks/use-items';

export default function ItemScreen() {
  const params = useLocalSearchParams();
  const id = Number(params.id);
  const router = useRouter();
  const { items, refresh, update, remove } = useItems();
  const [item, setItem] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const found = items.find((i) => i.id === id) ?? null;
    setItem(found);
    if (found) {
      setName(found.name);
      setCategory(found.category ?? '');
      setNotes(found.notes ?? '');
    }
  }, [id, items]);

  async function save() {
    if (!item) return;
    await update(item.id!, { name, category, notes });
    await refresh();
    setEditing(false);
    Alert.alert('Saved');
  }

  function confirmDelete() {
    Alert.alert('Delete', 'Delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(item.id!);
          router.replace('/closet');
        },
      },
    ]);
  }

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Item not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <RNImage source={{ uri: item.imageUri }} style={styles.image} />
      {editing ? (
        <View style={styles.form}>
          <TextInput value={name} onChangeText={setName} style={styles.input} />
          <TextInput value={category} onChangeText={setCategory} style={styles.input} />
          <TextInput value={notes} onChangeText={setNotes} style={styles.input} multiline />
          <Button title="Save" onPress={save} />
          <Button title="Cancel" onPress={() => setEditing(false)} />
        </View>
      ) : (
        <View style={styles.meta}>
          <ThemedText type="title">{item.name}</ThemedText>
          {item.category ? <ThemedText>{item.category}</ThemedText> : null}
          {item.notes ? <ThemedText>{item.notes}</ThemedText> : null}
          <View style={styles.row}>
            <Button title="Edit" onPress={() => setEditing(true)} />
            <Button title="Delete" color="#d9534f" onPress={confirmDelete} />
            <Button title="Back" onPress={() => router.back()} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, gap: 12 },
  image: { height: 360, borderRadius: 8, width: '100%', resizeMode: 'cover' },
  meta: { gap: 8 },
  form: { gap: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
});