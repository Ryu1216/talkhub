import { create } from 'zustand';
import { Comment, CreateCommentData, AppError, ErrorType } from '../types';
import { commentsService } from '../services/commentsService';
import { useAuthStore } from './authStore';
import { validateComment } from '../utils/permissions';
import { Unsubscribe } from 'firebase/firestore';

export interface CommentsState {
  comments: Record<string, Comment[]>; // postId를 키로 사용
  loading: boolean;
  error: AppError | null;
  subscriptions: Record<string, Unsubscribe>; // postId를 키로 사용하여 구독 관리
  
  // Actions
  setComments: (postId: string, comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  updateComment: (commentId: string, updates: Partial<Comment>) => void;
  removeComment: (postId: string, commentId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  fetchComments: (postId: string) => Promise<void>;
  createComment: (data: CreateCommentData) => Promise<void>;
  subscribeToComments: (postId: string) => void;
  unsubscribeFromComments: (postId: string) => void;
  clearError: () => void;
  clearCommentsForPost: (postId: string) => void;
  reset: () => void;
}

const initialState = {
  comments: {},
  loading: false,
  error: null,
  subscriptions: {},
};

export const useCommentsStore = create<CommentsState>((set, get) => ({
  ...initialState,

  // Actions
  setComments: (postId, comments) => set((state) => ({
    comments: {
      ...state.comments,
      [postId]: comments
    }
  })),

  addComment: (comment) => set((state) => ({
    comments: {
      ...state.comments,
      [comment.postId]: [
        ...(state.comments[comment.postId] || []),
        comment
      ]
    }
  })),

  updateComment: (commentId, updates) => set((state) => {
    const newComments = { ...state.comments };
    
    // Find and update the comment in the appropriate post's comment list
    Object.keys(newComments).forEach(postId => {
      newComments[postId] = newComments[postId].map(comment =>
        comment.id === commentId ? { ...comment, ...updates } : comment
      );
    });

    return { comments: newComments };
  }),

  removeComment: (postId, commentId) => set((state) => ({
    comments: {
      ...state.comments,
      [postId]: (state.comments[postId] || []).filter(
        comment => comment.id !== commentId
      )
    }
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  fetchComments: async (postId: string) => {
    const { setLoading, setError, setComments } = get();
    
    setLoading(true);
    setError(null);
    
    try {
      const comments = await commentsService.getComments(postId);
      setComments(postId, comments);
    } catch (error) {
      console.error('Fetch comments error:', error);
      setError(error as AppError);
    } finally {
      setLoading(false);
    }
  },

  createComment: async (data: CreateCommentData) => {
    const { setLoading, setError, addComment } = get();
    const authState = useAuthStore.getState();
    
    setLoading(true);
    setError(null);
    
    try {
      // For demo mode, create a demo user if not authenticated
      let userId = 'demo-user';
      let userName = '익명사용자';
      
      if (authState.user) {
        userId = authState.user.uid;
        userName = authState.user.displayName || authState.user.email;
        
        // Validate permissions and content only if user is authenticated
        validateComment(authState.user, data.content);
      } else if (!__DEV__) {
        // Only require authentication in production
        throw new AppError(ErrorType.AUTH_ERROR, '댓글을 작성하려면 로그인이 필요합니다');
      }
      
      console.log('Creating comment:', { postId: data.postId, content: data.content });
      
      const newComment = await commentsService.createComment(
        data,
        userId,
        userName
      );
      
      console.log('Comment created successfully:', newComment.id);
      
      // Add comment to local state (real-time listener will also update it)
      addComment(newComment);
      
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Create comment error:', error);
      setError(error as AppError);
      // Re-throw the error so the UI component can handle it
      throw error;
    } finally {
      setLoading(false);
    }
  },

  subscribeToComments: (postId: string) => {
    const { subscriptions, setComments, setError, unsubscribeFromComments } = get();
    
    // Unsubscribe from existing subscription if any
    if (subscriptions[postId]) {
      unsubscribeFromComments(postId);
    }
    
    // Create new subscription with error handling
    const unsubscribe = commentsService.subscribeToComments(
      postId, 
      (comments) => {
        setComments(postId, comments);
      },
      (error) => {
        console.error('Real-time comments error:', error);
        setError(error);
      }
    );
    
    // Store the unsubscribe function
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        [postId]: unsubscribe
      }
    }));
  },

  unsubscribeFromComments: (postId: string) => {
    const { subscriptions } = get();
    
    if (subscriptions[postId]) {
      subscriptions[postId]();
      
      // Remove subscription from state
      set((state) => {
        const newSubscriptions = { ...state.subscriptions };
        delete newSubscriptions[postId];
        return { subscriptions: newSubscriptions };
      });
    }
  },

  clearError: () => set({ error: null }),

  clearCommentsForPost: (postId) => {
    const { unsubscribeFromComments } = get();
    
    // Unsubscribe from real-time updates
    unsubscribeFromComments(postId);
    
    // Clear comments from state
    set((state) => {
      const newComments = { ...state.comments };
      delete newComments[postId];
      return { comments: newComments };
    });
  },

  reset: () => {
    const { subscriptions } = get();
    
    // Unsubscribe from all active subscriptions
    Object.values(subscriptions).forEach(unsubscribe => {
      if (unsubscribe) unsubscribe();
    });
    
    set(initialState);
  },
}));