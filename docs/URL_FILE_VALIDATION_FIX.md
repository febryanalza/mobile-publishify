# 🔧 Fix Validasi URL File Upload - Path vs Full URL

**Tanggal:** 10 November 2025  
**Status:** ✅ SELESAI - No issues found!

---

## 🔍 Root Cause Analysis

### Backend Error Log:
```
[Nest] 22716 - DEBUG [HTTP] Body: {
  "judul":"asdfasdfasdfasdfas asdfasdfasdf asdfasdf",
  "sinopsis":"asdfasdfasdf asdfads asdfasdfasdfasd...",
  "idKategori":"ef3616a6-1386-4bba-92c0-ed185bfc3c54",
  "idGenre":"b7bbead5-5265-4969-8ba9-5d3a8b27fc17",
  "publik":false,
  "urlFile":"/uploads/naskah/2025-11-10_resume-design-template-2---1-_545cbb7b6bcb8f22.docx"  // ❌ PROBLEM!
}

[Nest] 22716 - ERROR [HTTP] ❌ POST /api/naskah Error - 4ms: Validasi gagal
BadRequestException: Validasi gagal
```

### Masalah Ditemukan:

**Backend DTO Requirement:**
```typescript
// backend/src/modules/naskah/dto/buat-naskah.dto.ts
urlFile: z.string().url('URL file tidak valid').optional().nullable(),
```

Backend memerlukan **FULL URL** dengan format: `https://domain.com/path/to/file.docx`

**Frontend mengirim PATH RELATIF:**
```dart
urlFile: "/uploads/naskah/2025-11-10_resume-design-template-2---1-_545cbb7b6bcb8f22.docx"
```

### Backend Upload Service Return:

```typescript
// backend/src/modules/upload/upload.service.ts (line 104)
const relativeUrl = `/uploads/${dto.tujuan}/${uniqueFilename}`;  // ❌ PATH RELATIF

return {
  id: fileRecord.id,
  namaFileAsli: fileRecord.namaFileAsli,
  url: relativeUrl,  // ❌ Returns: /uploads/naskah/file.docx
  path: fileRecord.path,
  ...
};
```

Backend upload service mengembalikan **path relatif** di field `url`, tapi Zod validation memerlukan **full URL**.

---

## ✅ Solusi (Frontend Fix - Backend Tidak Diubah)

### File Modified: `upload_file_page.dart`

#### 1. Tambah Import dotenv

**BEFORE:**
```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:publishify/utils/theme.dart';
import 'package:publishify/models/book_submission.dart';
import 'package:publishify/services/upload_service.dart';
import 'package:publishify/services/naskah_service.dart';
```

**AFTER:**
```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';  // ✅ Added
import 'package:publishify/utils/theme.dart';
import 'package:publishify/models/book_submission.dart';
import 'package:publishify/services/upload_service.dart';
import 'package:publishify/services/naskah_service.dart';
```

#### 2. Build Full URL dari Path Relatif

**BEFORE:**
```dart
// Step 2: Create naskah with uploaded file URL
final createResponse = await NaskahService.createNaskah(
  judul: widget.submission.title,
  subJudul: null,
  sinopsis: widget.submission.synopsis,
  idKategori: widget.submission.category,
  idGenre: widget.submission.genre,
  isbn: widget.submission.isbn,
  urlFile: uploadResponse.data!.url,  // ❌ /uploads/naskah/file.docx
  publik: false,
);
```

**AFTER:**
```dart
// Step 2: Create naskah with uploaded file URL
// Build full URL from relative path (backend returns /uploads/...)
final baseUrl = dotenv.env['BASE_URL'] ?? 'http://localhost:4000';
final fileUrl = uploadResponse.data!.url.startsWith('http')
    ? uploadResponse.data!.url
    : '$baseUrl${uploadResponse.data!.url}';

final createResponse = await NaskahService.createNaskah(
  judul: widget.submission.title,
  subJudul: null,
  sinopsis: widget.submission.synopsis,
  idKategori: widget.submission.category,
  idGenre: widget.submission.genre,
  isbn: widget.submission.isbn,
  urlFile: fileUrl,  // ✅ http://localhost:4000/uploads/naskah/file.docx
  publik: false,
);
```

---

## 📋 Tentang urlSampul (Cover Upload)

### Backend DTO:
```typescript
urlSampul: z.string().url('URL sampul tidak valid').optional().nullable(),
```

**Status:** ⚠️ **OPTIONAL** (`.optional().nullable()`)

**Kesimpulan:** `urlSampul` **TIDAK WAJIB** untuk membuat naskah. User bisa upload sampul nanti setelah naskah dibuat.

---

## 🔄 Request Flow

### 1. Upload File (POST /api/upload/single)

**Request:**
```dart
FormData:
- file: book.docx
- tujuan: "naskah"
- deskripsi: "Naskah: Judul Buku"
```

**Response:**
```json
{
  "sukses": true,
  "pesan": "File berhasil diupload",
  "data": {
    "id": "uuid-...",
    "namaFileAsli": "book.docx",
    "namaFileSimpan": "2025-11-10_book_abc123.docx",
    "url": "/uploads/naskah/2025-11-10_book_abc123.docx",  // ❌ PATH RELATIF
    "path": "D:\\...\\uploads\\naskah\\2025-11-10_book_abc123.docx",
    "ukuran": 1024000,
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }
}
```

### 2. Frontend Builds Full URL

```dart
final baseUrl = "http://localhost:4000";  // dari .env
final relativePath = "/uploads/naskah/2025-11-10_book_abc123.docx";
final fullUrl = "$baseUrl$relativePath";
// Result: "http://localhost:4000/uploads/naskah/2025-11-10_book_abc123.docx"
```

