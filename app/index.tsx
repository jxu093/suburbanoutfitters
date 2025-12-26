import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ThemedText } from './components/themed-text';
import { ThemedView } from './components/themed-view';

export default function Index() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome to Suburban Outfitter</ThemedText>

      <Link href="/closet">
        <Link.Trigger>
          <ThemedText type="subtitle">Open Closet (Main Tab)</ThemedText>
        </Link.Trigger>
      </Link>

      <Link href="/dev/permissions-test">
        <Link.Trigger>
          <ThemedText type="subtitle">Permissions Test</ThemedText>
        </Link.Trigger>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
