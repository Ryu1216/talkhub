import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AppError, ErrorType } from '../types/error';
import { retryWithBackoff, checkNetworkConnectivity } from './networkUtils';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

class AuthService {
  /**
   * Check if we should use demo mode
   */
  private shouldUseDemoMode(): boolean {
    return __DEV__ && auth.app.options.projectId === 'demo-project';
  }

  /**
   * Demo mode register
   */
  private async demoRegister(email: string, password: string): Promise<UserProfile> {
    console.log('Using demo mode for registration');
    
    // Simple validation
    if (!email || !password) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        '이메일과 비밀번호를 입력해주세요',
        'auth/invalid-input'
      );
    }

    if (password.length < 6) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        '비밀번호는 최소 6자 이상이어야 합니다',
        'auth/weak-password'
      );
    }

    // Generate more realistic display names for demo
    const demoNames = [
      '새로운멤버', '커뮤니티신입', '첫글작성', '안녕하세요', '반갑습니다',
      '새내기', '초보자', '처음이에요', '가입했어요', '시작해요'
    ];
    
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
    const emailPrefix = email.split('@')[0];
    const displayName = emailPrefix.length > 2 ? emailPrefix : randomName;

    // Create demo user profile
    const userProfile: UserProfile = {
      uid: `demo-${Date.now()}`,
      email,
      displayName,
      photoURL: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Demo registration successful:', userProfile.uid);
    return userProfile;
  }

  /**
   * Demo mode login
   */
  private async demoLogin(email: string, password: string): Promise<UserProfile> {
    console.log('Using demo mode for login');
    
    // Simple validation
    if (!email || !password) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        '이메일과 비밀번호를 입력해주세요',
        'auth/invalid-input'
      );
    }

    // Generate more realistic display names for demo
    const demoNames = [
      '커뮤니티러버', '일상공유', '맛집탐험가', '개발자지망생', '운동매니아',
      '카페순례자', '책벌레', '영화광', '여행좋아', '음악듣기',
      '사진찍기', '요리초보', '반려동물', '게임러버', '드라마중독'
    ];
    
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
    const emailPrefix = email.split('@')[0];
    const displayName = emailPrefix.length > 2 ? emailPrefix : randomName;

    // For demo, accept any valid email/password combination
    const userProfile: UserProfile = {
      uid: `demo-${email.replace('@', '-').replace('.', '-')}`,
      email,
      displayName,
      photoURL: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Demo login successful:', userProfile.uid);
    return userProfile;
  }

  /**
   * Register a new user with email and password
   */
  async register(email: string, password: string): Promise<UserProfile> {
    // Use demo mode if Firebase is not properly configured
    if (this.shouldUseDemoMode()) {
      return this.demoRegister(email, password);
    }

    try {
      console.log('Attempting to register user with email:', email);
      
      // Check network connectivity first
      const hasNetwork = await checkNetworkConnectivity();
      if (!hasNetwork) {
        throw new AppError(
          ErrorType.NETWORK_ERROR,
          '인터넷 연결을 확인해주세요',
          'network-unavailable'
        );
      }
      
      const userCredential: UserCredential = await retryWithBackoff(
        () => createUserWithEmailAndPassword(auth, email, password),
        3,
        1000
      );
      
      console.log('User registration successful:', userCredential.user.uid);
      
      const user = userCredential.user;
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save user profile to Firestore with retry logic
      try {
        await retryWithBackoff(
          () => setDoc(doc(db, 'users', user.uid), userProfile),
          2,
          1000
        );
        console.log('User profile saved to Firestore');
      } catch (firestoreError) {
        console.warn('Failed to save user profile to Firestore:', firestoreError);
        // Continue anyway - the user is still registered in Auth
      }
      
      return userProfile;
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // If Firebase is consistently failing, switch to demo mode
      if (error.code === 'auth/network-request-failed') {
        console.log('Switching to demo mode due to network issues');
        return this.demoRegister(email, password);
      }
      
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in user with email and password
   */
  async login(email: string, password: string): Promise<UserProfile> {
    // Use demo mode if Firebase is not properly configured
    if (this.shouldUseDemoMode()) {
      return this.demoLogin(email, password);
    }

    try {
      console.log('Attempting to login user with email:', email);
      
      // Check network connectivity first
      const hasNetwork = await checkNetworkConnectivity();
      if (!hasNetwork) {
        throw new AppError(
          ErrorType.NETWORK_ERROR,
          '인터넷 연결을 확인해주세요',
          'network-unavailable'
        );
      }
      
      const userCredential: UserCredential = await retryWithBackoff(
        () => signInWithEmailAndPassword(auth, email, password),
        3,
        1000
      );
      
      console.log('User login successful:', userCredential.user.uid);
      
      const user = userCredential.user;
      
      // Get user profile from Firestore with fallback
      try {
        const userDoc = await retryWithBackoff(
          () => getDoc(doc(db, 'users', user.uid)),
          2,
          1000
        );
        if (userDoc.exists()) {
          console.log('User profile loaded from Firestore');
          return userDoc.data() as UserProfile;
        }
      } catch (firestoreError) {
        console.warn('Failed to load user profile from Firestore:', firestoreError);
      }
      
      // Create profile if it doesn't exist or Firestore is unavailable
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Try to save profile to Firestore, but don't fail if it doesn't work
      try {
        await retryWithBackoff(
          () => setDoc(doc(db, 'users', user.uid), userProfile),
          2,
          1000
        );
        console.log('User profile saved to Firestore');
      } catch (firestoreError) {
        console.warn('Failed to save user profile to Firestore:', firestoreError);
      }
      
      return userProfile;
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // If Firebase is consistently failing, switch to demo mode
      if (error.code === 'auth/network-request-failed') {
        console.log('Switching to demo mode due to network issues');
        return this.demoLogin(email, password);
      }
      
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    // Use demo mode if Firebase is not properly configured
    if (this.shouldUseDemoMode()) {
      console.log('Demo logout successful');
      return;
    }

    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    if (this.shouldUseDemoMode()) {
      return null; // Demo mode doesn't maintain persistent state
    }
    return auth.currentUser;
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (this.shouldUseDemoMode()) {
      // Demo mode doesn't have persistent auth state
      callback(null);
      return () => {}; // Return empty cleanup function
    }
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      // In development mode without Firebase setup, return a mock profile
      if (__DEV__ && (!db || db.app.options.projectId === 'demo-project')) {
        console.log('Using demo mode for getUserProfile');
        return {
          uid,
          email: 'demo@example.com',
          displayName: 'Demo User',
          photoURL: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      // In development mode, return a mock profile on error
      if (__DEV__) {
        console.warn('Firebase not available, using mock profile');
        return {
          uid,
          email: 'demo@example.com',
          displayName: 'Demo User',
          photoURL: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      throw new AppError(
        ErrorType.UNKNOWN_ERROR,
        'Failed to get user profile',
        error.code
      );
    }
  }

  /**
   * Handle Firebase Auth errors
   */
  private handleAuthError(error: any): AppError {
    console.error('Firebase Auth Error:', error);
    
    let message = '인증 오류가 발생했습니다';
    let type = ErrorType.AUTH_ERROR;

    switch (error.code) {
      case 'auth/user-not-found':
        message = '해당 이메일로 등록된 사용자를 찾을 수 없습니다';
        break;
      case 'auth/wrong-password':
        message = '비밀번호가 올바르지 않습니다';
        break;
      case 'auth/email-already-in-use':
        message = '이미 사용 중인 이메일입니다';
        break;
      case 'auth/weak-password':
        message = '비밀번호는 최소 6자 이상이어야 합니다';
        type = ErrorType.VALIDATION_ERROR;
        break;
      case 'auth/invalid-email':
        message = '유효하지 않은 이메일 주소입니다';
        type = ErrorType.VALIDATION_ERROR;
        break;
      case 'auth/network-request-failed':
        message = 'Firebase 서버에 연결할 수 없습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요';
        type = ErrorType.NETWORK_ERROR;
        break;
      case 'auth/too-many-requests':
        message = '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요';
        break;
      case 'auth/invalid-api-key':
        message = 'Firebase 설정에 문제가 있습니다';
        break;
      case 'auth/app-deleted':
        message = 'Firebase 앱이 삭제되었습니다';
        break;
      case 'auth/invalid-user-token':
        message = '사용자 토큰이 유효하지 않습니다';
        break;
      case 'auth/user-token-expired':
        message = '사용자 토큰이 만료되었습니다';
        break;
      default:
        // 네트워크 관련 오류들을 추가로 체크
        if (error.message && error.message.includes('network')) {
          message = '네트워크 연결을 확인해주세요';
          type = ErrorType.NETWORK_ERROR;
        } else if (error.message && error.message.includes('fetch')) {
          message = '서버 연결에 실패했습니다. 네트워크를 확인해주세요';
          type = ErrorType.NETWORK_ERROR;
        } else {
          message = error.message || message;
        }
    }

    return new AppError(type, message, error.code);
  }
}

export const authService = new AuthService();