# Upload Naskah Fix - Dokumentasi Perbaikan

## 🐛 Masalah yang Ditemukan

**Error Backend**: Validasi gagal saat upload naskah baru

**Log Backend**:
```json
{
  "judul": "Hemat",
  "sinopsis": "Hemat",
  "idKategori": "Mystery",    // ❌ SALAH: Nama kategori
  "idGenre": "Drama",          // ❌ SALAH: Nama genre
  ...
}
```

### Penyebab

Backend **BuatNaskahDto** validation membutuhkan:
- `idKategori`: **UUID** (contoh: `"cb2147c6-09eb-48a8-b112-b805e3f9cdb7"`)
- `idGenre`: **UUID** (contoh: `"1f912990-9b2b-4cc3-8812-24a3047ed462"`)
- `sinopsis`: Minimal **50 karakter**

Frontend `upload_book_page.dart` mengirim **nama** (string) bukan **ID** (UUID):
```dart
// ❌ SALAH - Dropdown menyimpan NAMA
DropdownMenuItem(value: kategori.nama, ...);  // "Mystery"
DropdownMenuItem(value: genre.nama, ...);     // "Drama"
```

## ✅ Solusi yang Diterapkan

### File: `lib/pages/upload/upload_book_page.dart`

#### 1. Variable State Changes

**SEBELUM**:
```dart
String? _selectedCategory;  // Menyimpan NAMA
String? _selectedGenre;     // Menyimpan NAMA
```

**SESUDAH**:
```dart
String? _selectedCategoryId;  // Menyimpan ID (UUID)
String? _selectedGenreId;      // Menyimpan ID (UUID)
```

#### 2. Dropdown Kategori - Menyimpan ID

**SEBELUM**:
```dart
items: _kategoris.map((kategori) {
  return DropdownMenuItem(
    value: kategori.nama,      // ❌ Simpan NAMA
    child: Text(kategori.nama),
  );
}).toList(),
onChanged: (value) {
  setState(() {
    _selectedCategory = value;  // ❌ Simpan NAMA
  });
},
```

**SESUDAH**:
```dart
items: _kategoris.map((kategori) {
  return DropdownMenuItem(
    value: kategori.id,         // ✅ Simpan ID (UUID)
    child: Text(kategori.nama), // Tampilkan NAMA
  );
}).toList(),
onChanged: (value) {
  setState(() {
    _selectedCategoryId = value;  // ✅ Simpan ID
  });
},
```

#### 3. Dropdown Genre - Menyimpan ID

**SEBELUM**:
```dart
items: _genres.map((genre) {
  return DropdownMenuItem(
    value: genre.nama,       // ❌ Simpan NAMA
    child: Text(genre.nama),
  );
}).toList(),
onChanged: (value) {
  setState(() {
    _selectedGenre = value;  // ❌ Simpan NAMA
  });
},
```

**SESUDAH**:
```dart
items: _genres.map((genre) {
  return DropdownMenuItem(
    value: genre.id,          // ✅ Simpan ID (UUID)
    child: Text(genre.nama),  // Tampilkan NAMA
  );
}).toList(),
onChanged: (value) {
  setState(() {
    _selectedGenreId = value;  // ✅ Simpan ID
  });
},
```

#### 4. Handle Submit - Kirim ID

**SEBELUM**:
```dart
void _handleNext() {
  if (_formKey.currentState!.validate()) {
    if (_selectedCategory == null) {  // ❌ Check nama
      // show error
    }
    if (_selectedGenre == null) {     // ❌ Check nama
      // show error
    }

    final submission = BookSubmission(
      // ...
      category: _selectedCategory!,  // ❌ Kirim NAMA
      genre: _selectedGenre!,         // ❌ Kirim NAMA
      // ...
    );
  }
}
```

**SESUDAH**:
```dart
void _handleNext() {
  if (_formKey.currentState!.validate()) {
    if (_selectedCategoryId == null) {  // ✅ Check ID
      // show error
    }
    if (_selectedGenreId == null) {     // ✅ Check ID
      // show error
    }

    final submission = BookSubmission(
      // ...
      category: _selectedCategoryId!,  // ✅ Kirim ID (UUID)
      genre: _selectedGenreId!,         // ✅ Kirim ID (UUID)
      // ...
    );
  }
}
```

#### 5. Validasi Sinopsis - Minimal 50 Karakter

**SEBELUM**:
```dart
TextFormField(
  controller: _synopsisController,
  maxLines: 6,
  validator: (value) {
    if (value == null || value.isEmpty) {
      return 'Sinopsis harus diisi';
    }
    return null;  // ❌ Tidak ada validasi minimal karakter
  },
  // ...
)
```

**SESUDAH**:
```dart
TextFormField(
  controller: _synopsisController,
  maxLines: 6,
  validator: (value) {
    if (value == null || value.isEmpty) {
      return 'Sinopsis harus diisi';
    }
    if (value.trim().length < 50) {
      return 'Sinopsis minimal 50 karakter';  // ✅ Validasi minimal
    }
    if (value.trim().length > 2000) {
      return 'Sinopsis maksimal 2000 karakter';  // ✅ Validasi maksimal
    }
    return null;
  },
  // ...
)
```

