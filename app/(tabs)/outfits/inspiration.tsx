import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { ShopMissingItems } from '@/components/affiliate-product-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/toast';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useItems } from '@/hooks/use-items';
import { useOutfits } from '@/hooks/use-outfits';
import { aiService } from '@/services/ai';
import type { InspirationMatch } from '@/services/ai/ai-provider';
import { pickFromLibraryAsync, resizeForAIAnalysis } from '@/services/image-service';
import type { Item } from '@/types';
import { getItemImageUri, getValidImageUri } from '@/utils/item-helpers';

export default function InspirationScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { items } = useItems();
  const { add: addOutfit } = useOutfits();

  const [inspoImageUri, setInspoImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<InspirationMatch | null>(null);
  const [matchedItems, setMatchedItems] = useState<Item[]>([]);

  async function handlePickImage() {
    try {
      const uri = await pickFromLibraryAsync();
      if (!uri) return;

      setInspoImageUri(uri);
      setMatchResult(null);
      setMatchedItems([]);
    } catch (error) {
      console.error('Failed to pick image:', error);
      showToast('Failed to pick image', 'error');
    }
  }

  async function handleAnalyze() {
    if (!inspoImageUri) return;

    if (items.length === 0) {
      showToast('Add some items to your wardrobe first', 'error');
      return;
    }

    setIsAnalyzing(true);
    setMatchResult(null);
    setMatchedItems([]);

    try {
      // Resize image for AI analysis
      const imageBase64 = await resizeForAIAnalysis(inspoImageUri);

      // Get AI match
      const result = await aiService.matchInspiration(imageBase64, items);

      setMatchResult(result);

      // Get matched items
      const matched = result.matchedItemIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is Item => item !== undefined);

      setMatchedItems(matched);

      if (matched.length === 0) {
        showToast('No matching items found in your wardrobe', 'info');
      }
    } catch (error) {
      console.error('Failed to analyze inspiration:', error);
      showToast('Failed to analyze image. Please try again.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSaveOutfit() {
    if (!matchResult || matchedItems.length === 0) return;

    try {
      const outfitName = `Inspired Look - ${new Date().toLocaleDateString()}`;
      await addOutfit({
        name: outfitName,
        itemIds: matchedItems.map((item) => item.id!),
        notes: `Style: ${matchResult.overallStyle.join(', ')}`,
      });

      showToast('Outfit saved!', 'success');
      router.back();
    } catch (error) {
      console.error('Failed to save outfit:', error);
      showToast('Failed to save outfit', 'error');
    }
  }

  function handleClear() {
    setInspoImageUri(null);
    setMatchResult(null);
    setMatchedItems([]);
  }

  const matchScorePercent = matchResult ? Math.round(matchResult.matchScore * 100) : 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Inspiration Match
          </ThemedText>
          <View style={{ width: 32 }} />
        </View>

        {/* Description */}
        <View style={styles.descriptionBox}>
          <Ionicons name="image-outline" size={20} color="#9c27b0" />
          <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]}>
            Upload an inspiration photo and we&apos;ll find matching items from your wardrobe.
          </ThemedText>
        </View>

        {/* Image picker area */}
        {!inspoImageUri ? (
          <TouchableOpacity
            onPress={handlePickImage}
            style={[styles.imagePicker, { borderColor: colors.border, backgroundColor: colors.secondaryBackground }]}
          >
            <Ionicons name="cloud-upload-outline" size={48} color={colors.textSecondary} />
            <ThemedText style={[styles.pickerText, { color: colors.textSecondary }]}>
              Tap to upload inspiration photo
            </ThemedText>
            <ThemedText style={[styles.pickerHint, { color: colors.textSecondary }]}>
              Pinterest, Instagram, magazine photos, etc.
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.imageSection}>
            {/* Inspiration image */}
            <View style={styles.imageColumn}>
              <ThemedText style={[styles.columnLabel, { color: colors.textSecondary }]}>
                Inspiration
              </ThemedText>
              <View style={[styles.imageContainer, { borderColor: colors.border }]}>
                {getValidImageUri(inspoImageUri) && (
                  <Image source={{ uri: getValidImageUri(inspoImageUri)! }} style={styles.inspoImage} contentFit="cover" />
                )}
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Matched items */}
            {matchResult && matchedItems.length > 0 && (
              <View style={styles.imageColumn}>
                <ThemedText style={[styles.columnLabel, { color: colors.textSecondary }]}>
                  Your Wardrobe
                </ThemedText>
                <View style={[styles.matchedGrid, { borderColor: colors.border }]}>
                  {matchedItems.slice(0, 4).map((item, index) => (
                    <View key={item.id} style={styles.matchedItemWrapper}>
                      {getItemImageUri(item) ? (
                        <Image
                          source={{ uri: getItemImageUri(item) }}
                          style={styles.matchedItem}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.matchedItem, styles.placeholder]} />
                      )}
                      {index === 3 && matchedItems.length > 4 && (
                        <View style={styles.moreOverlay}>
                          <ThemedText style={styles.moreText}>+{matchedItems.length - 4}</ThemedText>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Analyze button */}
        {inspoImageUri && !matchResult && (
          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={isAnalyzing}
            style={[styles.analyzeBtn, isAnalyzing && styles.analyzeBtnDisabled]}
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <ThemedText style={styles.analyzeBtnText}>Analyzing...</ThemedText>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <ThemedText style={styles.analyzeBtnText}>Find Matches</ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Results */}
        {matchResult && (
          <View style={styles.results}>
            {/* Match score */}
            <View style={[styles.scoreCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.scoreHeader}>
                <ThemedText type="subtitle">Match Score</ThemedText>
                <View style={[styles.scoreBadge, { backgroundColor: matchScorePercent >= 70 ? '#4CAF50' : matchScorePercent >= 40 ? '#FF9800' : '#F44336' }]}>
                  <ThemedText style={styles.scoreText}>{matchScorePercent}%</ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.scoreDescription, { color: colors.textSecondary }]}>
                {matchScorePercent >= 70
                  ? 'Great match! Your wardrobe can recreate this look.'
                  : matchScorePercent >= 40
                    ? 'Partial match. Some key pieces are missing.'
                    : 'Low match. You may need several new items.'}
              </ThemedText>
            </View>

            {/* Style tags */}
            {matchResult.overallStyle.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Style</ThemedText>
                <View style={styles.tagRow}>
                  {matchResult.overallStyle.map((style) => (
                    <View key={style} style={[styles.tag, { backgroundColor: colors.fillSecondary }]}>
                      <ThemedText style={[styles.tagText, { color: colors.text }]}>{style}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Color palette */}
            {matchResult.colorPalette.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Colors</ThemedText>
                <View style={styles.tagRow}>
                  {matchResult.colorPalette.map((color) => (
                    <View key={color} style={[styles.tag, { backgroundColor: colors.fillSecondary }]}>
                      <ThemedText style={[styles.tagText, { color: colors.text }]}>{color}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Matched items list */}
            {matchedItems.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Matched Items ({matchedItems.length})
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
                  {matchedItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => router.push(`/item/${item.id}`)}
                      style={[styles.itemCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                    >
                      {getItemImageUri(item) ? (
                        <Image
                          source={{ uri: getItemImageUri(item) }}
                          style={styles.itemImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.itemImage, styles.placeholder]} />
                      )}
                      <ThemedText style={styles.itemName} numberOfLines={1}>{item.name}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Missing items with shopping links */}
            {matchResult.missingItems.length > 0 && (
              <ShopMissingItems items={matchResult.missingItems} />
            )}

            {/* Action buttons */}
            <View style={styles.actions}>
              {matchedItems.length >= 2 && (
                <TouchableOpacity onPress={handleSaveOutfit} style={styles.saveBtn}>
                  <Ionicons name="bookmark-outline" size={20} color="#fff" />
                  <ThemedText style={styles.saveBtnText}>Save as Outfit</ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClear} style={[styles.clearOutlineBtn, { borderColor: colors.border }]}>
                <Ionicons name="refresh-outline" size={20} color={colors.text} />
                <ThemedText style={styles.clearOutlineBtnText}>Try Another</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Empty state hint */}
        {!inspoImageUri && (
          <View style={styles.hintBox}>
            <Ionicons name="bulb-outline" size={20} color={colors.textSecondary} />
            <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
              Tip: For best results, use photos with clear, full-body outfit views. The AI will
              identify each clothing item and find similar pieces from your wardrobe.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholder: {
    backgroundColor: '#e0e0e0',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(156, 39, 176, 0.08)',
    borderRadius: Radii.card,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  imagePicker: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerHint: {
    fontSize: 13,
  },
  imageSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  imageColumn: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  imageContainer: {
    aspectRatio: 0.75,
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 1,
  },
  inspoImage: {
    width: '100%',
    height: '100%',
  },
  clearBtn: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  matchedGrid: {
    aspectRatio: 0.75,
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  matchedItemWrapper: {
    width: '50%',
    height: '50%',
  },
  matchedItem: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#9c27b0',
    paddingVertical: Spacing.md,
    borderRadius: Radii.button,
    marginBottom: Spacing.lg,
  },
  analyzeBtnDisabled: {
    opacity: 0.7,
  },
  analyzeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    gap: Spacing.lg,
  },
  scoreCard: {
    padding: Spacing.lg,
    borderRadius: Radii.card,
    borderWidth: 1,
    ...Shadows.card,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  scoreDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.chip,
  },
  tagText: {
    fontSize: 13,
  },
  itemsScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  itemCard: {
    width: 100,
    marginRight: Spacing.sm,
    borderRadius: Radii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
  },
  itemName: {
    fontSize: 12,
    padding: Spacing.xs,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#9c27b0',
    paddingVertical: Spacing.md,
    borderRadius: Radii.button,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radii.button,
    borderWidth: 1,
  },
  clearOutlineBtnText: {
    fontSize: 16,
    fontWeight: '500',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: Radii.card,
    marginTop: Spacing.lg,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
