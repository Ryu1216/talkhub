import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NativeBaseProvider } from 'native-base';
import ImagePicker from '../ImagePicker';
import * as ExpoImagePicker from 'expo-image-picker';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

const mockOnImageSelected = jest.fn();
const mockOnImageRemoved = jest.fn();

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <NativeBaseProvider>{component}</NativeBaseProvider>
  );
};

describe('ImagePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders image selection button when no image is selected', () => {
    const { getByText } = renderWithProvider(
      <ImagePicker onImageSelected={mockOnImageSelected} />
    );

    expect(getByText('이미지 선택')).toBeTruthy();
    expect(getByText('최대 5MB, JPG/PNG 형식')).toBeTruthy();
  });

  it('renders selected image with change and remove buttons', () => {
    const testUri = 'file://test-image.jpg';
    const { getByText, getByTestId } = renderWithProvider(
      <ImagePicker
        onImageSelected={mockOnImageSelected}
        onImageRemoved={mockOnImageRemoved}
        selectedImageUri={testUri}
      />
    );

    expect(getByText('이미지 변경')).toBeTruthy();
  });

  it('opens selection dialog when image selection button is pressed', async () => {
    const { getByText } = renderWithProvider(
      <ImagePicker onImageSelected={mockOnImageSelected} />
    );

    fireEvent.press(getByText('이미지 선택'));

    await waitFor(() => {
      expect(getByText('이미지 선택')).toBeTruthy(); // Dialog title
      expect(getByText('갤러리에서 선택')).toBeTruthy();
      expect(getByText('카메라로 촬영')).toBeTruthy();
    });
  });

  it('handles gallery selection with permissions', async () => {
    (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted'
    });
    (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted'
    });
    (ExpoImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'file://test-image.jpg',
        fileSize: 1024 * 1024 // 1MB
      }]
    });

    const { getByText } = renderWithProvider(
      <ImagePicker onImageSelected={mockOnImageSelected} />
    );

    fireEvent.press(getByText('이미지 선택'));
    
    await waitFor(() => {
      expect(getByText('갤러리에서 선택')).toBeTruthy();
    });

    fireEvent.press(getByText('갤러리에서 선택'));

    await waitFor(() => {
      expect(mockOnImageSelected).toHaveBeenCalledWith('file://test-image.jpg');
    });
  });

  it('handles camera selection with permissions', async () => {
    (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted'
    });
    (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted'
    });
    (ExpoImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'file://camera-image.jpg',
        fileSize: 2 * 1024 * 1024 // 2MB
      }]
    });

    const { getByText } = renderWithProvider(
      <ImagePicker onImageSelected={mockOnImageSelected} />
    );

    fireEvent.press(getByText('이미지 선택'));
    
    await waitFor(() => {
      expect(getByText('카메라로 촬영')).toBeTruthy();
    });

    fireEvent.press(getByText('카메라로 촬영'));

    await waitFor(() => {
      expect(mockOnImageSelected).toHaveBeenCalledWith('file://camera-image.jpg');
    });
  });

  it('rejects images that are too large', async () => {
    (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted'
    });
    (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted'
    });
    (ExpoImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'file://large-image.jpg',
        fileSize: 6 * 1024 * 1024 // 6MB - exceeds 5MB limit
      }]
    });

    const { getByText } = renderWithProvider(
      <ImagePicker onImageSelected={mockOnImageSelected} />
    );

    fireEvent.press(getByText('이미지 선택'));
    fireEvent.press(getByText('갤러리에서 선택'));

    await waitFor(() => {
      expect(mockOnImageSelected).not.toHaveBeenCalled();
    });
  });

  it('handles permission denial gracefully', async () => {
    (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied'
    });
    (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied'
    });

    const { getByText } = renderWithProvider(
      <ImagePicker onImageSelected={mockOnImageSelected} />
    );

    fireEvent.press(getByText('이미지 선택'));
    fireEvent.press(getByText('갤러리에서 선택'));

    await waitFor(() => {
      expect(ExpoImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
      expect(mockOnImageSelected).not.toHaveBeenCalled();
    });
  });

  it('disables interaction when disabled prop is true', () => {
    const { getByText } = renderWithProvider(
      <ImagePicker onImageSelected={mockOnImageSelected} disabled={true} />
    );

    const button = getByText('이미지 선택');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });
});