// app/home.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from './config/firebase';

export default function HomeScreen() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      alert(error.message);
    }
  };

  const navigateIncomeScreen = async () => {
    try {
        router.push('/IncomeScreen');
    } catch (error: any) {
        console.error('Navigation error:', error);
        alert(error.message);
    }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello!</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={navigateIncomeScreen}>
        <Text style={styles.buttonText}>START</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});