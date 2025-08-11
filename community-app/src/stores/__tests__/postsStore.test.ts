import { renderHook, act } from '@testing-library/react-native';
import { usePostsStore } from '../postsStore';
import { useAuthStore } from '../authStore';
import { postsService } from '../../services/postsService';
import { AppError, ErrorType } from '../../types/error';
import { Timestamp } from 'firebase/firestore';

// Mock the services
jest.mock('../../services/postsService');
jest.mock('../authStore');

const mockPostsService = postsService as jest.Mocked<typeof postsService>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('PostsStore', () => {
  const mockPost = {
    id: 'post1',
    title: 'Test Post',
    content: 'Test content',
    authorId: 'user1',
    authorName: 'Test User',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    commentCount: 0,
  };

  const mockUser = {
    uid: 'user1',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth store state
    mockUseAuthStore.getState = jest.fn().mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    // Reset store state
    const { result } = renderHook(() => usePostsStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('fetchPosts', () => {
    it('should fetch posts successfully', async () => {
      const mockResult = {
        posts: [mockPost],
        lastDoc: { id: 'doc1' } as any,
      };
      
      mockPostsService.getPosts.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePostsStore());

      await act(async () => {
        await result.current.fetchPosts();
      });

      expect(result.current.posts).toEqual([mockPost]);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch posts error', async () => {
      const mockError = new AppError(ErrorType.NETWORK_ERROR, 'Network error');
      mockPostsService.getPosts.mockRejectedValue(mockError);

      const { result } = renderHook(() => usePostsStore());

      await act(async () => {
        await result.current.fetchPosts();
      });

      expect(result.current.posts).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });

    it('should refresh posts when refresh=true', async () => {
      const mockResult = {
        posts: [mockPost],
        lastDoc: null,
      };
      
      mockPostsService.getPosts.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePostsStore());

      // Set some initial state
      act(() => {
        result.current.setPosts([{ ...mockPost, id: 'old-post' }]);
        result.current.setLastVisible({ id: 'old-doc' });
      });

      await act(async () => {
        await result.current.fetchPosts(true);
      });

      expect(result.current.posts).toEqual([mockPost]);
      expect(result.current.hasMore).toBe(false);
      expect(mockPostsService.getPosts).toHaveBeenCalledWith(10, undefined);
    });
  });

  describe('fetchPost', () => {
    it('should fetch single post successfully', async () => {
      mockPostsService.getPost.mockResolvedValue(mockPost);

      const { result } = renderHook(() => usePostsStore());

      await act(async () => {
        await result.current.fetchPost('post1');
      });

      expect(result.current.currentPost).toEqual(mockPost);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle post not found', async () => {
      mockPostsService.getPost.mockResolvedValue(null);

      const { result } = renderHook(() => usePostsStore());

      await act(async () => {
        await result.current.fetchPost('nonexistent');
      });

      expect(result.current.currentPost).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error?.message).toBe('Post not found');
    });
  });

  describe('createPost', () => {
    it('should create post successfully', async () => {
      const createData = {
        title: 'New Post',
        content: 'New content',
      };

      mockPostsService.createPost.mockResolvedValue(mockPost);

      const { result } = renderHook(() => usePostsStore());

      await act(async () => {
        await result.current.createPost(createData);
      });

      expect(result.current.posts).toContain(mockPost);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle unauthenticated user', async () => {
      mockUseAuthStore.getState = jest.fn().mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => usePostsStore());

      await act(async () => {
        await result.current.createPost({
          title: 'Test',
          content: 'Test',
        });
      });

      expect(result.current.error?.type).toBe(ErrorType.AUTH_ERROR);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('store actions', () => {
    it('should add post to beginning of list', () => {
      const { result } = renderHook(() => usePostsStore());

      act(() => {
        result.current.setPosts([{ ...mockPost, id: 'existing' }]);
        result.current.addPost(mockPost);
      });

      expect(result.current.posts[0]).toEqual(mockPost);
      expect(result.current.posts).toHaveLength(2);
    });

    it('should update post correctly', () => {
      const { result } = renderHook(() => usePostsStore());

      act(() => {
        result.current.setPosts([mockPost]);
        result.current.setCurrentPost(mockPost);
        result.current.updatePost('post1', { title: 'Updated Title' });
      });

      expect(result.current.posts[0].title).toBe('Updated Title');
      expect(result.current.currentPost?.title).toBe('Updated Title');
    });

    it('should clear error', () => {
      const { result } = renderHook(() => usePostsStore());

      act(() => {
        result.current.setError(new AppError(ErrorType.UNKNOWN_ERROR, 'Test error'));
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});