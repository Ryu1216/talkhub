import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { validateFirebaseConfig, testFirebaseAuth } from '../services/validateFirebase';
import { debugFirebaseConfig } from '../services/firebaseDebug';

/**
 * Hook to initialize Firebase Auth state listener
 * This should be called once in the App component
 */
export const useAuthInit = () => {
  const initializeAuth = useAuthStore(state => state.initializeAuth);
  const initialized = useAuthStore(state => state.initialized);
  const loading = useAuthStore(state => state.loading);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Run Firebase debug information
        await debugFirebaseConfig();
        
        // Validate Firebase configuration
        const validation = await validateFirebaseConfig();
        
        if (!validation.isValid) {
          console.error('Firebase configuration errors:', validation.errors);
        }
        
        if (validation.warnings.length > 0) {
          console.warn('Firebase configuration warnings:', validation.warnings);
        }

        // Test Firebase Auth connectivity
        const authConnected = await testFirebaseAuth();
        if (!authConnected) {
          console.error('Firebase Auth connectivity test failed');
        }

        // Initialize auth state listener
        const unsubscribe = initializeAuth();

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error('Firebase initialization failed:', error);
        // Still try to initialize auth even if validation fails
        return initializeAuth();
      }
    };

    let unsubscribe: (() => void) | undefined;

    initializeFirebase().then((cleanup) => {
      unsubscribe = cleanup;
    });

    // Cleanup function
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initializeAuth]);

  return {
    initialized,
    loading,
  };
};