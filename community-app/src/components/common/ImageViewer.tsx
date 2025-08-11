import React, { useState } from 'react';
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

export interface ImageViewerProps {
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
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  uri,
  alt = 'Image',
  style,
  width = '100%',
  height = 200,
  borderRadius = 8,
  resizeMode = 'cover',
  showFullScreenButton = false,
  onPress,
  fallbackIcon = 'image'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
  };

  if (hasError) {
    return (
      <Box
        width={width}
        height={height}
        borderRadius={borderRadius}
        bg="gray.100"
        style={style}
      >
        <Center flex={1}>
          <Ionicons name={fallbackIcon as any} size={40} color="gray" />
          <Text fontSize="sm" color="gray.500" mt={2}>
            이미지를 불러올 수 없습니다
          </Text>
          <IconButton
            icon={<Ionicons name="refresh" size={16} />}
            onPress={handleRetry}
            variant="ghost"
            size="sm"
            mt={1}
          />
        </Center>
      </Box>
    );
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
          source={{ uri }}
          alt={alt}
          width="100%"
          height="100%"
          borderRadius={borderRadius}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
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

export default ImageViewer;