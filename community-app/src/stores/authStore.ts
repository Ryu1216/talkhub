import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { User, AppError } from '../types';
import { authService, UserProfile } from '../services/authService';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: AppError | null;
  isAuthenticated: boolean;
  initialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  setInitialized: (initialized: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
  initializeAuth: () => (() => void);
}

const initialState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  initialized: false,
};

// Helper function to convert UserProfile to User type
const convertUserProfileToUser = (profile: UserProfile): User => ({
  uid: profile.uid,
  email: profile.email,
  displayName: profile.displayName,
  photoURL: profile.photoURL,
  createdAt: Timestamp.fromDate(profile.createdAt),
  updatedAt: Timestamp.fromDate(profile.updatedAt),
});

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  // Actions
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    error: null 
  }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  setInitialized: (initialized) => set({ initialized }),

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const userProfile = await authService.login(email, password);
      const user = convertUserProfileToUser(userProfile);
      set({ 
        user, 
        isAuthenticated: true, 
        loading: false, 
        error: null 
      });
    } catch (error) {
      console.error('Login error:', error);
      set({ 
        error: error as AppError, 
        loading: false,
        user: null,
        isAuthenticated: false
      });
    }
  },

  register: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const userProfile = await authService.register(email, password);
      const user = convertUserProfileToUser(userProfile);
      set({ 
        user, 
        isAuthenticated: true, 
        loading: false, 
        error: null 
      });
    } catch (error) {
      console.error('Register error:', error);
      set({ 
        error: error as AppError, 
        loading: false,
        user: null,
        isAuthenticated: false
      });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await authService.logout();
      set({ 
        ...initialState,
        initialized: true // Keep initialized state
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({ 
        error: error as AppError, 
        loading: false 
      });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),

  // Initialize Firebase Auth state listener
  initializeAuth: () => {
    const { setUser, setLoading, setInitialized } = get();
    
    setLoading(true);
    
    // Set up Firebase Auth state listener
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // User is signed in, get their profile from Firestore
          const userProfile = await authService.getUserProfile(firebaseUser.uid);
          if (userProfile) {
            const user = convertUserProfileToUser(userProfile);
            setUser(user);
          } else {
            // Profile doesn't exist, create one
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            const user = convertUserProfileToUser(newProfile);
            setUser(user);
          }
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    });

    // Return unsubscribe function for cleanup
    return unsubscribe;
  },
}));