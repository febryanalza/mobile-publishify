# Fitur Detail Review Editor - Publishify

**Dibuat:** ${new Date().toISOString().split('T')[0]}  
**Status:** ✅ Selesai

## 📋 Ringkasan

Fitur detail review untuk editor ketika menerima naskah masuk dengan status "ditugaskan". Halaman ini memungkinkan editor untuk:
- Melihat detail lengkap naskah yang ditugaskan
- Menerima naskah untuk direview (mengubah status dari "ditugaskan" → "dalam_proses")
- Melihat informasi penulis, kategori, genre, dan sinopsis
- Melihat feedback yang sudah ada (jika ada)

## 🎯 Tujuan

Mempermudah editor dalam mengelola review naskah dengan memberikan tampilan detail yang komprehensif dan aksi langsung untuk menerima naskah review.

## 🏗️ Arsitektur

### File yang Dibuat

#### 1. Service Layer: `review_service.dart`
**Path:** `publishify/lib/services/editor/review_service.dart`

**Fungsi Utama:**
- `getReviewById(String idReview)` - Mengambil detail review by ID
- `updateReviewStatus()` - Mengupdate status review dengan custom status
- `mulaiReview()` - Shorthand untuk mengubah status ke "dalam_proses"
- `selesaikanReview()` - Menyelesaikan review dengan rekomendasi

**API Endpoint:**
- GET `/api/review/:id` - Mengambil detail review
- PUT `/api/review/:id` - Mengupdate status review

**Response Model:**
```dart
class ReviewDetailResponse {
  final bool sukses;
  final String pesan;
  final ReviewNaskah? data;
}
```

#### 2. UI Layer: `editor_review_detail_page.dart`
**Path:** `publishify/lib/pages/editor/review/editor_review_detail_page.dart`

**Fitur UI:**
- Status badge dengan warna berbeda per status
- Section card untuk informasi naskah
- Section card untuk sinopsis
- Section card untuk informasi review
- Section card untuk feedback list
- Fixed button di bottom untuk "Terima Naskah"
- Loading state saat mengupdate status
- Dialog konfirmasi sebelum menerima naskah
- Snackbar untuk feedback sukses/error
- Auto navigate back setelah sukses

**State Management:**
- `_isLoading` - Loading saat fetch data
- `_isUpdating` - Loading saat update status
- `_review` - Data review yang diambil
- `_errorMessage` - Error message jika ada

### File yang Dimodifikasi

#### 3. Routing: `app_routes.dart`
**Path:** `publishify/lib/routes/app_routes.dart`

**Perubahan:**
```dart
// Import baru
import 'package:publishify/pages/editor/review/editor_review_detail_page.dart';

// Route baru
case '/editor/review/detail':
  final reviewId = settings.arguments as String?;
  if (reviewId == null) {
    return MaterialPageRoute(
      builder: (_) => _buildPlaceholderPage('Error', 'ID review tidak ditemukan'),
    );
  }
  return MaterialPageRoute(
    builder: (_) => EditorReviewDetailPage(reviewId: reviewId),
  );
```

## 📊 Data Flow

```
1. User tap naskah di NaskahMasukPage
   ↓
2. Navigator.pushNamed('/editor/review/detail', arguments: review.id)
   ↓
3. EditorReviewDetailPage menerima reviewId
   ↓
4. _loadReviewDetail() → EditorReviewService.getReviewById()
   ↓
5. GET /api/review/:id (Backend)
   ↓
6. Response ditampilkan di UI
   ↓
7. User klik "Terima Naskah"
   ↓
8. Dialog konfirmasi
   ↓
9. EditorReviewService.mulaiReview()
   ↓
10. PUT /api/review/:id { status: 'dalam_proses' }
   ↓
11. Snackbar sukses → Navigate back
   ↓
12. NaskahMasukPage refresh data
```

## 🎨 UI Design Pattern

