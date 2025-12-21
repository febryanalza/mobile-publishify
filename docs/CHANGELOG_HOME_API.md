# Changelog - Home Page API Integration

## Tanggal: November 5, 2025
## Fase: 24

### ✅ Fitur Baru: Data Naskah Real dari API

#### 1. Model Update - Naskah Complete Structure

**File Dimodifikasi:**
- `lib/models/naskah_models.dart`

**Struktur Data Lengkap:**
```dart
class NaskahListResponse {
  final bool sukses;
  final String pesan;
  final List<NaskahData>? data;
  final MetaData? metadata;
}

class NaskahData {
  final String id;
  final String judul;
  final String? subJudul;
  final String sinopsis;
  final String? isbn;
  final String status;
  final String? urlSampul;
  final int jumlahHalaman;
  final int jumlahKata;
  final bool publik;
  final String dibuatPada;
  final String diperbaruiPada;
  final NaskahPenulis? penulis;
  final NaskahKategori? kategori;
  final NaskahGenre? genre;
  final NaskahCount? count;
}
```

**Nested Models:**
- `NaskahPenulis` (id, email, profilPengguna, profilPenulis)
- `ProfilPengguna` (namaDepan, namaBelakang, namaTampilan, urlAvatar)
- `ProfilPenulis` (namaPena, ratingRataRata)
- `NaskahKategori` (id, nama, slug)
- `NaskahGenre` (id, nama, slug)
- `NaskahCount` (revisi, review)
- `MetaData` (total, halaman, limit, totalHalaman)

#### 2. Home Page Integration

**File Dimodifikasi:**
- `lib/pages/home/home_page.dart`

**Perubahan Utama:**

1. **Removed Dummy Data**
   - ❌ Tidak lagi menggunakan "Mari Menulis" dummy
   - ❌ Tidak lagi menggunakan data hardcoded
   - ✅ Semua data dari API `/api/naskah/penulis/saya`

2. **API Integration**
   ```dart
   // Fetch ALL naskah (no status filter)
   final response = await NaskahService.getNaskahSaya(
     halaman: 1,
     limit: 20,
   );
   ```

3. **Author Name Priority**
   ```dart
   // Priority: namaPena > namaTampilan > userName > "Anda"
   if (naskah.penulis?.profilPenulis?.namaPena != null) {
     authorName = naskah.penulis!.profilPenulis!.namaPena;
   } else if (naskah.penulis?.profilPengguna?.namaTampilan != null) {
     authorName = naskah.penulis!.profilPengguna!.namaTampilan;
   }
   ```

4. **Page Count Calculation**
   ```dart
   // Use jumlahHalaman if available, else calculate from words
   pageCount: naskah.jumlahHalaman > 0 
       ? naskah.jumlahHalaman 
       : (naskah.jumlahKata / 250).round(),
   ```

5. **Empty State UI**
   - Show icon dan message ketika belum ada naskah
   - Encourage user untuk mulai menulis
   - Better UX daripada dummy data

#### 3. Data Flow

```
1. HomePage initState()
   ↓
2. _loadData()
   ↓
3. Load namaTampilan dari cache
   ↓
4. _loadNaskahFromAPI()
   ↓
5. Call API GET /api/naskah/penulis/saya
   ↓
6. Parse NaskahListResponse
   ↓
7. Convert NaskahData → Book model
   ↓
8. Get status count
   ↓
9. setState() → UI update
   ↓
10. Display books atau empty state
```

#### 4. API Response Structure

**Endpoint:** `GET /api/naskah/penulis/saya`

**Response:**
```json
{
  "sukses": true,
  "pesan": "Data naskah berhasil diambil",
  "data": [
    {
      "id": "uuid",
      "judul": "string",
      "subJudul": "string|null",
      "sinopsis": "string",
      "isbn": "string|null",
      "status": "draft|dalam_review|diterbitkan",
      "urlSampul": "string|null",
      "jumlahHalaman": number,
      "jumlahKata": number,
      "publik": boolean,
      "dibuatPada": "ISO8601",
      "diperbaruiPada": "ISO8601",
      "penulis": {
        "id": "uuid",
        "email": "string",
        "profilPengguna": {
          "namaDepan": "string",
          "namaBelakang": "string",
          "namaTampilan": "string",
          "urlAvatar": "string|null"
        },
        "profilPenulis": {
          "namaPena": "string",
          "ratingRataRata": "string"
        }
      },
      "kategori": {
        "id": "uuid",
        "nama": "string",
        "slug": "string"
      },
      "genre": {
        "id": "uuid",
        "nama": "string",
        "slug": "string"
      },
      "_count": {
        "revisi": number,
        "review": number
      }
    }
  ],
  "metadata": {
    "total": number,
    "halaman": number,
    "limit": number,
    "totalHalaman": number
  }
}
```

#### 5. UI/UX Improvements

**Before:**
- Dummy "Mari Menulis" book
- Nama user "Salsabila" hardcoded
- Data tidak real

**After:**
- Real data from database
- Dynamic author name dari API
- Empty state dengan icon dan message
- Loading indicator saat fetch
- Status count real dari API
- Book details lengkap (judul, subJudul, genre, kategori, dll)

#### 6. Error Handling

```dart
try {
  // API call
} catch (e) {
  // Show empty state instead of crash
  _books = [];
  _statusCount = {...};
}
```

### 📋 Testing Checklist

- [ ] Home page load data dari API saat dibuka
- [ ] Display nama user yang benar dari cache
- [ ] Show real books dari database
- [ ] Empty state tampil jika belum ada naskah
- [ ] Loading indicator muncul saat fetch
- [ ] Error handling tidak crash app
- [ ] Status count tampil dengan benar
- [ ] Book card show complete info (judul, author, status, dll)
- [ ] urlSampul handled dengan benar (null safety)

### 🔄 Dependencies

**Models:**
- NaskahListResponse
- NaskahData
- NaskahPenulis, ProfilPengguna, ProfilPenulis
- NaskahKategori, NaskahGenre
- NaskahCount
- MetaData

**Services:**
- NaskahService.getNaskahSaya()
- NaskahService.getStatusCount()
- AuthService.getNamaTampilan()

**Widgets:**
- BookCard (existing)
- StatusCard (existing)
- ActionButton (existing)

### 🚀 Next Steps

1. Test dengan backend API yang real
2. Add pull-to-refresh functionality
3. Implement filter by status
4. Add pagination untuk load more
5. Implement search functionality
6. Handle urlSampul dengan image loading
7. Add book detail page navigation
8. Cache naskah data untuk offline

### 📝 Notes

- Removed `_loadDummyData()` method completely
- Changed limit dari 6 ke 20 untuk show more books
- Removed status filter untuk show semua naskah
- Author name priority: namaPena > namaTampilan > userName
- Empty state lebih friendly daripada dummy data
- All fields from API response properly mapped
