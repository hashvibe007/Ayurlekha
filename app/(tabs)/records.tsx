import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  SafeAreaView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Search, X, ChevronDown, Share2, Eye, Calendar, User, FileText, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Clock, ChevronLeft, Heart, Download } from 'lucide-react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faShareNodes, faTimes, faUser, faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useRecordStore } from '@/stores/recordStore';
import { usePatientStore } from '@/stores/patientStore';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

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
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [documentImageUrl, setDocumentImageUrl] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  
  const { records, isLoading, fetchRecords } = useRecordStore();
  const { patients } = usePatientStore();
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [recordsWithMetadata, setRecordsWithMetadata] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingMeta(true);
      await fetchRecords(selectedPatient !== 'all' ? selectedPatient : undefined);
    };
    fetchAll();
  }, [selectedPatient]);

  useEffect(() => {
    // Only run when records change (after fetchRecords)
    const fetchMetadataForRecords = async () => {
      setLoadingMeta(true);
      const updated = await Promise.all(records.map(async (rec) => {
        try {
          // Parse storage path from file_url
          const urlPrefix = '/storage/v1/object/public/medical-documents/';
          const idx = rec.file_url.indexOf(urlPrefix);
          let storagePath = '';
          if (idx !== -1) {
            storagePath = rec.file_url.substring(idx + urlPrefix.length);
          }
          if (!storagePath) {
            console.log('Could not parse storage path for', rec.file_url);
            return { ...rec, _meta: null };
          }
          const metaPath = storagePath.replace(/(\.[^.]+)$/, '_metadata.json');
          const { data, error } = await supabase.storage.from('medical-documents').createSignedUrl(metaPath, 60 * 5);
          if (error || !data?.signedUrl) {
            console.log('No metadata for', metaPath);
            return { ...rec, _meta: null };
          }
          const resp = await fetch(data.signedUrl);
          if (!resp.ok) {
            console.log('Failed to fetch metadata for', metaPath);
            return { ...rec, _meta: null };
          }
          const meta = await resp.json();
          console.log('Fetched metadata for', metaPath, meta);
          return { ...rec, _meta: meta };
        } catch (e) {
          console.log('Error fetching metadata for', rec.file_url, e);
          return { ...rec, _meta: null };
        }
      }));
      console.log('Final records with metadata:', updated);
      setRecordsWithMetadata(updated);
      setLoadingMeta(false);
    };
    if (records && records.length > 0) {
      fetchMetadataForRecords();
    } else {
      setRecordsWithMetadata([]);
      setLoadingMeta(false);
    }
  }, [records]);

  useEffect(() => {
    // Filter records based on search and category
    let filtered = recordsWithMetadata;

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
  }, [recordsWithMetadata, searchQuery, selectedCategory]);

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
    // Prevent multiple clicks
    if (loadingCardId) return;
    
    setLoadingCardId(record.id);
    setSelectedRecord(record);
    setLoadingDocument(true);
    
    try {
      // Get signed URL for the document image
      const filePath = record.file_path || record.file_url?.replace(/^.*medical-documents\//, '');
      const { data, error } = await supabase.storage.from('medical-documents').createSignedUrl(filePath, 60 * 5);
      if (error || !data?.signedUrl) throw error || new Error('Failed to get signed URL');
      setDocumentImageUrl(data.signedUrl);
    } catch (e) {
      console.error('Error loading document image:', e);
      setDocumentImageUrl(null);
    } finally {
      setLoadingDocument(false);
      setLoadingCardId(null);
      setDetailModalVisible(true);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'reviewed': return <CheckCircle size={14} color="#10B981" />;
      case 'pending': return <Clock size={14} color="#F59E0B" />;
      case 'flagged': return <AlertCircle size={14} color="#EF4444" />;
      default: return <FileText size={14} color="#6B7280" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'laboratory': return '#8B5CF6';
      case 'radiology': return '#06B6D4';
      case 'prescription': return '#10B981';
      case 'consultation': return '#F59E0B';
      case 'scan': return '#EC4899';
      case 'document': return '#6366F1';
      default: return '#6B7280';
    }
  };

  const renderGridItem = ({ item, index }: { item: any; index: number }) => {
    const meta = item._meta;
    const title = meta?.intelligent_name || item.title;
    const category = meta?.category || item.category;
    const date = meta?.date || new Date(item.created_at).toLocaleDateString();
    const keyFinding = meta?.insights && meta.insights.length > 0 ? meta.insights[0] : (meta?.urgency || 'Document');
    const status = meta?.status || 'pending';
    const urgency = meta?.urgency || 'low';
    const isLoading = loadingCardId === item.id;

    return (
      <TouchableOpacity 
        style={[
          styles.gridCard, 
          { marginLeft: index % 2 === 0 ? 0 : 8 },
          isLoading && styles.gridCardLoading
        ]}
        activeOpacity={isLoading ? 1 : 0.95}
        onPress={() => !isLoading && handleRecordPress(item)}
        disabled={isLoading}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: item.file_url }} style={styles.thumbnail} />
          <View style={styles.overlay}>
            <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
            <View style={styles.statusBadge}>
              {getStatusIcon(status)}
            </View>
            <View style={[styles.urgencyIndicator, { backgroundColor: getUrgencyColor(urgency) }]} />
          </View>
          
          {/* Loading Overlay */}
          {isLoading && (
            <View style={styles.cardLoadingOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.cardLoadingText}>Loading...</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.gridCardType}>{category}</Text>
          <Text style={styles.gridCardDate}>{date}</Text>
          
          {/* Key Finding Preview */}
          <View style={styles.previewChip}>
            <Text style={styles.previewText} numberOfLines={1}>
              {keyFinding}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const DetailModal = () => {
    if (!selectedRecord) return null;

    const meta = selectedRecord._meta;
    const title = meta?.intelligent_name || selectedRecord.title;
    const category = meta?.category || selectedRecord.category;
    const date = meta?.date || new Date(selectedRecord.created_at).toLocaleDateString();
    const doctor = meta?.doctor || 'Dr. Unknown';
    const specialty = meta?.specialty || category;
    const summary = meta?.summary || 'No summary available';
    const insights = meta?.insights || [];
    const keyFindings = meta?.key_findings || [];

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setDetailModalVisible(false)}
            >
              <X size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalActionButton}>
                <Share2 size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Hero Image */}
            <View style={styles.heroImageContainer}>
              {loadingDocument ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading document...</Text>
                </View>
              ) : documentImageUrl ? (
                <Image source={{ uri: documentImageUrl }} style={styles.heroImage} />
              ) : (
                <View style={styles.noImageContainer}>
                  <FileText size={64} color="#9CA3AF" />
                  <Text style={styles.noImageText}>Document preview not available</Text>
                </View>
              )}
              <View style={styles.heroOverlay}>
                <View style={[styles.heroCategory, { backgroundColor: getCategoryColor(category) }]}>
                  <Text style={styles.heroCategoryText}>{category}</Text>
                </View>
              </View>
            </View>
            
            {/* Content */}
            <View style={styles.modalContentSection}>
              <Text style={styles.heroTitle}>{title}</Text>
              <Text style={styles.heroSubtitle}>{category}</Text>
              
              <View style={styles.heroMeta}>
                <Text style={styles.heroDate}>{date}</Text>
                <Text style={styles.heroDoctor}>By {doctor}</Text>
                <View style={styles.tagContainer}>
                  <Text style={styles.tag}>#{category.toLowerCase()}</Text>
                  <Text style={styles.tag}>#{specialty.toLowerCase()}</Text>
                  <Text style={styles.tag}>#{selectedRecord.file_type?.toLowerCase().replace(' ', '')}</Text>
                </View>
              </View>

              <Text style={styles.summaryText}>{summary}</Text>

              {/* Key Findings */}
              {keyFindings.length > 0 && (
                <View style={styles.findingsSection}>
                  <Text style={styles.sectionTitle}>Key Findings</Text>
                  <View style={styles.findingsGrid}>
                    {keyFindings.map((finding: string, index: number) => (
                      <View key={index} style={styles.findingChip}>
                        <Text style={styles.findingText}>{finding}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* AI Insights */}
              {insights.length > 0 && (
                <View style={styles.insightsSection}>
                  <Text style={styles.sectionTitle}>AI Insights</Text>
                  {insights.map((insight: string, index: number) => (
                    <View key={index} style={styles.insightItem}>
                      <View style={styles.insightBullet} />
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionsSection}>
                <TouchableOpacity style={styles.primaryAction}>
                  <Text style={styles.primaryActionText}>Add to Favorites</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction}>
                  <Text style={styles.secondaryActionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
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
      
      {/* Minimal Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.patientSelector}
            onPress={() => setShowPatientModal(true)}
          >
            <FontAwesomeIcon icon={faUser} size={16} color="#3B82F6" />
            <Text style={styles.patientText}>
              {selectedPatient === 'all' ? 'All' : (patients.find(p => p.id === selectedPatient)?.name.split(' ')[0] || 'Unknown')}
            </Text>
            <FontAwesomeIcon icon={faChevronDown} size={14} color="#3B82F6" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.searchIcon}
            onPress={() => setIsSearchExpanded(!isSearchExpanded)}
          >
            <FontAwesomeIcon icon={faSearch} size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Expandable Search */}
        {isSearchExpanded && (
          <View style={styles.expandedSearch}>
            <View style={styles.searchBar}>
              <FontAwesomeIcon icon={faSearch} size={16} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search records, categories or tag..."
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
              <TouchableOpacity onPress={() => setIsSearchExpanded(false)}>
                <FontAwesomeIcon icon={faTimes} size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Patient Dropdown */}
        {showPatientModal && (
          <Modal visible={showPatientModal} animationType="slide" transparent onRequestClose={() => setShowPatientModal(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.patientModal}>
                <Text style={styles.modalTitle}>Select Patient</Text>
                <FlatList
                  data={[{ id: 'all', name: 'All' }, ...patients]}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.patientItem}
                      onPress={() => { setSelectedPatient(item.id); setShowPatientModal(false); }}
                    >
                      <FontAwesomeIcon icon={faUser} size={18} color="#4A90E2" style={{ marginRight: 10 }} />
                      <Text style={styles.patientItemText}>
                        {item.name}
                        {item.id === selectedPatient ? <Text style={{ color: '#4A90E2' }}> (Selected)</Text> : null}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text>No patients found.</Text>}
                />
                <TouchableOpacity onPress={() => setShowPatientModal(false)} style={styles.closeModalButton}>
                  <Text style={styles.closeModalText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>

      {/* Grid View */}
      {loadingMeta ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          renderItem={renderGridItem}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A90E2']}
              tintColor="#4A90E2"
            />
          }
        />
      )}

      {/* Detail Modal */}
      <DetailModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  patientText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  searchIcon: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  expandedSearch: {
    gap: 12,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  patientItemText: {
    fontSize: 16,
  },
  closeModalButton: {
    alignSelf: 'flex-end',
    marginTop: 16,
  },
  closeModalText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  gridContainer: {
    padding: 16,
  },
  gridCard: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridCardLoading: {
    opacity: 0.7,
  },
  thumbnailContainer: {
    height: 140,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  categoryDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  urgencyIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gridCardContent: {
    padding: 12,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
    lineHeight: 18,
  },
  gridCardType: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  gridCardDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  previewChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  previewText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E40AF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    maxWidth: '80%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(248,250,252,0.9)',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(248,250,252,0.9)',
  },
  modalContent: {
    flex: 1,
  },
  heroImageContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroCategoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContentSection: {
    padding: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
  },
  heroMeta: {
    marginBottom: 20,
  },
  heroDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  heroDoctor: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
    marginBottom: 24,
  },
  findingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  findingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  findingChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  findingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  insightsSection: {
    marginBottom: 32,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginTop: 8,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 40,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryAction: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
  },
  noImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  cardLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  cardLoadingText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
  },
});