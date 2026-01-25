import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { ChatMessage, QuickPromptChip, type ChatMessageData } from '@/components/chat-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/toast';
import { normalizeCategory } from '@/constants';
import { Colors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useItems } from '@/hooks/use-items';
import { useOutfits } from '@/hooks/use-outfits';
import { aiService } from '@/services/ai';
import type { Item, Outfit } from '@/types';
import { getItemImageUri, isItemHidden } from '@/utils/item-helpers';

const QUICK_PROMPTS = [
  'Build me a date night outfit',
  'Casual weekend look',
  'What should I wear to work?',
  'Something cozy for staying in',
];

export default function AIChatScreen() {
  const router = useRouter();
  const { items } = useItems();
  const { add } = useOutfits();
  const { showToast } = useToast();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<Item[]>([]);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const availableItems = items.filter((i) => !isItemHidden(i));

  // Check AI configuration on mount
  useEffect(() => {
    aiService.isConfigured().then((configured) => {
      if (!configured) {
        showToast('Configure AI in Settings first', 'error');
        router.back();
      }
    });
  }, [router, showToast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await aiService.processNaturalLanguageRequest(
        text.trim(),
        currentOutfit,
        availableItems,
        conversationHistory
      );

      // Build suggested items from response
      const suggestedItems = response.suggestedClosetItemIds
        ?.map((id) => {
          const item = availableItems.find((i) => i.id === id);
          if (!item) return null;
          return {
            item,
            reasoning: response.closetReasonings?.[id] || 'Suggested for your outfit',
          };
        })
        .filter((s): s is { item: Item; reasoning: string } => s !== null);

      const assistantMessage: ChatMessageData = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        suggestedItems,
        shoppingSuggestions: response.purchaseSuggestions,
        followUpQuestions: response.followUpQuestions,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update conversation history
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: text.trim() },
        { role: 'assistant', content: response.message },
      ]);
    } catch (error: any) {
      console.error('AI chat error:', error);
      showToast('Failed to get response', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectItem(item: Item) {
    const itemCategory = normalizeCategory(item.category);
    if (itemCategory) {
      // Remove any existing item from the same category
      const withoutSameCategory = currentOutfit.filter((i) => {
        const iCategory = normalizeCategory(i.category);
        return iCategory !== itemCategory;
      });
      setCurrentOutfit([...withoutSameCategory, item]);
    } else {
      setCurrentOutfit([...currentOutfit, item]);
    }
    showToast(`Added ${item.name}`, 'success');
  }

  function removeFromOutfit(item: Item) {
    setCurrentOutfit((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function saveOutfit() {
    if (currentOutfit.length === 0) {
      showToast('Add items to save', 'error');
      return;
    }
    const o: Outfit = {
      name: `AI Outfit ${new Date().toLocaleDateString()}`,
      itemIds: currentOutfit.map((i) => i.id!),
    };
    await add(o);
    showToast('Outfit saved', 'success');
    setCurrentOutfit([]);
  }

  function clearChat() {
    setMessages([]);
    setConversationHistory([]);
    setCurrentOutfit([]);
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Ionicons name="sparkles" size={20} color="#9c27b0" />
            <ThemedText type="subtitle">AI Stylist</ThemedText>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Current outfit preview (if items selected) */}
        {currentOutfit.length > 0 && (
          <View style={[styles.outfitPreview, { borderColor: colors.border }]}>
            <View style={styles.outfitHeader}>
              <ThemedText style={styles.outfitLabel}>Current Outfit</ThemedText>
              <TouchableOpacity onPress={saveOutfit} style={styles.saveBtn}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <ThemedText style={styles.saveBtnText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.outfitScroll}>
              {currentOutfit.map((item) => (
                <View key={item.id} style={styles.outfitItem}>
                  <Image
                    source={{ uri: getItemImageUri(item) }}
                    style={styles.outfitThumb}
                  />
                  <TouchableOpacity
                    style={styles.removeItemBtn}
                    onPress={() => removeFromOutfit(item)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
              <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                Chat with your AI Stylist
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Ask for outfit suggestions, styling advice, or help finding items in your closet.
              </ThemedText>
              <View style={styles.quickPrompts}>
                {QUICK_PROMPTS.map((prompt) => (
                  <QuickPromptChip
                    key={prompt}
                    label={prompt}
                    onPress={() => sendMessage(prompt)}
                  />
                ))}
              </View>
            </View>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onSelectItem={handleSelectItem}
              onFollowUpPress={sendMessage}
            />
          ))}

          {isLoading && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color="#9c27b0" />
              <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                Thinking...
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.fillSecondary }]}
            placeholder="Ask about outfits, styling, or your closet..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(inputText)}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  outfitPreview: {
    padding: Spacing.sm,
    borderBottomWidth: 1,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  outfitLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    backgroundColor: '#4caf50',
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.button,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  outfitScroll: {
    flexDirection: 'row',
  },
  outfitItem: {
    position: 'relative',
    marginRight: Spacing.sm,
  },
  outfitThumb: {
    width: 56,
    height: 56,
    borderRadius: Radii.sm,
  },
  removeItemBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.button,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9c27b0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
