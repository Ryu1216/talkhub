import { imageUploadService } from '../imageUploadService';
import { storageService } from '../storageService';
import * as imageUtils from '../../utils/imageUtils';
import { AppError, ErrorType } from '../../types/error';

// Mock dependencies
jest.mock('../storageService');
jest.mock('../../utils/imageUtils');
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  }
}));

const mockStorageService = storageService as jest.Mocked<typeof storageService>;
const mockImageUtils = imageUtils as jest.Mocked<typeof imageUtils>;

// Mock XMLHttpRequest for React Native
const mockXMLHttpRequest = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  onload: null as any,
  onerror: null as any,
  status: 200,
  response: new Blob(['test'], { type: 'image/jpeg' }),
  responseType: ''
};

(global as any).XMLHttpRequest = jest.fn(() => mockXMLHttpRequest);

describe('ImageUploadService', () => {
  const mockUserId = 'user123';
  const mockImageUri = 'file:///path/to/image.jpg';
  const mockDownloadUrl = 'https://firebase.storage.com/image.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockImageUtils.validateImage.mockReturnValue({ isValid: true });
    mockImageUtils.compressImage.mockResolvedValue('compressed-uri');
    mockImageUtils.generateImageFileName.mockReturnValue('generated-filename.jpg');
    mockImageUtils.getFileExtension.mockReturnValue('jpg');
    mockStorageService.uploadPostImage.mockResolvedValue(mockDownloadUrl);
  });

  describe('uploadImageFromUri', () => {
    it('successfully uploads an image with compression', async () => {
      const result = await imageUploadService.uploadImageFromUri(mockImageUri, mockUserId);

      expect(mockImageUtils.validateImage).toHaveBeenCalledWith(mockImageUri);
      expect(mockImageUtils.compressImage).toHaveBeenCalledWith(mockImageUri, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8
      });
      expect(mockStorageService.uploadPostImage).toHaveBeenCalled();
      expect(result).toEqual({
        url: mockDownloadUrl,
        path: expect.stringContaining('posts/user123/'),
        originalUri: mockImageUri,
        compressedUri: 'compressed-uri'
      });
    });

    it('uploads without compression when disabled', async () => {
      const result = await imageUploadService.uploadImageFromUri(
        mockImageUri, 
        mockUserId, 
        { compress: false }
      );

      expect(mockImageUtils.compressImage).not.toHaveBeenCalled();
      expect(result.compressedUri).toBeUndefined();
    });

    it('handles compression failure gracefully', async () => {
      mockImageUtils.compressImage.mockRejectedValue(new Error('Compression failed'));

      const result = await imageUploadService.uploadImageFromUri(mockImageUri, mockUserId);

      expect(result).toBeDefined();
      expect(result.compressedUri).toBeUndefined();
    });

    it('throws error for invalid image', async () => {
      mockImageUtils.validateImage.mockReturnValue({
        isValid: false,
        error: 'Invalid image format'
      });

      await expect(
        imageUploadService.uploadImageFromUri(mockImageUri, mockUserId)
      ).rejects.toThrow(AppError);
    });

    it('handles upload progress callback', async () => {
      const onProgress = jest.fn();
      const mockProgress = { bytesTransferred: 50, totalBytes: 100, progress: 50 };

      mockStorageService.uploadPostImage.mockImplementation(
        (file, userId, fileName, progressCallback) => {
          if (progressCallback) {
            progressCallback(mockProgress);
          }
          return Promise.resolve(mockDownloadUrl);
        }
      );

      await imageUploadService.uploadImageFromUri(mockImageUri, mockUserId, { onProgress });

      expect(onProgress).toHaveBeenCalledWith(mockProgress);
    });

    it('handles storage service errors', async () => {
      mockStorageService.uploadPostImage.mockRejectedValue(
        new AppError(ErrorType.NETWORK_ERROR, 'Upload failed')
      );

      await expect(
        imageUploadService.uploadImageFromUri(mockImageUri, mockUserId)
      ).rejects.toThrow(AppError);
    });
  });

  describe('uploadMultipleImages', () => {
    const mockUris = ['uri1.jpg', 'uri2.jpg', 'uri3.jpg'];

    it('successfully uploads multiple images', async () => {
      const results = await imageUploadService.uploadMultipleImages(mockUris, mockUserId);

      expect(results).toHaveLength(3);
      expect(mockStorageService.uploadPostImage).toHaveBeenCalledTimes(3);
    });

    it('handles partial failures', async () => {
      mockStorageService.uploadPostImage
        .mockResolvedValueOnce(mockDownloadUrl)
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce(mockDownloadUrl);

      const results = await imageUploadService.uploadMultipleImages(mockUris, mockUserId);

      expect(results).toHaveLength(2); // Only successful uploads
    });

    it('throws error when all uploads fail', async () => {
      mockStorageService.uploadPostImage.mockRejectedValue(new Error('All uploads failed'));

      await expect(
        imageUploadService.uploadMultipleImages(mockUris, mockUserId)
      ).rejects.toThrow(AppError);
    });

    it('handles progress for multiple uploads', async () => {
      const onProgress = jest.fn();
      
      await imageUploadService.uploadMultipleImages(mockUris, mockUserId, { onProgress });

      // Progress should be called for each upload
      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('deleteImage', () => {
    it('successfully deletes an image', async () => {
      await imageUploadService.deleteImage(mockDownloadUrl);

      expect(mockStorageService.deleteImage).toHaveBeenCalledWith(mockDownloadUrl);
    });

    it('handles deletion errors', async () => {
      mockStorageService.deleteImage.mockRejectedValue(new Error('Delete failed'));

      await expect(
        imageUploadService.deleteImage(mockDownloadUrl)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getImageMetadata', () => {
    it('returns image dimensions', async () => {
      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        width: 800,
        height: 600,
        src: ''
      };

      (global as any).Image = jest.fn(() => mockImage);

      const metadataPromise = imageUploadService.getImageMetadata(mockImageUri);
      
      // Simulate successful image load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);

      const metadata = await metadataPromise;

      expect(metadata).toEqual({
        width: 800,
        height: 600
      });
    });

    it('handles image load errors', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        width: 0,
        height: 0,
        src: ''
      };

      (global as any).Image = jest.fn(() => mockImage);

      const metadataPromise = imageUploadService.getImageMetadata(mockImageUri);
      
      // Simulate image load error
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 0);

      await expect(metadataPromise).rejects.toThrow(AppError);
    });
  });

  describe('utility methods', () => {
    it('returns correct upload support status', () => {
      expect(imageUploadService.isUploadSupported()).toBe(true);
    });

    it('returns correct max file size', () => {
      expect(imageUploadService.getMaxFileSize()).toBe(5 * 1024 * 1024);
    });

    it('returns supported formats', () => {
      const formats = imageUploadService.getSupportedFormats();
      expect(formats).toContain('jpg');
      expect(formats).toContain('png');
      expect(formats).toContain('gif');
      expect(formats).toContain('webp');
    });
  });

  describe('uriToBlob (private method)', () => {
    it('handles data URIs', async () => {
      const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...';
      mockImageUtils.dataURItoBlob.mockReturnValue(new Blob(['test'], { type: 'image/jpeg' }));

      // Test through public method that uses uriToBlob internally
      await imageUploadService.uploadImageFromUri(dataUri, mockUserId);

      expect(mockImageUtils.dataURItoBlob).toHaveBeenCalledWith(dataUri);
    });

    it('handles React Native URIs with XMLHttpRequest', async () => {
      // Setup XMLHttpRequest mock to simulate successful response
      mockXMLHttpRequest.onload = null;
      mockXMLHttpRequest.onerror = null;

      const uploadPromise = imageUploadService.uploadImageFromUri(mockImageUri, mockUserId);

      // Simulate successful XMLHttpRequest
      setTimeout(() => {
        if (mockXMLHttpRequest.onload) {
          mockXMLHttpRequest.onload();
        }
      }, 0);

      const result = await uploadPromise;
      expect(result).toBeDefined();
    });
  });
});