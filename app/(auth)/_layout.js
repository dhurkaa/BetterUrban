import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="report" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="full-map" 
        options={{ headerShown: false }} 
      />
      {/* Add other screens that require authentication */}
      {/* <Stack.Screen name="analytics" options={{ headerShown: false }} /> */}
      {/* <Stack.Screen name="reports" options={{ headerShown: false }} /> */}
    </Stack>
  );
}