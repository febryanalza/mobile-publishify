# Perbaikan Upload File Naskah di Edit Naskah Page

**Tanggal:** 17 Desember 2024  
**Status:** ✅ Selesai

## 🎯 Masalah

Pada halaman edit naskah, sebelumnya menggunakan **TextFormField untuk input URL file manual** yang tidak user-friendly. User harus memasukkan URL lengkap secara manual seperti:
```
/naskah/2025-12-16_ijere-1--1-_162bf106858ac23c.docx
```

## ✨ Solusi

Mengubah cara handling file naskah menjadi:
1. **Tampilkan nama file** yang sudah ada (bukan URL)
2. **Tombol upload file baru** - User dapat mengganti file dengan upload ulang
3. **File picker** - Seperti di halaman upload buku baru
4. **No manual URL input** - User tidak perlu input URL manual

## 🔄 Perubahan Yang Dilakukan

### 1. Hapus TextFormField URL Manual

**Sebelum:**
```dart
// URL File
_buildSectionTitle('URL File Naskah (Opsional)'),
TextFormField(
  controller: _urlFileController,
  decoration: AppTheme.inputDecoration(
    hintText: 'https://example.com/naskah.pdf',
    prefixIcon: const Icon(Icons.file_present, color: AppTheme.primaryGreen),
  ),
),
```

**Sesudah:**
```dart
// Upload File Naskah
_buildSectionTitle('File Naskah'),
_buildNaskahFilePicker(),
```

### 2. Tambah Variabel State Baru

```dart
// File picker untuk naskah
File? _naskahFile;
bool _isUploadingNaskah = false;
String? _naskahUrl;
String? _naskahFileName;
```

### 3. Initialize File Info dari Naskah

```dart
void _initializeControllers() {
  // ... existing code ...
  
  _naskahUrl = widget.naskah.urlFile;
  
  // Ekstrak nama file dari URL
  if (_naskahUrl != null) {
    _naskahFileName = _naskahUrl!.split('/').last;
  }
}
```

### 4. Widget Naskah File Picker

```dart
Widget _buildNaskahFilePicker() {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: AppTheme.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: AppTheme.greyDisabled),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. Info file saat ini (jika ada)
        if (_naskahFileName != null) ...[
          Container(
            // Green card dengan nama file saat ini
            child: Row([
              Icon(Icons.insert_drive_file),
              Column([
                Text('File Naskah Saat Ini:'),
                Text(_naskahFileName!), // Nama file readable
              ]),
            ]),
          ),
        ],

        // 2. Info file baru yang dipilih (jika ada)
        if (_naskahFile != null) ...[
          Container(
            // Blue card dengan file baru
            child: Row([
              Icon(Icons.file_upload),
              Column([
                Text('File Baru Dipilih:'),
                Text(_naskahFile!.path.split('/').last),
              ]),
            ]),
          ),
        ],

        // 3. Tombol aksi
        Row([
          // Tombol pilih file
          OutlinedButton.icon(
            onPressed: _pickNaskahFile,
            label: Text(_naskahFile != null ? 'Ganti File' : 'Upload File Baru'),
          ),
          
          // Tombol upload (muncul jika ada file dipilih)
          if (_naskahFile != null)
            ElevatedButton.icon(
              onPressed: _uploadNaskahFile,
              label: Text('Upload'),
            ),
        ]),

        // 4. Info format
        Text('Format: DOC, DOCX • Max: 50MB'),
      ],
    ),
  );
}
```

### 5. Method Pick File Naskah

```dart
Future<void> _pickNaskahFile() async {
  try {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['doc', 'docx'],
      allowMultiple: false,
    );

    if (result != null && result.files.single.path != null) {
      final file = File(result.files.single.path!);
      final fileSize = await file.length();

      // Validasi ukuran file (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (fileSize > maxSize) {
        _showSnackBar('Ukuran file terlalu besar! Maksimal 50MB', isError: true);
        return;
      }

      setState(() {
        _naskahFile = file;
      });

      _showSnackBar('File dipilih: ${result.files.single.name}');
    }
  } catch (e) {
    _showSnackBar('Error memilih file: ${e.toString()}', isError: true);
  }
}
```

### 6. Method Upload File Naskah

