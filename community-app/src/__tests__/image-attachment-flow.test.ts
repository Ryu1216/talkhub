/**
 * Image Attachment Flow Integration Tests
 * 
 * This test suite covers the complete image attachment flow integration
 * including image selection, upload, and post creation with images.
 * 
 * Requirements covered:
 * - 3.1: Image selection from gallery/camera
 * - 3.2: Image preview and validation
 * - 3.3: Image upload to Firebase Storage
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

describe('Image Attachment Flow Integration Tests', () => {
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

  describe('Successful Image Upload Flow', () => {
    test('should complete full image upload and post creation flow', async () => {
      // Mock successful image upload
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockImageUploadResult);
      
      // Mock successful post creation
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

    test('should handle multiple image upload attempts', async () => {
      mockImageUploadService.uploadImageFromUri
        .mockResolvedValueOnce(mockImageUploadResult)
        .mockResolvedValueOnce({
          ...mockImageUploadResult,
          url: 'https://firebase.storage.com/test-image-2.jpg',
        });

      mockPostsService.createPost
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce({
          ...mockPost,
          id: 'test-post-456',
          imageUrl: 'https://firebase.storage.com/test-image-2.jpg',
        });

      const postData1: CreatePostData = {
        title: 'Test Post 1',
        content: 'Test Content 1',
        image: {
          uri: 'file://test-image-1.jpg',
          type: 'image/jpeg',
          name: 'test-image-1.jpg',
        },
      };

      const postData2: CreatePostData = {
        title: 'Test Post 2',
        content: 'Test Content 2',
        image: {
          uri: 'file://test-image-2.jpg',
          type: 'image/jpeg',
          name: 'test-image-2.jpg',
        },
      };

      const { createPost } = usePostsStore.getState();
      
      await createPost(postData1);
      await createPost(postData2);

      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalledTimes(2);
      expect(mockPostsService.createPost).toHaveBeenCalledTimes(2);

      const { posts } = usePostsStore.getState();
      expect(posts).toHaveLength(2);
    });
  });

  describe('Image Upload Error Scenarios', () => {
    test('should handle image upload failure', async () => {
      const uploadError = new AppError(ErrorType.NETWORK_ERROR, 'Image upload failed');
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(uploadError);

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

      // Verify post creation was not called
      expect(mockPostsService.createPost).not.toHaveBeenCalled();

      // Verify error state
      const { error, loading, posts } = usePostsStore.getState();
      expect(error).toEqual(uploadError);
      expect(loading).toBe(false);
      expect(posts).toHaveLength(0);
    });

    test('should handle post creation failure after successful image upload', async () => {
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
      
      await expect(createPost(postData)).rejects.toThrow();

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
  });

  describe('Image Upload Progress and Optimization', () => {
    test('should pass correct compression options to image upload service', async () => {
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

    test('should handle different image formats', async () => {
      const pngImageResult = {
        ...mockImageUploadResult,
        url: 'https://firebase.storage.com/test-image.png',
      };

      mockImageUploadService.uploadImageFromUri.mockResolvedValue(pngImageResult);
      mockPostsService.createPost.mockResolvedValue({
        ...mockPost,
        imageUrl: pngImageResult.url,
      });

      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test Content',
        image: {
          uri: 'file://test-image.png',
          type: 'image/png',
          name: 'test-image.png',
        },
      };

      const { createPost } = usePostsStore.getState();
      await createPost(postData);

      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalledWith(
        'file://test-image.png',
        mockUser.uid,
        expect.any(Object)
      );

      const { posts } = usePostsStore.getState();
      expect(posts[0].imageUrl).toBe(pngImageResult.url);
    });
  });

  describe('Concurrent Upload Scenarios', () => {
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
});