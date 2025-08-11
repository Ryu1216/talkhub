// Export all stores
export { useAuthStore, type AuthState } from './authStore';
export { usePostsStore, type PostsState } from './postsStore';
export { useCommentsStore, type CommentsState } from './commentsStore';

import { useAuthStore } from './authStore';
import { usePostsStore } from './postsStore';
import { useCommentsStore } from './commentsStore';

// Store utilities and helpers
export const resetAllStores = () => {
  useAuthStore.getState().reset();
  usePostsStore.getState().reset();
  useCommentsStore.getState().reset();
};

// Store selectors for common use cases
export const selectIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const selectCurrentUser = () => useAuthStore((state) => state.user);
export const selectAuthLoading = () => useAuthStore((state) => state.loading);
export const selectAuthError = () => useAuthStore((state) => state.error);

export const selectPosts = () => usePostsStore((state) => state.posts);
export const selectCurrentPost = () => usePostsStore((state) => state.currentPost);
export const selectPostsLoading = () => usePostsStore((state) => state.loading);
export const selectPostsError = () => usePostsStore((state) => state.error);

export const selectCommentsForPost = (postId: string) => 
  useCommentsStore((state) => state.comments[postId] || []);
export const selectCommentsLoading = () => useCommentsStore((state) => state.loading);
export const selectCommentsError = () => useCommentsStore((state) => state.error);