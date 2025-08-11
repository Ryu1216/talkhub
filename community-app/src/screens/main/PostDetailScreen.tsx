import React, { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList, CreateCommentData } from '../../types';
import { ScreenLayout, AppHeader } from '../../components/common';
import { PostDetail } from '../../components/posts';
import { CommentsSection } from '../../components/comments';
import { usePostsStore } from '../../stores/postsStore';
import { useCommentsStore } from '../../stores/commentsStore';

type Props = NativeStackScreenProps<MainStackParamList, 'PostDetail'>;

export default function PostDetailScreen({ navigation, route }: Props) {
  const { postId } = route.params;
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(true);
  
  const { 
    currentPost, 
    loading: postLoading, 
    error: postError,
    fetchPost 
  } = usePostsStore();
  
  const { 
    comments, 
    loading: commentsLoading, 
    error: commentsError,
    subscriptions,
    fetchComments,
    createComment,
    subscribeToComments,
    unsubscribeFromComments,
    clearError
  } = useCommentsStore();

  // Fetch post and set up real-time comments subscription
  useEffect(() => {
    fetchPost(postId);
    
    // Set up real-time comments subscription
    subscribeToComments(postId);
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribeFromComments(postId);
    };
  }, [postId, fetchPost, subscribeToComments, unsubscribeFromComments]);

  // Monitor real-time connection status
  useEffect(() => {
    const hasActiveSubscription = !!subscriptions[postId];
    setIsRealTimeConnected(hasActiveSubscription && !commentsError);
  }, [subscriptions, postId, commentsError]);

  // Handle comment creation with permission check
  const handleAddComment = async (data: CreateCommentData) => {
    try {
      // Clear any previous errors
      clearError();
      await createComment(data);
    } catch (error) {
      console.error('Failed to add comment:', error);
      // Error is handled by the store
    }
  };

  // Get comments for this specific post
  const postComments = comments[postId] || [];

  return (
    <ScreenLayout>
      <AppHeader 
        title="게시글 상세" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <PostDetail 
        post={currentPost} 
        loading={postLoading}
      >
        <CommentsSection
          postId={postId}
          comments={postComments}
          loading={commentsLoading}
          error={commentsError?.message}
          onAddComment={handleAddComment}
          addCommentLoading={commentsLoading}
          addCommentError={commentsError?.message}
          isRealTimeConnected={isRealTimeConnected}
        />
      </PostDetail>
    </ScreenLayout>
  );
}