import { useState } from 'react';
import { ActionSheetIOS, Alert, Button, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import ImagePickerComponent from '../components/image-picker';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useToast } from '../components/toast';
import { CATEGORIES, getCategoryDisplayName } from '../constants';
import { useItems } from '../hooks/use-items';

export default function AddItemScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [picked, setPicked] = useState<any>(null);
  const { add } = useItems();
  const { showToast } = useToast();

  function showCategoryPicker() {
    const options = CATEGORIES.map(getCategoryDisplayName);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...options],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            setCategory(CATEGORIES[buttonIndex - 1]);
          }
        }
      );
    } else {
      Alert.alert(
        'Select Category',
        '',
        [
          ...CATEGORIES.map((cat) => ({
            text: getCategoryDisplayName(cat),
            onPress: () => setCategory(cat),
          })),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }

  async function save() {
    if (!name) return alert('Please provide a name for the item');
    const id = await add({
      name,
      category,
      imageUri: picked?.uri ?? null,
      thumbUri: picked?.thumbnailUri ?? null,
      notes,
      tags,
      createdAt: Date.now(),
    });

    if (id) {
      showToast('Item added to closet');
      setName('');
      setCategory('');
      setNotes('');
      setTags([]);
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
      <TouchableOpacity onPress={showCategoryPicker} style={styles.picker}>
        <ThemedText style={category ? undefined : styles.placeholder}>
          {category ? getCategoryDisplayName(category) : 'Select Category'}
        </ThemedText>
      </TouchableOpacity>
      <TextInput
        placeholder="Notes"
        value={notes}
        onChangeText={setNotes}
        style={styles.input}
        multiline
      />
      {/* TODO: Implement a better tag input component */}
      <TextInput
        placeholder="Tags (comma-separated)"
        value={tags.join(', ')}
        onChangeText={(text) => setTags(text.split(',').map((tag) => tag.trim()).filter(Boolean))}
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
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  placeholder: {
    color: '#999',
  },
});
