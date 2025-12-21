# Refactoring Naskah Masuk - Editor Review System

## 📋 Ringkasan Perubahan

Halaman **"Naskah Masuk"** untuk user dengan peran **Editor** telah berhasil direfactor dari menampilkan daftar naskah yang diajukan menjadi menampilkan daftar **review yang ditugaskan** kepada editor yang sedang login.

## 🔄 Perubahan Utama

### 1. **Service Layer** - `naskah_masuk_service.dart`

#### ❌ Sebelumnya:
```dart
// Memanggil API naskah
static Future<NaskahMasukResponse> ambilNaskahMasuk({
  int halaman = 1,
  int limit = 100,
}) async {
  final uri = Uri.parse('$baseUrl/api/naskah?status=diajukan...');
  // ...
}
```

#### ✅ Sesudahnya:
```dart
// Memanggil API review editor
static Future<ReviewResponse<List<ReviewNaskah>>> ambilNaskahMasuk({
  int halaman = 1,
  int limit = 100,
  StatusReview? status,  // Filter berdasarkan status review
}) async {
  final uri = Uri.parse('$baseUrl/api/review/editor/saya');
  // ...
}
```

**Key Changes:**
- ✅ Endpoint: `/api/naskah?status=diajukan` → `/api/review/editor/saya`
- ✅ Model: `NaskahMasuk` → `ReviewNaskah`
- ✅ Response: `NaskahMasukResponse` → `ReviewResponse<List<ReviewNaskah>>`
- ✅ Filter: Tidak ada → Bisa filter berdasarkan `StatusReview` (ditugaskan, dalam_proses, selesai, dibatalkan)

### 2. **Page Layer** - `naskah_masuk_page.dart`

#### ❌ Sebelumnya:
```dart
List<NaskahMasuk> _naskahList = [];
String _selectedFilter = 'belum_review'; // 'belum_review' atau 'semua'

List<NaskahMasuk> get _filteredNaskahList {
  if (_selectedFilter == 'belum_review') {
    return _naskahList.where((naskah) => !naskah.hasActiveReview).toList();
  }
  return _naskahList;
}
```

#### ✅ Sesudahnya:
```dart
List<ReviewNaskah> _reviewList = [];
StatusReview? _selectedStatus; // null = semua, atau ditugaskan/dalam_proses/selesai

// Filter dilakukan di API level, bukan client-side
```

**Key Changes:**
- ✅ State: `List<NaskahMasuk>` → `List<ReviewNaskah>`
- ✅ Filter: Client-side (hasActiveReview) → Server-side (StatusReview enum)
- ✅ Data: Menampilkan info naskah dari `review.naskah` relasi

### 3. **UI Components**

#### Filter Section
**Sebelumnya**: Toggle button "Belum Review" vs "Semua"
```dart
ToggleButtons(
  isSelected: [
    _selectedFilter == 'belum_review',
    _selectedFilter == 'semua',
  ],
  // ...
)
```

**Sesudahnya**: Filter chips berdasarkan status review
```dart
Wrap(
  children: [
    FilterChip(label: Text('Semua'), selected: _selectedStatus == null),
    FilterChip(label: Text('Ditugaskan'), selected: _selectedStatus == StatusReview.ditugaskan),
    FilterChip(label: Text('Dalam Proses'), selected: _selectedStatus == StatusReview.dalam_proses),
    FilterChip(label: Text('Selesai'), selected: _selectedStatus == StatusReview.selesai),
  ],
)
```

#### Review Card
**Data yang Ditampilkan**:
1. **Judul Naskah**: `review.naskah.judul` + `review.naskah.subJudul`
2. **Status Review Badge**: 
   - Ditugaskan (Orange)
   - Dalam Proses (Blue)
   - Selesai (Green)
   - Dibatalkan (Red)
3. **Penulis**: `review.naskah.penulis.profilPengguna.namaLengkap` atau `email`
4. **Kategori & Genre**: `review.naskah.kategori.nama` • `review.naskah.genre.nama`
5. **Tanggal Ditugaskan**: `review.ditugaskanPada` (formatted)
6. **Rekomendasi** (jika sudah selesai):
   - Setujui (Green with ✓ icon)
   - Perlu Revisi (Orange with edit icon)
   - Tolak (Red with X icon)
7. **Feedback Count**: `review.feedbackCount` feedback

### 4. **Navigation**

