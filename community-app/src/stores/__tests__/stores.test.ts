// Basic test to verify store types and structure
import { useAuthStore, usePostsStore, useCommentsStore } from '../index';
import { ErrorType, AppError } from '../../types';

// Test that stores can be imported and have correct initial state
describe('Store Type Definitions', () => {
  test('AuthStore has correct initial state', () => {
    const initialState = useAuthStore.getState();
    
    expect(initialState.user).toBeNull();
    expect(initialState.loading).toBe(false);
    expect(initialState.error).toBeNull();
    expect(initialState.isAuthenticated).toBe(false);
    expect(typeof initialState.setUser).toBe('function');
    expect(typeof initialState.login).toBe('function');
    expect(typeof initialState.register).toBe('function');
    expect(typeof initialState.logout).toBe('function');
  });

  test('PostsStore has correct initial state', () => {
    const initialState = usePostsStore.getState();
    
    expect(Array.isArray(initialState.posts)).toBe(true);
    expect(initialState.posts.length).toBe(0);
    expect(initialState.currentPost).toBeNull();
    expect(initialState.loading).toBe(false);
    expect(initialState.error).toBeNull();
    expect(initialState.hasMore).toBe(true);
    expect(typeof initialState.fetchPosts).toBe('function');
    expect(typeof initialState.createPost).toBe('function');
  });

  test('CommentsStore has correct initial state', () => {
    const initialState = useCommentsStore.getState();
    
    expect(typeof initialState.comments).toBe('object');
    expect(Object.keys(initialState.comments).length).toBe(0);
    expect(initialState.loading).toBe(false);
    expect(initialState.error).toBeNull();
    expect(typeof initialState.fetchComments).toBe('function');
    expect(typeof initialState.createComment).toBe('function');
  });

  test('Error types are properly defined', () => {
    const error = new AppError(ErrorType.AUTH_ERROR, 'Test error', 'TEST_CODE');
    
    expect(error.type).toBe(ErrorType.AUTH_ERROR);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('AppError');
  });
});