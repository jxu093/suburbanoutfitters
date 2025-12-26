import { useState } from 'react';
import { Button, StyleSheet, TextInput } from 'react-native';
import ImagePickerComponent from '../components/image-picker';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useItems } from '../hooks/use-items';

export default function AddItemScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [picked, setPicked] = useState<any>(null);
  const { add } = useItems();

  async function save() {
    if (!name) return alert('Please provide a name for the item');
    const id = await add({
      name,
      category,
      imageUri: picked?.uri ?? null,
      thumbUri: picked?.thumbnailUri ?? null,
      createdAt: Date.now(),
    });

    if (id) {
      alert('Saved');
      setName('');
      setCategory('');
      setPicked(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Add Item</ThemedText>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      />

      <ImagePickerComponent onDone={(saved) => setPicked(saved)} />

      <Button title="Save Item" onPress={save} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
  },
});
