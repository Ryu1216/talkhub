import React, { useEffect } from 'react';
import {
  VStack,
  Divider,
  Text,
  HStack,
  Icon,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { Comment, CreateCommentData } from '../../types';
import CommentList from './CommentList';
import CommentInput from './CommentInput';

interface CommentsSectionProps {
  postId: string;
  comments: Comment[];
  loading?: boolean;
  error?: string | null;
  onAddComment: (data: CreateCommentData) => Promise<void>;
  addCommentLoading?: boolean;
  addCommentError?: string | null;
  isRealTimeConnected?: boolean;
}

export default function CommentsSection({ 
  postId, 
  comments, 
  loading = false, 
  error = null,
  onAddComment,
  addCommentLoading = false,
  addCommentError = null,
  isRealTimeConnected = true
}: CommentsSectionProps) {
  return (
    <VStack space={4}>
      {/* Comments Header */}
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="md" fontWeight="semibold" color="gray.700">
          댓글 {comments.length}개
        </Text>
        
        {/* Real-time connection indicator */}
        <HStack alignItems="center" space={1}>
          <Icon
            as={Ionicons}
            name={isRealTimeConnected ? "wifi" : "wifi-outline"}
            size="xs"
            color={isRealTimeConnected ? "green.500" : "gray.400"}
          />
          <Text fontSize="xs" color={isRealTimeConnected ? "green.500" : "gray.400"}>
            {isRealTimeConnected ? "실시간" : "연결 끊김"}
          </Text>
        </HStack>
      </HStack>
      
      {/* Comment Input */}
      <CommentInput
        postId={postId}
        onSubmit={onAddComment}
        loading={addCommentLoading}
        error={addCommentError}
      />
      
      {/* Divider */}
      {comments.length > 0 && <Divider />}
      
      {/* Comments List */}
      <CommentList
        comments={comments}
        loading={loading}
        error={error}
      />
    </VStack>
  );
}