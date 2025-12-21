# User Registration - Writer Only

## 📝 Perubahan

### Halaman Register (Create Publishify Account)
Halaman registrasi telah diperbarui dengan ketentuan:

1. **Hanya untuk Writer**
   - Editor TIDAK dapat mendaftar secara mandiri
   - Editor akan dikelola oleh admin sistem

2. **Form Fields:**
   - **Nama** - Nama lengkap penulis
   - **TTL** - Tempat tanggal lahir
   - **Jenis Kelamin** - Dropdown (Laki-laki/Perempuan)
   - **Penulis** - Jenis penulis (Novel, Cerpen, Puisi, Esai, Artikel, Lainnya)
   - **Username** - Username untuk login
   - **Password** - Password dengan toggle visibility

3. **Validasi:**
   - Semua field wajib diisi
   - Username minimal 3 karakter
   - Password minimal 6 karakter

## 🔧 Dummy Service

File: `lib/services/auth_service.dart`

### Fungsi yang Tersedia:

1. **login()** - Dummy login function
   - Menerima username dan password
   - Return data user dan token

2. **register()** - Dummy register function
   - Menerima semua data registrasi
   - Simpan ke dummy storage
   - Return success/error message

3. **signInWithGoogle()** - Dummy Google Sign-In
   - Simulasi login dengan Google
   - Return data user dan token

4. **logout()** - Dummy logout
   - Clear session

5. **isLoggedIn()** - Check login status
   - Return true/false

### Dummy Users (untuk testing):
```
Username: admin
Password: admin123

Username: writer1
Password: password123
```

## 🎨 UI Design

- Icon profile di atas form
- Form fields dengan background light
- Dropdown untuk Jenis Kelamin dan Jenis Penulis
- Section "Masukkan" untuk username dan password
- Button "Create" dengan style primary green
- Clean dan minimalist design

## ⚠️ Catatan

- Semua data disimpan di memory (hilang saat restart)
- Service masih dummy, belum terintegrasi dengan backend
- Untuk production, perlu implementasi real API
- Editor registration akan dihandle oleh admin panel (belum dibuat)
