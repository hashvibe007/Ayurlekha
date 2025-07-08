import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FileText, Share2, QrCode, Download, Calendar, Tag, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePatientStore } from '@/stores/patientStore';

// Mock data for demonstration
const mockHistory = {
  summary: "Patient has a history of seasonal allergies and occasional migraines. Regular check-ups show stable health with well-managed conditions. Blood pressure and cholesterol levels are within normal ranges.",
  conditions: [
    {
      name: "Seasonal Allergies",
      status: "Active",
      lastUpdated: "2025-03-15",
      details: "Managed with antihistamines during spring season"
    },
    {
      name: "Migraine",
      status: "Managed",
      lastUpdated: "2025-02-20",
      details: "Frequency reduced with preventive medication"
    }
  ],
  medications: [
    {
      name: "Cetirizine",
      dosage: "10mg",
      frequency: "Daily during allergy season"
    },
    {
      name: "Sumatriptan",
      dosage: "50mg",
      frequency: "As needed for migraines"
    }
  ],
  recentVisits: [
    {
      date: "2025-03-15",
      type: "Regular Check-up",
      doctor: "Dr. Sarah Johnson",
      notes: "Patient reported improved allergy symptoms"
    },
    {
      date: "2025-02-20",
      type: "Neurology Consultation",
      doctor: "Dr. Michael Chen",
      notes: "Migraine frequency decreased with current treatment plan"
    }
  ]
};

export default function AyurLekhaScreen() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { patients } = usePatientStore();

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: 'Medical History Report',
        url: Platform.select({
          ios: 'medical-history.pdf',
          default: 'file://medical-history.pdf'
        }),
        title: 'AyurLekha Medical History'
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>AyurLekha</Text>
        <Text style={styles.subtitle}>AI-Generated Medical History</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.patientSection}>
          <Image
            source={{ uri: "https://images.pexels.com/photos/7089629/pexels-photo-7089629.jpeg" }}
            style={styles.patientImage}
            contentFit="cover"
          />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>John Doe</Text>
            <Text style={styles.patientDetails}>42 years • Male</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FileText color="#FFFFFF" size={24} style={styles.summaryIcon} />
            <Text style={styles.summaryTitle}>Health Summary</Text>
            <Text style={styles.summaryText}>{mockHistory.summary}</Text>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Conditions</Text>
          {mockHistory.conditions.map((condition, index) => (
            <View key={index} style={styles.conditionCard}>
              <View style={styles.conditionHeader}>
                <Text style={styles.conditionName}>{condition.name}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: condition.status === 'Active' ? '#FFE4E4' : '#E8F5E9' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: condition.status === 'Active' ? '#E53935' : '#4CAF50' }
                  ]}>{condition.status}</Text>
                </View>
              </View>
              <Text style={styles.conditionDetails}>{condition.details}</Text>
              <View style={styles.conditionFooter}>
                <Calendar size={14} color="#757575" />
                <Text style={styles.dateText}>Last updated: {condition.lastUpdated}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Medications</Text>
          {mockHistory.medications.map((medication, index) => (
            <View key={index} style={styles.medicationCard}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationDetails}>
                {medication.dosage} • {medication.frequency}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Medical Visits</Text>
          {mockHistory.recentVisits.map((visit, index) => (
            <View key={index} style={styles.visitCard}>
              <View style={styles.visitHeader}>
                <Text style={styles.visitType}>{visit.type}</Text>
                <Text style={styles.visitDate}>{visit.date}</Text>
              </View>
              <Text style={styles.doctorName}>{visit.doctor}</Text>
              <Text style={styles.visitNotes}>{visit.notes}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={20} color="#4A90E2" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <QrCode size={20} color="#4A90E2" />
          <Text style={styles.actionText}>QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Download size={20} color="#4A90E2" />
          <Text style={styles.actionText}>Download</Text>
        </TouchableOpacity>
      </View>
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
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#757575',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  patientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  patientImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333333',
  },
  patientDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryIcon: {
    marginBottom: 12,
  },
  summaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  summaryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    opacity: 0.9,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 12,
  },
  conditionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  conditionDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  conditionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  medicationName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  medicationDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitType: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333333',
  },
  visitDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
  },
  doctorName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 4,
  },
  visitNotes: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 4,
  },
});