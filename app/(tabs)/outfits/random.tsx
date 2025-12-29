import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import OutfitPreview from '../../components/outfit-preview';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useToast } from '../../components/toast';
import { useItems } from '../../hooks/use-items';
import { useOutfits } from '../../hooks/use-outfits';
import { pickRandomOutfit, WeatherCondition } from '../../services/randomizer';
import { getCurrentWeather, isWeatherApiConfigured, mapTempToCondition } from '../../services/weather';
import { Item, Outfit } from '../../types';

export default function RandomOutfitScreen() {
  const router = useRouter();
  const { items, loading } = useItems();
  const { add: addOutfit } = useOutfits();
  const { showToast } = useToast();
  const [generatedOutfit, setGeneratedOutfit] = useState<Item[]>([]);
  const [minItems, setMinItems] = useState('2');
  const [maxItems, setMaxItems] = useState('4');
  const [avoidSameCategory, setAvoidSameCategory] = useState(true);
  const [requiredCategories, setRequiredCategories] = useState('');
  const [excludedCategories, setExcludedCategories] = useState('');
  const [requiredTags, setRequiredTags] = useState('');
  const [excludedTags, setExcludedTags] = useState('');
  const [weatherInput, setWeatherInput] = useState(''); // User input for weather
  const [currentWeather, setCurrentWeather] = useState<WeatherCondition | undefined>(undefined);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState<string | null>(null);

  const allAvailableCategories = useMemo(() => {
    const categories = new Set<string>();
    items.forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories);
  }, [items]);

  const allAvailableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => {
      item.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [items]);

  async function fetchWeatherFromLocation() {
    if (!isWeatherApiConfigured()) {
      Alert.alert(
        'API Not Configured',
        'Weather API key is not set. Please add EXPO_PUBLIC_WEATHER_API_KEY to your environment variables, or manually enter weather conditions.',
        [{ text: 'OK' }]
      );
      return;
    }

    setWeatherLoading(true);
    setWeatherInfo(null);

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get weather for your area.');
        setWeatherLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Fetch weather
      const weather = await getCurrentWeather(latitude, longitude);

      setCurrentWeather(weather.condition);
      setWeatherInput(`${weather.temperature}°C`);
      setWeatherInfo(`${weather.city}: ${weather.temperature}°C, ${weather.description}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get weather';
      Alert.alert('Weather Error', message);
    } finally {
      setWeatherLoading(false);
    }
  }

  function handleWeatherInputChange(text: string) {
    setWeatherInput(text);
    setWeatherInfo(null); // Clear API info when manually editing

    const temp = parseFloat(text);
    if (!isNaN(temp)) {
      // Use centralized temperature-to-condition mapping
      setCurrentWeather(mapTempToCondition(temp));
    } else {
      // If not a number, try to match directly to WeatherCondition strings
      const lowerText = text.toLowerCase().trim();
      if (['hot', 'warm', 'mild', 'cool', 'cold', 'freezing'].includes(lowerText)) {
        setCurrentWeather(lowerText as WeatherCondition);
      } else {
        setCurrentWeather(undefined);
      }
    }
  }

  function generateOutfit() {
    if (loading) {
      Alert.alert('Loading', 'Items are still loading. Please wait.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('No Items', 'Please add some items to your closet first!');
      return;
    }

    const options = {
      minItems: parseInt(minItems) || 2,
      maxItems: parseInt(maxItems) || 4,
      avoidSameCategory,
      requiredCategories: requiredCategories ? requiredCategories.split(',').map(s => s.trim()) : undefined,
      excludedCategories: excludedCategories ? excludedCategories.split(',').map(s => s.trim()) : undefined,
      requiredTags: requiredTags ? requiredTags.split(',').map(s => s.trim()) : undefined,
      excludedTags: excludedTags ? excludedTags.split(',').map(s => s.trim()) : undefined,
      weatherCondition: currentWeather,
    };

    const outfit = pickRandomOutfit(items, options);
    setGeneratedOutfit(outfit);
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText type="title">Advanced Options</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Outfit Size</ThemedText>
          <View style={styles.row}>
            <TextInput
              placeholder="Min items (e.g., 2)"
              value={minItems}
              onChangeText={setMinItems}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Max items (e.g., 4)"
              value={maxItems}
              onChangeText={setMaxItems}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <Button
            title={avoidSameCategory ? 'Avoid Same Category: ON' : 'Avoid Same Category: OFF'}
            onPress={() => setAvoidSameCategory(!avoidSameCategory)}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Category Filters</ThemedText>
          <TextInput
            placeholder={`Required categories (e.g., top, bottom). Available: ${allAvailableCategories.join(', ')}`}
            value={requiredCategories}
            onChangeText={setRequiredCategories}
            style={styles.input}
          />
          <TextInput
            placeholder={`Excluded categories (e.g., outerwear). Available: ${allAvailableCategories.join(', ')}`}
            value={excludedCategories}
            onChangeText={setExcludedCategories}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Tag Filters</ThemedText>
          <TextInput
            placeholder={`Required tags (comma-separated). Available: ${allAvailableTags.join(', ')}`}
            value={requiredTags}
            onChangeText={setRequiredTags}
            style={styles.input}
          />
          <TextInput
            placeholder={`Excluded tags (comma-separated). Available: ${allAvailableTags.join(', ')}`}
            value={excludedTags}
            onChangeText={setExcludedTags}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Weather Condition (Optional)</ThemedText>
          <TextInput
            placeholder="e.g., hot, cold, 25 (temperature in °C)"
            value={weatherInput}
            onChangeText={handleWeatherInputChange}
            style={styles.input}
          />
          {currentWeather && <ThemedText>Weather Condition: {currentWeather}</ThemedText>}
          {weatherInfo && <ThemedText style={styles.weatherInfo}>{weatherInfo}</ThemedText>}
          <View style={styles.row}>
            {weatherLoading ? (
              <ActivityIndicator />
            ) : (
              <Button title="Use My Location" onPress={fetchWeatherFromLocation} />
            )}
            {currentWeather && (
              <Button title="Clear" onPress={() => { setCurrentWeather(undefined); setWeatherInput(''); setWeatherInfo(null); }} />
            )}
          </View>
        </View>

        <Button title="Generate Outfit" onPress={generateOutfit} />

        {generatedOutfit.length > 0 && (
          <View style={styles.generatedOutfitContainer}>
            <ThemedText type="subtitle" style={styles.generatedOutfitTitle}>Generated Outfit</ThemedText>
            <OutfitPreview items={generatedOutfit} />
            <View style={styles.outfitActions}>
              <TouchableOpacity
                onPress={async () => {
                  const o: Outfit = {
                    name: `Outfit ${new Date().toLocaleDateString()}`,
                    itemIds: generatedOutfit.map((i) => i.id!),
                  };
                  await addOutfit(o);
                  showToast('Outfit saved');
                }}
                style={styles.saveBtn}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <ThemedText style={styles.saveBtnText}>Save Outfit</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: '/outfits/builder',
                    params: { preselected: JSON.stringify(generatedOutfit.map((i) => i.id)) },
                  });
                }}
                style={styles.editBtn}
              >
                <Ionicons name="create-outline" size={18} color="#007AFF" />
                <ThemedText style={styles.editBtnText}>Edit in Builder</ThemedText>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  backBtn: {
    padding: 4,
  },
  section: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
  },
  generatedOutfitContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
    gap: 10,
  },
  generatedOutfitTitle: {
    textAlign: 'center',
  },
  weatherInfo: {
    fontStyle: 'italic',
    opacity: 0.8,
  },
  outfitActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    borderRadius: 8,
  },
  editBtnText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
