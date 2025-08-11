import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  UploadTask,
} from 'firebase/storage';
import { storage } from '../config/firebase';
import { AppError, ErrorType } from '../types/error';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

class StorageService {
  /**
   * Upload image to Firebase Storage
   */
  async uploadImage(
    file: Blob,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      
      if (onProgress) {
        // Use resumable upload for progress tracking
        const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              };
              onProgress(progress);
            },
            (error) => {
              reject(this.handleStorageError(error));
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              } catch (error: any) {
                reject(this.handleStorageError(error));
              }
            }
          );
        });
      } else {
        // Simple upload without progress tracking
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      }
    } catch (error: any) {
      throw this.handleStorageError(error);
    }
  }

  /**
   * Upload post image
   */
  async uploadPostImage(
    file: Blob,
    userId: string,
    fileName: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const path = `posts/${userId}/${Date.now()}_${fileName}`;
    return this.uploadImage(file, path, onProgress);
  }

  /**
   * Upload user profile image
   */
  async uploadProfileImage(
    file: Blob,
    userId: string,
    fileName: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const path = `profiles/${userId}/${fileName}`;
    return this.uploadImage(file, path, onProgress);
  }

  /**
   * Delete image from Firebase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error: any) {
      throw this.handleStorageError(error);
    }
  }

  /**
   * Get file path from URL
   */
  getFilePathFromUrl(url: string): string {
    try {
      const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/`;
      if (url.startsWith(baseUrl)) {
        const path = url.substring(baseUrl.length);
        const decodedPath = decodeURIComponent(path.split('?')[0]);
        return decodedPath;
      }
      return url;
    } catch (error) {
      return url;
    }
  }

  /**
   * Handle Firebase Storage errors
   */
  private handleStorageError(error: any): AppError {
    let message = 'An error occurred while uploading the file';
    let type = ErrorType.UNKNOWN_ERROR;

    switch (error.code) {
      case 'storage/unauthorized':
        message = 'You do not have permission to upload files';
        type = ErrorType.PERMISSION_ERROR;
        break;
      case 'storage/canceled':
        message = 'Upload was cancelled';
        break;
      case 'storage/unknown':
        message = 'An unknown error occurred during upload';
        break;
      case 'storage/object-not-found':
        message = 'File not found';
        break;
      case 'storage/bucket-not-found':
        message = 'Storage bucket not found';
        break;
      case 'storage/project-not-found':
        message = 'Project not found';
        break;
      case 'storage/quota-exceeded':
        message = 'Storage quota exceeded';
        break;
      case 'storage/unauthenticated':
        message = 'User is not authenticated';
        type = ErrorType.AUTH_ERROR;
        break;
      case 'storage/retry-limit-exceeded':
        message = 'Upload retry limit exceeded';
        type = ErrorType.NETWORK_ERROR;
        break;
      case 'storage/invalid-format':
        message = 'Invalid file format';
        type = ErrorType.VALIDATION_ERROR;
        break;
      case 'storage/no-default-bucket':
        message = 'No default storage bucket configured';
        break;
      default:
        if (error.message) {
          message = error.message;
        }
    }

    return new AppError(type, message, error.code);
  }
}

export const storageService = new StorageService();