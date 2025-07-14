import React, { useState } from 'react';
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
  const [profileVisible, setProfileVisible] = useState(false);

  const toggleSwitch = (setter: React.Dispatch<React.SetStateAction<boolean>>) => (value: boolean) => {
    setter(value);
  };

  const handleDeleteUser = async () => {
    if (!user?.id) return;
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
      <View style={styles.content}>
        <TouchableOpacity style={styles.settingItem} onPress={() => setProfileVisible(true)}>
          <View style={styles.settingInfo}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F1FF' }]}> 
              <UserCircle color="#4A90E2" size={20} />
            </View>
            <Text style={styles.settingText}>Profile</Text>
          </View>
          <ChevronRight color="#9E9E9E" size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut color="#E53935" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteUser}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Ayurlekha v1.0.0</Text>
      </View>
      {/* Profile Modal */}
      {profileVisible && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 300, alignItems: 'center' }}>
            <UserCircle color="#4A90E2" size={48} style={{ marginBottom: 12 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{user?.name || user?.email || 'User'}</Text>
            <Text style={{ fontSize: 15, color: '#555', marginBottom: 16 }}>{user?.email}</Text>
            <TouchableOpacity onPress={() => setProfileVisible(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: '#4A90E2', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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