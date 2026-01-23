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
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useToast } from '../../components/toast';
import { Colors, Radii, Shadows, Spacing } from '../../constants/theme';
import { getUserProfile, saveUserProfile } from '../../services/storage';
import type { UserProfile } from '../../types';

type BodyType = NonNullable<UserProfile['bodyType']>;
type SkinTone = NonNullable<UserProfile['skinTone']>;
type Height = NonNullable<UserProfile['height']>;

const BODY_TYPES: { id: BodyType; label: string; description: string; icon: string }[] = [
  { id: 'rectangle', label: 'Rectangle', description: 'Shoulders, waist, and hips similar width', icon: '▭' },
  { id: 'triangle', label: 'Triangle', description: 'Hips wider than shoulders', icon: '△' },
  { id: 'inverted-triangle', label: 'Inverted Triangle', description: 'Shoulders wider than hips', icon: '▽' },
  { id: 'hourglass', label: 'Hourglass', description: 'Defined waist, balanced shoulders/hips', icon: '⧗' },
  { id: 'oval', label: 'Oval', description: 'Fuller midsection', icon: '⬭' },
];

const SKIN_TONES: { id: SkinTone; label: string; color: string; description: string }[] = [
  { id: 'pale', label: 'Fair/Pale', color: '#F5DEB3', description: 'Light skin, cool undertones' },
  { id: 'tan', label: 'Medium/Tan', color: '#D2A679', description: 'Warm undertones, olive or golden' },
  { id: 'dark', label: 'Dark/Deep', color: '#8B4513', description: 'Rich, deep skin tones' },
];

