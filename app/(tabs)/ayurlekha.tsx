import React, { useState, useRef, useEffect } from 'react'; // Add useEffect
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, SafeAreaView, Animated } from 'react-native'; // Import Animated
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faShareNodes, faDownload, faQrcode, faSync, faShare } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { usePatientStore } from '@/stores/patientStore';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';

const MedicalSummaryScreen = () => {
  const { user } = useAuth();
  const { patients } = usePatientStore();
  const [selectedPatient, setSelectedPatient] = useState<string>(patients[0]?.id || '');
  const [ayurlekhaData, setAyurlekhaData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('History');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchLatestJson = async () => {
      if (!user?.id || !selectedPatient) {
        setAyurlekhaData(null);
        setError('No patient selected.');
        return;
      }
      setLoading(true);
      setError(null);
      setAyurlekhaData(null);
      try {
        const folderPath = `Ayurlekha/${user.id}/${selectedPatient}`;
        const { data, error: listError } = await supabase.storage
          .from('medical-documents')
          .list(folderPath, { limit: 100, offset: 0 });
        if (listError) throw listError;
        if (!data || data.length === 0) {
          setError('No Ayurlekha summary found for this patient.');
          setLoading(false);
          return;
        }
        // Filter for JSON files by naming convention
        const ayurlekhaFiles = data.filter(f => f.name.startsWith(`${selectedPatient}_Ayurlekha_`) && f.name.endsWith('.json'));
        if (ayurlekhaFiles.length === 0) {
          setError('No Ayurlekha summary found for this patient.');
          setLoading(false);
          return;
        }
        ayurlekhaFiles.sort((a, b) => b.name.localeCompare(a.name));
        const latestFile = ayurlekhaFiles[0];
        const filePath = `${folderPath}/${latestFile.name}`;
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('medical-documents')
          .createSignedUrl(filePath, 60 * 5);
        if (urlError || !signedUrlData?.signedUrl) throw urlError || new Error('Failed to get signed URL');
        const resp = await fetch(signedUrlData.signedUrl);
        if (!resp.ok) throw new Error('Failed to fetch JSON file');
        const json = await resp.json();
        setAyurlekhaData(json);
      } catch (err: any) {
        setError(err?.message || 'Failed to load summary.');
      } finally {
        setLoading(false);
      }
    };
    fetchLatestJson();
  }, [user?.id, selectedPatient]);

  // Tabs data from JSON
  const tabs = ayurlekhaData ? [
    { id: 'History', label: '📅 History', content: ayurlekhaData.historyTimeline },
    { id: 'Conditions', label: '🩺 Conditions', content: ayurlekhaData.chronicConditions },
    { id: 'Medications', label: '💊 Medications', content: ayurlekhaData.medications },
    { id: 'LabTests', label: '🧪 Lab Tests', content: ayurlekhaData.labTests },
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
                <Text style={{ fontWeight: 'bold' }}>{cond.name}</Text>
                <Text>Status: {cond.status} | Since: {cond.since}</Text>
                <Text>Notes: {cond.notes}</Text>
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
                <Text>Dosage: {med.dosage} | Frequency: {med.frequency}</Text>
                <Text>Indication: {med.indication}</Text>
              </View>
            ))}
          </View>
        ) : <Text>No medications available.</Text>;
      case 'LabTests':
        return ayurlekhaData.labTests && ayurlekhaData.labTests.length > 0 ? (
          <View>
            {ayurlekhaData.labTests.map((lab: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold' }}>{lab.date} - {lab.investigation}</Text>
                <Text>Result: {lab.result}</Text>
              </View>
            ))}
          </View>
        ) : <Text>No lab tests available.</Text>;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* Patient Picker */}
        <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Select Patient:</Text>
          <Picker
            selectedValue={selectedPatient}
            onValueChange={setSelectedPatient}
            style={{ backgroundColor: '#f8f8f8', borderRadius: 8 }}
          >
            {patients.map((p) => (
              <Picker.Item key={p.id} label={p.name} value={p.id} />
            ))}
          </Picker>
        </View>
        {/* Loading/Error State */}
        {loading ? (
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
              <View style={styles.header}>
                <View style={styles.headerTop}>
                  <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Patient Medical Record</Text>
                    <Text style={styles.lastUpdatedText}>Last Updated: {ayurlekhaData.footer?.date || 'N/A'}</Text>
                  </View>
                </View>
                {/* Patient Demographics & Snapshot in Header */}
                <View style={styles.patientSnapshotContainer}>
                  <View style={styles.patientInfoColumn}>
                    <Text style={styles.patientInfoText}><Text style={styles.boldText}>Patient:</Text> {ayurlekhaData.patient?.name || 'N/A'}</Text>
                    <Text style={styles.patientInfoText}><Text style={styles.boldText}>DOB:</Text> {ayurlekhaData.patient?.dob || 'N/A'} (Age: {ayurlekhaData.patient?.age || 'N/A'})</Text>
                    <Text style={styles.patientInfoText}><Text style={styles.boldText}>Blood Group:</Text> {ayurlekhaData.patient?.bloodGroup || 'N/A'}</Text>
                  </View>
                  <View style={styles.vitalsColumn}>
                    <Text style={styles.snapshotLabel}>Primary Condition Status:</Text>
                    <Text style={styles.amlStatusText}>{ayurlekhaData.primaryAlert?.alert || 'N/A'}</Text>
                    <Text style={styles.snapshotLabel}>Next Action/Test:</Text>
                    <Text style={styles.nextTestText}>{ayurlekhaData.labTests?.find((l: any) => l.result?.toLowerCase().includes('planned'))?.investigation || 'None'}</Text>
                    <Text style={styles.alertText}>
                      ⚠️ ALERT: {ayurlekhaData.primaryAlert?.specialCare || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
              {/* Summary Section */}
              {ayurlekhaData.summary && (
                <View style={{ padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, margin: 16 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>Summary</Text>
                  <Text style={{ fontSize: 14 }}>{ayurlekhaData.summary}</Text>
                </View>
              )}
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
    padding: 10, // Padding around the slip
    paddingBottom: 100, // Increased padding to make space for the FAB
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
    alignSelf: 'center',
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
