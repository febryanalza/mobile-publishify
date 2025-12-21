# Sistem Review Naskah - Publishify

## 📋 Ringkasan

Sistem Review Naskah adalah fitur lengkap untuk mengelola proses review buku yang telah disubmit oleh penulis. Sistem ini memungkinkan editor untuk melihat daftar naskah, menerima review, menugaskan editor lain, dan melihat detail lengkap naskah.

## 🎯 Fitur Utama

### 1. Halaman Review Naskah (`ReviewNaskahPage`)
- **Lokasi**: `lib/pages/editor/review/review_naskah_page.dart`
- **Route**: `/editor/review-naskah`
- **Fitur**:
  - Daftar naskah yang disubmit dengan status berbeda
  - Filter berdasarkan status (Semua, Menunggu Review, Dalam Review, Selesai Review)
  - Tab dengan badge count untuk setiap status
  - Kartu naskah dengan informasi lengkap (sampul, judul, penulis, kategori)
  - Action buttons: Terima Review, Tugaskan Editor, Lihat Detail
  - Dialog penugasan editor dengan daftar editor tersedia
  - Loading state, error handling, dan empty state
  - Pull-to-refresh functionality

### 2. Halaman Detail Review (`DetailReviewNaskahPage`)
- **Lokasi**: `lib/pages/editor/review/detail_review_naskah_page.dart`
- **Route**: `/editor/detail-review-naskah` (dengan parameter `naskahId`)
- **Fitur**:
  - Header dengan sampul buku dan status
  - Informasi lengkap naskah (metadata, sinopsis, riwayat review)
  - Timeline riwayat review dengan status dan tanggal
  - Sistem komentar untuk feedback
  - Action buttons: Preview File, Download File, Terima Review
  - Responsive design dengan layout yang bersih

### 3. Data Models (`ReviewNaskahModels`)
- **Lokasi**: `lib/models/editor/review_naskah_models.dart`
- **Models**:
  - `NaskahSubmission`: Model utama untuk naskah yang disubmit
  - `DetailNaskahSubmission`: Model untuk detail naskah lengkap
  - `RiwayatReview`: Model untuk riwayat review
  - `KomentarReview`: Model untuk komentar review
  - `EditorTersedia`: Model untuk editor yang tersedia
  - `ReviewNaskahResponse<T>`: Model wrapper untuk API response

### 4. Service Layer (`ReviewNaskahService`)
- **Lokasi**: `lib/services/editor/review_naskah_service.dart`
- **Methods**:
  - `getNaskahSubmissions()`: Mengambil daftar naskah submission
  - `getDetailNaskah(String id)`: Mengambil detail naskah
  - `getEditorTersedia()`: Mengambil daftar editor tersedia
  - `terimaReview(String id, String idEditor)`: Menerima review
  - `tugaskanEditor(String id, String idEditor, String alasan)`: Menugaskan editor

## 🔧 Setup dan Konfigurasi

### 1. Routing
Tambahkan ke `app_routes.dart`:
```dart
case '/editor/review-naskah':
  return MaterialPageRoute(
    builder: (_) => ReviewNaskahPage(),
    settings: settings,
  );

case '/editor/detail-review-naskah':
  final args = settings.arguments as Map<String, dynamic>?;
  return MaterialPageRoute(
    builder: (_) => DetailReviewNaskahPage(
      naskahId: args?['naskahId'] ?? '',
    ),
    settings: settings,
  );
```

### 2. Navigasi dari Dashboard
Update `editor_service.dart` untuk menambahkan menu item:
```dart
{
  'icon': 'book_online',
  'title': 'Kelola Review Naskah',
  'subtitle': 'Terima dan tugaskan review naskah',
  'route': '/editor/review-naskah',
  'badge': 5,
},
```

### 3. Quick Actions
Update quick actions untuk navigasi cepat:
```dart
{
  'icon': 'assignment',
  'label': 'Review Baru',
  'count': 3,
  'action': 'new_reviews',
  'route': '/editor/review-naskah',
  'color': 'blue',
},
```

## 🗄️ Data Dummy

### Status Naskah:
- `menunggu_review`: Naskah baru yang perlu direview
- `dalam_review`: Naskah sedang dalam proses review
- `selesai_review`: Review telah selesai

### Prioritas:
- `rendah`: Prioritas rendah
- `sedang`: Prioritas sedang
- `tinggi`: Prioritas tinggi
- `urgent`: Prioritas urgent

### Sample Data:
Service menyediakan 5 naskah dummy dengan data realistis:
1. "Perjalanan Sang Penulis" - Novel Biografi
2. "Rahasia Teknologi Masa Depan" - Buku Teknologi  
3. "Cinta di Ujung Senja" - Novel Romantis
4. "Panduan Bisnis Digital" - Buku Bisnis
5. "Misteri Kota Tua" - Novel Misteri