### Theme Configuration
Menggunakan `AppTheme` dari `theme.dart`:
- **Primary Color:** `AppTheme.primaryGreen` (#0F766E)
- **Background:** `AppTheme.backgroundWhite`
- **Text Styles:** 
  - `AppTheme.headingMedium` - AppBar title
  - `AppTheme.headingSmall` - Section titles
  - `AppTheme.bodyLarge` - Body text

### Status Badge Colors
```dart
StatusReview.ditugaskan    → AppTheme.yellow (Pending)
StatusReview.dalam_proses  → Colors.blue (In Progress)
StatusReview.selesai       → AppTheme.primaryGreen (Success)
StatusReview.dibatalkan    → AppTheme.errorRed (Cancelled)
```

### Component Structure
```
Scaffold
├── AppBar (primaryGreen)
├── Body (Stack)
│   ├── SingleChildScrollView
│   │   ├── Status Badge
│   │   ├── Informasi Naskah Card
│   │   ├── Sinopsis Card
│   │   ├── Informasi Review Card
│   │   └── Feedback List Card (jika ada)
│   └── Fixed Button (bottom)
│       └── "Terima Naskah" Button
```

## 🔧 Error Handling

### 1. Network Errors
```dart
try {
  final response = await EditorReviewService.getReviewById(reviewId);
  // Handle response
} catch (e) {
  setState(() {
    _errorMessage = 'Terjadi kesalahan: ${e.toString()}';
  });
}
```

### 2. No Token (401)
```dart
if (accessToken == null) {
  return ReviewDetailResponse(
    sukses: false,
    pesan: 'Token tidak ditemukan. Silakan login kembali.',
  );
}
```

### 3. Review Not Found (404)
```dart
if (response.statusCode != 200) {
  return ReviewDetailResponse(
    sukses: false,
    pesan: responseData['pesan'] ?? 'Gagal mengambil detail review',
  );
}
```

### 4. Update Failed
```dart
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(
    content: Text(response.pesan),
    backgroundColor: AppTheme.errorRed,
  ),
);
```

## 🔐 Authorization

Service menggunakan JWT Bearer Token:
```dart
final accessToken = await AuthService.getAccessToken();

headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer $accessToken',
}
```

## 🧪 Testing Checklist

### Functional Tests
- [ ] Load review detail dengan ID valid
- [ ] Load review detail dengan ID invalid (error handling)
- [ ] Display semua informasi naskah dengan benar
- [ ] Display status badge dengan warna yang tepat
- [ ] Button "Terima Naskah" hanya muncul jika status = ditugaskan
- [ ] Dialog konfirmasi muncul saat klik button
- [ ] Update status berhasil (ditugaskan → dalam_proses)
- [ ] Snackbar sukses muncul setelah update
- [ ] Navigate back ke list setelah sukses
- [ ] List di-refresh setelah kembali dari detail

### UI/UX Tests
- [ ] Loading indicator muncul saat fetch data
- [ ] Loading indicator muncul di button saat update
- [ ] Error message ditampilkan dengan jelas
- [ ] Button "Coba Lagi" berfungsi di error state
- [ ] Scroll smooth dengan banyak feedback
- [ ] Fixed button tetap di bottom saat scroll
- [ ] Shadow di fixed button terlihat
- [ ] Spacing dan padding konsisten
- [ ] Typography sesuai theme

### Edge Cases
- [ ] Review tanpa kategori (nullable)
- [ ] Review tanpa genre (nullable)
- [ ] Review tanpa sinopsis (nullable)
- [ ] Review tanpa jumlah halaman (nullable)
- [ ] Review tanpa feedback (empty list)
- [ ] Penulis tanpa profil lengkap (nullable fields)
- [ ] Network timeout
- [ ] Token expired saat di halaman

## 📝 Catatan Perbaikan

### Issue #1: Package intl Not Found
**Error:** `Target of URI doesn't exist: 'package:intl/intl.dart'`

**Solusi:** Menggunakan format date manual tanpa package intl
```dart
String _formatDate(DateTime? date) {
  if (date == null) return '-';
  
  final months = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  return '${date.day} ${months[date.month]} ${date.year}';
}
```

### Issue #2: Field Name Mismatch
**Error:** `The getter 'namaPenulis' isn't defined for the type 'NaskahInfo'`

**Solusi:** Menggunakan struktur nested yang benar
```dart
// ❌ SALAH
_review!.naskah.namaPenulis

// ✅ BENAR
_review!.naskah.penulis!.profilPengguna?.namaLengkap ?? 
_review!.naskah.penulis!.email
```

### Issue #3: Type Mismatch for Kategori & Genre
**Error:** `The argument type 'KategoriInfo?' can't be assigned to the parameter type 'String'`

**Solusi:** Akses nested property `.nama`
```dart
// ❌ SALAH
_review!.naskah.kategori

// ✅ BENAR
_review!.naskah.kategori!.nama
```

### Issue #4: Feedback Field Names
**Error:** `The getter 'judul' isn't defined for the type 'FeedbackReview'`

**Solusi:** Menggunakan field yang benar dari model
```dart
// Model FeedbackReview:
// - bab (optional)
// - halaman (optional)
// - komentar (required)

// ✅ BENAR
if (fb.bab != null)
  Text('Bab: ${fb.bab}')
if (fb.halaman != null)
  Text('Halaman: ${fb.halaman}')
Text(fb.komentar)
```

## 🚀 Future Enhancements

### 1. Tambah Feedback dari Detail Page
- Button "Tambah Feedback" di detail page
- Form untuk input bab, halaman, dan komentar
- Realtime update feedback list

### 2. Preview Naskah PDF
- Button "Lihat Naskah" yang membuka PDF viewer
- Download naskah untuk review offline

### 3. Tolak Review
- Button "Tolak Review" untuk editor yang tidak bisa review
- Input alasan penolakan
- Notifikasi ke admin untuk reassignment

### 4. Realtime Updates
- WebSocket untuk update realtime status
- Notifikasi jika ada perubahan dari admin

### 5. History Log
- Timeline perubahan status review
- Log aktivitas (kapan diterima, kapan selesai, dll)

## 📚 Referensi

### Models
- `ReviewNaskah` - lib/models/editor/review_models.dart
- `StatusReview` - lib/models/editor/review_models.dart
- `NaskahInfo` - lib/models/editor/review_models.dart
- `FeedbackReview` - lib/models/editor/review_models.dart

### Services
- `EditorReviewService` - lib/services/editor/review_service.dart
- `AuthService` - lib/services/general/auth_service.dart

### Related Pages
- `NaskahMasukPage` - lib/pages/editor/naskah/naskah_masuk_page.dart
- `EditorMainPage` - lib/pages/editor/editor_main_page.dart

### Backend Endpoints
- `GET /api/review/:id` - Get review detail
- `PUT /api/review/:id` - Update review status
- Dokumentasi lengkap: backend/src/modules/review/

---

**Status:** ✅ Ready for Testing  
**Next Step:** User Acceptance Testing (UAT) dengan editor role
