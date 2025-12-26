import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Button, Image as RNImage, StyleSheet, View } from 'react-native';
import { SavedImage, pickAndSaveFromLibrary, requestPermissions, takeAndSavePhoto } from '../services/image-service';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export type ImagePickerProps = {
  onDone?: (saved: SavedImage) => void;
};

export default function ImagePickerComponent({ onDone }: ImagePickerProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedImage | null>(null);

  async function pick() {
    setLoading(true);
    try {
      const ok = await requestPermissions();
      if (!ok) {
        alert('Camera & media permissions are required.');
        setLoading(false);
        return;
      }

      const result = await pickAndSaveFromLibrary();
      if (result) {
        setSaved(result);
        onDone?.(result);
      }
    } catch (e) {
      console.warn(e);
      alert('Failed to pick image');
    } finally {
      setLoading(false);
    }
  }

  async function take() {
    setLoading(true);
    try {
      const ok = await requestPermissions();
      if (!ok) {
        alert('Camera & media permissions are required.');
        setLoading(false);
        return;
      }

      const result = await takeAndSavePhoto();
      if (result) {
        setSaved(result);
        onDone?.(result);
      }
    } catch (e) {
      console.warn(e);
      alert('Failed to take photo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.row}>
        <Button title="Choose from library" onPress={pick} />
        <Button title="Take photo" onPress={take} />
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}

      {saved ? (
        <View style={styles.preview}>
          <ThemedText type="subtitle">Saved image</ThemedText>
          <Image source={{ uri: saved.uri }} style={styles.image} />
          <ThemedText>Thumbnail</ThemedText>
          <RNImage source={{ uri: saved.thumbnailUri }} style={styles.thumb} />
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  preview: {
    marginTop: 12,
    alignItems: 'center',
    gap: 6,
  },
  image: {
    width: 300,
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  thumb: {
    width: 120,
    height: 90,
    resizeMode: 'cover',
    borderRadius: 6,
    marginTop: 6,
  },
});
