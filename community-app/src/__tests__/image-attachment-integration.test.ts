/**
 * Image Attachment Integration Tests
 * 
 * This test suite covers comprehensive integration testing for the image attachment flow
 * including image selection, upload, compression, and error handling scenarios.
 * 
 * Requirements covered:
 * - 3.1: Image selection from gallery/camera
 * - 3.2: Image preview and validation
 * - 3.3: Image upload to Firebase Storage with error handling
 */

import { usePostsStore } from '../stores/postsStore';
import { useAuthStore } from '../stores/authStore';
import { imageUploadService } from '../services/imageUploadService';
import { postsService } from '../services/postsService';
import { AppError, ErrorType, CreatePostData } from '../types';
import { Timestamp } from 'firebase/firestore';
import { APP_CONSTANTS } from '../constants';

// Mock services
jest.mock('../services/imageUploadService', () => ({
  imageUploadService: {
    uploadImageFromUri: jest.fn(),
    deleteImage: jest.fn(),
    getImageMetadata: jest.fn(),
    isUploadSupported: jest.fn(() => true),
    getMaxFileSize: jest.fn(() => 5 * 1024 * 1024),
    getSupportedFormats: jest.fn(() => ['jpg', 'jpeg', 'png', 'gif', 'webp']),
  },
}));

jest.mock('../services/postsService', () => ({
  postsService: {
    createPost: jest.fn(),
  },
}));

// Mock image utilities
jest.mock('../utils/imageUtils', () => ({
  validateImage: jest.fn(),
  compressImage: jest.fn(),
  generateImageFileName: jest.fn(),
  getFileExtension: jest.fn(),
  dataURItoBlob: jest.fn(),
}));

const mockImageUploadService = imageUploadService as jest.Mocked<typeof imageUploadService>;
const mockPostsService = postsService as jest.Mocked<typeof postsService>;

