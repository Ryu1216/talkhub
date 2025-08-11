import { renderHook, act } from '@testing-library/react-hooks';
import { useToast } from 'native-base';
import { useImageUpload } from '../useImageUpload';
import { imageUploadService } from '../../services';
import { useAuthStore } from '../../stores';
import { AppError, ErrorType } from '../../types';

// Mock dependencies
jest.mock('native-base', () => ({
  useToast: jest.fn()
}));

jest.mock('../../services', () => ({
  imageUploadService: {
    uploadImageFromUri: jest.fn(),
    uploadMultipleImages: jest.fn(),
    deleteImage: jest.fn()
  }
}));

jest.mock('../../stores', () => ({
  useAuthStore: jest.fn()
}));

const mockToast = {
  show: jest.fn()
};

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockImageUploadService = imageUploadService as jest.Mocked<typeof imageUploadService>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('useImageUpload', () => {
  const mockUser = {
    uid: 'user123',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const mockImageUri = 'file:///path/to/image.jpg';
  const mockUploadResult = {
    url: 'https://firebase.storage.com/image.jpg',
    path: 'posts/user123/image.jpg',
    originalUri: mockImageUri,
    compressedUri: 'compressed-uri'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue(mockToast);
    mockUseAuthStore.mockReturnValue({ user: mockUser } as any);
  });

  describe('uploadImage', () => {
    it('successfully uploads an image', async () => {
      mockImageUploadService.uploadImageFromUri.mockResolvedValue(mockUploadResult);

      const { result } = renderHook(() => useImageUpload());

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.uploadImage(mockImageUri);
      });

      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalledWith(
        mockImageUri,
        mockUser.uid,
        expect.any(Object)
      );
      expect(uploadResult).toEqual(mockUploadResult);
      expect(mockToast.show).toHaveBeenCalledWith({
        title: '업로드 완료',
        description: '이미지가 성공적으로 업로드되었습니다.',
        status: 'success'
      });
    });

    it('handles upload when user is not authenticated', async () => {
      mockUseAuthStore.mockReturnValue({ user: null } as any);

      const { result } = renderHook(() => useImageUpload());

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.uploadImage(mockImageUri);
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe('이미지를 업로드하려면 로그인이 필요합니다.');
      expect(mockToast.show).toHaveBeenCalledWith({
        title: '인증 필요',
        description: '이미지를 업로드하려면 로그인이 필요합니다.',
        status: 'warning'
      });
    });

    it('handles upload errors', async () => {
      const errorMessage = '업로드 실패';
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(
        new AppError(ErrorType.NETWORK_ERROR, errorMessage)
      );

      const { result } = renderHook(() => useImageUpload());

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.uploadImage(mockImageUri);
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.show).toHaveBeenCalledWith({
        title: '업로드 실패',
        description: errorMessage,
        status: 'error'
      });
    });

    it('tracks upload progress', async () => {
      const mockProgress = { bytesTransferred: 50, totalBytes: 100, progress: 50 };
      
      mockImageUploadService.uploadImageFromUri.mockImplementation(
        (uri, userId, options) => {
          if (options?.onProgress) {
            options.onProgress(mockProgress);
          }
          return Promise.resolve(mockUploadResult);
        }
      );

      const { result } = renderHook(() => useImageUpload());

      await act(async () => {
        await result.current.uploadImage(mockImageUri);
      });

      // Progress should be tracked during upload
      expect(mockImageUploadService.uploadImageFromUri).toHaveBeenCalledWith(
        mockImageUri,
        mockUser.uid,
        expect.objectContaining({
          onProgress: expect.any(Function)
        })
      );
    });

    it('sets loading state during upload', async () => {
      let resolveUpload: (value: any) => void;
      const uploadPromise = new Promise(resolve => {
        resolveUpload = resolve;
      });
      
      mockImageUploadService.uploadImageFromUri.mockReturnValue(uploadPromise);

      const { result } = renderHook(() => useImageUpload());

      // Start upload
      act(() => {
        result.current.uploadImage(mockImageUri);
      });

      // Should be loading
      expect(result.current.isUploading).toBe(true);

      // Complete upload
      await act(async () => {
        resolveUpload!(mockUploadResult);
        await uploadPromise;
      });

      // Should not be loading anymore
      expect(result.current.isUploading).toBe(false);
    });
  });

  describe('uploadMultipleImages', () => {
    const mockUris = ['uri1.jpg', 'uri2.jpg'];
    const mockResults = [mockUploadResult, { ...mockUploadResult, url: 'url2' }];

    it('successfully uploads multiple images', async () => {
      mockImageUploadService.uploadMultipleImages.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useImageUpload());

      let uploadResults: any;
      await act(async () => {
        uploadResults = await result.current.uploadMultipleImages(mockUris);
      });

      expect(mockImageUploadService.uploadMultipleImages).toHaveBeenCalledWith(
        mockUris,
        mockUser.uid,
        expect.any(Object)
      );
      expect(uploadResults).toEqual(mockResults);
      expect(mockToast.show).toHaveBeenCalledWith({
        title: '업로드 완료',
        description: '2개의 이미지가 성공적으로 업로드되었습니다.',
        status: 'success'
      });
    });

    it('handles multiple upload when user is not authenticated', async () => {
      mockUseAuthStore.mockReturnValue({ user: null } as any);

      const { result } = renderHook(() => useImageUpload());

      let uploadResults: any;
      await act(async () => {
        uploadResults = await result.current.uploadMultipleImages(mockUris);
      });

      expect(uploadResults).toEqual([]);
      expect(result.current.error).toBe('이미지를 업로드하려면 로그인이 필요합니다.');
    });

    it('handles multiple upload errors', async () => {
      const errorMessage = '다중 업로드 실패';
      mockImageUploadService.uploadMultipleImages.mockRejectedValue(
        new AppError(ErrorType.NETWORK_ERROR, errorMessage)
      );

      const { result } = renderHook(() => useImageUpload());

      let uploadResults: any;
      await act(async () => {
        uploadResults = await result.current.uploadMultipleImages(mockUris);
      });

      expect(uploadResults).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('deleteImage', () => {
    const mockImageUrl = 'https://firebase.storage.com/image.jpg';

    it('successfully deletes an image', async () => {
      mockImageUploadService.deleteImage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useImageUpload());

      await act(async () => {
        await result.current.deleteImage(mockImageUrl);
      });

      expect(mockImageUploadService.deleteImage).toHaveBeenCalledWith(mockImageUrl);
      expect(mockToast.show).toHaveBeenCalledWith({
        title: '삭제 완료',
        description: '이미지가 성공적으로 삭제되었습니다.',
        status: 'success'
      });
    });

    it('handles deletion errors', async () => {
      const errorMessage = '삭제 실패';
      mockImageUploadService.deleteImage.mockRejectedValue(
        new AppError(ErrorType.NETWORK_ERROR, errorMessage)
      );

      const { result } = renderHook(() => useImageUpload());

      await act(async () => {
        await result.current.deleteImage(mockImageUrl);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockToast.show).toHaveBeenCalledWith({
        title: '삭제 실패',
        description: errorMessage,
        status: 'error'
      });
    });
  });

  describe('error handling', () => {
    it('clears error when clearError is called', async () => {
      // First set an error
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(
        new Error('Test error')
      );

      const { result } = renderHook(() => useImageUpload());

      await act(async () => {
        await result.current.uploadImage(mockImageUri);
      });

      expect(result.current.error).toBeTruthy();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('handles non-AppError exceptions', async () => {
      mockImageUploadService.uploadImageFromUri.mockRejectedValue(
        new Error('Generic error')
      );

      const { result } = renderHook(() => useImageUpload());

      await act(async () => {
        await result.current.uploadImage(mockImageUri);
      });

      expect(result.current.error).toBe('이미지 업로드 중 오류가 발생했습니다.');
    });
  });
});