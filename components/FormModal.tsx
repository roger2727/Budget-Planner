// components/FormModal.tsx
import React from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';


type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'annually' | 'quarterly';

interface FormModalProps {
  visible: boolean;
  isEditing: boolean;
  itemName: string;
  frequency: Frequency;
  amount: number;
  category: string;
  categories: string[];
  type: 'Income' | 'Expense' | 'Saving';
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onChangeName: (name: string) => void;
  onChangeFrequency: (frequency: Frequency) => void;
  onChangeAmount: (amount: string) => void;
  onChangeCategory: (category: string) => void;
}

const FormModal: React.FC<FormModalProps> = ({
  visible,
  isEditing,
  itemName,
  frequency,
  amount,
  category,
  categories,
  type,
  onClose,
  onSave,
  onDelete,
  onChangeName,
  onChangeFrequency,
  onChangeAmount,
  onChangeCategory,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? `Edit ${type}` : `Add New ${type}`}
            </Text>
            {isEditing && onDelete && (
              <TouchableOpacity 
                style={[styles.button, styles.deleteButton]}
                onPress={onDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={`${type} Name`}
            value={itemName}
            onChangeText={onChangeName}
          />
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Category</Text>
            <Picker
              style={styles.picker}
              selectedValue={category}
              onValueChange={onChangeCategory}
              dropdownIconColor={'black'}
              
            >
              {categories.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Amount"
            keyboardType="numeric"
            value={amount.toString()}
            onChangeText={onChangeAmount}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Frequency</Text>
            <Picker
              dropdownIconColor={'black'}
              style={styles.picker}
              selectedValue={frequency}
              onValueChange={(value) => onChangeFrequency(value as Frequency)}
            >
              <Picker.Item label="Weekly" value="weekly" />
              <Picker.Item label="Fortnightly" value="fortnightly" />
              <Picker.Item label="Monthly" value="monthly" />
              <Picker.Item label="Annually" value="annually" />
              <Picker.Item label="Quarterly" value="quarterly" />
            </Picker>
          </View>

          <View style={styles.modalButtons}>
         
            
            <View style={styles.rightButtons}>
             
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={onSave}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
           
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  modalButtons: {
    marginTop: 20,
  },
  rightButtons: {
    flexDirection: 'column',
   width: "100%",
  },
  button: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
 
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    width: "100%",
  },
 
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
});

export default FormModal;