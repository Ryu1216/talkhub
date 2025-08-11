import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: ImageManipulator.SaveFormat;
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Compress and resize an image
 */
export const compressImage = async (
  uri: string,
  options: ImageCompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = ImageManipulator.SaveFormat.JPEG
  } = options;

  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('이미지 압축 중 오류가 발생했습니다.');
  }
};

/**
 * Validate image file
 */
export const validateImage = (
  uri: string,
  maxSizeInMB: number = 5
): ImageValidationResult => {
  if (!uri) {
    return {
      isValid: false,
      error: '이미지 URI가 필요합니다.'
    };
  }

  // Check if it's a valid image URI
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = imageExtensions.some(ext => 
    uri.toLowerCase().includes(ext)
  );

  if (!hasValidExtension && !uri.startsWith('data:image/')) {
    return {
      isValid: false,
      error: '지원되지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)'
    };
  }

  return {
    isValid: true
  };
};

/**
 * Get image dimensions
 */
export const getImageDimensions = async (uri: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height
      });
    };
    image.onerror = () => {
      reject(new Error('이미지 크기를 가져올 수 없습니다.'));
    };
    image.src = uri;
  });
};

/**
 * Generate a unique filename for image upload
 */
export const generateImageFileName = (userId: string, extension: string = 'jpg'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${userId}_${timestamp}_${random}.${extension}`;
};

/**
 * Extract file extension from URI
 */
export const getFileExtension = (uri: string): string => {
  // Remove query parameters first
  const cleanUri = uri.split('?')[0];
  const match = cleanUri.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
};

/**
 * Convert data URI to blob (for web compatibility)
 */
export const dataURItoBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeString });
};