import { Platform } from 'react-native';
import { storageService, UploadProgress } from './storageService';
import { 
  compressImage, 
  validateImage, 
  generateImageFileName, 
  getFileExtension,
  dataURItoBlob 
} from '../utils/imageUtils';
import { AppError, ErrorType } from '../types/error';

export interface ImageUploadOptions {
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  onProgress?: (progress: UploadProgress) => void;
}

export interface ImageUploadResult {
  url: string;
  path: string;
  originalUri: string;
  compressedUri?: string;
}

class ImageUploadService {
  /**
   * Upload image from React Native URI
   */
  async uploadImageFromUri(
    uri: string,
    userId: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    // Check if we're in demo mode
    const isDemoMode = __DEV__ && (!storageService || storageService.isDemoMode?.());
    
    if (isDemoMode) {
      console.log('Image upload in demo mode - using original URI');
      return {
        url: uri, // In demo mode, just return the original URI
        path: `demo/posts/${userId}/${Date.now()}_image.jpg`,
        originalUri: uri,
        compressedUri: undefined
      };
    }

    try {
      // Validate the image
      const validation = validateImage(uri);
      if (!validation.isValid) {
        throw new AppError(ErrorType.VALIDATION_ERROR, validation.error!);
      }

      const {
        compress = true,
        maxWidth = 1024,
        maxHeight = 1024,
        quality = 0.8,
        onProgress
      } = options;

      let processedUri = uri;

      // Compress image if needed
      if (compress) {
        try {
          processedUri = await compressImage(uri, {
            maxWidth,
            maxHeight,
            quality
          });
        } catch (error) {
          console.warn('Image compression failed, using original:', error);
          processedUri = uri;
        }
      }

      // Convert URI to blob for upload
      const blob = await this.uriToBlob(processedUri);
      
      // Generate filename
      const extension = getFileExtension(uri);
      const fileName = generateImageFileName(userId, extension);

      // Upload to Firebase Storage
      const downloadUrl = await storageService.uploadPostImage(
        blob,
        userId,
        fileName,
        onProgress
      );

      return {
        url: downloadUrl,
        path: `posts/${userId}/${Date.now()}_${fileName}`,
        originalUri: uri,
        compressedUri: compress ? processedUri : undefined
      };
    } catch (error: any) {
      console.error('Image upload failed, falling back to demo mode:', error);
      
      // Fallback to demo mode
      return {
        url: uri,
        path: `demo/posts/${userId}/${Date.now()}_image.jpg`,
        originalUri: uri,
        compressedUri: undefined
      };
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    uris: string[],
    userId: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < uris.length; i++) {
      try {
        const result = await this.uploadImageFromUri(uris[i], userId, {
          ...options,
          onProgress: options.onProgress ? 
            (progress) => {
              // Adjust progress for multiple uploads
              const totalProgress = {
                ...progress,
                progress: (i / uris.length) * 100 + (progress.progress / uris.length)
              };
              options.onProgress!(totalProgress);
            } : undefined
        });
        results.push(result);
      } catch (error: any) {
        errors.push(`Image ${i + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new AppError(
        ErrorType.UNKNOWN_ERROR,
        `모든 이미지 업로드에 실패했습니다: ${errors.join(', ')}`
      );
    }

    return results;
  }

  /**
   * Delete uploaded image
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      await storageService.deleteImage(imageUrl);
    } catch (error: any) {
      throw new AppError(
        ErrorType.UNKNOWN_ERROR,
        `이미지 삭제 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }

  /**
   * Convert React Native URI to Blob
   */
  private async uriToBlob(uri: string): Promise<Blob> {
    try {
      if (uri.startsWith('data:')) {
        // Handle data URI
        return dataURItoBlob(uri);
      }

      if (Platform.OS === 'web') {
        // Web platform - use fetch
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        return await response.blob();
      } else {
        // React Native - use XMLHttpRequest
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = function() {
            if (xhr.status === 200) {
              resolve(xhr.response);
            } else {
              reject(new Error(`Failed to load image: ${xhr.statusText}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error while loading image'));
          xhr.responseType = 'blob';
          xhr.open('GET', uri, true);
          xhr.send(null);
        });
      }
    } catch (error: any) {
      throw new AppError(
        ErrorType.UNKNOWN_ERROR,
        `이미지를 변환하는 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(uri: string): Promise<{
    width: number;
    height: number;
    size?: number;
    type?: string;
  }> {
    try {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height
          });
        };
        img.onerror = () => reject(new Error('Failed to load image metadata'));
        img.src = uri;
      });
    } catch (error: any) {
      throw new AppError(
        ErrorType.UNKNOWN_ERROR,
        `이미지 메타데이터를 가져오는 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }

  /**
   * Check if image upload is supported
   */
  isUploadSupported(): boolean {
    return true; // Both React Native and Web support image upload
  }

  /**
   * Get maximum file size allowed (in bytes)
   */
  getMaxFileSize(): number {
    return 5 * 1024 * 1024; // 5MB
  }

  /**
   * Get supported image formats
   */
  getSupportedFormats(): string[] {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  }
}

export const imageUploadService = new ImageUploadService();