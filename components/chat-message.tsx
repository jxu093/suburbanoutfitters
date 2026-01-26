import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Linking, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import type { Item } from '@/types';
import { getItemImageUri } from '@/utils/item-helpers';
import { ThemedText } from './themed-text';

type ChatRole = 'user' | 'assistant';

type SuggestedItem = {
  item: Item;
  reasoning: string;
};

type ShoppingSuggestion = {
  category: string;
  description: string;
  colors?: string[];
  style?: string[];
  reasoning: string;
  searchQuery: string;
};

export type ChatMessageData = {
  id: string;
  role: ChatRole;
  content: string;
  suggestedItems?: SuggestedItem[];
  shoppingSuggestions?: ShoppingSuggestion[];
  followUpQuestions?: string[];
  timestamp: number;
};

type ChatMessageProps = {
  message: ChatMessageData;
  onSelectItem?: (item: Item) => void;
  onFollowUpPress?: (question: string) => void;
};

export function ChatMessage({ message, onSelectItem, onFollowUpPress }: ChatMessageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          isUser
            ? { backgroundColor: colors.tint }
            : { backgroundColor: '#9c27b0' },
        ]}
      >
        <Ionicons
          name={isUser ? 'person' : 'sparkles'}
          size={16}
          color="#fff"
        />
      </View>

      <View style={styles.contentWrapper}>
        {/* Message bubble */}
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.tint, borderBottomRightRadius: Radii.xs }
              : { backgroundColor: colors.cardBackground, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: Radii.xs },
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              isUser && { color: '#fff' },
            ]}
          >
            {message.content}
          </ThemedText>
        </View>

        {/* Suggested closet items */}
        {message.suggestedItems && message.suggestedItems.length > 0 && (
          <View style={styles.suggestionsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shirt-outline" size={14} color={colors.tint} />
              <ThemedText style={[styles.sectionLabel, { color: colors.tint }]}>
                From Your Closet
              </ThemedText>
            </View>
            {message.suggestedItems.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.item.id}
                style={[styles.suggestionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => onSelectItem?.(suggestion.item)}
              >
                {getItemImageUri(suggestion.item) ? (
                  <Image
                    source={{ uri: getItemImageUri(suggestion.item) }}
                    style={styles.itemThumb}
                  />
                ) : (
                  <View style={[styles.itemThumb, styles.placeholder]} />
                )}
                <View style={styles.suggestionInfo}>
                  <ThemedText style={styles.itemName} numberOfLines={1}>
                    {suggestion.item.name}
                  </ThemedText>
                  <ThemedText style={[styles.reasoning, { color: colors.textSecondary }]} numberOfLines={2}>
                    {suggestion.reasoning}
                  </ThemedText>
                </View>
                <Ionicons name="add-circle" size={24} color={colors.tint} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Shopping suggestions */}
        {message.shoppingSuggestions && message.shoppingSuggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="globe-outline" size={14} color="#4285F4" />
              <ThemedText style={[styles.sectionLabel, { color: '#4285F4' }]}>
                Shopping Ideas
              </ThemedText>
            </View>
            {message.shoppingSuggestions.map((suggestion, index) => (
              <View
                key={`${suggestion.category}-${index}`}
                style={[styles.shoppingCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              >
                <ThemedText style={styles.shoppingDescription}>
                  {suggestion.description}
                </ThemedText>
                <ThemedText style={[styles.reasoning, { color: colors.textSecondary }]}>
                  {suggestion.reasoning}
                </ThemedText>
                {(suggestion.colors && suggestion.colors.length > 0) && (
                  <View style={styles.tagRow}>
                    {suggestion.colors.slice(0, 3).map((color) => (
                      <View key={color} style={[styles.tag, { backgroundColor: colors.fillSecondary }]}>
                        <ThemedText style={[styles.tagText, { color: colors.text }]}>{color}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={() => {
                    const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(suggestion.searchQuery)}`;
                    Linking.openURL(url);
                  }}
                >
                  <Ionicons name="search" size={14} color="#fff" />
                  <ThemedText style={styles.searchBtnText}>Search</ThemedText>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Follow-up questions */}
        {message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <View style={styles.followUpSection}>
            {message.followUpQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.followUpChip, { backgroundColor: colors.fillSecondary, borderColor: colors.border }]}
                onPress={() => onFollowUpPress?.(question)}
              >
                <ThemedText style={[styles.followUpText, { color: colors.tint }]}>
                  {question}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

type QuickPromptChipProps = {
  label: string;
  onPress: () => void;
};

export function QuickPromptChip({ label, onPress }: QuickPromptChipProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.quickPromptChip, { backgroundColor: colors.fillSecondary, borderColor: colors.border }]}
      onPress={onPress}
    >
      <ThemedText style={[styles.quickPromptText, { color: colors.tint }]}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  userContainer: {
    flexDirection: 'row-reverse',
  },
  assistantContainer: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs,
  },
  contentWrapper: {
    flex: 1,
    maxWidth: '85%',
  },
  bubble: {
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  suggestionsSection: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginBottom: Spacing.xxs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: Radii.xs,
  },
  placeholder: {
    backgroundColor: '#e0e0e0',
  },
  suggestionInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasoning: {
    fontSize: 12,
    lineHeight: 16,
  },
  shoppingCard: {
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  shoppingDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xxs,
  },
  tag: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radii.chip,
  },
  tagText: {
    fontSize: 11,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: '#4285F4',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.button,
    alignSelf: 'flex-start',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  followUpSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  followUpChip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.chip,
    borderWidth: 1,
  },
  followUpText: {
    fontSize: 13,
  },
  quickPromptChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.button,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
