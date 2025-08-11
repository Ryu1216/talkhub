# State Management with Zustand

This directory contains the global state management implementation using Zustand for the community app.

## Store Structure

### AuthStore (`authStore.ts`)
Manages user authentication state including:
- User profile information
- Authentication status
- Loading states for auth operations
- Error handling for auth failures
- Actions: login, register, logout, setUser, clearError

### PostsStore (`postsStore.ts`)
Manages posts data and operations including:
- Posts list with pagination support
- Current post for detail view
- Loading states for post operations
- Error handling for post failures
- Actions: fetchPosts, fetchPost, createPost, updatePost

### CommentsStore (`commentsStore.ts`)
Manages comments data organized by post ID including:
- Comments grouped by post ID
- Loading states for comment operations
- Error handling for comment failures
- Actions: fetchComments, createComment, addComment, updateComment

## Usage Examples

```typescript
import { useAuthStore, usePostsStore, useCommentsStore } from '../stores';

// In a component
const { user, login, loading } = useAuthStore();
const { posts, fetchPosts } = usePostsStore();
const { comments } = useCommentsStore();

// Get comments for a specific post
const postComments = useCommentsStore(state => state.comments[postId] || []);
```

## Store Selectors

The `index.ts` file provides convenient selectors for common use cases:
- `selectIsAuthenticated()` - Get authentication status
- `selectCurrentUser()` - Get current user
- `selectPosts()` - Get all posts
- `selectCommentsForPost(postId)` - Get comments for a specific post

## Reset Functionality

All stores include a `reset()` method to clear their state, and there's a global `resetAllStores()` function to reset all stores at once (useful for logout).