## 📊 Backend Validation Rules

Dari `backend/src/modules/naskah/dto/buat-naskah.dto.ts`:

```typescript
export const BuatNaskahSchema = z.object({
  judul: z.string()
    .min(3, 'Judul minimal 3 karakter')
    .max(200, 'Judul maksimal 200 karakter'),
  
  sinopsis: z.string()
    .min(50, 'Sinopsis minimal 50 karakter')      // ✅ 50 chars
    .max(2000, 'Sinopsis maksimal 2000 karakter'),
  
  idKategori: z.string()
    .uuid('ID kategori harus berupa UUID'),        // ✅ UUID required
  
  idGenre: z.string()
    .uuid('ID genre harus berupa UUID'),           // ✅ UUID required
  
  // Optional fields
  subJudul: z.string().max(200).optional().nullable(),
  isbn: z.string().optional().nullable(),
  urlFile: z.string().url().optional().nullable(),
  publik: z.boolean().default(false).optional(),
});
```

## 🧪 Cara Testing

### 1. Test Load Kategori & Genre
1. Buka halaman Upload
2. **Verifikasi**: Dropdown kategori dan genre terisi dengan data
3. **Check**: Console tidak ada error

### 2. Test Dropdown Selection
1. Pilih kategori dari dropdown
2. Pilih genre dari dropdown
3. **Verifikasi**: Dropdown menampilkan **nama** yang dipilih
4. **Internal**: State menyimpan **ID** (UUID)

### 3. Test Validasi Sinopsis
1. Isi form upload
2. Isi sinopsis dengan **kurang dari 50 karakter**
3. Tap "Next"
4. **Expected**: Error "Sinopsis minimal 50 karakter"

### 4. Test Upload Naskah (Happy Path)
1. Isi form dengan data valid:
   - Judul: min 3 karakter
   - Nama Penulis
   - Tahun Penulisan
   - Jumlah BAB
   - **Kategori**: Pilih dari dropdown ✅
   - **Genre**: Pilih dari dropdown ✅
   - **Sinopsis**: Min 50 karakter ✅
2. Tap "Next"
3. Upload file DOC/DOCX
4. Tap "Submit"
5. **Expected**: 
   - ✅ Success: "Naskah berhasil diupload!"
   - Kembali ke home page
   - Naskah muncul di daftar

### 5. Test Request Body (Developer)
```dart
// Debug print sebelum API call di upload_file_page.dart:
print('CREATE NASKAH REQUEST:');
print('- judul: ${widget.submission.title}');
print('- idKategori: ${widget.submission.category}');  // Harus UUID!
print('- idGenre: ${widget.submission.genre}');        // Harus UUID!
print('- sinopsis length: ${widget.submission.synopsis.length}');  // >= 50
```

**Expected Request Body**:
```json
{
  "judul": "Judul Buku",
  "sinopsis": "Sinopsis minimal 50 karakter...",
  "idKategori": "cb2147c6-09eb-48a8-b112-b805e3f9cdb7",  // ✅ UUID
  "idGenre": "1f912990-9b2b-4cc3-8812-24a3047ed462",     // ✅ UUID
  "isbn": "12",
  "publik": false,
  "urlFile": "/uploads/naskah/xxx.docx"
}
```

## 📋 Checklist Perbaikan

- [x] Ubah `_selectedCategory` → `_selectedCategoryId` (UUID)
- [x] Ubah `_selectedGenre` → `_selectedGenreId` (UUID)
- [x] Dropdown kategori simpan `kategori.id` bukan `kategori.nama`
- [x] Dropdown genre simpan `genre.id` bukan `genre.nama`
- [x] Update `_handleNext()` untuk kirim ID
- [x] Tambah validasi sinopsis minimal 50 karakter
- [x] Tambah validasi sinopsis maksimal 2000 karakter
- [x] Test compile (`flutter analyze`) - ✅ NO ISSUES
- [x] Dokumentasi dibuat

## 🔍 Debug Tips

Jika masih ada error validasi:

1. **Check Request Body**:
```dart
// Di upload_file_page.dart sebelum POST /api/naskah
print('Request body: ${jsonEncode(body)}');
```

2. **Check Backend Log**:
```bash
# Di terminal backend
cd backend
# Log akan menampilkan body request dan error detail
```

3. **Check UUID Format**:
```dart
// Pastikan ID adalah UUID format:
// ✅ Benar: "cb2147c6-09eb-48a8-b112-b805e3f9cdb7"
// ❌ Salah: "Mystery" atau "Drama"
```

## 📖 References

- Backend DTO: `backend/src/modules/naskah/dto/buat-naskah.dto.ts`
- Backend Controller: `backend/src/modules/naskah/naskah.controller.ts`
- Frontend Upload: `lib/pages/upload/upload_book_page.dart`
- Frontend Service: `lib/services/naskah_service.dart`
- Backend API: `POST /api/naskah`

---

**Tanggal Perbaikan**: 10 November 2025
**Status**: ✅ COMPLETED
**Tested**: Ready untuk manual testing
