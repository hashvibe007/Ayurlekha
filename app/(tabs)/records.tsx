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
  Image,
  Share,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, FileText, BriefcaseMedical as FileMedical, FileImage } from 'lucide-react-native';
import { CategoryTabs } from '@/components/CategoryTabs';
import { useRecordStore } from '@/stores/recordStore';
import { usePatientStore } from '@/stores/patientStore';
import DropDownPicker from 'react-native-dropdown-picker';
import { WebView } from 'react-native-webview';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faShareNodes, faTimes } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { records, isLoading, fetchRecords } = useRecordStore();
  const { patients } = usePatientStore();
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'All', value: 'all' },
    ...patients.map((p) => ({ label: p.name, value: p.id }))
  ]);

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

  const handleRecordPress = async (record: any) => {
    // Get signed URL for the file
    try {
      const filePath = record.file_path || record.file_url?.replace(/^.*medical-documents\//, '');
      const { data, error } = await supabase.storage.from('medical-documents').createSignedUrl(filePath, 60 * 5);
      if (error || !data?.signedUrl) throw error || new Error('Failed to get signed URL');
      setPreviewUrl(data.signedUrl);
      setSelectedRecord(record);
      setViewerVisible(true);
    } catch (e) {
      setPreviewUrl(null);
      setSelectedRecord(record);
      setViewerVisible(true);
    }
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

  // Helper to get overlay info (dummy for now)
  const getOverlayInfo = (record: any) => {
    // In real use, extract from backend; for now, use dummy text based on category
    switch (record.category.toLowerCase()) {
      case 'prescription':
        return 'Dr. Smith • 3 meds • 15 days';
      case 'laboratory':
        return 'Blood Test • Hb: 12.5 • 15/07/24';
      case 'radiology':
        return 'Chest X-Ray • Normal';
      default:
        return 'Document • 2 pages • Uploaded: 2 days ago';
    }
  };

  // Subtle delete handler (to be implemented)
  const handleDelete = (record: any) => {
    // TODO: Implement delete logic (Supabase + DB)
    Alert.alert('Delete', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {/* delete logic */} },
    ]);
  };

  // Share handler (to be implemented)
  const handleShare = (record: any) => {
    // TODO: Implement share logic (download JPG, share)
    Alert.alert('Share', 'Share logic goes here.');
  };

  // Card renderer
  const renderRecordCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.85}
      onPress={() => handleRecordPress(item)}
      onLongPress={() => handleShare(item)}
    >
      <Image
        source={{ uri: item.file_url }}
        style={styles.cardImage}
        blurRadius={2}
      />
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardInfo}>{getOverlayInfo(item)}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleShare(item)} style={styles.actionIcon}>
            <FontAwesomeIcon icon={faShareNodes} size={18} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionIcon}>
            <FontAwesomeIcon icon={faTimes} size={18} color="#B0B0B0" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <DropDownPicker
            open={open}
            value={selectedPatient}
            items={items}
            setOpen={setOpen}
            setValue={setSelectedPatient}
            setItems={setItems}
            containerStyle={{ flex: 1, marginLeft: 10 }}
            style={styles.picker}
            dropDownContainerStyle={{ backgroundColor: '#fff', zIndex: 1000 }}
            placeholder="Select Patient"
            listMode="SCROLLVIEW"
          />
        </View>
      </View>

      <FlatList
        data={filteredRecords}
        renderItem={renderRecordCard}
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
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />
      {/* Document Viewer Modal */}
      <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: width * 0.95, height: height * 0.7, backgroundColor: '#111', borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
            {selectedRecord && previewUrl && selectedRecord.file_type.includes('image') ? (
              <Image source={{ uri: previewUrl }} style={{ width: '100%', height: '85%', resizeMode: 'contain' }} />
            ) : selectedRecord && previewUrl && selectedRecord.file_type.includes('pdf') ? (
              <WebView source={{ uri: previewUrl }} style={{ width: '100%', height: '85%' }} />
            ) : (
              <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Cannot preview this file type.</Text>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 16, backgroundColor: '#111' }}>
              <TouchableOpacity onPress={() => setViewerVisible(false)}>
                <FontAwesomeIcon icon={faTimes} size={22} color="#fff" />
              </TouchableOpacity>
              {selectedRecord && previewUrl && (
                <TouchableOpacity onPress={async () => {
                  try {
                    await Share.share({
                      message: previewUrl,
                      url: previewUrl,
                      title: selectedRecord.title,
                    });
                  } catch (e) {}
                }}>
                  <FontAwesomeIcon icon={faShareNodes} size={22} color="#4A90E2" style={{ marginLeft: 16 }} />
                </TouchableOpacity>
              )}
            </View>
          </View>
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
  cardContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    minHeight: 180,
    maxWidth: (width - 56) / 2, // 20px padding + 8px margin each side
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  cardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
  },
  cardInfo: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionIcon: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});