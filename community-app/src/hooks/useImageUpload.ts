import { useState, useCallback } from 'react';
import { useToast } from 'native-base';
import { imageUploadService, ImageUploadOptions, ImageUploadResult, UploadProgress } from '../services';
import { useAuthStore } from '../stores';
import { AppError } from '../types';

export interface UseImageUploadReturn {
  uploadImage: (uri: string, options?: ImageUploadOptions) => Promise<ImageUploadResult | null>;
  uploadMultipleImages: (uris: string[], options?: ImageUploadOptions) => Promise<ImageUploadResult[]>;
  deleteImage: (imageUrl: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;
  clearError: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { user } = useAuthStore();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadImage = useCallback(async (
    uri: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult | null> => {
    if (!user) {
      const errorMsg = '이미지를 업로드하려면 로그인이 필요합니다.';
      setError(errorMsg);
      toast.show({
        title: '인증 필요',
        description: errorMsg
      });
      return null;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const result = await imageUploadService.uploadImageFromUri(uri, user.uid, {
        ...options,
        onProgress: (progress) => {
          setUploadProgress(progress);
          options.onProgress?.(progress);
        }
      });

      toast.show({
        title: '업로드 완료',
        description: '이미지가 성공적으로 업로드되었습니다.'
      });

      return result;
    } catch (err: any) {
      const errorMsg = err instanceof AppError ? err.message : '이미지 업로드 중 오류가 발생했습니다.';
      setError(errorMsg);
      
      toast.show({
        title: '업로드 실패',
        description: errorMsg
      });

      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [user, toast]);

  const uploadMultipleImages = useCallback(async (
    uris: string[],
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult[]> => {
    if (!user) {
      const errorMsg = '이미지를 업로드하려면 로그인이 필요합니다.';
      setError(errorMsg);
      toast.show({
        title: '인증 필요',
        description: errorMsg
      });
      return [];
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const results = await imageUploadService.uploadMultipleImages(uris, user.uid, {
        ...options,
        onProgress: (progress) => {
          setUploadProgress(progress);
          options.onProgress?.(progress);
        }
      });

      toast.show({
        title: '업로드 완료',
        description: `${results.length}개의 이미지가 성공적으로 업로드되었습니다.`
      });

      return results;
    } catch (err: any) {
      const errorMsg = err instanceof AppError ? err.message : '이미지 업로드 중 오류가 발생했습니다.';
      setError(errorMsg);
      
      toast.show({
        title: '업로드 실패',
        description: errorMsg
      });

      return [];
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [user, toast]);

  const deleteImage = useCallback(async (imageUrl: string): Promise<void> => {
    try {
      await imageUploadService.deleteImage(imageUrl);
      
      toast.show({
        title: '삭제 완료',
        description: '이미지가 성공적으로 삭제되었습니다.'
      });
    } catch (err: any) {
      const errorMsg = err instanceof AppError ? err.message : '이미지 삭제 중 오류가 발생했습니다.';
      setError(errorMsg);
      
      toast.show({
        title: '삭제 실패',
        description: errorMsg
      });
    }
  }, [toast]);

  return {
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    isUploading,
    uploadProgress,
    error,
    clearError
  };
};