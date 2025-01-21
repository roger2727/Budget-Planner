import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';

import NavBar from '../components/NavBar';
import FormModal from '../components/FormModal';
import { auth } from './firebase';
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
  const [incomeViewMode, setIncomeViewMode] = useState<'weekly' | 'monthly' | 'annual' | 'quarterly'>('annual');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Other');

  const db = useMemo(() => getFirestore(), []); // Memoize db instance
  const userId = auth.currentUser?.uid;
  const categories = useMemo(() => {
    const cats = DEFAULT_INCOME_ITEMS.map(item => item.category);
    return [...new Set([...cats, 'Other'])];
  }, []);
  // Memoize calculations for different income periods
  const incomeCalculations = useMemo(() => {
    const weekly = incomeSources.reduce((total, source) => 
      total + (source.amount / (source.frequency === 'weekly' ? 1 : 
        source.frequency === 'fortnightly' ? 2 : 
        source.frequency === 'monthly' ? 4 : 52)), 0);

    const monthly = incomeSources.reduce((total, source) => 
      total + (source.amount / (source.frequency === 'monthly' ? 1 : 
        source.frequency === 'fortnightly' ? 0.5 : 
        source.frequency === 'annually' ? 12 : 4)), 0);

    const annual = incomeSources.reduce((total, source) => 
      total + (source.amount * (source.frequency === 'annually' ? 1 : 
        source.frequency === 'fortnightly' ? 26 : 
        source.frequency === 'monthly' ? 12 : 52)), 0);

    const quarterly = incomeSources.reduce((total, source) => 
      total + (source.amount / (source.frequency === 'quarterly' ? 1 : 
        source.frequency === 'monthly' ? 3 : 4)), 0);

    return { weekly, monthly, annual, quarterly };
  }, [incomeSources]); // Only recalculate when incomeSources changes

  // Memoize displayed income based on view mode and calculations
  const displayedIncome = useMemo(() => {
    switch(incomeViewMode) {
      case 'weekly': return incomeCalculations.weekly;
      case 'monthly': return incomeCalculations.monthly;
      case 'quarterly': return incomeCalculations.quarterly;
      default: return incomeCalculations.annual;
    }
  }, [incomeViewMode, incomeCalculations]);

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
    } catch (error: any) {
      console.error('Error removing income source:', error);
      alert('Error removing income source');
    }
  }, [db]);

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
          <View key={source.id} style={styles.incomeItemWrapper}>
            <TouchableOpacity 
              style={styles.itemTouchable}
              onPress={() => handleEdit(source)}
            >
              <View style={[styles.incomeItemContainer, { borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}>
                <View style={styles.incomeItem}>
                  <Text style={styles.incomeItemName}>{source.name}</Text>
                  <View style={styles.incomeItemRight}>
                    <View style={styles.iconContainer}>
                      <Icon name='calendar' color="blue" size={18} />
                      <Icon name='dollar' color="green" size={18} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.frequencyText}>{source.frequency}</Text>
                      <Text style={styles.amountText}>${source.amount.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.deleteButton, { borderRadius: 0, borderTopRightRadius: 5, borderBottomRightRadius: 5 }]} 
              onPress={() => removeIncomeSource(source.id)}
            >
              <Text style={{ color: 'white' }}>
                <Icon name='trash' color="white" size={25} />
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    ));
  }, [groupedSources, handleEdit, removeIncomeSource]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Income</Text>
          {renderGroupedIncomeSources()}
          
          <View style={styles.addButtonContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.addButtonText}>Add Income</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.totals}>
            <View >
              <Picker
                style={styles.picker}
                selectedValue={incomeViewMode}
                onValueChange={(value) => setIncomeViewMode(value as 'weekly' | 'monthly' | 'annual' | 'quarterly')}
              >
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
                <Picker.Item label="Annual" value="annual" />
                <Picker.Item label="Quarterly" value="quarterly" />
              </Picker>
            </View>
            <Text style={styles.totalLabel}>
              Total {incomeViewMode.charAt(0).toUpperCase() + incomeViewMode.slice(1)} Income:
            </Text>
            <Text style={[styles.totalAmount, { color: 'green' }]}>
              ${displayedIncome.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <NavBar />
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
        onChangeName={setNewIncomeName}
        onChangeFrequency={setNewIncomeFrequency}
        onChangeAmount={(text) => setNewIncomeAmount(parseFloat(text) || 0)}
        onChangeCategory={setSelectedCategory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  incomeItemWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 15,
  },
  incomeItemContainer: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
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
  },
  incomeItemRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 80, // Ensures consistent width for the right section
  },
  iconContainer: {
    width: 24, // Fixed width for icons
    height: 50,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginRight: 4,
  },
  textContainer: {
    height: 50,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  frequencyText: {
    fontSize: 14,
    color: '#666',
    minWidth: 80, // Ensures consistent width for frequency text
  },
  amountText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 80, // Ensures consistent width for amount text
  },
  deleteButton: {
    backgroundColor: 'red',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  
  iconTextStack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconColumn: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 45,  // Adjust this value to control vertical spacing between icons
  },
  textColumn: {
    marginLeft: 8,
    height: 45,  // Match the iconColumn height
    justifyContent: 'space-between',
  },
 
  incomeItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
 
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
 
  // Container and Layout
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  itemTouchable: {
    flex: 1,  // This ensures it takes up all available space
  },
  // Title and Headers
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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

  // Add Button
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

  // Income Items
 
 

  // Delete Button


  // Modal Styles
 

  // Form Elements
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

  // Totals Section
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

  // Legend
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

export default IncomeForm;