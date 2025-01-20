import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Trash2, BadgeDollarSign } from 'lucide-react-native';
import { router } from 'expo-router';
import { 
  doc, 
  collection, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  getFirestore 
} from 'firebase/firestore';
import { auth } from './config/firebase';

interface ExpenseSource {
  id: string;
  name: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually';
  amount: number;
  userId: string;
}

type FrequencyColorMap = {
  [K in ExpenseSource['frequency']]: string;
};

type GroupedExpenseSources = {
  [K in ExpenseSource['frequency']]: ExpenseSource[];
};

const FREQUENCY_COLORS: FrequencyColorMap = {
  weekly: '#ffcdd2',    // Light Red
  fortnightly: '#f8bbd0', // Light Pink
  monthly: '#e1bee7',    // Light Purple
  annually: '#d1c4e9',   // Light Deep Purple
};

const FrequencyLegend: React.FC = () => (
  <View style={styles.legendContainer}>
    <Text style={styles.legendTitle}>Payment Frequency:</Text>
    <View style={styles.legendItems}>
      {(Object.entries(FREQUENCY_COLORS) as [ExpenseSource['frequency'], string][]).map(([frequency, color]) => (
        <View key={frequency} style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: color }]} />
          <Text style={styles.legendText}>
            {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
          </Text>
        </View>
      ))}
    </View>
  </View>
);  
const ExpenseScreen = () => {
    const [expenseSources, setExpenseSources] = useState<ExpenseSource[]>([]);
    const [newExpenseName, setNewExpenseName] = useState('');
    const [newExpenseFrequency, setNewExpenseFrequency] = useState<ExpenseSource['frequency']>('weekly');
    const [newExpenseAmount, setNewExpenseAmount] = useState(0);
    const [expenseViewMode, setExpenseViewMode] = useState<'weekly' | 'monthly' | 'annual'>('annual');
    const [isModalVisible, setIsModalVisible] = useState(false);
  
    const db = getFirestore();
    const userId = auth.currentUser?.uid;
  
    useEffect(() => {
      if (userId) {
        fetchExpenseSources();
      }
    }, [userId]);
  
    const handleCloseModal = () => {
      setIsModalVisible(false);
      setNewExpenseName('');
      setNewExpenseFrequency('weekly');
      setNewExpenseAmount(0);
    };
  const fetchExpenseSources = async () => {
    try {
      const q = query(
        collection(db, 'expenseSources'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const sources: ExpenseSource[] = [];
      
      querySnapshot.forEach((doc) => {
        sources.push({ id: doc.id, ...doc.data() } as ExpenseSource);
      });
      
      setExpenseSources(sources);
    } catch (error: any) {
      console.error('Error fetching expense sources:', error);
      alert('Error loading expense sources');
    }
  };
  const addExpenseSource = async () => {
    if (!userId) return;

    try {
      const newExpenseData = {
        name: newExpenseName,
        frequency: newExpenseFrequency,
        amount: newExpenseAmount,
        userId: userId,
      };

      const docRef = await addDoc(collection(db, 'expenseSources'), newExpenseData);
      
      setExpenseSources([...expenseSources, { id: docRef.id, ...newExpenseData }]);
      handleCloseModal();
    } catch (error: any) {
      console.error('Error adding expense source:', error);
      alert('Error adding expense source');
    }
  };

  const removeExpenseSource = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenseSources', id));
      setExpenseSources(expenseSources.filter((source) => source.id !== id));
    } catch (error: any) {
      console.error('Error removing expense source:', error);
      alert('Error removing expense source');
    }
  };

  const weeklyExpense = expenseSources.reduce((total, source) => 
    total + (source.amount / (source.frequency === 'weekly' ? 1 : 
      source.frequency === 'fortnightly' ? 2 : 
      source.frequency === 'monthly' ? 4 : 52)), 0);

  const monthlyExpense = expenseSources.reduce((total, source) => 
    total + (source.amount / (source.frequency === 'monthly' ? 1 : 
      source.frequency === 'fortnightly' ? 0.5 : 
      source.frequency === 'annually' ? 12 : 4)), 0);

  const annualExpense = expenseSources.reduce((total, source) => 
    total + (source.amount * (source.frequency === 'annually' ? 1 : 
      source.frequency === 'fortnightly' ? 26 : 
      source.frequency === 'monthly' ? 12 : 52)), 0);

  let displayedExpense = annualExpense;
  if (expenseViewMode === 'weekly') {
    displayedExpense = weeklyExpense;
  } else if (expenseViewMode === 'monthly') {
    displayedExpense = monthlyExpense;
  }
  const groupExpenseSourcesByFrequency = (sources: ExpenseSource[]): GroupedExpenseSources => {
    const grouped: GroupedExpenseSources = {
      weekly: [],
      fortnightly: [],
      monthly: [],
      annually: []
    };
  
    sources.forEach(source => {
      grouped[source.frequency].push(source);
    });
  
    return grouped;
  };

  const renderGroupedExpenseSources = () => {
    const groupedSources = groupExpenseSourcesByFrequency(expenseSources);
    const frequencyOrder: ExpenseSource['frequency'][] = ['weekly', 'fortnightly', 'monthly', 'annually'];
    
    return frequencyOrder.map(frequency => {
      const sources = groupedSources[frequency];
      if (sources.length === 0) return null;
  
      return (
        <View key={frequency}>
          <View style={styles.frequencyHeader}>
            <View style={[styles.frequencyIndicator, { backgroundColor: FREQUENCY_COLORS[frequency] }]} />
            <Text style={styles.frequencyHeaderText}>
              {frequency.charAt(0).toUpperCase() + frequency.slice(1)} Expenses
            </Text>
          </View>
  
          {sources.map(source => (
            <View key={source.id} style={styles.expenseItemWrapper}>
              <View 
                style={[
                  styles.expenseItemContainer, 
                  { backgroundColor: FREQUENCY_COLORS[source.frequency] }
                ]}
              >
                <View style={styles.expenseItem}>
                  <Text style={styles.expenseItemName}>{source.name}</Text>
                  <View style={styles.expenseItemRight}>
                    <BadgeDollarSign color="red" size={18} />
                    <Text style={styles.expenseItemText}>{source.amount.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => removeExpenseSource(source.id)}
              >
                <Trash2 color="white" size={18} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Expenses</Text>

        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        <FrequencyLegend />
        
        {renderGroupedExpenseSources()}

        <View style={styles.totals}>
          <Picker
            style={styles.picker}
            selectedValue={expenseViewMode}
            onValueChange={(value) => setExpenseViewMode(value as 'weekly' | 'monthly' | 'annual')}
          >
            <Picker.Item label="Weekly" value="weekly" />
            <Picker.Item label="Monthly" value="monthly" />
            <Picker.Item label="Annual" value="annual" />
          </Picker>
          <Text style={styles.totalLabel}>
            Total {expenseViewMode === 'weekly' ? 'Weekly' : expenseViewMode === 'monthly' ? 'Monthly' : 'Annual'} Expenses:
          </Text>
          <Text style={[styles.totalAmount, { color: 'red' }]}>-${displayedExpense.toFixed(2)}</Text>
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Expense</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Expense Name"
              value={newExpenseName}
              onChangeText={setNewExpenseName}
            />
            
            <Picker
              style={styles.picker}
              selectedValue={newExpenseFrequency}
              onValueChange={(value) => setNewExpenseFrequency(value as ExpenseSource['frequency'])}
            >
              <Picker.Item label="Weekly" value="weekly" />
              <Picker.Item label="Fortnightly" value="fortnightly" />
              <Picker.Item label="Monthly" value="monthly" />
              <Picker.Item label="Annually" value="annually" />
            </Picker>
            
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={newExpenseAmount.toString()}
              onChangeText={(text) => setNewExpenseAmount(parseFloat(text) || 0)}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={addExpenseSource}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  expenseItemWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 15,
  },
  expenseItemContainer: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  expenseItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  expenseItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 120,
  },
  expenseItemText: {
    fontSize: 14,
    marginHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: 'red',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  newExpenseContainer: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  picker: {
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  totals: {
    marginTop: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  totalAmount: {
    fontSize: 18,
    marginBottom: 10,
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
  addButtonContainer: {
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    padding: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    flex: 1,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flex: 1,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  legendContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  legendText: {
    fontSize: 12,
  },
  frequencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  frequencyHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  frequencyIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },

});

export default ExpenseScreen;