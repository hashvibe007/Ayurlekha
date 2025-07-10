import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  height?: string;
  ailments?: string[];
  medications?: string[];
}

interface PatientState {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updatedPatient: Partial<Patient>) => void;
  removePatient: (id: string) => void;
  clearPatients: () => void;
}

export const usePatientStore = create<PatientState>()(
  persist(
    (set) => ({
      patients: [],
      
      addPatient: (patient) => set((state) => ({
        patients: [...state.patients, patient]
      })),
      
      updatePatient: (id, updatedPatient) => set((state) => ({
        patients: state.patients.map((patient) => 
          patient.id === id ? { ...patient, ...updatedPatient } : patient
        )
      })),
      
      removePatient: (id) => set((state) => ({
        patients: state.patients.filter((patient) => patient.id !== id)
      })),

      clearPatients: () => set({ patients: [] }),
    }),
    {
      name: 'ayurlekha-patients',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);