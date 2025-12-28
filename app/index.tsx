import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from './components/themed-text';
import { ThemedView } from './components/themed-view';
import { seedSampleItems } from './services/seed';
import { initDB } from './services/storage';

export default function SplashScreen() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await initDB();
        await seedSampleItems();
      } catch (e) {
        console.warn('Failed to initialize:', e);
      }
      // Brief delay for splash effect
      setTimeout(() => setReady(true), 500);
    }
    init();
  }, []);

  if (ready) {
    return <Redirect href="/closet" />;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Suburban Outfitter</ThemedText>
      <ActivityIndicator size="large" style={styles.loader} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  loader: {
    marginTop: 16,
  },
});
