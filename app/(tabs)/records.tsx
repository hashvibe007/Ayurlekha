import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Modal,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, FileText, BriefcaseMedical as FileMedical, FileImage } from 'lucide-react-native';
import { RecordCard } from '@/components/RecordCard';
import { CategoryTabs } from '@/components/CategoryTabs';
import { useRecordStore } from '@/stores/recordStore';
import { usePatientStore } from '@/stores/patientStore';
import { Picker } from '@react-native-picker/picker';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const categories = [
  { id: 'all', name: 'All' },
  { id: 'laboratory', name: 'Laboratory' },
  { id: 'radiology', name: 'Radiology' },
  { id: 'prescription', name: 'Prescription' },
  { id: 'scan', name: 'Scan' },
  { id: 'document', name: 'Document' },
  { id: 'general', name: 'General' },
];

export default function RecordsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  
  const { records, isLoading, fetchRecords } = useRecordStore();
  const { patients } = usePatientStore();
  const [selectedPatient, setSelectedPatient] = useState<string>('all');

  useEffect(() => {
    fetchRecords(selectedPatient !== 'all' ? selectedPatient : undefined);
  }, [selectedPatient]);

  useEffect(() => {
    // Filter records based on search and category
    let filtered = records;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(record => 
        record.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.title.toLowerCase().includes(query) ||
        record.category.toLowerCase().includes(query) ||
        record.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredRecords(filtered);
  }, [records, searchQuery, selectedCategory]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  };

  const handleRecordPress = (record: any) => {
    setSelectedRecord(record);
    setViewerVisible(true);
  };

  const getIconForFileType = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileMedical size={24} color="#E53935" />;
    } else if (fileType.includes('image')) {
      return <FileImage size={24} color="#4CAF50" />;
    } else {
      return <FileText size={24} color="#4A90E2" />;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FileText size={64} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>
        {searchQuery.trim() !== '' ? 'No Records Found' : 'No Medical Records'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery.trim() !== '' 
          ? `No records found matching "${searchQuery}"`
          : 'Upload your first medical document to get started.'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Medical Records</Text>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#757575" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search records, categories or tags..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9E9E9E"
          />
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        <CategoryTabs 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Patient:</Text>
          <Picker
            selectedValue={selectedPatient}
            onValueChange={setSelectedPatient}
            style={styles.picker}
          >
            <Picker.Item label="All" value="all" />
            {patients.map((p) => (
              <Picker.Item key={p.id} label={p.name} value={p.id} />
            ))}
          </Picker>
        </View>
      </View>

      <FlatList
        data={filteredRecords}
        renderItem={({ item }) => (
          <RecordCard 
            title={item.title}
            date={new Date(item.created_at).toLocaleDateString()}
            category={item.category}
            patientName={patients.find(p => p.id === item.patient_id)?.name || 'Unknown'}
            tags={item.tags}
            imageUrl={item.file_url}
            icon={getIconForFileType(item.file_type)}
            onPress={() => handleRecordPress(item)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.recordsList}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
            tintColor="#4A90E2"
          />
        }
      />
      {/* Document Viewer Modal */}
      <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity style={{ padding: 16, alignSelf: 'flex-end' }} onPress={() => setViewerVisible(false)}>
            <Text style={{ color: '#fff', fontSize: 18 }}>Close</Text>
          </TouchableOpacity>
          {selectedRecord && selectedRecord.file_type.includes('image') ? (
            <Image source={{ uri: selectedRecord.file_url }} style={{ flex: 1, resizeMode: 'contain' }} />
          ) : selectedRecord && selectedRecord.file_type.includes('pdf') ? (
            <WebView source={{ uri: selectedRecord.file_url }} style={{ flex: 1 }} />
          ) : (
            <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Cannot preview this file type.</Text>
          )}
        </SafeAreaView>
      </Modal>
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
  filterButton: {
    padding: 5,
  },
  filterRow: {
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
  filterLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333333',
    marginRight: 10,
  },
  picker: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333333',
    height: '100%',
  },
  recordsList: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    padding: 20,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    maxWidth: '80%',
  },
});