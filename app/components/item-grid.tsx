import { FlatList, StyleSheet, View } from 'react-native';
import type { Item } from '../types';
import ItemCard from './item-card';

export default function ItemGrid({ items }: { items: Item[] }) {
  return (
    <FlatList
      data={items}
      numColumns={2}
      keyExtractor={(i) => String(i.id)}
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <ItemCard item={item} />
        </View>
      )}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 12,
  },
  cell: {
    flex: 1,
    padding: 6,
  },
});