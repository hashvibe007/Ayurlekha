import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

const typeBackgrounds: Record<string, any> = {
  laboratory: require('@/assets/images/lab-bg.jpg'),
  radiology: require('@/assets/images/radiology-bg.jpg'),
  prescription: require('@/assets/images/prescription-bg.jpg'),
  scan: require('@/assets/images/scan-bg.jpg'),
  document: require('@/assets/images/document-bg.jpg'),
  general: require('@/assets/images/general-bg.jpg'),
  default: require('@/assets/images/default-bg.jpg'),
};

export const RecentCard = ({ title, date, category, patientName, imageUrl }) => {
  const bgImage = typeBackgrounds[category?.toLowerCase()] || typeBackgrounds.default;
  return (
    <ImageBackground source={bgImage} style={styles.card} imageStyle={{ borderRadius: 12, opacity: 0.25 }}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.patientName}>{patientName}</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 180,
    height: 120,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  category: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 2,
  },
  patientName: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});