import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chrome as Home, Users, FolderOpen, FileText, Settings } from 'lucide-react-native';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, size }) => (
            <FolderOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ayurlekha"
        options={{
          title: 'AyurLekha',
          tabBarIcon: ({ color, size }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}