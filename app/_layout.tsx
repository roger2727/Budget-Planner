// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

import React from 'react';
import { View, Text } from 'react-native';
import { auth } from './firebase';
import PersistentLayout from '@/components/PresistantLayout';




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
        <Stack.Screen name="screens/auth/login" />
        <Stack.Screen name="screens/auth/register" />
      
        <Stack.Screen name="index" redirect />
        <Stack.Screen name="screens/main/Home" />
      </Stack>
    );
  }

  return (
    <PersistentLayout>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="screens/main/Home" 
        options={{
          header: () => (
            <View style={{
              height: 80,
              backgroundColor: '#0f0f0f',
              justifyContent: 'center',
             
            }}>
              <Text style={{
                color: 'white',
                fontSize: 30,
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Home
              </Text>
            </View>
          ),
          headerShown: true,
          contentStyle: {
            backgroundColor: '#f0f0f0',
          },
        }} 
      />
<Stack.Screen 
  name="screens/main/IncomeScreen" 
  options={{
    header: () => (
      <View style={{
        height: 80,
        backgroundColor: '#0f0f0f',
        justifyContent: 'center',
       
      }}>
        <Text style={{
          color: 'white',
          fontSize: 30,
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Income
        </Text>
      </View>
    ),
    headerShown: true,
    contentStyle: {
      backgroundColor: '#f0f0f0',
    },
  }} 
/>
      <Stack.Screen 
        name="screens/main/ExpanseScreen" 
        options={{
          header: () => (
            <View style={{
              height: 80,
              backgroundColor: '#0f0f0f',
              justifyContent: 'center',
             
            }}>
              <Text style={{
                color: 'white',
                fontSize: 30,
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Expanses
              </Text>
            </View>
          ),
          headerShown: true,
          contentStyle: {
            backgroundColor: '#f0f0f0',
          },
        }} 
      />
           <Stack.Screen 
        name="screens/main/SavingScreen" 
        
        options={{
          header: () => (
            <View style={{
              height: 80,
              backgroundColor: '#0f0f0f',
              justifyContent: 'center',
             
            }}>
              <Text style={{
                color: 'white',
                fontSize: 30,
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Savings
              </Text>
            </View>
          ),
          headerShown: true,
          contentStyle: {
            backgroundColor: '#f0f0f0',
          },
        }}   />
        <Stack.Screen 
        name="screens/main/SummaryScreen" 
        options={{
          header: () => (
            <View style={{
              height: 80,
              backgroundColor: '#0f0f0f',
              justifyContent: 'center',
             
            }}>
              <Text style={{
                color: 'white',
                fontSize: 30,
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Summary
              </Text>
            </View>
          ),
          headerShown: true,
          contentStyle: {
            backgroundColor: '#f0f0f0',
          },
        }} 
      />
  
    </Stack>
    </PersistentLayout>
  );
  
  
}