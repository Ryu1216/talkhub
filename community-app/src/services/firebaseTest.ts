import { auth } from '../config/firebase';

/**
 * Test Firebase Authentication setup
 */
export const testFirebaseAuthSetup = async (): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> => {
  try {
    const app = auth.app;
    const projectId = app.options.projectId;
    const apiKey = app.options.apiKey;
    
    console.log('Testing Firebase Auth setup...');
    console.log('Project ID:', projectId);
    console.log('API Key exists:', !!apiKey);
    
    // Test 1: Check if the project exists and Auth is enabled
    const configUrl = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/config?key=${apiKey}`;
    
    try {
      const configResponse = await fetch(configUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Config API Status:', configResponse.status);
      
      if (configResponse.ok) {
        const config = await configResponse.json();
        console.log('Firebase Auth Config:', config);
        
        // Check if sign-up is enabled
        if (config.signIn?.allowNewUsers === false) {
          return {
            success: false,
            error: 'New user registration is disabled in Firebase Console',
            details: config
          };
        }
        
        return {
          success: true,
          details: config
        };
      } else {
        const errorText = await configResponse.text();
        console.error('Config API Error:', errorText);
        
        return {
          success: false,
          error: `Firebase Auth API error: ${configResponse.status}`,
          details: errorText
        };
      }
    } catch (networkError) {
      console.error('Network error testing Firebase Auth:', networkError);
      
      return {
        success: false,
        error: 'Network error accessing Firebase Auth API',
        details: networkError
      };
    }
    
  } catch (error) {
    console.error('Firebase Auth setup test failed:', error);
    
    return {
      success: false,
      error: 'Firebase Auth setup test failed',
      details: error
    };
  }
};

/**
 * Test creating a user with a simple REST API call
 */
export const testDirectSignUp = async (email: string, password: string): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> => {
  try {
    const app = auth.app;
    const projectId = app.options.projectId;
    const apiKey = app.options.apiKey;
    
    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    
    const response = await fetch(signUpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });
    
    console.log('Direct SignUp Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Direct SignUp Success:', result.localId);
      
      return {
        success: true,
        details: result
      };
    } else {
      const errorData = await response.json();
      console.error('Direct SignUp Error:', errorData);
      
      return {
        success: false,
        error: errorData.error?.message || 'Unknown error',
        details: errorData
      };
    }
    
  } catch (error) {
    console.error('Direct SignUp failed:', error);
    
    return {
      success: false,
      error: 'Network error during direct signup',
      details: error
    };
  }
};