```dart
Future<void> _uploadNaskahFile() async {
  if (_naskahFile == null) return;

  setState(() {
    _isUploadingNaskah = true;
  });

  try {
    // Upload file ke server
    final response = await UploadService.uploadNaskah(
      file: _naskahFile!,
      deskripsi: 'Naskah: ${_judulController.text}',
    );

    setState(() {
      _isUploadingNaskah = false;
    });

    if (response.sukses && response.data != null) {
      // Ekstrak path relatif
      final uploadUrl = response.data!.url;
      final fileUrl = _extractRelativePath(uploadUrl);
      
      setState(() {
        _naskahUrl = fileUrl;                               // Save URL for update
        _naskahFileName = _naskahFile!.path.split('/').last; // Display name
        _naskahFile = null;                                  // Clear picker
      });

      _showSnackBar('File naskah berhasil diupload');
    } else {
      _showSnackBar(response.pesan, isError: true);
    }
  } catch (e) {
    setState(() {
      _isUploadingNaskah = false;
    });
    _showSnackBar('Error upload file: ${e.toString()}', isError: true);
  }
}
```

### 7. Helper Method Extract Path

```dart
String _extractRelativePath(String url) {
  // Jika sudah dalam format yang diinginkan (/naskah/...)
  if (url.startsWith('/naskah/') || url.startsWith('/sampul/')) {
    return url;
  }
  
  // Ekstrak path setelah /uploads
  final uploadsIndex = url.indexOf('/uploads/');
  if (uploadsIndex != -1) {
    final afterUploads = url.substring(uploadsIndex + '/uploads'.length);
    return afterUploads; // Returns: /naskah/filename.docx
  }
  
  // Jika format tidak dikenali, kembalikan apa adanya
  return url;
}
```

### 8. Update Submit Method

```dart
Future<void> _submitUpdate() async {
  // ... validation ...

  final response = await NaskahService.updateNaskah(
    // ... other fields ...
    urlFile: _naskahUrl, // Gunakan URL yang sudah diupload atau URL lama
    publik: _publik,
  );
  
  // ... handle response ...
}
```

## 📱 UI/UX Flow

### Scenario 1: Naskah Sudah Ada File

```
┌─────────────────────────────────────────┐
│ File Naskah                             │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 📄 File Naskah Saat Ini:            │ │
│ │    ijere-1--1-_162bf106858ac23c.docx│ │ ← Nama file readable
│ └─────────────────────────────────────┘ │
│                                         │
│ [📤 Upload File Baru]                   │ ← Button untuk ganti
│                                         │
│ Format: DOC, DOCX • Max: 50MB          │
│ 💡 Untuk mengganti file naskah,        │
│    upload file baru                    │
└─────────────────────────────────────────┘
```

### Scenario 2: Memilih File Baru

```
┌─────────────────────────────────────────┐
│ File Naskah                             │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 📄 File Naskah Saat Ini:            │ │
│ │    ijere-1--1-_162bf106858ac23c.docx│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📤 File Baru Dipilih:               │ │
│ │    naskah-baru-revisi.docx         │ │ ← File yang dipilih
│ └─────────────────────────────────────┘ │
│                                         │
│ [🔄 Ganti File] [☁️ Upload]            │ ← Upload untuk apply
│                                         │
│ Format: DOC, DOCX • Max: 50MB          │
└─────────────────────────────────────────┘
```

### Scenario 3: Upload Progress

```
┌─────────────────────────────────────────┐
│ File Naskah                             │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 📤 File Baru Dipilih:               │ │
│ │    naskah-baru-revisi.docx         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [🔄 Ganti File] [⏳ Uploading...]      │ ← Loading state
│                                         │
└─────────────────────────────────────────┘
```

### Scenario 4: Upload Success

```
┌─────────────────────────────────────────┐
│ File Naskah                             │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 📄 File Naskah Saat Ini:            │ │
│ │    naskah-baru-revisi.docx         │ │ ← File terupdate
│ └─────────────────────────────────────┘ │
│                                         │
│ [📤 Upload File Baru]                   │
│                                         │
│ ✓ File naskah berhasil diupload       │ ← Success message
└─────────────────────────────────────────┘
```

## 🎨 Visual Design

### Card File Saat Ini (Green)
- **Background**: `AppTheme.primaryGreen.withValues(alpha: 0.1)`
- **Border**: `AppTheme.primaryGreen.withValues(alpha: 0.3)`
- **Icon**: `Icons.insert_drive_file` (Green)
- **Text**: File name dengan `fontWeight: FontWeight.w600`

### Card File Baru (Blue)
- **Background**: `AppTheme.googleBlue.withValues(alpha: 0.1)`
- **Border**: `AppTheme.googleBlue.withValues(alpha: 0.3)`
- **Icon**: `Icons.file_upload` (Blue)
- **Text**: File name dengan `fontWeight: FontWeight.w600`

