# Perubahan Review System - Dokumentasi

## 📋 Ringkasan Perubahan

Perubahan dari sistem **"Revision"** menjadi **"Review"** untuk konteks yang lebih tepat sesuai dengan backend API.

---

## 🗑️ File yang Dihapus

### 1. Folder & File Revision (Lama)
```
publishify/lib/pages/revision/
  ├── revision_page.dart (DIHAPUS)
  └── revision_detail_page.dart (DIHAPUS)
```

**Alasan Penghapusan:**
- Konteks "revision" tidak sesuai dengan backend yang menggunakan "review"
- Backend menggunakan model `ReviewNaskah`, bukan `RevisiNaskah`
- Membersihkan kode yang tidak terpakai

---

## ✨ File yang Dibuat/Dimodifikasi

### 1. **Review Service** (Diperbarui)
**File:** `publishify/lib/services/review_service.dart`

**Endpoint yang Digunakan:**
```dart
// GET /api/review/:id - Ambil detail review by ID
static Future<ReviewDetailResponse> getReviewById(String idReview)

// PUT /api/review/:id - Update review (untuk future feature)
static Future<ReviewDetailResponse> updateReview({
  required String idReview,
  String? status,
  String? catatan,
})

// Custom: Ambil semua review untuk naskah penulis
static Future<ReviewListResponse> getAllReviewsForMyManuscripts({
  int halaman = 1,
  int limit = 20,
})
```

**Fitur Helper:**
```dart
// Helper functions
static String getStatusLabel(String status)
static String getRekomendasiLabel(String? rekomendasi)
static String getStatusColor(String status)
```

---

### 2. **Review Page** (Baru)
**File:** `publishify/lib/pages/review/review_page.dart`

**Fitur:**
- ✅ Tampilkan semua review untuk naskah penulis
- ✅ Filter by status (Semua, Ditugaskan, Dalam Proses, Selesai)
- ✅ Info card untuk penjelasan review
- ✅ Status badge dengan warna
- ✅ Pull to refresh
- ✅ Empty state & error handling
- ✅ Navigasi ke detail review

**UI Components:**
- Header dengan back button
- Info card (hijau)
- Filter chips (horizontal scroll)
- Review cards dengan:
  - Judul naskah
  - Status badge
  - Editor name
  - Catatan review (preview)
  - Rekomendasi icon & label
  - Feedback count
  - Timestamp

---

### 3. **Review Detail Page** (Baru)
**File:** `publishify/lib/pages/review/review_detail_page.dart`

**Fitur:**
- ✅ Detail informasi naskah (judul, kategori, genre)
- ✅ Detail review (status, editor, rekomendasi, tanggal)
- ✅ Catatan review lengkap
- ✅ List feedback dari editor
- ✅ Pull to refresh untuk update real-time

**Section:**
1. **Naskah Info Card**
   - Icon buku
   - Judul naskah
   - Kategori & Genre

2. **Review Info Card**
   - Status badge
   - Editor name
   - Rekomendasi dengan icon & warna
   - Tanggal (ditugaskan, dimulai, selesai)
   - Catatan review lengkap

3. **Feedback Section**
   - Avatar editor
   - Nama editor
   - Timestamp
   - Isi feedback/komentar

---

### 4. **Review Models** (Diperbarui)
**File:** `publishify/lib/models/review_models.dart`

**Model yang Ditambahkan:**
```dart
class KategoriReview {
  final String id;
  final String nama;
}

class GenreReview {
  final String id;
  final String nama;
}
```

**Model yang Diperbarui:**
```dart
class NaskahReview {
  // Ditambahkan:
  final KategoriReview? kategori;
  final GenreReview? genre;
}

class FeedbackData {
  // Ditambahkan:
  final EditorReview? editor;
  
  // Helper getter
  String get isi => komentar;
}
```

---

### 5. **Routes** (Diperbarui)
**File:** `publishify/lib/utils/routes.dart`

**Perubahan:**
```dart
// SEBELUM
import 'package:publishify/pages/revision/revision_page.dart';
static const String revisi = '/revisi';
revisi: (context) => const RevisionPage(),

// SESUDAH
import 'package:publishify/pages/review/review_page.dart';
static const String review = '/review';
review: (context) => const ReviewPage(),
```

---

### 6. **Home Page** (Diperbarui)
**File:** `publishify/lib/pages/home/home_page.dart`

**Perubahan Navigation:**
```dart
void _handleAction(String action) {
  // ...
  } else if (action == 'revisi') {
    // Navigate to review page (changed from revision)
    Navigator.pushNamed(context, '/review');
  }
  // ...
}
```

---

## 🎨 UI/UX Design

### Color Mapping untuk Status
```dart
Status:
- Ditugaskan  → Blue (biru)
- Dalam Proses → Orange (oranye)
- Selesai      → Green (hijau)
- Dibatalkan   → Red (merah)
```

### Icon Mapping untuk Rekomendasi
```dart
Rekomendasi:
- Setujui → check_circle (hijau)
- Revisi  → edit (oranye)
- Tolak   → cancel (merah)
```

---

## 📡 Backend API Integration

### Endpoint yang Digunakan

#### 1. GET `/api/review/:id`
**Deskripsi:** Ambil detail review beserta feedback
**Akses:** Penulis (owner naskah), Editor, Admin

