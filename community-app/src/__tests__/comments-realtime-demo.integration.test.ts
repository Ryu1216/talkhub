import { useCommentsStore } from '../stores/commentsStore';
import { commentsService } from '../services/commentsService';
import { Comment } from '../types';
import { Timestamp } from 'firebase/firestore';

// Mock the comments service
jest.mock('../services/commentsService');
const mockCommentsService = commentsService as jest.Mocked<typeof commentsService>;

// Mock the auth store
jest.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    })
  }
}));

describe('Comments Real-time Integration Demo', () => {
  const mockPostId = 'demo-post-id';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store state
    useCommentsStore.getState().reset();
  });

  it('should demonstrate complete real-time comment flow', async () => {
    let realtimeCallback: (comments: Comment[]) => void;
    const mockUnsubscribe = jest.fn();
    
    // Mock the subscription setup
    mockCommentsService.subscribeToComments.mockImplementation((postId, callback, onError) => {
      realtimeCallback = callback;
      return mockUnsubscribe;
    });

    const { subscribeToComments, createComment, comments } = useCommentsStore.getState();
    
    // Step 1: Set up real-time subscription
    subscribeToComments(mockPostId);
    
    // Verify subscription was created
    expect(mockCommentsService.subscribeToComments).toHaveBeenCalledWith(
      mockPostId,
      expect.any(Function),
      expect.any(Function)
    );

    // Step 2: Simulate initial empty state
    realtimeCallback!([]);
    expect(comments[mockPostId]).toEqual([]);

    // Step 3: Simulate another user adding a comment (real-time update)
    const otherUserComment: Comment = {
      id: 'comment-1',
      postId: mockPostId,
      content: 'Hello from another user!',
      authorId: 'other-user-id',
      authorName: 'Other User',
      createdAt: Timestamp.now()
    };

    realtimeCallback!([otherUserComment]);
    expect(comments[mockPostId]).toEqual([otherUserComment]);

    // Step 4: Current user adds a comment
    const newComment: Comment = {
      id: 'comment-2',
      postId: mockPostId,
      content: 'My response!',
      authorId: 'test-user-id',
      authorName: 'Test User',
      createdAt: Timestamp.now()
    };

    mockCommentsService.createComment.mockResolvedValue(newComment);
    
    await createComment({
      postId: mockPostId,
      content: 'My response!'
    });

    // Verify comment was created via service
    expect(mockCommentsService.createComment).toHaveBeenCalledWith(
      { postId: mockPostId, content: 'My response!' },
      'test-user-id',
      'Test User'
    );

    // Step 5: Simulate real-time update with both comments
    const allComments = [otherUserComment, newComment];
    realtimeCallback!(allComments);
    
    // Verify both comments are now in the store
    expect(comments[mockPostId]).toEqual(allComments);

    // Step 6: Simulate another real-time update (someone else added another comment)
    const thirdComment: Comment = {
      id: 'comment-3',
      postId: mockPostId,
      content: 'Great discussion!',
      authorId: 'third-user-id',
      authorName: 'Third User',
      createdAt: Timestamp.now()
    };

    const finalComments = [otherUserComment, newComment, thirdComment];
    realtimeCallback!(finalComments);
    
    // Verify all comments are synchronized
    expect(comments[mockPostId]).toEqual(finalComments);
    expect(comments[mockPostId]).toHaveLength(3);
  });

  it('should handle permission errors during comment creation', async () => {
    const { createComment, error } = useCommentsStore.getState();
    
    // Mock permission error
    const permissionError = new Error('Permission denied');
    permissionError.name = 'PermissionError';
    mockCommentsService.createComment.mockRejectedValue(permissionError);

    await createComment({
      postId: mockPostId,
      content: 'This should fail'
    });

    // Verify error was captured
    expect(error).toBeTruthy();
    expect(error?.message).toContain('Permission denied');
  });

  it('should maintain real-time connection state', () => {
    const mockUnsubscribe = jest.fn();
    mockCommentsService.subscribeToComments.mockReturnValue(mockUnsubscribe);

    const { subscribeToComments, unsubscribeFromComments, subscriptions } = useCommentsStore.getState();
    
    // Subscribe
    subscribeToComments(mockPostId);
    expect(subscriptions[mockPostId]).toBe(mockUnsubscribe);

    // Unsubscribe
    unsubscribeFromComments(mockPostId);
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(subscriptions[mockPostId]).toBeUndefined();
  });
});