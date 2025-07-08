import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserPlus, Search, Heart, CircleAlert as AlertCircle, Pill as Pills, Thermometer } from 'lucide-react-native';
import { usePatientStore } from '@/stores/patientStore';
import { PatientCard } from '@/components/PatientCard';
import { AddPatientModal } from '@/components/AddPatientModal';

const { width } = Dimensions.get('window');

export default function PatientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { patients, addPatient } = usePatientStore();

  const handleAddPatient = (patient: any) => {
    addPatient(patient);
    setIsModalVisible(false);
  };

  const filteredPatients = searchQuery.trim() === '' 
    ? patients 
    : patients.filter(patient => 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (patient.ailments && patient.ailments.some(ailment => 
          ailment.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Heart size={64} color="#4A90E2" />
      </View>
      <Text style={styles.emptyTitle}>No Patients Added Yet</Text>
      <Text style={styles.emptyText}>
        Add your first patient by tapping the button below.
      </Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setIsModalVisible(true)}
      >
        <UserPlus size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.addButtonText}>Add Patient</Text>
      </TouchableOpacity>
    </View>
  );

  const getConditionIcon = (condition: string) => {
    switch(condition.toLowerCase()) {
      case 'diabetes':
        return <Pills size={16} color="#E53935" />;
      case 'hypertension':
        return <Heart size={16} color="#E53935" />;
      case 'asthma':
        return <AlertCircle size={16} color="#FB8C00" />;
      case 'allergies':
        return <Thermometer size={16} color="#FB8C00" />;
      default:
        return <AlertCircle size={16} color="#4A90E2" />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        
        {patients.length > 0 && (
          <View style={styles.searchContainer}>
            <Search size={20} color="#757575" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search patients or conditions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9E9E9E"
            />
          </View>
        )}
      </View>

      {patients.length > 0 ? (
        <FlatList
          data={filteredPatients}
          renderItem={({ item }) => (
            <PatientCard
              name={item.name}
              age={item.age}
              gender={item.gender}
              ailments={item.ailments}
              getConditionIcon={getConditionIcon}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.patientsList}
          ListEmptyComponent={
            searchQuery.trim() !== '' ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  No patients found matching "{searchQuery}"
                </Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      {patients.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => setIsModalVisible(true)}
        >
          <UserPlus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <AddPatientModal 
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAddPatient={handleAddPatient}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#333333',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333333',
    height: '100%',
  },
  patientsList: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#333333',
    marginBottom: 10,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 30,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
});