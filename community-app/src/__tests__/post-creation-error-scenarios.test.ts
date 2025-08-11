/**
 * Post Creation Error Scenarios Tests
 * 
 * This test suite covers comprehensive error scenarios during post creation
 * including validation errors, network errors, permission errors, and edge cases.
 * 
 * Requirements covered:
 * - 2.1: Post creation validation and error handling
 * - 2.2: Post creation service error handling
 * - 3.3: Image upload error handling and rollback scenarios
 */

import { usePostsStore } from '../stores/postsStore';
import { useAuthStore } from '../stores/authStore';
import { imageUploadService } from '../services/imageUploadService';
import { postsService } from '../services/postsService';
import { AppError, ErrorType, CreatePostData } from '../types';
import { Timestamp } from 'firebase/firestore';
import { ERROR_MESSAGES, APP_CONSTANTS } from '../constants';

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

const mockImageUploadService = imageUploadService as jest.Mocked<typeof imageUploadService>;
const mockPostsService = postsService as jest.Mocked<typeof postsService>;

describe('Post Creation Error Scenarios Tests', () => {
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
  };

  beforeEach(() => {
    // Reset stores
    usePostsStore.getState().reset();
    useAuthStore.getState().reset();
    
    // Set authenticated user
    useAuthStore.setState({ user: mockUser });
    
    jest.clearAllMocks();
  });

  describe('Authentication Error Scenarios', () => {
    test('should handle unauthenticated user error', async () => {
      // Clear authenticated user
      useAuthStore.setState({ user: null });

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('You must be logged in to create a post');

      // Verify no services were called
      expect(mockImageUploadService.uploadImageFromUri).not.toHaveBeenCalled();
      expect(mockPostsService.createPost).not.toHaveBeenCalled();

      // Verify auth error state
      const { error, loading } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.AUTH_ERROR);
      expect(error?.message).toBe('You must be logged in to create a post');
      expect(loading).toBe(false);
    });

    test('should handle user without display name', async () => {
      const userWithoutDisplayName = {
        ...mockUser,
        displayName: undefined,
      };
      useAuthStore.setState({ user: userWithoutDisplayName });

      const mockPost = {
        id: 'test-post-123',
        title: 'Test Post',
        content: 'Test Content',
        authorId: mockUser.uid,
        authorName: mockUser.email, // Should fallback to email
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        commentCount: 0,
      };

      mockPostsService.createPost.mockResolvedValue(mockPost);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      await createPost(postData);

      // Verify post creation was called with email as author name
      expect(mockPostsService.createPost).toHaveBeenCalledWith(
        expect.any(Object),
        mockUser.uid,
        mockUser.email
      );
    });

    test('should handle expired authentication token', async () => {
      const authError = new AppError(ErrorType.AUTH_ERROR, 'Authentication token expired');
      mockPostsService.createPost.mockRejectedValue(authError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Authentication token expired');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.AUTH_ERROR);
    });
  });

  describe('Network Error Scenarios', () => {
    test('should handle network connection failure', async () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Network connection failed');
      mockPostsService.createPost.mockRejectedValue(networkError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Network connection failed');

      const { error, posts } = usePostsStore.getState();
      expect(error).toEqual(networkError);
      expect(posts).toHaveLength(0);
    });

    test('should handle database connection timeout', async () => {
      const timeoutError = new AppError(ErrorType.NETWORK_ERROR, 'Database connection timeout');
      mockPostsService.createPost.mockRejectedValue(timeoutError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Database connection timeout');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.NETWORK_ERROR);
    });

    test('should handle intermittent network issues', async () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Intermittent network failure');
      
      // First attempt fails
      mockPostsService.createPost.mockRejectedValueOnce(networkError);
      
      // Second attempt succeeds
      const mockPost = {
        id: 'test-post-123',
        title: 'Test Post',
        content: 'Test Content',
        authorId: mockUser.uid,
        authorName: mockUser.displayName!,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        commentCount: 0,
      };
      mockPostsService.createPost.mockResolvedValueOnce(mockPost);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      // First attempt should fail
      await expect(createPost(postData)).rejects.toThrow('Intermittent network failure');
      
      // Second attempt should succeed
      await createPost(postData);

      const { posts, error } = usePostsStore.getState();
      expect(posts).toHaveLength(1);
      expect(error).toBeNull();
    });

    test('should handle service unavailable error', async () => {
      const serviceError = new AppError(ErrorType.NETWORK_ERROR, 'Service temporarily unavailable');
      mockPostsService.createPost.mockRejectedValue(serviceError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Service temporarily unavailable');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.NETWORK_ERROR);
    });
  });

  describe('Permission Error Scenarios', () => {
    test('should handle insufficient write permissions', async () => {
      const permissionError = new AppError(ErrorType.PERMISSION_ERROR, 'User does not have write permissions');
      mockPostsService.createPost.mockRejectedValue(permissionError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('User does not have write permissions');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.PERMISSION_ERROR);
    });

    test('should handle storage quota exceeded', async () => {
      const quotaError = new AppError(ErrorType.PERMISSION_ERROR, 'Storage quota exceeded');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(quotaError);

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
      
      await expect(createPost(postData)).rejects.toThrow('Storage quota exceeded');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.PERMISSION_ERROR);
    });

    test('should handle account suspended error', async () => {
      const suspendedError = new AppError(ErrorType.PERMISSION_ERROR, 'Account has been suspended');
      mockPostsService.createPost.mockRejectedValue(suspendedError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Account has been suspended');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.PERMISSION_ERROR);
    });

    test('should handle rate limiting error', async () => {
      const rateLimitError = new AppError(ErrorType.PERMISSION_ERROR, 'Rate limit exceeded. Please try again later');
      mockPostsService.createPost.mockRejectedValue(rateLimitError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Rate limit exceeded. Please try again later');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.PERMISSION_ERROR);
    });
  });

  describe('Validation Error Scenarios', () => {
    test('should handle content policy violation', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Post content violates community guidelines');
      mockPostsService.createPost.mockRejectedValue(validationError);

      const postData: CreatePostData = {
        title: 'Inappropriate Title',
        content: 'Inappropriate content that violates guidelines',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Post content violates community guidelines');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });

    test('should handle spam detection error', async () => {
      const spamError = new AppError(ErrorType.VALIDATION_ERROR, 'Post detected as spam');
      mockPostsService.createPost.mockRejectedValue(spamError);

      const postData: CreatePostData = {
        title: 'Spam Title',
        content: 'Spam content repeated multiple times',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Post detected as spam');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });

    test('should handle duplicate post error', async () => {
      const duplicateError = new AppError(ErrorType.VALIDATION_ERROR, 'Duplicate post detected');
      mockPostsService.createPost.mockRejectedValue(duplicateError);

      const postData: CreatePostData = {
        title: 'Duplicate Post',
        content: 'This exact content was already posted',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Duplicate post detected');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });

    test('should handle malformed data error', async () => {
      const malformedError = new AppError(ErrorType.VALIDATION_ERROR, 'Malformed post data');
      mockPostsService.createPost.mockRejectedValue(malformedError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Malformed post data');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });
  });

  describe('Image Upload Error Scenarios', () => {
    test('should handle image file too large error', async () => {
      const fileSizeError = new AppError(ErrorType.VALIDATION_ERROR, 'Image file too large');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(fileSizeError);

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

    test('should handle unsupported image format error', async () => {
      const formatError = new AppError(ErrorType.VALIDATION_ERROR, 'Unsupported image format');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(formatError);

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

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });

    test('should handle corrupted image file error', async () => {
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

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });

    test('should handle image upload network error', async () => {
      const uploadNetworkError = new AppError(ErrorType.NETWORK_ERROR, 'Image upload network error');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(uploadNetworkError);

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
      
      await expect(createPost(postData)).rejects.toThrow('Image upload network error');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.NETWORK_ERROR);
    });
  });

  describe('Rollback Error Scenarios', () => {
    test('should handle successful rollback after post creation failure', async () => {
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockImageUploadResult);
      
      const postError = new AppError(ErrorType.NETWORK_ERROR, 'Post creation failed');
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

      // Verify rollback was attempted
      expect(mockImageUploadService.deleteImage).toHaveBeenCalledWith(mockImageUploadResult.url);

      // Verify original error is preserved
      const { error } = usePostsStore.getState();
      expect(error).toEqual(postError);
    });

    test('should handle rollback failure without masking original error', async () => {
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockImageUploadResult);
      
      const postError = new AppError(ErrorType.PERMISSION_ERROR, 'Post creation failed');
      mockPostsService.createPost.mockRejectedValue(postError);
      
      const rollbackError = new AppError(ErrorType.NETWORK_ERROR, 'Failed to delete uploaded image');
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
      
      // Should throw original error, not rollback error
      await expect(createPost(postData)).rejects.toThrow('Post creation failed');

      // Verify rollback was attempted
      expect(mockImageUploadService.deleteImage).toHaveBeenCalled();

      // Verify original error is preserved, not rollback error
      const { error } = usePostsStore.getState();
      expect(error).toEqual(postError);
      expect(error?.message).toBe('Post creation failed');

      // Verify rollback error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to rollback uploaded image:', rollbackError);

      consoleSpy.mockRestore();
    });

    test('should handle multiple rollback attempts', async () => {
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockImageUploadResult);
      
      const postError = new AppError(ErrorType.UNKNOWN_ERROR, 'Unexpected post creation error');
      mockPostsService.createPost.mockRejectedValue(postError);
      
      // First rollback attempt fails
      const rollbackError1 = new AppError(ErrorType.NETWORK_ERROR, 'First rollback failed');
      mockImageUploadService.deleteImage.mockRejectedValueOnce(rollbackError1);

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
      
      await expect(createPost(postData)).rejects.toThrow('Unexpected post creation error');

      // Verify rollback was attempted
      expect(mockImageUploadService.deleteImage).toHaveBeenCalledTimes(1);

      // Verify original error is preserved
      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.UNKNOWN_ERROR);

      consoleSpy.mockRestore();
    });

    test('should handle rollback permission error', async () => {
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockImageUploadResult);
      
      const postError = new AppError(ErrorType.VALIDATION_ERROR, 'Post validation failed');
      mockPostsService.createPost.mockRejectedValue(postError);
      
      const rollbackPermissionError = new AppError(ErrorType.PERMISSION_ERROR, 'Permission denied for rollback');
      mockImageUploadService.deleteImage.mockRejectedValue(rollbackPermissionError);

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
      
      await expect(createPost(postData)).rejects.toThrow('Post validation failed');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.VALIDATION_ERROR);

      consoleSpy.mockRestore();
    });
  });

  describe('Concurrent Error Scenarios', () => {
    test('should handle multiple concurrent post creation failures', async () => {
      const error1 = new AppError(ErrorType.NETWORK_ERROR, 'Network error 1');
      const error2 = new AppError(ErrorType.PERMISSION_ERROR, 'Permission error 2');
      const error3 = new AppError(ErrorType.VALIDATION_ERROR, 'Validation error 3');

      mockPostsService.createPost
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockRejectedValueOnce(error3);

      const postData1: CreatePostData = {
        title: 'Test Post 1',
        content: 'Test Content 1',
      };

      const postData2: CreatePostData = {
        title: 'Test Post 2',
        content: 'Test Content 2',
      };

      const postData3: CreatePostData = {
        title: 'Test Post 3',
        content: 'Test Content 3',
      };

      const { createPost } = usePostsStore.getState();

      const [result1, result2, result3] = await Promise.allSettled([
        createPost(postData1),
        createPost(postData2),
        createPost(postData3),
      ]);

      expect(result1.status).toBe('rejected');
      expect(result2.status).toBe('rejected');
      expect(result3.status).toBe('rejected');

      // Store should contain the last error
      const { error, posts } = usePostsStore.getState();
      expect(error).toBeTruthy();
      expect(posts).toHaveLength(0);
    });

    test('should handle mixed success and failure scenarios', async () => {
      const successPost = {
        id: 'success-post',
        title: 'Success Post',
        content: 'Success Content',
        authorId: mockUser.uid,
        authorName: mockUser.displayName!,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        commentCount: 0,
      };

      const failureError = new AppError(ErrorType.VALIDATION_ERROR, 'Validation failed');

      mockPostsService.createPost
        .mockResolvedValueOnce(successPost)
        .mockRejectedValueOnce(failureError);

      const successData: CreatePostData = {
        title: 'Success Post',
        content: 'Success Content',
      };

      const failData: CreatePostData = {
        title: 'Fail Post',
        content: 'Fail Content',
      };

      const { createPost } = usePostsStore.getState();

      const [successResult, failResult] = await Promise.allSettled([
        createPost(successData),
        createPost(failData),
      ]);

      expect(successResult.status).toBe('fulfilled');
      expect(failResult.status).toBe('rejected');

      // Store should contain the successful post
      const { posts, error } = usePostsStore.getState();
      expect(posts).toHaveLength(1);
      expect(posts[0].id).toBe('success-post');
      expect(error).toEqual(failureError); // Last error should be stored
    });

    test('should handle rapid error recovery scenarios', async () => {
      const initialError = new AppError(ErrorType.NETWORK_ERROR, 'Network error');
      const successPost = {
        id: 'recovery-post',
        title: 'Recovery Post',
        content: 'Recovery Content',
        authorId: mockUser.uid,
        authorName: mockUser.displayName!,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        commentCount: 0,
      };

      mockPostsService.createPost
        .mockRejectedValueOnce(initialError)
        .mockResolvedValueOnce(successPost);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();

      // First attempt should fail
      await expect(createPost(postData)).rejects.toThrow();
      expect(usePostsStore.getState().error).toEqual(initialError);

      // Second attempt should succeed
      await createPost(postData);

      const { posts, error, loading } = usePostsStore.getState();
      expect(posts).toHaveLength(1);
      expect(posts[0].id).toBe('recovery-post');
      expect(error).toBeNull();
      expect(loading).toBe(false);
    });
  });

  describe('Loading State Error Management', () => {
    test('should properly manage loading state during errors', async () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Network error');
      mockPostsService.createPost.mockRejectedValue(networkError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();

      // Check initial state
      expect(usePostsStore.getState().loading).toBe(false);

      const createPromise = createPost(postData);

      // Check loading state during operation
      expect(usePostsStore.getState().loading).toBe(true);

      await expect(createPromise).rejects.toThrow();

      // Check final state
      const { loading, error } = usePostsStore.getState();
      expect(loading).toBe(false);
      expect(error).toEqual(networkError);
    });

    test('should handle rapid error scenarios without state corruption', async () => {
      const error1 = new AppError(ErrorType.NETWORK_ERROR, 'First error');
      const error2 = new AppError(ErrorType.PERMISSION_ERROR, 'Second error');

      mockPostsService.createPost
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();

      // Rapid fire requests
      const promise1 = createPost(postData);
      const promise2 = createPost(postData);

      await expect(promise1).rejects.toThrow();
      await expect(promise2).rejects.toThrow();

      const { loading, error } = usePostsStore.getState();
      expect(loading).toBe(false);
      expect(error).toBeTruthy();
    });

    test('should clear error state on successful operation after failure', async () => {
      // Set initial error state
      usePostsStore.setState({ 
        error: new AppError(ErrorType.NETWORK_ERROR, 'Previous error'),
        loading: false 
      });

      const successPost = {
        id: 'success-post',
        title: 'Success Post',
        content: 'Success Content',
        authorId: mockUser.uid,
        authorName: mockUser.displayName!,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        commentCount: 0,
      };

      mockPostsService.createPost.mockResolvedValue(successPost);

      const postData: CreatePostData = {
        title: 'Success Post',
        content: 'Success Content',
      };

      const { createPost } = usePostsStore.getState();
      await createPost(postData);

      const { error } = usePostsStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('Unknown Error Scenarios', () => {
    test('should handle unknown post creation error', async () => {
      const unknownError = new Error('Database connection timeout');
      mockPostsService.createPost.mockRejectedValue(unknownError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow();

      const { error } = usePostsStore.getState();
      expect(error).toBeTruthy();
    });

    test('should handle JavaScript runtime errors', async () => {
      const runtimeError = new TypeError('Cannot read property of undefined');
      mockPostsService.createPost.mockRejectedValue(runtimeError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow();

      const { error } = usePostsStore.getState();
      expect(error).toBeTruthy();
    });

    test('should handle unexpected service responses', async () => {
      // Mock service returning null instead of expected post object
      mockPostsService.createPost.mockResolvedValue(null as any);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      // The store should handle null response and add it to posts array
      await createPost(postData);
      
      const { posts } = usePostsStore.getState();
      expect(posts).toHaveLength(1);
      expect(posts[0]).toBeNull();
    });
  });
});