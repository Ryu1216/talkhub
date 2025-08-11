import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { useAuthStore } from '../../../stores/authStore';
import { AppError, ErrorType } from '../../../types';

// Mock the auth store
jest.mock('../../../stores/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock the AuthForm component
jest.mock('../../../components/auth', () => ({
  AuthForm: ({ onSubmit, loading, error, onClearError, mode }: any) => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    
    return (
      <View testID="auth-form">
        <Text testID="auth-form-mode">{mode}</Text>
        <Text testID="auth-form-loading">{loading.toString()}</Text>
        <Text testID="auth-form-error">{error?.message || 'no-error'}</Text>
        <TouchableOpacity
          testID="auth-form-submit"
          onPress={() => onSubmit('test@example.com', 'password123')}
        >
          <Text>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="auth-form-clear-error"
          onPress={onClearError}
        >
          <Text>Clear Error</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

// Mock the ScreenLayout component
jest.mock('../../../components/common', () => ({
  ScreenLayout: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return <View testID="screen-layout">{children}</View>;
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  reset: jest.fn(),
};

describe('LoginScreen', () => {
  const mockLogin = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: null,
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      initialized: false,
      setUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setInitialized: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      reset: jest.fn(),
      initializeAuth: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders login screen correctly', () => {
      const { getByText, getByTestId } = render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByText('로그인')).toBeTruthy();
      expect(getByText('계정에 로그인하여 커뮤니티에 참여하세요')).toBeTruthy();
      expect(getByText('계정이 없으신가요?')).toBeTruthy();
      expect(getByText('회원가입하기')).toBeTruthy();
      expect(getByTestId('auth-form')).toBeTruthy();
      expect(getByTestId('screen-layout')).toBeTruthy();
    });

    it('passes correct props to AuthForm', () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('auth-form-mode')).toHaveTextContent('login');
      expect(getByTestId('auth-form-loading')).toHaveTextContent('false');
      expect(getByTestId('auth-form-error')).toHaveTextContent('no-error');
    });

    it('displays loading state correctly', () => {
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        loading: true,
        error: null,
        clearError: mockClearError,
        user: null,
        isAuthenticated: false,
        initialized: false,
        setUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        setInitialized: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        reset: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('auth-form-loading')).toHaveTextContent('true');
    });

    it('displays error state correctly', () => {
      const error = new AppError(ErrorType.AUTH_ERROR, 'Login failed');
      
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        loading: false,
        error,
        clearError: mockClearError,
        user: null,
        isAuthenticated: false,
        initialized: false,
        setUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        setInitialized: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        reset: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('auth-form-error')).toHaveTextContent('Login failed');
    });
  });

  describe('User Interactions', () => {
    it('calls login function when form is submitted', async () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      const submitButton = getByTestId('auth-form-submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('calls clearError function when error is cleared', () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      const clearErrorButton = getByTestId('auth-form-clear-error');
      fireEvent.press(clearErrorButton);

      expect(mockClearError).toHaveBeenCalled();
    });

    it('navigates to register screen when register link is pressed', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      const registerLink = getByText('회원가입하기');
      fireEvent.press(registerLink);

      expect(mockNavigate).toHaveBeenCalledWith('Register');
    });
  });

  describe('Error Handling', () => {
    it('handles login errors correctly', async () => {
      const error = new Error('Login failed');
      mockLogin.mockRejectedValue(error);

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      const submitButton = getByTestId('auth-form-submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('displays different error types correctly', () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Network error');
      
      mockUseAuthStore.mockReturnValue({
        login: mockLogin,
        loading: false,
        error: networkError,
        clearError: mockClearError,
        user: null,
        isAuthenticated: false,
        initialized: false,
        setUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        setInitialized: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        reset: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('auth-form-error')).toHaveTextContent('Network error');
    });
  });

  describe('Integration', () => {
    it('integrates correctly with auth store', () => {
      render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      // Verify that the component is using the auth store
      expect(mockUseAuthStore).toHaveBeenCalled();
    });

    it('passes all required props to AuthForm', () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation as any} route={{} as any} />
      );

      // Verify AuthForm receives all necessary props
      expect(getByTestId('auth-form')).toBeTruthy();
      expect(getByTestId('auth-form-mode')).toHaveTextContent('login');
    });
  });
});