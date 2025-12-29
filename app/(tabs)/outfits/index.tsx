import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import OutfitCard from '../../../app/components/outfit-card';
import { ThemedText } from '../../../app/components/themed-text';
import { ThemedView } from '../../../app/components/themed-view';
import { useToast } from '../../../app/components/toast';
import { useItems } from '../../../app/hooks/use-items';
import { useOutfits } from '../../../app/hooks/use-outfits';
import { pickRandomOutfit } from '../../../app/services/randomizer';

export default function OutfitsListScreen() {
  const router = useRouter();
  const { outfits, loading: outfitsLoading, refresh, add } = useOutfits();
  const { items, loading: itemsLoading } = useItems();
  const { showToast } = useToast();

  const loading = outfitsLoading || itemsLoading;

  async function generateQuickOutfit() {
    if (items.length === 0) {
      showToast('Add some items first', 'error');
      return;
    }
    const outfit = pickRandomOutfit(items, { minItems: 4, maxItems: 6, avoidSameCategory: true });
    if (outfit.length > 0) {
      // Navigate to builder with preselected items
      router.push({
        pathname: '/outfits/builder',
        params: { preselected: JSON.stringify(outfit.map((i) => i.id)) },
      });
    } else {
      showToast('Could not generate outfit', 'error');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title">Outfits</ThemedText>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => router.push('/outfits/random')} style={styles.iconBtn}>
            <Ionicons name="options-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/outfits/builder')} style={styles.iconBtn}>
            <Ionicons name="construct-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.generateRow}>
        <TouchableOpacity onPress={generateQuickOutfit} style={styles.generateBtn}>
          <Ionicons name="shuffle-outline" size={18} color="#fff" />
          <ThemedText style={styles.generateBtnText}>Generate Outfit</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/outfits/builder', params: { mode: 'fill' } })}
          style={[styles.generateBtn, styles.fillBtn]}
        >
          <Ionicons name="grid-outline" size={18} color="#666" />
          <ThemedText style={styles.fillBtnText}>Fill Missing</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.refreshRow}>
        <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={16} color="#666" />
          <ThemedText style={styles.refreshText}>Refresh</ThemedText>
        </TouchableOpacity>
      </View>

      {loading ? <ThemedText style={styles.loading}>Loading...</ThemedText> : null}

      <FlatList
        data={outfits}
        keyExtractor={(o) => String(o.id)}
        renderItem={({ item }) => <OutfitCard outfit={item} allItems={items} />}
        contentContainerStyle={styles.list}
      />

      {outfits.length === 0 && !loading && (
        <View style={styles.empty}>
          <ThemedText>No outfits yet. Generate one or use the builder!</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, alignItems: 'center' },
  headerButtons: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  generateRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  generateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateBtnText: { color: '#fff', fontWeight: '600' },
  fillBtn: { backgroundColor: '#e0e0e0' },
  fillBtnText: { color: '#333', fontWeight: '600' },
  refreshRow: { paddingHorizontal: 12, paddingVertical: 8 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { color: '#666', fontSize: 13 },
  loading: { padding: 12 },
  list: { padding: 12, gap: 12 },
  empty: { padding: 20, alignItems: 'center' },
});