import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

export default function AppLayout() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setInitializing(false); // Directly set to false since auth is mocked
  }, []);

  if (initializing) return null; // Show a loading splash screen

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}