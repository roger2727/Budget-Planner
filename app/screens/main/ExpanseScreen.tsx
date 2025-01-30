import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { DEFAULT_SPENDING_ITEMS } from '../../../constants/defaultItems/defaultSpendingItems';
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
import { auth } from '../../firebase';
import NavBar from '@/components/NavBar';
import FormModal from '../../../components/FormModal';

interface ExpenseSource {
  id: string;
  name: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually' | 'quarterly';
  amount: number;
  userId: string;
  isDefault: boolean;
  category: string;
}

const ExpenseScreen = () => {
  const [expenseSources, setExpenseSources] = useState<ExpenseSource[]>([]);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseFrequency, setNewExpenseFrequency] = useState<ExpenseSource['frequency']>('weekly');
  const [newExpenseAmount, setNewExpenseAmount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Other');

  const db = useMemo(() => getFirestore(), []);
  const userId = auth.currentUser?.uid;

  const categories = useMemo(() => {
    const cats = DEFAULT_SPENDING_ITEMS.map(item => item.category);
    return [...new Set([...cats, 'Other'])];
  }, []);

  const groupedSources = useMemo(() => {
    const grouped: { [key: string]: ExpenseSource[] } = {};

    categories.forEach(category => {
      grouped[category] = [];
    });

    expenseSources.forEach(source => {
      const category = source.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(source);
    });

    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });

    return grouped;
  }, [expenseSources, categories]);

  const handleEdit = useCallback((source: ExpenseSource) => {
    setIsEditing(true);
    setEditingId(source.id);
    setNewExpenseName(source.name);
    setNewExpenseFrequency(source.frequency);
    setNewExpenseAmount(source.amount);
    setSelectedCategory(source.category);
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setIsEditing(false);
    setEditingId(null);
    setNewExpenseName('');
    setNewExpenseFrequency('weekly');
    setNewExpenseAmount(0);
    setSelectedCategory('Other');
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

  const handleSave = useCallback(async () => {
    if (!userId) return;

    try {
      const expenseData = {
        name: newExpenseName,
        frequency: newExpenseFrequency,
        amount: newExpenseAmount,
        userId: userId,
        isDefault: false,
        category: selectedCategory,
      };

      if (isEditing && editingId) {
        await updateDoc(doc(db, 'expenseSources', editingId), expenseData);
        setExpenseSources(prevSources => prevSources.map(source =>
          source.id === editingId ? { ...expenseData, id: editingId } : source
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
  }, [db, userId, newExpenseName, newExpenseFrequency, newExpenseAmount, selectedCategory, isEditing, editingId, handleCloseModal, fetchExpenseSources]);

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

      for (const categoryGroup of DEFAULT_SPENDING_ITEMS) {
        for (const item of categoryGroup.items) {
          if (!existingItems.has(item.name)) {
            await addDoc(collection(db, 'expenseSources'), {
              ...item,
              userId,
              isDefault: true,
              category: categoryGroup.category,
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

  const renderGroupedExpenseSources = useCallback(() => {
    return Object.entries(groupedSources).map(([category, sources]) => (
      <View key={category}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryHeaderText}>{category}</Text>
        </View>

        {sources.map(source => (
          <TouchableOpacity 
            key={source.id}
            style={styles.expenseItemContainer}
            onPress={() => handleEdit(source)}
          >
            <View style={styles.expenseItem}>
              <Text style={styles.expenseItemName}>{source.name}</Text>
              <View style={styles.expenseItemRight}>
                <View style={styles.frequencyContainer}>
                  <Icon name='calendar' color="grey" size={18} />
                  <Text style={styles.frequencyText}>{source.frequency}</Text>
                </View>
                <Text style={styles.amountText}>${source.amount.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    ));
  }, [groupedSources, handleEdit]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderGroupedExpenseSources()}
        
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Add Spending</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <FormModal
        visible={isModalVisible}
        isEditing={isEditing}
        itemName={newExpenseName}
        frequency={newExpenseFrequency}
        amount={newExpenseAmount}
        category={selectedCategory}
        categories={categories}
        type="Expense"
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={isEditing && editingId ? () => removeExpenseSource(editingId) : undefined}
        onChangeName={setNewExpenseName}
        onChangeFrequency={setNewExpenseFrequency}
        onChangeAmount={(text) => setNewExpenseAmount(parseFloat(text) || 0)}
        onChangeCategory={setSelectedCategory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  expenseItemRight: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  frequencyText: {
    fontSize: 14,
    color: 'grey',
  },
  amountText: {
    fontSize: 23,
    color: '#22C55E',
  },
  expenseItemContainer: {
    backgroundColor: '#1C202F',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expenseItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  addButtonContainer: {
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#FBBF24',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryHeader: {
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: 5,
    textAlign: 'center',
  },
  categoryHeaderText: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    backgroundColor: '#4F46E5',
    width: "100%",
    borderRadius: 8,
    padding: 8,
  },
});

export default ExpenseScreen;