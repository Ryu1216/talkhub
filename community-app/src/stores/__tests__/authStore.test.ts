import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '../authStore';
import { authService, UserProfile } from '../../services/authService';
import { AppError, ErrorType } from '../../types';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase services
jest.mock('../../services/authService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    onAuthStateChanged: jest.fn(),
    getUserProfile: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.initialized).toBe(false);
    });
  });

  describe('State Setters', () => {
    test('should set loading state correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.loading).toBe(true);
    });

    test('should set initialized state correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setInitialized(true);
      });
      
      expect(result.current.initialized).toBe(true);
    });

    test('should set error correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      const error = new AppError(ErrorType.AUTH_ERROR, 'Test error');
      
      act(() => {
        result.current.setError(error);
      });
      
      expect(result.current.error).toEqual(error);
      expect(result.current.loading).toBe(false);
    });

    test('should clear error correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      
      // First set an error
      act(() => {
        result.current.setError(new AppError(ErrorType.AUTH_ERROR, 'Test error'));
      });
      
      expect(result.current.error).not.toBeNull();
      
      // Then clear it
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });

    test('should set user and authentication state correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };
      
      act(() => {
        result.current.setUser(mockUser);
      });
      
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    test('should clear user when set to null', () => {
      const { result } = renderHook(() => useAuthStore());
      
      // First set a user
      act(() => {
        result.current.setUser({
          uid: 'test-uid',
          email: 'test@example.com',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        });
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      
      // Then clear it
      act(() => {
        result.current.setUser(null);
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    test('should reset state correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      
      // Set some state
      act(() => {
        result.current.setLoading(true);
        result.current.setUser({
          uid: 'test-uid',
          email: 'test@example.com',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        });
        result.current.setError(new AppError(ErrorType.AUTH_ERROR, 'Test error'));
        result.current.setInitialized(true);
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.initialized).toBe(false);
    });
  });

  describe('Login Action', () => {
    test('should login successfully', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockUserProfile: UserProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockAuthService.login.mockResolvedValue(mockUserProfile);
      
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });
      
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result.current.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should handle login error', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const error = new AppError(ErrorType.AUTH_ERROR, 'Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);
      
      await act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(error);
    });

    test('should set loading state during login', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      let resolveLogin: (value: UserProfile) => void;
      const loginPromise = new Promise<UserProfile>((resolve) => {
        resolveLogin = resolve;
      });
      
      mockAuthService.login.mockReturnValue(loginPromise);
      
      // Start login
      act(() => {
        result.current.login('test@example.com', 'password123');
      });
      
      // Should be loading
      expect(result.current.loading).toBe(true);
      
      // Resolve login
      await act(async () => {
        resolveLogin!({
          uid: 'test-uid',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await loginPromise;
      });
      
      // Should not be loading anymore
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Register Action', () => {
    test('should register successfully', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockUserProfile: UserProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockAuthService.register.mockResolvedValue(mockUserProfile);
      
      await act(async () => {
        await result.current.register('test@example.com', 'password123');
      });
      
      expect(mockAuthService.register).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result.current.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should handle register error', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const error = new AppError(ErrorType.VALIDATION_ERROR, 'Email already in use');
      mockAuthService.register.mockRejectedValue(error);
      
      await act(async () => {
        await result.current.register('test@example.com', 'password123');
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(error);
    });
  });

  describe('Logout Action', () => {
    test('should logout successfully', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      // First set a user
      act(() => {
        result.current.setUser({
          uid: 'test-uid',
          email: 'test@example.com',
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        });
        result.current.setInitialized(true);
      });
      
      mockAuthService.logout.mockResolvedValue();
      
      await act(async () => {
        await result.current.logout();
      });
      
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.initialized).toBe(true); // Should keep initialized state
    });

    test('should handle logout error', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const error = new AppError(ErrorType.NETWORK_ERROR, 'Network error');
      mockAuthService.logout.mockRejectedValue(error);
      
      await act(async () => {
        await result.current.logout();
      });
      
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(error);
    });
  });

  describe('Auth Initialization', () => {
    test('should initialize auth state listener', () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockUnsubscribe = jest.fn();
      mockAuthService.onAuthStateChanged.mockReturnValue(mockUnsubscribe);
      
      act(() => {
        const unsubscribe = result.current.initializeAuth();
        expect(typeof unsubscribe).toBe('function');
      });
      
      expect(mockAuthService.onAuthStateChanged).toHaveBeenCalled();
    });

    test('should handle auth state changes with existing user profile', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockFirebaseUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      } as any;
      
      const mockUserProfile: UserProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockAuthService.getUserProfile.mockResolvedValue(mockUserProfile);
      
      let authStateCallback: (user: any) => void;
      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn();
      });
      
      act(() => {
        result.current.initializeAuth();
      });
      
      // Simulate auth state change
      await act(async () => {
        await authStateCallback(mockFirebaseUser);
      });
      
      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith('test-uid');
      expect(result.current.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.initialized).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    test('should handle auth state changes with no user profile', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockFirebaseUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: null,
        photoURL: null,
      } as any;
      
      mockAuthService.getUserProfile.mockResolvedValue(null);
      
      let authStateCallback: (user: any) => void;
      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn();
      });
      
      act(() => {
        result.current.initializeAuth();
      });
      
      // Simulate auth state change
      await act(async () => {
        await authStateCallback(mockFirebaseUser);
      });
      
      expect(result.current.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: undefined,
        photoURL: undefined,
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    test('should handle auth state changes with null user', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      let authStateCallback: (user: any) => void;
      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn();
      });
      
      act(() => {
        result.current.initializeAuth();
      });
      
      // Simulate auth state change with null user (logged out)
      await act(async () => {
        await authStateCallback(null);
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.initialized).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    test('should handle auth state change errors', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockFirebaseUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      } as any;
      
      mockAuthService.getUserProfile.mockRejectedValue(new Error('Profile fetch failed'));
      
      let authStateCallback: (user: any) => void;
      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn();
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      act(() => {
        result.current.initializeAuth();
      });
      
      // Simulate auth state change with error
      await act(async () => {
        await authStateCallback(mockFirebaseUser);
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Auth state change error:', expect.any(Error));
      expect(result.current.user).toBeNull();
      expect(result.current.initialized).toBe(true);
      expect(result.current.loading).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Scenarios', () => {
    test('should handle network errors during login', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Network connection failed');
      mockAuthService.login.mockRejectedValue(networkError);
      
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });
      
      expect(result.current.error).toEqual(networkError);
      expect(result.current.error?.type).toBe(ErrorType.NETWORK_ERROR);
    });

    test('should handle validation errors during register', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Weak password');
      mockAuthService.register.mockRejectedValue(validationError);
      
      await act(async () => {
        await result.current.register('test@example.com', '123');
      });
      
      expect(result.current.error).toEqual(validationError);
      expect(result.current.error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });
  });
});