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
  selectedPatientId: string | null;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updatedPatient: Partial<Patient>) => void;
  removePatient: (id: string) => void;
  clearPatients: () => void;
  setSelectedPatientId: (id: string) => void;
}

export const usePatientStore = create<PatientState>()(
  persist(
    (set, get) => ({
      patients: [],
      selectedPatientId: null,
      addPatient: (patient) => set((state) => ({
        patients: [...state.patients, patient]
      })),
      updatePatient: (id, updatedPatient) => set((state) => ({
        patients: state.patients.map((patient) => 
          patient.id === id ? { ...patient, ...updatedPatient } : patient
        )
      })),
      removePatient: (id) => set((state) => ({
        patients: state.patients.filter((patient) => patient.id !== id),
        selectedPatientId: get().selectedPatientId === id ? null : get().selectedPatientId
      })),
      clearPatients: () => set({ patients: [], selectedPatientId: null }),
      setSelectedPatientId: (id) => set({ selectedPatientId: id }),
    }),
    {
      name: 'ayurlekha-patients',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const getSelectedPatient = (state: PatientState) =>
  state.patients.find((p) => p.id === state.selectedPatientId) || null;