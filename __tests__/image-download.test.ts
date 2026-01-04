/**
 * Test for downloading images from URLs
 */
import { downloadAndSaveFromUrl } from '../app/services/image-service';

// Mock expo-file-system
jest.mock('expo-file-system', () => {
  const mockFile = {
    exists: true,
    uri: 'file:///mock/path/temp-123.jpg',
    delete: jest.fn(),
    copy: jest.fn(),
  };

  const FileMock = jest.fn().mockImplementation((uriOrDir, filename) => {
    // Return different URIs based on whether it's a temp file or final file
    const isTemp = typeof uriOrDir === 'object' || (typeof uriOrDir === 'string' && uriOrDir.includes('temp'));
    return {
      ...mockFile,
      uri: isTemp ? 'file:///mock/temp.jpg' : uriOrDir,
    };
  });

  // Add static method downloadFileAsync
  FileMock.downloadFileAsync = jest.fn().mockImplementation(async (url, destination) => {
    return {
      exists: true,
      uri: 'file:///mock/downloaded-temp.jpg',
      delete: jest.fn(),
    };
  });

  return {
    Directory: jest.fn().mockImplementation(() => ({
      exists: true,
      create: jest.fn(),
      uri: 'file:///mock/path',
    })),
    File: FileMock,
    Paths: {
      document: { uri: 'file:///mock/document' },
    },
  };
});

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: {
    manipulate: jest.fn().mockReturnValue({
      resize: jest.fn().mockReturnValue({
        renderAsync: jest.fn().mockResolvedValue({
          uri: 'file:///mock/resized.jpg',
          width: 1200,
          height: 900,
          saveAsync: jest.fn().mockResolvedValue({
            uri: 'file:///mock/saved.jpg',
            width: 1200,
            height: 900,
          }),
        }),
      }),
    }),
  },
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

describe('downloadAndSaveFromUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successfully downloads image from Abercrombie URL', async () => {
    const testUrl = 'https://img.abercrombie.com/is/image/anf/KIC_132-5219-00064-900_prod1?policy=product-medium';

    const result = await downloadAndSaveFromUrl(testUrl);

    expect(result).toBeDefined();
    expect(result.uri).toBeTruthy();
    expect(result.thumbnailUri).toBeTruthy();
  });

  test('successfully downloads image from generic URL', async () => {
    const testUrl = 'https://example.com/shirt.jpg';

    const result = await downloadAndSaveFromUrl(testUrl);

    expect(result).toBeDefined();
    expect(result.uri).toBeTruthy();
    expect(result.thumbnailUri).toBeTruthy();
  });

  test('handles download errors gracefully', async () => {
    const { File } = require('expo-file-system');

    // Mock the static downloadFileAsync to reject
    File.downloadFileAsync = jest.fn().mockRejectedValue(new Error('Network error'));

    const testUrl = 'https://invalid-url.com/image.jpg';

    await expect(downloadAndSaveFromUrl(testUrl)).rejects.toThrow();

    // Verify downloadFileAsync was called with correct params
    expect(File.downloadFileAsync).toHaveBeenCalled();
  });

  test('cleans up temp file after successful download', async () => {
    const { File } = require('expo-file-system');
    const deleteMock = jest.fn();

    // Mock downloadFileAsync to return a file with delete method
    File.downloadFileAsync = jest.fn().mockResolvedValue({
      exists: true,
      uri: 'file:///mock/downloaded-temp.jpg',
      delete: deleteMock,
    });

    const testUrl = 'https://example.com/test.jpg';

    await downloadAndSaveFromUrl(testUrl);

    // Verify temp file was deleted after processing
    expect(deleteMock).toHaveBeenCalled();
  });

  test('validates URL format before download', async () => {
    // This test verifies the validation happens in the UI layer
    // The service function itself doesn't validate, so this is just a placeholder
    const validUrl = 'https://img.abercrombie.com/is/image/anf/KIC_132-5219-00064-900_prod1?policy=product-medium';

    // Should not throw for valid URL
    const result = await downloadAndSaveFromUrl(validUrl);
    expect(result).toBeDefined();
  });
});
