import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { ChevronRight, User } from 'lucide-react-native';

interface PatientCardProps {
  name: string;
  age: number;
  gender: string;
  ailments?: string[];
  getConditionIcon: (condition: string) => React.ReactNode;
  onPress?: () => void;
}

export function PatientCard({ 
  name, 
  age, 
  gender, 
  ailments = [],
  getConditionIcon,
  onPress
}: PatientCardProps) {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <User size={30} color="#4A90E2" />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.details}>
          {age} years • {gender}
        </Text>
        
        {ailments.length > 0 && (
          <View style={styles.ailmentsContainer}>
            {ailments.map((ailment, index) => (
              <View key={index} style={styles.ailmentTag}>
                {getConditionIcon(ailment)}
                <Text style={styles.ailmentText}>{ailment}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <ChevronRight size={20} color="#9E9E9E" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
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
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 4,
  },
  details: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  ailmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ailmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  ailmentText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#333333',
    marginLeft: 4,
  },
});