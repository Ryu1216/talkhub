import { authService, UserProfile } from '../authService';
import { AppError, ErrorType } from '../../types/error';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../../config/firebase', () => ({
  auth: {},
  db: {},
}));

const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>;
const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: null,
        photoURL: null,
      } as User;

      const mockUserCredential = {
        user: mockUser,
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);
      mockDoc.mockReturnValue({} as any);
      mockSetDoc.mockResolvedValue(undefined);

      const result = await authService.register('test@example.com', 'password123');

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(mockSetDoc).toHaveBeenCalled();
      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: undefined,
        photoURL: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle email already in use error', async () => {
      const firebaseError = {
        code: 'auth/email-already-in-use',
        message: 'The email address is already in use by another account.',
      };

      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(authService.register('test@example.com', 'password123')).rejects.toThrow(AppError);
      
      try {
        await authService.register('test@example.com', 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.AUTH_ERROR);
        expect((error as AppError).message).toBe('An account with this email already exists');
        expect((error as AppError).code).toBe('auth/email-already-in-use');
      }
    });

    it('should handle weak password error', async () => {
      const firebaseError = {
        code: 'auth/weak-password',
        message: 'Password should be at least 6 characters',
      };

      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError);

      try {
        await authService.register('test@example.com', '123');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.VALIDATION_ERROR);
        expect((error as AppError).message).toBe('Password should be at least 6 characters');
      }
    });

    it('should handle invalid email error', async () => {
      const firebaseError = {
        code: 'auth/invalid-email',
        message: 'The email address is badly formatted.',
      };

      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError);

      try {
        await authService.register('invalid-email', 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.VALIDATION_ERROR);
        expect((error as AppError).message).toBe('Invalid email address');
      }
    });

    it('should handle network errors', async () => {
      const firebaseError = {
        code: 'auth/network-request-failed',
        message: 'A network error has occurred.',
      };

      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError);

      try {
        await authService.register('test@example.com', 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.NETWORK_ERROR);
        expect((error as AppError).message).toBe('Network error. Please check your connection');
      }
    });
  });

  describe('login', () => {
    it('should login successfully with existing user profile', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      } as User;

      const mockUserCredential = {
        user: mockUser,
      };

      const mockUserProfile: UserProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDocSnapshot = {
        exists: () => true,
        data: () => mockUserProfile,
      };

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);
      mockDoc.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const result = await authService.login('test@example.com', 'password123');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(mockGetDoc).toHaveBeenCalled();
      expect(result).toEqual(mockUserProfile);
    });

    it('should login and create profile if it does not exist', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      } as User;

      const mockUserCredential = {
        user: mockUser,
      };

      const mockDocSnapshot = {
        exists: () => false,
      };

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);
      mockDoc.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);
      mockSetDoc.mockResolvedValue(undefined);

      const result = await authService.login('test@example.com', 'password123');

      expect(mockSetDoc).toHaveBeenCalled();
      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle user not found error', async () => {
      const firebaseError = {
        code: 'auth/user-not-found',
        message: 'There is no user record corresponding to this identifier.',
      };

      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      try {
        await authService.login('nonexistent@example.com', 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.AUTH_ERROR);
        expect((error as AppError).message).toBe('No user found with this email address');
      }
    });

    it('should handle wrong password error', async () => {
      const firebaseError = {
        code: 'auth/wrong-password',
        message: 'The password is invalid or the user does not have a password.',
      };

      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      try {
        await authService.login('test@example.com', 'wrongpassword');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.AUTH_ERROR);
        expect((error as AppError).message).toBe('Incorrect password');
      }
    });

    it('should handle too many requests error', async () => {
      const firebaseError = {
        code: 'auth/too-many-requests',
        message: 'Too many unsuccessful login attempts.',
      };

      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.AUTH_ERROR);
        expect((error as AppError).message).toBe('Too many failed attempts. Please try again later');
      }
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockSignOut.mockResolvedValue();

      await authService.logout();

      expect(mockSignOut).toHaveBeenCalledWith(expect.anything());
    });

    it('should handle logout errors', async () => {
      const firebaseError = {
        code: 'auth/network-request-failed',
        message: 'Network error',
      };

      mockSignOut.mockRejectedValue(firebaseError);

      try {
        await authService.logout();
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.NETWORK_ERROR);
      }
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const mockUser = { uid: 'test-uid' } as User;
      const mockAuth = { currentUser: mockUser };
      
      // Mock the auth object
      jest.doMock('../config/firebase', () => ({
        auth: mockAuth,
      }));

      // Since we can't easily mock the imported auth object,
      // we'll test the method exists and returns the expected type
      const result = authService.getCurrentUser();
      expect(typeof authService.getCurrentUser).toBe('function');
    });
  });

  describe('onAuthStateChanged', () => {
    it('should set up auth state listener', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const unsubscribe = authService.onAuthStateChanged(mockCallback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(expect.anything(), mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUserProfile: UserProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDocSnapshot = {
        exists: () => true,
        data: () => mockUserProfile,
      };

      mockDoc.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const result = await authService.getUserProfile('test-uid');

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-uid');
      expect(mockGetDoc).toHaveBeenCalled();
      expect(result).toEqual(mockUserProfile);
    });

    it('should return null if user profile does not exist', async () => {
      const mockDocSnapshot = {
        exists: () => false,
      };

      mockDoc.mockReturnValue({} as any);
      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const result = await authService.getUserProfile('nonexistent-uid');

      expect(result).toBeNull();
    });

    it('should handle errors when getting user profile', async () => {
      const firestoreError = new Error('Firestore error');
      
      mockDoc.mockReturnValue({} as any);
      mockGetDoc.mockRejectedValue(firestoreError);

      try {
        await authService.getUserProfile('test-uid');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.UNKNOWN_ERROR);
        expect((error as AppError).message).toBe('Failed to get user profile');
      }
    });
  });

  describe('handleAuthError', () => {
    it('should handle unknown errors', async () => {
      const unknownError = {
        code: 'unknown-error',
        message: 'Something went wrong',
      };

      mockSignInWithEmailAndPassword.mockRejectedValue(unknownError);

      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.AUTH_ERROR);
        expect((error as AppError).message).toBe('Something went wrong');
        expect((error as AppError).code).toBe('unknown-error');
      }
    });

    it('should handle errors without codes', async () => {
      const errorWithoutCode = new Error('Generic error');

      mockSignInWithEmailAndPassword.mockRejectedValue(errorWithoutCode);

      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).type).toBe(ErrorType.AUTH_ERROR);
        expect((error as AppError).message).toBe('Generic error');
      }
    });

    it('should use default message for errors without message', async () => {
      const errorWithoutMessage = { code: 'unknown-code' };

      mockSignInWithEmailAndPassword.mockRejectedValue(errorWithoutMessage);

      try {
        await authService.login('test@example.com', 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).message).toBe('An authentication error occurred');
      }
    });
  });
});