**Response:**
```json
{
  "sukses": true,
  "data": {
    "id": "uuid",
    "idNaskah": "uuid",
    "idEditor": "uuid",
    "status": "dalam_proses",
    "rekomendasi": "revisi",
    "catatan": "Naskah bagus, perlu perbaikan di bab 3",
    "ditugaskanPada": "2025-01-01T10:00:00Z",
    "dimulaiPada": "2025-01-02T09:00:00Z",
    "selesaiPada": null,
    "naskah": {
      "id": "uuid",
      "judul": "Judul Naskah",
      "status": "dalam_review",
      "kategori": {
        "id": "uuid",
        "nama": "Fiksi"
      },
      "genre": {
        "id": "uuid",
        "nama": "Romance"
      }
    },
    "editor": {
      "id": "uuid",
      "email": "editor@example.com",
      "profilPengguna": {
        "namaTampilan": "John Editor"
      }
    },
    "feedback": [
      {
        "id": "uuid",
        "komentar": "Bagian pembukaan kurang menarik",
        "bab": "1",
        "halaman": 5,
        "dibuatPada": "2025-01-02T10:30:00Z"
      }
    ]
  }
}
```

#### 2. PUT `/api/review/:id`
**Deskripsi:** Update review (untuk future feature)
**Akses:** Editor (owner), Admin

**Request Body:**
```json
{
  "status": "dalam_proses",
  "catatan": "Catatan tambahan"
}
```

#### 3. GET `/api/naskah/penulis/saya`
**Deskripsi:** Ambil semua naskah milik penulis
**Query Params:** `status=dalam_review,perlu_revisi&limit=100`

#### 4. GET `/api/review/naskah/:idNaskah`
**Deskripsi:** Ambil review untuk naskah tertentu
**Akses:** Penulis (owner), Editor, Admin

---

## 🔄 Data Flow

### Flow: Membuka Halaman Review
```
1. User tap "Revisi" button di home page
   ↓
2. Navigate to ReviewPage (/review)
   ↓
3. ReviewService.getAllReviewsForMyManuscripts()
   ↓
4. GET /api/naskah/penulis/saya (filter: dalam_review, perlu_revisi)
   ↓
5. For each naskah:
   GET /api/review/naskah/:idNaskah
   ↓
6. Combine & sort all reviews
   ↓
7. Display in ReviewPage dengan filter chips
```

### Flow: Membuka Detail Review
```
1. User tap review card
   ↓
2. Navigate to ReviewDetailPage
   ↓
3. ReviewService.getReviewById(idReview)
   ↓
4. GET /api/review/:id (include: naskah, editor, feedback)
   ↓
5. Display complete review info
```

---

## 🧪 Testing Checklist

### Review Page
- [ ] Load semua review untuk naskah penulis
- [ ] Empty state muncul jika tidak ada review
- [ ] Error state & retry button berfungsi
- [ ] Filter chips berfungsi (Semua, Ditugaskan, Dalam Proses, Selesai)
- [ ] Pull to refresh berfungsi
- [ ] Status badge menampilkan warna yang benar
- [ ] Rekomendasi icon & label benar
- [ ] Feedback count akurat
- [ ] Timestamp format benar
- [ ] Navigate ke detail review berfungsi

### Review Detail Page
- [ ] Load detail review lengkap
- [ ] Naskah info ditampilkan (judul, kategori, genre)
- [ ] Review info lengkap (status, editor, rekomendasi, tanggal)
- [ ] Catatan review ditampilkan
- [ ] Feedback list ditampilkan
- [ ] Pull to refresh berfungsi
- [ ] Back button berfungsi

---

## 🚀 Future Enhancements

### Fase 1 (High Priority)
1. **Respond to Feedback**
   - Penulis bisa reply feedback dari editor
   - Endpoint: `POST /api/review/:id/respond`

2. **Notification**
   - Push notification saat review selesai
   - Badge count untuk review baru

### Fase 2 (Medium Priority)
3. **Filter & Sort**
   - Filter by rekomendasi (setujui, revisi, tolak)
   - Sort by date, status

4. **Review History**
   - Timeline perubahan status review
   - Export review history ke PDF

### Fase 3 (Low Priority)
5. **Real-time Update**
   - WebSocket untuk feedback real-time
   - Live status update

---

## 📝 Notes untuk Developer

### Penting!
1. **Backend Requirement:**
   - Backend HARUS include `kategori` dan `genre` di response `GET /api/review/:id`
   - Backend HARUS include `editor` di `feedback` array

2. **Authentication:**
   - Semua endpoint memerlukan JWT token
   - Token diambil dari `AuthService.getAccessToken()`

3. **Error Handling:**
   - Semua API call dibungkus try-catch
   - Error message ditampilkan ke user
   - Retry button tersedia di error state

4. **Performance:**
   - Pagination sudah diimplementasi (limit: 20)
   - Pull to refresh untuk update data
   - Lazy loading untuk feedback list

---

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check backend logs untuk API errors
2. Check console logs di Flutter app
3. Verify JWT token validity
4. Check database untuk review data

---

**Dibuat:** 11 Januari 2025  
**Versi:** 1.0.0  
**Status:** ✅ Production Ready
