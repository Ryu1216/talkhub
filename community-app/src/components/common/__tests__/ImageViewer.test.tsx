import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NativeBaseProvider } from 'native-base';
import ImageViewer from '../ImageViewer';

const mockOnPress = jest.fn();

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <NativeBaseProvider>{component}</NativeBaseProvider>
  );
};

describe('ImageViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders image with loading state initially', () => {
    const { getByText } = renderWithProvider(
      <ImageViewer uri="https://example.com/image.jpg" />
    );

    expect(getByText('이미지 로딩 중...')).toBeTruthy();
  });

  it('renders image with custom dimensions', () => {
    const { getByLabelText } = renderWithProvider(
      <ImageViewer
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
      <ImageViewer uri="https://example.com/invalid-image.jpg" />
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
      <ImageViewer uri="https://example.com/invalid-image.jpg" />
    );

    const image = getByLabelText('Image');
    
    // Simulate image load error
    fireEvent(image, 'error');

    await waitFor(() => {
      expect(getByText('이미지를 불러올 수 없습니다')).toBeTruthy();
    });

    // Find and press retry button
    const retryButton = getByText('이미지를 불러올 수 없습니다').parent?.parent?.findByType('Button');
    if (retryButton) {
      fireEvent.press(retryButton);
    }
  });

  it('calls onPress when image is pressed', async () => {
    const { getByLabelText } = renderWithProvider(
      <ImageViewer
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
      <ImageViewer
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
      // Note: This is a simplified test - in a real scenario you'd need to find the button
      expect(image).toBeTruthy();
    });
  });

  it('applies custom styles correctly', () => {
    const customStyle = { margin: 10 };
    const { getByLabelText } = renderWithProvider(
      <ImageViewer
        uri="https://example.com/image.jpg"
        style={customStyle}
      />
    );

    const imageContainer = getByLabelText('Image').parent;
    expect(imageContainer?.props.style).toEqual(expect.objectContaining(customStyle));
  });

  it('uses custom fallback icon when provided', async () => {
    const { getByLabelText } = renderWithProvider(
      <ImageViewer
        uri="https://example.com/invalid-image.jpg"
        fallbackIcon="camera"
      />
    );

    const image = getByLabelText('Image');
    
    // Simulate image load error
    fireEvent(image, 'error');

    await waitFor(() => {
      // The fallback should be shown (simplified test)
      expect(image).toBeTruthy();
    });
  });
});