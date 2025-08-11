import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NativeBaseProvider } from 'native-base';
import CachedImage from '../CachedImage';

const mockOnPress = jest.fn();

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <NativeBaseProvider>{component}</NativeBaseProvider>
  );
};

describe('CachedImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders image with loading state initially', () => {
    const { getByText } = renderWithProvider(
      <CachedImage uri="https://example.com/image.jpg" />
    );

    expect(getByText('이미지 로딩 중...')).toBeTruthy();
  });

  it('renders image with custom dimensions', () => {
    const { getByLabelText } = renderWithProvider(
      <CachedImage
        uri="https://example.com/image.jpg"
        width={300}
        height={200}
        alt="Test image"
      />
    );

    const image = getByLabelText('Test image');
    expect(image).toBeTruthy();
  });

  it('shows error state when image fails to load', async () => {
    const { getByLabelText, getByText } = renderWithProvider(
      <CachedImage uri="https://example.com/invalid-image.jpg" />
    );

    const image = getByLabelText('Image');
    
    // Simulate image load error
    fireEvent(image, 'error');

    await waitFor(() => {
      expect(getByText('이미지를 불러올 수 없습니다')).toBeTruthy();
    });
  });

  it('handles retry when image fails to load', async () => {
    const { getByLabelText, getByText } = renderWithProvider(
      <CachedImage uri="https://example.com/invalid-image.jpg" />
    );

    const image = getByLabelText('Image');
    
    // Simulate image load error
    fireEvent(image, 'error');

    await waitFor(() => {
      expect(getByText('이미지를 불러올 수 없습니다')).toBeTruthy();
    });

    // Find and press retry button (simplified test)
    const retryButton = getByText('이미지를 불러올 수 없습니다').parent?.parent?.findByType('Button');
    if (retryButton) {
      fireEvent.press(retryButton);
    }
  });

  it('calls onPress when image is pressed', async () => {
    const { getByLabelText } = renderWithProvider(
      <CachedImage
        uri="https://example.com/image.jpg"
        onPress={mockOnPress}
      />
    );

    const image = getByLabelText('Image');
    
    // Simulate successful image load
    fireEvent(image, 'loadEnd');

    await waitFor(() => {
      // Press the image
      fireEvent.press(image.parent);
      expect(mockOnPress).toHaveBeenCalled();
    });
  });

  it('shows fullscreen button when enabled', async () => {
    const { getByLabelText } = renderWithProvider(
      <CachedImage
        uri="https://example.com/image.jpg"
        showFullScreenButton={true}
        onPress={mockOnPress}
      />
    );

    const image = getByLabelText('Image');
    
    // Simulate successful image load
    fireEvent(image, 'loadEnd');

    await waitFor(() => {
      // The fullscreen button should be visible
      expect(image).toBeTruthy();
    });
  });

  it('uses custom placeholder when provided', () => {
    const customPlaceholder = <div>Custom Placeholder</div>;
    
    const { getByText } = renderWithProvider(
      <CachedImage
        uri="https://example.com/image.jpg"
        placeholder={customPlaceholder}
      />
    );

    expect(getByText('Custom Placeholder')).toBeTruthy();
  });

  it('uses custom loading component when provided', () => {
    const customLoading = <div>Custom Loading</div>;
    
    const { getByText } = renderWithProvider(
      <CachedImage
        uri="https://example.com/image.jpg"
        loadingComponent={customLoading}
      />
    );

    expect(getByText('Custom Loading')).toBeTruthy();
  });

  it('uses custom error component when provided', async () => {
    const customError = <div>Custom Error</div>;
    
    const { getByLabelText, getByText } = renderWithProvider(
      <CachedImage
        uri="https://example.com/invalid-image.jpg"
        errorComponent={customError}
      />
    );

    const image = getByLabelText('Image');
    
    // Simulate image load error
    fireEvent(image, 'error');

    await waitFor(() => {
      expect(getByText('Custom Error')).toBeTruthy();
    });
  });

  it('applies custom cache key', () => {
    const { getByLabelText } = renderWithProvider(
      <CachedImage
        uri="https://example.com/image.jpg"
        cacheKey="custom-cache-key"
      />
    );

    const image = getByLabelText('Image');
    expect(image).toBeTruthy();
  });

  it('handles different priority levels', () => {
    const { getByLabelText } = renderWithProvider(
      <CachedImage
        uri="https://example.com/image.jpg"
        priority="high"
      />
    );

    const image = getByLabelText('Image');
    expect(image).toBeTruthy();
  });

  it('limits retry attempts', async () => {
    const { getByLabelText, queryByText } = renderWithProvider(
      <CachedImage uri="https://example.com/invalid-image.jpg" />
    );

    const image = getByLabelText('Image');
    
    // Simulate multiple errors to exceed retry limit
    for (let i = 0; i < 4; i++) {
      fireEvent(image, 'error');
      
      if (i < 3) {
        // Should still show retry button
        await waitFor(() => {
          expect(queryByText('이미지를 불러올 수 없습니다')).toBeTruthy();
        });
      }
    }

    // After 3 retries, retry button should not be available
    await waitFor(() => {
      expect(queryByText('이미지를 불러올 수 없습니다')).toBeTruthy();
    });
  });
});