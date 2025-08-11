import {
  validateImage,
  generateImageFileName,
  getFileExtension,
  dataURItoBlob
} from '../imageUtils';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png'
  }
}));

describe('imageUtils', () => {
  describe('validateImage', () => {
    it('validates valid image URIs', () => {
      const validUris = [
        'file:///path/to/image.jpg',
        'https://example.com/image.png',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
        'file:///path/to/image.JPEG',
        'https://example.com/image.gif',
        'file:///path/to/image.webp'
      ];

      validUris.forEach(uri => {
        const result = validateImage(uri);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('rejects invalid image URIs', () => {
      const invalidUris = [
        '',
        'file:///path/to/document.pdf',
        'https://example.com/video.mp4',
        'file:///path/to/audio.mp3',
        'not-a-uri'
      ];

      invalidUris.forEach(uri => {
        const result = validateImage(uri);
        if (uri === '') {
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('이미지 URI가 필요합니다.');
        } else {
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('지원되지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)');
        }
      });
    });

    it('validates data URIs correctly', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const result = validateImage(dataUri);
      expect(result.isValid).toBe(true);
    });
  });

  describe('generateImageFileName', () => {
    it('generates unique filenames with user ID', () => {
      const userId = 'user123';
      const fileName1 = generateImageFileName(userId);
      const fileName2 = generateImageFileName(userId);

      expect(fileName1).toMatch(/^user123_\d+_[a-z0-9]+\.jpg$/);
      expect(fileName2).toMatch(/^user123_\d+_[a-z0-9]+\.jpg$/);
      expect(fileName1).not.toBe(fileName2);
    });

    it('generates filenames with custom extension', () => {
      const userId = 'user123';
      const fileName = generateImageFileName(userId, 'png');

      expect(fileName).toMatch(/^user123_\d+_[a-z0-9]+\.png$/);
    });

    it('includes timestamp in filename', () => {
      const userId = 'user123';
      const beforeTime = Date.now();
      const fileName = generateImageFileName(userId);
      const afterTime = Date.now();

      const timestampMatch = fileName.match(/user123_(\d+)_/);
      expect(timestampMatch).toBeTruthy();
      
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1]);
        expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(timestamp).toBeLessThanOrEqual(afterTime);
      }
    });
  });

  describe('getFileExtension', () => {
    it('extracts file extensions correctly', () => {
      const testCases = [
        { uri: 'file:///path/to/image.jpg', expected: 'jpg' },
        { uri: 'https://example.com/image.PNG', expected: 'png' },
        { uri: 'file:///path/to/image.jpeg', expected: 'jpeg' },
        { uri: 'https://example.com/image.gif', expected: 'gif' },
        { uri: 'file:///path/to/image.webp', expected: 'webp' },
        { uri: 'no-extension', expected: 'jpg' }, // fallback
        { uri: 'file:///path/to/image', expected: 'jpg' } // fallback
      ];

      testCases.forEach(({ uri, expected }) => {
        expect(getFileExtension(uri)).toBe(expected);
      });
    });

    it('handles complex URIs with query parameters', () => {
      const uri = 'https://example.com/image.jpg?width=300&height=200';
      expect(getFileExtension(uri)).toBe('jpg');
    });
  });

  describe('dataURItoBlob', () => {
    it('converts data URI to blob', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      const blob = dataURItoBlob(dataUri);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('handles JPEG data URIs', () => {
      const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      const blob = dataURItoBlob(dataUri);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });

    it('throws error for invalid data URI', () => {
      expect(() => {
        dataURItoBlob('invalid-data-uri');
      }).toThrow();
    });
  });
});