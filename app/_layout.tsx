// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

import React from 'react';
import { View } from 'react-native';
import { auth } from './firebase';



export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setUser(user);
      setInitializing(false);
    });

    return unsubscribe;

  }, []);

  if (initializing) return <View />;

  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
      
        <Stack.Screen name="index" redirect />
        <Stack.Screen name="Home" />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Home" 
        options={{
          title: "Budget Planner",
          headerBackVisible: false,
        }} 
      />
      <Stack.Screen 
        name="IncomeScreen" 
        options={{
          title: "Income Screen",
        }} 
      />
      <Stack.Screen 
        name="ExpanseScreen" 
        options={{
          title: "Expenses Screen",
        }} 
      />
      <Stack.Screen 
        name="SummaryScreen" 
        options={{
          title: "Summary Screen",
        }} 
      />
    </Stack>
  );
  
  
}