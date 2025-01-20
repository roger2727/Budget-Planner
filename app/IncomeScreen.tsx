import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Trash2,  BadgeDollarSign } from 'lucide-react-native';
import { router } from 'expo-router';

import { auth } from './firebase';
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

interface IncomeSource {
  id: string;
  name: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually';
  amount: number;
  userId: string; // Add userId to track which user the income belongs to
}
type FrequencyColorMap = {
  [K in IncomeSource['frequency']]: string;
};

const FREQUENCY_COLORS: FrequencyColorMap = {
  weekly: '#e3f2fd',    // Light Blue
  fortnightly: '#e8f5e9', // Light Green
  monthly: '#fff3e0',    // Light Orange
  annually: '#f3e5f5',   // Light Purple
};


interface IncomeSource {
  id: string;
  name: string;
  frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually';
  amount: number;
  userId: string;
}



type GroupedIncomeSources = {
  [K in IncomeSource['frequency']]: IncomeSource[];
};
const IncomeForm = () => {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [newIncomeName, setNewIncomeName] = useState('');
  const [newIncomeFrequency, setNewIncomeFrequency] = useState<IncomeSource['frequency']>('weekly');
  const [newIncomeAmount, setNewIncomeAmount] = useState(0);
  const [incomeViewMode, setIncomeViewMode] = useState<'weekly' | 'monthly' | 'annual'>('annual');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setNewIncomeName('');
    setNewIncomeFrequency('weekly');
    setNewIncomeAmount(0);
  };
  const db = getFirestore();
  const userId = auth.currentUser?.uid;

  // Fetch income sources when component mounts
  useEffect(() => {
    if (userId) {
      fetchIncomeSources();
    }
  }, [userId]);

  const fetchIncomeSources = async () => {
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
  };

  const addIncomeSource = async () => {
    if (!userId) return;
  
    try {
      const newIncomeData = {
        name: newIncomeName,
        frequency: newIncomeFrequency,
        amount: newIncomeAmount,
        userId: userId,
      };
  
      const docRef = await addDoc(collection(db, 'incomeSources'), newIncomeData);
      
      setIncomeSources([...incomeSources, { id: docRef.id, ...newIncomeData }]);
      handleCloseModal(); // Close modal after adding
    } catch (error: any) {
      console.error('Error adding income source:', error);
      alert('Error adding income source');
    }
  };

  const removeIncomeSource = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'incomeSources', id));
      setIncomeSources(incomeSources.filter((source) => source.id !== id));
    } catch (error: any) {
      console.error('Error removing income source:', error);
      alert('Error removing income source');
    }
  };
  const totalIncome = incomeSources.reduce((total, source) => total + source.amount, 0);
  const weeklyIncome = incomeSources.reduce((total, source) => total + (source.amount / (source.frequency === 'weekly' ? 1 : source.frequency === 'fortnightly' ? 2 : source.frequency === 'monthly' ? 4 : 52)), 0);
  const monthlyIncome = incomeSources.reduce((total, source) => total + (source.amount / (source.frequency === 'monthly' ? 1 : source.frequency === 'fortnightly' ? 0.5 : source.frequency === 'annually' ? 12 : 4)), 0);
  const annualIncome = incomeSources.reduce((total, source) => total + (source.amount * (source.frequency === 'annually' ? 1 : source.frequency === 'fortnightly' ? 26 : source.frequency === 'monthly' ? 12 : 52)), 0);

  let displayedIncome = annualIncome;
  if (incomeViewMode === 'weekly') {
    displayedIncome = weeklyIncome;
  } else if (incomeViewMode === 'monthly') {
    displayedIncome = monthlyIncome;
  }

  const groupIncomeSourcesByFrequency = (sources: IncomeSource[]): GroupedIncomeSources => {
    const grouped: GroupedIncomeSources = {
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
  
  // Replace your existing income sources mapping with this:
  const renderGroupedIncomeSources = () => {
    const groupedSources = groupIncomeSourcesByFrequency(incomeSources);
    
    // Define the order you want to display the groups
    const frequencyOrder: IncomeSource['frequency'][] = ['weekly', 'fortnightly', 'monthly', 'annually'];
    
    return frequencyOrder.map(frequency => {
      const sources = groupedSources[frequency];
      if (sources.length === 0) return null;
  
      return (
        <View key={frequency}>
          <View style={styles.frequencyHeader}>
            <View style={[styles.frequencyIndicator, { backgroundColor: FREQUENCY_COLORS[frequency] }]} />
            <Text style={styles.frequencyHeaderText}>
              {frequency.charAt(0).toUpperCase() + frequency.slice(1)} Income
            </Text>
          </View>
  
          {sources.map((source: IncomeSource) => (
            <View key={source.id} style={styles.incomeItemWrapper}>
              <View 
                style={[
                  styles.incomeItemContainer, 
                  { backgroundColor: FREQUENCY_COLORS[source.frequency] }
                ]}
              >
                <View style={styles.incomeItem}>
                  <Text style={styles.incomeItemName}>{source.name}</Text>
                  <View style={styles.incomeItemRight}>
                    <BadgeDollarSign color="green" size={18} />
                    <Text style={styles.incomeItemText}>{source.amount.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => removeIncomeSource(source.id)}
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
        <ScrollView style={styles.scrollView}>
      <View style={styles.content}>
        <Text style={styles.title}>Income</Text>

        <View style={newStyles.addButtonContainer}>
  <TouchableOpacity 
    style={newStyles.addButton}
    onPress={() => setIsModalVisible(true)}
  >
    <Text style={newStyles.addButtonText}>Add Income</Text>
  </TouchableOpacity>
</View>

<Modal
  visible={isModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={handleCloseModal}
>
  <View style={newStyles.modalOverlay}>
    <View style={newStyles.modalContent}>
      <View style={newStyles.modalHeader}>
        <Text style={newStyles.modalTitle}>Add New Income</Text>
        <TouchableOpacity onPress={handleCloseModal}>
          <Text style={newStyles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Income Source"
        value={newIncomeName}
        onChangeText={setNewIncomeName}
      />
      
      <Picker
        style={styles.picker}
        selectedValue={newIncomeFrequency}
        onValueChange={(value) => setNewIncomeFrequency(value as IncomeSource['frequency'])}
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
        value={newIncomeAmount.toString()}
        onChangeText={(text) => setNewIncomeAmount(parseFloat(text) || 0)}
      />

      <View style={newStyles.modalButtons}>
        <TouchableOpacity 
          style={[styles.button, newStyles.cancelButton]}
          onPress={handleCloseModal}
        >
          <Text style={newStyles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, newStyles.saveButton]}
          onPress={addIncomeSource}
        >
          <Text style={newStyles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

      {renderGroupedIncomeSources()}
        <View style={styles.totals}>
          <Picker
            style={styles.picker}
            selectedValue={incomeViewMode}
            onValueChange={(value) => setIncomeViewMode(value as 'weekly' | 'monthly' | 'annual')}
          >
            <Picker.Item label="Weekly" value="weekly" />
            <Picker.Item label="Monthly" value="monthly" />
            <Picker.Item label="Annual" value="annual" />
          </Picker>
          <Text style={styles.totalLabel}>Total {incomeViewMode === 'weekly' ? 'Weekly' : incomeViewMode === 'monthly' ? 'Monthly' : 'Annual'} Income:</Text>
          <Text style={styles.totalAmount}>${displayedIncome.toFixed(2)}</Text>
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
const newStyles  = StyleSheet.create({
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
}
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
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
    alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
    justifyContent: 'space-between',
    flexWrap: 'wrap', // Added to allow wrapping
  },
  incomeItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1, // Added to allow proper space distribution
    marginRight: 6, // Added to maintain spacing from the right side content
    flexWrap: 'wrap', // Added to ensure text wraps
  },  
  incomeItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0, // Added to prevent the right side from shrinking
    minWidth: 90, // Added to ensure minimum width for the right side content
  },
  incomeItemText: {
    fontSize: 14,
    marginHorizontal: 5,
  },
  deleteIcon: {
    padding: 5,
    backgroundColor: 'red',
  },
  deleteButton: {
    backgroundColor: 'red',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  newIncomeContainer: {
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
  scrollView: {
    flex: 1,
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

export default IncomeForm;