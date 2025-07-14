import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Plus, Camera, Upload, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { usePatientStore } from '@/stores/patientStore';
import { useRecordStore } from '@/stores/recordStore';
import { UploadModal } from '@/components/UploadModal';
import { RecentCard } from '@/components/RecentCard';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { patients } = usePatientStore();
  const { records } = useRecordStore();
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Ayurlekha</Text>
          <Text style={styles.subtitle}>Your Medical Records, Simplified</Text>
        </View>

        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#4A90E2', '#5F9DE9']}
            style={styles.statsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.statsContent}>
              <Text style={styles.statsTitle}>
                {patients.length > 0 ? patients.length : 'No'}
              </Text>
              <Text style={styles.statsLabel}>
                {patients.length === 1 ? 'Patient' : 'Patients'}
              </Text>
            </View>
            <View style={styles.statsContent}>
              <Text style={styles.statsTitle}>{records.length}</Text>
              <Text style={styles.statsLabel}>Records</Text>
            </View>
            <View style={styles.statsContent}>
              <Text style={styles.statsTitle}>0</Text>
              <Text style={styles.statsLabel}>Reports</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity
                style={styles.actionButton}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => setModalVisible(true)}
              >
                <LinearGradient
                  colors={['#50C878', '#3CB371']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Camera color="#FFFFFF" size={24} />
                </LinearGradient>
                <Text style={styles.actionText}>Scan Document</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity
                style={styles.actionButton}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => setModalVisible(true)}
              >
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Upload color="#FFFFFF" size={24} />
                </LinearGradient>
                <Text style={styles.actionText}>Upload Document</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Records</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScrollView}
          >
            {records.length > 0 ? (
              records.slice(0, 5).map((record, index) => (
                <RecentCard 
                  key={record.id}
                  title={record.title}
                  date={new Date(record.created_at).toLocaleDateString()}
                  category={record.category}
                  patientName="Patient"
                  imageUrl={record.file_url}
                />
              ))
            ) : (
              <>
                <RecentCard 
                  title="Blood Test"
                  date="May 10, 2025"
                  category="Laboratory"
                  patientName="John Doe"
                  imageUrl="https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                />
                <RecentCard 
                  title="X-Ray Report"
                  date="Apr 23, 2025"
                  category="Radiology"
                  patientName="Jane Doe"
                  imageUrl="https://images.pexels.com/photos/7446144/pexels-photo-7446144.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                />
              </>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      <UploadModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContent: {
    paddingBottom: 90,
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
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statsContent: {
    alignItems: 'center',
  },
  statsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: '#FFFFFF',
  },
  statsLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: (width - 50) / 2,
  },
  actionGradient: {
    width: 55,
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  actionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333333',
  },
  recentSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  recentScrollView: {
    paddingRight: 20,
  },
});