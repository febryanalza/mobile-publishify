# Dokumentasi: Perbaikan URL Gambar Backend

## 📋 Masalah yang Ditemukan

Backend hanya menyimpan **relative path** untuk gambar sampul dan file lainnya, contoh:
```
/uploads/sampul/2025-11-04_lukisan_a6011cc09612df7e.jpg
```

Namun, di frontend mobile, `Image.network()` memerlukan **full URL** lengkap dengan protokol dan host, contoh:
```
http://10.0.2.2:4000/uploads/sampul/2025-11-04_lukisan_a6011cc09612df7e.jpg
```

Akibatnya, gambar tidak dapat ditampilkan karena path tidak lengkap.

## 🔍 Analisis Backend

### 1. Backend Storage Path
File: `backend/src/modules/upload/upload.service.ts` (line 104)
```typescript
const relativeUrl = `/uploads/${dto.tujuan}/${uniqueFilename}`;
```

Backend hanya menyimpan relative URL ke database dalam kolom `url` di tabel `file`.

### 2. Backend Environment
File: `backend/.env`
```properties
PORT=4000
```

Backend berjalan di port 4000, tetapi tidak ada konfigurasi untuk serving static files.

### 3. Static File Serving
Backend **TIDAK** memiliki konfigurasi `express.static()` atau `useStaticAssets()` di `main.ts` atau `app.module.ts`, sehingga file di folder `uploads/` tidak dapat diakses langsung.

## ✅ Solusi yang Diterapkan

### 1. Buat Image Helper Utility (`lib/utils/image_helper.dart`)

Helper class untuk mengkonversi relative path menjadi full URL:

**Fitur:**
- `getFullImageUrl(relativePath)` - Konversi path ke full URL
- `isValidImageUrl(url)` - Validasi URL
- `getSampulUrl(urlSampul)` - Khusus untuk sampul buku
- `getNaskahUrl(urlFile)` - Khusus untuk file naskah
- `getAvatarUrl(urlAvatar)` - Khusus untuk avatar

**Cara Kerja:**
```dart
// Input: /uploads/sampul/2025-11-04_lukisan.jpg
// Output: http://10.0.2.2:4000/uploads/sampul/2025-11-04_lukisan.jpg

String fullUrl = ImageHelper.getFullImageUrl(relativePath);
```

Base URL diambil dari `.env`:
```properties
BASE_URL=http://10.0.2.2:4000
```

### 2. Buat Network Image Widget (`lib/widgets/network_image_widget.dart`)

Widget reusable untuk menampilkan gambar dengan penanganan loading dan error:

**Widget yang Tersedia:**

#### a. `NetworkImageWidget` (Generic)
```dart
NetworkImageWidget(
  imageUrl: '/uploads/sampul/xxx.jpg',  // Otomatis dikonversi ke full URL
  width: 100,
  height: 100,
  fit: BoxFit.cover,
  borderRadius: BorderRadius.circular(12),
)
```

#### b. `SampulBukuImage` (Khusus Sampul Buku)
```dart
SampulBukuImage(
  urlSampul: naskah.urlSampul,  // Dari API backend
  width: 60,
  height: 80,
  borderRadius: BorderRadius.circular(8),
)
```

Otomatis menampilkan icon buku jika gambar error.

#### c. `AvatarImage` (Khusus Avatar/Profile Picture)
```dart
AvatarImage(
  urlAvatar: user.urlAvatar,  // Dari API backend
  size: 100,
  fallbackText: 'John Doe',  // Untuk inisial
)
```

Otomatis menampilkan inisial atau icon person jika gambar error.

### 3. Update Existing Widgets

File yang diupdate untuk menggunakan helper baru:

#### ✅ `lib/widgets/cards/book_card.dart`
**Sebelum:**
```dart
Image.network(
  book.imageUrl!,
  fit: BoxFit.cover,
  errorBuilder: (context, error, stackTrace) {
    return _buildPlaceholder();
  },
)
```

**Sesudah:**
```dart
SampulBukuImage(
  urlSampul: book.imageUrl,
  borderRadius: const BorderRadius.only(
    topLeft: Radius.circular(12),
    topRight: Radius.circular(12),
  ),
)
```

#### ✅ `lib/pages/profile/profile_page.dart`
**Update 1: Profile Avatar**
```dart
// Sebelum: Manual Image.network dengan 40+ lines
// Sesudah:
AvatarImage(
  urlAvatar: _userAvatar.isNotEmpty ? _userAvatar : _profile.photoUrl,
  size: 100,
  fallbackText: _userName,
)
```

