import React, { useState } from 'react';
import {
  VStack,
  FormControl,
  Input,
  TextArea,
  Button,
  Text,
  Alert,
  HStack,
  Icon,
  Box,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { validateRequired } from '../../utils';
import { ERROR_MESSAGES, APP_CONSTANTS } from '../../constants';
import { AppError, CreatePostData } from '../../types';
import { ImagePicker } from '../common';

export interface CreatePostFormProps {
  onSubmit: (data: CreatePostData) => Promise<void>;
  loading: boolean;
  error: AppError | null;
  onClearError: () => void;
  onFormChange?: (hasChanges: boolean) => void;
}

interface FormErrors {
  title?: string;
  content?: string;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  onSubmit,
  loading,
  error,
  onClearError,
  onFormChange,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | undefined>();
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ title: boolean; content: boolean }>({
    title: false,
    content: false,
  });

  // Track if form has unsaved changes
  const hasUnsavedChanges = title.trim() !== '' || content.trim() !== '' || selectedImageUri !== undefined;

  // Notify parent component about form changes
  React.useEffect(() => {
    onFormChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onFormChange]);

  // Real-time validation
  const validateField = (field: 'title' | 'content', value: string): string | undefined => {
    switch (field) {
      case 'title':
        if (!validateRequired(value)) {
          return ERROR_MESSAGES.VALIDATION_REQUIRED_FIELD;
        }
        if (value.length > APP_CONSTANTS.MAX_POST_TITLE_LENGTH) {
          return ERROR_MESSAGES.VALIDATION_TITLE_TOO_LONG;
        }
        return undefined;
      case 'content':
        if (!validateRequired(value)) {
          return ERROR_MESSAGES.VALIDATION_REQUIRED_FIELD;
        }
        if (value.length > APP_CONSTANTS.MAX_POST_CONTENT_LENGTH) {
          return ERROR_MESSAGES.VALIDATION_CONTENT_TOO_LONG;
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (field: 'title' | 'content', value: string) => {
    // Clear global error when user starts typing
    if (error) {
      onClearError();
    }

    if (field === 'title') {
      setTitle(value);
      if (touched.title) {
        const titleError = validateField('title', value);
        setFormErrors(prev => ({ ...prev, title: titleError }));
      }
    } else {
      setContent(value);
      if (touched.content) {
        const contentError = validateField('content', value);
        setFormErrors(prev => ({ ...prev, content: contentError }));
      }
    }
  };

  const handleFieldBlur = (field: 'title' | 'content') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const value = field === 'title' ? title : content;
    const fieldError = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  const validateForm = (): boolean => {
    const titleError = validateField('title', title);
    const contentError = validateField('content', content);
    
    setFormErrors({
      title: titleError,
      content: contentError,
    });
    
    setTouched({ title: true, content: true });
    
    return !titleError && !contentError;
  };

  const handleImageSelected = (uri: string) => {
    setSelectedImageUri(uri);
    // Clear error when image is selected
    if (error) {
      onClearError();
    }
  };

  const handleImageRemoved = () => {
    setSelectedImageUri(undefined);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const postData: CreatePostData = {
      title: title.trim(),
      content: content.trim(),
    };

    // Add image data if selected
    if (selectedImageUri) {
      // Extract filename from URI for better organization
      const filename = selectedImageUri.split('/').pop() || 'image.jpg';
      const fileExtension = filename.split('.').pop() || 'jpg';
      
      postData.image = {
        uri: selectedImageUri,
        type: `image/${fileExtension}`,
        name: filename,
      };
    }

    try {
      await onSubmit(postData);
      // Reset form on successful submission
      setTitle('');
      setContent('');
      setSelectedImageUri(undefined);
      setFormErrors({});
      setTouched({ title: false, content: false });
    } catch (err) {
      // Error handling is managed by the parent component through the error prop
      console.error('Form submission error:', err);
    }
  };

  const isFormValid = !formErrors.title && !formErrors.content && title.trim() && content.trim();

  return (
    <VStack space={4} width="100%">
      {/* Global Error Alert */}
      {error && (
        <Alert status="error" variant="left-accent" borderRadius="lg">
          <VStack space={2} flexShrink={1} w="100%">
            <HStack flexShrink={1} space={3} alignItems="center">
              <Alert.Icon />
              <Text fontSize="md" fontWeight="semibold" color="error.700">
                오류가 발생했습니다
              </Text>
            </HStack>
            <Text px="6" color="error.600" fontSize="sm" lineHeight="sm">
              {error.message}
            </Text>
          </VStack>
        </Alert>
      )}

      {/* Title Field */}
      <FormControl isInvalid={!!formErrors.title && touched.title}>
        <FormControl.Label 
          _text={{ 
            fontSize: "sm", 
            fontWeight: "semibold", 
            color: "gray.700",
            mb: 1
          }}
        >
          제목
        </FormControl.Label>
        <Input
          value={title}
          onChangeText={(value) => handleFieldChange('title', value)}
          onBlur={() => handleFieldBlur('title')}
          placeholder="게시글 제목을 입력하세요"
          isDisabled={loading}
          size="lg"
          borderRadius="xl"
          bg="white"
          borderColor="gray.200"
          _focus={{
            borderColor: "blue.400",
            bg: "white"
          }}
          _invalid={{
            borderColor: "red.400"
          }}
          InputLeftElement={
            <Icon
              as={<MaterialIcons name="title" />}
              size={5}
              ml="4"
              color="gray.400"
            />
          }
          _text={{
            fontSize: "md"
          }}
        />
        {formErrors.title && touched.title && (
          <FormControl.ErrorMessage 
            _text={{ fontSize: "sm", mt: 1 }}
          >
            {formErrors.title}
          </FormControl.ErrorMessage>
        )}
        <Box alignItems="flex-end" mt={1}>
          <Text 
            fontSize="xs" 
            color={title.length > APP_CONSTANTS.MAX_POST_TITLE_LENGTH * 0.9 ? "red.500" : "gray.500"}
            fontFamily="mono"
          >
            {title.length.toLocaleString()}/{APP_CONSTANTS.MAX_POST_TITLE_LENGTH.toLocaleString()}자
          </Text>
        </Box>
      </FormControl>

      {/* Content Field */}
      <FormControl isInvalid={!!formErrors.content && touched.content}>
        <FormControl.Label 
          _text={{ 
            fontSize: "sm", 
            fontWeight: "semibold", 
            color: "gray.700",
            mb: 1
          }}
        >
          내용
        </FormControl.Label>
        <TextArea
          value={content}
          onChangeText={(value) => handleFieldChange('content', value)}
          onBlur={() => handleFieldBlur('content')}
          placeholder="게시글 내용을 입력하세요"
          minHeight={120}
          maxHeight={200}
          isDisabled={loading}
          autoCompleteType={undefined}
          borderRadius="xl"
          bg="white"
          borderColor="gray.200"
          _focus={{
            borderColor: "blue.400",
            bg: "white"
          }}
          _invalid={{
            borderColor: "red.400"
          }}
          _text={{
            fontSize: "md",
            lineHeight: "md"
          }}
          p={4}
        />
        {formErrors.content && touched.content && (
          <FormControl.ErrorMessage 
            _text={{ fontSize: "sm", mt: 1 }}
          >
            {formErrors.content}
          </FormControl.ErrorMessage>
        )}
        <Box alignItems="flex-end" mt={1}>
          <Text 
            fontSize="xs" 
            color={content.length > APP_CONSTANTS.MAX_POST_CONTENT_LENGTH * 0.9 ? "red.500" : "gray.500"}
            fontFamily="mono"
          >
            {content.length.toLocaleString()}/{APP_CONSTANTS.MAX_POST_CONTENT_LENGTH.toLocaleString()}자
          </Text>
        </Box>
      </FormControl>

      {/* Image Picker */}
      <FormControl>
        <FormControl.Label 
          _text={{ 
            fontSize: "sm", 
            fontWeight: "semibold", 
            color: "gray.700",
            mb: 1
          }}
        >
          이미지 첨부 (선택사항)
        </FormControl.Label>
        <ImagePicker
          onImageSelected={handleImageSelected}
          onImageRemoved={handleImageRemoved}
          selectedImageUri={selectedImageUri}
          disabled={loading}
        />
      </FormControl>

      {/* Submit Button */}
      <Button
        onPress={handleSubmit}
        isLoading={loading}
        isLoadingText="게시글 작성 중..."
        isDisabled={loading || !isFormValid}
        size="lg"
        colorScheme="blue"
        borderRadius="xl"
        py={4}
        _text={{
          fontWeight: 'bold',
          fontSize: 'md'
        }}
        _pressed={{
          bg: 'blue.600'
        }}
        shadow={2}
      >
        게시글 작성
      </Button>
    </VStack>
  );
};