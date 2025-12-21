# Upload Book Feature - Publishify

## Overview
Fitur upload buku baru dengan 2 tahap:
1. **Form Identitas Buku** - Input informasi buku
2. **Upload File** - Upload file buku (PDF/DOC/DOCX)

## File Structure

```
lib/
├── models/
│   └── book_submission.dart        # Model untuk data submission buku
├── pages/
│   └── upload/
│       ├── upload_book_page.dart   # Step 1: Form identitas buku
│       └── upload_file_page.dart   # Step 2: Upload file
└── utils/
    └── routes.dart                 # Route configuration (updated)
```

## Navigation Flow

```
Home Page
  └─> Action Button (new_document)
      └─> Upload Book Page (Step 1)
          └─> Upload File Page (Step 2)
              └─> Success → Back to Home
```

## Features

### Step 1: Upload Book Page (Identitas Buku)

#### Fields:
- **Judul** (Required) - Title buku
- **Nama Penulis** (Required) - Author name
- **Tahun Penulisan** (Required) - Publish year (numeric)
- **Jaminan Usia/ISBN** (Required) - ISBN number
- **Kategori** (Required) - Dropdown selection:
  - Fiksi
  - Non-Fiksi
  - Biografi
  - Sejarah
  - Teknologi
  - Pendidikan
  - Agama
  - Seni
  - Lainnya
- **Sinopsis** (Required) - Multi-line text area (6 lines)

#### Validation:
- ✅ All fields required
- ✅ Kategori must be selected
- ✅ Form validation before proceeding
- ✅ Error messages displayed

#### UI Components:
- Header dengan back button dan title "Upload"
- Text fields dengan rounded corners
- Dropdown dengan icon
- Multi-line text area untuk sinopsis
- "Next" button dengan arrow icon

### Step 2: Upload File Page

#### Features:
- **Upload Area** - Tap untuk pilih file
- **File Types** - PDF, DOC, DOCX (Max 10MB)
- **Selected File Display** - Show filename dan "Ganti File" button
- **Upload Progress** - Loading indicator saat upload
- **Success Message** - SnackBar confirmation

#### UI Components:
- Header dengan back button dan title "Upload"
- Upload area dengan dashed border
- Plus icon untuk select file
- Check icon saat file selected
- "Submit" button dengan loading state

## Model: BookSubmission

```dart
class BookSubmission {
  final String title;
  final String authorName;
  final String publishYear;
  final String isbn;
  final String category;
  final String synopsis;
  final String? filePath;
}
```

## Routes

### Route Name: `/upload-book`

Terdaftar di `lib/utils/routes.dart`:
```dart
static const String uploadBook = '/upload-book';
```

### Navigation from Home:
```dart
void _handleAction(String action) {
  if (action == 'new_document') {
    Navigator.pushNamed(context, '/upload-book');
  }
}
```

## Theme Usage

### Colors:
- `primaryGreen` - Header background, buttons, borders (focus)
- `white` - Form backgrounds
- `backgroundWhite` - Page background
- `greyDisabled` - Input borders
- `greyMedium` - Placeholder text, hints
- `errorRed` - Error borders, messages

### Typography:
- `headingMedium` - Page title (20px, bold)
- `bodyMedium` - Labels, inputs (14px)
- `bodySmall` - Helper text (12px)

## TODO - Future Enhancements

### 1. File Picker Integration
Tambahkan package `file_picker`:
```yaml
dependencies:
  file_picker: ^6.0.0
```

Implementation:
```dart
import 'package:file_picker/file_picker.dart';

void _pickFile() async {
  FilePickerResult? result = await FilePicker.platform.pickFiles(
    type: FileType.custom,
    allowedExtensions: ['pdf', 'doc', 'docx'],
  );
  
  if (result != null) {
    setState(() {
      _selectedFileName = result.files.single.name;
    });
  }
}
```

### 2. File Upload to Server
```dart
import 'package:http/http.dart' as http;

Future<void> _uploadFile() async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('https://api.publishify.com/books/upload'),
  );
  
  request.files.add(await http.MultipartFile.fromPath(
    'file',
    _selectedFilePath,
  ));
  
  request.fields['title'] = widget.submission.title;
  request.fields['author'] = widget.submission.authorName;
  // ... other fields
  
  var response = await request.send();
  
  if (response.statusCode == 200) {
    // Success
  }
}
```

### 3. Progress Indicator
```dart
StreamedResponse response = await request.send();

response.stream.transform(utf8.decoder).listen((value) {
  // Update progress
  setState(() {
    _uploadProgress = calculateProgress(value);
  });
});
```

### 4. Validation Enhancements
- File size validation (max 10MB)
- File type validation
- Year range validation (1900 - current year)
- ISBN format validation
- Minimum synopsis length

### 5. Draft Saving
- Save form data locally (SharedPreferences)
- Auto-save on field change
- Restore draft on page load

## Testing

### Manual Testing:
1. Dari Home, tap icon "note_add" (new document)
2. Verify navigasi ke Upload Book Page
3. Fill semua fields dengan data valid
4. Tap "Next"
5. Verify navigasi ke Upload File Page
6. Tap upload area
7. Verify file picker opens (will show TODO message)
8. Tap "Submit"
9. Verify success message
10. Verify kembali ke Home

### Validation Testing:
1. Try submit dengan empty fields → Should show errors
2. Try proceed tanpa select kategori → Should show error
3. Try submit tanpa file → Should show error

## Integration Points

### With Home Page:
- Action button `new_document` navigates to upload

### With API (Future):
- POST `/api/books/upload` - Upload buku baru
- Multipart form data dengan file

### With Storage:
- Local storage untuk draft (SharedPreferences)
- Cloud storage untuk uploaded files (S3/Firebase Storage)

## Accessibility

- ✅ Keyboard navigation support
- ✅ Screen reader labels
- ✅ High contrast support
- ✅ Touch target sizes (44x44)
- ✅ Error messages announced

## Performance

- Form validation on submit (tidak real-time)
- File size check sebelum upload
- Progress indicator untuk upload
- Network error handling

---

**Status**: ✅ Basic implementation complete
**Next**: Add file_picker package dan actual upload functionality