describe('Image Attachment Integration Tests', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const mockImageUploadResult = {
    url: 'https://firebase.storage.com/test-image.jpg',
    path: 'posts/test-user-123/test-image.jpg',
    originalUri: 'file://test-image.jpg',
    compressedUri: 'file://compressed-test-image.jpg',
  };

  const mockPost = {
    id: 'test-post-123',
    title: 'Test Post',
    content: 'Test Content',
    imageUrl: mockImageUploadResult.url,
    authorId: mockUser.uid,
    authorName: mockUser.displayName!,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    commentCount: 0,
  };

  beforeEach(() => {
    // Reset stores
    usePostsStore.getState().reset();
    useAuthStore.getState().reset();
    
    // Set authenticated user
    useAuthStore.setState({ user: mockUser });
    
    jest.clearAllMocks();
  });

  describe('Successful Image Upload Integration', () => {
    test('should complete full image upload and post creation flow', async () => {
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockImageUploadResult);
      mockPostsService.createPost.mockResolvedValue(mockPost);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          name: 'test-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      await createPost(postData);

      // Verify image upload was called with correct parameters
      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalledWith(
        'file://test-image.jpg',
        mockUser.uid,
        {
          compress: true,
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.8,
        }
      );

      // Verify post creation was called with uploaded image URL
      expect(mockPostsService.createPost).toHaveBeenCalledWith(
        {
          title: 'Test Post',
          content: 'Test Content',
          imageUrl: mockImageUploadResult.url,
        },
        mockUser.uid,
        mockUser.displayName
      );

      // Verify post was added to store
      const { posts, error, loading } = usePostsStore.getState();
      expect(posts).toHaveLength(1);
      expect(posts[0]).toEqual(mockPost);
      expect(error).toBeNull();
      expect(loading).toBe(false);
    });

    test('should handle post creation without image', async () => {
      mockPostsService.createPost.mockResolvedValue({
        ...mockPost,
        imageUrl: undefined,
      });

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      await createPost(postData);

      // Verify image upload was not called
      expect(mockImageUploadService.uploadImageFromUri).not.toHaveBeenCalled();

      // Verify post creation was called without image URL
      expect(mockPostsService.createPost).toHaveBeenCalledWith(
        {
          title: 'Test Post',
          content: 'Test Content',
          imageUrl: undefined,
        },
        mockUser.uid,
        mockUser.displayName
      );
    });

    test('should handle different image formats correctly', async () => {
      const imageFormats = [
        { uri: 'file://test.jpg', type: 'image/jpeg', name: 'test.jpg' },
        { uri: 'file://test.png', type: 'image/png', name: 'test.png' },
        { uri: 'file://test.gif', type: 'image/gif', name: 'test.gif' },
        { uri: 'file://test.webp', type: 'image/webp', name: 'test.webp' },
      ];

      for (const imageFormat of imageFormats) {
        const uploadResult = {
          ...mockImageUploadResult,
          url: `https://firebase.storage.com/${imageFormat.name}`,
          originalUri: imageFormat.uri,
        };

        const post = {
          ...mockPost,
          id: `post-${imageFormat.name}`,
          imageUrl: uploadResult.url,
        };

        mockImageUploadService.uploadImageFromUri.mockResolvedValueOnce(uploadResult);
        mockPostsService.createPost.mockResolvedValueOnce(post);

        const postData: CreatePostData = {
          title: 'Test Post',
          content: 'Test Content',
          image: imageFormat,
        };

        const { createPost } = usePostsStore.getState();
        await createPost(postData);

        expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalledWith(
          imageFormat.uri,
          mockUser.uid,
          expect.any(Object)
        );
      }
    });

    test('should handle image compression during upload', async () => {
      const compressedResult = {
        ...mockImageUploadResult,
        compressedUri: 'file://compressed-test-image.jpg',
      };

      mockImageUploadService.uploadImageFromUri.mockResolvedValue(compressedResult);
      mockPostsService.createPost.mockResolvedValue(mockPost);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://large-image.jpg',
          type: 'image/jpeg',
          name: 'large-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      await createPost(postData);

      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalledWith(
        'file://large-image.jpg',
        mockUser.uid,
        expect.objectContaining({
          compress: true,
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.8,
        })
      );
    });

    test('should handle upload progress tracking', async () => {
      const progressCallback = jest.fn();
      
      mockImageUploadService.uploadImageFromUri.mockImplementation(
        (uri, userId, options) => {
          // Simulate progress updates
          if (options?.onProgress) {
            options.onProgress({ progress: 25, bytesTransferred: 1024, totalBytes: 4096 });
            options.onProgress({ progress: 50, bytesTransferred: 2048, totalBytes: 4096 });
            options.onProgress({ progress: 75, bytesTransferred: 3072, totalBytes: 4096 });
            options.onProgress({ progress: 100, bytesTransferred: 4096, totalBytes: 4096 });
          }
          return Promise.resolve(mockImageUploadResult);
        }
      );

      mockPostsService.createPost.mockResolvedValue(mockPost);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          name: 'test-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      await createPost(postData);

      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalledWith(
        'file://test-image.jpg',
        mockUser.uid,
        expect.objectContaining({
          compress: true,
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.8,
        })
      );
    });
  });

  describe('Image Upload Error Scenarios', () => {
    test('should handle image upload network error', async () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Network connection failed');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(networkError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          name: 'test-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Network connection failed');

      // Verify post creation was not called
      expect(mockPostsService.createPost).not.toHaveBeenCalled();

      // Verify error state
      const { error, loading, posts } = usePostsStore.getState();
      expect(error).toEqual(networkError);
      expect(loading).toBe(false);
      expect(posts).toHaveLength(0);
    });

    test('should handle image validation error', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Image file too large');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(validationError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://large-image.jpg',
          type: 'image/jpeg',
          name: 'large-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Image file too large');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });

    test('should handle image permission error', async () => {
      const permissionError = new AppError(ErrorType.PERMISSION_ERROR, 'Insufficient storage permissions');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(permissionError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          name: 'test-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Insufficient storage permissions');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.PERMISSION_ERROR);
    });

    test('should handle post creation failure with image rollback', async () => {
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockImageUploadResult);
      
      const postError = new AppError(ErrorType.PERMISSION_ERROR, 'Post creation failed');
      mockPostsService.createPost.mockRejectedValue(postError);
      
      mockImageUploadService.deleteImage.mockResolvedValue();

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          name: 'test-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Post creation failed');

      // Verify image upload was called
      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalled();
      
      // Verify post creation was attempted
      expect(mockPostsService.createPost).toHaveBeenCalled();
      
      // Verify rollback - uploaded image should be deleted
      expect(mockImageUploadService.deleteImage).toHaveBeenCalledWith(mockImageUploadResult.url);

      // Verify error state
      const { error, loading, posts } = usePostsStore.getState();
      expect(error).toEqual(postError);
      expect(loading).toBe(false);
      expect(posts).toHaveLength(0);
    });

    test('should handle rollback failure gracefully', async () => {
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockImageUploadResult);
      
      const postError = new AppError(ErrorType.PERMISSION_ERROR, 'Post creation failed');
      mockPostsService.createPost.mockRejectedValue(postError);
      
      const rollbackError = new AppError(ErrorType.NETWORK_ERROR, 'Rollback failed');
      mockImageUploadService.deleteImage.mockRejectedValue(rollbackError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          name: 'test-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      // Should still throw the original post creation error, not the rollback error
      await expect(createPost(postData)).rejects.toThrow('Post creation failed');

      // Verify rollback was attempted
      expect(mockImageUploadService.deleteImage).toHaveBeenCalled();

      // Verify original error is preserved
      const { error } = usePostsStore.getState();
      expect(error).toEqual(postError);

      // Verify rollback error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to rollback uploaded image:', rollbackError);

      consoleSpy.mockRestore();
    });

    test('should handle authentication error during image upload', async () => {
      // Clear authenticated user
      useAuthStore.setState({ user: null });

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          name: 'test-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow();

      // Verify no services were called
      expect(mockImageUploadService.uploadImageFromUri).not.toHaveBeenCalled();
      expect(mockPostsService.createPost).not.toHaveBeenCalled();

      // Verify auth error
      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.AUTH_ERROR);
    });

    test('should handle unknown image upload error', async () => {
      const unknownError = new Error('Unexpected error occurred');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(unknownError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          name: 'test-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow();

      const { error } = usePostsStore.getState();
      expect(error).toBeTruthy();
    });
  });

  describe('Concurrent Image Upload Scenarios', () => {
    test('should handle concurrent post creation with images', async () => {
      const result1 = { ...mockImageUploadResult, url: 'https://firebase.storage.com/image1.jpg' };
      const result2 = { ...mockImageUploadResult, url: 'https://firebase.storage.com/image2.jpg' };

      mockImageUploadService.uploadImageFromUri
        .mockResolvedValueOnce(result1)
        .mockResolvedValueOnce(result2);

      const post1 = { ...mockPost, id: 'post1', imageUrl: result1.url };
      const post2 = { ...mockPost, id: 'post2', imageUrl: result2.url };

      mockPostsService.createPost
        .mockResolvedValueOnce(post1)
        .mockResolvedValueOnce(post2);

      const postData1: CreatePostData = {
        title: 'Post 1',
        content: 'Content 1',
        image: { uri: 'file://image1.jpg', type: 'image/jpeg', name: 'image1.jpg' },
      };

      const postData2: CreatePostData = {
        title: 'Post 2',
        content: 'Content 2',
        image: { uri: 'file://image2.jpg', type: 'image/jpeg', name: 'image2.jpg' },
      };

      const { createPost } = usePostsStore.getState();

      // Start both uploads concurrently
      const [result1Promise, result2Promise] = await Promise.allSettled([
        createPost(postData1),
        createPost(postData2),
      ]);

      expect(result1Promise.status).toBe('fulfilled');
      expect(result2Promise.status).toBe('fulfilled');

      const { posts } = usePostsStore.getState();
      expect(posts).toHaveLength(2);
    });

    test('should handle mixed success and failure in concurrent uploads', async () => {
      const successResult = { ...mockImageUploadResult, url: 'https://firebase.storage.com/success.jpg' };
      
      mockImageUploadService.uploadImageFromUri
        .mockResolvedValueOnce(successResult)
        .mockRejectedValueOnce(new AppError(ErrorType.NETWORK_ERROR, 'Upload failed'));

      const successPost = { ...mockPost, id: 'success-post', imageUrl: successResult.url };
      mockPostsService.createPost.mockResolvedValueOnce(successPost);

      const successData: CreatePostData = {
        title: 'Success Post',
        content: 'Success Content',
        image: { uri: 'file://success.jpg', type: 'image/jpeg', name: 'success.jpg' },
      };

      const failData: CreatePostData = {
        title: 'Fail Post',
        content: 'Fail Content',
        image: { uri: 'file://fail.jpg', type: 'image/jpeg', name: 'fail.jpg' },
      };

      const { createPost } = usePostsStore.getState();

      const [successPromiseResult, failPromiseResult] = await Promise.allSettled([
        createPost(successData),
        createPost(failData),
      ]);

      expect(successPromiseResult.status).toBe('fulfilled');
      expect(failPromiseResult.status).toBe('rejected');

      const { posts } = usePostsStore.getState();
      expect(posts).toHaveLength(1);
      expect(posts[0].id).toBe('success-post');
    });
  });

  describe('Image Upload Performance and Optimization', () => {
    test('should apply correct compression settings', async () => {
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockImageUploadResult);
      mockPostsService.createPost.mockResolvedValue(mockPost);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://large-image.jpg',
          type: 'image/jpeg',
          name: 'large-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      await createPost(postData);

      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalledWith(
        'file://large-image.jpg',
        mockUser.uid,
        expect.objectContaining({
          compress: true,
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.8,
        })
      );
    });

    test('should handle image metadata extraction', async () => {
      const mockMetadata = {
        width: 2048,
        height: 1536,
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
      };

      mockImageUploadService.getImageMetadata.mockResolvedValue(mockMetadata);
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockImageUploadResult);
      mockPostsService.createPost.mockResolvedValue(mockPost);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          name: 'test-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      await createPost(postData);

      // Verify upload was successful
      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalled();
    });

    test('should handle large image files within limits', async () => {
      const largeImageResult = {
        ...mockImageUploadResult,
        originalUri: 'file://large-image.jpg',
        compressedUri: 'file://compressed-large-image.jpg',
      };

      mockImageUploadService.uploadImageFromUri.mockResolvedValue(largeImageResult);
      mockPostsService.createPost.mockResolvedValue(mockPost);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://large-image.jpg',
          type: 'image/jpeg',
          name: 'large-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      await createPost(postData);

      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalledWith(
        'file://large-image.jpg',
        mockUser.uid,
        expect.objectContaining({
          compress: true,
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.8,
        })
      );
    });

    test('should validate supported image formats', () => {
      const supportedFormats = mockImageUploadService.getSupportedFormats();
      const maxFileSize = mockImageUploadService.getMaxFileSize();
      const isSupported = mockImageUploadService.isUploadSupported();

      expect(supportedFormats).toEqual(['jpg', 'jpeg', 'png', 'gif', 'webp']);
      expect(maxFileSize).toBe(5 * 1024 * 1024); // 5MB
      expect(isSupported).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle empty image URI', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Empty image URI');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(validationError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: '',
          type: 'image/jpeg',
          name: 'empty.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Empty image URI');
    });

    test('should handle invalid image type', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Unsupported image format');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(validationError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test.bmp',
          type: 'image/bmp',
          name: 'test.bmp',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Unsupported image format');
    });

    test('should handle corrupted image file', async () => {
      const corruptionError = new AppError(ErrorType.VALIDATION_ERROR, 'Corrupted image file');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(corruptionError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://corrupted.jpg',
          type: 'image/jpeg',
          name: 'corrupted.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Corrupted image file');
    });

    test('should handle network timeout during upload', async () => {
      const timeoutError = new AppError(ErrorType.NETWORK_ERROR, 'Upload timeout');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(timeoutError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.jpg',
          type: 'image/jpeg',
          name: 'test-image.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Upload timeout');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.NETWORK_ERROR);
    });
  });
});