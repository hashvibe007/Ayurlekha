# Ayurlekha

A cross-platform (Expo/React Native) medical records app using Supabase for backend storage and authentication.

## Features
- Patient management
- Medical document upload (images, PDFs)
- Supabase Storage integration
- Modular, scalable architecture

## App Flow
1. User selects or scans a document (image or PDF).
2. App reads file (as binary/Blob).
3. App uploads file to Supabase Storage.
4. App saves metadata to Supabase Database.
5. User can view/download documents.

## Architecture Diagram
```mermaid
flowchart TD
    A["User"] -->|"Selects/Scans Document"| B["DocumentUploader"]
    B -->|"Reads File (Blob)"| C["uploadDocument (lib/supabase.ts)"]
    C -->|"Uploads to"| D["Supabase Storage"]
    C -->|"Saves metadata"| E["Supabase DB"]
    D -->|"Returns Public URL"| C
    E -->|"Returns Record"| B
    B -->|"Updates UI"| A
```

## Upload Logic (Detailed)
```mermaid
sequenceDiagram
    participant User
    participant App
    participant SupabaseStorage
    participant SupabaseDB

    User->>App: Pick/Scan file
    App->>App: Read file as Blob (fetch or FileSystem)
    App->>SupabaseStorage: Upload Blob
    SupabaseStorage-->>App: Public URL
    App->>SupabaseDB: Save metadata (URL, type, etc.)
    SupabaseDB-->>App: Record inserted
    App-->>User: Show success
```

## Project Structure
```
project/
  app/                # App entry and navigation
    (tabs)/           # Main tab screens
    components/       # UI components (Uploader, Modals, etc.)
    hooks/            # Custom hooks
    lib/              # Supabase client and API logic
    stores/           # State management
    supabase/         # DB migrations
    assets/           # Images/icons
    types/            # TypeScript types
  package.json
  app.json
  tsconfig.json
```

## Environment
- Expo SDK 53+
- Supabase JS client
- Expo DocumentPicker, ImagePicker, FileSystem

## Setup
```bash
# Install dependencies
npm install

# Set up .env with Supabase keys
cp .env.example .env

# Start the app
npm run dev
```

## Troubleshooting
- **File upload corrupted?**  
  ⇒ Uses expo-file-system to read and convert to Blob before upload.
- **Supabase connection issues?**  
  ⇒ Check .env and network connectivity.

## Current Issue & Fix
**Problem:** Files uploaded from mobile are corrupted (cannot be opened).

**Root Cause:** Expo’s fetch(file.uri).blob() does not always work for local files on native. Must use a method that guarantees a valid Blob.

**Solution:**
- Use expo-file-system to read the file as a binary, then convert to Blob for upload.
- For PDFs and non-images, avoid using fetch on file URIs.

**Example Fix:**
```js
import * as FileSystem from 'expo-file-system';

const fileUri = file.uri;
const fileData = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
const byteCharacters = atob(fileData);
const byteNumbers = new Array(byteCharacters.length);
for (let i = 0; i < byteCharacters.length; i++) {
  byteNumbers[i] = byteCharacters.charCodeAt(i);
}
const byteArray = new Uint8Array(byteNumbers);
const blob = new Blob([byteArray], { type: file.type });
```
Then upload this blob to Supabase.

```mermaid
erDiagram
    users {
      uuid id PK
      text email
    }
    patients {
      uuid id PK
      uuid user_id FK
      text name
      date dob
      text gender
      timestamp created_at
      timestamp updated_at
    }
    medical_records {
      uuid id PK
      uuid user_id FK
      uuid patient_id FK
      text title
      text file_url
      text file_type
      text category
      text[] tags
      timestamp created_at
      timestamp updated_at
    }

    users ||--o{ patients : has
    patients ||--o{ medical_records : has
    users ||--o{ medical_records : owns
```
