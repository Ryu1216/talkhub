import { auth } from '../config/firebase';

/**
 * Debug Firebase configuration and connectivity
 */
export const debugFirebaseConfig = async () => {
  console.log('=== Firebase Debug Start ===');
  
  // Check Firebase app configuration
  const app = auth.app;
  console.log('Firebase App Name:', app.name);
  console.log('Firebase Project ID:', app.options.projectId);
  console.log('Firebase Auth Domain:', app.options.authDomain);
  console.log('Firebase API Key:', app.options.apiKey ? 'Present' : 'Missing');
  
  // Test various Firebase endpoints
  const endpoints = [
    'https://www.google.com',
    'https://firebase.google.com',
    'https://identitytoolkit.googleapis.com',
    `https://${app.options.authDomain}`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      console.log(`✓ ${endpoint} - accessible`);
    } catch (error) {
      console.log(`✗ ${endpoint} - error:`, error);
    }
  }
  
  // Test Firebase Auth REST API
  try {
    const testUrl = `https://identitytoolkit.googleapis.com/v1/projects/${app.options.projectId}:lookup?key=${app.options.apiKey}`;
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    console.log('Firebase Auth API Status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Firebase Auth API Error:', errorText);
    }
  } catch (error) {
    console.log('Firebase Auth API Test Failed:', error);
  }
  
  console.log('=== End Firebase Debug ===');
};