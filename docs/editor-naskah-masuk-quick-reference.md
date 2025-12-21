# Quick Reference - Editor Naskah Masuk (Review System)

## 🚀 How to Use

### Untuk Editor

1. **Login sebagai Editor**
2. **Navigasi ke "Naskah Masuk"**
3. **Filter Review**:
   - Tap chip "Semua" untuk melihat semua review
   - Tap chip "Ditugaskan" untuk review baru
   - Tap chip "Dalam Proses" untuk review yang sedang dikerjakan
   - Tap chip "Selesai" untuk review yang sudah selesai

4. **Lihat Detail Review**:
   - Tap pada card review untuk membuka halaman detail
   - Di detail page, bisa tambah feedback, submit rekomendasi, dll.

### Status Review Workflow

```
┌─────────────┐
│ ditugaskan  │ ← Review baru, belum dikerjakan
└──────┬──────┘
       │ Editor mulai review
       ▼
┌─────────────┐
│ dalam_proses│ ← Sedang dikerjakan
└──────┬──────┘
       │ Editor submit rekomendasi
       ▼
┌─────────────┐
│   selesai   │ ← Review selesai dengan rekomendasi
└─────────────┘
```

## 🔧 Developer Reference

### Import Models
```dart
import 'package:publishify/models/editor/review_models.dart';
import 'package:publishify/services/editor/naskah_masuk_service.dart';
```

### Load Reviews
```dart
final response = await NaskahMasukService.ambilNaskahMasuk(
  halaman: 1,
  limit: 100,
  status: StatusReview.ditugaskan, // Optional filter
);

if (response.sukses && response.data != null) {
  List<ReviewNaskah> reviews = response.data!;
  // Process reviews
}
```

### Access Review Data
```dart
ReviewNaskah review = _reviewList[index];

// Naskah info
String judulNaskah = review.naskah.judul;
String namaPenulis = review.naskah.penulis?.profilPengguna?.namaLengkap ?? 'Unknown';

// Review info
StatusReview status = review.status;
DateTime ditugaskan = review.ditugaskanPada;
Rekomendasi? rekomendasi = review.rekomendasi;
int? feedbackCount = review.feedbackCount;
```

### Status Colors
```dart
Color getStatusColor(StatusReview status) {
  switch (status) {
    case StatusReview.ditugaskan:
      return Colors.orange;
    case StatusReview.dalam_proses:
      return Colors.blue;
    case StatusReview.selesai:
      return Colors.green;
    case StatusReview.dibatalkan:
      return Colors.red;
  }
}
```

## 📊 API Examples

### Get All Reviews
```bash
GET /api/review/editor/saya?halaman=1&limit=20
Authorization: Bearer <token>
```

### Get Reviews by Status
```bash
# Hanya review yang ditugaskan
GET /api/review/editor/saya?status=ditugaskan

# Hanya review dalam proses
GET /api/review/editor/saya?status=dalam_proses

# Hanya review selesai
GET /api/review/editor/saya?status=selesai
```

## 🎨 UI Components

### Status Badge
```dart
Widget _buildStatusBadge(StatusReview status) {
  return Container(
    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    decoration: BoxDecoration(
      color: _getStatusColor(status).withOpacity(0.2),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      _getStatusLabel(status),
      style: TextStyle(
        color: _getStatusColor(status),
        fontWeight: FontWeight.bold,
      ),
    ),
  );
}
```

### Rekomendasi Badge
```dart
if (review.rekomendasi != null)
  Container(
    padding: EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: _getRekomendasiColor(review.rekomendasi!).withOpacity(0.1),
      border: Border.all(color: _getRekomendasiColor(review.rekomendasi!)),
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(
      children: [
        Icon(_getRekomendasiIcon(review.rekomendasi!)),
        Text('Rekomendasi: ${_getRekomendasiLabel(review.rekomendasi!)}'),
      ],
    ),
  )
```

## 🐛 Troubleshooting

### Review list kosong
**Problem**: API returns empty array
**Solution**:
1. Pastikan user sudah login sebagai editor
2. Cek apakah ada review yang ditugaskan ke editor tersebut
3. Test endpoint di Postman/Thunder Client
4. Verify token valid

### Filter tidak bekerja
**Problem**: Filter chips tidak mengubah data
**Solution**:
1. Pastikan `_loadReviewMasuk()` dipanggil setelah setState
2. Check query params di console log
3. Verify backend accepts `status` parameter

### Navigation error
**Problem**: Route '/editor/review/detail' not found
**Solution**:
1. Tambahkan route di main.dart atau router config
2. Pastikan route menerima review ID sebagai argument

## 📚 Related Files

- **Service**: `lib/services/editor/naskah_masuk_service.dart`
- **Page**: `lib/pages/editor/naskah/naskah_masuk_page.dart`
- **Models**: `lib/models/editor/review_models.dart`
- **Backend Controller**: `backend/src/modules/review/review.controller.ts`
- **Backend Service**: `backend/src/modules/review/review.service.ts`

---

**Last Updated**: 2024-01-15
