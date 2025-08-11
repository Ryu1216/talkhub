import { User } from '../types';
import { AppError, ErrorType } from '../types/error';

/**
 * Check if user has permission to create comments
 */
export const canCreateComment = (user: User | null): boolean => {
  return user !== null;
};

/**
 * Check if user has permission to edit/delete a comment
 */
export const canModifyComment = (user: User | null, commentAuthorId: string): boolean => {
  return user !== null && user.uid === commentAuthorId;
};

/**
 * Validate comment creation permissions and throw appropriate error
 */
export const validateCommentPermissions = (user: User | null): void => {
  if (!user) {
    throw new AppError(
      ErrorType.AUTH_ERROR, 
      'You must be logged in to comment'
    );
  }
};

/**
 * Validate comment content
 */
export const validateCommentContent = (content: string): void => {
  if (!content || content.trim().length === 0) {
    throw new AppError(
      ErrorType.VALIDATION_ERROR,
      'Comment content cannot be empty'
    );
  }

  if (content.trim().length > 500) {
    throw new AppError(
      ErrorType.VALIDATION_ERROR,
      'Comment content cannot exceed 500 characters'
    );
  }
};

/**
 * Comprehensive comment validation
 */
export const validateComment = (user: User | null, content: string): void => {
  validateCommentPermissions(user);
  validateCommentContent(content);
};