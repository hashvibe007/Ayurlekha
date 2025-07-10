import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleUser as UserCircle, Bell, Shield, CloudUpload, Smartphone, CircleHelp as HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { deleteUser } from '@/lib/supabase';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = React.useState(true);

  const toggleSwitch = (setter: React.Dispatch<React.SetStateAction<boolean>>) => (value: boolean) => {
    setter(value);
  };

  const handleDeleteUser = async () => {
    if (!user?.id) return;
    // Confirm delete
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await deleteUser(user.id);
      alert('Account deleted.');
      signOut();
    } catch (e) {
      alert('Failed to delete account.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F1FF' }]}>
                <UserCircle color="#4A90E2" size={20} />
              </View>
              <Text style={styles.settingText}>Profile</Text>
            </View>
            <ChevronRight color="#9E9E9E" size={20} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF0E6' }]}>
                <Bell color="#FB8C00" size={20} />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#A5C9F6' }}
              thumbColor={notificationsEnabled ? '#4A90E2' : '#F5F5F5'}
              ios_backgroundColor="#E0E0E0"
              onValueChange={toggleSwitch(setNotificationsEnabled)}
              value={notificationsEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Shield color="#4CAF50" size={20} />
              </View>
              <Text style={styles.settingText}>Biometric Authentication</Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#A5C9F6' }}
              thumbColor={biometricEnabled ? '#4A90E2' : '#F5F5F5'}
              ios_backgroundColor="#E0E0E0"
              onValueChange={toggleSwitch(setBiometricEnabled)}
              value={biometricEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F1FF' }]}>
                <Smartphone color="#4A90E2" size={20} />
              </View>
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#A5C9F6' }}
              thumbColor={darkModeEnabled ? '#4A90E2' : '#F5F5F5'}
              ios_backgroundColor="#E0E0E0"
              onValueChange={toggleSwitch(setDarkModeEnabled)}
              value={darkModeEnabled}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}>
                <CloudUpload color="#03A9F4" size={20} />
              </View>
              <Text style={styles.settingText}>Auto Backup</Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#A5C9F6' }}
              thumbColor={autoBackupEnabled ? '#4A90E2' : '#F5F5F5'}
              ios_backgroundColor="#E0E0E0"
              onValueChange={toggleSwitch(setAutoBackupEnabled)}
              value={autoBackupEnabled}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F1FF' }]}>
                <HelpCircle color="#4A90E2" size={20} />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <ChevronRight color="#9E9E9E" size={20} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut color="#E53935" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteUser}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Ayurlekha v1.0.0</Text>
      </ScrollView>
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
    marginBottom: 5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#E53935',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#E53935',
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});