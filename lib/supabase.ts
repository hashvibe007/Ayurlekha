import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Official reference: https://supabase.com/blog/react-native-storage
// Docs: https://supabase.com/docs/guides/storage/uploads/standard-uploads

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: AsyncStorage }
});

export interface MedicalRecord {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  category: string;
  patient_id: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

function isValidUUID(uuid: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
}

export const uploadDocument = async (
  file: {
    uri: string;
    name: string;
    type: string;
  },
  patientId: string,
  category: string,
  tags: string[] = []
) => {
  try {
    console.log('Starting upload process...', { patientId, category, fileName: file.name });

    // Validate patientId
    if (!isValidUUID(patientId)) {
      throw new Error('Invalid patientId: must be a UUID. Please re-add the patient.');
    }

    let fileData: ArrayBuffer;
    if (file.uri.startsWith('file://') || Platform.OS !== 'web') {
      // React Native/Expo: Read as base64, decode to ArrayBuffer
      // Reference: https://supabase.com/blog/react-native-storage
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      fileData = decode(base64);
    } else {
      // Web: fetch as Blob, then convert to ArrayBuffer
      const response = await fetch(file.uri);
      fileData = await response.arrayBuffer();
    }

    // Get current user id
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user.id;
    if (!userId) throw new Error('User not authenticated');

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    // Store under user_id/patient_id
    const filePath = `${userId}/${patientId}/${fileName}`;

    console.log('Uploading file to storage...', { filePath, fileSize: fileData.byteLength });

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('medical-documents')
      .upload(filePath, fileData, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log('File uploaded successfully:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('medical-documents')
      .getPublicUrl(filePath);

    console.log('Generated public URL:', publicUrl);

    // Prepare record data
    const recordData = {
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      file_url: publicUrl,
      file_type: file.type,
      category: category,
      patient_id: patientId,
      user_id: userId,
      tags: tags
    };

    console.log('Inserting record to database...', recordData);

    // Save record metadata to database
    const { data: insertedRecord, error: recordError } = await supabase
      .from('medical_records')
      .insert(recordData)
      .select()
      .single();

    if (recordError) {
      console.error('Database insert error:', recordError);
      // Try to clean up uploaded file if database insert fails
      await supabase.storage
        .from('medical-documents')
        .remove([filePath]);
      throw new Error(`Database insert failed: ${recordError.message}`);
    }

    console.log('Record inserted successfully:', insertedRecord);
    return insertedRecord;

  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const getMedicalRecords = async (patientId?: string) => {
  try {
    console.log('Fetching medical records...', { patientId });

    let query = supabase
      .from('medical_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching records:', error);
      throw error;
    }

    console.log('Records fetched successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error fetching medical records:', error);
    throw error;
  }
};

export const deleteDocument = async (recordId: string, filePath: string) => {
  try {
    // Delete from database first
    const { error: dbError } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', recordId);

    if (dbError) {
      throw dbError;
    }

    // Then delete from storage
    const { error: storageError } = await supabase.storage
      .from('medical-documents')
      .remove([filePath]);

    if (storageError) {
      console.warn('Storage deletion failed:', storageError);
      // Don't throw here as the database record is already deleted
    }

    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const createPatient = async (name: string, dob: string | null, gender: string, userId: string, age?: number, height?: string, ailments?: string[], medications?: string[]) => {
  const { data, error } = await supabase
    .from('patients')
    .insert({ name, dob, gender, user_id: userId, age, height, ailments, medications })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePatient = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deletePatient = async (id: string) => {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const deleteUser = async (userId: string) => {
  // Delete user from auth.users (requires service role key in backend, so here just a placeholder)
  // Delete all patients and records for this user
  const { error: patientError } = await supabase
    .from('patients')
    .delete()
    .eq('user_id', userId);
  if (patientError) throw patientError;
  // Optionally, sign out user
  await supabase.auth.signOut();
  return true;
};

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }

    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

// Upload Ayurlekha summary markdown
export const uploadAyurlekhaSummary = async (
  userId: string,
  patientId: string,
  content: string
) => {
  const filePath = `Ayurlekha/${userId}/${patientId}/Ayurlekha.md`;
  const fileData = new TextEncoder().encode(content);
  const { data, error } = await supabase.storage
    .from('medical-documents')
    .upload(filePath, fileData, {
      contentType: 'text/markdown',
      upsert: true
    });
  if (error) throw error;
  return data;
};

// Fetch patients for the current user, including ayurlekha_generated_at
export const fetchPatientsWithAyurlekha = async () => {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user.id;
  if (!userId) throw new Error('User not authenticated');
  const { data, error } = await supabase
    .from('patients')
    .select('id, name, age, gender, height, ailments, medications, ayurlekha_generated_at')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
};