/**
 * Authentication Error Scenarios Tests
 * 
 * This test suite covers comprehensive error handling scenarios
 * for the authentication system, including edge cases and recovery.
 * 
 * Requirements covered:
 * - 1.2: Login/register error handling
 * - 1.3: Form validation errors
 * - 1.5: Error recovery and user feedback
 */

import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { AppError, ErrorType } from '../types';

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

describe('Authentication Error Scenarios', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('Login Error Scenarios', () => {
    test('should handle invalid email format error', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Invalid email format');
      mockAuthService.login.mockRejectedValue(validationError);

      const { login } = useAuthStore.getState();
      await login('invalid-email', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(state.error?.message).toBe('Invalid email format');
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });

    test('should handle user not found error', async () => {
      const authError = new AppError(ErrorType.AUTH_ERROR, 'User not found');
      mockAuthService.login.mockRejectedValue(authError);

      const { login } = useAuthStore.getState();
      await login('nonexistent@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.AUTH_ERROR);
      expect(state.error?.message).toBe('User not found');
    });

    test('should handle wrong password error', async () => {
      const authError = new AppError(ErrorType.AUTH_ERROR, 'Wrong password');
      mockAuthService.login.mockRejectedValue(authError);

      const { login } = useAuthStore.getState();
      await login('user@example.com', 'wrongpassword');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.AUTH_ERROR);
      expect(state.error?.message).toBe('Wrong password');
    });

    test('should handle account disabled error', async () => {
      const authError = new AppError(ErrorType.AUTH_ERROR, 'User account has been disabled');
      mockAuthService.login.mockRejectedValue(authError);

      const { login } = useAuthStore.getState();
      await login('disabled@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.AUTH_ERROR);
      expect(state.error?.message).toBe('User account has been disabled');
    });

    test('should handle too many requests error', async () => {
      const authError = new AppError(ErrorType.AUTH_ERROR, 'Too many unsuccessful login attempts. Please try again later.');
      mockAuthService.login.mockRejectedValue(authError);

      const { login } = useAuthStore.getState();
      await login('user@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.AUTH_ERROR);
      expect(state.error?.message).toBe('Too many unsuccessful login attempts. Please try again later.');
    });

    test('should handle network timeout error', async () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Request timeout');
      mockAuthService.login.mockRejectedValue(networkError);

      const { login } = useAuthStore.getState();
      await login('user@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.NETWORK_ERROR);
      expect(state.error?.message).toBe('Request timeout');
    });

    test('should handle offline error', async () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'No internet connection');
      mockAuthService.login.mockRejectedValue(networkError);

      const { login } = useAuthStore.getState();
      await login('user@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.NETWORK_ERROR);
      expect(state.error?.message).toBe('No internet connection');
    });
  });

  describe('Registration Error Scenarios', () => {
    test('should handle email already in use error', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'The email address is already in use by another account');
      mockAuthService.register.mockRejectedValue(validationError);

      const { register } = useAuthStore.getState();
      await register('existing@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(state.error?.message).toBe('The email address is already in use by another account');
    });

    test('should handle weak password error', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Password should be at least 6 characters');
      mockAuthService.register.mockRejectedValue(validationError);

      const { register } = useAuthStore.getState();
      await register('user@example.com', '123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(state.error?.message).toBe('Password should be at least 6 characters');
    });

    test('should handle invalid email error during registration', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'The email address is badly formatted');
      mockAuthService.register.mockRejectedValue(validationError);

      const { register } = useAuthStore.getState();
      await register('invalid.email', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(state.error?.message).toBe('The email address is badly formatted');
    });

    test('should handle operation not allowed error', async () => {
      const authError = new AppError(ErrorType.AUTH_ERROR, 'Email/password accounts are not enabled');
      mockAuthService.register.mockRejectedValue(authError);

      const { register } = useAuthStore.getState();
      await register('user@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.AUTH_ERROR);
      expect(state.error?.message).toBe('Email/password accounts are not enabled');
    });
  });

  describe('Logout Error Scenarios', () => {
    test('should handle logout network error', async () => {
      const { setUser, logout } = useAuthStore.getState();
      
      // Set authenticated state
      setUser({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      });

      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Failed to logout');
      mockAuthService.logout.mockRejectedValue(networkError);

      await logout();

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.NETWORK_ERROR);
      expect(state.error?.message).toBe('Failed to logout');
      expect(state.loading).toBe(false);
    });

    test('should handle logout when already logged out', async () => {
      const authError = new AppError(ErrorType.AUTH_ERROR, 'No user is currently signed in');
      mockAuthService.logout.mockRejectedValue(authError);

      const { logout } = useAuthStore.getState();
      await logout();

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.AUTH_ERROR);
    });
  });

  describe('Auth State Change Error Scenarios', () => {
    test('should handle user profile fetch error during auth state change', async () => {
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

    test('should handle auth state listener setup error', () => {
      const error = new Error('Failed to setup auth listener');
      mockAuthService.onAuthStateChanged.mockImplementation(() => {
        throw error;
      });

      const { initializeAuth } = useAuthStore.getState();
      
      expect(() => initializeAuth()).toThrow('Failed to setup auth listener');
    });
  });

  describe('Permission Error Scenarios', () => {
    test('should handle insufficient permissions error', async () => {
      const permissionError = new AppError(ErrorType.PERMISSION_ERROR, 'Insufficient permissions');
      mockAuthService.login.mockRejectedValue(permissionError);

      const { login } = useAuthStore.getState();
      await login('user@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.PERMISSION_ERROR);
      expect(state.error?.message).toBe('Insufficient permissions');
    });

    test('should handle access denied error', async () => {
      const permissionError = new AppError(ErrorType.PERMISSION_ERROR, 'Access denied');
      mockAuthService.register.mockRejectedValue(permissionError);

      const { register } = useAuthStore.getState();
      await register('user@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.PERMISSION_ERROR);
    });
  });

  describe('Unknown Error Scenarios', () => {
    test('should handle unexpected errors during login', async () => {
      const unknownError = new AppError(ErrorType.UNKNOWN_ERROR, 'An unexpected error occurred');
      mockAuthService.login.mockRejectedValue(unknownError);

      const { login } = useAuthStore.getState();
      await login('user@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error?.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(state.error?.message).toBe('An unexpected error occurred');
    });

    test('should handle non-AppError exceptions', async () => {
      const genericError = new Error('Generic error');
      mockAuthService.login.mockRejectedValue(genericError);

      const { login } = useAuthStore.getState();
      await login('user@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error).toEqual(genericError);
      expect(state.loading).toBe(false);
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('should recover from error after successful operation', async () => {
      const { login, clearError } = useAuthStore.getState();

      // First, cause an error
      const authError = new AppError(ErrorType.AUTH_ERROR, 'Login failed');
      mockAuthService.login.mockRejectedValue(authError);
      
      await login('user@example.com', 'wrongpassword');
      expect(useAuthStore.getState().error).toEqual(authError);

      // Clear error
      clearError();
      expect(useAuthStore.getState().error).toBeNull();

      // Then succeed
      const mockUser = {
        uid: 'recovery-user',
        email: 'user@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockAuthService.login.mockResolvedValue(mockUser);

      await login('user@example.com', 'correctpassword');

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('user@example.com');
    });

    test('should handle error clearing during form input', () => {
      const { setError, clearError } = useAuthStore.getState();

      // Set multiple errors
      const error1 = new AppError(ErrorType.AUTH_ERROR, 'Error 1');
      setError(error1);
      expect(useAuthStore.getState().error).toEqual(error1);

      const error2 = new AppError(ErrorType.VALIDATION_ERROR, 'Error 2');
      setError(error2);
      expect(useAuthStore.getState().error).toEqual(error2);

      // Clear error
      clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });

    test('should handle retry after network error', async () => {
      const { login } = useAuthStore.getState();

      // First attempt - network error
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Network failed');
      mockAuthService.login.mockRejectedValueOnce(networkError);

      await login('user@example.com', 'password123');
      expect(useAuthStore.getState().error?.type).toBe(ErrorType.NETWORK_ERROR);

      // Second attempt - success
      const mockUser = {
        uid: 'retry-user',
        email: 'user@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockAuthService.login.mockResolvedValue(mockUser);

      await login('user@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('Concurrent Error Scenarios', () => {
    test('should handle multiple simultaneous login attempts with errors', async () => {
      const error1 = new AppError(ErrorType.AUTH_ERROR, 'Error 1');
      const error2 = new AppError(ErrorType.NETWORK_ERROR, 'Error 2');

      mockAuthService.login
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2);

      const { login } = useAuthStore.getState();

      // Simultaneous attempts
      const promise1 = login('user1@example.com', 'password');
      const promise2 = login('user2@example.com', 'password');

      await Promise.all([promise1, promise2]);

      // Should have the last error
      const state = useAuthStore.getState();
      expect(state.error).toBeDefined();
      expect(state.loading).toBe(false);
    });

    test('should handle error during loading state', async () => {
      let rejectLogin: any;
      const loginPromise = new Promise((_, reject) => {
        rejectLogin = reject;
      });

      mockAuthService.login.mockReturnValue(loginPromise);

      const { login } = useAuthStore.getState();
      
      // Start login
      const loginCall = login('user@example.com', 'password');
      
      // Should be loading
      expect(useAuthStore.getState().loading).toBe(true);

      // Reject with error
      const error = new AppError(ErrorType.AUTH_ERROR, 'Login failed');
      rejectLogin(error);

      await loginCall;

      // Should not be loading and should have error
      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toEqual(error);
    });
  });

  describe('Error Message Formatting', () => {
    test('should preserve error message formatting', async () => {
      const formattedError = new AppError(
        ErrorType.VALIDATION_ERROR, 
        'Password must contain:\n- At least 6 characters\n- One uppercase letter\n- One number'
      );
      mockAuthService.register.mockRejectedValue(formattedError);

      const { register } = useAuthStore.getState();
      await register('user@example.com', 'weak');

      const state = useAuthStore.getState();
      expect(state.error?.message).toBe('Password must contain:\n- At least 6 characters\n- One uppercase letter\n- One number');
    });

    test('should handle empty error messages', async () => {
      const emptyError = new AppError(ErrorType.UNKNOWN_ERROR, '');
      mockAuthService.login.mockRejectedValue(emptyError);

      const { login } = useAuthStore.getState();
      await login('user@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.error?.message).toBe('');
      expect(state.error?.type).toBe(ErrorType.UNKNOWN_ERROR);
    });
  });
});