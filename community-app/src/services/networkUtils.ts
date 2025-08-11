/**
 * Network utility functions for handling connectivity issues
 */

/**
 * Check if the device has internet connectivity
 */
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    // Try to fetch a small resource from a reliable source
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return true;
  } catch (error) {
    console.warn('Network connectivity check failed:', error);
    return false;
  }
};

/**
 * Test Firebase connectivity specifically
 */
export const testFirebaseConnectivity = async (): Promise<boolean> => {
  try {
    // Try to access Firebase Auth REST API endpoint
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/projects', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    return true;
  } catch (error) {
    console.warn('Firebase connectivity check failed:', error);
    return false;
  }
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};