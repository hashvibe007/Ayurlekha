import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Plus, Minus } from 'lucide-react-native';
import { createPatient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AddPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onAddPatient: (patient: any) => void;
}

export function AddPatientModal({ visible, onClose, onAddPatient }: AddPatientModalProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [ailment, setAilment] = useState('');
  const [ailments, setAilments] = useState<string[]>([]);
  const [medication, setMedication] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [animation] = useState(new Animated.Value(0));
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const genderOptions = ['Male', 'Female', 'Other'];
  
  useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Reset form on close
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setName('');
    setAge('');
    setGender('');
    setHeight('');
    setAilment('');
    setAilments([]);
    setMedication('');
    setMedications([]);
  };

  const addAilment = () => {
    if (ailment.trim() !== '' && !ailments.includes(ailment.trim())) {
      setAilments([...ailments, ailment.trim()]);
      setAilment('');
    }
  };

  const removeAilment = (index: number) => {
    const newAilments = [...ailments];
    newAilments.splice(index, 1);
    setAilments(newAilments);
  };

  const addMedication = () => {
    if (medication.trim() !== '' && !medications.includes(medication.trim())) {
      setMedications([...medications, medication.trim()]);
      setMedication('');
    }
  };

  const removeMedication = (index: number) => {
    const newMedications = [...medications];
    newMedications.splice(index, 1);
    setMedications(newMedications);
  };

  const handleSubmit = async () => {
    if (name.trim() === '') {
      setError('Name is required');
      return;
    }
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const patient = await createPatient(
        name.trim(),
        null, // dob (add field if needed)
        gender || 'Not specified',
        user.id
      );
      onAddPatient(patient);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to add patient');
    } finally {
      setIsLoading(false);
    }
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [800, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.overlay,
            { opacity }
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidOverlay]} />
          )}
        </Animated.View>

        <TouchableOpacity 
          style={styles.closeArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY }] }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Add Patient</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter patient's full name"
                placeholderTextColor="#9E9E9E"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="Years"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Height</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="cm"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderOptions}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOption,
                      gender === option && styles.selectedGender
                    ]}
                    onPress={() => setGender(option)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === option && styles.selectedGenderText
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Existing Medical Conditions</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={ailment}
                  onChangeText={setAilment}
                  placeholder="Enter condition (e.g., Diabetes)"
                  placeholderTextColor="#9E9E9E"
                  onSubmitEditing={addAilment}
                />
                <TouchableOpacity 
                  style={styles.addTagButton}
                  onPress={addAilment}
                >
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.tagsContainer}>
                {ailments.map((item, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{item}</Text>
                    <TouchableOpacity
                      style={styles.removeTagButton}
                      onPress={() => removeAilment(index)}
                    >
                      <Minus size={14} color="#757575" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Regular Medications</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={medication}
                  onChangeText={setMedication}
                  placeholder="Enter medication"
                  placeholderTextColor="#9E9E9E"
                  onSubmitEditing={addMedication}
                />
                <TouchableOpacity 
                  style={styles.addTagButton}
                  onPress={addMedication}
                >
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.tagsContainer}>
                {medications.map((item, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{item}</Text>
                    <TouchableOpacity
                      style={styles.removeTagButton}
                      onPress={() => removeMedication(index)}
                    >
                      <Minus size={14} color="#757575" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSubmit}
            >
              <Text style={styles.saveButtonText}>Save Patient</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  androidOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeArea: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: '70%',
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333333',
  },
  genderOptions: {
    flexDirection: 'row',
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 8,
  },
  selectedGender: {
    backgroundColor: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  genderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#757575',
  },
  selectedGenderText: {
    color: '#4A90E2',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333333',
    marginRight: 10,
  },
  addTagButton: {
    backgroundColor: '#4A90E2',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F1FF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4A90E2',
    marginRight: 6,
  },
  removeTagButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#757575',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});