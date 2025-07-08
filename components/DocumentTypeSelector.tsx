import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { 
  Stethoscope, 
  Pill, 
  FlaskConical as TestTube, 
  Scan, 
  FileText,
  Heart,
  Eye,
  Brain
} from 'lucide-react-native';

interface DocumentType {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
}

interface DocumentTypeSelectorProps {
  selectedType: string;
  onTypeSelect: (typeId: string) => void;
}

const documentTypes: DocumentType[] = [
  {
    id: 'prescription',
    name: 'Doctor Prescription',
    icon: <Stethoscope size={24} color="#FFFFFF" />,
    color: '#4A90E2',
    backgroundColor: '#E8F1FF'
  },
  {
    id: 'medicine',
    name: 'Medicine',
    icon: <Pill size={24} color="#FFFFFF" />,
    color: '#50C878',
    backgroundColor: '#E8F5E9'
  },
  {
    id: 'laboratory',
    name: 'Lab Report',
    icon: <TestTube size={24} color="#FFFFFF" />,
    color: '#FF6B35',
    backgroundColor: '#FFF0E6'
  },
  {
    id: 'radiology',
    name: 'Medical Scan',
    icon: <Scan size={24} color="#FFFFFF" />,
    color: '#9C27B0',
    backgroundColor: '#F3E5F5'
  },
  {
    id: 'cardiology',
    name: 'Heart Report',
    icon: <Heart size={24} color="#FFFFFF" />,
    color: '#E53935',
    backgroundColor: '#FFEBEE'
  },
  {
    id: 'ophthalmology',
    name: 'Eye Report',
    icon: <Eye size={24} color="#FFFFFF" />,
    color: '#00BCD4',
    backgroundColor: '#E0F2F1'
  },
  {
    id: 'neurology',
    name: 'Neuro Report',
    icon: <Brain size={24} color="#FFFFFF" />,
    color: '#795548',
    backgroundColor: '#EFEBE9'
  },
  {
    id: 'general',
    name: 'General Document',
    icon: <FileText size={24} color="#FFFFFF" />,
    color: '#757575',
    backgroundColor: '#F5F5F5'
  }
];

export function DocumentTypeSelector({ selectedType, onTypeSelect }: DocumentTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Document Type</Text>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typesContainer}
      >
        {documentTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeButton,
              selectedType === type.id && styles.selectedTypeButton
            ]}
            onPress={() => onTypeSelect(type.id)}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: selectedType === type.id ? type.color : type.backgroundColor }
            ]}>
              {React.cloneElement(type.icon as React.ReactElement, {
                color: selectedType === type.id ? '#FFFFFF' : type.color
              })}
            </View>
            <Text style={[
              styles.typeName,
              selectedType === type.id && styles.selectedTypeName
            ]}>
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  typesContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  typeButton: {
    alignItems: 'center',
    marginRight: 16,
    width: 90,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTypeButton: {
    backgroundColor: '#E8F1FF',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedTypeName: {
    color: '#4A90E2',
    fontFamily: 'Inter-SemiBold',
  },
});