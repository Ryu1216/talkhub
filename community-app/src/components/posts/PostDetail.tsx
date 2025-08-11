import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Image,
  Avatar,
  Divider,
  ScrollView,
  Box,
  Spinner,
  Center,
} from 'native-base';
import { Post } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PostDetailProps {
  post: Post | null;
  loading?: boolean;
  children?: React.ReactNode; // For comments section
}

export default function PostDetail({ post, loading = false, children }: PostDetailProps) {
  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ko 
      });
    } catch (error) {
      return '방금 전';
    }
  };

  if (loading) {
    return (
      <Center flex={1} py={20}>
        <Spinner size="lg" color="blue.500" />
        <Text fontSize="md" color="gray.500" mt={4}>
          게시글을 불러오는 중...
        </Text>
      </Center>
    );
  }

  if (!post) {
    return (
      <Center flex={1} py={20}>
        <VStack alignItems="center" space={4}>
          <Text fontSize="lg" color="gray.600" textAlign="center">
            😕
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center">
            게시글을 찾을 수 없습니다
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            게시글이 삭제되었거나 존재하지 않습니다
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <VStack space={4} p={4}>
        {/* Post Header */}
        <VStack space={3}>
          {/* Author Info */}
          <HStack alignItems="center" space={3}>
            <Avatar 
              size="md" 
              bg="blue.500"
              _text={{ color: 'white', fontSize: 'sm' }}
            >
              {post.authorName.charAt(0).toUpperCase()}
            </Avatar>
            <VStack flex={1}>
              <Text fontSize="md" fontWeight="semibold" color="gray.700">
                {post.authorName}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {formatDate(post.createdAt)}
              </Text>
            </VStack>
          </HStack>

          {/* Post Title */}
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            color="gray.800"
            lineHeight="lg"
          >
            {post.title}
          </Text>
        </VStack>

        <Divider />

        {/* Post Content */}
        <VStack space={4}>
          {/* Text Content */}
          <Text 
            fontSize="md" 
            color="gray.700" 
            lineHeight="md"
            textAlign="left"
          >
            {post.content}
          </Text>

          {/* Image if exists */}
          {post.imageUrl && (
            <Box borderRadius="md" overflow="hidden" shadow={2}>
              <Image
                source={{ uri: post.imageUrl }}
                alt={post.title}
                width="100%"
                height={300}
                resizeMode="cover"
                fallbackSource={{
                  uri: 'https://via.placeholder.com/400x300?text=Image+Not+Found'
                }}
              />
            </Box>
          )}
        </VStack>

        {/* Post Stats */}
        <HStack justifyContent="flex-end" alignItems="center" py={2}>
          <Text fontSize="xs" color="gray.400">
            {post.createdAt !== post.updatedAt && '수정됨 · '}
            게시글 ID: {post.id.slice(0, 8)}...
          </Text>
        </HStack>

        <Divider />

        {/* Comments Section */}
        {children && (
          <VStack space={3}>
            {children}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}