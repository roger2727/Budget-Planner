import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import FormModal from '../../../components/FormModal';
import { auth } from '../../firebase';
import { 
  doc, collection, addDoc, deleteDoc, getDocs, 
  query, where, getFirestore, updateDoc 
} from 'firebase/firestore';
import { DEFAULT_INCOME_ITEMS } from '@/constants/defaultItems/defaultIncomeItems';
interface IncomeSource {
  id: string;
  name: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually' | 'quarterly';
  amount: number;
  userId: string;
  isDefault: boolean;
  category: string;
}

const IncomeForm = () => {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [newIncomeName, setNewIncomeName] = useState('');
  const [newIncomeFrequency, setNewIncomeFrequency] = useState<IncomeSource['frequency']>('weekly');
  const [newIncomeAmount, setNewIncomeAmount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Other');

  const db = useMemo(() => getFirestore(), []);
  const userId = auth.currentUser?.uid;
  const categories = useMemo(() => {
    const cats = DEFAULT_INCOME_ITEMS.map(item => item.category);
    return [...new Set([...cats, 'Other'])];
  }, []);

  // Memoize grouped sources for rendering
  const groupedSources = useMemo(() => {
    const grouped: { [key: string]: IncomeSource[] } = {};
  
    // Initialize all categories from DEFAULT_INCOME_ITEMS
    categories.forEach(category => {
      grouped[category] = [];
    });
  
    // Group sources by their saved category
    incomeSources.forEach(source => {
      const category = source.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(source);
    });
  
    // Remove empty categories
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });
  
    return grouped;
  }, [incomeSources, categories]);

  // Memoize callbacks
  const handleEdit = useCallback((source: IncomeSource) => {
    setIsEditing(true);
    setEditingId(source.id);
    setNewIncomeName(source.name);
    setNewIncomeFrequency(source.frequency);
    setNewIncomeAmount(source.amount);
    setSelectedCategory(source.category);
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setIsEditing(false);
    setEditingId(null);
    setNewIncomeName('');
    setNewIncomeFrequency('weekly');
    setNewIncomeAmount(0);
    setSelectedCategory('Other');
  }, []);

  const removeIncomeSource = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'incomeSources', id));
      setIncomeSources(prevSources => prevSources.filter((source) => source.id !== id));
      handleCloseModal();
    } catch (error: any) {
      console.error('Error removing income source:', error);
      alert('Error removing income source');
    }
  }, [db, handleCloseModal]);

  const handleSave = useCallback(async () => {
    if (!userId) return;
  
    try {
      const incomeData = {
        name: newIncomeName,
        frequency: newIncomeFrequency,
        amount: newIncomeAmount,
        userId: userId,
        isDefault: false,
        category: selectedCategory,
      };
  
      if (isEditing && editingId) {
        await updateDoc(doc(db, 'incomeSources', editingId), incomeData);
        setIncomeSources(prevSources => prevSources.map(source =>
          source.id === editingId ? { ...incomeData, id: editingId } : source
        ));
      } else {
        const docRef = await addDoc(collection(db, 'incomeSources'), incomeData);
        await fetchIncomeSources();
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving income source:', error);
      alert('Error saving income source: ' + error.message);
    }
  }, [db, userId, newIncomeName, newIncomeFrequency, newIncomeAmount, selectedCategory, isEditing, editingId, handleCloseModal]);

  // Memoize the fetch function
  const fetchIncomeSources = useCallback(async () => {
    if (!userId) return;
    
    try {
      const q = query(
        collection(db, 'incomeSources'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const sources: IncomeSource[] = [];
      
      querySnapshot.forEach((doc) => {
        sources.push({ id: doc.id, ...doc.data() } as IncomeSource);
      });
      
      setIncomeSources(sources);
    } catch (error: any) {
      console.error('Error fetching income sources:', error);
      alert('Error loading income sources');
    }
  }, [db, userId]);

  // Initialize default income sources
  const initializeDefaultIncome = useCallback(async () => {
    if (!userId) return;

    try {
      const q = query(
        collection(db, 'incomeSources'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const existingItems = querySnapshot.docs.reduce((map, doc) => {
        const data = doc.data();
        map.set(data.name, { id: doc.id, isDefault: data.isDefault });
        return map;
      }, new Map());

      // Add missing default items
      for (const category of DEFAULT_INCOME_ITEMS) {
        for (const item of category.items) {
          if (!existingItems.has(item.name)) {
            await addDoc(collection(db, 'incomeSources'), {
              ...item,
              userId,
              isDefault: true,
              category: category.category,
            });
          }
        }
      }

      await fetchIncomeSources();
    } catch (error) {
      console.error('Error initializing default income:', error);
    }
  }, [db, userId, fetchIncomeSources]);

  useEffect(() => {
    if (userId) {
      initializeDefaultIncome();
    }
  }, [userId, initializeDefaultIncome]);

  // Memoize the render function for income sources
const renderGroupedIncomeSources = useCallback(() => {
    return Object.entries(groupedSources).map(([category, sources]) => (
      <View key={category}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryHeaderText}>{category}</Text>
        </View>

        {sources.map(source => (
          <TouchableOpacity 
            key={source.id}
            style={styles.incomeItemContainer}
            onPress={() => handleEdit(source)}
          >
            <View style={styles.incomeItem}>
              <Text style={styles.incomeItemName}>{source.name}</Text>
              <View style={styles.incomeItemRight}>
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {renderGroupedIncomeSources()}
          
          <View style={styles.addButtonContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.addButtonText}>Add Income</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
   
      <FormModal
        visible={isModalVisible}
        isEditing={isEditing}
        itemName={newIncomeName}
        frequency={newIncomeFrequency}
        amount={newIncomeAmount}
        category={selectedCategory}
        categories={categories}
        type="Income"
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={isEditing && editingId ? () => removeIncomeSource(editingId) : undefined}
        onChangeName={setNewIncomeName}
        onChangeFrequency={setNewIncomeFrequency}
        onChangeAmount={(text) => setNewIncomeAmount(parseFloat(text) || 0)}
        onChangeCategory={setSelectedCategory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  incomeItemRight: {
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
  incomeItemContainer: {
    backgroundColor: '#1C202F',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  incomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  incomeItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
    color: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
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
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
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
    color: '4F46E5',
    backgroundColor: '#4F46E5',
    width: "100%",
    borderRadius: 8,
    padding: 8,
  },
});

export default IncomeForm;