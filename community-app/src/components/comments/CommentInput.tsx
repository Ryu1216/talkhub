import React, { useState, useRef } from 'react';
import {
  HStack,
  Input,
  IconButton,
  Text,
  VStack,
  Alert,
  useToast,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { CreateCommentData } from '../../types';

interface CommentInputProps {
  postId: string;
  onSubmit: (data: CreateCommentData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
}

export default function CommentInput({ 
  postId,
  onSubmit, 
  loading = false, 
  error = null,
  placeholder = "댓글을 입력하세요..."
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<any>(null);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      return;
    }

    const trimmedContent = content.trim();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        postId,
        content: trimmedContent
      });
      
      // Clear input immediately after successful submission
      setContent('');
      
      // Show success feedback
      toast.show({
        title: '댓글이 작성되었습니다',
        status: 'success',
        duration: 2000,
      });
      
      // Blur the input to hide keyboard on mobile
      if (inputRef.current) {
        inputRef.current.blur();
      }
      
      console.log('Comment submitted successfully, input cleared');
    } catch (error) {
      console.error('Comment submission error:', error);
      
      // Show error feedback
      toast.show({
        title: '댓글 작성 실패',
        description: '댓글 작성 중 오류가 발생했습니다. 다시 시도해주세요.',
        status: 'error',
        duration: 3000,
      });
      
      // Don't clear input on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: any) => {
    // Handle Enter key press for web
    if (e.nativeEvent?.key === 'Enter' && !e.nativeEvent?.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = loading || isSubmitting || !content.trim();

  return (
    <VStack space={2}>
      {error && (
        <Alert status="error" borderRadius="md">
          <HStack space={2} alignItems="center" flex={1}>
            <Alert.Icon />
            <Text fontSize="sm" color="error.600" flex={1}>
              {error}
            </Text>
          </HStack>
        </Alert>
      )}
      
      <HStack space={2} alignItems="center">
        <Input
          ref={inputRef}
          flex={1}
          placeholder={placeholder}
          value={content}
          onChangeText={setContent}
          onSubmitEditing={handleSubmit}
          onKeyPress={handleKeyPress}
          multiline
          maxLength={500}
          isDisabled={loading || isSubmitting}
          bg="white"
          borderColor="gray.300"
          borderRadius="lg"
          _focus={{
            borderColor: "blue.500",
            bg: "white"
          }}
          _disabled={{
            bg: "gray.100",
            opacity: 0.6
          }}
          size="md"
        />
        <IconButton
          icon={
            <Ionicons 
              name="send" 
              size={20} 
              color={isDisabled ? "#9CA3AF" : "#3B82F6"} 
            />
          }
          onPress={handleSubmit}
          isDisabled={isDisabled}
          bg="blue.500"
          _pressed={{ bg: "blue.600" }}
          _disabled={{ 
            bg: "gray.300",
            opacity: 0.6
          }}
          borderRadius="full"
          size="md"
        />
      </HStack>
      
      {content.length > 0 && (
        <Text fontSize="xs" color="gray.500" textAlign="right">
          {content.length}/500
        </Text>
      )}
    </VStack>
  );
}