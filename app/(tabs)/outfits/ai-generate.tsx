import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { ShopSimilarButton } from '@/components/affiliate-product-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/toast';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useItems } from '@/hooks/use-items';
import { useOutfits } from '@/hooks/use-outfits';
import { aiService } from '@/services/ai';
import { createOutfitFeedback, getUserProfile, saveUserProfile, incrementProfileFeedbackCount } from '@/services/storage';
import { getCurrentWeather, isWeatherApiConfigured, type WeatherData } from '@/services/weather';
import type { AIOutfitSuggestion, Item, Outfit, UserProfile } from '@/types';
import { getItemImageUri } from '@/utils/item-helpers';

// Occasion options
const OCCASIONS = [
  { id: 'casual', label: 'Casual', icon: 'cafe-outline' },
  { id: 'work', label: 'Work', icon: 'briefcase-outline' },
  { id: 'date', label: 'Date Night', icon: 'heart-outline' },
  { id: 'formal', label: 'Formal', icon: 'diamond-outline' },
  { id: 'weekend', label: 'Weekend', icon: 'sunny-outline' },
  { id: 'active', label: 'Active', icon: 'fitness-outline' },
] as const;

type OccasionId = (typeof OCCASIONS)[number]['id'];

export default function AIGenerateScreen() {
  const router = useRouter();
  const { items } = useItems();
  const { add: addOutfit } = useOutfits();
  const { showToast } = useToast();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [selectedOccasion, setSelectedOccasion] = useState<OccasionId>('casual');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<AIOutfitSuggestion | null>(null);
  const [suggestedItems, setSuggestedItems] = useState<Item[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load user profile and check if prompt needed
  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getUserProfile();
        if (profile) {
          // Parse JSON fields
          const parsedProfile: UserProfile = {
            ...profile,
            bodyType: profile.bodyType as UserProfile['bodyType'],
            skinTone: profile.skinTone as UserProfile['skinTone'],
            height: profile.height as UserProfile['height'],
            preferredStyles: profile.preferredStyles ? JSON.parse(profile.preferredStyles as string) : null,
            avoidedStyles: profile.avoidedStyles ? JSON.parse(profile.avoidedStyles as string) : null,
            preferredColors: profile.preferredColors ? JSON.parse(profile.preferredColors as string) : null,
            avoidedColors: profile.avoidedColors ? JSON.parse(profile.avoidedColors as string) : null,
            lifestyle: profile.lifestyle ? JSON.parse(profile.lifestyle as string) : null,
            profileCompleted: !!profile.profileCompleted,
            skippedProfile: !!profile.skippedProfile,
          };
          setUserProfile(parsedProfile);

          // Show prompt if profile not completed and not skipped
          if (!parsedProfile.profileCompleted && !parsedProfile.skippedProfile) {
            setShowProfilePrompt(true);
          }
        } else {
          // No profile exists, show prompt
          setShowProfilePrompt(true);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setProfileLoaded(true);
      }
    }

    loadProfile();
  }, []);

  // Fetch weather on mount
  useEffect(() => {
    async function fetchWeather() {
      if (!isWeatherApiConfigured()) return;

      setWeatherLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({});
        const weatherData = await getCurrentWeather(
          location.coords.latitude,
          location.coords.longitude
        );
        setWeather(weatherData);
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setWeatherLoading(false);
      }
    }

    fetchWeather();
  }, []);

  async function generateOutfit() {
    // Check if AI is configured
    const isConfigured = await aiService.isConfigured();
    if (!isConfigured) {
      showToast('Please configure your AI API key in Settings', 'error');
      return;
    }

    // Check if we have items with AI analysis
    const analyzedItems = items.filter((item) => item.aiCategory || item.aiColors);
    if (analyzedItems.length < 3) {
      showToast('Analyze at least 3 items first for better results', 'error');
      return;
    }

    setIsGenerating(true);
    setSuggestion(null);
    setSuggestedItems([]);

    try {
      const result = await aiService.generateSmartOutfit(
        items,
        selectedOccasion,
        weather?.condition,
        userProfile ?? undefined
      );

      setSuggestion(result);

      // Get the actual items from IDs
      const outfitItems = result.itemIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is Item => item !== undefined);

      setSuggestedItems(outfitItems);

      if (outfitItems.length === 0) {
        showToast('Could not generate outfit. Try analyzing more items.', 'error');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      showToast(error.message || 'Failed to generate outfit', 'error');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAccept() {
    if (!suggestion || suggestedItems.length === 0) return;

    // Save outfit
    const outfit: Outfit = {
      name: `AI ${selectedOccasion.charAt(0).toUpperCase() + selectedOccasion.slice(1)} - ${new Date().toLocaleDateString()}`,
      itemIds: suggestion.itemIds,
    };
    await addOutfit(outfit);

    // Track feedback
    await createOutfitFeedback({
      outfitItemIds: JSON.stringify(suggestion.itemIds),
      action: 'accept',
      occasion: selectedOccasion,
      weather: weather?.condition ?? null,
      createdAt: Date.now(),
    });

    // Update profile feedback count for learning
    await incrementProfileFeedbackCount('accept');

    showToast('Outfit saved!', 'success');

    // Clear and allow generating another
    setSuggestion(null);
    setSuggestedItems([]);
  }

  async function handleReject() {
    if (!suggestion) return;

    // Track feedback
    await createOutfitFeedback({
      outfitItemIds: JSON.stringify(suggestion.itemIds),
      action: 'reject',
      occasion: selectedOccasion,
      weather: weather?.condition ?? null,
      createdAt: Date.now(),
    });

    // Update profile feedback count for learning
    await incrementProfileFeedbackCount('reject');

    showToast('Got it! Generating another...', 'info');

    // Generate a new outfit
    generateOutfit();
  }

  function handleRegenerate() {
    generateOutfit();
  }

  async function handleSkipProfile() {
    try {
      await saveUserProfile({ skippedProfile: 1 });
      setShowProfilePrompt(false);
    } catch (error) {
      console.error('Failed to skip profile:', error);
    }
  }

  function handleSetupProfile() {
    setShowProfilePrompt(false);
    router.push('/settings/profile');
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title">AI Stylist</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Weather display */}
        <View style={[styles.weatherCard, { backgroundColor: colors.cardBackground }]}>
          {weatherLoading ? (
            <ActivityIndicator size="small" color={colors.tint} />
          ) : weather ? (
            <>
              <Ionicons
                name={
                  weather.condition === 'hot' || weather.condition === 'warm'
                    ? 'sunny'
                    : weather.condition === 'cold' || weather.condition === 'freezing'
                      ? 'snow'
                      : 'partly-sunny'
                }
                size={24}
                color={
                  weather.condition === 'hot' || weather.condition === 'warm'
                    ? '#ff9800'
                    : weather.condition === 'cold' || weather.condition === 'freezing'
                      ? '#03a9f4'
                      : '#ffc107'
                }
              />
              <View>
                <ThemedText style={styles.weatherTemp}>{weather.temperature}°C</ThemedText>
                <ThemedText style={[styles.weatherDesc, { color: colors.textSecondary }]}>
                  {weather.description} in {weather.city}
                </ThemedText>
              </View>
            </>
          ) : (
            <ThemedText style={{ color: colors.textSecondary }}>
              Weather unavailable - outfit will be season-neutral
            </ThemedText>
          )}
        </View>

        {/* Occasion selector */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            {"What's the occasion?"}
          </ThemedText>
          <View style={styles.occasionGrid}>
            {OCCASIONS.map((occ) => (
              <TouchableOpacity
                key={occ.id}
                onPress={() => setSelectedOccasion(occ.id)}
                style={[
                  styles.occasionBtn,
                  {
                    backgroundColor:
                      selectedOccasion === occ.id ? colors.tint : colors.cardBackground,
                    borderColor: selectedOccasion === occ.id ? colors.tint : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={occ.icon as any}
                  size={20}
                  color={selectedOccasion === occ.id ? '#fff' : colors.text}
                />
                <ThemedText
                  style={[
                    styles.occasionText,
                    { color: selectedOccasion === occ.id ? '#fff' : colors.text },
                  ]}
                >
                  {occ.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate button */}
        {!suggestion && (
          <TouchableOpacity
            onPress={generateOutfit}
            disabled={isGenerating}
            style={[
              styles.generateBtn,
              { backgroundColor: isGenerating ? colors.tint + '80' : colors.tint },
            ]}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <ThemedText style={styles.generateBtnText}>Creating your outfit...</ThemedText>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <ThemedText style={styles.generateBtnText}>Generate Outfit</ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Suggestion display */}
        {suggestion && suggestedItems.length > 0 && (
          <View style={styles.suggestionSection}>
            {/* Outfit preview */}
            <View style={[styles.outfitPreview, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.outfitGrid}>
                {suggestedItems.map((item) => (
                  <View key={item.id} style={styles.outfitItemWrap}>
                    <Image
                      source={{ uri: getItemImageUri(item) }}
                      style={styles.outfitItemImage}
                    />
                    <ThemedText
                      numberOfLines={1}
                      style={[styles.outfitItemName, { color: colors.textSecondary }]}
                    >
                      {item.name}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Reasoning */}
              {suggestion.reasoning && (
                <View style={styles.reasoningBox}>
                  <Ionicons name="bulb-outline" size={16} color={colors.tint} />
                  <ThemedText style={[styles.reasoningText, { color: colors.textSecondary }]}>
                    {suggestion.reasoning}
                  </ThemedText>
                </View>
              )}

              {/* Score */}
              {suggestion.score && (
                <View style={styles.scoreRow}>
                  <ThemedText style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                    Style Score
                  </ThemedText>
                  <View style={styles.scoreStars}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < (suggestion.score ?? 0) ? 'star' : 'star-outline'}
                        size={14}
                        color={i < (suggestion.score ?? 0) ? '#ffc107' : colors.border}
                      />
                    ))}
                  </View>
                  <ThemedText style={styles.scoreValue}>{suggestion.score}/10</ThemedText>
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleReject}
                style={[styles.actionBtn, styles.rejectBtn, { borderColor: colors.error }]}
              >
                <Ionicons name="close" size={24} color={colors.error} />
                <ThemedText style={[styles.actionBtnText, { color: colors.error }]}>
                  Not for me
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRegenerate}
                style={[styles.actionBtn, styles.regenerateBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="refresh" size={24} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAccept}
                style={[styles.actionBtn, styles.acceptBtn, { backgroundColor: colors.success }]}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
                <ThemedText style={[styles.actionBtnText, { color: '#fff' }]}>Save</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Shop similar items */}
            <View style={[styles.shopSection, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.shopHeader}>
                <Ionicons name="cart-outline" size={18} color={colors.textSecondary} />
                <ThemedText style={[styles.shopTitle, { color: colors.textSecondary }]}>
                  Shop Similar Items
                </ThemedText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopScroll}>
                {suggestedItems.map((item) => (
                  <View key={item.id} style={[styles.shopItem, { borderColor: colors.border }]}>
                    <Image
                      source={{ uri: getItemImageUri(item) }}
                      style={styles.shopItemImage}
                    />
                    <ThemedText numberOfLines={1} style={styles.shopItemName}>{item.name}</ThemedText>
                    <ShopSimilarButton
                      query={`${item.aiCategory || item.category || ''} ${item.name} ${item.aiColors?.[0] || ''}`}
                      category={item.aiCategory || item.category || undefined}
                      compact
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Empty state hint */}
        {!suggestion && !isGenerating && (
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
              The AI will analyze your wardrobe and create a stylish outfit based on the occasion
              and current weather.{'\n\n'}
              For best results, make sure your items have been analyzed with AI (tap &quot;Analyze with
              AI&quot; when viewing an item).
            </ThemedText>
          </View>
        )}

        {/* Profile link */}
        {profileLoaded && userProfile?.profileCompleted && (
          <TouchableOpacity
            onPress={() => router.push('/settings/profile')}
            style={[styles.profileLink, { borderColor: colors.border }]}
          >
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.profileLinkText, { color: colors.textSecondary }]}>
              Edit your style profile
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Profile prompt modal */}
      <Modal
        visible={showProfilePrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfilePrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalIcon}>
              <Ionicons name="sparkles" size={32} color="#9c27b0" />
            </View>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Personalize Your Style
            </ThemedText>
            <ThemedText style={[styles.modalText, { color: colors.textSecondary }]}>
              Help the AI stylist give you better recommendations by telling us a bit about yourself.
              This info stays on your device.
            </ThemedText>

            <View style={styles.modalBenefits}>
              <View style={styles.benefitRow}>
                <Ionicons name="color-palette-outline" size={18} color="#9c27b0" />
                <ThemedText style={styles.benefitText}>Colors that complement your skin tone</ThemedText>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="body-outline" size={18} color="#9c27b0" />
                <ThemedText style={styles.benefitText}>Fits that flatter your body type</ThemedText>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="heart-outline" size={18} color="#9c27b0" />
                <ThemedText style={styles.benefitText}>Styles you love, not ones you avoid</ThemedText>
              </View>
            </View>

            <TouchableOpacity onPress={handleSetupProfile} style={styles.modalPrimaryBtn}>
              <ThemedText style={styles.modalPrimaryBtnText}>Set Up Profile</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkipProfile} style={styles.modalSecondaryBtn}>
              <ThemedText style={[styles.modalSecondaryBtnText, { color: colors.textSecondary }]}>
                Maybe later
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: Spacing.xs,
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.card,
  },
  weatherTemp: {
    fontSize: 18,
    fontWeight: '600',
  },
  weatherDesc: {
    fontSize: 13,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  occasionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  occasionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radii.button,
    ...Shadows.button,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionSection: {
    gap: Spacing.md,
  },
  outfitPreview: {
    padding: Spacing.md,
    borderRadius: Radii.card,
    gap: Spacing.md,
  },
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  outfitItemWrap: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: '30%',
  },
  outfitItemImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radii.sm,
  },
  outfitItemName: {
    fontSize: 11,
    textAlign: 'center',
  },
  reasoningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: Radii.sm,
  },
  reasoningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  scoreLabel: {
    fontSize: 12,
  },
  scoreStars: {
    flexDirection: 'row',
    gap: 2,
    flex: 1,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.button,
  },
  rejectBtn: {
    flex: 1,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  regenerateBtn: {
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  acceptBtn: {
    flex: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: Radii.card,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.md,
  },
  profileLinkText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radii.card,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.modal,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  modalBenefits: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitText: {
    fontSize: 13,
    flex: 1,
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: '#9c27b0',
    paddingVertical: Spacing.md,
    borderRadius: Radii.button,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalPrimaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSecondaryBtn: {
    paddingVertical: Spacing.sm,
  },
  modalSecondaryBtnText: {
    fontSize: 14,
  },
  shopSection: {
    padding: Spacing.md,
    borderRadius: Radii.card,
    marginTop: Spacing.sm,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  shopTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  shopScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  shopItem: {
    width: 100,
    marginRight: Spacing.sm,
    alignItems: 'center',
    padding: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radii.sm,
  },
  shopItemImage: {
    width: 80,
    height: 80,
    borderRadius: Radii.xs,
    marginBottom: Spacing.xs,
  },
  shopItemName: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
});
