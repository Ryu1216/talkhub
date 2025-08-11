// Test setup file

// Mock Firebase
jest.mock('./config/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
  storage: {},
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => ({ currentUser: null })),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  getStorage: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
  ImagePickerResult: {},
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
  FlipType: {
    Vertical: 'vertical',
    Horizontal: 'horizontal',
  },
  RotateType: {
    Rotate90: 90,
    Rotate180: 180,
    Rotate270: 270,
  },
}));

jest.mock('expo-camera', () => ({
  Camera: {
    Constants: {
      Type: {
        back: 'back',
        front: 'front',
      },
    },
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock NativeBase
jest.mock('native-base', () => {
  const React = require('react');
  const { View, Text, TextInput, TouchableOpacity } = require('react-native');
  
  return {
    NativeBaseProvider: ({ children }: any) => children,
    Box: View,
    VStack: View,
    HStack: View,
    Text: Text,
    Input: TextInput,
    Button: TouchableOpacity,
    FormControl: {
      Label: Text,
      ErrorMessage: Text,
      HelperText: Text,
    },
    Alert: {
      Icon: View,
    },
    Icon: View,
    Pressable: TouchableOpacity,
    Heading: Text,
    Center: View,
    Spinner: View,
    useToast: () => ({
      show: jest.fn(),
    }),
  };
});

// Global test utilities
global.console = {
  ...console,
  // Suppress console.error and console.warn in tests unless needed
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock __DEV__ global
(global as any).__DEV__ = true;