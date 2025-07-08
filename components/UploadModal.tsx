import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, User, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { usePatientStore } from '@/stores/patientStore';
import { DocumentUploader } from './DocumentUploader';

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export function UploadModal({ visible, onClose }: UploadModalProps) {
  const [animation] = useState(new Animated.Value(0));
  const { patients } = usePatientStore();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  
  React.useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      // Reset state when modal closes
      setSelectedPatient(null);
      setUploadStatus('idle');
      setStatusMessage('');
    }
  }, [visible, animation]);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
  };

  const handleUploadComplete = (record: any) => {
    setUploadStatus('success');
    setStatusMessage(`Document "${record.title}" uploaded successfully!`);
    
    // Auto-close modal after success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleUploadError = (error: string) => {
    setUploadStatus('error');
    setStatusMessage(error);
  };

  const getSelectedPatientName = () => {
    const patient = patients.find(p => p.id === selectedPatient);
    return patient?.name || 'Unknown Patient';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidOverlay]} />
        )}

        <TouchableOpacity 
          style={styles.closeArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            { 
              transform: [{ translateY }],
              opacity 
            }
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Upload Medical Document</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status Messages */}
            {uploadStatus !== 'idle' && (
              <View style={[
                styles.statusContainer,
                uploadStatus === 'success' ? styles.successContainer : styles.errorContainer
              ]}>
                {uploadStatus === 'success' ? (
                  <CheckCircle size={20} color="#4CAF50" />
                ) : (
                  <AlertCircle size={20} color="#E53935" />
                )}
                <Text style={[
                  styles.statusText,
                  uploadStatus === 'success' ? styles.successText : styles.errorText
                ]}>
                  {statusMessage}
                </Text>
              </View>
            )}

            {/* Patient Selection */}
            {patients.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Select Patient</Text>
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.patientsContainer}
                >
                  {patients.map((patient) => (
                    <TouchableOpacity
                      key={patient.id}
                      style={[
                        styles.patientButton,
                        selectedPatient === patient.id && styles.selectedPatient
                      ]}
                      onPress={() => handlePatientSelect(patient.id)}
                    >
                      <View style={[
                        styles.patientIcon,
                        selectedPatient === patient.id && styles.selectedPatientIcon
                      ]}>
                        <User size={24} color={selectedPatient === patient.id ? "#FFFFFF" : "#4A90E2"} />
                      </View>
                      <Text style={[
                        styles.patientName,
                        selectedPatient === patient.id && styles.selectedPatientName
                      ]}>
                        {patient.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {selectedPatient && (
                  <View style={styles.selectedPatientInfo}>
                    <Text style={styles.selectedPatientLabel}>
                      Uploading for: <Text style={styles.selectedPatientValue}>{getSelectedPatientName()}</Text>
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Upload Options */}
            {selectedPatient ? (
              <DocumentUploader
                patientId={selectedPatient}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            ) : patients.length > 0 ? (
              <View style={styles.selectPatientPrompt}>
                <Text style={styles.promptText}>Please select a patient to continue</Text>
              </View>
            ) : (
              <View style={styles.noPatientPrompt}>
                <Text style={styles.promptText}>
                  No patients found. Please add a patient first to upload documents.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
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
  content: {
    maxHeight: '80%',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 20,
    borderRadius: 8,
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successText: {
    color: '#2E7D32',
  },
  errorText: {
    color: '#C62828',
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  patientsContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  patientButton: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  selectedPatient: {
    opacity: 1,
  },
  patientIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPatientIcon: {
    backgroundColor: '#4A90E2',
    borderColor: '#357ABD',
  },
  patientName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  selectedPatientName: {
    color: '#4A90E2',
    fontFamily: 'Inter-SemiBold',
  },
  selectedPatientInfo: {
    backgroundColor: '#E8F1FF',
    padding: 12,
    margin: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  selectedPatientLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#333333',
  },
  selectedPatientValue: {
    fontFamily: 'Inter-SemiBold',
    color: '#4A90E2',
  },
  selectPatientPrompt: {
    padding: 40,
    alignItems: 'center',
  },
  noPatientPrompt: {
    padding: 40,
    alignItems: 'center',
  },
  promptText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
});