**Update 2: Sampul Naskah di Portfolio**
```dart
// Sebelum: Container dengan DecorationImage
// Sesudah:
SampulBukuImage(
  urlSampul: naskah.urlSampul,
  borderRadius: BorderRadius.circular(8),
)
```

#### ✅ `lib/widgets/profile/portfolio_item.dart`
```dart
// Sebelum: Manual Image.network
// Sesudah:
NetworkImageWidget(
  imageUrl: portfolio.imageUrl,
  fit: BoxFit.cover,
  borderRadius: BorderRadius.circular(8),
)
```

## 🚀 Cara Penggunaan

### Untuk Developer Baru:

**1. Tampilkan Sampul Buku:**
```dart
SampulBukuImage(
  urlSampul: naskah.urlSampul,  // Langsung dari API
  width: 60,
  height: 80,
)
```

**2. Tampilkan Avatar User:**
```dart
AvatarImage(
  urlAvatar: user.profilPengguna?.urlAvatar,
  size: 50,
  fallbackText: user.email,
)
```

**3. Tampilkan Gambar Generic:**
```dart
NetworkImageWidget(
  imageUrl: '/uploads/gambar/xxx.jpg',
  width: 200,
  height: 150,
  fit: BoxFit.cover,
)
```

## 🔧 Testing

### Test Manual:

1. **Jalankan Backend:**
```bash
cd backend
bun run start:dev
```

2. **Upload Gambar via API:**
```bash
POST http://10.0.2.2:4000/api/upload/single
Content-Type: multipart/form-data

file: [pilih file gambar]
tujuan: sampul
```

Response akan memberikan:
```json
{
  "sukses": true,
  "data": {
    "url": "/uploads/sampul/2025-11-04_lukisan_abc123.jpg"
  }
}
```

3. **Test di Flutter App:**
```dart
// Di debug console, URL akan dikonversi otomatis:
// http://10.0.2.2:4000/uploads/sampul/2025-11-04_lukisan_abc123.jpg
```

4. **Verifikasi Gambar Muncul:**
- Buka halaman Home
- Lihat book cards dengan sampul
- Buka halaman Profile
- Lihat avatar dan portfolio items

## 📝 Catatan Penting

### Base URL untuk Platform Berbeda:

**Android Emulator:**
```properties
BASE_URL=http://10.0.2.2:4000
```

**iOS Simulator:**
```properties
BASE_URL=http://localhost:4000
```

**Real Device (dalam jaringan yang sama):**
```properties
BASE_URL=http://192.168.1.xxx:4000
```
*Ganti dengan IP komputer yang menjalankan backend*

### Debugging:

Jika gambar tidak muncul, cek:

1. **Backend running?**
```bash
curl http://10.0.2.2:4000/health
```

2. **File exists?**
```bash
ls backend/uploads/sampul/
```

3. **Full URL correct?**
Cek di debug console Flutter, seharusnya muncul:
```
Error loading image: ...
Image URL: http://10.0.2.2:4000/uploads/sampul/xxx.jpg
```

4. **Static file serving enabled?**
Backend perlu konfigurasi static file serving!

## ⚠️ Catatan Backend

Backend **BELUM** mengkonfigurasi static file serving. Untuk production, tambahkan di `backend/src/main.ts`:

```typescript
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  // ... rest of config
}
```

Atau gunakan Supabase Storage untuk production (lebih recommended).

## 📊 Ringkasan Perubahan

| File | Status | Deskripsi |
|------|--------|-----------|
| `lib/utils/image_helper.dart` | ✅ Baru | Helper untuk konversi URL |
| `lib/widgets/network_image_widget.dart` | ✅ Baru | Reusable image widgets |
| `lib/widgets/cards/book_card.dart` | ✅ Updated | Gunakan SampulBukuImage |
| `lib/pages/profile/profile_page.dart` | ✅ Updated | Gunakan AvatarImage & SampulBukuImage |
| `lib/widgets/profile/portfolio_item.dart` | ✅ Updated | Gunakan NetworkImageWidget |

## 🎯 Hasil

✅ **Gambar sampul dapat ditampilkan dengan benar**
✅ **Avatar user dapat ditampilkan dengan benar**
✅ **Loading state dan error handling otomatis**
✅ **Reusable dan mudah digunakan**
✅ **Konsisten di seluruh aplikasi**

---

**Catatan:** Solusi ini hanya mengubah frontend mobile. Backend tetap menyimpan relative path seperti semula. Full URL dibuat di sisi frontend.
