import React from 'react';
import { render } from '@testing-library/react-native';
import { NativeBaseProvider } from 'native-base';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostDetailScreen from '../PostDetailScreen';
import { usePostsStore } from '../../../stores/postsStore';
import { useCommentsStore } from '../../../stores/commentsStore';
import { Timestamp } from 'firebase/firestore';

// Mock the stores
jest.mock('../../../stores/postsStore');
jest.mock('../../../stores/commentsStore');

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2시간 전'),
}));

const mockUsePostsStore = usePostsStore as jest.MockedFunction<typeof usePostsStore>;
const mockUseCommentsStore = useCommentsStore as jest.MockedFunction<typeof useCommentsStore>;

const Stack = createNativeStackNavigator();

const mockPost = {
  id: 'post1',
  title: 'Test Post',
  content: 'Test content',
  authorId: 'user1',
  authorName: 'Test User',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  commentCount: 2,
};

const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NativeBaseProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="PostDetail" component={() => component} />
        </Stack.Navigator>
      </NavigationContainer>
    </NativeBaseProvider>
  );
};

describe('PostDetailScreen', () => {
  const mockFetchPost = jest.fn();
  const mockFetchComments = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUsePostsStore.mockReturnValue({
      currentPost: null,
      loading: false,
      error: null,
      fetchPost: mockFetchPost,
      posts: [],
      hasMore: true,
      lastVisible: null,
      setPosts: jest.fn(),
      addPost: jest.fn(),
      updatePost: jest.fn(),
      setCurrentPost: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setHasMore: jest.fn(),
      setLastVisible: jest.fn(),
      fetchPosts: jest.fn(),
      createPost: jest.fn(),
      clearError: jest.fn(),
      reset: jest.fn(),
      subscribeToRealtimeUpdates: jest.fn(),
    });

    mockUseCommentsStore.mockReturnValue({
      comments: {},
      loading: false,
      error: null,
      fetchComments: mockFetchComments,
      setComments: jest.fn(),
      addComment: jest.fn(),
      updateComment: jest.fn(),
      removeComment: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      createComment: jest.fn(),
      clearError: jest.fn(),
      clearCommentsForPost: jest.fn(),
      reset: jest.fn(),
    });
  });

  it('renders screen with header', () => {
    const mockRoute = {
      params: { postId: 'post1' },
      key: 'test',
      name: 'PostDetail' as const,
    };

    const mockNavigation = {
      goBack: jest.fn(),
    } as any;

    const { getByText } = renderWithNavigation(
      <PostDetailScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('게시글 상세')).toBeTruthy();
  });

  it('fetches post and comments on mount', () => {
    const mockRoute = {
      params: { postId: 'post1' },
      key: 'test',
      name: 'PostDetail' as const,
    };

    const mockNavigation = {
      goBack: jest.fn(),
    } as any;

    renderWithNavigation(
      <PostDetailScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(mockFetchPost).toHaveBeenCalledWith('post1');
    expect(mockFetchComments).toHaveBeenCalledWith('post1');
  });

  it('displays post when loaded', () => {
    mockUsePostsStore.mockReturnValue({
      currentPost: mockPost,
      loading: false,
      error: null,
      fetchPost: mockFetchPost,
      posts: [],
      hasMore: true,
      lastVisible: null,
      setPosts: jest.fn(),
      addPost: jest.fn(),
      updatePost: jest.fn(),
      setCurrentPost: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setHasMore: jest.fn(),
      setLastVisible: jest.fn(),
      fetchPosts: jest.fn(),
      createPost: jest.fn(),
      clearError: jest.fn(),
      reset: jest.fn(),
      subscribeToRealtimeUpdates: jest.fn(),
    });

    const mockRoute = {
      params: { postId: 'post1' },
      key: 'test',
      name: 'PostDetail' as const,
    };

    const mockNavigation = {
      goBack: jest.fn(),
    } as any;

    const { getByText } = renderWithNavigation(
      <PostDetailScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Test Post')).toBeTruthy();
    expect(getByText('Test content')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
  });
});