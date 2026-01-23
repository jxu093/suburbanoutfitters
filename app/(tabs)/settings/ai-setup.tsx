import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { aiService } from '../../services/ai/ai-service';

export default function AISetupScreen() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const configured = await aiService.isConfigured();
      setIsConfigured(configured);
      if (configured) {
        const provider = await aiService.getProviderName();
        // Don't show the actual key, just indicate it's set
        setApiKey('••••••••••••••••••••••••••••••••');
      }
    } catch (error) {
      console.error('Error checking AI configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || apiKey.startsWith('••••')) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    setSaving(true);
    try {
      await aiService.configure(apiKey.trim());
      setIsConfigured(true);
      Alert.alert('Success', 'API key saved! AI features are now enabled.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save API key'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear API Key',
      'Are you sure you want to remove your API key? AI features will be disabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await aiService.configure('');
              setApiKey('');
              setIsConfigured(false);
            } catch {
              // Key cleared
              setApiKey('');
              setIsConfigured(false);
            }
          },
        },
      ]
    );
  };

  const openAnthropicConsole = () => {
    Linking.openURL('https://console.anthropic.com/');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'AI Setup' }} />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'AI Setup' }} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={48} color="#007AFF" />
        </View>

        <Text style={styles.title}>AI Stylist</Text>
        <Text style={styles.subtitle}>
          Power up your wardrobe with AI-driven outfit suggestions, auto-tagging,
          and inspiration matching.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Claude API Key</Text>
          <Text style={styles.sectionDescription}>
            Enter your Anthropic API key to enable AI features. Your key is stored
            securely on your device.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-ant-api03-..."
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showKey && !apiKey.startsWith('••••')}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowKey(!showKey)}
            >
              <Ionicons
                name={showKey ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={openAnthropicConsole}
          >
            <Ionicons name="open-outline" size={16} color="#007AFF" />
            <Text style={styles.linkText}>Get an API key from Anthropic Console</Text>
          </TouchableOpacity>
        </View>

        {isConfigured && (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.statusText}>AI features enabled</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isConfigured ? 'Update Key' : 'Save Key'}
              </Text>
            )}
          </TouchableOpacity>

          {isConfigured && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear Key</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What AI can do:</Text>
          <View style={styles.infoItem}>
            <Ionicons name="pricetag" size={16} color="#666" />
            <Text style={styles.infoText}>Auto-tag clothing items from photos</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shirt" size={16} color="#666" />
            <Text style={styles.infoText}>Generate smart outfit suggestions</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="images" size={16} color="#666" />
            <Text style={styles.infoText}>Match inspiration photos to your wardrobe</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="color-palette" size={16} color="#666" />
            <Text style={styles.infoText}>Suggest items that pair well together</Text>
          </View>
        </View>

        <View style={styles.costSection}>
          <Ionicons name="information-circle-outline" size={16} color="#666" />
          <Text style={styles.costText}>
            Typical cost: ~$0.003 per item analysis, ~$0.004 per outfit suggestion.
            Most users spend less than $1/month.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    padding: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  costSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  costText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
