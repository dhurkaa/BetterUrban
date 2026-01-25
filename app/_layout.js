import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LanguageContextProvider from './utils/language';
import ThemeContextProvider from './utils/theme';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await AsyncStorage.getItem('userToken');
        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
          // Nëse s'ka token dhe s'është në login/signup, dërgoje te login
          router.replace('/login');
        } else if (user && inAuthGroup) {
          // Nëse është i loguar, mos e lejo te login
          router.replace('/');
        }
      } catch (error) {
        console.error('Error checking user authentication:', error);
      } finally {
        setIsReady(true);
      }
    };

    checkUser();
  }, [segments]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeContextProvider>
      <LanguageContextProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth Screens */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          
          {/* Main App Screens */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </LanguageContextProvider>
    </ThemeContextProvider>
  );
}