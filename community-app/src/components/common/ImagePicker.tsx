import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Image,
  VStack,
  HStack,
  Text,
  IconButton,
  useToast,
  AlertDialog,
  Center
} from 'native-base';
import { Alert } from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export interface ImagePickerProps {
  onImageSelected: (uri: string) => void;
  onImageRemoved?: () => void;
  selectedImageUri?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  disabled?: boolean;
}

const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelected,
  onImageRemoved,
  selectedImageUri,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.8,
  disabled = false
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const cancelRef = useRef(null);
  const toast = useToast();

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ExpoImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      toast.show({
        title: '권한 필요',
        description: '이미지를 선택하려면 카메라와 갤러리 접근 권한이 필요합니다.'
      });
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality,
        maxWidth,
        maxHeight,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (5MB limit)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          toast.show({
            title: '파일 크기 초과',
            description: '이미지 크기는 5MB 이하여야 합니다.'
          });
          return;
        }

        onImageSelected(asset.uri);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      toast.show({
        title: '오류',
        description: '갤러리에서 이미지를 선택하는 중 오류가 발생했습니다.'
      });
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ExpoImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality,
        maxWidth,
        maxHeight,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (5MB limit)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          toast.show({
            title: '파일 크기 초과',
            description: '이미지 크기는 5MB 이하여야 합니다.'
          });
          return;
        }

        onImageSelected(asset.uri);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Camera picker error:', error);
      toast.show({
        title: '오류',
        description: '카메라에서 이미지를 촬영하는 중 오류가 발생했습니다.'
      });
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      '이미지 제거',
      '선택한 이미지를 제거하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제거',
          style: 'destructive',
          onPress: () => onImageRemoved?.()
        }
      ]
    );
  };

  return (
    <VStack space={4}>
      {selectedImageUri ? (
        <Box borderRadius="lg" overflow="hidden" shadow={1}>
          <Image
            source={{ uri: selectedImageUri }}
            alt="Selected image"
            width="100%"
            height={180}
            resizeMode="cover"
          />
          <HStack 
            justifyContent="space-between" 
            alignItems="center"
            mt={3}
            space={3}
          >
            <Button
              variant="outline"
              size="md"
              onPress={() => setIsDialogOpen(true)}
              disabled={disabled}
              leftIcon={<Ionicons name="camera" size={18} />}
              borderRadius="lg"
              flex={1}
              _text={{ fontSize: "sm" }}
            >
              이미지 변경
            </Button>
            <IconButton
              icon={<Ionicons name="trash" size={18} />}
              onPress={handleRemoveImage}
              disabled={disabled}
              variant="ghost"
              colorScheme="red"
              borderRadius="lg"
              size="md"
            />
          </HStack>
        </Box>
      ) : (
        <Box 
          borderWidth={2} 
          borderColor="gray.200" 
          borderStyle="dashed" 
          borderRadius="lg"
          py={6}
          px={4}
          bg="gray.50"
        >
          <Center>
            <Ionicons name="camera" size={28} color="#9CA3AF" />
            <Button
              variant="outline"
              onPress={() => setIsDialogOpen(true)}
              disabled={disabled}
              size="md"
              borderRadius="lg"
              mt={3}
              _text={{ fontSize: "sm", fontWeight: "medium" }}
            >
              이미지 선택
            </Button>
            <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
              최대 5MB, JPG/PNG 형식
            </Text>
          </Center>
        </Box>
      )}

      <AlertDialog 
        leastDestructiveRef={cancelRef}
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
      >
        <AlertDialog.Content borderRadius="xl">
          <AlertDialog.Header 
            _text={{ fontSize: "lg", fontWeight: "bold" }}
          >
            이미지 선택
          </AlertDialog.Header>
          <AlertDialog.Body>
            <VStack space={4}>
              <Button
                variant="outline"
                onPress={pickImageFromGallery}
                leftIcon={<Ionicons name="images" size={20} />}
                size="lg"
                borderRadius="lg"
                _text={{ fontSize: "md" }}
              >
                갤러리에서 선택
              </Button>
              <Button
                variant="outline"
                onPress={pickImageFromCamera}
                leftIcon={<Ionicons name="camera" size={20} />}
                size="lg"
                borderRadius="lg"
                _text={{ fontSize: "md" }}
              >
                카메라로 촬영
              </Button>
            </VStack>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button 
              variant="ghost" 
              onPress={() => setIsDialogOpen(false)}
              ref={cancelRef}
              borderRadius="lg"
            >
              취소
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </VStack>
  );
};

export default ImagePicker;