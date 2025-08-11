import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NativeBaseProvider } from 'native-base';
import { Timestamp } from 'firebase/firestore';
import PostsList from '../PostsList';
import { usePostsStore } from '../../../stores/postsStore';
import { Post, AppError, ErrorType } from '../../../types';

// Mock the posts store
jest.mock('../../../stores/postsStore');
const mockUsePostsStore = usePostsStore as jest.MockedFunction<typeof usePostsStore>;

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2시간 전'),
}));

const mockPosts: Post[] = [
  {
    id: 'post1',
    title: 'First Post',
    content: 'First post content',
    authorId: 'user1',
    authorName: 'User One',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    commentCount: 2,
  },
  {
    id: 'post2',
    title: 'Second Post',
    content: 'Second post content',
    authorId: 'user2',
    authorName: 'User Two',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    commentCount: 0,
  },
];

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <NativeBaseProvider>{component}</NativeBaseProvider>
  );
};

describe('PostsList', () => {
  const mockOnPostPress = jest.fn();
  const mockFetchPosts = jest.fn();
  const mockClearError = jest.fn();

  const defaultStoreState = {
    posts: [],
    loading: false,
    error: null,
    hasMore: true,
    fetchPosts: mockFetchPosts,
    clearError: mockClearError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePostsStore.mockReturnValue(defaultStoreState);
  });

  it('renders posts list correctly', () => {
    mockUsePostsStore.mockReturnValue({
      ...defaultStoreState,
      posts: mockPosts,
    });

    const { getByText } = renderWithProvider(
      <PostsList onPostPress={mockOnPostPress} />
    );

    expect(getByText('First Post')).toBeTruthy();
    expect(getByText('Second Post')).toBeTruthy();
    expect(getByText('User One')).toBeTruthy();
    expect(getByText('User Two')).toBeTruthy();
  });

  it('shows loading state when loading and no posts', () => {
    mockUsePostsStore.mockReturnValue({
      ...defaultStoreState,
      loading: true,
      posts: [],
    });

    const { getByText } = renderWithProvider(
      <PostsList onPostPress={mockOnPostPress} />
    );

    expect(getByText('게시글을 불러오는 중...')).toBeTruthy();
  });

  it('shows empty state when no posts and not loading', () => {
    mockUsePostsStore.mockReturnValue({
      ...defaultStoreState,
      posts: [],
      loading: false,
    });

    const { getByText } = renderWithProvider(
      <PostsList onPostPress={mockOnPostPress} />
    );

    expect(getByText('아직 게시글이 없습니다')).toBeTruthy();
    expect(getByText('첫 번째 게시글을 작성해보세요!')).toBeTruthy();
  });

  it('shows error state with retry button', () => {
    const mockError = new AppError(ErrorType.NETWORK_ERROR, 'Network error');
    mockUsePostsStore.mockReturnValue({
      ...defaultStoreState,
      error: mockError,
      loading: false,
    });

    const { getByText } = renderWithProvider(
      <PostsList onPostPress={mockOnPostPress} />
    );

    expect(getByText('게시글을 불러올 수 없습니다')).toBeTruthy();
    expect(getByText('Network error')).toBeTruthy();
    expect(getByText('다시 시도')).toBeTruthy();
  });

  it('calls retry when retry button is pressed', () => {
    const mockError = new AppError(ErrorType.NETWORK_ERROR, 'Network error');
    mockUsePostsStore.mockReturnValue({
      ...defaultStoreState,
      error: mockError,
      loading: false,
    });

    const { getByText } = renderWithProvider(
      <PostsList onPostPress={mockOnPostPress} />
    );

    fireEvent.press(getByText('다시 시도'));
    
    expect(mockClearError).toHaveBeenCalledTimes(1);
    expect(mockFetchPosts).toHaveBeenCalledWith(true);
  });

  it('calls onPostPress when post is pressed', () => {
    mockUsePostsStore.mockReturnValue({
      ...defaultStoreState,
      posts: mockPosts,
    });

    const { getByText } = renderWithProvider(
      <PostsList onPostPress={mockOnPostPress} />
    );

    fireEvent.press(getByText('First Post'));
    
    expect(mockOnPostPress).toHaveBeenCalledWith(mockPosts[0]);
  });

  it('fetches posts on initial load when no posts exist', async () => {
    mockUsePostsStore.mockReturnValue({
      ...defaultStoreState,
      posts: [],
      loading: false,
    });

    renderWithProvider(<PostsList onPostPress={mockOnPostPress} />);

    await waitFor(() => {
      expect(mockFetchPosts).toHaveBeenCalledWith(true);
    });
  });

  it('does not fetch posts on initial load when posts already exist', () => {
    mockUsePostsStore.mockReturnValue({
      ...defaultStoreState,
      posts: mockPosts,
      loading: false,
    });

    renderWithProvider(<PostsList onPostPress={mockOnPostPress} />);

    expect(mockFetchPosts).not.toHaveBeenCalled();
  });

  it('shows loading footer when loading more posts', () => {
    mockUsePostsStore.mockReturnValue({
      ...defaultStoreState,
      posts: mockPosts,
      loading: true,
    });

    const { getByText } = renderWithProvider(
      <PostsList onPostPress={mockOnPostPress} />
    );

    expect(getByText('게시글을 불러오는 중...')).toBeTruthy();
  });
});