import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from './firebase';
import { BadgeDollarSign, TrendingUp, TrendingDown } from 'lucide-react-native';

interface IncomeSource {
  id: string;
  name: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually';
  amount: number;
  userId: string;
}

interface ExpenseSource {
  id: string;
  name: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually';
  amount: number;
  userId: string;
}

type ViewMode = 'weekly' | 'monthly' | 'annual';

const SummaryScreen = () => {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [expenseSources, setExpenseSources] = useState<ExpenseSource[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('annual');
  const db = getFirestore();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch income sources
      const incomeQuery = query(
        collection(db, 'incomeSources'),
        where('userId', '==', userId)
      );
      const incomeSnapshot = await getDocs(incomeQuery);
      const incomeData: IncomeSource[] = [];
      incomeSnapshot.forEach((doc) => {
        incomeData.push({ id: doc.id, ...doc.data() } as IncomeSource);
      });
      setIncomeSources(incomeData);

      // Fetch expense sources
      const expenseQuery = query(
        collection(db, 'expenseSources'),
        where('userId', '==', userId)
      );
      const expenseSnapshot = await getDocs(expenseQuery);
      const expenseData: ExpenseSource[] = [];
      expenseSnapshot.forEach((doc) => {
        expenseData.push({ id: doc.id, ...doc.data() } as ExpenseSource);
      });
      setExpenseSources(expenseData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading summary data');
    }
  };

  const calculateIncome = (frequency: ViewMode): number => {
    return incomeSources.reduce((total, source) => {
      switch (frequency) {
        case 'weekly':
          return total + (source.amount / (source.frequency === 'weekly' ? 1 : 
            source.frequency === 'fortnightly' ? 2 : 
            source.frequency === 'monthly' ? 4 : 52));
        case 'monthly':
          return total + (source.amount / (source.frequency === 'monthly' ? 1 : 
            source.frequency === 'fortnightly' ? 0.5 : 
            source.frequency === 'annually' ? 12 : 4));
        default: // annual
          return total + (source.amount * (source.frequency === 'annually' ? 1 : 
            source.frequency === 'fortnightly' ? 26 : 
            source.frequency === 'monthly' ? 12 : 52));
      }
    }, 0);
  };

  const calculateExpenses = (frequency: ViewMode): number => {
    return expenseSources.reduce((total, source) => {
      switch (frequency) {
        case 'weekly':
          return total + (source.amount / (source.frequency === 'weekly' ? 1 : 
            source.frequency === 'fortnightly' ? 2 : 
            source.frequency === 'monthly' ? 4 : 52));
        case 'monthly':
          return total + (source.amount / (source.frequency === 'monthly' ? 1 : 
            source.frequency === 'fortnightly' ? 0.5 : 
            source.frequency === 'annually' ? 12 : 4));
        default: // annual
          return total + (source.amount * (source.frequency === 'annually' ? 1 : 
            source.frequency === 'fortnightly' ? 26 : 
            source.frequency === 'monthly' ? 12 : 52));
      }
    }, 0);
  };

  const totalIncome = calculateIncome(viewMode);
  const totalExpenses = calculateExpenses(viewMode);
  const balance = totalIncome - totalExpenses;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Financial Summary</Text>

        <View style={styles.pickerContainer}>
          <Picker
            style={styles.picker}
            selectedValue={viewMode}
            onValueChange={(value: ViewMode) => setViewMode(value)}
          >
            <Picker.Item label="Weekly View" value="weekly" />
            <Picker.Item label="Monthly View" value="monthly" />
            <Picker.Item label="Annual View" value="annual" />
          </Picker>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.iconContainer}>
                <TrendingUp color="green" size={24} />
              </View>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={[styles.summaryAmount, { color: 'green' }]}>
                ${totalIncome.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.iconContainer}>
                <TrendingDown color="red" size={24} />
              </View>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={[styles.summaryAmount, { color: 'red' }]}>
                -${totalExpenses.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={[styles.balanceContainer, { backgroundColor: balance >= 0 ? '#e8f5e9' : '#ffebee' }]}>
            <BadgeDollarSign color={balance >= 0 ? 'green' : 'red'} size={24} />
            <Text style={styles.balanceLabel}>
              {balance >= 0 ? 'Surplus' : 'Deficit'}
            </Text>
            <Text style={[styles.balanceAmount, { color: balance >= 0 ? 'green' : 'red' }]}>
              ${Math.abs(balance).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/Home')}>
          <Text style={styles.navButtonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/IncomeScreen')}>
          <Text style={styles.navButtonText}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/ExpanseScreen')}>
          <Text style={styles.navButtonText}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/SummaryScreen')}>
          <Text style={styles.navButtonText}>Summary</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 20,
  },
  picker: {
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  iconContainer: {
    marginRight: 10,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  balanceLabel: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  navButton: {
    paddingVertical: 10,
  },
  navButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default SummaryScreen;