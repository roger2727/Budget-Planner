import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Trash2, BadgeDollarSign, PenIcon } from 'lucide-react-native';
import { 
  doc, 
  collection, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  getFirestore, 
  updateDoc
} from 'firebase/firestore';
import { auth } from './firebase';
import NavBar from '@/components/NavBar';
import FormModal from '../components/FormModal';
const DEFAULT_SPENDING_ITEMS = [
  {
    category: "Housing",
    items: [
      { name: "Mortgage & rent", amount: 0, frequency: "monthly" },
      { name: "Council rates", amount: 0, frequency: "quarterly" },
      { name: "Electricity", amount: 0, frequency: "quarterly" },
      { name: "Gas", amount: 0, frequency: "quarterly" },
      { name: "Water", amount: 0, frequency: "quarterly" },
      { name: "Internet / mobile plans", amount: 0, frequency: "monthly" },
      { name: "Pay TV", amount: 0, frequency: "monthly" },
      { name: "Pest control", amount: 0, frequency: "annually" }
    ]
  },
  {
    category: "Insurance",
    items: [
      { name: "Car insurance", amount: 0, frequency: "annually" },
      { name: "Home & contents insurance", amount: 0, frequency: "annually" },
      { name: "Personal & life insurance", amount: 0, frequency: "annually" },
      { name: "Health insurance", amount: 0, frequency: "monthly" }
    ]
  },
  {
    category: "Financial",
    items: [
      { name: "Car loan", amount: 0, frequency: "monthly" },
      { name: "Help debt", amount: 0, frequency: "fortnightly" },
      { name: "Savings", amount: 0, frequency: "weekly" },
      { name: "Investment Fund", amount: 0, frequency: "monthly" }
    ]
  },
  {
    category: "Food & Groceries",
    items: [
      { name: "Supermarket", amount: 0, frequency: "weekly" },
      { name: "Coffee", amount: 0, frequency: "weekly" },
      { name: "Lunches bought", amount: 0, frequency: "weekly" },
      { name: "Take-away & snacks", amount: 0, frequency: "weekly" },
      { name: "Restaurants", amount: 0, frequency: "monthly" }
    ]
  },
  {
    category: "Personal & Medical",
    items: [
      { name: "Hair & beauty", amount: 0, frequency: "monthly" },
      { name: "Medicines & pharmacy", amount: 0, frequency: "monthly" },
      { name: "Dental", amount: 0, frequency: "annually" },
      { name: "Doctors & medical", amount: 0, frequency: "monthly" },
      { name: "Clothing & shoes", amount: 0, frequency: "monthly" },
      { name: "Computers & gadgets", amount: 0, frequency: "monthly" },
      { name: "Sports & gym", amount: 0, frequency: "monthly" },
      { name: "Education", amount: 0, frequency: "annually" },
      { name: "Pet care & vet", amount: 0, frequency: "monthly" }
    ]
  },
  {
    category: "Entertainment",
    items: [
      { name: "Back Then App", amount: 0, frequency: "monthly" },
      { name: "Books", amount: 0, frequency: "monthly" },
      { name: "Movies & music (Spotify)", amount: 0, frequency: "monthly" },
      { name: "Holidays", amount: 0, frequency: "annually" },
      { name: "Celebrations & gifts", amount: 0, frequency: "monthly" }
    ]
  },
  {
    category: "Transport",
    items: [
      { name: "Bus & train & ferry", amount: 0, frequency: "weekly" },
      { name: "Petrol", amount: 0, frequency: "weekly" },
      { name: "Road tolls & parking", amount: 0, frequency: "weekly" },
      { name: "Rego & licence", amount: 0, frequency: "annually" },
      { name: "Repairs & maintenance", amount: 0, frequency: "monthly" }
    ]
  },
  {
    category: "Children",
    items: [
      { name: "Toys", amount: 0, frequency: "weekly" },
      { name: "Childcare (oosh)", amount: 0, frequency: "weekly" },
  
      { name: "School supplies", amount: 0, frequency: "annually" },
      { name: "Pocket money", amount: 0, frequency: "weekly" }
    ]
  }
];

