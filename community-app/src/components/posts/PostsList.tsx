import React, { useEffect, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import {
  VStack,
  Text,
  Spinner,
  Button,
  Box,
  Center,
} from 'native-base';
import { Post } from '../../types';
import { usePostsStore } from '../../stores/postsStore';
import PostCard from './PostCard';

interface PostsListProps {
  onPostPress: (post: Post) => void;
}

export default function PostsList({ onPostPress }: PostsListProps) {
  const {
    posts,
    loading,
    error,
    hasMore,
    fetchPosts,
    clearError,
  } = usePostsStore();

  // Initial load
  useEffect(() => {
    if (posts.length === 0 && !loading) {
      fetchPosts(true);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchPosts(false);
    }
  }, [hasMore, loading, fetchPosts]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    clearError();
    fetchPosts(true);
  }, [clearError, fetchPosts]);

  // Render individual post item
  const renderPost: ListRenderItem<Post> = useCallback(({ item }) => (
    <PostCard
      post={item}
      onPress={() => onPostPress(item)}
    />
  ), [onPostPress]);

  // Render loading footer for pagination
  const renderFooter = () => {
    if (!loading || posts.length === 0) return null;
    
    return (
      <Center py={4}>
        <Spinner size="sm" color="blue.500" />
        <Text fontSize="sm" color="gray.500" mt={2}>
          게시글을 불러오는 중...
        </Text>
      </Center>
    );
  };

  // Render empty state
  const renderEmpty = () => {
    if (loading && posts.length === 0) {
      return (
        <Center flex={1} py={20}>
          <Spinner size="lg" color="blue.500" />
          <Text fontSize="md" color="gray.500" mt={4}>
            게시글을 불러오는 중...
          </Text>
        </Center>
      );
    }

    if (error) {
      return (
        <Center flex={1} py={20}>
          <VStack alignItems="center" space={4}>
            <Text fontSize="lg" color="gray.600" textAlign="center">
              😕
            </Text>
            <Text fontSize="md" color="gray.600" textAlign="center">
              게시글을 불러올 수 없습니다
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              {error.message}
            </Text>
            <Button
              onPress={handleRetry}
              colorScheme="blue"
              variant="outline"
              size="sm"
            >
              다시 시도
            </Button>
          </VStack>
        </Center>
      );
    }

    return (
      <Center flex={1} py={20}>
        <VStack alignItems="center" space={4}>
          <Text fontSize="lg" color="gray.600" textAlign="center">
            📝
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center">
            아직 게시글이 없습니다
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            첫 번째 게시글을 작성해보세요!
          </Text>
        </VStack>
      </Center>
    );
  };

  return (
    <Box flex={1}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ 
          padding: 16,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={loading && posts.length > 0}
            onRefresh={handleRefresh}
            colors={['#3182CE']} // blue.500
            tintColor="#3182CE"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />
    </Box>
  );
}