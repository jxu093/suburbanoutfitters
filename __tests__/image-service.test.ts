// Mock File class for expo-file-system
class MockFile {
  uri: string;
  exists: boolean = true;
  constructor(...uris: any[]) {
    this.uri = uris.map((u) => (typeof u === 'string' ? u : u?.uri || '')).join('/');
  }
  copy() {}
  delete() {}
  create() {}
}

// Mock Directory class for expo-file-system
class MockDirectory {
  uri: string;
  exists: boolean = true;
  constructor(...uris: any[]) {
    this.uri = uris.map((u) => (typeof u === 'string' ? u : u?.uri || '')).join('/');
  }
  create() {
    this.exists = true;
  }
  list() {
    return [];
  }
}

// Hoisted mocks so Jest replaces native modules before importing image-service
jest.mock('expo-file-system', () => ({
  File: MockFile,
  Directory: MockDirectory,
  Paths: {
    document: new MockDirectory('file:///tmp'),
    cache: new MockDirectory('file:///cache'),
    bundle: new MockDirectory('file:///bundle'),
  },
}));

jest.mock('expo-image-manipulator', () => {
  const createManipulator = (uri: string) => ({
    resize: jest.fn().mockReturnValue({
      renderAsync: jest.fn().mockResolvedValue({
        saveAsync: jest.fn().mockImplementation(async (opts: any) => ({
          uri: `${uri}-manipulated.jpg`,
          width: 1200,
          height: 900,
        })),
      }),
    }),
  });

  return {
    ImageManipulator: {
      manipulate: jest.fn().mockImplementation((uri: string) => createManipulator(uri)),
    },
    SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
  };
});

// Note: we provide a basic image-picker mock here that will be used by tests below
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///tmp/lib.jpg' }] }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///tmp/cam.jpg' }] }),
}));

import { SavedImage } from '../app/services/image-service';

describe('image-service image processing', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('processAndSaveImageAsync saves resized image and thumbnail', async () => {
    const imageService = require('../app/services/image-service');

    const result: SavedImage = await imageService.processAndSaveImageAsync('file:///tmp/input.jpg');

    expect(result.uri).toContain('images');
    expect(result.thumbnailUri).toContain('thumbs');
    expect(result.width).toBeDefined();
  });

  test('pickAndSaveFromLibrary uses image-picker', async () => {
    const imageService = require('../app/services/image-service');

    const picked = await imageService.pickAndSaveFromLibrary();
    expect(picked).not.toBeNull();
    expect(picked!.uri).toContain('images');

    const cam = await imageService.takeAndSavePhoto();
    expect(cam).not.toBeNull();
    expect(cam!.uri).toContain('images');
  });
});
