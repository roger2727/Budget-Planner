import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
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
import FormModal from '../../../components/FormModal';
import { DEFAULT_SAVING_ITEMS } from '@/constants/defaultItems/defaultSavingsItems';

interface SavingSource {
  id: string;
  name: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually' | 'quarterly';
  amount: number;
  userId: string;
  isDefault: boolean;
  category: string;
}

const SavingScreen = () => {
  const [savingSources, setSavingSources] = useState<SavingSource[]>([]);
  const [newSavingName, setNewSavingName] = useState('');
  const [newSavingFrequency, setNewSavingFrequency] = useState<SavingSource['frequency']>('weekly');
  const [newSavingAmount, setNewSavingAmount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Other');

  const db = useMemo(() => getFirestore(), []);
  const userId = auth.currentUser?.uid;

  const categories = useMemo(() => {
    const cats = DEFAULT_SAVING_ITEMS.map(item => item.category);
    return [...new Set([...cats, 'Other'])];
  }, []);

  const groupedSources = useMemo(() => {
    const grouped: { [key: string]: SavingSource[] } = {};

    categories.forEach(category => {
      grouped[category] = [];
    });

    savingSources.forEach(source => {
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
  }, [savingSources, categories]);

  const handleEdit = useCallback((source: SavingSource) => {
    setIsEditing(true);
    setEditingId(source.id);
    setNewSavingName(source.name);
    setNewSavingFrequency(source.frequency);
    setNewSavingAmount(source.amount);
    setSelectedCategory(source.category);
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setIsEditing(false);
    setEditingId(null);
    setNewSavingName('');
    setNewSavingFrequency('weekly');
    setNewSavingAmount(0);
    setSelectedCategory('Other');
  }, []);

  const removeSavingSource = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'savingSources', id));
      setSavingSources(prevSources => prevSources.filter((source) => source.id !== id));
    } catch (error: any) {
      console.error('Error removing saving source:', error);
      alert('Error removing saving source');
    }
  }, [db]);

  const fetchSavingSources = useCallback(async () => {
    if (!userId) return;
    
    try {
      const q = query(
        collection(db, 'savingSources'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const sources: SavingSource[] = [];
      
      querySnapshot.forEach((doc) => {
        sources.push({ id: doc.id, ...doc.data() } as SavingSource);
      });
      
      setSavingSources(sources);
    } catch (error: any) {
      console.error('Error fetching saving sources:', error);
      alert('Error loading saving sources');
    }
  }, [db, userId]);

  const handleSave = useCallback(async () => {
    if (!userId) return;

    try {
      const savingData = {
        name: newSavingName,
        frequency: newSavingFrequency,
        amount: newSavingAmount,
        userId: userId,
        isDefault: false,
        category: selectedCategory,
      };

      if (isEditing && editingId) {
        await updateDoc(doc(db, 'savingSources', editingId), savingData);
        setSavingSources(prevSources => prevSources.map(source =>
          source.id === editingId ? { ...savingData, id: editingId } : source
        ));
      } else {
        await addDoc(collection(db, 'savingSources'), savingData);
        await fetchSavingSources();
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving saving source:', error);
      alert('Error saving saving source: ' + error.message);
    }
  }, [db, userId, newSavingName, newSavingFrequency, newSavingAmount, selectedCategory, isEditing, editingId, handleCloseModal, fetchSavingSources]);

  const initializeDefaultSaving = useCallback(async () => {
    if (!userId) return;

    try {
      const q = query(
        collection(db, 'savingSources'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const existingItems = querySnapshot.docs.reduce((map, doc) => {
        const data = doc.data();
        map.set(data.name, { id: doc.id, isDefault: data.isDefault });
        return map;
      }, new Map());

      for (const categoryGroup of DEFAULT_SAVING_ITEMS) {
        for (const item of categoryGroup.items) {
          if (!existingItems.has(item.name)) {
            await addDoc(collection(db, 'savingSources'), {
              ...item,
              userId,
              isDefault: true,
              category: categoryGroup.category,
            });
          }
        }
      }

      await fetchSavingSources();
    } catch (error) {
      console.error('Error initializing default saving:', error);
    }
  }, [db, userId, fetchSavingSources]);

  useEffect(() => {
    if (userId) {
      initializeDefaultSaving();
    }
  }, [userId, initializeDefaultSaving]);

  const renderGroupedSavingSources = useCallback(() => {
    return Object.entries(groupedSources).map(([category, sources]) => (
      <View key={category}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryHeaderText}>{category}</Text>
        </View>

        {sources.map(source => (
          <TouchableOpacity 
            key={source.id}
            style={styles.savingItemContainer}
            onPress={() => handleEdit(source)}
          >
            <View style={styles.savingItem}>
              <Text style={styles.savingItemName}>{source.name}</Text>
              <View style={styles.savingItemRight}>
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
          {renderGroupedSavingSources()}
          
          <View style={styles.addButtonContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.addButtonText}>Add Saving</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      

      <FormModal
        visible={isModalVisible}
        isEditing={isEditing}
        itemName={newSavingName}
        frequency={newSavingFrequency}
        amount={newSavingAmount}
        category={selectedCategory}
        categories={categories}
        type="Saving"
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={isEditing && editingId ? () => removeSavingSource(editingId) : undefined}
        onChangeName={setNewSavingName}
        onChangeFrequency={setNewSavingFrequency}
        onChangeAmount={(text) => setNewSavingAmount(parseFloat(text) || 0)}
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
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  savingItemContainer: {
    backgroundColor: '#1C202F',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  savingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
    color: 'white',
  },
  savingItemRight: {
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
    color: 'white',
    backgroundColor: '#4F46E5',
    width: "100%",
    borderRadius: 8,
    padding: 8,
  },
});

export default SavingScreen;