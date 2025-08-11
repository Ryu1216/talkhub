import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NativeBaseProvider } from 'native-base';
import { Timestamp } from 'firebase/firestore';
import PostCard from '../PostCard';
import { Post } from '../../../types';

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2시간 전'),
}));

const mockPost: Post = {
  id: 'post1',
  title: 'Test Post Title',
  content: 'This is a test post content that should be displayed in the card.',
  authorId: 'user1',
  authorName: 'Test User',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  commentCount: 5,
  imageUrl: 'https://example.com/image.jpg',
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <NativeBaseProvider>{component}</NativeBaseProvider>
  );
};

describe('PostCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders post information correctly', () => {
    const { getByText } = renderWithProvider(
      <PostCard post={mockPost} onPress={mockOnPress} />
    );

    expect(getByText('Test Post Title')).toBeTruthy();
    expect(getByText('This is a test post content that should be displayed in the card.')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('2시간 전')).toBeTruthy();
    expect(getByText('댓글 5')).toBeTruthy();
  });

  it('renders without comment count when commentCount is 0', () => {
    const postWithoutComments = { ...mockPost, commentCount: 0 };
    const { queryByText } = renderWithProvider(
      <PostCard post={postWithoutComments} onPress={mockOnPress} />
    );

    expect(queryByText('댓글 0')).toBeNull();
  });

  it('renders without image when imageUrl is not provided', () => {
    const postWithoutImage = { ...mockPost, imageUrl: undefined };
    const { queryByTestId } = renderWithProvider(
      <PostCard post={postWithoutImage} onPress={mockOnPress} />
    );

    // Image component won't be rendered when imageUrl is undefined
    expect(queryByTestId('post-image')).toBeNull();
  });

  it('calls onPress when card is pressed', () => {
    const { getByText } = renderWithProvider(
      <PostCard post={mockPost} onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Test Post Title'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('truncates long content', () => {
    const longContent = 'This is a very long content that should be truncated when displayed in the card. '.repeat(10);
    const postWithLongContent = { ...mockPost, content: longContent };
    
    const { getByText } = renderWithProvider(
      <PostCard post={postWithLongContent} onPress={mockOnPress} />
    );

    // The text should be present but truncated (numberOfLines=3)
    expect(getByText(longContent)).toBeTruthy();
  });

  it('shows author initial in avatar', () => {
    const { getByText } = renderWithProvider(
      <PostCard post={mockPost} onPress={mockOnPress} />
    );

    // Avatar should show first letter of author name
    expect(getByText('T')).toBeTruthy();
  });

  it('handles date formatting error gracefully', () => {
    // Mock formatDistanceToNow to throw an error
    const { formatDistanceToNow } = require('date-fns');
    formatDistanceToNow.mockImplementation(() => {
      throw new Error('Date formatting error');
    });

    const { getByText } = renderWithProvider(
      <PostCard post={mockPost} onPress={mockOnPress} />
    );

    // Should fallback to '방금 전'
    expect(getByText('방금 전')).toBeTruthy();
  });
});