### Sample Editors:
5 editor dummy dengan spesialisasi berbeda:
1. Dr. Sarah Wijaya - Spesialis Fiksi Sastra
2. Prof. Ahmad Rahman - Spesialis Non-Fiksi Teknologi
3. Maria Sari, M.A. - Spesialis Novel Romantis  
4. Budi Santoso, S.E. - Spesialis Buku Bisnis
5. Lisa Putri - Spesialis Fiksi Misteri

## 🔌 Integrasi Backend

### API Endpoints yang Diperlukan:

#### 1. Mengambil Daftar Naskah
```
GET /api/editor/submissions?status={status}&page={page}&limit={limit}
Response: ReviewNaskahResponse<List<NaskahSubmission>>
```

#### 2. Detail Naskah
```
GET /api/editor/submissions/{id}
Response: ReviewNaskahResponse<DetailNaskahSubmission>
```

#### 3. Daftar Editor
```
GET /api/editor/available-editors
Response: ReviewNaskahResponse<List<EditorTersedia>>
```

#### 4. Terima Review
```
POST /api/editor/submissions/{id}/accept
Body: { "editorId": "string" }
Response: ReviewNaskahResponse<String>
```

#### 5. Tugaskan Editor
```
POST /api/editor/submissions/{id}/assign
Body: { 
  "editorId": "string",
  "reason": "string"
}
Response: ReviewNaskahResponse<String>
```

### Cara Integrasi:
1. Ganti semua method di `ReviewNaskahService` dengan HTTP calls
2. Update endpoint URLs sesuai dengan backend API
3. Handle authentication dengan menambahkan headers
4. Update error handling untuk HTTP errors

## 🎨 UI/UX Features

### Design Elements:
- ✅ Material Design 3 components
- ✅ AppTheme color scheme (primaryGreen)
- ✅ Responsive layout
- ✅ Loading states dengan CircularProgressIndicator
- ✅ Error handling dengan retry buttons
- ✅ Empty states dengan ilustrasi
- ✅ Pull-to-refresh
- ✅ Smooth animations

### User Experience:
- ✅ Intuitive navigation
- ✅ Clear action buttons
- ✅ Status badges dan priority indicators
- ✅ Rich text display untuk sinopsis
- ✅ Network image dengan fallback
- ✅ Toast notifications untuk feedback
- ✅ Confirmation dialogs untuk actions

## 🧪 Testing

### Test File:
- **Lokasi**: `test/review_naskah_simple_test.dart`
- **Coverage**: Service layer testing dengan dummy data
- **Test Cases**:
  - Data retrieval dari service methods
  - Error handling untuk invalid IDs
  - Response format validation

### Manual Testing:
1. Navigate ke `/editor/review-naskah`
2. Test filter tabs (Semua, Menunggu Review, dll.)
3. Test action buttons (Terima, Tugaskan, Detail)
4. Test editor assignment dialog
5. Test detail page navigation
6. Test pull-to-refresh
7. Test error states dan loading states

## 📱 Screenshots Path

### Main Review Page:
- Header dengan title "Review Naskah"
- Filter tabs dengan badge counts
- Grid/List naskah cards dengan sampul
- Action buttons pada setiap card
- Floating action button untuk refresh

### Detail Page:
- Header dengan sampul dan status badge
- Comprehensive info section
- Timeline riwayat review
- Comments section
- Action buttons di bottom

### Editor Assignment Dialog:
- Modal dialog dengan daftar editor
- Editor cards dengan foto, nama, spesialisasi
- Rating dan workload indicator
- Text field untuk alasan penugasan
- Assign dan Cancel buttons

## 🔄 Status Flow

```
menunggu_review → (Terima Review) → dalam_review → (Selesai Review) → selesai_review
                ↓ (Tugaskan Editor Lain)
               dalam_review (dengan editor berbeda)
```

## 📝 TODO untuk Backend Integration

1. **Replace dummy service methods** dengan HTTP calls
2. **Add authentication headers** untuk API calls  
3. **Implement proper error handling** untuk network errors
4. **Add offline support** dengan caching
5. **Implement real-time updates** dengan WebSocket/polling
6. **Add file upload/download** functionality
7. **Implement push notifications** untuk review assignments

## 🎉 Fitur Selesai

✅ **Semua deprecated RadioListTile warnings telah diperbaiki**  
✅ **Sistem Review Naskah lengkap dengan UI dan data layer**  
✅ **Routing dan navigasi terintegrasi dengan dashboard**  
✅ **Dummy data realistis untuk testing dan development**  
✅ **Error handling dan loading states yang proper**  
✅ **Responsive design dengan Material Design 3**  

Sistem ini siap digunakan dan diintegrasikan dengan backend API sesuai dengan spesifikasi di atas!