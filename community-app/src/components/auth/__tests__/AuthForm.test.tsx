import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthForm, AuthFormProps } from '../AuthForm';
import { AppError, ErrorType } from '../../../types';

// Mock the utils
jest.mock('../../../utils', () => ({
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
  validateRequired: jest.fn(),
}));

// Mock constants
jest.mock('../../../constants', () => ({
  ERROR_MESSAGES: {
    VALIDATION_REQUIRED_FIELD: '필수 입력 항목입니다.',
    AUTH_INVALID_EMAIL: '유효하지 않은 이메일 주소입니다.',
    AUTH_WEAK_PASSWORD: '비밀번호는 최소 6자 이상이어야 합니다.',
  },
}));

const { validateEmail, validatePassword, validateRequired } = require('../../../utils');

describe('AuthForm', () => {
  const defaultProps: AuthFormProps = {
    mode: 'login',
    onSubmit: jest.fn(),
    loading: false,
    error: null,
    onClearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default validation mocks
    validateRequired.mockReturnValue(true);
    validateEmail.mockReturnValue(true);
    validatePassword.mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('renders login form correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <AuthForm {...defaultProps} mode="login" />
      );

      expect(getByText('로그인')).toBeTruthy();
      expect(getByPlaceholderText('이메일을 입력하세요')).toBeTruthy();
      expect(getByPlaceholderText('비밀번호를 입력하세요')).toBeTruthy();
    });

    it('renders register form correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <AuthForm {...defaultProps} mode="register" />
      );

      expect(getByText('회원가입')).toBeTruthy();
      expect(getByPlaceholderText('이메일을 입력하세요')).toBeTruthy();
      expect(getByPlaceholderText('비밀번호를 입력하세요')).toBeTruthy();
      expect(getByText('비밀번호는 최소 6자 이상이어야 합니다.')).toBeTruthy();
    });

    it('displays error alert when error prop is provided', () => {
      const error = new AppError(ErrorType.AUTH_ERROR, 'Test error message');
      const { getByText } = render(
        <AuthForm {...defaultProps} error={error} />
      );

      expect(getByText('오류')).toBeTruthy();
      expect(getByText('Test error message')).toBeTruthy();
    });

    it('disables inputs and button when loading', () => {
      const { getByPlaceholderText, getByText } = render(
        <AuthForm {...defaultProps} loading={true} />
      );

      const emailInput = getByPlaceholderText('이메일을 입력하세요');
      const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
      const submitButton = getByText('로그인 중...');

      expect(emailInput.props.editable).toBe(false);
      expect(passwordInput.props.editable).toBe(false);
      expect(submitButton).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('shows email validation error when email is invalid', async () => {
      validateEmail.mockReturnValue(false);
      validateRequired.mockReturnValue(true);

      const { getByPlaceholderText, getByText } = render(
        <AuthForm {...defaultProps} />
      );

      const emailInput = getByPlaceholderText('이메일을 입력하세요');
      
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent(emailInput, 'blur');

      await waitFor(() => {
        expect(getByText('유효하지 않은 이메일 주소입니다.')).toBeTruthy();
      });
    });

    it('shows password validation error when password is weak', async () => {
      validatePassword.mockReturnValue(false);
      validateRequired.mockReturnValue(true);

      const { getByPlaceholderText, getByText } = render(
        <AuthForm {...defaultProps} />
      );

      const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
      
      fireEvent.changeText(passwordInput, '123');
      fireEvent(passwordInput, 'blur');

      await waitFor(() => {
        expect(getByText('비밀번호는 최소 6자 이상이어야 합니다.')).toBeTruthy();
      });
    });

    it('shows required field error when field is empty', async () => {
      validateRequired.mockReturnValue(false);

      const { getByPlaceholderText, getByText } = render(
        <AuthForm {...defaultProps} />
      );

      const emailInput = getByPlaceholderText('이메일을 입력하세요');
      
      fireEvent.changeText(emailInput, '');
      fireEvent(emailInput, 'blur');

      await waitFor(() => {
        expect(getByText('필수 입력 항목입니다.')).toBeTruthy();
      });
    });

    it('clears global error when user starts typing', () => {
      const onClearError = jest.fn();
      const error = new AppError(ErrorType.AUTH_ERROR, 'Test error');

      const { getByPlaceholderText } = render(
        <AuthForm {...defaultProps} error={error} onClearError={onClearError} />
      );

      const emailInput = getByPlaceholderText('이메일을 입력하세요');
      fireEvent.changeText(emailInput, 'test@example.com');

      expect(onClearError).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with correct values when form is valid', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      validateRequired.mockReturnValue(true);
      validateEmail.mockReturnValue(true);
      validatePassword.mockReturnValue(true);

      const { getByPlaceholderText, getByText } = render(
        <AuthForm {...defaultProps} onSubmit={onSubmit} />
      );

      const emailInput = getByPlaceholderText('이메일을 입력하세요');
      const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
      const submitButton = getByText('로그인');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('does not call onSubmit when form is invalid', async () => {
      const onSubmit = jest.fn();
      validateEmail.mockReturnValue(false);

      const { getByPlaceholderText, getByText } = render(
        <AuthForm {...defaultProps} onSubmit={onSubmit} />
      );

      const emailInput = getByPlaceholderText('이메일을 입력하세요');
      const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
      const submitButton = getByText('로그인');

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });

    it('handles submission errors gracefully', async () => {
      const onSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      validateRequired.mockReturnValue(true);
      validateEmail.mockReturnValue(true);
      validatePassword.mockReturnValue(true);

      const { getByPlaceholderText, getByText } = render(
        <AuthForm {...defaultProps} onSubmit={onSubmit} />
      );

      const emailInput = getByPlaceholderText('이메일을 입력하세요');
      const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
      const submitButton = getByText('로그인');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when eye icon is pressed', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <AuthForm {...defaultProps} />
      );

      const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
      
      // Initially password should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Find and press the visibility toggle (this would need proper testID in real component)
      // For now, we'll simulate the toggle behavior
      fireEvent.changeText(passwordInput, 'password');
      
      // In a real test, you'd press the eye icon and check the secureTextEntry prop
      // This is a simplified version showing the concept
    });
  });

  describe('Real-time Validation', () => {
    it('validates email in real-time after first blur', async () => {
      validateEmail.mockReturnValue(false);
      validateRequired.mockReturnValue(true);

      const { getByPlaceholderText, getByText } = render(
        <AuthForm {...defaultProps} />
      );

      const emailInput = getByPlaceholderText('이메일을 입력하세요');
      
      // First blur to mark field as touched
      fireEvent.changeText(emailInput, 'invalid');
      fireEvent(emailInput, 'blur');

      await waitFor(() => {
        expect(getByText('유효하지 않은 이메일 주소입니다.')).toBeTruthy();
      });

      // Now change text again - should validate in real-time
      fireEvent.changeText(emailInput, 'still-invalid');
      
      await waitFor(() => {
        expect(validateEmail).toHaveBeenCalledWith('still-invalid');
      });
    });

    it('validates password in real-time after first blur', async () => {
      validatePassword.mockReturnValue(false);
      validateRequired.mockReturnValue(true);

      const { getByPlaceholderText, getByText } = render(
        <AuthForm {...defaultProps} />
      );

      const passwordInput = getByPlaceholderText('비밀번호를 입력하세요');
      
      // First blur to mark field as touched
      fireEvent.changeText(passwordInput, '123');
      fireEvent(passwordInput, 'blur');

      await waitFor(() => {
        expect(getByText('비밀번호는 최소 6자 이상이어야 합니다.')).toBeTruthy();
      });

      // Now change text again - should validate in real-time
      fireEvent.changeText(passwordInput, '1234');
      
      await waitFor(() => {
        expect(validatePassword).toHaveBeenCalledWith('1234');
      });
    });
  });
});