// app/home.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

export default function HomeScreen() {
  const [balance, setBalance] = useState<number | null>(null);
  const db = getFirestore();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    if (!userId) return;
    
    try {
      // Fetch all data
      const incomeQuery = query(
        collection(db, 'incomeSources'),
        where('userId', '==', userId)
      );
      const expenseQuery = query(
        collection(db, 'expenseSources'),
        where('userId', '==', userId)
      );
      const savingQuery = query(
        collection(db, 'savingSources'),
        where('userId', '==', userId)
      );

      const [incomeSnapshot, expenseSnapshot, savingSnapshot] = await Promise.all([
        getDocs(incomeQuery),
        getDocs(expenseQuery),
        getDocs(savingQuery)
      ]);

      // Calculate totals
      const totalIncome = incomeSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.amount * (data.frequency === 'annually' ? 1 : 
          data.frequency === 'monthly' ? 12 : 
          data.frequency === 'fortnightly' ? 26 : 52));
      }, 0);

      const totalExpenses = expenseSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.amount * (data.frequency === 'annually' ? 1 : 
          data.frequency === 'monthly' ? 12 : 
          data.frequency === 'fortnightly' ? 26 : 52));
      }, 0);

      const totalSavings = savingSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.amount * (data.frequency === 'annually' ? 1 : 
          data.frequency === 'monthly' ? 12 : 
          data.frequency === 'fortnightly' ? 26 : 52));
      }, 0);

      // Calculate balance
      const calculatedBalance = totalIncome - totalExpenses - totalSavings;
      setBalance(calculatedBalance);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/screens/auth/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      alert(error.message);
    }
  };

  const navigateIncomeScreen = () => {
    router.push('/screens/main/IncomeScreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Budget Planner</Text>
        
        {balance !== null && (
          <View style={styles.messageContainer}>
            <Text style={[
              styles.messageText,
              { color: balance >= 0 ? '#4CAF50' : '#FF3B30' }
            ]}>
              {balance >= 0 
                ? `🎉 Congratulations! You are in surplus.\nYour balance: $${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : `😟 Oh no! You are in deficit.\nYour balance: -$${Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}\nConsider reviewing your expenses to make some changes.`
              }
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={navigateIncomeScreen}>
          <Text style={styles.buttonText}>START</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF'
  },
  messageContainer: {
    backgroundColor: '#1C202F',
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    width: '100%',
    alignItems: 'center'
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
  },
  logoutButton: {
    backgroundColor: '#FF3B30'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
});