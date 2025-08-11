import { auth, db } from '../config/firebase';
import { ENV } from '../config/env';

/**
 * Validate Firebase configuration and connectivity
 */
export const validateFirebaseConfig = async (): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check environment variables
  if (!ENV.FIREBASE_API_KEY) {
    errors.push('FIREBASE_API_KEY is missing');
  }
  if (!ENV.FIREBASE_AUTH_DOMAIN) {
    errors.push('FIREBASE_AUTH_DOMAIN is missing');
  }
  if (!ENV.FIREBASE_PROJECT_ID) {
    errors.push('FIREBASE_PROJECT_ID is missing');
  }
  if (!ENV.FIREBASE_APP_ID) {
    errors.push('FIREBASE_APP_ID is missing');
  }

  // Check Firebase services initialization
  try {
    if (!auth) {
      errors.push('Firebase Auth is not initialized');
    } else {
      console.log('Firebase Auth initialized:', !!auth.currentUser);
    }

    if (!db) {
      errors.push('Firebase Firestore is not initialized');
    } else {
      console.log('Firebase Firestore initialized');
    }
  } catch (error) {
    errors.push(`Firebase services error: ${error}`);
  }

  // Test network connectivity (basic check)
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    console.log('Network connectivity: OK');
  } catch (error) {
    warnings.push('Network connectivity issue detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Test Firebase Auth connectivity
 */
export const testFirebaseAuth = async (): Promise<boolean> => {
  try {
    // Try to get current auth state
    const currentUser = auth.currentUser;
    console.log('Current auth state:', currentUser ? 'Authenticated' : 'Not authenticated');
    
    // Test if we can access Firebase Auth service by checking the config
    if (!auth.app.options.apiKey || !auth.app.options.authDomain) {
      console.error('Firebase Auth configuration is incomplete');
      return false;
    }
    
    console.log('Firebase Auth configuration is valid');
    return true;
  } catch (error) {
    console.error('Firebase Auth test failed:', error);
    return false;
  }
};

/**
 * Test if Firebase project is properly configured
 */
export const testFirebaseProject = async (): Promise<{
  isValid: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];
  
  try {
    // Check if the project ID is valid (not demo)
    const projectId = auth.app.options.projectId;
    if (!projectId || projectId === 'demo-project') {
      errors.push('Firebase project ID is not configured properly');
    }
    
    // Check if API key is valid
    const apiKey = auth.app.options.apiKey;
    if (!apiKey || apiKey === 'demo-api-key') {
      errors.push('Firebase API key is not configured properly');
    }
    
    // Check if auth domain is valid
    const authDomain = auth.app.options.authDomain;
    if (!authDomain || authDomain === 'demo-project.firebaseapp.com') {
      errors.push('Firebase auth domain is not configured properly');
    }
    
    // Try to make a simple request to Firebase Auth REST API
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/projects/${projectId}:lookup?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      
      if (!response.ok && response.status !== 400) {
        // 400 is expected for empty request, but other errors indicate config issues
        errors.push(`Firebase API returned status: ${response.status}`);
      }
    } catch (networkError) {
      errors.push('Network error when testing Firebase API');
    }
    
  } catch (error) {
    errors.push(`Firebase project test failed: ${error}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};