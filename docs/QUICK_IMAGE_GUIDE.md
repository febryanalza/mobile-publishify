# Quick Start: Menampilkan Gambar dari Backend

## 🚀 Cara Cepat Menggunakan Image Helper

### 1. Import Widget yang Diperlukan

```dart
import 'package:publishify/widgets/network_image_widget.dart';
```

### 2. Gunakan Widget Sesuai Kebutuhan

#### A. Untuk Sampul Buku 📚

```dart
SampulBukuImage(
  urlSampul: naskah.urlSampul,  // Langsung dari API
  width: 100,
  height: 150,
  borderRadius: BorderRadius.circular(12),
)
```

**Keuntungan:**
- ✅ Otomatis konversi URL dari backend
- ✅ Tampil icon buku jika gambar error
- ✅ Loading indicator otomatis
- ✅ Tidak perlu error handling manual

#### B. Untuk Avatar/Profile Picture 👤

```dart
AvatarImage(
  urlAvatar: user.profilPengguna?.urlAvatar,
  size: 80,
  fallbackText: user.email,  // Untuk inisial
)
```

**Keuntungan:**
- ✅ Bentuk bulat otomatis
- ✅ Tampil inisial jika gambar error
- ✅ Warna background konsisten
- ✅ Ukuran responsive

#### C. Untuk Gambar Generic 🖼️

```dart
NetworkImageWidget(
  imageUrl: '/uploads/gambar/xxx.jpg',
  width: 200,
  height: 150,
  fit: BoxFit.cover,
  borderRadius: BorderRadius.circular(8),
)
```

## 📱 Testing di Emulator

### Android Emulator
Base URL yang digunakan: `http://10.0.2.2:4000`

**Setup:**
1. Pastikan backend running di port 4000
2. File `.env` sudah benar:
   ```properties
   BASE_URL=http://10.0.2.2:4000
   ```
3. Jalankan app di Android Emulator

### iOS Simulator
Base URL: `http://localhost:4000`

**Setup:**
1. Ubah `.env`:
   ```properties
   BASE_URL=http://localhost:4000
   ```
2. Restart app setelah ubah .env

### Real Device (Physical Phone)
Base URL: IP komputer Anda

**Setup:**
1. Cari IP komputer (Windows: `ipconfig`, Mac: `ifconfig`)
2. Ubah `.env`:
   ```properties
   BASE_URL=http://192.168.1.100:4000
   ```
   *(Ganti dengan IP komputer Anda)*
3. Pastikan phone dan komputer dalam 1 jaringan WiFi
4. Restart app

## 🧪 Testing Page

Untuk menguji apakah image helper bekerja, buka halaman test:

```dart
// Di main.dart atau navigation
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const ImageTestPage(),
  ),
);
```

Halaman ini akan menampilkan:
- Konversi URL (relative → full)
- Test NetworkImageWidget
- Test SampulBukuImage
- Test AvatarImage  
- Test Error Handling

## 🔧 Troubleshooting

### Gambar Tidak Muncul?

**1. Cek Backend Running**
```bash
curl http://10.0.2.2:4000/health
```

**2. Cek BASE_URL di .env**
```properties
BASE_URL=http://10.0.2.2:4000  # Untuk Android Emulator
```

**3. Cek URL di Debug Console**
Saat gambar di-load, akan muncul log:
```
Image URL: http://10.0.2.2:4000/uploads/sampul/xxx.jpg
```

Verifikasi URL ini bisa diakses.

**4. Test URL di Browser/Postman**
```
http://10.0.2.2:4000/uploads/sampul/xxx.jpg
```

Jika tidak bisa diakses, berarti backend belum serve static files.

### Error "Connection Refused"?

**Penyebab:** Backend tidak running atau BASE_URL salah

**Solusi:**
1. Start backend: `cd backend && bun run start:dev`
2. Cek port: Backend harus di port 4000
3. Cek BASE_URL sesuai platform (emulator/simulator/device)

### Error "File Not Found 404"?

**Penyebab:** File belum diupload atau path salah

**Solusi:**
1. Upload file via API:
   ```bash
   POST http://10.0.2.2:4000/api/upload/single
   ```
2. Copy path dari response
3. Gunakan path tersebut di widget

## 📝 Contoh Lengkap

### Home Page - Book Card

```dart
class BookCard extends StatelessWidget {
  final Book book;
  
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      child: Column(
        children: [
          // Sampul buku
          SizedBox(
            height: 140,
            child: SampulBukuImage(
              urlSampul: book.imageUrl,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          // Judul, author, dll
          // ...
        ],
      ),
    );
  }
}
```

### Profile Page - Avatar

```dart
class ProfileHeader extends StatelessWidget {
  final User user;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Avatar dengan border
        Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: AppTheme.yellow,
              width: 3,
            ),
          ),
          child: AvatarImage(
            urlAvatar: user.profilPengguna?.urlAvatar,
            size: 100,
            fallbackText: user.email,
          ),
        ),
        // Name, bio, dll
        // ...
      ],
    );
  }
}
```

### Portfolio Item

```dart
class PortfolioCard extends StatelessWidget {
  final Portfolio portfolio;
  
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Thumbnail
        SizedBox(
          width: 60,
          height: 60,
          child: NetworkImageWidget(
            imageUrl: portfolio.imageUrl,
            fit: BoxFit.cover,
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        // Title, description, dll
        // ...
      ],
    );
  }
}
```

## ✅ Checklist Implementasi

Saat membuat fitur baru yang menampilkan gambar:

- [ ] Import `network_image_widget.dart`
- [ ] Gunakan widget yang sesuai:
  - [ ] `SampulBukuImage` untuk cover buku
  - [ ] `AvatarImage` untuk profile picture
  - [ ] `NetworkImageWidget` untuk gambar generic
- [ ] Jangan gunakan `Image.network()` langsung
- [ ] Test di emulator/device
- [ ] Verifikasi error handling bekerja

## 🎓 Best Practices

### ✅ DO (Lakukan)
```dart
// Gunakan widget helper
SampulBukuImage(urlSampul: naskah.urlSampul)

// Gunakan size yang reasonable
AvatarImage(size: 80, urlAvatar: user.avatar)

// Berikan fallback text
AvatarImage(fallbackText: user.name)
```

### ❌ DON'T (Jangan)
```dart
// Jangan gunakan Image.network langsung
Image.network(naskah.urlSampul!)

// Jangan hardcode full URL
Image.network('http://10.0.2.2:4000/uploads/...')

// Jangan lupa error handling
Image.network(url) // Tanpa errorBuilder
```

---

**Dibuat:** November 10, 2025  
**Update Terakhir:** November 10, 2025  
**Dokumentasi Lengkap:** Lihat `IMAGE_URL_FIX.md`
