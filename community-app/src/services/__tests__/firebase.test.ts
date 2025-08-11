/**
 * Basic Firebase services tests
 * These tests verify that the Firebase services are properly configured
 * and can be imported without errors.
 */

import { authService } from '../authService';
import { postsService } from '../postsService';
import { commentsService } from '../commentsService';
import { storageService } from '../storageService';
import { FirebaseUtils } from '../firebaseUtils';
import { FirebaseInitializer } from '../firebaseInit';

describe('Firebase Services', () => {
  describe('Service Imports', () => {
    test('authService should be defined', () => {
      expect(authService).toBeDefined();
      expect(typeof authService.login).toBe('function');
      expect(typeof authService.register).toBe('function');
      expect(typeof authService.logout).toBe('function');
    });

    test('postsService should be defined', () => {
      expect(postsService).toBeDefined();
      expect(typeof postsService.createPost).toBe('function');
      expect(typeof postsService.getPost).toBe('function');
      expect(typeof postsService.getPosts).toBe('function');
    });

    test('commentsService should be defined', () => {
      expect(commentsService).toBeDefined();
      expect(typeof commentsService.createComment).toBe('function');
      expect(typeof commentsService.getComments).toBe('function');
      expect(typeof commentsService.subscribeToComments).toBe('function');
    });

    test('storageService should be defined', () => {
      expect(storageService).toBeDefined();
      expect(typeof storageService.uploadImage).toBe('function');
      expect(typeof storageService.uploadPostImage).toBe('function');
      expect(typeof storageService.deleteImage).toBe('function');
    });
  });

  describe('Firebase Utils', () => {
    test('should validate email correctly', () => {
      expect(FirebaseUtils.isValidEmail('test@example.com')).toBe(true);
      expect(FirebaseUtils.isValidEmail('invalid-email')).toBe(false);
      expect(FirebaseUtils.isValidEmail('')).toBe(false);
    });

    test('should validate password correctly', () => {
      const validPassword = FirebaseUtils.isValidPassword('password123');
      expect(validPassword.isValid).toBe(true);

      const invalidPassword = FirebaseUtils.isValidPassword('123');
      expect(invalidPassword.isValid).toBe(false);
      expect(invalidPassword.message).toBeDefined();
    });

    test('should sanitize input correctly', () => {
      expect(FirebaseUtils.sanitizeInput('  test   input  ')).toBe('test input');
      expect(FirebaseUtils.sanitizeInput('normal input')).toBe('normal input');
      expect(FirebaseUtils.sanitizeInput('')).toBe('');
    });

    test('should generate unique filename', () => {
      const filename1 = FirebaseUtils.generateUniqueFileName('test.jpg');
      const filename2 = FirebaseUtils.generateUniqueFileName('test.jpg');
      
      expect(filename1).toContain('.jpg');
      expect(filename2).toContain('.jpg');
      expect(filename1).not.toBe(filename2);
      expect(filename1).not.toBe('test.jpg');
    });
  });

  describe('Firebase Initializer', () => {
    test('should have validation method', () => {
      expect(typeof FirebaseInitializer.validateConfiguration).toBe('function');
      expect(typeof FirebaseInitializer.getServicesStatus).toBe('function');
    });

    test('should return services status', () => {
      const status = FirebaseInitializer.getServicesStatus();
      expect(status).toHaveProperty('auth');
      expect(status).toHaveProperty('firestore');
      expect(status).toHaveProperty('storage');
    });
  });
});