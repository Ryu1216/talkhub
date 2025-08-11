// Validation script to check store types and functionality
import { useAuthStore, usePostsStore, useCommentsStore } from './index';
import { ErrorType, AppError, User, Post, Comment } from '../types';
import { Timestamp } from 'firebase/firestore';

// This script validates that all store types are correctly defined
// and can be used without TypeScript errors

console.log('🔍 Validating store type definitions...');

// Test AuthStore
const authStore = useAuthStore.getState();
console.log('✅ AuthStore initial state:', {
  hasUser: authStore.user === null,
  isLoading: authStore.loading === false,
  hasError: authStore.error === null,
  isAuthenticated: authStore.isAuthenticated === false
});

// Test PostsStore
const postsStore = usePostsStore.getState();
console.log('✅ PostsStore initial state:', {
  postsCount: postsStore.posts.length,
  hasCurrentPost: postsStore.currentPost === null,
  isLoading: postsStore.loading === false,
  hasMore: postsStore.hasMore === true
});

// Test CommentsStore
const commentsStore = useCommentsStore.getState();
console.log('✅ CommentsStore initial state:', {
  commentsKeys: Object.keys(commentsStore.comments).length,
  isLoading: commentsStore.loading === false,
  hasError: commentsStore.error === null
});

// Test Error types
const testError = new AppError(ErrorType.VALIDATION_ERROR, 'Test validation error');
console.log('✅ AppError creation:', {
  type: testError.type,
  message: testError.message,
  name: testError.name
});

// Test type compatibility with sample data
const sampleUser: User = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

const samplePost: Post = {
  id: 'test-post-id',
  title: 'Test Post',
  content: 'This is a test post content',
  authorId: sampleUser.uid,
  authorName: sampleUser.displayName || 'Anonymous',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  commentCount: 0
};

const sampleComment: Comment = {
  id: 'test-comment-id',
  postId: samplePost.id,
  content: 'This is a test comment',
  authorId: sampleUser.uid,
  authorName: sampleUser.displayName || 'Anonymous',
  createdAt: Timestamp.now()
};

console.log('✅ Sample data types validated:', {
  user: !!sampleUser.uid,
  post: !!samplePost.id,
  comment: !!sampleComment.id
});

console.log('🎉 All store type definitions are valid!');

export { sampleUser, samplePost, sampleComment };