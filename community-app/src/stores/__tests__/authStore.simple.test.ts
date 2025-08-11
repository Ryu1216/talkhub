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

describe('AuthStore - Core Functionality', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.initialized).toBe(false);
    });
  });

  describe('State Management', () => {
    test('should set loading state', () => {
      const { setLoading } = useAuthStore.getState();
      
      setLoading(true);
      expect(useAuthStore.getState().loading).toBe(true);
      
      setLoading(false);
      expect(useAuthStore.getState().loading).toBe(false);
    });

    test('should set error state', () => {
      const { setError } = useAuthStore.getState();
      const error = new AppError(ErrorType.AUTH_ERROR, 'Test error');
      
      setError(error);
      expect(useAuthStore.getState().error).toEqual(error);
      expect(useAuthStore.getState().loading).toBe(false);
    });

    test('should clear error', () => {
      const { setError, clearError } = useAuthStore.getState();
      const error = new AppError(ErrorType.AUTH_ERROR, 'Test error');
      
      setError(error);
      expect(useAuthStore.getState().error).toEqual(error);
      
      clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });

    test('should set user and authentication state', () => {
      const { setUser } = useAuthStore.getState();
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };
      
      setUser(mockUser);
      const state = useAuthStore.getState();
      
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should clear user when set to null', () => {
      const { setUser } = useAuthStore.getState();
      
      // First set a user
      setUser({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Then clear it
      setUser(null);
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    test('should reset state correctly', () => {
      const { setLoading, setUser, setError, setInitialized, reset } = useAuthStore.getState();
      
      // Set some state
      setLoading(true);
      setUser({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      setError(new AppError(ErrorType.AUTH_ERROR, 'Test error'));
      setInitialized(true);
      
      // Reset
      reset();
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.initialized).toBe(false);
    });
  });

  describe('Login Action', () => {
    test('should login successfully', async () => {
      const mockUserProfile: UserProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockAuthService.login.mockResolvedValue(mockUserProfile);
      
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');
      
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle login error', async () => {
      const error = new AppError(ErrorType.AUTH_ERROR, 'Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);
      
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'wrongpassword');
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toEqual(error);
    });
  });

  describe('Register Action', () => {
    test('should register successfully', async () => {
      const mockUserProfile: UserProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockAuthService.register.mockResolvedValue(mockUserProfile);
      
      const { register } = useAuthStore.getState();
      await register('test@example.com', 'password123');
      
      expect(mockAuthService.register).toHaveBeenCalledWith('test@example.com', 'password123');
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: expect.any(Object),
        updatedAt: expect.any(Object),
      });
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle register error', async () => {
      const error = new AppError(ErrorType.VALIDATION_ERROR, 'Email already in use');
      mockAuthService.register.mockRejectedValue(error);
      
      const { register } = useAuthStore.getState();
      await register('test@example.com', 'password123');
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toEqual(error);
    });
  });

  describe('Logout Action', () => {
    test('should logout successfully', async () => {
      const { setUser, setInitialized, logout } = useAuthStore.getState();
      
      // First set a user
      setUser({
        uid: 'test-uid',
        email: 'test@example.com',
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
      setInitialized(true);
      
      mockAuthService.logout.mockResolvedValue();
      
      await logout();
      
      expect(mockAuthService.logout).toHaveBeenCalled();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.initialized).toBe(true); // Should keep initialized state
    });

    test('should handle logout error', async () => {
      const error = new AppError(ErrorType.NETWORK_ERROR, 'Network error');
      mockAuthService.logout.mockRejectedValue(error);
      
      const { logout } = useAuthStore.getState();
      await logout();
      
      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toEqual(error);
    });
  });

  describe('Auth Initialization', () => {
    test('should initialize auth state listener', () => {
      const mockUnsubscribe = jest.fn();
      mockAuthService.onAuthStateChanged.mockReturnValue(mockUnsubscribe);
      
      const { initializeAuth } = useAuthStore.getState();
      const unsubscribe = initializeAuth();
      
      expect(typeof unsubscribe).toBe('function');
      expect(mockAuthService.onAuthStateChanged).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    test('should handle network errors during login', async () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Network connection failed');
      mockAuthService.login.mockRejectedValue(networkError);
      
      const { login } = useAuthStore.getState();
      await login('test@example.com', 'password123');
      
      const state = useAuthStore.getState();
      expect(state.error).toEqual(networkError);
      expect(state.error?.type).toBe(ErrorType.NETWORK_ERROR);
    });

    test('should handle validation errors during register', async () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Weak password');
      mockAuthService.register.mockRejectedValue(validationError);
      
      const { register } = useAuthStore.getState();
      await register('test@example.com', '123');
      
      const state = useAuthStore.getState();
      expect(state.error).toEqual(validationError);
      expect(state.error?.type).toBe(ErrorType.VALIDATION_ERROR);
    });
  });
});