const HEIGHTS: { id: Height; label: string; description: string }[] = [
  { id: 'petite', label: 'Petite', description: "Under 5'4\" / 163cm" },
  { id: 'average', label: 'Average', description: "5'4\" - 5'8\" / 163-173cm" },
  { id: 'tall', label: 'Tall', description: "Over 5'8\" / 173cm" },
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [skinTone, setSkinTone] = useState<SkinTone | null>(null);
  const [height, setHeight] = useState<Height | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setBodyType(profile.bodyType as BodyType | null);
        setSkinTone(profile.skinTone as SkinTone | null);
        setHeight(profile.height as Height | null);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const saveProfile = useCallback(async () => {
    setSaving(true);
    try {
      await saveUserProfile({
        bodyType,
        skinTone,
        height,
        profileCompleted: 1,
        skippedProfile: 0,
      });
      showToast('Profile saved!', 'success');
      router.back();
    } catch (error) {
      console.error('Failed to save profile:', error);
      showToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  }, [bodyType, skinTone, height, router, showToast]);

  const skipProfile = useCallback(async () => {
    try {
      await saveUserProfile({
        skippedProfile: 1,
      });
      router.back();
    } catch (error) {
      console.error('Failed to skip profile:', error);
    }
  }, [router]);

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
          Your Profile
        </ThemedText>
        <TouchableOpacity onPress={skipProfile} style={styles.skipBtn}>
          <ThemedText style={[styles.skipText, { color: colors.textSecondary }]}>Skip</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={[styles.introBox, { backgroundColor: colors.fillSecondary }]}>
          <Ionicons name="sparkles" size={24} color="#9c27b0" />
          <ThemedText style={[styles.introText, { color: colors.textSecondary }]}>
            Help the AI stylist give you better recommendations by sharing a bit about yourself.
            This info stays on your device.
          </ThemedText>
        </View>

        {/* Body Type */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Body Type
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Helps suggest flattering silhouettes
          </ThemedText>
          <View style={styles.optionGrid}>
            {BODY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setBodyType(type.id)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: bodyType === type.id ? '#9c27b0' : colors.border,
                    borderWidth: bodyType === type.id ? 2 : 1,
                  },
                  Shadows.card,
                ]}
              >
                <ThemedText style={styles.optionIcon}>{type.icon}</ThemedText>
                <ThemedText style={styles.optionLabel}>{type.label}</ThemedText>
                <ThemedText style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  {type.description}
                </ThemedText>
                {bodyType === type.id && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#9c27b0" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Skin Tone */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Skin Tone
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Helps recommend colors that complement you
          </ThemedText>
          <View style={styles.skinToneRow}>
            {SKIN_TONES.map((tone) => (
              <TouchableOpacity
                key={tone.id}
                onPress={() => setSkinTone(tone.id)}
                style={[
                  styles.skinToneCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: skinTone === tone.id ? '#9c27b0' : colors.border,
                    borderWidth: skinTone === tone.id ? 2 : 1,
                  },
                  Shadows.card,
                ]}
              >
                <View style={[styles.skinToneCircle, { backgroundColor: tone.color }]} />
                <ThemedText style={styles.skinToneLabel}>{tone.label}</ThemedText>
                <ThemedText style={[styles.skinToneDesc, { color: colors.textSecondary }]}>
                  {tone.description}
                </ThemedText>
                {skinTone === tone.id && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#9c27b0" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Height */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Height
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Helps with proportion and fit recommendations
          </ThemedText>
          <View style={styles.heightRow}>
            {HEIGHTS.map((h) => (
              <TouchableOpacity
                key={h.id}
                onPress={() => setHeight(h.id)}
                style={[
                  styles.heightCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: height === h.id ? '#9c27b0' : colors.border,
                    borderWidth: height === h.id ? 2 : 1,
                  },
                  Shadows.card,
                ]}
              >
                <ThemedText style={styles.heightLabel}>{h.label}</ThemedText>
                <ThemedText style={[styles.heightDesc, { color: colors.textSecondary }]}>
                  {h.description}
                </ThemedText>
                {height === h.id && (
                  <View style={styles.checkmarkSmall}>
                    <Ionicons name="checkmark-circle" size={18} color="#9c27b0" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={saveProfile}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <ThemedText style={styles.saveBtnText}>Save Profile</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Continue to Style Quiz */}
        <TouchableOpacity
          onPress={() => router.push('/settings/style-quiz')}
          style={[styles.styleQuizBtn, { borderColor: colors.border }]}
        >
          <ThemedText style={[styles.styleQuizBtnText, { color: colors.tint }]}>
            Continue to Style Preferences
          </ThemedText>
          <Ionicons name="arrow-forward" size={18} color={colors.tint} />
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
  skipBtn: { padding: Spacing.xs },
  skipText: { fontSize: 15 },
  content: { flex: 1, paddingHorizontal: Spacing.md },
  introBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  introText: { flex: 1, fontSize: 14, lineHeight: 20 },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 18, marginBottom: Spacing.xs },
  sectionSubtitle: { fontSize: 13, marginBottom: Spacing.md },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: Radii.md,
    position: 'relative',
    minHeight: 100,
  },
  optionIcon: { fontSize: 24, marginBottom: Spacing.xs },
  optionLabel: { fontSize: 14, fontWeight: '600', marginBottom: Spacing.xxs },
  optionDesc: { fontSize: 11, lineHeight: 14 },
  checkmark: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  skinToneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  skinToneCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
    position: 'relative',
  },
  skinToneCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  skinToneLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  skinToneDesc: { fontSize: 10, textAlign: 'center', marginTop: Spacing.xxs },
  heightRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heightCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
    position: 'relative',
  },
  heightLabel: { fontSize: 14, fontWeight: '600', marginBottom: Spacing.xxs },
  heightDesc: { fontSize: 11, textAlign: 'center' },
  checkmarkSmall: { position: 'absolute', top: Spacing.xs, right: Spacing.xs },
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
  styleQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radii.button,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  styleQuizBtnText: { fontSize: 15, fontWeight: '500' },
  bottomSpacer: { height: Spacing.xxxl },
});
