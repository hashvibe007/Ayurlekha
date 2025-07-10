import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { Calendar, User, Tag } from 'lucide-react-native';

interface RecordCardProps {
  title: string;
  date: string;
  category: string;
  patientName: string;
  tags: string[];
  imageUrl: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');

const getCategoryColor = (category: string): string => {
  const colorMap: { [key: string]: string } = {
    'Prescription': '#4A90E2',
    'Medicine': '#50C878',
    'Laboratory': '#FF6B35',
    'Radiology': '#9C27B0',
    'Cardiology': '#E53935',
    'Ophthalmology': '#00BCD4',
    'Neurology': '#795548',
    'General': '#757575',
    'Scan': '#9C27B0',
    'Document': '#757575'
  };
  return colorMap[category] || '#757575';
};

export function RecordCard({ 
  title, 
  date, 
  category, 
  patientName, 
  tags, 
  imageUrl,
  icon,
  onPress
}: RecordCardProps) {
  const categoryColor = getCategoryColor(category);

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.fileIconContainer}>
          {icon}
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Calendar size={14} color="#757575" style={styles.icon} />
            <Text style={styles.detailText}>{date}</Text>
          </View>
          <View style={styles.detailItem}>
            <User size={14} color="#757575" style={styles.icon} />
            <Text style={styles.detailText}>{patientName}</Text>
          </View>
        </View>
        
        <View style={styles.tagsRow}>
          <View style={[styles.categoryTag, { backgroundColor: `${categoryColor}15` }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>{category}</Text>
          </View>
          {tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {tags.length > 2 && (
            <View style={styles.moreTagsIndicator}>
              <Text style={styles.moreTagsText}>+{tags.length - 2}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  fileIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    marginRight: 4,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#757575',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#757575',
  },
  moreTagsIndicator: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  moreTagsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: '#757575',
  },
});