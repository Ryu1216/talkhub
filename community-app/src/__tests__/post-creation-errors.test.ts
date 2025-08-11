/**
 * Post Creation Error Scenarios Tests
 * 
 * This test suite covers various error scenarios during post creation
 * including validation errors, network errors, and permission errors.
 * 
 * Requirements covered:
 * - 2.1: Post creation validation
 * - 2.2: Post creation error handling
 * - 3.3: Image upload error handling
 */

import { usePostsStore } from '../stores/postsStore';
import { useAuthStore } from '../stores/authStore';
import { imageUploadService } from '../services/imageUploadService';
import { postsService } from '../services/postsService';
import { AppError, ErrorType, CreatePostData } from '../types';
import { Timestamp } from 'firebase/firestore';

// Mock services
jest.mock('../services/imageUploadService', () => ({
  imageUploadService: {
    uploadImageFromUri: jest.fn(),
    deleteImage: jest.fn(),
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
      
      await expect(createPost(postData)).rejects.toThrow();

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

      // Verify error state
      const { error, loading, posts } = usePostsStore.getState();
      expect(error).toEqual(networkError);
      expect(loading).toBe(false);
      expect(posts).toHaveLength(0);
    });

    test('should handle image upload validation error', async () => {
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

    test('should handle image upload permission error', async () => {
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

  describe('Post Creation Error Scenarios', () => {
    test('should handle post creation network error', async () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Failed to connect to database');
      mockPostsService.createPost.mockRejectedValue(networkError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Failed to connect to database');

      const { error, posts } = usePostsStore.getState();
      expect(error).toEqual(networkError);
      expect(posts).toHaveLength(0);
    });

    test('should handle post creation permission error', async () => {
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

    test('should handle post creation validation error', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Post content violates community guidelines');
      mockPostsService.createPost.mockRejectedValue(validationError);

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Inappropriate content',
      };

      const { createPost } = usePostsStore.getState();
      
      await expect(createPost(postData)).rejects.toThrow('Post content violates community guidelines');

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });

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
  });

  describe('Rollback Error Scenarios', () => {
    test('should handle successful rollback after post creation failure', async () => {
      const imageUploadResult = {
        url: 'https://firebase.storage.com/test-image.jpg',
        path: 'posts/test-user-123/test-image.jpg',
        originalUri: 'file://test-image.jpg',
      };

      mockImageUploadService.uploadImageFromUri.mockResolvedValue(imageUploadResult);
      
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
      expect(mockImageUploadService.deleteImage).toHaveBeenCalledWith(imageUploadResult.url);

      // Verify original error is preserved
      const { error } = usePostsStore.getState();
      expect(error).toEqual(postError);
    });

    test('should handle rollback failure without masking original error', async () => {
      const imageUploadResult = {
        url: 'https://firebase.storage.com/test-image.jpg',
        path: 'posts/test-user-123/test-image.jpg',
        originalUri: 'file://test-image.jpg',
      };

      mockImageUploadService.uploadImageFromUri.mockResolvedValue(imageUploadResult);
      
      const postError = new AppError(ErrorType.PERMISSION_ERROR, 'Post creation failed');
      mockPostsService.createPost.mockRejectedValue(postError);
      
      const rollbackError = new AppError(ErrorType.NETWORK_ERROR, 'Failed to delete uploaded image');
      mockImageUploadService.deleteImage.mockRejectedValue(rollbackError);

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
    });

    test('should handle rollback network error', async () => {
      const imageUploadResult = {
        url: 'https://firebase.storage.com/test-image.jpg',
        path: 'posts/test-user-123/test-image.jpg',
        originalUri: 'file://test-image.jpg',
      };

      mockImageUploadService.uploadImageFromUri.mockResolvedValue(imageUploadResult);
      
      const postError = new AppError(ErrorType.UNKNOWN_ERROR, 'Unexpected post creation error');
      mockPostsService.createPost.mockRejectedValue(postError);
      
      const rollbackNetworkError = new AppError(ErrorType.NETWORK_ERROR, 'Network error during rollback');
      mockImageUploadService.deleteImage.mockRejectedValue(rollbackNetworkError);

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

      const { error } = usePostsStore.getState();
      expect(error?.type).toBe(ErrorType.UNKNOWN_ERROR);
    });
  });

  describe('Concurrent Error Scenarios', () => {
    test('should handle multiple concurrent post creation failures', async () => {
      const error1 = new AppError(ErrorType.NETWORK_ERROR, 'Network error 1');
      const error2 = new AppError(ErrorType.PERMISSION_ERROR, 'Permission error 2');

      mockPostsService.createPost
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2);

      const postData1: CreatePostData = {
        title: 'Test Post 1',
        content: 'Test Content 1',
      };

      const postData2: CreatePostData = {
        title: 'Test Post 2',
        content: 'Test Content 2',
      };

      const { createPost } = usePostsStore.getState();

      const [result1, result2] = await Promise.allSettled([
        createPost(postData1),
        createPost(postData2),
      ]);

      expect(result1.status).toBe('rejected');
      expect(result2.status).toBe('rejected');

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
  });

  describe('Loading State Error Scenarios', () => {
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

    test('should handle rapid error scenarios', async () => {
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
  });

  describe('Error Recovery Scenarios', () => {
    test('should allow successful post creation after error', async () => {
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

    test('should clear error state on successful operation', async () => {
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
});