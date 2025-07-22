import React, { createContext, useContext, useEffect, useState } from 'react';
import { router, useSegments } from 'expo-router';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { usePatientStore } from '@/stores/patientStore';
import { useRecordStore } from '@/stores/recordStore';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      setUser(session?.user ?? null);
      setIsLoading(false);
    }).catch((error) => {
      console.error('Error in getSession:', error);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Only handle navigation on native platforms or when ready
    if (Platform.OS !== 'web' && typeof window === 'undefined') {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  useEffect(() => {
    if (user?.id) {
      usePatientStore.getState().fetchPatients(user.id);
    }
  }, [user?.id]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      // Clear local cache for privacy
      usePatientStore.getState().clearPatients();
      useRecordStore.getState().clearRecords();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}