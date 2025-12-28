import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type SavedImage = {
  uri: string;
  thumbnailUri: string;
  width?: number;
  height?: number;
};

// Create directories using new API - Paths.document is a Directory object
const IMAGES_DIR_NAME = 'images';
const THUMBS_DIR_NAME = 'thumbs';

function getImagesDir(): Directory {
  return new Directory(Paths.document, IMAGES_DIR_NAME);
}

function getThumbsDir(): Directory {
  return new Directory(Paths.document, IMAGES_DIR_NAME, THUMBS_DIR_NAME);
}

async function ensureDirectories() {
  try {
    const imagesDir = getImagesDir();
    if (!imagesDir.exists) {
      imagesDir.create();
    }
    const thumbsDir = getThumbsDir();
    if (!thumbsDir.exists) {
      thumbsDir.create();
    }
  } catch (e) {
    // ignore - may already exist
    console.warn('Error creating directories:', e);
  }
}

export async function requestPermissions(): Promise<boolean> {
  const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
  const cam = await ImagePicker.requestCameraPermissionsAsync();
  return lib.granted && cam.granted;
}

function isCancelled(res: ImagePicker.ImagePickerResult): boolean {
  return res.canceled;
}

export async function pickFromLibraryAsync(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
  });

  if (isCancelled(result)) return null;

  if (result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }

  return null;
}

export async function takePhotoAsync(): Promise<string | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
  });

  if (isCancelled(result)) return null;

  if (result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }

  return null;
}

export async function processAndSaveImageAsync(uri: string): Promise<SavedImage> {
  await ensureDirectories();

  const timestamp = Date.now();
  const fileName = `image-${timestamp}.jpg`;
  const thumbName = `thumb-${timestamp}.jpg`;

  // Use the new ImageManipulator API (SDK 52+)
  const image = ImageManipulator.ImageManipulator.manipulate(uri);
  const resized = await image.resize({ width: 1200 }).renderAsync();
  const resizedResult = await resized.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 });

  // Create destination file using Directory API
  const destFile = new File(getImagesDir(), fileName);
  const sourceFile = new File(resizedResult.uri);
  sourceFile.copy(destFile);

  // Create a thumbnail from the saved full-size image
  const thumbImage = ImageManipulator.ImageManipulator.manipulate(destFile.uri);
  const thumb = await thumbImage.resize({ width: 300 }).renderAsync();
  const thumbResult = await thumb.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.6 });

  // Copy thumbnail to our storage
  const thumbDestFile = new File(getThumbsDir(), thumbName);
  const thumbSourceFile = new File(thumbResult.uri);
  thumbSourceFile.copy(thumbDestFile);

  return { uri: destFile.uri, thumbnailUri: thumbDestFile.uri, width: resizedResult.width, height: resizedResult.height };
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

/**
 * Delete image files from the filesystem.
 * Safe to call with null/undefined values.
 */
export async function deleteImageFiles(imageUri?: string | null, thumbUri?: string | null): Promise<void> {
  const deleteFile = (uri: string | null | undefined) => {
    if (!uri) return;
    try {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
    } catch (e) {
      // Ignore errors - file may not exist or be inaccessible
      console.warn('Failed to delete image file:', uri, e);
    }
  };

  deleteFile(imageUri);
  deleteFile(thumbUri);
}
