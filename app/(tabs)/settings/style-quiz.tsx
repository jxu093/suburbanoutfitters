import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/toast';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { getUserProfile, saveUserProfile } from '@/services/storage';

const STYLE_OPTIONS = [
  { id: 'minimalist', label: 'Minimalist', icon: 'remove-outline', description: 'Clean lines, neutral colors' },
  { id: 'classic', label: 'Classic', icon: 'ribbon-outline', description: 'Timeless, elegant pieces' },
  { id: 'casual', label: 'Casual', icon: 'cafe-outline', description: 'Relaxed, comfortable' },
  { id: 'preppy', label: 'Preppy', icon: 'school-outline', description: 'Polished, collegiate' },
  { id: 'bohemian', label: 'Bohemian', icon: 'flower-outline', description: 'Free-spirited, artistic' },
  { id: 'edgy', label: 'Edgy', icon: 'flash-outline', description: 'Bold, unconventional' },
  { id: 'sporty', label: 'Sporty', icon: 'fitness-outline', description: 'Athletic, active' },
  { id: 'romantic', label: 'Romantic', icon: 'heart-outline', description: 'Soft, feminine' },
  { id: 'streetwear', label: 'Streetwear', icon: 'headset-outline', description: 'Urban, trendy' },
  { id: 'professional', label: 'Professional', icon: 'briefcase-outline', description: 'Work-appropriate' },
];

const COLOR_OPTIONS = [
  { id: 'black', label: 'Black', color: '#000000' },
  { id: 'white', label: 'White', color: '#FFFFFF' },
  { id: 'navy', label: 'Navy', color: '#1A237E' },
  { id: 'grey', label: 'Grey', color: '#757575' },
  { id: 'beige', label: 'Beige', color: '#D7CCC8' },
  { id: 'brown', label: 'Brown', color: '#795548' },
  { id: 'red', label: 'Red', color: '#D32F2F' },
  { id: 'pink', label: 'Pink', color: '#E91E63' },
  { id: 'orange', label: 'Orange', color: '#FF5722' },
  { id: 'yellow', label: 'Yellow', color: '#FFC107' },
  { id: 'green', label: 'Green', color: '#388E3C' },
  { id: 'blue', label: 'Blue', color: '#1976D2' },
  { id: 'purple', label: 'Purple', color: '#7B1FA2' },
  { id: 'teal', label: 'Teal', color: '#00897B' },
];

const LIFESTYLE_OPTIONS = [
  { id: 'office-job', label: 'Office Work', icon: 'desktop-outline' },
  { id: 'remote-work', label: 'Remote Work', icon: 'home-outline' },
  { id: 'creative', label: 'Creative Field', icon: 'color-palette-outline' },
  { id: 'active', label: 'Active Lifestyle', icon: 'bicycle-outline' },
  { id: 'parent', label: 'Parent', icon: 'people-outline' },
  { id: 'social', label: 'Social Events', icon: 'wine-outline' },
  { id: 'outdoor', label: 'Outdoor Activities', icon: 'leaf-outline' },
  { id: 'travel', label: 'Frequent Travel', icon: 'airplane-outline' },
];

const FORMALITY_LEVELS = [
  { id: 1, label: 'Very Casual', description: 'Loungewear, athleisure' },
  { id: 2, label: 'Casual', description: 'Everyday wear, relaxed' },
  { id: 3, label: 'Smart Casual', description: 'Polished but comfortable' },
  { id: 4, label: 'Business Casual', description: 'Office-appropriate' },
  { id: 5, label: 'Formal', description: 'Professional, dressy' },
];

