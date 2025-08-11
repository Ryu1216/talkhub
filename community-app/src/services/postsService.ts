import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  Timestamp,
  increment,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppError, ErrorType } from '../types/error';

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
  imageUrl?: string;
}

class PostsService {
  private readonly COLLECTION_NAME = 'posts';
  private readonly POSTS_PER_PAGE = 10;
  private demoMode = false;
  private demoPosts: Post[] = [];

  constructor() {
    // Check if we're in demo mode
    this.demoMode = __DEV__ && (!db || db.app.options.projectId === 'demo-project');
    if (this.demoMode) {
      console.log('PostsService running in demo mode');
      this.initializeDemoPosts();
    }
  }

  /**
   * Initialize demo posts for testing
   */
  private initializeDemoPosts() {
    const now = Timestamp.now();
    const oneHourAgo = Timestamp.fromMillis(now.toMillis() - 60 * 60 * 1000);
    const twoHoursAgo = Timestamp.fromMillis(now.toMillis() - 2 * 60 * 60 * 1000);
    const oneDayAgo = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = Timestamp.fromMillis(now.toMillis() - 2 * 24 * 60 * 60 * 1000);
    
    this.demoPosts = [
      {
        id: 'demo-post-1',
        title: '새로운 카페 추천해주세요! ☕',
        content: '안녕하세요! 강남역 근처에서 공부하기 좋은 카페를 찾고 있어요.\n\n조건:\n- 와이파이 잘 터지는 곳\n- 콘센트 많은 곳\n- 조용한 분위기\n- 커피 맛도 괜찮으면 좋겠어요\n\n혹시 추천해주실 곳 있나요? 미리 감사드립니다! 🙏',
        authorId: 'demo-user-1',
        authorName: '카페러버',
        createdAt: oneHourAgo,
        updatedAt: oneHourAgo,
        commentCount: 5,
      },
      {
        id: 'demo-post-2',
        title: '오늘 날씨 정말 좋네요 🌞',
        content: '오랜만에 맑은 하늘을 보니까 기분이 너무 좋아요!\n\n산책하기 딱 좋은 날씨인 것 같은데, 다들 어떻게 보내고 계신가요?\n\n저는 한강공원에 나가서 치킨 먹으면서 피크닉 할 예정이에요 🍗\n\n#좋은날씨 #한강공원 #피크닉',
        authorId: 'demo-user-2',
        authorName: '햇살좋아',
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo,
        commentCount: 8,
      },
      {
        id: 'demo-post-3',
        title: '개발자 취업 준비 팁 공유 💻',
        content: '안녕하세요! 최근에 개발자로 취업에 성공해서 경험을 공유하고 싶어요.\n\n📚 공부한 것들:\n- React, TypeScript\n- Node.js, Express\n- Firebase, MongoDB\n- Git, Docker 기초\n\n📝 포트폴리오:\n- 개인 프로젝트 3개\n- 팀 프로젝트 1개\n- GitHub 꾸준히 관리\n\n면접에서 가장 중요한 건 기본기와 소통 능력인 것 같아요!\n질문 있으시면 언제든 댓글 남겨주세요 😊',
        authorId: 'demo-user-3',
        authorName: '신입개발자',
        createdAt: oneDayAgo,
        updatedAt: oneDayAgo,
        commentCount: 12,
      },
      {
        id: 'demo-post-4',
        title: '맛집 발견! 홍대 파스타 맛집 🍝',
        content: '홍대에서 진짜 맛있는 파스타집을 발견했어요!\n\n🍝 메뉴:\n- 크림 파스타: 진짜 진짜 맛있음\n- 토마토 파스타: 새콤달콤 완벽\n- 오일 파스타: 심플하지만 깊은 맛\n\n💰 가격도 합리적이고 양도 많아요\n📍 위치: 홍대입구역 9번 출구에서 도보 5분\n\n사진 못 찍은 게 아쉽지만... 다음에 또 가서 찍어올게요!\n혹시 가보신 분 있나요?',
        authorId: 'demo-user-4',
        authorName: '맛집헌터',
        createdAt: oneDayAgo,
        updatedAt: oneDayAgo,
        commentCount: 7,
      },
      {
        id: 'demo-post-5',
        title: '운동 시작했어요! 💪',
        content: '새해 목표로 운동을 시작했는데 벌써 한 달째 꾸준히 하고 있어요!\n\n🏃‍♀️ 루틴:\n- 월, 수, 금: 헬스장 (웨이트)\n- 화, 목: 홈트레이닝\n- 주말: 등산 or 산책\n\n처음엔 힘들었는데 이제 운동하는 게 재밌어졌어요.\n특히 등산은 정말 추천해요! 스트레스도 풀리고 경치도 좋고 👍\n\n다들 운동 어떻게 하고 계신가요?\n함께 동기부여 해요! 💪',
        authorId: 'demo-user-5',
        authorName: '운동초보',
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
        commentCount: 15,
      }
    ];
  }

