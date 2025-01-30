import React, { useState, useEffect } from 'react';
import { View, StyleSheet,  ScrollView } from 'react-native';
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

  const calculateSavings = (frequency: ViewMode): number => {
    return savingSources.reduce((total, source) => {
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


useEffect(() => {
  const fetchExpenses = async () => {
    if (!userId) return;
    
    const q = query(
      collection(db, 'expenseSources'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    setExpenseSources(snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }) as ExpenseSource));
  };

  fetchExpenses();
}, [userId]);

  const totalIncome = calculateIncome(viewMode);
  const totalSavings = calculateSavings(viewMode);


  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
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

      
 
      <View style={styles.chartContainer}>
      <View style={styles.chartContainer}>
      <DonutChart 
  income={totalIncome}
  expenses={expenseSources}
  savings={totalSavings}
  viewMode={viewMode}
/>
</View>
</View>

</View>
</ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
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
    backgroundColor: '#1C202F' ,
    borderRadius: 10,
    padding: 20,
  },
  summaryRow: {
    marginBottom: 20,
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
});

export default SummaryScreen;