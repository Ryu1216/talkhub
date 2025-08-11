import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';
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

describe('RegisterScreen', () => {
  const mockRegister = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuthStore.mockReturnValue({
      register: mockRegister,
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
      login: jest.fn(),
      logout: jest.fn(),
      reset: jest.fn(),
      initializeAuth: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders register screen correctly', () => {
      const { getByText, getByTestId } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByText('회원가입')).toBeTruthy();
      expect(getByText('새 계정을 만들어 커뮤니티에 참여하세요')).toBeTruthy();
      expect(getByText('이미 계정이 있으신가요?')).toBeTruthy();
      expect(getByText('로그인하기')).toBeTruthy();
      expect(getByTestId('auth-form')).toBeTruthy();
      expect(getByTestId('screen-layout')).toBeTruthy();
    });

    it('passes correct props to AuthForm', () => {
      const { getByTestId } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('auth-form-mode')).toHaveTextContent('register');
      expect(getByTestId('auth-form-loading')).toHaveTextContent('false');
      expect(getByTestId('auth-form-error')).toHaveTextContent('no-error');
    });

    it('displays loading state correctly', () => {
      mockUseAuthStore.mockReturnValue({
        register: mockRegister,
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
        login: jest.fn(),
        logout: jest.fn(),
        reset: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('auth-form-loading')).toHaveTextContent('true');
    });

    it('displays error state correctly', () => {
      const error = new AppError(ErrorType.AUTH_ERROR, 'Registration failed');
      
      mockUseAuthStore.mockReturnValue({
        register: mockRegister,
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
        login: jest.fn(),
        logout: jest.fn(),
        reset: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('auth-form-error')).toHaveTextContent('Registration failed');
    });
  });

  describe('User Interactions', () => {
    it('calls register function when form is submitted', async () => {
      const { getByTestId } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      const submitButton = getByTestId('auth-form-submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('calls clearError function when error is cleared', () => {
      const { getByTestId } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      const clearErrorButton = getByTestId('auth-form-clear-error');
      fireEvent.press(clearErrorButton);

      expect(mockClearError).toHaveBeenCalled();
    });

    it('navigates to login screen when login link is pressed', () => {
      const { getByText } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      const loginLink = getByText('로그인하기');
      fireEvent.press(loginLink);

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Error Handling', () => {
    it('handles registration errors correctly', async () => {
      const error = new Error('Registration failed');
      mockRegister.mockRejectedValue(error);

      const { getByTestId } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      const submitButton = getByTestId('auth-form-submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    it('displays validation errors correctly', () => {
      const validationError = new AppError(ErrorType.VALIDATION_ERROR, 'Email already in use');
      
      mockUseAuthStore.mockReturnValue({
        register: mockRegister,
        loading: false,
        error: validationError,
        clearError: mockClearError,
        user: null,
        isAuthenticated: false,
        initialized: false,
        setUser: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        setInitialized: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        reset: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('auth-form-error')).toHaveTextContent('Email already in use');
    });

    it('displays network errors correctly', () => {
      const networkError = new AppError(ErrorType.NETWORK_ERROR, 'Network connection failed');
      
      mockUseAuthStore.mockReturnValue({
        register: mockRegister,
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
        login: jest.fn(),
        logout: jest.fn(),
        reset: jest.fn(),
        initializeAuth: jest.fn(),
      });

      const { getByTestId } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      expect(getByTestId('auth-form-error')).toHaveTextContent('Network connection failed');
    });
  });

  describe('Integration', () => {
    it('integrates correctly with auth store', () => {
      render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      // Verify that the component is using the auth store
      expect(mockUseAuthStore).toHaveBeenCalled();
    });

    it('passes all required props to AuthForm', () => {
      const { getByTestId } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      // Verify AuthForm receives all necessary props
      expect(getByTestId('auth-form')).toBeTruthy();
      expect(getByTestId('auth-form-mode')).toHaveTextContent('register');
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility labels', () => {
      const { getByText } = render(
        <RegisterScreen navigation={mockNavigation as any} route={{} as any} />
      );

      // Check that important text elements are present for screen readers
      expect(getByText('회원가입')).toBeTruthy();
      expect(getByText('새 계정을 만들어 커뮤니티에 참여하세요')).toBeTruthy();
      expect(getByText('로그인하기')).toBeTruthy();
    });
  });
});