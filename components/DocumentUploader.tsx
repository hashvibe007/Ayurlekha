import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, FileText, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { uploadDocument } from '@/lib/supabase';
import { useRecordStore } from '@/stores/recordStore';
import { DocumentTypeSelector } from './DocumentTypeSelector';

interface DocumentUploaderProps {
  patientId: string;
  onUploadComplete: (record: any) => void;
  onUploadError: (error: string) => void;
}

export function DocumentUploader({ 
  patientId, 
  onUploadComplete, 
  onUploadError 
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocumentType, setSelectedDocumentType] = useState('general');
  const { addRecord } = useRecordStore();

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to scan documents.'
        );
        return false;
      }
    }
    return true;
  };

  const handleCameraScan = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Feature Not Available',
          'Camera scanning is not available on web. Please use the upload option instead.'
        );
        return;
      }

      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await handleFileUpload({
          uri: asset.uri,
          name: `${selectedDocumentType}_scan_${Date.now()}.jpg`,
          type: 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Camera scan error:', error);
      onUploadError('Failed to capture document. Please try again.');
    }
  };

  const handleGalleryUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await handleFileUpload({
          uri: asset.uri,
          name: asset.fileName || `${selectedDocumentType}_gallery_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      onUploadError('Failed to upload image. Please try again.');
    }
  };

  const getCategoryFromDocumentType = (documentType: string): string => {
    const categoryMap: { [key: string]: string } = {
      'prescription': 'Prescription',
      'medicine': 'Medicine',
      'laboratory': 'Laboratory',
      'radiology': 'Radiology',
      'cardiology': 'Cardiology',
      'ophthalmology': 'Ophthalmology',
      'neurology': 'Neurology',
      'general': 'General'
    };
    return categoryMap[documentType] || 'General';
  };

  const getTagsFromDocumentType = (documentType: string, fileType: string): string[] => {
    const tags: string[] = [];
    
    // Add file type tag
    if (fileType.startsWith('image/')) tags.push('Image');
    if (fileType === 'application/pdf') tags.push('PDF');
    
    // Add document type specific tags
    switch (documentType) {
      case 'prescription':
        tags.push('Prescription', 'Doctor');
        break;
      case 'medicine':
        tags.push('Medicine', 'Medication');
        break;
      case 'laboratory':
        tags.push('Lab', 'Test', 'Report');
        break;
      case 'radiology':
        tags.push('Scan', 'X-Ray', 'Imaging');
        break;
      case 'cardiology':
        tags.push('Heart', 'Cardio');
        break;
      case 'ophthalmology':
        tags.push('Eye', 'Vision');
        break;
      case 'neurology':
        tags.push('Brain', 'Neuro');
        break;
      default:
        tags.push('Document');
    }
    
    return tags;
  };

  const handleFileUpload = async (file: {
    uri: string;
    name: string;
    type: string;
  }) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('Starting file upload...', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Get category and tags based on selected document type
      const category = getCategoryFromDocumentType(selectedDocumentType);
      const tags = getTagsFromDocumentType(selectedDocumentType, file.type);
      
      console.log('Uploading with category:', category, 'tags:', tags);
      
      // Upload to Supabase
      const record = await uploadDocument(file, patientId, category, tags);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to local store
      addRecord(record);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        onUploadComplete(record);
      }, 500);

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload document. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          errorMessage = 'Upload failed: Please check your connection and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error: Please check your internet connection.';
        } else {
          errorMessage = `Upload failed: ${error.message}`;
        }
      }
      
      onUploadError(errorMessage);
    }
  };

  if (isUploading) {
    return (
      <View style={styles.uploadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.uploadingText}>Uploading {getCategoryFromDocumentType(selectedDocumentType).toLowerCase()}...</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${uploadProgress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{uploadProgress}%</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DocumentTypeSelector 
        selectedType={selectedDocumentType}
        onTypeSelect={setSelectedDocumentType}
      />

      <View style={styles.uploadOptions}>
        <Text style={styles.uploadTitle}>Upload Options</Text>
        
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleCameraScan}
        >
          <LinearGradient
            colors={['#50C878', '#3CB371']}
            style={styles.optionIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Camera color="#FFFFFF" size={24} />
          </LinearGradient>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Scan Document</Text>
            <Text style={styles.optionDescription}>
              {Platform.OS === 'web' 
                ? 'Camera scanning not available on web'
                : 'Use camera to scan a document or prescription'
              }
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleGalleryUpload}
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.optionIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Upload color="#FFFFFF" size={24} />
          </LinearGradient>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Upload from Gallery</Text>
            <Text style={styles.optionDescription}>
              Select an image from your photo gallery
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  uploadOptions: {
    paddingHorizontal: 20,
  },
  uploadTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  uploadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333333',
    marginTop: 16,
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#4A90E2',
  },
});