import React, { useEffect } from 'react';
import { VStack, Text, Box } from 'native-base';
import { useCommentsStore } from '../stores/commentsStore';
import { CommentsSection } from '../components/comments';

/**
 * Example component demonstrating real-time comments functionality
 * 
 * This example shows how to:
 * 1. Set up real-time comment subscriptions
 * 2. Handle comment creation with permission checks
 * 3. Display real-time connection status
 * 4. Clean up subscriptions properly
 */
interface CommentsRealtimeExampleProps {
  postId: string;
}

export default function CommentsRealtimeExample({ postId }: CommentsRealtimeExampleProps) {
  const { 
    comments, 
    loading, 
    error,
    subscriptions,
    createComment,
    subscribeToComments,
    unsubscribeFromComments,
    clearError
  } = useCommentsStore();

  // Set up real-time subscription when component mounts
  useEffect(() => {
    console.log(`Setting up real-time comments for post: ${postId}`);
    
    // Subscribe to real-time updates
    subscribeToComments(postId);
    
    // Cleanup subscription when component unmounts or postId changes
    return () => {
      console.log(`Cleaning up real-time comments for post: ${postId}`);
      unsubscribeFromComments(postId);
    };
  }, [postId, subscribeToComments, unsubscribeFromComments]);

  // Handle comment creation with error handling
  const handleAddComment = async (data: { postId: string; content: string }) => {
    try {
      clearError(); // Clear any previous errors
      await createComment(data);
      console.log('Comment created successfully');
    } catch (error) {
      console.error('Failed to create comment:', error);
      // Error is automatically handled by the store
    }
  };

  // Check if real-time connection is active
  const isRealTimeConnected = !!subscriptions[postId] && !error;
  const postComments = comments[postId] || [];

  return (
    <VStack space={4} p={4}>
      {/* Real-time Status Indicator */}
      <Box 
        p={2} 
        bg={isRealTimeConnected ? "green.100" : "red.100"} 
        borderRadius="md"
      >
        <Text fontSize="sm" color={isRealTimeConnected ? "green.700" : "red.700"}>
          {isRealTimeConnected 
            ? `✅ Real-time connected (${postComments.length} comments)` 
            : "❌ Real-time disconnected"
          }
        </Text>
        {error && (
          <Text fontSize="xs" color="red.600" mt={1}>
            Error: {error.message}
          </Text>
        )}
      </Box>

      {/* Comments Section with Real-time Updates */}
      <CommentsSection
        postId={postId}
        comments={postComments}
        loading={loading}
        error={error?.message}
        onAddComment={handleAddComment}
        addCommentLoading={loading}
        addCommentError={error?.message}
        isRealTimeConnected={isRealTimeConnected}
      />

      {/* Debug Information */}
      <Box p={2} bg="gray.100" borderRadius="md">
        <Text fontSize="xs" color="gray.600">
          Debug Info:
        </Text>
        <Text fontSize="xs" color="gray.600">
          • Post ID: {postId}
        </Text>
        <Text fontSize="xs" color="gray.600">
          • Comments Count: {postComments.length}
        </Text>
        <Text fontSize="xs" color="gray.600">
          • Subscription Active: {subscriptions[postId] ? 'Yes' : 'No'}
        </Text>
        <Text fontSize="xs" color="gray.600">
          • Loading: {loading ? 'Yes' : 'No'}
        </Text>
      </Box>
    </VStack>
  );
}

/*
 * Usage Example:
 * 
 * import CommentsRealtimeExample from './examples/CommentsRealtimeExample';
 * 
 * function PostDetailScreen({ route }) {
 *   const { postId } = route.params;
 *   
 *   return (
 *     <ScrollView>
 *       <CommentsRealtimeExample postId={postId} />
 *     </ScrollView>
 *   );
 * }
 * 
 * Key Features Demonstrated:
 * 
 * 1. Automatic Subscription Management
 *    - Subscribes when component mounts
 *    - Unsubscribes when component unmounts
 *    - Handles postId changes
 * 
 * 2. Real-time Updates
 *    - Comments appear instantly when other users post
 *    - No need to refresh or poll for updates
 *    - Maintains scroll position during updates
 * 
 * 3. Permission Handling
 *    - Validates user authentication before allowing comments
 *    - Shows appropriate error messages for permission issues
 *    - Graceful degradation when not authenticated
 * 
 * 4. Connection Status
 *    - Visual indicator of real-time connection status
 *    - Error display when connection fails
 *    - Debug information for development
 * 
 * 5. Error Recovery
 *    - Automatic retry on connection failures
 *    - Clear error messages for users
 *    - Maintains functionality even when real-time fails
 */