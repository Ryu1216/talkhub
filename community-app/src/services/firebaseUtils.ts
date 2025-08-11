import { Timestamp } from 'firebase/firestore';
import { AppError, ErrorType } from '../types/error';

/**
 * Utility functions for Firebase operations
 */
export class FirebaseUtils {
  /**
   * Convert Firestore Timestamp to JavaScript Date
   */
  static timestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }

  /**
   * Convert JavaScript Date to Firestore Timestamp
   */
  static dateToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  /**
   * Get current Firestore Timestamp
   */
  static now(): Timestamp {
    return Timestamp.now();
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: Timestamp, locale: string = 'ko-KR'): string {
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
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
      return { isValid: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' };
    }
    return { isValid: true };
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * Generate unique filename for uploads
   */
  static generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Check if user is authenticated
   */
  static validateAuthentication(userId?: string): void {
    if (!userId) {
      throw new AppError(
        ErrorType.AUTH_ERROR,
        'User must be authenticated to perform this action'
      );
    }
  }

  /**
   * Retry async operation with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Don't retry on certain error types
        if (error instanceof AppError) {
          if (
            error.type === ErrorType.AUTH_ERROR ||
            error.type === ErrorType.PERMISSION_ERROR ||
            error.type === ErrorType.VALIDATION_ERROR
          ) {
            throw error;
          }
        }

        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Batch process array items
   */
  static async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }
    
    return results;
  }
}

export default FirebaseUtils;