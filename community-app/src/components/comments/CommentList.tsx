import React from 'react';
import {
  VStack,
  Text,
  Center,
  Spinner,
  HStack,
  Avatar,
  Box,
} from 'native-base';
import { Comment } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CommentListProps {
  comments: Comment[];
  loading?: boolean;
  error?: string | null;
}

export default function CommentList({ 
  comments, 
  loading = false, 
  error = null 
}: CommentListProps) {
  if (loading) {
    return (
      <Center py={4}>
        <Spinner size="sm" color="blue.500" />
        <Text fontSize="sm" color="gray.500" mt={2}>
          댓글을 불러오는 중...
        </Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={4}>
        <Text fontSize="sm" color="red.500" textAlign="center">
          댓글을 불러올 수 없습니다
        </Text>
        <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
          {error}
        </Text>
      </Center>
    );
  }

  if (comments.length === 0) {
    return (
      <Center py={8}>
        <VStack alignItems="center" space={2}>
          <Text fontSize="md" color="gray.500" textAlign="center">
            💬
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            아직 댓글이 없습니다
          </Text>
          <Text fontSize="xs" color="gray.400" textAlign="center">
            첫 번째 댓글을 작성해보세요!
          </Text>
        </VStack>
      </Center>
    );
  }

  const formatCommentDate = (timestamp: any) => {
    try {
      // Handle Firestore Timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ko 
      });
    } catch (error) {
      return '방금 전';
    }
  };

  return (
    <VStack space={3}>
      {comments.map((comment) => (
        <Box key={comment.id} p={3} bg="gray.50" borderRadius="md">
          <HStack space={3} alignItems="flex-start">
            <Avatar 
              size="sm" 
              bg="blue.500"
              _text={{ fontSize: "xs" }}
            >
              {comment.authorName.charAt(0).toUpperCase()}
            </Avatar>
            <VStack flex={1} space={1}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  {comment.authorName}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {formatCommentDate(comment.createdAt)}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.600" lineHeight="md">
                {comment.content}
              </Text>
            </VStack>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}