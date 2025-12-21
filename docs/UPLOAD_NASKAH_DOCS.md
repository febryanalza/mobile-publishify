# Upload Naskah Feature - Documentation

## 📋 Overview
Fitur upload naskah telah diimplementasikan dengan integrasi penuh ke backend API. Pengguna dapat mengupload file naskah dalam format **DOC** atau **DOCX** dengan ukuran maksimal **50MB**.

## 🔧 Dependencies Baru
Tambahan package yang diinstall:
```yaml
dependencies:
  file_picker: ^8.1.4      # Untuk memilih file dari device
  http_parser: ^4.1.1      # Untuk handle MIME type saat upload
  path: ^1.9.0             # Untuk path operations
  mime: ^2.0.0             # Untuk detect MIME type file
```

## 📁 File-file Baru & Update

### 1. **Service Layer**

#### `lib/services/upload_service.dart` (BARU)
Service untuk handle upload file ke backend.

**Methods:**
- `uploadNaskah()` - Upload file naskah (DOC/DOCX)
- `uploadSampul()` - Upload gambar sampul buku

**Features:**
- Multipart file upload
- Bearer token authentication
- MIME type detection
- Error handling

**Example Usage:**
```dart
final response = await UploadService.uploadNaskah(
  file: selectedFile,
  deskripsi: 'Naskah baru',
  idReferensi: naskahId,
);

if (response.sukses) {
  print('File URL: ${response.data!.url}');
}
```

#### `lib/services/naskah_service.dart` (UPDATE)
Ditambahkan method baru untuk create naskah.

**New Method:**
- `createNaskah()` - POST /api/naskah

**Parameters:**
```dart
await NaskahService.createNaskah(
  judul: 'Judul Naskah',
  sinopsis: 'Sinopsis minimal 50 karakter...',
  idKategori: 'uuid-kategori',
  idGenre: 'uuid-genre',
  isbn: '978-xxx-xxx', // optional
  urlFile: 'upload-url', // dari upload service
  publik: false,
);
```

### 2. **UI Pages**

#### `lib/pages/upload/upload_file_page.dart` (UPDATE)
Halaman upload file dengan file picker terintegrasi.

**Features:**
- File picker untuk DOC/DOCX only
- File size validation (max 50MB)
- File size display
- Upload progress indicator
- Two-step process: Upload file → Create naskah
- Loading overlay with informative message
- Error handling & user feedback

**UI Flow:**
1. User clicks upload area
2. File picker opens (filter: .doc, .docx)
3. Selected file displayed with size
4. User clicks Submit
5. Loading overlay appears
6. Step 1: Upload file to storage
7. Step 2: Create naskah record with file URL
8. Success: Navigate to home
9. Error: Show error message

## 🔄 Upload Flow

### Complete Upload Process

```
┌─────────────────────────────────────────────────────────┐
│ 1. User fills form (upload_book_page.dart)             │
│    - Judul, Penulis, ISBN                               │
│    - Kategori, Genre                                    │
│    - Sinopsis                                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Navigate to upload_file_page.dart                   │
│    - BookSubmission object passed                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. User picks file (.doc/.docx)                        │
│    - FilePicker.platform.pickFiles()                    │
│    - Validate size (max 50MB)                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Upload file to storage                              │
│    POST /api/upload/single                             │
│    - multipart/form-data                               │
│    - tujuan: 'naskah'                                  │
│    Response: { url, path, id }                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Create naskah record                                │
│    POST /api/naskah                                    │
│    - judul, sinopsis, kategori, genre                  │
│    - urlFile: from upload response                     │
│    Response: { sukses, data: naskahData }              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Success / Error handling                            │
│    - Success: Navigate to home                         │
│    - Error: Show error message                         │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Backend API Integration

### Endpoint 1: Upload File
```
POST /api/upload/single
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- file: (binary) - File naskah
- tujuan: 'naskah'
- deskripsi: (optional)
- idReferensi: (optional)

Response:
{
  "sukses": true,
  "pesan": "File berhasil diupload",
  "data": {
    "id": "uuid",
    "namaFile": "filename.docx",
    "url": "http://localhost:4000/uploads/naskah/filename.docx",
    "path": "/uploads/naskah/filename.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "ukuran": 1234567
  }
}
```

### Endpoint 2: Create Naskah
```
POST /api/naskah
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "judul": "Judul Naskah",
  "sinopsis": "Sinopsis minimal 50 karakter...",
  "idKategori": "uuid-kategori",
  "idGenre": "uuid-genre",
  "isbn": "978-xxx-xxx",
  "urlFile": "http://localhost:4000/uploads/naskah/filename.docx",
  "publik": false
}

Response:
{
  "sukses": true,
  "pesan": "Naskah berhasil dibuat",
  "data": {
    "id": "uuid",
    "judul": "Judul Naskah",
    "status": "draft",
    "urlFile": "...",
    ...
  }
}
```

## 🔒 Validasi

### Client Side (Flutter)
- ✅ File type: .doc, .docx only
- ✅ File size: max 50MB
- ✅ Required fields: judul, sinopsis, kategori, genre
- ✅ Sinopsis: min 50 characters

### Server Side (Backend)
- ✅ MIME type validation
- ✅ File size validation
- ✅ Extension validation
- ✅ Authentication required
- ✅ Role: 'penulis' required

## 📱 User Experience

### Loading States
1. **Idle**: Upload button enabled
2. **Uploading**: 
   - Full screen overlay
   - Loading spinner
   - "Mengupload naskah..." message
   - Submit button disabled
3. **Success**: 
   - Green snackbar
   - Auto navigate to home
4. **Error**:
   - Red snackbar with error message
   - Stay on page for retry

### Error Messages
- "Token tidak ditemukan. Silakan login kembali."
- "Ukuran file terlalu besar! Maksimal 50MB"
- "Mohon pilih file terlebih dahulu"
- "Error memilih file: {error}"
- "Terjadi kesalahan: {error}"

## 🧪 Testing Checklist

- [ ] Pick .doc file - should accept
- [ ] Pick .docx file - should accept
- [ ] Pick .pdf file - should reject
- [ ] Pick file > 50MB - should show error
- [ ] Upload without login - should fail
- [ ] Upload with valid data - should success
- [ ] Network error handling
- [ ] Upload cancellation
- [ ] Multiple uploads in sequence
- [ ] Back navigation during upload

## 🚀 How to Use

### Install Dependencies
```bash
cd publishify
flutter pub get
```

### Run the App
```bash
flutter run
```

### Upload Flow
1. Login sebagai penulis
2. Navigate to Upload page
3. Fill form: Judul, Kategori, Genre, Sinopsis
4. Click "Next"
5. Pick file (.doc atau .docx)
6. Click "Submit"
7. Wait for upload completion
8. Auto navigate to Home

## 📝 Notes

- File akan disimpan di backend folder: `/uploads/naskah/`
- Naskah otomatis berstatus `draft` setelah dibuat
- URL file disimpan di field `urlFile` di tabel `naskah`
- Backend juga membuat record di tabel `revisi_naskah` jika ada file
- Support for .doc (Microsoft Word 97-2003) dan .docx (Word 2007+)

## 🔮 Future Enhancements

- [ ] Upload sampul buku pada form yang sama
- [ ] Upload progress percentage indicator
- [ ] File preview sebelum submit
- [ ] Drag & drop file upload
- [ ] Multiple file version management
- [ ] Auto-save draft
- [ ] Word count calculation
- [ ] PDF preview in-app
