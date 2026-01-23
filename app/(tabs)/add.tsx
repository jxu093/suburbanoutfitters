import { useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, useColorScheme, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AIAttributeTags } from '../components/ai-attribute-tags';
import ImagePickerComponent from '../components/image-picker';
import { ThemedButton } from '../components/themed-button';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useToast } from '../components/toast';
import { CATEGORIES, getCategoryDisplayName } from '../constants';
import { Colors, Radii, Spacing } from '../constants/theme';
import { useItems } from '../hooks/use-items';
import { categorizeClothesByImage } from '../services/ai-categorization';
import { aiService } from '../services/ai';
import { downloadAndSaveFromUrl, resizeForAIAnalysis } from '../services/image-service';
import type { AIAnalysisResult } from '../types';

export default function AddItemScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [picked, setPicked] = useState<any>(null);
  const [isDetectingCategory, setIsDetectingCategory] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isDownloadingUrl, setIsDownloadingUrl] = useState(false);
  const [isFromUrl, setIsFromUrl] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const { add } = useItems();
  const { showToast } = useToast();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  async function autoDetectCategory() {
    if (!picked?.uri) {
      showToast('Please select an image first', 'error');
      return;
    }

    setIsDetectingCategory(true);
    try {
      const detectedCategory = await categorizeClothesByImage(picked.uri);

      if (detectedCategory) {
        setCategory(detectedCategory);
        showToast(`Detected: ${getCategoryDisplayName(detectedCategory)}`, 'success');
      } else {
        showToast('Could not detect category. Please select manually.', 'info');
      }
    } catch (error) {
      console.error('Auto-detect error:', error);
      showToast('Auto-detect failed. Please select manually.', 'error');
    } finally {
      setIsDetectingCategory(false);
    }
  }

  async function downloadFromUrl() {
    if (!imageUrl.trim()) {
      showToast('Please enter an image URL', 'error');
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      showToast('Please enter a valid URL', 'error');
      return;
    }

    setIsDownloadingUrl(true);
    try {
      const savedImage = await downloadAndSaveFromUrl(imageUrl);
      setPicked(savedImage);
      setIsFromUrl(true);
      setImageUrl('');
      setAiAnalysis(null); // Clear previous analysis
      showToast('Image downloaded successfully', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download image. Check the URL and try again.', 'error');
    } finally {
      setIsDownloadingUrl(false);
    }
  }

  async function analyzeWithAI() {
    if (!picked?.uri) {
      showToast('Please select an image first', 'error');
      return;
    }

    // Check if AI is configured
    const isConfigured = await aiService.isConfigured();
    if (!isConfigured) {
      Alert.alert(
        'AI Not Configured',
        'Please configure your AI API key in Settings to use AI analysis.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsAnalyzingAI(true);
    try {
      // Resize image for AI analysis
      const base64Image = await resizeForAIAnalysis(picked.uri);

      // Analyze the image
      const analysis = await aiService.analyzeClothingItem(base64Image);
      setAiAnalysis(analysis);

      // Auto-fill category if detected and not already set
      if (analysis.category && !category) {
        // Map AI category to our CATEGORIES if possible
        const matchedCategory = CATEGORIES.find(
          c => c.toLowerCase() === analysis.category?.toLowerCase()
        );
        if (matchedCategory) {
          setCategory(matchedCategory);
        }
      }

      // Auto-fill name if not set
      if (!name && analysis.subcategory) {
        // Create a name from the analysis
        const colorPart = analysis.colors?.[0] || '';
        const typePart = analysis.subcategory;
        setName(`${colorPart} ${typePart}`.trim());
      }

      showToast('AI analysis complete', 'success');
    } catch (error: any) {
      console.error('AI analysis error:', error);
      const message = error.code === 'NO_API_KEY'
        ? 'Please configure your API key in Settings.'
        : 'AI analysis failed. Please try again.';
      showToast(message, 'error');
    } finally {
      setIsAnalyzingAI(false);
    }
  }

  async function save() {
    if (!name) return alert('Please provide a name for the item');

    // Build item with AI attributes if available
    const itemData: Parameters<typeof add>[0] = {
      name,
      category,
      imageUri: picked?.uri ?? null,
      thumbUri: picked?.thumbnailUri ?? null,
      notes,
      tags,
      createdAt: Date.now(),
    };

    // Add AI attributes if analyzed
    if (aiAnalysis) {
      itemData.aiCategory = aiAnalysis.category ?? null;
      itemData.aiSubcategory = aiAnalysis.subcategory ?? null;
      itemData.aiColors = aiAnalysis.colors ?? null;
      itemData.aiColorFamily = aiAnalysis.colorFamily ?? null;
      itemData.aiStyle = aiAnalysis.style ?? null;
      itemData.aiFormality = aiAnalysis.formality ?? null;
      itemData.aiOccasions = aiAnalysis.occasions ?? null;
      itemData.aiPattern = aiAnalysis.pattern ?? null;
      itemData.aiMaterial = aiAnalysis.material ?? null;
      itemData.aiSeasons = aiAnalysis.seasons ?? null;
      itemData.aiWeatherSuitability = aiAnalysis.weatherSuitability ?? null;
      itemData.aiAnalyzedAt = Date.now();
      itemData.aiConfidence = aiAnalysis.confidence ?? null;
    }

    const id = await add(itemData);

    if (id) {
      showToast('Item added to closet');
      setName('');
      setCategory('');
      setNotes('');
      setTags([]);
      setPicked(null);
      setIsFromUrl(false);
      setAiAnalysis(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText type="largeTitle">Add Item</ThemedText>

        <View style={styles.formSection}>
          <ThemedText type="footnote" style={[styles.label, { color: colors.textSecondary }]}>NAME</ThemedText>
          <TextInput
            placeholder="e.g. Blue Oxford Shirt"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            style={[styles.input, { borderColor: colors.separator, color: colors.text, backgroundColor: colors.cardBackground }]}
          />
        </View>

        <View style={styles.formSection}>
          <ThemedText type="footnote" style={[styles.label, { color: colors.textSecondary }]}>CATEGORY</ThemedText>
          <Pressable
            onPress={showCategoryPicker}
            style={({ pressed }) => [
              styles.picker,
              {
                borderColor: colors.separator,
                backgroundColor: pressed ? colors.fill : colors.cardBackground,
              },
            ]}
          >
            <ThemedText style={category ? { color: colors.text } : { color: colors.textSecondary }}>
              {category ? getCategoryDisplayName(category) : 'Select Category'}
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color={colors.icon} />
          </Pressable>
        </View>

        <View style={styles.formSection}>
          <ThemedText type="footnote" style={[styles.label, { color: colors.textSecondary }]}>NOTES (OPTIONAL)</ThemedText>
          <TextInput
            placeholder="Add any notes about this item..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.textArea, { borderColor: colors.separator, color: colors.text, backgroundColor: colors.cardBackground }]}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* URL Input Section */}
        <View style={styles.formSection}>
          <ThemedText type="footnote" style={[styles.label, { color: colors.textSecondary }]}>IMAGE URL (OPTIONAL)</ThemedText>
          <View style={styles.urlRow}>
            <TextInput
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={colors.textSecondary}
              value={imageUrl}
              onChangeText={setImageUrl}
              style={[styles.input, styles.urlInput, { borderColor: colors.separator, color: colors.text, backgroundColor: colors.cardBackground }]}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={downloadFromUrl}
              disabled={isDownloadingUrl}
              style={({ pressed }) => [
                styles.downloadBtn,
                { backgroundColor: pressed ? colors.tint + 'DD' : colors.tint },
                isDownloadingUrl && styles.downloadBtnDisabled,
              ]}
            >
              {isDownloadingUrl ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.formSection}>
          <ThemedText type="footnote" style={[styles.label, { color: colors.textSecondary }]}>OR PICK AN IMAGE</ThemedText>
          <ImagePickerComponent
            onDone={(saved) => {
              setPicked(saved);
              setIsFromUrl(false);
              setAiAnalysis(null); // Clear previous analysis
            }}
            showPreview={picked !== null}
            previewUri={picked?.thumbnailUri}
            onReset={() => {
              setPicked(null);
              setIsFromUrl(false);
              setAiAnalysis(null);
            }}
          />
        </View>

        {/* AI Analysis Section */}
        {picked && (
          <View style={styles.formSection}>
            <ThemedText type="footnote" style={[styles.label, { color: colors.textSecondary }]}>AI ANALYSIS</ThemedText>
            {!aiAnalysis ? (
              <Pressable
                onPress={analyzeWithAI}
                disabled={isAnalyzingAI}
                style={({ pressed }) => [
                  styles.analyzeBtn,
                  { backgroundColor: pressed ? colors.tint + 'DD' : colors.tint },
                  isAnalyzingAI && styles.analyzeBtnDisabled,
                ]}
              >
                {isAnalyzingAI ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <ThemedText style={styles.analyzeBtnText}>Analyzing...</ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <ThemedText style={styles.analyzeBtnText}>Analyze with AI</ThemedText>
                  </>
                )}
              </Pressable>
            ) : (
              <View style={styles.analysisResult}>
                <View style={styles.analysisHeader}>
                  <Ionicons name="checkmark-circle" size={18} color="#4caf50" />
                  <ThemedText style={styles.analysisHeaderText}>AI Analysis Complete</ThemedText>
                  <Pressable onPress={analyzeWithAI} style={styles.reanalyzeBtn}>
                    <Ionicons name="refresh" size={16} color={colors.tint} />
                  </Pressable>
                </View>
                <AIAttributeTags item={aiAnalysis as any} />
              </View>
            )}
          </View>
        )}

        <View style={styles.formSection}>
          <ThemedText type="footnote" style={[styles.label, { color: colors.textSecondary }]}>TAGS (OPTIONAL)</ThemedText>
          <TextInput
            placeholder="casual, summer, work (comma-separated)"
            placeholderTextColor={colors.textSecondary}
            value={tags.join(', ')}
            onChangeText={(text) => setTags(text.split(',').map((tag) => tag.trim()).filter(Boolean))}
            style={[styles.input, { borderColor: colors.separator, color: colors.text, backgroundColor: colors.cardBackground }]}
          />
        </View>

        <View style={styles.saveButtonContainer}>
          <ThemedButton
            title="Save Item"
            variant="primary"
            size="large"
            icon="checkmark-circle-outline"
            onPress={save}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  formSection: {
    gap: Spacing.xs,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    minHeight: 44,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  picker: {
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  urlRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
  },
  downloadBtn: {
    padding: Spacing.md,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 44,
  },
  downloadBtnDisabled: {
    opacity: 0.5,
  },
  saveButtonContainer: {
    marginTop: Spacing.sm,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.button,
    minHeight: 48,
  },
  analyzeBtnDisabled: {
    opacity: 0.7,
  },
  analyzeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  analysisResult: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.card,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  analysisHeaderText: {
    flex: 1,
    fontWeight: '600',
    color: '#4caf50',
  },
  reanalyzeBtn: {
    padding: Spacing.xs,
  },
});
