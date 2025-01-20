// components/FormModal.tsx
import React from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type Frequency = 'weekly' | 'fortnightly' | 'monthly' | 'annually'| 'quarterly';

interface FormModalProps {
  visible: boolean;
  isEditing: boolean;
  itemName: string;
  frequency: Frequency;
  amount: number;
  type: 'Income' | 'Expense';
  onClose: () => void;
  onSave: () => void;
  onChangeName: (name: string) => void;
  onChangeFrequency: (frequency: Frequency) => void;
  onChangeAmount: (amount: string) => void;
}

const FormModal: React.FC<FormModalProps> = ({
  visible,
  isEditing,
  itemName,
  frequency,
  amount,
  type,
  onClose,
  onSave,
  onChangeName,
  onChangeFrequency,
  onChangeAmount,
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
          
     
          
          <TextInput
            style={styles.input}
            placeholder="Amount"
            keyboardType="numeric"
            value={amount.toString()}
            onChangeText={onChangeAmount}
          />
     <Picker
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
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
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
});

export default FormModal;