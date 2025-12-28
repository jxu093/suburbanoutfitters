import React, { useMemo, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import OutfitPreview from '../../components/outfit-preview';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useItems } from '../../hooks/use-items';
import { pickRandomOutfit, WeatherCondition } from '../../services/randomizer';
import { Item } from '../../types';

export default function RandomOutfitScreen() {
  const { items, loading } = useItems();
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

  async function fetchWeather(city: string) {
    // This is a placeholder for actual weather API integration.
    // In a real app, you'd use a service like OpenWeatherMap, AccuWeather, etc.
    // For now, we'll simulate based on user input or provide a mock.
    Alert.alert(
      'Weather API Placeholder',
      `Integration with a weather API for "${city}" is not yet implemented. Please manually select a weather condition or provide a temperature.`,
      [{ text: 'OK' }]
    );
    // Example of how you might set a condition based on a manual override or mock
    // setCurrentWeather('mild');
  }

  function handleWeatherInputChange(text: string) {
    setWeatherInput(text);
    const temp = parseFloat(text);
    if (!isNaN(temp)) {
      // Very basic conversion: Assuming input is Celsius
      // You'd need a more robust temp-to-condition mapping for production
      if (temp >= 30) setCurrentWeather('hot');
      else if (temp >= 20) setCurrentWeather('warm');
      else if (temp >= 10) setCurrentWeather('mild');
      else if (temp >= 0) setCurrentWeather('cool');
      else if (temp >= -10) setCurrentWeather('cold');
      else setCurrentWeather('freezing');
    } else {
      // If not a number, try to match directly to WeatherCondition strings
      const lowerText = text.toLowerCase();
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
        <ThemedText type="title" style={styles.title}>Generate Random Outfit</ThemedText>

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
            placeholder="e.g., hot, cold, 25C (manual input)"
            value={weatherInput}
            onChangeText={handleWeatherInputChange}
            style={styles.input}
          />
          {currentWeather && <ThemedText>Current Weather Condition: {currentWeather}</ThemedText>}
          <Button title="Get Weather (Placeholder)" onPress={() => fetchWeather('current location')} />
        </View>

        <Button title="Generate Outfit" onPress={generateOutfit} />

        {generatedOutfit.length > 0 && (
          <View style={styles.generatedOutfitContainer}>
            <ThemedText type="subtitle" style={styles.generatedOutfitTitle}>Generated Outfit</ThemedText>
            <OutfitPreview items={generatedOutfit} />
            {/* TODO: Add a button to save this outfit to the user's outfits */}
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
  title: {
    textAlign: 'center',
    marginBottom: 10,
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
});
