import { Timestamp } from 'firebase/firestore';
import { AppError, ErrorType } from '../types';
import { ERROR_MESSAGES } from '../constants';

// Date formatting utilities
export const formatDate = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return '방금 전';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR');
  }
};

// Error handling utilities
export const createAppError = (
  type: ErrorType,
  message: string,
  code?: string
): AppError => new AppError(type, message, code);

export const getErrorMessage = (error: any): string => {
  if (error?.code) {
    switch (error.code) {
      case 'auth/invalid-email':
        return ERROR_MESSAGES.AUTH_INVALID_EMAIL;
      case 'auth/weak-password':
        return ERROR_MESSAGES.AUTH_WEAK_PASSWORD;
      case 'auth/email-already-in-use':
        return ERROR_MESSAGES.AUTH_EMAIL_ALREADY_IN_USE;
      case 'auth/user-not-found':
        return ERROR_MESSAGES.AUTH_USER_NOT_FOUND;
      case 'auth/wrong-password':
        return ERROR_MESSAGES.AUTH_WRONG_PASSWORD;
      default:
        return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }
  return error?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

// Image utilities
export * from './imageUtils';
export * from './imageOptimization';