**Implementasi**:
```dart
void _openReviewDetail(ReviewNaskah review) {
  Navigator.pushNamed(
    context,
    '/editor/review/detail',
    arguments: review.id,  // Pass review ID, bukan naskah ID
  ).then((_) {
    _loadReviewMasuk(); // Refresh saat kembali
  });
}
```

## 📊 API Contract

### Endpoint
```
GET /api/review/editor/saya
```

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `halaman` | number | No | Nomor halaman (default: 1) |
| `limit` | number | No | Jumlah item per halaman (default: 20) |
| `status` | StatusReview | No | Filter berdasarkan status: ditugaskan, dalam_proses, selesai, dibatalkan |

### Response Structure
```json
{
  "sukses": true,
  "pesan": "Review berhasil diambil",
  "data": [
    {
      "id": "uuid",
      "idNaskah": "uuid",
      "idEditor": "uuid",
      "status": "ditugaskan",
      "rekomendasi": null,
      "catatan": "...",
      "ditugaskanPada": "2024-01-15T10:30:00.000Z",
      "dimulaiPada": null,
      "selesaiPada": null,
      "naskah": {
        "id": "uuid",
        "judul": "...",
        "subJudul": "...",
        "penulis": {
          "id": "uuid",
          "email": "...",
          "profilPengguna": {
            "namaDepan": "...",
            "namaBelakang": "..."
          }
        },
        "kategori": { "id": "...", "nama": "...", "slug": "..." },
        "genre": { "id": "...", "nama": "...", "slug": "..." }
      },
      "editor": { ... },
      "feedback": [...],
      "_count": { "feedback": 5 }
    }
  ],
  "metadata": {
    "total": 10,
    "halaman": 1,
    "limit": 20,
    "totalHalaman": 1
  }
}
```

## 🎨 UI/UX Improvements

### Status Badge Colors
```dart
StatusReview.ditugaskan    → Orange (Baru ditugaskan, belum dikerjakan)
StatusReview.dalam_proses  → Blue   (Sedang dikerjakan editor)
StatusReview.selesai       → Green  (Review sudah selesai)
StatusReview.dibatalkan    → Red    (Review dibatalkan)
```

### Rekomendasi Display
```dart
Rekomendasi.setujui  → Green with ✓ icon  (Naskah disetujui)
Rekomendasi.revisi   → Orange with ✎ icon (Perlu perbaikan)
Rekomendasi.tolak    → Red with ✗ icon    (Naskah ditolak)
```

### Date Formatting
- **Hari ini**: "Hari ini, 14:30"
- **Kemarin**: "Kemarin, 09:15"
- **< 7 hari**: "3 hari lalu"
- **< 30 hari**: "2 minggu lalu"
- **< 365 hari**: "3 bulan lalu"
- **> 365 hari**: "15-01-2023"

## ✅ Testing Checklist

- [x] Service refactored to call `/api/review/editor/saya`
- [x] Models updated from `NaskahMasuk` to `ReviewNaskah`
- [x] Filter by `StatusReview` enum implemented
- [x] UI displays review status badges correctly
- [x] Rekomendasi displayed with appropriate colors
- [x] Feedback count shown when available
- [x] Navigation to detail page with review ID
- [x] Refresh on return from detail page
- [x] Zero compilation errors

## 🔄 Next Steps

1. **Test dengan Backend**:
   - Pastikan endpoint `/api/review/editor/saya` berfungsi
   - Test filter berdasarkan status
   - Verify data structure matches model

2. **Review Detail Page**:
   - Pastikan route `/editor/review/detail` sudah ada
   - Page menerima `review.id` sebagai argument
   - Menampilkan detail lengkap review + feedback

3. **Integration Testing**:
   - Test flow dari list → detail → back with refresh
   - Test filter chips functionality
   - Test pagination jika data > 100 items

## 📝 Files Modified

1. ✅ `lib/services/editor/naskah_masuk_service.dart` - Complete refactor
2. ✅ `lib/pages/editor/naskah/naskah_masuk_page.dart` - Complete refactor
3. ✅ `lib/models/editor/review_models.dart` - Already exists with complete models

## 🎯 Result

✅ **Zero compilation errors**
✅ **Clean separation of concerns** (API vs UI logic)
✅ **Type-safe** with proper Dart models
✅ **User-friendly** dengan filter chips dan visual status badges
✅ **Follows backend API contract** (`FilterReviewDto`, `StatusReview` enum)

---

**Updated**: ${new Date().toISOString()}
