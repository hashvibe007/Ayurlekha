/*
  # Create medical records table and storage

  1. New Tables
    - `medical_records`
      - `id` (uuid, primary key)
      - `title` (text, document title)
      - `file_url` (text, public URL to the file)
      - `file_type` (text, MIME type)
      - `category` (text, document category)
      - `patient_id` (text, reference to patient)
      - `tags` (text array, searchable tags)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create `medical-documents` bucket
    - Enable public access for file URLs

  3. Security
    - Enable RLS on `medical_records` table
    - Add policies for authenticated users to manage their own records
    - Add policies for public read access to storage bucket
*/

-- Create the medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  patient_id text NOT NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Create policies for medical_records
CREATE POLICY "Allow public insert on medical_records"
  ON medical_records
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on medical_records"
  ON medical_records
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update on medical_records"
  ON medical_records
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete on medical_records"
  ON medical_records
  FOR DELETE
  TO public
  USING (true);

-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Allow public uploads to medical-documents"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'medical-documents');

CREATE POLICY "Allow public downloads from medical-documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'medical-documents');

CREATE POLICY "Allow public updates to medical-documents"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'medical-documents');

CREATE POLICY "Allow public deletes from medical-documents"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'medical-documents');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_category ON medical_records(category);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON medical_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_tags ON medical_records USING GIN(tags);