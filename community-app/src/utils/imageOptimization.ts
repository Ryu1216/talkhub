import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface OptimizedImageParams {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
}

/**
 * Calculate optimal image dimensions based on container size and screen dimensions
 */
export const calculateOptimalDimensions = (
  containerWidth: number,
  containerHeight: number,
  originalWidth?: number,
  originalHeight?: number
): { width: number; height: number } => {
  // Use container dimensions as base
  let optimalWidth = containerWidth;
  let optimalHeight = containerHeight;

  // If we have original dimensions, maintain aspect ratio
  if (originalWidth && originalHeight) {
    const aspectRatio = originalWidth / originalHeight;
    
    if (containerWidth / containerHeight > aspectRatio) {
      // Container is wider than image aspect ratio
      optimalWidth = containerHeight * aspectRatio;
      optimalHeight = containerHeight;
    } else {
      // Container is taller than image aspect ratio
      optimalWidth = containerWidth;
      optimalHeight = containerWidth / aspectRatio;
    }
  }

  // Ensure dimensions don't exceed screen size
  const maxWidth = screenWidth * 2; // Allow for high DPI screens
  const maxHeight = screenHeight * 2;

  if (optimalWidth > maxWidth) {
    const scale = maxWidth / optimalWidth;
    optimalWidth = maxWidth;
    optimalHeight = optimalHeight * scale;
  }

  if (optimalHeight > maxHeight) {
    const scale = maxHeight / optimalHeight;
    optimalHeight = maxHeight;
    optimalWidth = optimalWidth * scale;
  }

  return {
    width: Math.round(optimalWidth),
    height: Math.round(optimalHeight)
  };
};

/**
 * Generate optimized image URL parameters for services that support it
 */
export const generateOptimizedImageUrl = (
  baseUrl: string,
  options: ImageOptimizationOptions = {}
): string => {
  const {
    maxWidth = screenWidth,
    maxHeight = screenHeight,
    quality = 80,
    format = 'jpeg'
  } = options;

  // For Firebase Storage URLs, we can add transformation parameters
  if (baseUrl.includes('firebasestorage.googleapis.com')) {
    const url = new URL(baseUrl);
    
    // Add transformation parameters
    url.searchParams.set('w', maxWidth.toString());
    url.searchParams.set('h', maxHeight.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('f', format);
    
    return url.toString();
  }

  // For other services, return original URL
  return baseUrl;
};

/**
 * Determine appropriate image quality based on network conditions and device
 */
export const getAdaptiveQuality = (): number => {
  // In a real app, you might check network conditions here
  // For now, return a reasonable default
  const pixelRatio = Dimensions.get('window').scale;
  
  if (pixelRatio >= 3) {
    // High DPI screens can benefit from higher quality
    return 85;
  } else if (pixelRatio >= 2) {
    // Standard retina screens
    return 80;
  } else {
    // Lower DPI screens
    return 75;
  }
};

/**
 * Calculate memory usage for an image
 */
export const calculateImageMemoryUsage = (
  width: number,
  height: number,
  bytesPerPixel: number = 4 // RGBA
): number => {
  return width * height * bytesPerPixel;
};

/**
 * Check if image dimensions are reasonable for mobile display
 */
export const validateImageDimensions = (
  width: number,
  height: number
): { isValid: boolean; reason?: string } => {
  const maxDimension = Math.max(screenWidth, screenHeight) * 4; // Allow up to 4x screen size
  const maxMemory = 50 * 1024 * 1024; // 50MB limit
  
  if (width > maxDimension || height > maxDimension) {
    return {
      isValid: false,
      reason: `Image dimensions too large. Maximum: ${maxDimension}px`
    };
  }
  
  const memoryUsage = calculateImageMemoryUsage(width, height);
  if (memoryUsage > maxMemory) {
    return {
      isValid: false,
      reason: `Image would use too much memory: ${Math.round(memoryUsage / 1024 / 1024)}MB`
    };
  }
  
  return { isValid: true };
};

/**
 * Generate cache key for images based on URL and optimization parameters
 */
export const generateImageCacheKey = (
  url: string,
  options: ImageOptimizationOptions = {}
): string => {
  const { maxWidth, maxHeight, quality, format } = options;
  const params = [
    url,
    maxWidth && `w${maxWidth}`,
    maxHeight && `h${maxHeight}`,
    quality && `q${quality}`,
    format && `f${format}`
  ].filter(Boolean).join('_');
  
  // Create a simple hash of the parameters
  let hash = 0;
  for (let i = 0; i < params.length; i++) {
    const char = params.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `img_${Math.abs(hash).toString(36)}`;
};