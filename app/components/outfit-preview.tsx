import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Item } from '../types';
import { categorizeItems } from '../utils/outfit-categorization';
import { ThemedText } from './themed-text';

function Thumbnail({ item, size }: { item: Item; size: number }) {
  return (
    <View style={[styles.thumbWrap, { width: size, height: size }]}>
      <Image
        source={{ uri: item.thumbUri ?? item.imageUri ?? undefined }}
        style={{ width: size, height: size, resizeMode: 'cover' }}
      />
    </View>
  );
}

function OutfitLayout({ items, scale = 1, showCount = true }: { items: Item[]; scale?: number; showCount?: boolean }) {
  const slots = categorizeItems(items);
  const hasTopRow = slots.hat.length > 0;
  const hasMiddleRow = slots.outerwear.length > 0 || slots.top.length > 0;
  const hasBottomRow = slots.bottom.length > 0;
  const hasShoesRow = slots.shoes.length > 0;
  const hasAccessoryRow = slots.accessory.length > 0;

  return (
    <View style={styles.outfitLayout}>
      {/* Hat row */}
      {hasTopRow && (
        <View style={styles.row}>
          {slots.hat.map((it) => (
            <Thumbnail key={it.id} item={it} size={60 * scale} />
          ))}
        </View>
      )}

      {/* Outerwear + Top row */}
      {hasMiddleRow && (
        <View style={styles.middleRow}>
          {slots.outerwear.length > 0 && (
            <View style={styles.outerSlot}>
              {slots.outerwear.map((it) => (
                <Thumbnail key={it.id} item={it} size={70 * scale} />
              ))}
            </View>
          )}
          {slots.top.length > 0 && (
            <View style={styles.topSlot}>
              {slots.top.map((it) => (
                <Thumbnail key={it.id} item={it} size={80 * scale} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Bottom row */}
      {hasBottomRow && (
        <View style={styles.row}>
          {slots.bottom.map((it) => (
            <Thumbnail key={it.id} item={it} size={80 * scale} />
          ))}
        </View>
      )}

      {/* Shoes row */}
      {hasShoesRow && (
        <View style={styles.row}>
          {slots.shoes.map((it) => (
            <Thumbnail key={it.id} item={it} size={60 * scale} />
          ))}
        </View>
      )}

      {/* Accessories row */}
      {hasAccessoryRow && (
        <View style={styles.accessoryRow}>
          {slots.accessory.map((it) => (
            <Thumbnail key={it.id} item={it} size={50 * scale} />
          ))}
        </View>
      )}

      {showCount && <ThemedText style={styles.count}>{`${items.length} items`}</ThemedText>}
    </View>
  );
}

export default function OutfitPreview({ items }: { items: Item[] }) {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <OutfitLayout items={items} />
        <TouchableOpacity onPress={() => setFullScreen(true)} style={styles.maximizeBtn}>
          <Ionicons name="expand-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <Modal visible={fullScreen} animationType="fade" transparent onRequestClose={() => setFullScreen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setFullScreen(false)} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
            <OutfitLayout items={items} scale={2} showCount={false} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  outfitLayout: {
    gap: 6,
    alignItems: 'center',
    padding: 8,
  },
  maximizeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxWidth: '90%',
    maxHeight: '90%',
  },
  closeBtn: {
    position: 'absolute',
    top: -16,
    right: -16,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
  },
  outerSlot: {
    flexDirection: 'row',
    gap: 4,
  },
  topSlot: {
    flexDirection: 'row',
    gap: 4,
  },
  accessoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  thumbWrap: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  count: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
