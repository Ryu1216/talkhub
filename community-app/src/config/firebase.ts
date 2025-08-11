import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from './env';

// Firebase configuration
const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY || 'demo-api-key',
  authDomain: ENV.FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: ENV.FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: ENV.FIREBASE_APP_ID || '1:123456789:web:abcdef123456'
};

// Log configuration for debugging
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '***' : 'missing',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? '***' : 'missing'
});

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  // Initialize Firebase Auth with AsyncStorage persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Firebase Auth initialized with AsyncStorage persistence');
  } catch (authError: any) {
    // If initializeAuth fails (e.g., already initialized), try getAuth
    if (authError.code === 'auth/already-initialized') {
      const { getAuth } = require('firebase/auth');
      auth = getAuth(app);
      console.log('Using existing Firebase Auth instance');
    } else {
      throw authError;
    }
  }
  
  // Initialize other Firebase services
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('Firebase services initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Demo mode configuration
if (__DEV__ && firebaseConfig.projectId === 'demo-project') {
  console.log('Running in demo mode - Firebase Auth will use fallback service');
}

export { auth, db, storage };

export default app;