// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { auth } from './firebase';
import PersistentLayout from '@/components/PresistantLayout';
import { signOut } from 'firebase/auth';
import LogoutModal from '@/components/LogoutModal';
import Icon from 'react-native-vector-icons/FontAwesome';



export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setUser(user);
      setInitializing(false);
      setLogoutModalVisible(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/screens/auth/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      alert(error.message);
    }
  };


  if (initializing) return <View />;

  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="screens/auth/login" />
        <Stack.Screen name="screens/auth/register" />
      
        <Stack.Screen name="index" redirect />
      </Stack>
    );
  }

  return (
    <PersistentLayout>
        <LogoutModal
        visible={isLogoutModalVisible}
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
     
    <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen 
          name="screens/main/IncomeScreen" 
          options={{
            header: () => (
              <View style={styles.header}>
                <Text style={styles.headerText}>Income</Text>
                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={() => setLogoutModalVisible(true)}
                >
                  <View style={styles.logoutContainer}>
                    <Icon name="sign-out" size={30} color="#666" />
                    <Text style={styles.logoutText}>Logout</Text>
                  </View>
                </TouchableOpacity>
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
            <View style={styles.header}>
              <Text style={styles.headerText}>Expanses</Text>
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={() => setLogoutModalVisible(true)}
              >
                <View style={styles.logoutContainer}>
                  <Icon name="sign-out" size={26} color="#666" />
                  <Text style={styles.logoutText}>Logout</Text>
                </View>
              </TouchableOpacity>
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
            <View style={styles.header}>
              <Text style={styles.headerText}>Savings</Text>
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={() => setLogoutModalVisible(true)}
              >
                <View style={styles.logoutContainer}>
                  <Icon name="sign-out" size={30} color="#666" />
                  <Text style={styles.logoutText}>Logout</Text>
                </View>
              </TouchableOpacity>
            </View>
          ),
          headerShown: true,
          contentStyle: {
            backgroundColor: '#f0f0f0',
          },
        }} 
      />
        <Stack.Screen 
        name="screens/main/SummaryScreen" 
        options={{
          header: () => (
            <View style={styles.header}>
              <Text style={styles.headerText}>Summary</Text>
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={() => setLogoutModalVisible(true)}
              >
                <View style={styles.logoutContainer}>
                  <Icon name="sign-out" size={25} color="#666" />
                  <Text style={styles.logoutText}>Logout</Text>
                </View>
              </TouchableOpacity>
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
const styles = StyleSheet.create({
  header: {
    height: 80,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute', // Position the text absolutely
    width: '100%', // Take up full width to center properly
  },
  logoutButton: {
    position: 'absolute', // Position the logout button absolutely
    right: 16, // Place it on the far right
  },
  logoutContainer: {
    flexDirection: 'column', // Stack icon and text vertically
    alignItems: 'center', // Center them horizontally
  },
  logoutText: {
    color: '#666',
    fontSize: 14,
     // Add some spacing between the icon and text
  },
});