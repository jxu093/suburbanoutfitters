import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Button,
  Image as RNImage,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '../../../app/components/themed-text';
import { ThemedView } from '../../../app/components/themed-view';
import { useToast } from '../../../app/components/toast';
import {
  CATEGORIES,
  getCategoryDisplayName,
  LIST_TAGS,
  isListTag,
  getListDisplayName,
  createListTag,
} from '../../../app/constants';
import { useItems } from '../../../app/hooks/use-items';

export default function ItemScreen() {
  const params = useLocalSearchParams();
  const id = Number(params.id);
  const router = useRouter();
  const { items, refresh, update, remove, markAsWorn } = useItems();
  const { showToast } = useToast();
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

  // Get all unique list tags from all items
  const allListTags = Array.from(
    new Set(items.flatMap((i) => (i.tags ?? []).filter(isListTag)))
  );

  const isFavorite = item?.tags?.includes(LIST_TAGS.FAVORITES) ?? false;
  const regularTags = (item?.tags ?? []).filter((t: string) => !isListTag(t));
  const itemListTags = (item?.tags ?? []).filter(isListTag);

  function showCategoryPicker() {
    const options = CATEGORIES.map(getCategoryDisplayName);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', ...options], cancelButtonIndex: 0 },
        (buttonIndex) => {
          if (buttonIndex > 0) setCategory(CATEGORIES[buttonIndex - 1]);
        }
      );
    } else {
      Alert.alert('Select Category', '', [
        ...CATEGORIES.map((cat) => ({
          text: getCategoryDisplayName(cat),
          onPress: () => setCategory(cat),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  async function save() {
    if (!item) return;
    await update(item.id!, { name, category, notes });
    await refresh();
    setEditing(false);
    showToast('Changes saved');
  }

  async function toggleFavorite() {
    if (!item) return;
    const currentTags = item.tags ?? [];
    if (isFavorite) {
      await update(item.id!, { tags: currentTags.filter((t: string) => t !== LIST_TAGS.FAVORITES) });
      showToast('Removed from favorites');
    } else {
      await update(item.id!, { tags: [...currentTags, LIST_TAGS.FAVORITES] });
      showToast('Added to favorites');
    }
  }

  async function toggleHidden() {
    if (!item) return;
    if (item.hidden) {
      await update(item.id!, { hidden: false, hiddenUntil: null });
      showToast('Item unhidden');
      return;
    }
    Alert.alert('Hide item', 'For how long?', [
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
    ]);
  }

  async function handleWear() {
    if (!item) return;
    await markAsWorn(item.id!);
    showToast('Marked as worn - hidden for 7 days');
  }

  async function addToList(listTag: string) {
    if (!item) return;
    const currentTags = item.tags ?? [];
    if (!currentTags.includes(listTag)) {
      await update(item.id!, { tags: [...currentTags, listTag] });
      showToast(`Added to ${getListDisplayName(listTag)}`);
    }
  }

  async function removeFromList(listTag: string) {
    if (!item) return;
    const currentTags = item.tags ?? [];
    await update(item.id!, { tags: currentTags.filter((t: string) => t !== listTag) });
    showToast(`Removed from ${getListDisplayName(listTag)}`);
  }

  function showListMenu() {
    const availableLists = allListTags.filter((t) => !itemListTags.includes(t));
    const buttons: any[] = [];

    itemListTags.forEach((tag: string) => {
      buttons.push({ text: `✓ ${getListDisplayName(tag)}`, onPress: () => removeFromList(tag) });
    });
    availableLists.forEach((tag) => {
      buttons.push({ text: `Add to ${getListDisplayName(tag)}`, onPress: () => addToList(tag) });
    });
    buttons.push({
      text: '+ Create new list',
      onPress: () => {
        Alert.prompt('New List', 'Enter a name:', async (listName) => {
          if (listName?.trim()) {
            await addToList(createListTag(listName.trim()));
          }
        });
      },
    });
    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Manage Lists', '', buttons);
  }

  function confirmDelete() {
    Alert.alert('Delete', 'Delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(item.id!);
          showToast('Item deleted');
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
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <RNImage source={{ uri: item.imageUri }} style={styles.image} />

      {editing ? (
        <View style={styles.form}>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Name" />
          <TouchableOpacity onPress={showCategoryPicker} style={styles.picker}>
            <ThemedText style={category ? undefined : styles.placeholder}>
              {category ? getCategoryDisplayName(category) : 'Select Category'}
            </ThemedText>
          </TouchableOpacity>
          <TextInput value={notes} onChangeText={setNotes} style={styles.input} multiline placeholder="Notes" />
          <View style={styles.row}>
            <Button title="Save" onPress={save} />
            <Button title="Cancel" onPress={() => setEditing(false)} />
          </View>
        </View>
      ) : (
        <View style={styles.meta}>
          <View style={styles.titleRow}>
            <ThemedText type="title">{item.name}</ThemedText>
            {isFavorite && <Ionicons name="star" size={20} color="#f0ad4e" />}
          </View>

          {item.category ? (
            <ThemedText style={styles.category}>{getCategoryDisplayName(item.category)}</ThemedText>
          ) : null}

          {item.notes ? <ThemedText style={styles.notes}>{item.notes}</ThemedText> : null}

          {/* Tags */}
          {regularTags.length > 0 && (
            <View style={styles.tagsSection}>
              <ThemedText type="defaultSemiBold">Tags:</ThemedText>
              <View style={styles.tagsList}>
                {regularTags.map((tag: string) => (
                  <View key={tag} style={styles.tag}>
                    <ThemedText style={styles.tagText}>{tag}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Lists */}
          {itemListTags.length > 0 && (
            <View style={styles.tagsSection}>
              <ThemedText type="defaultSemiBold">Lists:</ThemedText>
              <View style={styles.tagsList}>
                {itemListTags.map((tag: string) => (
                  <View key={tag} style={styles.listTag}>
                    <ThemedText style={styles.tagText}>{getListDisplayName(tag)}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={toggleFavorite} style={styles.actionBtn}>
              <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={22} color={isFavorite ? '#f0ad4e' : '#666'} />
              <ThemedText style={styles.actionText}>{isFavorite ? 'Unfavorite' : 'Favorite'}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={showListMenu} style={styles.actionBtn}>
              <Ionicons name="list-outline" size={22} color="#666" />
              <ThemedText style={styles.actionText}>Lists</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleHidden} style={styles.actionBtn}>
              <Ionicons name={item.hidden ? 'eye-outline' : 'eye-off-outline'} size={22} color="#666" />
              <ThemedText style={styles.actionText}>{item.hidden ? 'Unhide' : 'Hide'}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleWear} style={styles.actionBtn}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#666" />
              <ThemedText style={styles.actionText}>Wear</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Button title="Edit" onPress={() => setEditing(true)} />
            <Button title="Delete" color="#d9534f" onPress={confirmDelete} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, gap: 12 },
  backBtn: { padding: 8, alignSelf: 'flex-start' },
  image: { height: 360, borderRadius: 8, width: '100%', resizeMode: 'cover' },
  meta: { gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  category: { color: '#666', fontSize: 16 },
  notes: { color: '#444' },
  form: { gap: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8 },
  picker: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
  placeholder: { color: '#999' },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tagsSection: { gap: 6 },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#e0e0e0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  listTag: { backgroundColor: '#d4edda', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: '#666' },
});