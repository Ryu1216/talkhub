/**
 * Authentication Flow Integration Tests
 * 
 * This test suite covers the complete authentication flow integration
 * including login/register components, AuthStore actions, and error handling scenarios.
 * 
 * Requirements covered:
 * - 1.1: User authentication system
 * - 1.2: Login/register error handling
 * - 1.3: Form validation
 * - 1.5: Authentication state persistence
 */

import { useAuthStore } from '../stores/authStore';
import { authService, UserProfile } from '../services/authService';
import { AppError, ErrorType } from '../types';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase services
jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    onAuthStateChanged: jest.fn(),
    getUserProfile: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('Complete Login Flow', () => {
    test('should complete successful login flow with user profile', async () => {
      const mockUserProfile: UserProfile = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.login.mockResolvedValue(mockUserProfile);

      const { login } = useAuthStore.getState();
      
      // Verify initial state
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);

      // Execute login
      await login('test@example.com', 'password123');

      // Verify final state
      const finalState = useAuthStore.getState();
      expect(finalState.isAuthenticated).toBe(true);
      expect(finalState.user).toEqual({
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
      expect(finalState.loading).toBe(false);
      expect(finalState.error).toBeNull();
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    test('should handle login with invalid credentials', async () => {
      const authError = new AppError(ErrorType.AUTH_ERROR, 'Invalid email or password');
      mockAuthService.login.mockRejectedValue(authError);

      const { login } = useAuthStore.getState();
      
      await login('invalid@example.com', 'wrongpassword');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toEqual(authError);
      expect(state.error?.type).toBe(ErrorType.AUTH_ERROR);
    });

    test('should handle login with network error', async () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Network connection failed');
      mockAuthService.login.mockRejectedValue(networkError);

      const { login } = useAuthStore.getState();
      
      await login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error).toEqual(networkError);
      expect(state.error?.type).toBe(ErrorType.NETWORK_ERROR);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Complete Registration Flow', () => {
    test('should complete successful registration flow', async () => {
      const mockUserProfile: UserProfile = {
        uid: 'new-user-123',
        email: 'newuser@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.register.mockResolvedValue(mockUserProfile);

      const { register } = useAuthStore.getState();
      
      await register('newuser@example.com', 'securepassword123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({
        uid: 'new-user-123',
        email: 'newuser@example.com',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockAuthService.register).toHaveBeenCalledWith('newuser@example.com', 'securepassword123');
    });

    test('should handle registration with existing email', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Email already in use');
      mockAuthService.register.mockRejectedValue(validationError);

      const { register } = useAuthStore.getState();
      
      await register('existing@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toEqual(validationError);
      expect(state.error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });

    test('should handle registration with weak password', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Password should be at least 6 characters');
      mockAuthService.register.mockRejectedValue(validationError);

      const { register } = useAuthStore.getState();
      
      await register('test@example.com', '123');

      const state = useAuthStore.getState();
      expect(state.error).toEqual(validationError);
      expect(state.error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });
  });

  describe('Complete Logout Flow', () => {
    test('should complete successful logout flow', async () => {
      const { setUser, setInitialized, logout } = useAuthStore.getState();
      
      // Set up authenticated state
      setUser({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      setInitialized(true);

      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      mockAuthService.logout.mockResolvedValue();

      await logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.initialized).toBe(true); // Should remain initialized
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    test('should handle logout error gracefully', async () => {
      const { setUser, logout } = useAuthStore.getState();
      
      // Set up authenticated state
      setUser({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });

      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Failed to logout');
      mockAuthService.logout.mockRejectedValue(networkError);

      await logout();

      const state = useAuthStore.getState();
      expect(state.error).toEqual(networkError);
      expect(state.loading).toBe(false);
    });
  });

  describe('Authentication State Persistence', () => {
    test('should initialize auth state with existing user', async () => {
      const mockFirebaseUser = {
        uid: 'existing-user',
        email: 'existing@example.com',
        displayName: 'Existing User',
        photoURL: null,
      } as any;

      const mockUserProfile: UserProfile = {
        uid: 'existing-user',
        email: 'existing@example.com',
        displayName: 'Existing User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.getUserProfile.mockResolvedValue(mockUserProfile);

      let authStateCallback: (user: any) => void;
      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn(); // unsubscribe function
      });

      const { initializeAuth } = useAuthStore.getState();
      initializeAuth();

      // Simulate Firebase auth state change
      await authStateCallback!(mockFirebaseUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        uid: 'existing-user',
        email: 'existing@example.com',
        displayName: 'Existing User',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
      expect(state.isAuthenticated).toBe(true);
      expect(state.initialized).toBe(true);
      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith('existing-user');
    });

    test('should handle auth state change with no user profile', async () => {
      const mockFirebaseUser = {
        uid: 'new-firebase-user',
        email: 'new@example.com',
        displayName: null,
        photoURL: null,
      } as any;

      mockAuthService.getUserProfile.mockResolvedValue(null);

      let authStateCallback: (user: any) => void;
      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn();
      });

      const { initializeAuth } = useAuthStore.getState();
      initializeAuth();

      await authStateCallback!(mockFirebaseUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        uid: 'new-firebase-user',
        email: 'new@example.com',
        displayName: undefined,
        photoURL: undefined,
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
      expect(state.isAuthenticated).toBe(true);
    });

    test('should handle auth state change with null user (logout)', async () => {
      const { setUser } = useAuthStore.getState();
      
      // Set initial authenticated state
      setUser({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });

      let authStateCallback: (user: any) => void;
      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn();
      });

      const { initializeAuth } = useAuthStore.getState();
      initializeAuth();

      // Simulate user logout
      await authStateCallback!(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.initialized).toBe(true);
    });
  });

  describe('Error Handling Scenarios', () => {
    test('should handle multiple error types correctly', async () => {
      const { login, register, clearError } = useAuthStore.getState();

      // Test AUTH_ERROR
      const authError = new AppError(ErrorType.AUTH_ERROR, 'Authentication failed');
      mockAuthService.login.mockRejectedValue(authError);
      
      await login('test@example.com', 'wrong');
      expect(useAuthStore.getState().error?.type).toBe(ErrorType.AUTH_ERROR);

      // Clear error
      clearError();
      expect(useAuthStore.getState().error).toBeNull();

      // Test VALIDATION_ERROR
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Invalid input');
      mockAuthService.register.mockRejectedValue(validationError);
      
      await register('invalid', 'weak');
      expect(useAuthStore.getState().error?.type).toBe(ErrorType.VALIDATION_ERROR);

      // Clear error
      clearError();
      expect(useAuthStore.getState().error).toBeNull();

      // Test NETWORK_ERROR
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Connection failed');
      mockAuthService.login.mockRejectedValue(networkError);
      
      await login('test@example.com', 'password');
      expect(useAuthStore.getState().error?.type).toBe(ErrorType.NETWORK_ERROR);
    });

    test('should handle auth initialization errors', async () => {
      const mockFirebaseUser = {
        uid: 'error-user',
        email: 'error@example.com',
      } as any;

      mockAuthService.getUserProfile.mockRejectedValue(new Error('Profile fetch failed'));

      let authStateCallback: (user: any) => void;
      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn();
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { initializeAuth } = useAuthStore.getState();
      initializeAuth();

      await authStateCallback!(mockFirebaseUser);

      expect(consoleSpy).toHaveBeenCalledWith('Auth state change error:', expect.any(Error));
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.initialized).toBe(true);

      consoleSpy.mockRestore();
    });

    test('should handle permission errors', async () => {
      const permissionError = new AppError(ErrorType.PERMISSION_ERROR, 'Access denied');
      mockAuthService.login.mockRejectedValue(permissionError);

      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.PERMISSION_ERROR);
      expect(state.error?.message).toBe('Access denied');
    });

    test('should handle unknown errors', async () => {
      const unknownError = new AppError(ErrorType.UNKNOWN_ERROR, 'Something went wrong');
      mockAuthService.register.mockRejectedValue(unknownError);

      const { register } = useAuthStore.getState();
      await register('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.UNKNOWN_ERROR);
    });
  });

  describe('Loading State Management', () => {
    test('should manage loading state during login', async () => {
      let resolveLogin: (value: UserProfile) => void;
      const loginPromise = new Promise<UserProfile>((resolve) => {
        resolveLogin = resolve;
      });

      mockAuthService.login.mockReturnValue(loginPromise);

      const { login } = useAuthStore.getState();
      
      // Start login (don't await yet)
      const loginCall = login('test@example.com', 'password');
      
      // Should be loading
      expect(useAuthStore.getState().loading).toBe(true);

      // Resolve login
      resolveLogin!({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await loginCall;

      // Should not be loading anymore
      expect(useAuthStore.getState().loading).toBe(false);
    });

    test('should manage loading state during registration', async () => {
      let resolveRegister: (value: UserProfile) => void;
      const registerPromise = new Promise<UserProfile>((resolve) => {
        resolveRegister = resolve;
      });

      mockAuthService.register.mockReturnValue(registerPromise);

      const { register } = useAuthStore.getState();
      
      const registerCall = register('test@example.com', 'password');
      expect(useAuthStore.getState().loading).toBe(true);

      resolveRegister!({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await registerCall;
      expect(useAuthStore.getState().loading).toBe(false);
    });

    test('should clear loading state on error', async () => {
      const error = new AppError(ErrorType.AUTH_ERROR, 'Login failed');
      mockAuthService.login.mockRejectedValue(error);

      const { login } = useAuthStore.getState();
      await login('test@example.com', 'wrong');

      expect(useAuthStore.getState().loading).toBe(false);
      expect(useAuthStore.getState().error).toEqual(error);
    });
  });

  describe('State Consistency', () => {
    test('should maintain consistent state during multiple operations', async () => {
      const { login, logout, register, clearError } = useAuthStore.getState();

      // Test registration
      mockAuthService.register.mockResolvedValue({
        uid: 'user1',
        email: 'user1@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await register('user1@example.com', 'password');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Test logout
      mockAuthService.logout.mockResolvedValue();
      await logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);

      // Test login
      mockAuthService.login.mockResolvedValue({
        uid: 'user2',
        email: 'user2@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await login('user2@example.com', 'password');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('user2@example.com');
    });

    test('should handle rapid state changes', async () => {
      const { setUser, setError, clearError, setLoading } = useAuthStore.getState();

      // Rapid state changes
      setLoading(true);
      setError(new AppError(ErrorType.AUTH_ERROR, 'Error 1'));
      clearError();
      setUser({
        uid: 'rapid-user',
        email: 'rapid@example.com',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      setLoading(false);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.uid).toBe('rapid-user');
    });
  });
});