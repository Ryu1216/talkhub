import { useCommentsStore } from '../../../stores/commentsStore';
import { commentsService } from '../../../services/commentsService';
import { Comment } from '../../../types';
import { Timestamp } from 'firebase/firestore';
import { waitFor } from '@testing-library/react-native';

// Mock the comments service
jest.mock('../../../services/commentsService');
const mockCommentsService = commentsService as jest.Mocked<typeof commentsService>;

// Mock the auth store
jest.mock('../../../stores/authStore', () => ({
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

describe('Comments Real-time Updates', () => {
  const mockPostId = 'test-post-id';
  const mockComment: Comment = {
    id: 'comment-1',
    postId: mockPostId,
    content: 'Test comment',
    authorId: 'test-user-id',
    authorName: 'Test User',
    createdAt: Timestamp.now()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store state
    useCommentsStore.getState().reset();
  });

  it('should set up real-time subscription when subscribeToComments is called', () => {
    const mockUnsubscribe = jest.fn();
    mockCommentsService.subscribeToComments.mockReturnValue(mockUnsubscribe);

    const { subscribeToComments } = useCommentsStore.getState();
    
    // Subscribe to comments
    subscribeToComments(mockPostId);

    // Verify that the service method was called
    expect(mockCommentsService.subscribeToComments).toHaveBeenCalledWith(
      mockPostId,
      expect.any(Function),
      expect.any(Function)
    );

    // Verify that the unsubscribe function is stored
    const { subscriptions } = useCommentsStore.getState();
    expect(subscriptions[mockPostId]).toBe(mockUnsubscribe);
  });

  it('should update comments when real-time data is received', async () => {
    let realtimeCallback: (comments: Comment[]) => void;
    
    mockCommentsService.subscribeToComments.mockImplementation((postId, callback, onError) => {
      realtimeCallback = callback;
      return jest.fn();
    });

    const { subscribeToComments } = useCommentsStore.getState();
    
    // Subscribe to comments
    subscribeToComments(mockPostId);

    // Simulate real-time update
    const updatedComments = [mockComment];
    realtimeCallback!(updatedComments);

    // Wait for state update
    await waitFor(() => {
      const { comments } = useCommentsStore.getState();
      expect(comments[mockPostId]).toEqual(updatedComments);
    });
  });

  it('should unsubscribe when unsubscribeFromComments is called', () => {
    const mockUnsubscribe = jest.fn();
    mockCommentsService.subscribeToComments.mockReturnValue(mockUnsubscribe);

    const { subscribeToComments, unsubscribeFromComments } = useCommentsStore.getState();
    
    // Subscribe first
    subscribeToComments(mockPostId);
    
    // Then unsubscribe
    unsubscribeFromComments(mockPostId);

    // Verify unsubscribe was called
    expect(mockUnsubscribe).toHaveBeenCalled();

    // Verify subscription is removed from state
    const { subscriptions } = useCommentsStore.getState();
    expect(subscriptions[mockPostId]).toBeUndefined();
  });

  it('should replace existing subscription when subscribing to same post', () => {
    const mockUnsubscribe1 = jest.fn();
    const mockUnsubscribe2 = jest.fn();
    
    mockCommentsService.subscribeToComments
      .mockReturnValueOnce(mockUnsubscribe1)
      .mockReturnValueOnce(mockUnsubscribe2);

    const { subscribeToComments } = useCommentsStore.getState();
    
    // Subscribe first time
    subscribeToComments(mockPostId);
    
    // Subscribe again to same post
    subscribeToComments(mockPostId);

    // Verify first subscription was unsubscribed
    expect(mockUnsubscribe1).toHaveBeenCalled();
    
    // Verify new subscription is stored
    const { subscriptions } = useCommentsStore.getState();
    expect(subscriptions[mockPostId]).toBe(mockUnsubscribe2);
  });

  it('should handle comment creation with real-time updates', async () => {
    const mockNewComment: Comment = {
      id: 'new-comment',
      postId: mockPostId,
      content: 'New comment',
      authorId: 'test-user-id',
      authorName: 'Test User',
      createdAt: Timestamp.now()
    };

    mockCommentsService.createComment.mockResolvedValue(mockNewComment);

    const { createComment } = useCommentsStore.getState();
    
    // Create a comment
    await createComment({
      postId: mockPostId,
      content: 'New comment'
    });

    // Verify comment was added to local state
    await waitFor(() => {
      const { comments } = useCommentsStore.getState();
      expect(comments[mockPostId]).toContainEqual(mockNewComment);
    });
  });

  it('should handle authentication error when creating comment', async () => {
    // Mock unauthenticated state by temporarily overriding the auth store
    const originalAuthStore = require('../../../stores/authStore');
    jest.doMock('../../../stores/authStore', () => ({
      useAuthStore: {
        getState: () => ({
          user: null
        })
      }
    }));

    // Re-import the comments store to get the updated auth store reference
    jest.resetModules();
    const { useCommentsStore: freshCommentsStore } = require('../../../stores/commentsStore');
    
    const { createComment } = freshCommentsStore.getState();
    
    // Try to create a comment without authentication
    await createComment({
      postId: mockPostId,
      content: 'New comment'
    });

    // Verify error was set
    const { error } = freshCommentsStore.getState();
    expect(error?.message).toBe('You must be logged in to comment');
    
    // Restore original mock
    jest.doMock('../../../stores/authStore', () => originalAuthStore);
  });

  it('should handle real-time subscription errors', async () => {
    let errorCallback: (error: any) => void;
    
    mockCommentsService.subscribeToComments.mockImplementation((postId, callback, onError) => {
      errorCallback = onError!;
      return jest.fn();
    });

    const { subscribeToComments } = useCommentsStore.getState();
    
    // Subscribe to comments
    subscribeToComments(mockPostId);

    // Simulate real-time error with proper AppError
    const { AppError, ErrorType } = require('../../../types/error');
    const mockError = new AppError(ErrorType.PERMISSION_ERROR, 'You do not have permission to perform this action');
    errorCallback!(mockError);

    // Wait for state update
    await waitFor(() => {
      const { error } = useCommentsStore.getState();
      expect(error?.message).toBe('You do not have permission to perform this action');
    });
  });

  it('should clean up all subscriptions on reset', () => {
    const mockUnsubscribe1 = jest.fn();
    const mockUnsubscribe2 = jest.fn();
    
    mockCommentsService.subscribeToComments
      .mockReturnValueOnce(mockUnsubscribe1)
      .mockReturnValueOnce(mockUnsubscribe2);

    const { subscribeToComments, reset } = useCommentsStore.getState();
    
    // Subscribe to multiple posts
    subscribeToComments('post-1');
    subscribeToComments('post-2');
    
    // Reset the store
    reset();

    // Verify all subscriptions were unsubscribed
    expect(mockUnsubscribe1).toHaveBeenCalled();
    expect(mockUnsubscribe2).toHaveBeenCalled();

    // Verify state is reset
    const { subscriptions, comments } = useCommentsStore.getState();
    expect(subscriptions).toEqual({});
    expect(comments).toEqual({});
  });
});