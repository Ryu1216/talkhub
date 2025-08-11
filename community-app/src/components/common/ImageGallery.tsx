import React, { useState } from 'react';
import {
  Box,
  FlatList,
  Modal,
  IconButton,
  HStack,
  Text,
  Pressable
} from 'native-base';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CachedImage from './CachedImage';

export interface ImageGalleryProps {
  images: string[];
  columns?: number;
  spacing?: number;
  aspectRatio?: number;
  onImagePress?: (imageUri: string, index: number) => void;
  showFullScreen?: boolean;
  placeholder?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

const { width: screenWidth } = Dimensions.get('window');

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 2,
  spacing = 8,
  aspectRatio = 1,
  onImagePress,
  showFullScreen = true,
  placeholder,
  loadingComponent,
  errorComponent
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const imageWidth = (screenWidth - (spacing * (columns + 1))) / columns;
  const imageHeight = imageWidth / aspectRatio;

  const handleImagePress = (imageUri: string, index: number) => {
    if (onImagePress) {
      onImagePress(imageUri, index);
    } else if (showFullScreen) {
      setSelectedImageIndex(index);
      setIsModalVisible(true);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedImageIndex(null);
  };

  const handlePrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const renderImage = ({ item, index }: { item: string; index: number }) => (
    <Box mb={spacing}>
      <CachedImage
        uri={item}
        width={imageWidth}
        height={imageHeight}
        onPress={() => handleImagePress(item, index)}
        placeholder={placeholder}
        loadingComponent={loadingComponent}
        errorComponent={errorComponent}
        cacheKey={`gallery-${index}-${item}`}
        priority={index < 4 ? 'high' : 'normal'} // Prioritize first 4 images
      />
    </Box>
  );

  const renderFullScreenModal = () => {
    if (selectedImageIndex === null) return null;

    const currentImage = images[selectedImageIndex];
    const isFirst = selectedImageIndex === 0;
    const isLast = selectedImageIndex === images.length - 1;

    return (
      <Modal isOpen={isModalVisible} onClose={handleModalClose} size="full">
        <Modal.Content bg="black" maxWidth="100%" maxHeight="100%">
          <Modal.Header bg="black" borderBottomWidth={0}>
            <HStack justifyContent="space-between" alignItems="center" width="100%">
              <Text color="white" fontSize="lg">
                {selectedImageIndex + 1} / {images.length}
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
            <Box flex={1} position="relative">
              <CachedImage
                uri={currentImage}
                width="100%"
                height="100%"
                resizeMode="contain"
                cacheKey={`fullscreen-${selectedImageIndex}-${currentImage}`}
                priority="high"
              />
              
              {/* Navigation arrows */}
              {!isFirst && (
                <IconButton
                  icon={<Ionicons name="chevron-back" size={32} />}
                  position="absolute"
                  left={4}
                  top="50%"
                  transform={[{ translateY: -16 }]}
                  bg="rgba(0,0,0,0.5)"
                  borderRadius="full"
                  onPress={handlePrevious}
                  _icon={{ color: 'white' }}
                />
              )}
              
              {!isLast && (
                <IconButton
                  icon={<Ionicons name="chevron-forward" size={32} />}
                  position="absolute"
                  right={4}
                  top="50%"
                  transform={[{ translateY: -16 }]}
                  bg="rgba(0,0,0,0.5)"
                  borderRadius="full"
                  onPress={handleNext}
                  _icon={{ color: 'white' }}
                />
              )}
            </Box>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    );
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <Box>
      <FlatList
        data={images}
        renderItem={renderImage}
        keyExtractor={(item, index) => `${item}-${index}`}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? { justifyContent: 'space-between' } : undefined}
        contentContainerStyle={{ padding: spacing }}
        showsVerticalScrollIndicator={false}
      />
      
      {showFullScreen && renderFullScreenModal()}
    </Box>
  );
};

export default ImageGallery;