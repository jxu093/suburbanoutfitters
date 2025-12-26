import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { Item } from '../types';
import { ThemedText } from './themed-text';

export default function OutfitPreview({ items }: { items: Item[] }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {items.map((it) => (
          <View key={it.id} style={styles.thumbWrap}>
            <Image source={{ uri: it.thumbUri ?? it.imageUri ?? undefined }} style={styles.thumb} />
          </View>
        ))}
      </View>
      <ThemedText>{`${items.length} items`}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  thumbWrap: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
  thumb: { width: 80, height: 80, resizeMode: 'cover' },
});