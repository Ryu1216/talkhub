import { renderHook } from '@testing-library/react-hooks';
import { useAuthInit } from '../useAuthInit';
import { useAuthStore } from '../../stores/authStore';

// Mock the auth store
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('useAuthInit', () => {
  const mockInitializeAuth = jest.fn();
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockInitializeAuth.mockReturnValue(mockUnsubscribe);
  });

  test('should initialize auth and return state', () => {
    mockUseAuthStore.mockImplementation((selector: any) => {
      const state = {
        initializeAuth: mockInitializeAuth,
        initialized: false,
        loading: true,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useAuthInit());

    expect(mockInitializeAuth).toHaveBeenCalledTimes(1);
    expect(result.current.initialized).toBe(false);
    expect(result.current.loading).toBe(true);
  });

  test('should call unsubscribe on cleanup', () => {
    mockUseAuthStore.mockImplementation((selector: any) => {
      const state = {
        initializeAuth: mockInitializeAuth,
        initialized: true,
        loading: false,
      };
      return selector(state);
    });

    const { unmount } = renderHook(() => useAuthInit());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  test('should handle unsubscribe function not being returned', () => {
    mockInitializeAuth.mockReturnValue(undefined);
    
    mockUseAuthStore.mockImplementation((selector: any) => {
      const state = {
        initializeAuth: mockInitializeAuth,
        initialized: true,
        loading: false,
      };
      return selector(state);
    });

    const { unmount } = renderHook(() => useAuthInit());

    // Should not throw error when unsubscribe is undefined
    expect(() => unmount()).not.toThrow();
  });
});