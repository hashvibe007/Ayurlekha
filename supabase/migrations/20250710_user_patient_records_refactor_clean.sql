-- 0. Clean up test data
TRUNCATE TABLE medical_records;
DROP TABLE IF EXISTS patients;

-- 1. Create patients table
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dob date,
  gender text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Alter patient_id to uuid and add user_id to medical_records
ALTER TABLE medical_records ALTER COLUMN patient_id TYPE uuid USING NULLIF(patient_id, '')::uuid;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS user_id uuid;

-- 3. Add FK constraints
ALTER TABLE medical_records
  ADD CONSTRAINT fk_medical_records_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_medical_records_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- 4. Enable RLS and policies for patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user access to own patients" ON patients
  FOR ALL USING (user_id = auth.uid());

-- 5. Update RLS for medical_records
DROP POLICY IF EXISTS "Allow public select on medical_records" ON medical_records;
DROP POLICY IF EXISTS "Allow public insert on medical_records" ON medical_records;
DROP POLICY IF EXISTS "Allow public update on medical_records" ON medical_records;
DROP POLICY IF EXISTS "Allow public delete on medical_records" ON medical_records;

CREATE POLICY "Allow user access to own records" ON medical_records
  FOR ALL USING (user_id = auth.uid());

-- 6. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_patients_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_patients_updated_at_column(); 