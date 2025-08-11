import { AppError, ErrorType } from '../types/error';

/**
 * Fallback auth service for when Firebase is not available
 */
export interface MockUserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

class AuthServiceFallback {
  private mockUsers: Map<string, { email: string; password: string; profile: MockUserProfile }> = new Map();
  private currentUser: MockUserProfile | null = null;

  /**
   * Mock register function
   */
  async register(email: string, password: string): Promise<MockUserProfile> {
    console.log('Using fallback auth service for registration');
    
    // Check if user already exists
    if (this.mockUsers.has(email)) {
      throw new AppError(
        ErrorType.AUTH_ERROR,
        '이미 사용 중인 이메일입니다',
        'auth/email-already-in-use'
      );
    }

    // Create mock user
    const userProfile: MockUserProfile = {
      uid: `mock-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      photoURL: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockUsers.set(email, { email, password, profile: userProfile });
    this.currentUser = userProfile;

    return userProfile;
  }

  /**
   * Mock login function
   */
  async login(email: string, password: string): Promise<MockUserProfile> {
    console.log('Using fallback auth service for login');
    
    const user = this.mockUsers.get(email);
    if (!user || user.password !== password) {
      throw new AppError(
        ErrorType.AUTH_ERROR,
        '이메일 또는 비밀번호가 올바르지 않습니다',
        'auth/invalid-credentials'
      );
    }

    this.currentUser = user.profile;
    return user.profile;
  }

  /**
   * Mock logout function
   */
  async logout(): Promise<void> {
    console.log('Using fallback auth service for logout');
    this.currentUser = null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): MockUserProfile | null {
    return this.currentUser;
  }
}

export const authServiceFallback = new AuthServiceFallback();