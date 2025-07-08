import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';
// Official reference: https://supabase.com/blog/react-native-storage
// Docs: https://supabase.com/docs/guides/storage/uploads/standard-uploads

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `medical-records/${patientId}/${fileName}`;

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