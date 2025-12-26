// Hoisted mocks so Jest replaces native modules before importing image-service
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///tmp/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockImplementation(async (uri: string, actions: any[], opts: any) => {
    if (opts && opts.format) {
      const w = actions[0].resize?.width ?? 300;
      return { uri: `${uri}-manipulated-${w}.jpg`, width: w, height: Math.round(w * 0.75) };
    }
    return { uri: `${uri}-manipulated.jpg`, width: 1000, height: 800 };
  }),
  SaveFormat: { JPEG: 'jpeg' },
}));

// Note: we provide a basic image-picker mock here that will be used by tests below
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ cancelled: false, assets: [{ uri: 'file:///tmp/lib.jpg' }] }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ cancelled: false, assets: [{ uri: 'file:///tmp/cam.jpg' }] }),
  MediaTypeOptions: { Images: 'Images' },
}));

import { SavedImage } from '../app/services/image-service';

describe('image-service image processing', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('processAndSaveImageAsync saves resized image and thumbnail', async () => {
    const imageService = require('../app/services/image-service');

    const result: SavedImage = await imageService.processAndSaveImageAsync('file:///tmp/input.jpg');

    expect(result.uri).toMatch(/file:\/\/\/tmp\/images\/image-\d+\.jpg/);
    expect(result.thumbnailUri).toMatch(/file:\/\/\/tmp\/images\/thumbs\/thumb-\d+\.jpg/);
    expect(result.width).toBeDefined();
  });

  test('pickAndSaveFromLibrary uses image-picker', async () => {
    const imageService = require('../app/services/image-service');

    const picked = await imageService.pickAndSaveFromLibrary();
    expect(picked).not.toBeNull();
    expect(picked!.uri).toMatch(/file:\/\/\/tmp\/images\/image-\d+\.jpg/);

    const cam = await imageService.takeAndSavePhoto();
    expect(cam).not.toBeNull();
    expect(cam!.uri).toMatch(/file:\/\/\/tmp\/images\/image-\d+\.jpg/);
  });
});
