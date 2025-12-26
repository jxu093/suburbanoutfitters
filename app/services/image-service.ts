import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type SavedImage = {
  uri: string;
  thumbnailUri: string;
  width?: number;
  height?: number;
};

const docDir = (FileSystem as any).documentDirectory ?? '';
const IMAGES_DIR = `${docDir}images`;
const THUMBS_DIR = `${IMAGES_DIR}/thumbs`;

async function ensureDirectories() {
  try {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    await FileSystem.makeDirectoryAsync(THUMBS_DIR, { intermediates: true });
  } catch (e) {
    // ignore - exists
  }
}

export async function requestPermissions(): Promise<boolean> {
  const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
  const cam = await ImagePicker.requestCameraPermissionsAsync();
  return lib.granted && cam.granted;
}

function isCancelled(res: any) {
  return ('cancelled' in res && res.cancelled) || ('canceled' in res && res.canceled);
}

export async function pickFromLibraryAsync(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    allowsEditing: false,
  });

  if (isCancelled(result)) return null;

  if ('assets' in result && Array.isArray(result.assets) && result.assets.length) {
    return result.assets[0].uri as string;
  }

  // fallback
  return (result as any).uri ?? null;
}

export async function takePhotoAsync(): Promise<string | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    allowsEditing: false,
  });

  if (isCancelled(result)) return null;

  if ('assets' in result && Array.isArray(result.assets) && result.assets.length) {
    return result.assets[0].uri as string;
  }

  return (result as any).uri ?? null;
}

export async function processAndSaveImageAsync(uri: string): Promise<SavedImage> {
  await ensureDirectories();

  // Resize to a reasonable max width and compress
  const resized = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  const timestamp = Date.now();
  const fileName = `image-${timestamp}.jpg`;
  const fileUri = `${IMAGES_DIR}/${fileName}`;

  await FileSystem.copyAsync({ from: resized.uri, to: fileUri });

  // Create a thumbnail
  const thumb = await ImageManipulator.manipulateAsync(
    fileUri,
    [{ resize: { width: 300 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
  );

  const thumbName = `thumb-${timestamp}.jpg`;
  const thumbUri = `${THUMBS_DIR}/${thumbName}`;
  await FileSystem.copyAsync({ from: thumb.uri, to: thumbUri });

  return { uri: fileUri, thumbnailUri: thumbUri, width: resized.width, height: resized.height };
}

export async function pickAndSaveFromLibrary(): Promise<SavedImage | null> {
  const picked = await pickFromLibraryAsync();
  if (!picked) return null;
  return processAndSaveImageAsync(picked);
}

export async function takeAndSavePhoto(): Promise<SavedImage | null> {
  const picked = await takePhotoAsync();
  if (!picked) return null;
  return processAndSaveImageAsync(picked);
}