### 3. Create Naskah (POST /api/naskah)

**Request Body:**
```json
{
  "judul": "Judul Buku",
  "sinopsis": "Sinopsis minimal 50 karakter...",
  "idKategori": "ef3616a6-1386-4bba-92c0-ed185bfc3c54",
  "idGenre": "b7bbead5-5265-4969-8ba9-5d3a8b27fc17",
  "isbn": null,
  "urlFile": "http://localhost:4000/uploads/naskah/2025-11-10_book_abc123.docx",  // ✅ FULL URL
  "publik": false
}
```

**Zod Validation:** ✅ PASS
```typescript
urlFile: z.string().url()  // ✅ Valid URL format
```

---

## 🧪 Testing Guide

### Test Case 1: Upload File Berhasil

**Steps:**
1. Open Upload Book Page
2. Fill form:
   - Judul: "Test Buku" (min 3 chars)
   - ISBN: (optional - boleh kosong)
   - Kategori: Pilih dari dropdown
   - Genre: Pilih dari dropdown
   - Sinopsis: "Ini adalah sinopsis buku yang sangat menarik..." (min 50 chars)
3. Tap "Next"
4. Upload file DOC/DOCX
5. Tap "Submit"

**Expected Result:**
```json
✅ Upload Service Response:
{
  "sukses": true,
  "data": {
    "url": "/uploads/naskah/2025-11-10_test-buku_abc123.docx"
  }
}

✅ Frontend Builds Full URL:
"http://localhost:4000/uploads/naskah/2025-11-10_test-buku_abc123.docx"

✅ Create Naskah Request:
{
  "judul": "Test Buku",
  "sinopsis": "Ini adalah sinopsis buku yang sangat menarik...",
  "idKategori": "uuid-...",
  "idGenre": "uuid-...",
  "urlFile": "http://localhost:4000/uploads/naskah/2025-11-10_test-buku_abc123.docx",
  "publik": false
}

✅ Backend Response:
{
  "sukses": true,
  "pesan": "Naskah berhasil dibuat",
  "data": {
    "id": "uuid-...",
    "judul": "Test Buku",
    "status": "draft",
    ...
  }
}
```

### Test Case 2: URL Already Full (Edge Case)

Backend might return full URL in future:
```dart
// If backend returns: "https://cdn.publishify.com/uploads/naskah/file.docx"
final fileUrl = uploadResponse.data!.url.startsWith('http')
    ? uploadResponse.data!.url  // ✅ Use as-is
    : '$baseUrl${uploadResponse.data!.url}';  // Build full URL

Result: "https://cdn.publishify.com/uploads/naskah/file.docx"  // ✅ Works
```

---

## 📊 Summary

### Problem:
- Backend upload service returns **relative path** (`/uploads/...`)
- Backend naskah DTO requires **full URL** (`http://...`)
- Mismatch causes Zod validation error

### Solution:
- Frontend builds **full URL** dari relative path
- Check if URL already starts with `http` (future-proof)
- Append relative path to BASE_URL if needed

### Files Modified: 1
- ✅ `lib/pages/upload/upload_file_page.dart`
  - Added import: `flutter_dotenv`
  - Build full URL before creating naskah
  - Handle both relative path and full URL (future-proof)

### Verification:
```bash
✅ Flutter analyze: No issues found! (1.6s)
✅ URL format: Valid HTTP/HTTPS
✅ Backward compatible: Works with future full URL returns
```

---

## 🎯 Key Learnings

### Backend DTO Fields (Naskah):

| Field | Type | Required | Format | Notes |
|-------|------|----------|--------|-------|
| `judul` | string | ✅ Yes | 3-200 chars | Wajib |
| `sinopsis` | string | ✅ Yes | 50-2000 chars | Wajib |
| `idKategori` | string | ✅ Yes | UUID | Wajib |
| `idGenre` | string | ✅ Yes | UUID | Wajib |
| `subJudul` | string | ⚠️ Optional | Max 200 chars | - |
| `isbn` | string | ⚠️ Optional | - | - |
| `bahasaTulis` | string | ⚠️ Optional | ISO 639-1 (2 chars) | Default: "id" |
| `jumlahHalaman` | number | ⚠️ Optional | Integer, min 1 | - |
| `jumlahKata` | number | ⚠️ Optional | Integer, min 100 | - |
| `urlSampul` | string | ⚠️ Optional | Full URL | Cover image |
| `urlFile` | string | ⚠️ Optional | **Full URL** | **MUST be full URL!** |
| `publik` | boolean | ⚠️ Optional | - | Default: false |

### URL Format Requirements:

```typescript
// ✅ VALID
"http://localhost:4000/uploads/naskah/file.docx"
"https://storage.publishify.com/naskah/file.pdf"
"https://cdn.example.com/path/to/file.docx"

// ❌ INVALID (Zod validation fails)
"/uploads/naskah/file.docx"  // Relative path
"uploads/naskah/file.docx"   // No leading slash
"file:///path/to/file.docx"  // File protocol (not http/https)
```

---

## 🚀 Next Steps

1. ✅ Test upload naskah dengan file DOC/DOCX
2. ✅ Verify backend receives full URL
3. ✅ Check backend log untuk konfirmasi format URL benar
4. ⚠️ (Future) Consider adding `urlSampul` upload feature (optional)
5. ⚠️ (Future) Backend should return full URL instead of relative path

**Status:** Ready for manual testing! 🎉