export default function StyleQuizScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferredStyles, setPreferredStyles] = useState<string[]>([]);
  const [avoidedStyles, setAvoidedStyles] = useState<string[]>([]);
  const [preferredColors, setPreferredColors] = useState<string[]>([]);
  const [avoidedColors, setAvoidedColors] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState<string[]>([]);
  const [formalityDefault, setFormalityDefault] = useState<number>(3);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const profile = await getUserProfile();
      if (profile) {
        if (profile.preferredStyles) {
          setPreferredStyles(JSON.parse(profile.preferredStyles as string));
        }
        if (profile.avoidedStyles) {
          setAvoidedStyles(JSON.parse(profile.avoidedStyles as string));
        }
        if (profile.preferredColors) {
          setPreferredColors(JSON.parse(profile.preferredColors as string));
        }
        if (profile.avoidedColors) {
          setAvoidedColors(JSON.parse(profile.avoidedColors as string));
        }
        if (profile.lifestyle) {
          setLifestyle(JSON.parse(profile.lifestyle as string));
        }
        if (profile.formalityDefault) {
          setFormalityDefault(profile.formalityDefault as number);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const togglePreferredStyle = (id: string) => {
    if (preferredStyles.includes(id)) {
      setPreferredStyles(preferredStyles.filter((s) => s !== id));
    } else {
      // Remove from avoided if it was there
      setAvoidedStyles(avoidedStyles.filter((s) => s !== id));
      setPreferredStyles([...preferredStyles, id]);
    }
  };

  const toggleAvoidedStyle = (id: string) => {
    if (avoidedStyles.includes(id)) {
      setAvoidedStyles(avoidedStyles.filter((s) => s !== id));
    } else {
      // Remove from preferred if it was there
      setPreferredStyles(preferredStyles.filter((s) => s !== id));
      setAvoidedStyles([...avoidedStyles, id]);
    }
  };

  const togglePreferredColor = (id: string) => {
    if (preferredColors.includes(id)) {
      setPreferredColors(preferredColors.filter((c) => c !== id));
    } else {
      setAvoidedColors(avoidedColors.filter((c) => c !== id));
      setPreferredColors([...preferredColors, id]);
    }
  };

  const toggleAvoidedColor = (id: string) => {
    if (avoidedColors.includes(id)) {
      setAvoidedColors(avoidedColors.filter((c) => c !== id));
    } else {
      setPreferredColors(preferredColors.filter((c) => c !== id));
      setAvoidedColors([...avoidedColors, id]);
    }
  };

  const toggleLifestyle = (id: string) => {
    if (lifestyle.includes(id)) {
      setLifestyle(lifestyle.filter((l) => l !== id));
    } else {
      setLifestyle([...lifestyle, id]);
    }
  };

  const savePreferences = useCallback(async () => {
    setSaving(true);
    try {
      await saveUserProfile({
        preferredStyles: JSON.stringify(preferredStyles),
        avoidedStyles: JSON.stringify(avoidedStyles),
        preferredColors: JSON.stringify(preferredColors),
        avoidedColors: JSON.stringify(avoidedColors),
        lifestyle: JSON.stringify(lifestyle),
        formalityDefault,
        profileCompleted: 1,
        skippedProfile: 0,
      });
      showToast('Preferences saved!', 'success');
      router.back();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      showToast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  }, [preferredStyles, avoidedStyles, preferredColors, avoidedColors, lifestyle, formalityDefault, router, showToast]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.tint} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Style Preferences
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Style Preferences */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Styles You Love
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Tap to select your preferred styles
          </ThemedText>
          <View style={styles.styleGrid}>
            {STYLE_OPTIONS.map((style) => {
              const isPreferred = preferredStyles.includes(style.id);
              const isAvoided = avoidedStyles.includes(style.id);
              return (
                <TouchableOpacity
                  key={style.id}
                  onPress={() => togglePreferredStyle(style.id)}
                  onLongPress={() => toggleAvoidedStyle(style.id)}
                  style={[
                    styles.styleCard,
                    {
                      backgroundColor: isPreferred
                        ? 'rgba(156, 39, 176, 0.1)'
                        : isAvoided
                          ? 'rgba(255, 59, 48, 0.1)'
                          : colors.cardBackground,
                      borderColor: isPreferred ? '#9c27b0' : isAvoided ? colors.error : colors.border,
                      borderWidth: isPreferred || isAvoided ? 2 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={style.icon as any}
                    size={22}
                    color={isPreferred ? '#9c27b0' : isAvoided ? colors.error : colors.icon}
                  />
                  <ThemedText style={[styles.styleLabel, isAvoided && { textDecorationLine: 'line-through' }]}>
                    {style.label}
                  </ThemedText>
                  {isPreferred && (
                    <View style={styles.badge}>
                      <Ionicons name="heart" size={12} color="#9c27b0" />
                    </View>
                  )}
                  {isAvoided && (
                    <View style={styles.badge}>
                      <Ionicons name="close" size={12} color={colors.error} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
            Tip: Long press to mark styles you want to avoid
          </ThemedText>
        </View>

        {/* Color Preferences */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Colors You Love
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Tap to like, long press to avoid
          </ThemedText>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((color) => {
              const isPreferred = preferredColors.includes(color.id);
              const isAvoided = avoidedColors.includes(color.id);
              return (
                <TouchableOpacity
                  key={color.id}
                  onPress={() => togglePreferredColor(color.id)}
                  onLongPress={() => toggleAvoidedColor(color.id)}
                  style={[
                    styles.colorCard,
                    {
                      borderColor: isPreferred ? '#9c27b0' : isAvoided ? colors.error : 'transparent',
                      borderWidth: isPreferred || isAvoided ? 3 : 0,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color.color },
                      color.id === 'white' && { borderWidth: 1, borderColor: colors.border },
                    ]}
                  />
                  <ThemedText style={[styles.colorLabel, { color: colors.textSecondary }]}>
                    {color.label}
                  </ThemedText>
                  {isPreferred && (
                    <View style={[styles.colorBadge, { backgroundColor: '#9c27b0' }]}>
                      <Ionicons name="heart" size={10} color="#fff" />
                    </View>
                  )}
                  {isAvoided && (
                    <View style={[styles.colorBadge, { backgroundColor: colors.error }]}>
                      <Ionicons name="close" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Formality Default */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Typical Formality
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {"What's your usual dress level?"}
          </ThemedText>
          <View style={styles.formalityRow}>
            {FORMALITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => setFormalityDefault(level.id)}
                style={[
                  styles.formalityCard,
                  {
                    backgroundColor:
                      formalityDefault === level.id ? 'rgba(156, 39, 176, 0.1)' : colors.cardBackground,
                    borderColor: formalityDefault === level.id ? '#9c27b0' : colors.border,
                    borderWidth: formalityDefault === level.id ? 2 : 1,
                  },
                  Shadows.card,
                ]}
              >
                <ThemedText style={styles.formalityNumber}>{level.id}</ThemedText>
                <ThemedText style={styles.formalityLabel}>{level.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lifestyle */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Your Lifestyle
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Select all that apply
          </ThemedText>
          <View style={styles.lifestyleGrid}>
            {LIFESTYLE_OPTIONS.map((item) => {
              const isSelected = lifestyle.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleLifestyle(item.id)}
                  style={[
                    styles.lifestyleCard,
                    {
                      backgroundColor: isSelected ? 'rgba(156, 39, 176, 0.1)' : colors.cardBackground,
                      borderColor: isSelected ? '#9c27b0' : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={isSelected ? '#9c27b0' : colors.icon}
                  />
                  <ThemedText style={styles.lifestyleLabel}>{item.label}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={savePreferences}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <ThemedText style={styles.saveBtnText}>Save Preferences</ThemedText>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: 32 },
  content: { flex: 1, paddingHorizontal: Spacing.md },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 18, marginBottom: Spacing.xs },
  sectionSubtitle: { fontSize: 13, marginBottom: Spacing.md },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  styleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.chip,
    position: 'relative',
  },
  styleLabel: { fontSize: 13, fontWeight: '500' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 2,
  },
  hint: { fontSize: 12, marginTop: Spacing.sm, fontStyle: 'italic' },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorCard: {
    alignItems: 'center',
    padding: Spacing.xs,
    borderRadius: Radii.md,
    position: 'relative',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorLabel: { fontSize: 10, marginTop: Spacing.xxs },
  colorBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderRadius: 8,
    padding: 2,
  },
  formalityRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  formalityCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radii.sm,
  },
  formalityNumber: { fontSize: 18, fontWeight: '700' },
  formalityLabel: { fontSize: 9, textAlign: 'center', marginTop: Spacing.xxs },
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  lifestyleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.chip,
  },
  lifestyleLabel: { fontSize: 13, fontWeight: '500' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#9c27b0',
    paddingVertical: Spacing.md,
    borderRadius: Radii.button,
    marginTop: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  bottomSpacer: { height: Spacing.xxxl },
});
