import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import { Colors, Radii, Spacing } from '../constants/theme';
import { SavedImage, pickAndSaveFromLibrary, requestPermissions, takeAndSavePhoto } from '../services/image-service';
import { ThemedButton } from './themed-button';
import { ThemedText } from './themed-text';

export type ImagePickerProps = {
  onDone?: (saved: SavedImage) => void;
  showPreview?: boolean;
  previewUri?: string;
  onReset?: () => void;
};

export default function ImagePickerComponent({ onDone, showPreview, previewUri, onReset }: ImagePickerProps) {
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
    <View style={[styles.container, { backgroundColor: colors.secondaryBackground, borderColor: colors.separator }]}>
      <View style={styles.row}>
        <View style={styles.buttonWrapper}>
          <ThemedButton
            title="Choose from library"
            variant="secondary"
            size="small"
            icon="images-outline"
            onPress={pick}
            disabled={loading}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <ThemedButton
            title="Take photo"
            variant="secondary"
            size="small"
            icon="camera-outline"
            onPress={take}
            disabled={loading}
          />
        </View>
      </View>

      {loading ? <ActivityIndicator style={styles.loader} color={colors.tint} /> : null}

      {showPreview && previewUri ? (
        <View style={styles.preview}>
          <View style={styles.previewHeader}>
            <ThemedText type="headline">Image preview</ThemedText>
            {onReset && (
              <ThemedButton
                title="Reset"
                variant="destructive"
                size="small"
                onPress={onReset}
              />
            )}
          </View>
          <Image source={{ uri: previewUri }} style={styles.thumb} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  buttonWrapper: {
    flex: 1,
  },
  loader: {
    marginTop: Spacing.md,
  },
  preview: {
    marginTop: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  thumb: {
    width: 120,
    height: 90,
    resizeMode: 'cover',
    borderRadius: Radii.sm,
    marginTop: Spacing.xs,
  },
});