  /**
   * Create a new post
   */
  async createPost(
    data: CreatePostData,
    authorId: string,
    authorName: string
  ): Promise<Post> {
    if (this.demoMode) {
      return this.createDemoPost(data, authorId, authorName);
    }

    try {
      const now = Timestamp.now();
      const postData = {
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl,
        authorId,
        authorName,
        createdAt: now,
        updatedAt: now,
        commentCount: 0,
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), postData);
      
      return {
        id: docRef.id,
        ...postData,
      };
    } catch (error: any) {
      console.error('Firebase createPost failed, falling back to demo mode:', error);
      this.demoMode = true;
      return this.createDemoPost(data, authorId, authorName);
    }
  }

  /**
   * Create a demo post (for demo mode)
   */
  private createDemoPost(
    data: CreatePostData,
    authorId: string,
    authorName: string
  ): Post {
    console.log('Creating demo post:', data.title);
    
    const now = Timestamp.now();
    const newPost: Post = {
      id: `demo-post-${Date.now()}`,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl,
      authorId,
      authorName,
      createdAt: now,
      updatedAt: now,
      commentCount: 0,
    };

    // Add to demo posts array
    this.demoPosts.unshift(newPost);
    
    console.log('Demo post created successfully:', newPost.id);
    return newPost;
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string): Promise<Post | null> {
    if (this.demoMode) {
      const post = this.demoPosts.find(p => p.id === postId);
      return post || null;
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Post;
      }
      
      return null;
    } catch (error: any) {
      console.error('Firebase getPost failed, falling back to demo mode:', error);
      this.demoMode = true;
      const post = this.demoPosts.find(p => p.id === postId);
      return post || null;
    }
  }

  /**
   * Get posts with pagination
   */
  async getPosts(
    pageSize: number = this.POSTS_PER_PAGE,
    lastDoc?: DocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
    if (this.demoMode) {
      // Simple pagination for demo mode
      const startIndex = lastDoc ? parseInt(lastDoc.id) || 0 : 0;
      const endIndex = Math.min(startIndex + pageSize, this.demoPosts.length);
      const posts = this.demoPosts.slice(startIndex, endIndex);
      
      return {
        posts,
        lastDoc: endIndex < this.demoPosts.length ? { id: endIndex.toString() } as any : null,
      };
    }

    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(
          collection(db, this.COLLECTION_NAME),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];
      let newLastDoc: DocumentSnapshot | null = null;

      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data(),
        } as Post);
        newLastDoc = doc;
      });

      return {
        posts,
        lastDoc: posts.length === pageSize ? newLastDoc : null,
      };
    } catch (error: any) {
      console.error('Firebase getPosts failed, falling back to demo mode:', error);
      this.demoMode = true;
      return this.getPosts(pageSize, lastDoc);
    }
  }

  /**
   * Get all posts (for initial load)
   */
  async getAllPosts(): Promise<Post[]> {
    if (this.demoMode) {
      return [...this.demoPosts];
    }

    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];

      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data(),
        } as Post);
      });

      return posts;
    } catch (error: any) {
      console.error('Firebase getAllPosts failed, falling back to demo mode:', error);
      this.demoMode = true;
      return [...this.demoPosts];
    }
  }

  /**
   * Increment comment count for a post
   */
  async incrementCommentCount(postId: string): Promise<void> {
    try {
      const postRef = doc(db, this.COLLECTION_NAME, postId);
      await updateDoc(postRef, {
        commentCount: increment(1),
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw this.handleError(error, 'Failed to update comment count');
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
        message = 'The requested post was not found';
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

export const postsService = new PostsService();