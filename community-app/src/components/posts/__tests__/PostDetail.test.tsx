import React from 'react';
import { render } from '@testing-library/react-native';
import { NativeBaseProvider } from 'native-base';
import { Timestamp } from 'firebase/firestore';
import PostDetail from '../PostDetail';
import { Post } from '../../../types';

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2시간 전'),
}));

const mockPost: Post = {
  id: 'post1',
  title: 'Test Post Title',
  content: 'This is a detailed test post content that should be displayed in full.',
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

describe('PostDetail', () => {
  it('renders loading state', () => {
    const { getByText } = renderWithProvider(
      <PostDetail post={null} loading={true} />
    );

    expect(getByText('게시글을 불러오는 중...')).toBeTruthy();
  });

  it('renders not found state when post is null', () => {
    const { getByText } = renderWithProvider(
      <PostDetail post={null} loading={false} />
    );

    expect(getByText('게시글을 찾을 수 없습니다')).toBeTruthy();
    expect(getByText('게시글이 삭제되었거나 존재하지 않습니다')).toBeTruthy();
  });

  it('renders post content correctly', () => {
    const { getByText } = renderWithProvider(
      <PostDetail post={mockPost} loading={false} />
    );

    expect(getByText('Test Post Title')).toBeTruthy();
    expect(getByText('This is a detailed test post content that should be displayed in full.')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('2시간 전')).toBeTruthy();
    expect(getByText('댓글 5개')).toBeTruthy();
  });

  it('renders children when provided', () => {
    const { getByText } = renderWithProvider(
      <PostDetail post={mockPost} loading={false}>
        <div>Test Comments Section</div>
      </PostDetail>
    );

    expect(getByText('댓글 5개')).toBeTruthy(); // In the header
    expect(getByText('Test Comments Section')).toBeTruthy();
  });

  it('shows author initial in avatar', () => {
    const { getByText } = renderWithProvider(
      <PostDetail post={mockPost} loading={false} />
    );

    // Avatar should show first letter of author name
    expect(getByText('T')).toBeTruthy();
  });
});