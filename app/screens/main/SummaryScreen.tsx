import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '../../firebase';
import DonutChart from '@/components/RingChart';
import { ExpenseSource } from '@/types/interfaces';

interface IncomeSource {
  id: string;
  name: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually';
  amount: number;
  userId: string;
}
interface SavingSource {
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
  const [savingSources, setSavingSources] = useState<SavingSource[]>([]);
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

      // Fetch saving sources
      const savingQuery = query(
        collection(db, 'savingSources'),
        where('userId', '==', userId)
      );
      const savingSnapshot = await getDocs(savingQuery);
      const savingData: SavingSource[] = [];
      savingSnapshot.forEach((doc) => {
        savingData.push({ id: doc.id, ...doc.data() } as SavingSource);
      });
      setSavingSources(savingData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading summary data');
    }
  };

  const calculateIncome = (frequency: ViewMode, incomeSources: IncomeSource[]): number => {
    return incomeSources.reduce((total, source) => {
      // First convert all amounts to annual
      let annualAmount = source.amount;
      switch (source.frequency) {
        case 'weekly':
          annualAmount *= 52;
          break;
        case 'fortnightly':
          annualAmount *= 26;
          break;
        case 'monthly':
          annualAmount *= 12;
          break;
        case 'annually':
          // Already annual, no conversion needed
          break;
      }
  
      // Then convert annual amount to requested frequency
      switch (frequency) {
        case 'weekly':
          return total + (annualAmount / 52);
        case 'monthly':
          return total + (annualAmount / 12);
        case 'annual':
          return total + annualAmount;
      }
    }, 0);
  };

  const calculateExpenses = (frequency: ViewMode, expenseSources: ExpenseSource[]): number => {
    return expenseSources.reduce((total, source) => {
      // First convert all amounts to annual
      let annualAmount = source.amount;
      switch (source.frequency) {
        case 'weekly':
          annualAmount *= 52;
          break;
        case 'fortnightly':
          annualAmount *= 26;
          break;
        case 'monthly':
          annualAmount *= 12;
          break;
        case 'annually':
          // Already annual, no conversion needed
          break;
      }
  
      // Then convert annual amount to requested frequency
      switch (frequency) {
        case 'weekly':
          return total + (annualAmount / 52);
        case 'monthly':
          return total + (annualAmount / 12);
        case 'annual':
          return total + annualAmount;
      }
    }, 0);
  };
  
  const calculateSavings = (frequency: ViewMode, savingSources: SavingSource[]): number => {
    return savingSources.reduce((total, source) => {
      // First convert all amounts to annual
      let annualAmount = source.amount;
      switch (source.frequency) {
        case 'weekly':
          annualAmount *= 52;
          break;
        case 'fortnightly':
          annualAmount *= 26;
          break;
        case 'monthly':
          annualAmount *= 12;
          break;
        case 'annually':
          // Already annual, no conversion needed
          break;
      }
  
      // Then convert annual amount to requested frequency
      switch (frequency) {
        case 'weekly':
          return total + (annualAmount / 52);
        case 'monthly':
          return total + (annualAmount / 12);
        case 'annual':
          return total + annualAmount;
      }
    }, 0);
  };
  const totalIncome = calculateIncome(viewMode, incomeSources);
  const totalExpenses = calculateExpenses(viewMode, expenseSources);
  const totalSavings = calculateSavings(viewMode, savingSources);
  const balance = totalIncome - totalExpenses - totalSavings;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <View style={styles.pickerContainer}>
            <Picker
              dropdownIconColor='white'
              style={styles.picker}
              selectedValue={viewMode}
              onValueChange={(value: ViewMode) => setViewMode(value)}
              
            >
              <Picker.Item label="Weekly View" value="weekly" />
              <Picker.Item label="Monthly View" value="monthly" />
              <Picker.Item label="Annual View" value="annual" />
            </Picker>
          </View>

          {/* Surplus/Deficit Card */}
          <View style={[
            styles.balanceCard,
            { backgroundColor: balance >= 0 ? '#4CAF50' : '#f44336' }
          ]}>
            <Text style={styles.balanceText}>
              {balance >= 0 ? 'Surplus' : 'Deficit'}
            </Text>
            <Text style={styles.balanceAmount}>
              ${Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Donut Chart */}
          <View style={styles.chartContainer}>
            <DonutChart 
              income={totalIncome}
              expenses={expenseSources}
              savings={totalSavings}
              viewMode={viewMode}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#1C202F',
    borderRadius: 10,
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    marginBottom: 20,
   
  },
  picker: {
    color: 'white',
    marginBottom: 10,
  },
  chartContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  balanceCard: {
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  balanceAmount: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default SummaryScreen;