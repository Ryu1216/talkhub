import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider, Spinner, Center } from 'native-base';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation';
import { useAuthInit } from './src/hooks';

// Import Firebase configuration to initialize it
import './src/config/firebase';

export default function App() {
  const { initialized, loading } = useAuthInit();

  // Show loading spinner while initializing auth
  if (!initialized || loading) {
    return (
      <SafeAreaProvider>
        <NativeBaseProvider>
          <Center flex={1}>
            <Spinner size="lg" />
          </Center>
        </NativeBaseProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NativeBaseProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}
