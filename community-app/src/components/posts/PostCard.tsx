import React from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Image, 
  Pressable,
  Badge,
  Avatar
} from 'native-base';
import { Post } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PostCardProps {
  post: Post;
  onPress: () => void;
}

export default function PostCard({ post, onPress }: PostCardProps) {
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

  return (
    <Pressable onPress={onPress}>
      {({ isPressed }) => (
        <Box
          bg={isPressed ? 'gray.50' : 'white'}
          borderWidth={1}
          borderColor="gray.200"
          borderRadius="md"
          p={4}
          mb={3}
          shadow={1}
        >
          <VStack space={3}>
            {/* Header with author info */}
            <HStack alignItems="center" justifyContent="space-between">
              <HStack alignItems="center" space={2} flex={1}>
                <Avatar 
                  size="sm" 
                  bg="blue.500"
                  _text={{ color: 'white', fontSize: 'xs' }}
                >
                  {post.authorName.charAt(0).toUpperCase()}
                </Avatar>
                <VStack flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    {post.authorName}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {formatDate(post.createdAt)}
                  </Text>
                </VStack>
              </HStack>
              
              {post.commentCount > 0 && (
                <Badge 
                  colorScheme="blue" 
                  variant="subtle" 
                  borderRadius="full"
                  _text={{ fontSize: 'xs' }}
                >
                  댓글 {post.commentCount}
                </Badge>
              )}
            </HStack>

            {/* Post title */}
            <Text 
              fontSize="md" 
              fontWeight="semibold" 
              color="gray.800"
              numberOfLines={2}
            >
              {post.title}
            </Text>

            {/* Post content preview */}
            <Text 
              fontSize="sm" 
              color="gray.600" 
              numberOfLines={3}
              lineHeight="sm"
            >
              {post.content}
            </Text>

            {/* Image preview if exists */}
            {post.imageUrl && (
              <Box borderRadius="md" overflow="hidden">
                <Image
                  source={{ uri: post.imageUrl }}
                  alt={post.title}
                  height={200}
                  width="100%"
                  resizeMode="cover"
                  fallbackSource={{
                    uri: 'https://via.placeholder.com/400x200?text=Image+Not+Found'
                  }}
                />
              </Box>
            )}
          </VStack>
        </Box>
      )}
    </Pressable>
  );
}