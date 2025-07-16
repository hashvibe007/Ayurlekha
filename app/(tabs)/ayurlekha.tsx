import React, { useState, useRef, useEffect } from 'react'; // Add useEffect
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, SafeAreaView, Animated, Modal, FlatList } from 'react-native'; // Import Animated
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faShareNodes, faDownload, faQrcode, faSync, faShare, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { usePatientStore, getSelectedPatient } from '@/stores/patientStore';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';

const MedicalSummaryScreen = () => {
  const { user } = useAuth();
  const patients = usePatientStore((state) => state.patients);
  const selectedPatientId = usePatientStore((state) => state.selectedPatientId);
  const setSelectedPatientId = usePatientStore((state) => state.setSelectedPatientId);
  const selectedPatient = getSelectedPatient({ patients, selectedPatientId } as any);
  const [ayurlekhaData, setAyurlekhaData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('History');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user?.id || !selectedPatientId) {
      setAyurlekhaData(null);
      setError(null);
      setLoading(false);
      return;
    }
    const fetchLatestJson = async () => {
      setLoading(true);
      setError(null);
      setAyurlekhaData(null);
      try {
        const folderPath = `Ayurlekha/${user.id}/${selectedPatientId}`;
        console.log('Ayurlekha folderPath:', folderPath); // Log folder path
        const { data, error: listError } = await supabase.storage
          .from('medical-documents')
          .list(folderPath, { limit: 100, offset: 0 });
        if (listError) throw listError;
        if (!data || data.length === 0) {
          setError('No Ayurlekha summary found for this patient.');
          setLoading(false);
          return;
        }
        const ayurlekhaFiles = data.filter(f => f.name.startsWith(`${selectedPatientId}_Ayurlekha_`) && f.name.endsWith('.json'));
        console.log('Ayurlekha files found:', ayurlekhaFiles.map(f => f.name)); // Log file names
        if (ayurlekhaFiles.length === 0) {
          setError('No Ayurlekha summary found for this patient.');
          setLoading(false);
          return;
        }
        ayurlekhaFiles.sort((a, b) => b.name.localeCompare(a.name));
        const latestFile = ayurlekhaFiles[0];
        console.log('Latest Ayurlekha file:', latestFile.name); // Log latest file name
        const filePath = `${folderPath}/${latestFile.name}`;
        console.log('Ayurlekha filePath:', filePath); // Log file path
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('medical-documents')
          .createSignedUrl(filePath, 60 * 5);
        if (urlError || !signedUrlData?.signedUrl) throw urlError || new Error('Failed to get signed URL');
        const resp = await fetch(signedUrlData.signedUrl);
        if (!resp.ok) throw new Error('Failed to fetch JSON file');
        const json = await resp.json();
        console.log('Fetched Ayurlekha JSON:', json); // Log the fetched data
        setAyurlekhaData(json);
      } catch (err: any) {
        console.error('Error loading Ayurlekha summary:', err);
        setError(err?.message || 'Failed to load summary.');
      } finally {
        setLoading(false);
      }
    };
    fetchLatestJson();
  }, [user?.id, selectedPatientId]);

  // Tabs data from JSON
  const tabs = ayurlekhaData ? [
    { id: 'History', label: '📅 History', content: ayurlekhaData.historyTimeline },
    { id: 'Conditions', label: '🩺 Conditions', content: ayurlekhaData.chronicConditions },
    { id: 'Medications', label: '💊 Medications', content: ayurlekhaData.medications },
    ...(ayurlekhaData.labTests ? [{ id: 'LabTests', label: '🧪 Lab Tests', content: ayurlekhaData.labTests }] : []),
  ] : [];

  // FAB animation logic
  const toggleFab = () => {
    const toValue = isFabOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
    setIsFabOpen(!isFabOpen);
  };
  const shareTranslate = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const qrTranslate = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -130] });
  const downloadTranslate = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -190] });

  // Renderers for each tab
  const renderTabContent = (tabId: string) => {
    if (!ayurlekhaData) return null;
    switch (tabId) {
      case 'History':
        return ayurlekhaData.historyTimeline && ayurlekhaData.historyTimeline.length > 0 ? (
          <View>
            {ayurlekhaData.historyTimeline.map((item: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold' }}>{item.date}</Text>
                <Text>{item.event}</Text>
              </View>
            ))}
          </View>
        ) : <Text>No history available.</Text>;
      case 'Conditions':
        return ayurlekhaData.chronicConditions && ayurlekhaData.chronicConditions.length > 0 ? (
          <View>
            {ayurlekhaData.chronicConditions.map((cond: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold' }}>{cond.condition}</Text>
                <Text>Diagnosis Date: {cond.diagnosisDate || 'N/A'}</Text>
              </View>
            ))}
          </View>
        ) : <Text>No conditions available.</Text>;
      case 'Medications':
        return ayurlekhaData.medications && ayurlekhaData.medications.length > 0 ? (
          <View>
            {ayurlekhaData.medications.map((med: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold' }}>{med.name}</Text>
                <Text>Dosage: {med.dosage || 'N/A'}</Text>
              </View>
            ))}
          </View>
        ) : <Text>No medications available.</Text>;
      case 'LabTests':
        return ayurlekhaData.labTests && ayurlekhaData.labTests.length > 0 ? (
          <View>
            {ayurlekhaData.labTests.map((lab: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold' }}>{lab.test}</Text>
                <Text>Frequency: {lab.frequency || 'N/A'}</Text>
              </View>
            ))}
          </View>
        ) : <Text>No lab tests available.</Text>;
      default:
        return null;
    }
  };

  // Patient selection modal
  const renderPatientModal = () => (
    <Modal visible={showPatientModal} animationType="slide" transparent onRequestClose={() => setShowPatientModal(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Select Patient</Text>
          <FlatList
            data={patients}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center' }}
                onPress={() => { setSelectedPatientId(item.id); setShowPatientModal(false); }}
              >
                <FontAwesomeIcon icon={faUser} size={18} color="#4A90E2" style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 16 }}>
                  {item.name}
                  {item.id === selectedPatientId ? <Text style={{ color: '#4A90E2' }}> (Selected)</Text> : null}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text>No patients found.</Text>}
          />
          <TouchableOpacity onPress={() => setShowPatientModal(false)} style={{ marginTop: 16, alignSelf: 'flex-end' }}>
            <Text style={{ color: '#4A90E2', fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* Patient Selector Button */}
        <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faUser} size={18} color="#4A90E2" style={{ marginRight: 8 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
              {selectedPatient ? selectedPatient.name : 'Select Patient'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowPatientModal(true)} style={{ backgroundColor: '#f0f0f0', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 }}>
            <Text style={{ color: '#4A90E2', fontWeight: 'bold' }}>{selectedPatient ? 'Change' : 'Select'}</Text>
          </TouchableOpacity>
        </View>
        {renderPatientModal()}
        {/* If no patient selected, prompt user */}
        {!selectedPatientId ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 16, color: '#888' }}>Please select a patient to view Ayurlekha summary.</Text>
          </View>
        ) : loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 16, color: '#888' }}>Loading summary...</Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 16, color: '#c00' }}>{error}</Text>
          </View>
        ) : ayurlekhaData ? (
          <ScrollView style={styles.scrollViewContent}>
            <View style={styles.prescriptionSlip}>
              {/* Header Section */}
              <View style={[styles.header, { borderRadius: 8, borderWidth: 2, borderColor: '#555', marginHorizontal: 0 }]}> {/* Ensure border is visible */}
                {/* Centrally aligned fixed area for 'Ayurlekha' */}
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 20, letterSpacing: 1 }}>Ayurlekha</Text>
                </View>
                {/* Patient name, age, blood group in a single line */}
                {ayurlekhaData.patient && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                      {ayurlekhaData.patient.name}
                      {ayurlekhaData.patient.age ? ` | ${ayurlekhaData.patient.age} yrs` : ''}
                      {ayurlekhaData.patient.bloodGroup ? ` | ${ayurlekhaData.patient.bloodGroup}` : ''}
                    </Text>
                  </View>
                )}
                {/* Only show summary in header, no redundant patient info */}
                {ayurlekhaData.summary && (
                  <View style={{ paddingVertical: 8 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>Summary</Text>
                    <Text style={{ fontSize: 14 }}>{ayurlekhaData.summary}</Text>
                  </View>
                )}
                <Text style={styles.lastUpdatedText}>Last Updated: {ayurlekhaData.footer?.date || 'N/A'}</Text>
              </View>
              {/* Tab Navigation */}
              <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {tabs.map((tab) => (
                    <TouchableOpacity
                      key={tab.id}
                      style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
                      onPress={() => setActiveTab(tab.id)}
                    >
                      <Text style={[styles.tabButtonText, activeTab === tab.id && styles.activeTabButtonText]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* Tab Content */}
              <View style={styles.tabContent}>
                {renderTabContent(activeTab)}
              </View>
              {/* Doctors & Emergency Contacts */}
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>Doctors & Hospital Information</Text>
                {ayurlekhaData.doctors && ayurlekhaData.doctors.length > 0 ? ayurlekhaData.doctors.map((doc: any, idx: number) => (
                  <Text key={idx} style={{ fontSize: 13 }}>{doc.type}: {doc.name} ({doc.contact})</Text>
                )) : <Text style={{ fontSize: 13 }}>No doctor info.</Text>}
              </View>
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>Emergency Contacts</Text>
                {ayurlekhaData.emergencyContacts && ayurlekhaData.emergencyContacts.length > 0 ? ayurlekhaData.emergencyContacts.map((c: any, idx: number) => (
                  <Text key={idx} style={{ fontSize: 13 }}>{c.name} ({c.relation}): {c.phone}</Text>
                )) : <Text style={{ fontSize: 13 }}>No emergency contacts.</Text>}
              </View>
              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.footerDetails}>
                  <Text style={styles.footerText}><Text style={styles.boldText}>Date:</Text> {ayurlekhaData.footer?.date || 'N/A'}</Text>
                  <Text style={styles.footerText}><Text style={styles.boldText}>Ref:</Text> {ayurlekhaData.patient?.id || 'N/A'}</Text>
                </View>
                <Text style={styles.ayurlekhaSmallText}>
                  Generated by: Ayurlekha App | Not a Medical Document
                </Text>
              </View>
              <Text style={styles.disclaimerText}>
                Disclaimer: {ayurlekhaData.footer?.disclaimer || 'This document is a summary for informational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for any medical concerns.'}
              </Text>
            </View>
          </ScrollView>
        ) : null}
        {/* FAB and Sub-buttons remain unchanged */}
        <View style={styles.fabContainer}>
          <Animated.View style={[styles.fabSubButton, { transform: [{ translateY: downloadTranslate }] }]}> 
            <TouchableOpacity onPress={() => Alert.alert('Download', 'This summary would be downloaded to your device.')} style={styles.fabSubButtonInner}>
              <FontAwesomeIcon icon={faDownload} size={20} color="#000" />
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.fabSubButton, { transform: [{ translateY: qrTranslate }] }]}> 
            <TouchableOpacity onPress={() => Alert.alert('QR Code', 'A QR code for this summary would be generated here.')} style={styles.fabSubButtonInner}>
              <FontAwesomeIcon icon={faQrcode} size={20} color="#000" />
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.fabSubButton, { transform: [{ translateY: shareTranslate }] }]}> 
            <TouchableOpacity onPress={() => Alert.alert('Share', 'This summary would be shared.')} style={styles.fabSubButtonInner}>
              <FontAwesomeIcon icon={faShareNodes} size={20} color="#000" />
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity style={styles.fabButton} onPress={toggleFab}>
            <FontAwesomeIcon icon={faShare} size={30} color="#808080" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  scrollViewContent: {
    flex: 1,
    paddingHorizontal: 10, // Consistent horizontal spacing
    paddingBottom: 100, // Space for FAB
    paddingTop: 10,
  },
  prescriptionSlip: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#555',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginVertical: 10,
    width: '100%', // Ensure full width for border
    maxWidth: 600,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerTitleContainer: {
    alignItems: 'flex-start', // Align title to left
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'serif',
  },
  lastUpdatedText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'serif',
    marginTop: 5, // Space from title
  },
  patientSnapshotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 15,
  },
  patientInfoColumn: {
    flex: 1,
    marginRight: 10,
  },
  vitalsColumn: {
    flex: 1,
    marginLeft: 10,
  },
  patientInfoText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
    fontFamily: 'serif',
  },
  boldText: {
    fontWeight: 'bold',
  },
  snapshotLabel: {
    fontSize: 11,
    color: '#777',
    fontFamily: 'serif',
  },
  amlStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745', // Green for 'In Remission'
    fontFamily: 'serif',
    marginBottom: 8,
  },
  nextTestText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffc107', // Orange for 'Planned'
    fontFamily: 'serif',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 11,
    color: '#dc3545', // Red for alert
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingHorizontal: 10,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#555',
    backgroundColor: '#fff',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'serif',
  },
  activeTabButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 20,
    minHeight: 250,
  },
  footer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
    fontFamily: 'serif',
  },
  ayurlekhaSmallText: {
    fontSize: 10,
    color: '#777',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 10,
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    fontFamily: 'serif',
  },
  // FAB Styles
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  fabButton: {
    backgroundColor: '#000', // Dark gray FAB
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabButtonIcon: {
    fontSize: 30,
    color: '#fff', // White icon
  },
  fabSubButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#777', // Slightly lighter gray for sub-buttons
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 10, // Space between sub-buttons
  },
  fabSubButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabSubButtonIcon: {
    fontSize: 20,
    color: '#fff',
  },
  fabSubButtonText: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'serif',
    marginTop: 2,
  },
});

export default MedicalSummaryScreen;
