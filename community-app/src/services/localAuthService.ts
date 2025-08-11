import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppError, ErrorType } from '../types/error';

export interface LocalUserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

const USERS_KEY = 'local_users';
const CURRENT_USER_KEY = 'current_user';

class LocalAuthService {
  /**
   * Generate a simple UID
   */
  private generateUID(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get all stored users
   */
  private async getStoredUsers(): Promise<Record<string, LocalUserProfile>> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : {};
    } catch (error) {
      console.error('Failed to get stored users:', error);
      return {};
    }
  }

  /**
   * Save users to storage
   */
  private async saveUsers(users: Record<string, LocalUserProfile>): Promise<void> {
    try {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save users:', error);
      throw new AppError(ErrorType.UNKNOWN_ERROR, '사용자 정보 저장에 실패했습니다');
    }
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<LocalUserProfile> {
    try {
      console.log('Local auth: Registering user with email:', email);

      // Basic validation
      if (!email || !password) {
        throw new AppError(ErrorType.VALIDATION_ERROR, '이메일과 비밀번호를 입력해주세요');
      }

      if (password.length < 6) {
        throw new AppError(ErrorType.VALIDATION_ERROR, '비밀번호는 최소 6자 이상이어야 합니다');
      }

      const users = await this.getStoredUsers();

      // Check if user already exists
      const existingUser = Object.values(users).find(user => user.email === email);
      if (existingUser) {
        throw new AppError(ErrorType.AUTH_ERROR, '이미 사용 중인 이메일입니다');
      }

      // Create new user
      const newUser: LocalUserProfile = {
        uid: this.generateUID(),
        email,
        displayName: undefined,
        photoURL: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store password separately (in real app, this should be hashed)
      users[newUser.uid] = newUser;
      await this.saveUsers(users);

      // Store password (simplified - in real app, use proper hashing)
      await AsyncStorage.setItem(`password_${newUser.uid}`, password);

      // Set as current user
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

      console.log('Local auth: User registered successfully:', newUser.uid);
      return newUser;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Local auth registration failed:', error);
      throw new AppError(ErrorType.UNKNOWN_ERROR, '회원가입에 실패했습니다');
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<LocalUserProfile> {
    try {
      console.log('Local auth: Logging in user with email:', email);

      // Basic validation
      if (!email || !password) {
        throw new AppError(ErrorType.VALIDATION_ERROR, '이메일과 비밀번호를 입력해주세요');
      }

      const users = await this.getStoredUsers();

      // Find user by email
      const user = Object.values(users).find(user => user.email === email);
      if (!user) {
        throw new AppError(ErrorType.AUTH_ERROR, '해당 이메일로 등록된 사용자를 찾을 수 없습니다');
      }

      // Check password (simplified - in real app, use proper hashing)
      const storedPassword = await AsyncStorage.getItem(`password_${user.uid}`);
      if (storedPassword !== password) {
        throw new AppError(ErrorType.AUTH_ERROR, '비밀번호가 올바르지 않습니다');
      }

      // Set as current user
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

      console.log('Local auth: User logged in successfully:', user.uid);
      return user;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Local auth login failed:', error);
      throw new AppError(ErrorType.UNKNOWN_ERROR, '로그인에 실패했습니다');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      console.log('Local auth: User logged out successfully');
    } catch (error) {
      console.error('Local auth logout failed:', error);
      throw new AppError(ErrorType.UNKNOWN_ERROR, '로그아웃에 실패했습니다');
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<LocalUserProfile | null> {
    try {
      const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        user.updatedAt = new Date(user.updatedAt);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }
}

export const localAuthService = new LocalAuthService();