import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppError, ErrorType } from '../types/error';

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

class CommentsService {
  private readonly COLLECTION_NAME = 'comments';
  private demoMode = false;
  private demoComments: Comment[] = [];

  constructor() {
    // Check if we're in demo mode
    this.demoMode = __DEV__ && (!db || db.app.options.projectId === 'demo-project');
    if (this.demoMode) {
      console.log('CommentsService running in demo mode');
      this.initializeDemoComments();
    }
  }

  /**
   * Initialize demo comments for testing
   */
  private initializeDemoComments() {
    const now = Timestamp.now();
    const thirtyMinAgo = Timestamp.fromMillis(now.toMillis() - 30 * 60 * 1000);
    const oneHourAgo = Timestamp.fromMillis(now.toMillis() - 60 * 60 * 1000);
    const twoHoursAgo = Timestamp.fromMillis(now.toMillis() - 2 * 60 * 60 * 1000);
    const oneDayAgo = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);
    
    this.demoComments = [
      // 카페 추천 글 댓글들
      {
        id: 'demo-comment-1',
        postId: 'demo-post-1',
        content: '스타벅스 강남역점 추천해요! 2층이 조용하고 콘센트도 많아요 ☕',
        authorId: 'demo-user-6',
        authorName: '카페마니아',
        createdAt: thirtyMinAgo,
      },
      {
        id: 'demo-comment-2',
        postId: 'demo-post-1',
        content: '투썸플레이스도 좋아요~ 디저트도 맛있고 분위기도 괜찮습니다!',
        authorId: 'demo-user-7',
        authorName: '디저트러버',
        createdAt: oneHourAgo,
      },
      {
        id: 'demo-comment-3',
        postId: 'demo-post-1',
        content: '개인적으로는 독립 카페를 추천해요. "카페 온더코너" 가보세요!',
        authorId: 'demo-user-8',
        authorName: '독립카페팬',
        createdAt: oneHourAgo,
      },
      {
        id: 'demo-comment-4',
        postId: 'demo-post-1',
        content: '공부하기엔 도서관이 최고 아닌가요? 😅',
        authorId: 'demo-user-9',
        authorName: '도서관파',
        createdAt: twoHoursAgo,
      },
      {
        id: 'demo-comment-5',
        postId: 'demo-post-1',
        content: '감사합니다! 다 가봐야겠어요 👍',
        authorId: 'demo-user-1',
        authorName: '카페러버',
        createdAt: thirtyMinAgo,
      },

      // 날씨 좋다는 글 댓글들
      {
        id: 'demo-comment-6',
        postId: 'demo-post-2',
        content: '정말 오랜만에 맑은 하늘이네요! 저도 나가고 싶어져요 🌞',
        authorId: 'demo-user-10',
        authorName: '햇빛조아',
        createdAt: oneHourAgo,
      },
      {
        id: 'demo-comment-7',
        postId: 'demo-post-2',
        content: '한강 치킨 부럽네요 ㅠㅠ 저는 집에서 넷플릭스...',
        authorId: 'demo-user-11',
        authorName: '집순이',
        createdAt: oneHourAgo,
      },
      {
        id: 'demo-comment-8',
        postId: 'demo-post-2',
        content: '저도 한강 갈까 했는데 사람 너무 많을 것 같아서... 😅',
        authorId: 'demo-user-12',
        authorName: '사람싫어',
        createdAt: twoHoursAgo,
      },

      // 개발자 취업 팁 글 댓글들
      {
        id: 'demo-comment-9',
        postId: 'demo-post-3',
        content: '축하드려요! 혹시 면접에서 어떤 질문들이 나왔는지 궁금해요',
        authorId: 'demo-user-13',
        authorName: '취준생A',
        createdAt: oneDayAgo,
      },
      {
        id: 'demo-comment-10',
        postId: 'demo-post-3',
        content: '포트폴리오 어떻게 구성하셨나요? 참고하고 싶어요!',
        authorId: 'demo-user-14',
        authorName: '포트폴리오고민',
        createdAt: oneDayAgo,
      },
      {
        id: 'demo-comment-11',
        postId: 'demo-post-3',
        content: '정말 유용한 정보 감사합니다! 저도 열심히 준비해야겠어요 💪',
        authorId: 'demo-user-15',
        authorName: '개발꿈나무',
        createdAt: oneDayAgo,
      },

      // 맛집 글 댓글들
      {
        id: 'demo-comment-12',
        postId: 'demo-post-4',
        content: '혹시 가게 이름이 뭔가요? 꼭 가보고 싶어요!',
        authorId: 'demo-user-16',
        authorName: '파스타매니아',
        createdAt: oneDayAgo,
      },
      {
        id: 'demo-comment-13',
        postId: 'demo-post-4',
        content: '홍대에 맛있는 파스타집이 또 있었네요! 정보 감사해요 🍝',
        authorId: 'demo-user-17',
        authorName: '홍대러버',
        createdAt: oneDayAgo,
      },

      // 운동 글 댓글들
      {
        id: 'demo-comment-14',
        postId: 'demo-post-5',
        content: '대단하세요! 저는 작심삼일... 😭',
        authorId: 'demo-user-18',
        authorName: '작심삼일',
        createdAt: oneDayAgo,
      },
      {
        id: 'demo-comment-15',
        postId: 'demo-post-5',
        content: '등산 정말 좋죠! 어느 산 주로 가시나요?',
        authorId: 'demo-user-19',
        authorName: '등산러버',
        createdAt: oneDayAgo,
      },
      {
        id: 'demo-comment-16',
        postId: 'demo-post-5',
        content: '저도 운동 시작해야겠어요... 동기부여 받고 갑니다! 💪',
        authorId: 'demo-user-20',
        authorName: '운동시작',
        createdAt: oneDayAgo,
      }
    ];
  }

  /**
   * Create a new comment
   */
  async createComment(
    data: CreateCommentData,
    authorId: string,
    authorName: string
  ): Promise<Comment> {
    if (this.demoMode) {
      return this.createDemoComment(data, authorId, authorName);
    }

    try {
      const commentData = {
        postId: data.postId,
        content: data.content,
        authorId,
        authorName,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), commentData);
      
      return {
        id: docRef.id,
        ...commentData,
      };
    } catch (error: any) {
      console.error('Firebase createComment failed, falling back to demo mode:', error);
      this.demoMode = true;
      return this.createDemoComment(data, authorId, authorName);
    }
  }

  /**
   * Create a demo comment (for demo mode)
   */
  private createDemoComment(
    data: CreateCommentData,
    authorId: string,
    authorName: string
  ): Comment {
    console.log('Creating demo comment:', data.content);
    
    const newComment: Comment = {
      id: `demo-comment-${Date.now()}`,
      postId: data.postId,
      content: data.content,
      authorId,
      authorName,
      createdAt: Timestamp.now(),
    };

    // Add to demo comments array
    this.demoComments.push(newComment);
    
    console.log('Demo comment created successfully:', newComment.id);
    return newComment;
  }

  /**
   * Get comments for a specific post
   */
  async getComments(postId: string): Promise<Comment[]> {
    if (this.demoMode) {
      return this.demoComments.filter(comment => comment.postId === postId);
    }

    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const comments: Comment[] = [];

      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data(),
        } as Comment);
      });

      return comments;
    } catch (error: any) {
      console.error('Firebase getComments failed, falling back to demo mode:', error);
      this.demoMode = true;
      return this.demoComments.filter(comment => comment.postId === postId);
    }
  }

  /**
   * Listen to real-time comments updates for a specific post
   */
  subscribeToComments(
    postId: string,
    callback: (comments: Comment[]) => void,
    onError?: (error: AppError) => void
  ): Unsubscribe {
    if (this.demoMode) {
      // For demo mode, just call the callback immediately with current comments
      const comments = this.demoComments.filter(comment => comment.postId === postId);
      callback(comments);
      
      // Return a no-op unsubscribe function
      return () => {
        console.log('Demo mode: unsubscribing from comments');
      };
    }

    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );

      return onSnapshot(
        q,
        (querySnapshot) => {
          try {
            const comments: Comment[] = [];
            querySnapshot.forEach((doc) => {
              comments.push({
                id: doc.id,
                ...doc.data(),
              } as Comment);
            });
            callback(comments);
          } catch (error) {
            console.error('Error processing comments snapshot:', error);
            const appError = this.handleError(error, 'Failed to process comments data');
            if (onError) {
              onError(appError);
            }
          }
        },
        (error) => {
          console.error('Error listening to comments:', error);
          const appError = this.handleError(error, 'Failed to listen to comments');
          if (onError) {
            onError(appError);
          }
        }
      );
    } catch (error) {
      console.error('Error setting up comments subscription:', error);
      this.demoMode = true;
      
      // Fallback to demo mode
      const comments = this.demoComments.filter(comment => comment.postId === postId);
      callback(comments);
      
      return () => {
        console.log('Demo mode fallback: unsubscribing from comments');
      };
    }
  }

  /**
   * Handle Firestore errors
   */
  private handleError(error: any, defaultMessage: string): AppError {
    let message = defaultMessage;
    let type = ErrorType.UNKNOWN_ERROR;

    switch (error.code) {
      case 'permission-denied':
        message = 'You do not have permission to perform this action';
        type = ErrorType.PERMISSION_ERROR;
        break;
      case 'not-found':
        message = 'The requested data was not found';
        break;
      case 'unavailable':
        message = 'Service is currently unavailable. Please try again later';
        type = ErrorType.NETWORK_ERROR;
        break;
      case 'cancelled':
        message = 'Operation was cancelled';
        break;
      default:
        if (error.message) {
          message = error.message;
        }
    }

    return new AppError(type, message, error.code);
  }
}

export const commentsService = new CommentsService();