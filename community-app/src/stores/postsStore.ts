import { create } from 'zustand';
import { Post, CreatePostData, AppError, ErrorType } from '../types';
import { postsService } from '../services/postsService';
import { useAuthStore } from './authStore';

export interface PostsState {
  posts: Post[];
  currentPost: Post | null;
  loading: boolean;
  error: AppError | null;
  hasMore: boolean;
  lastVisible: any; // Firestore DocumentSnapshot for pagination
  
  // Actions
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  setCurrentPost: (post: Post | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setLastVisible: (lastVisible: any) => void;
  fetchPosts: (refresh?: boolean) => Promise<void>;
  fetchPost: (id: string) => Promise<void>;
  createPost: (data: CreatePostData) => Promise<void>;
  clearError: () => void;
  reset: () => void;
  subscribeToRealtimeUpdates: () => (() => void);
}

const initialState = {
  posts: [],
  currentPost: null,
  loading: false,
  error: null,
  hasMore: true,
  lastVisible: null,
};

export const usePostsStore = create<PostsState>((set, get) => ({
  ...initialState,

  // Actions
  setPosts: (posts) => set({ posts }),

  addPost: (post) => set((state) => ({ 
    posts: [post, ...state.posts] 
  })),

  updatePost: (postId, updates) => set((state) => ({
    posts: state.posts.map(post => 
      post.id === postId ? { ...post, ...updates } : post
    ),
    currentPost: state.currentPost?.id === postId 
      ? { ...state.currentPost, ...updates } 
      : state.currentPost
  })),

  setCurrentPost: (post) => set({ currentPost: post }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  setHasMore: (hasMore) => set({ hasMore }),

  setLastVisible: (lastVisible) => set({ lastVisible }),

  fetchPosts: async (refresh = false) => {
    const { loading, hasMore, lastVisible } = get();
    
    // Prevent multiple simultaneous requests
    if (loading) return;
    
    // If not refreshing and no more posts, return early
    if (!refresh && !hasMore) return;

    set({ loading: true, error: null });
    
    // Reset state for refresh
    if (refresh) {
      set({ posts: [], lastVisible: null, hasMore: true });
    }

    try {
      const result = await postsService.getPosts(10, refresh ? undefined : lastVisible);
      
      set((state) => ({
        posts: refresh ? result.posts : [...state.posts, ...result.posts],
        lastVisible: result.lastDoc,
        hasMore: !!result.lastDoc,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Fetch posts error:', error);
      set({ 
        error: error as AppError, 
        loading: false 
      });
    }
  },

  fetchPost: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const post = await postsService.getPost(id);
      
      if (post) {
        set({ 
          currentPost: post, 
          loading: false, 
          error: null 
        });
      } else {
        set({ 
          currentPost: null,
          loading: false,
          error: new AppError(ErrorType.UNKNOWN_ERROR, 'Post not found')
        });
      }
    } catch (error) {
      console.error('Fetch post error:', error);
      set({ 
        error: error as AppError, 
        loading: false,
        currentPost: null
      });
    }
  },

  createPost: async (data: CreatePostData) => {
    const authState = useAuthStore.getState();
    
    // For demo mode, create a demo user if not authenticated
    let userId = 'demo-user';
    let userName = '익명사용자';
    
    if (authState.user) {
      userId = authState.user.uid;
      userName = authState.user.displayName || authState.user.email;
    } else if (!__DEV__) {
      // Only require authentication in production
      const authError = new AppError(ErrorType.AUTH_ERROR, '게시글을 작성하려면 로그인이 필요합니다');
      set({ 
        error: authError,
        loading: false 
      });
      throw authError;
    }

    set({ loading: true, error: null });
    
    let uploadedImageUrl: string | undefined;
    
    try {
      // Step 1: Upload image if provided
      if (data.image) {
        console.log('Uploading image for post...');
        const { imageUploadService } = await import('../services');
        
        const uploadResult = await imageUploadService.uploadImageFromUri(
          data.image.uri,
          userId,
          {
            compress: true,
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.8,
          }
        );
        
        uploadedImageUrl = uploadResult.url;
        console.log('Image uploaded successfully:', uploadedImageUrl);
      }

      // Step 2: Create post with image URL
      const postData = {
        title: data.title,
        content: data.content,
        imageUrl: uploadedImageUrl,
      };

      console.log('Creating post with data:', postData);
      const newPost = await postsService.createPost(
        postData,
        userId,
        userName
      );
      
      console.log('Post created successfully:', newPost.id);
      
      // Add the new post to the beginning of the posts array
      set((state) => ({
        posts: [newPost, ...state.posts],
        loading: false,
        error: null,
      }));
      
    } catch (error) {
      console.error('Create post error:', error);
      
      // Rollback: If image was uploaded but post creation failed, try to delete the image
      if (uploadedImageUrl && !uploadedImageUrl.startsWith('file://')) {
        try {
          const { imageUploadService } = await import('../services');
          await imageUploadService.deleteImage(uploadedImageUrl);
          console.log('Rolled back uploaded image after post creation failure');
        } catch (rollbackError) {
          console.error('Failed to rollback uploaded image:', rollbackError);
          // Don't throw rollback error, just log it
        }
      }
      
      set({ 
        error: error as AppError, 
        loading: false 
      });
      
      // Re-throw the error so the UI can handle it
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),

  // Real-time listener for posts (optional enhancement)
  subscribeToRealtimeUpdates: () => {
    // This would set up a Firestore onSnapshot listener
    // Implementation can be added later for real-time updates
    console.log('Real-time subscription setup - to be implemented');
    
    // Return unsubscribe function
    return () => {
      console.log('Unsubscribing from real-time updates');
    };
  },
}));