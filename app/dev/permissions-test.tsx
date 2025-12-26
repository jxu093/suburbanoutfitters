import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native';

export default function PermissionsTestScreen() {
  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);

  async function requestCamera() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos of clothing items.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }
        );
        setCameraStatus(granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : granted);
      } else {
        const res = await ImagePicker.requestCameraPermissionsAsync();
        setCameraStatus(res.status);
      }
    } catch (err) {
      setCameraStatus('error');
      console.error(err);
    }
  }

  async function requestMedia() {
    try {
      if (Platform.OS === 'android') {
        const readGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Read Storage Permission',
            message: 'This app needs access to your photos to select clothing images.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }
        );
        const writeGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Write Storage Permission',
            message: 'This app needs permission to save images to your device.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }
        );
        setMediaStatus(
          readGranted === PermissionsAndroid.RESULTS.GRANTED && writeGranted === PermissionsAndroid.RESULTS.GRANTED
            ? 'granted'
            : 'denied'
        );
      } else {
        const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setMediaStatus(res.status);
      }
    } catch (err) {
      setMediaStatus('error');
      console.error(err);
    }
  }

  function showWeatherKey() {
    const key = Constants.expoConfig?.extra?.WEATHER_API_KEY;
    Alert.alert('WEATHER_API_KEY', String(key ?? 'not set'));
    console.log('WEATHER_API_KEY:', key);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Permissions Test</Text>
      <View style={styles.row}>
        <Button title="Request Camera" onPress={requestCamera} />
        <Text style={styles.status}>Status: {cameraStatus ?? 'unknown'}</Text>
      </View>

      <View style={styles.row}>
        <Button title="Request Media Library" onPress={requestMedia} />
        <Text style={styles.status}>Status: {mediaStatus ?? 'unknown'}</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Show WEATHER_API_KEY" onPress={showWeatherKey} />
      </View>

      <View style={{ marginTop: 20 }}>
        <Link href="/dev/image-picker-test">
          <Text style={{ color: '#0a7ea4', fontWeight: '600' }}>Open Image Picker Test</Text>
        </Link>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.note}>
          Open the app and navigate to <Text style={{ fontWeight: '600' }}>/dev/permissions-test</Text> to run this screen.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  status: { marginLeft: 12 },
  note: { color: '#555' },
});
