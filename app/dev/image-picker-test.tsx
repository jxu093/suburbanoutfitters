import { ScrollView, StyleSheet } from 'react-native';
import ImagePickerComponent from '../components/image-picker';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';

export default function ImagePickerTestScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView>
        <ThemedText type="title">Image Picker Test</ThemedText>
        <ThemedText>Use this screen to test picking and saving images locally.</ThemedText>
        <ImagePickerComponent onDone={(saved) => console.log('Saved image:', saved)} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
});
