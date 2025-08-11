import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Post types
export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  commentCount: number;
}

export interface CreatePostData {
  title: string;
  content: string;
  image?: {
    uri: string;
    type: string;
    name: string;
  };
}

// Comment types
export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}

export interface CreateCommentData {
  postId: string;
  content: string;
}

// Error types - re-export from error.ts
export { ErrorType, AppError } from './error';

// Store types - re-export from stores
export type { AuthState } from '../stores/authStore';
export type { PostsState } from '../stores/postsStore';
export type { CommentsState } from '../stores/commentsStore';

// Navigation types
export type {
  RootStackParamList,
  AuthStackParamList,
  MainStackParamList
} from './navigation';