interface ExpenseSource {
  id: string;
  name: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually' | 'quarterly';
  amount: number;
  userId: string;
  isDefault: boolean;
  category: string;
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
  quarterly: '#c5cae9',  // Light Indigo
};


const ExpenseScreen = () => {
  const [expenseSources, setExpenseSources] = useState<ExpenseSource[]>([]);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseFrequency, setNewExpenseFrequency] = useState<ExpenseSource['frequency']>('weekly');
  const [newExpenseAmount, setNewExpenseAmount] = useState(0);
  const [expenseViewMode, setExpenseViewMode] = useState<'weekly' | 'monthly' | 'annual'>('annual');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const db = useMemo(() => getFirestore(), []); // Memoize db instance
  const userId = auth.currentUser?.uid;

  // Memoize expense calculations
  const expenseCalculations = useMemo(() => {
    const weekly = expenseSources.reduce((total, source) => 
      total + (source.amount / (source.frequency === 'weekly' ? 1 : 
        source.frequency === 'fortnightly' ? 2 : 
        source.frequency === 'monthly' ? 4 : 52)), 0);

    const monthly = expenseSources.reduce((total, source) => 
      total + (source.amount / (source.frequency === 'monthly' ? 1 : 
        source.frequency === 'fortnightly' ? 0.5 : 
        source.frequency === 'annually' ? 12 : 4)), 0);

    const annual = expenseSources.reduce((total, source) => 
      total + (source.amount * (source.frequency === 'annually' ? 1 : 
        source.frequency === 'fortnightly' ? 26 : 
        source.frequency === 'monthly' ? 12 : 52)), 0);

    const quarterly = expenseSources.reduce((total, source) => 
      total + (source.amount / (source.frequency === 'quarterly' ? 1 : 
        source.frequency === 'monthly' ? 3 : 4)), 0);

    return { weekly, monthly, annual, quarterly };
  }, [expenseSources]);

  // Memoize displayed expense based on view mode
  const displayedExpense = useMemo(() => {
    switch(expenseViewMode) {
      case 'weekly': return expenseCalculations.weekly;
      case 'monthly': return expenseCalculations.monthly;
      default: return expenseCalculations.annual;
    }
  }, [expenseViewMode, expenseCalculations]);

  // Memoize grouped sources for rendering
  const groupedSources = useMemo(() => {
    const grouped: { [key: string]: ExpenseSource[] } = {};
  
    expenseSources.forEach(source => {
      const category = DEFAULT_SPENDING_ITEMS.find(item => 
        item.items.some(i => i.name === source.name)
      )?.category;
  
      if (category) {
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(source);
      }
    });

    const otherSources = expenseSources.filter(source => 
      !DEFAULT_SPENDING_ITEMS.some(item => 
        item.items.some(i => i.name === source.name)
      )
    );
    
    if (otherSources.length > 0) {
      grouped["Other"] = otherSources;
    }

    return grouped;
  }, [expenseSources]);

  // Memoize callbacks
  const handleEdit = useCallback((source: ExpenseSource) => {
    setIsEditing(true);
    setEditingId(source.id);
    setNewExpenseName(source.name);
    setNewExpenseFrequency(source.frequency);
    setNewExpenseAmount(source.amount);
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setIsEditing(false);
    setEditingId(null);
    setNewExpenseName('');
    setNewExpenseFrequency('weekly');
    setNewExpenseAmount(0);
  }, []);

  const removeExpenseSource = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenseSources', id));
      setExpenseSources(prevSources => prevSources.filter((source) => source.id !== id));
    } catch (error: any) {
      console.error('Error removing expense source:', error);
      alert('Error removing expense source');
    }
  }, [db]);

  const handleSave = useCallback(async () => {
    if (!userId) return;
  
    try {
      const category = DEFAULT_SPENDING_ITEMS.find(item =>
        item.items.some(i => i.name === newExpenseName)
      )?.category;
  
      const expenseData = {
        name: newExpenseName,
        frequency: newExpenseFrequency,
        amount: newExpenseAmount,
        userId: userId,
        isDefault: false,
        category: category || 'Other',
      };
  
      if (isEditing && editingId) {
        await updateDoc(doc(db, 'expenseSources', editingId), expenseData);
        setExpenseSources(prevSources => prevSources.map(source =>
          source.id === editingId ? { ...expenseData, id: editingId, isDefault: source.isDefault } : source
        ));
      } else {
        await addDoc(collection(db, 'expenseSources'), expenseData);
        await fetchExpenseSources();
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving expense source:', error);
      alert('Error saving expense source: ' + error.message);
    }
  }, [db, userId, newExpenseName, newExpenseFrequency, newExpenseAmount, isEditing, editingId, handleCloseModal]);

  const fetchExpenseSources = useCallback(async () => {
    if (!userId) return;
    
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
  }, [db, userId]);

  const initializeDefaultSpending = useCallback(async () => {
    if (!userId) return;
  
    try {
      const q = query(
        collection(db, 'expenseSources'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const existingItems = querySnapshot.docs.reduce((map, doc) => {
        const data = doc.data();
        map.set(data.name, { id: doc.id, isDefault: data.isDefault });
        return map;
      }, new Map());
  
      for (const category of DEFAULT_SPENDING_ITEMS) {
        for (const item of category.items) {
          if (!existingItems.has(item.name)) {
            await addDoc(collection(db, 'expenseSources'), {
              ...item,
              userId,
              isDefault: true,
              category: category.category,
            });
          }
        }
      }
  
      await fetchExpenseSources();
    } catch (error) {
      console.error('Error initializing default spending:', error);
    }
  }, [db, userId, fetchExpenseSources]);

  useEffect(() => {
    if (userId) {
      initializeDefaultSpending();
    }
  }, [userId, initializeDefaultSpending]);

  // Memoize render function
  const renderGroupedExpenseSources = useCallback(() => {
    return Object.entries(groupedSources).map(([category, sources]) => (
      <View key={category}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryHeaderText}>{category}</Text>
        </View>
  
        {sources.map(source => (
          <View key={source.id} style={styles.expenseItemWrapper}>
            <TouchableOpacity 
              style={styles.itemTouchable}
              onPress={() => handleEdit(source)}
            >
              <View style={styles.expenseItemContainer}>
                <View style={styles.expenseItem}>
                  <Text style={styles.expenseItemName}>{source.name}</Text>
                  <View style={styles.expenseItemRight}>
                    <BadgeDollarSign color="red" size={18} />
                    <Text style={styles.expenseItemText}>{source.amount.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => handleEdit(source)}
            >
              <PenIcon color="white" size={18} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => removeExpenseSource(source.id)}
            >
              <Trash2 color="white" size={18} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    ));
  }, [groupedSources, handleEdit, removeExpenseSource]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Spending</Text>
        
        {renderGroupedExpenseSources()}
        
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Add Spending</Text>
          </TouchableOpacity>
        </View>
        
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
            Total {expenseViewMode === 'weekly' ? 'Weekly' : expenseViewMode === 'monthly' ? 'Monthly' : 'Annual'} Spending:
          </Text>
          <Text style={[styles.totalAmount, { color: 'red' }]}>-${displayedExpense.toFixed(2)}</Text>
        </View>
      </ScrollView>

      <NavBar />
      <FormModal
        visible={isModalVisible}
        isEditing={isEditing}
        itemName={newExpenseName}
        frequency={newExpenseFrequency}
        amount={newExpenseAmount}
        type="Expense"
        onClose={handleCloseModal}
        onSave={handleSave}
        onChangeName={setNewExpenseName}
        onChangeFrequency={setNewExpenseFrequency}
        onChangeAmount={(text) => setNewExpenseAmount(parseFloat(text) || 0)}
      />
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
    minWidth: 70,
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
  itemTouchable: {
    flex: 1,
  },
  editButton: {
    backgroundColor: '#4CAF50', // Green color
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  categoryHeader: {
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  categoryHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

});

export default ExpenseScreen;