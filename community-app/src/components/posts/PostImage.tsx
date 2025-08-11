import React, { useState } from 'react';
import {
  Box,
  Modal,
  IconButton,
  HStack,
  Text,
  Pressable
} from 'native-base';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CachedImage from '../common/CachedImage';

export interface PostImageProps {
  imageUrl: string;
  postId: string;
  alt?: string;
  maxHeight?: number;
  showFullScreen?: boolean;
  onPress?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PostImage: React.FC<PostImageProps> = ({
  imageUrl,
  postId,
  alt = 'Post image',
  maxHeight = 300,
  showFullScreen = true,
  onPress
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleImagePress = () => {
    if (onPress) {
      onPress();
    } else if (showFullScreen) {
      setIsModalVisible(true);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const renderFullScreenModal = () => (
    <Modal isOpen={isModalVisible} onClose={handleModalClose} size="full">
      <Modal.Content bg="black" maxWidth="100%" maxHeight="100%">
        <Modal.Header bg="black" borderBottomWidth={0}>
          <HStack justifyContent="space-between" alignItems="center" width="100%">
            <Text color="white" fontSize="lg">
              이미지 보기
            </Text>
            <IconButton
              icon={<Ionicons name="close" size={24} />}
              onPress={handleModalClose}
              _icon={{ color: 'white' }}
              variant="ghost"
            />
          </HStack>
        </Modal.Header>
        
        <Modal.Body bg="black" flex={1} p={0}>
          <Box flex={1} justifyContent="center" alignItems="center">
            <CachedImage
              uri={imageUrl}
              width={screenWidth}
              height={screenHeight - 100}
              resizeMode="contain"
              cacheKey={`fullscreen-post-${postId}`}
              priority="high"
              borderRadius={0}
            />
          </Box>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );

  return (
    <Box>
      <Pressable onPress={handleImagePress}>
        <CachedImage
          uri={imageUrl}
          alt={alt}
          width="100%"
          height={maxHeight}
          resizeMode="cover"
          borderRadius={8}
          cacheKey={`post-${postId}`}
          priority="normal"
          showFullScreenButton={showFullScreen}
          onPress={handleImagePress}
          placeholder={
            <Box
              width="100%"
              height={maxHeight}
              bg="gray.100"
              borderRadius={8}
              justifyContent="center"
              alignItems="center"
            >
              <Ionicons name="image" size={40} color="gray" />
            </Box>
          }
        />
      </Pressable>
      
      {showFullScreen && renderFullScreenModal()}
    </Box>
  );
};

export default PostImage;