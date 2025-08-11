import React, { useState, useEffect } from 'react';
import {
  Box,
  Image,
  Spinner,
  Text,
  Center,
  IconButton,
  Pressable
} from 'native-base';
import { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CachedImageProps {
  uri: string;
  alt?: string;
  style?: ViewStyle;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  showFullScreenButton?: boolean;
  onPress?: () => void;
  fallbackIcon?: string;
  placeholder?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  cacheKey?: string;
  priority?: 'low' | 'normal' | 'high';
}

// Simple in-memory cache for image loading states
const imageCache = new Map<string, { status: 'loading' | 'loaded' | 'error'; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  alt = 'Image',
  style,
  width = '100%',
  height = 200,
  borderRadius = 8,
  resizeMode = 'cover',
  showFullScreenButton = false,
  onPress,
  fallbackIcon = 'image',
  placeholder,
  loadingComponent,
  errorComponent,
  cacheKey,
  priority = 'normal'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const effectiveCacheKey = cacheKey || uri;

  useEffect(() => {
    // Check cache first
    const cached = imageCache.get(effectiveCacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setIsLoading(cached.status === 'loading');
      setHasError(cached.status === 'error');
      return;
    }

    // Clear expired cache entries
    for (const [key, value] of imageCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        imageCache.delete(key);
      }
    }

    // Set initial loading state
    setIsLoading(true);
    setHasError(false);
    imageCache.set(effectiveCacheKey, { status: 'loading', timestamp: now });
  }, [effectiveCacheKey]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    imageCache.set(effectiveCacheKey, { status: 'loading', timestamp: Date.now() });
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    imageCache.set(effectiveCacheKey, { status: 'loaded', timestamp: Date.now() });
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    imageCache.set(effectiveCacheKey, { status: 'error', timestamp: Date.now() });
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setHasError(false);
      setIsLoading(true);
      imageCache.delete(effectiveCacheKey);
    }
  };

  const renderError = () => {
    if (errorComponent) {
      return errorComponent;
    }

    return (
      <Center
        width={width}
        height={height}
        borderRadius={borderRadius}
        bg="gray.100"
        style={style}
      >
        <Ionicons name={fallbackIcon as any} size={40} color="gray" />
        <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
          이미지를 불러올 수 없습니다
        </Text>
        {retryCount < 3 && (
          <IconButton
            icon={<Ionicons name="refresh" size={16} />}
            onPress={handleRetry}
            variant="ghost"
            size="sm"
            mt={1}
          />
        )}
      </Center>
    );
  };

  const renderLoading = () => {
    if (loadingComponent) {
      return loadingComponent;
    }

    if (placeholder) {
      return (
        <Box
          width={width}
          height={height}
          borderRadius={borderRadius}
          style={style}
          position="relative"
        >
          {placeholder}
          <Center
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(255,255,255,0.8)"
            borderRadius={borderRadius}
          >
            <Spinner size="lg" />
          </Center>
        </Box>
      );
    }

    return (
      <Center
        width={width}
        height={height}
        borderRadius={borderRadius}
        bg="gray.100"
        style={style}
      >
        <Spinner size="lg" />
        <Text fontSize="sm" color="gray.500" mt={2}>
          이미지 로딩 중...
        </Text>
      </Center>
    );
  };

  if (hasError) {
    return renderError();
  }

  return (
    <Box
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
      position="relative"
    >
      {isLoading && (
        <Center
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="gray.100"
          borderRadius={borderRadius}
          zIndex={1}
        >
          <Spinner size="lg" />
          <Text fontSize="sm" color="gray.500" mt={2}>
            이미지 로딩 중...
          </Text>
        </Center>
      )}
      
      <Pressable onPress={onPress} disabled={!onPress}>
        <Image
          source={{ 
            uri,
            // Add cache control headers for better caching
            headers: {
              'Cache-Control': 'max-age=3600'
            }
          }}
          alt={alt}
          width="100%"
          height="100%"
          borderRadius={borderRadius}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          // Add priority hint for better loading performance
          priority={priority}
        />
      </Pressable>

      {showFullScreenButton && !isLoading && !hasError && (
        <IconButton
          icon={<Ionicons name="expand" size={16} />}
          position="absolute"
          top={2}
          right={2}
          bg="rgba(0,0,0,0.5)"
          borderRadius="full"
          size="sm"
          onPress={onPress}
          _icon={{ color: 'white' }}
        />
      )}
    </Box>
  );
};

export default CachedImage;