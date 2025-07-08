import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMedicalRecords, MedicalRecord } from '@/lib/supabase';

interface RecordState {
  records: MedicalRecord[];
  isLoading: boolean;
  error: string | null;
  fetchRecords: (patientId?: string) => Promise<void>;
  addRecord: (record: MedicalRecord) => void;
  clearRecords: () => void;
}

export const useRecordStore = create<RecordState>()(
  persist(
    (set, get) => ({
      records: [],
      isLoading: false,
      error: null,
      
      fetchRecords: async (patientId?: string) => {
        set({ isLoading: true, error: null });
        try {
          const records = await getMedicalRecords(patientId);
          set({ records, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch records',
            isLoading: false 
          });
        }
      },
      
      addRecord: (record) => set((state) => ({
        records: [record, ...state.records]
      })),
      
      clearRecords: () => set({ records: [], error: null }),
    }),
    {
      name: 'ayurlekha-records',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);