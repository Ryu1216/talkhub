import { auth, db, storage } from '../config/firebase';
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { ENV } from '../config/env';

/**
 * Initialize Firebase services and connect to emulators in development
 */
export class FirebaseInitializer {
  private static initialized = false;

  /**
   * Initialize Firebase services
   */
  static initialize(): void {
    if (this.initialized) {
      return;
    }

    // Connect to emulators in development
    if (ENV.IS_DEV && typeof window !== 'undefined') {
      this.connectToEmulators();
    }

    this.initialized = true;
  }

  /**
   * Connect to Firebase emulators for local development
   */
  private static connectToEmulators(): void {
    try {
      // Connect to Auth emulator
      if (!auth.config.emulator) {
        connectAuthEmulator(auth, 'http://localhost:9099', {
          disableWarnings: true,
        });
      }

      // Connect to Firestore emulator
      if (!db._delegate._databaseId.projectId.includes('demo-')) {
        connectFirestoreEmulator(db, 'localhost', 8080);
      }

      // Connect to Storage emulator
      if (!storage._location.bucket.includes('demo-')) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }

      console.log('Connected to Firebase emulators');
    } catch (error) {
      // Emulators might already be connected
      console.log('Firebase emulators connection info:', error);
    }
  }

  /**
   * Validate Firebase configuration
   */
  static validateConfiguration(): boolean {
    const requiredEnvVars = [
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !ENV[varName as keyof typeof ENV]
    );

    if (missingVars.length > 0) {
      console.error('Missing Firebase configuration variables:', missingVars);
      return false;
    }

    return true;
  }

  /**
   * Get Firebase services status
   */
  static getServicesStatus(): {
    auth: boolean;
    firestore: boolean;
    storage: boolean;
  } {
    return {
      auth: !!auth.app,
      firestore: !!db.app,
      storage: !!storage.app,
    };
  }
}

// Auto-initialize Firebase when this module is imported
FirebaseInitializer.initialize();