### Buttons
1. **Upload File Baru** (Outlined Blue)
   - Icon: `Icons.file_upload`
   - Color: `AppTheme.googleBlue`
   
2. **Upload** (Filled Green)
   - Icon: `Icons.cloud_upload`
   - Background: `AppTheme.primaryGreen`
   - Loading: `CircularProgressIndicator`

## ✅ Keuntungan

### 1. User-Friendly
- ✅ Tidak perlu input URL manual
- ✅ Tampilan nama file yang readable
- ✅ Visual clear untuk file saat ini vs file baru

### 2. Consistency
- ✅ Sama dengan flow upload buku baru
- ✅ UI pattern consistent dengan sampul picker
- ✅ Validation sama (file type, size)

### 3. Safety
- ✅ File validation (type & size)
- ✅ Upload confirmation
- ✅ Error handling lengkap
- ✅ Loading state clear

### 4. Developer Experience
- ✅ Code reusable dari upload_file_page
- ✅ Service layer sudah ada (UploadService)
- ✅ No breaking changes di backend

## 🧪 Testing Checklist

### File Display
- [ ] Nama file saat ini tampil dengan benar
- [ ] Nama file extracted dari URL path
- [ ] Handle file tidak ada (empty state)
- [ ] Handle URL format berbeda

### File Picker
- [ ] File picker hanya accept .doc dan .docx
- [ ] File size validation (max 50MB)
- [ ] File name tampil setelah pilih
- [ ] Cancel picker tidak error

### Upload Process
- [ ] Upload button muncul setelah pilih file
- [ ] Loading indicator saat upload
- [ ] Success message setelah upload
- [ ] Error message jika upload gagal
- [ ] File info update setelah upload success

### Submit Update
- [ ] URL file tersimpan dengan benar
- [ ] URL lama preserved jika tidak upload baru
- [ ] Update naskah success dengan file baru
- [ ] Backend receive correct file path

### Edge Cases
- [ ] Rapid tap pada upload button
- [ ] Upload file kemudian cancel edit
- [ ] Upload file besar (near 50MB limit)
- [ ] Upload dengan koneksi lambat
- [ ] File dengan nama special characters

## 📁 Files Modified

### Modified Files
- `publishify/lib/pages/writer/naskah/edit_naskah_page.dart`

### Changes Summary
1. **Removed**: `_urlFileController` (TextEditingController)
2. **Added**: Variables untuk file naskah state
   - `File? _naskahFile`
   - `bool _isUploadingNaskah`
   - `String? _naskahUrl`
   - `String? _naskahFileName`
3. **Added**: `_buildNaskahFilePicker()` widget
4. **Added**: `_pickNaskahFile()` method
5. **Added**: `_uploadNaskahFile()` method
6. **Added**: `_extractRelativePath()` helper method
7. **Updated**: `_submitUpdate()` to use `_naskahUrl`

## 🔗 Related Features

### Similar Implementation
- ✅ `upload_file_page.dart` - Reference untuk file picker flow
- ✅ `_buildSampulPicker()` - Pattern untuk upload UI

### Dependencies
- ✅ `UploadService.uploadNaskah()` - Service untuk upload file
- ✅ `NaskahService.updateNaskah()` - Service untuk update naskah
- ✅ `file_picker` package - File picker functionality

## 📚 Code References

### File URL Format
```dart
// Backend returns (upload response):
/uploads/naskah/2025-12-16_filename_hash.docx

// We store (database):
/naskah/2025-12-16_filename_hash.docx

// Display to user:
2025-12-16_filename_hash.docx
```

### File Size Limits
```dart
const maxSize = 50 * 1024 * 1024; // 50MB for naskah
const maxSize = 5 * 1024 * 1024;  // 5MB for sampul
```

### Allowed Extensions
```dart
allowedExtensions: ['doc', 'docx'] // For naskah
allowedExtensions: ['jpg', 'jpeg', 'png'] // For sampul
```

## 🚀 Next Steps

### Future Enhancements
1. **Preview File** - Show file preview/info before upload
2. **Download File** - Allow user to download current file
3. **Version History** - Keep track of file versions
4. **Progress Bar** - Show upload progress percentage
5. **Drag & Drop** - Support drag and drop file upload

---

**Status:** ✅ Completed  
**Last Updated:** 17 Desember 2024  
**Version:** 1.0.0
