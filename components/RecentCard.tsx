import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { Calendar, Tag } from 'lucide-react-native';

interface RecentCardProps {
  title: string;
  date: string;
  category: string;
  patientName: string;
  imageUrl: string;
}

const { width } = Dimensions.get('window');
const cardWidth = width * 0.7;

export function RecentCard({ title, date, category, patientName, imageUrl }: RecentCardProps) {
  return (
    <TouchableOpacity style={styles.cardContainer}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.overlay} />
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Calendar size={14} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.detailText}>{date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Tag size={14} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.detailText}>{category}</Text>
          </View>
        </View>
        <View style={styles.patientContainer}>
          <Text style={styles.patientText}>{patientName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: cardWidth,
    height: 180,
    borderRadius: 16,
    marginRight: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  detailText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  patientContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  patientText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
});