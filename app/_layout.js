import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Layout() {
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const user = await AsyncStorage.getItem('userToken');
      const inAuthGroup = segments[0] === '(auth)';

      if (!user && !inAuthGroup) {
        // Nëse s'ka token dhe s'është në login/signup, dërgoje te login
        router.replace('/login');
      } else if (user && inAuthGroup) {
        // Nëse është i loguar, mos e lejo te login
        router.replace('/');
      }
      setIsReady(true);
    };

    checkUser();
  }, [segments]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: true, title: 'BetterUrban' }} />
      <Stack.Screen name="report" options={{ headerShown: true, title: 'Raporto' }} />
    </Stack>
  );
}