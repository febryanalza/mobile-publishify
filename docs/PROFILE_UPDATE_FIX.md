# Profile Update Fix - Dokumentasi Perbaikan

## 🐛 Masalah yang Ditemukan

### 1. Field `telepon` Tidak Di-load dari Backend
**Gejala**: Form edit profil tidak menampilkan nomor telepon yang sudah disimpan sebelumnya.

**Penyebab**: 
- `_loadCurrentProfile()` menggunakan `AuthService.getLoginData()` yang return `UserData` (dari `auth_models.dart`)
- Model `UserData` **TIDAK** memiliki field `telepon`
- Field `telepon` ada di `ProfileUserData` (dari `profile_api_models.dart`) di level user

**Solusi**:
```dart
// ❌ SEBELUM (SALAH)
final loginData = await AuthService.getLoginData();
if (loginData != null && loginData.pengguna.profilPengguna != null) {
  final profil = loginData.pengguna.profilPengguna!;
  // telepon TIDAK bisa diakses karena tidak ada di UserData
}

// ✅ SESUDAH (BENAR)
final profileResponse = await ProfileService.getProfile();
if (profileResponse.sukses && profileResponse.data != null) {
  final profil = profileResponse.data!.profilPengguna;
  final pengguna = profileResponse.data!;
  
  // Sekarang bisa akses telepon
  _teleponController.text = pengguna.telepon ?? '';
}
```

### 2. Validasi Backend vs Frontend

**Backend Validation Rules** (dari `backend/src/modules/pengguna/dto/perbarui-profil.dto.ts`):
```typescript
export const PerbaruiProfilSchema = z.object({
  // REQUIRED fields
  namaDepan: z.string().min(2).max(50),
  namaBelakang: z.string().max(50),
  namaTampilan: z.string().max(100),
  
  // OPTIONAL fields with specific formats
  jenisKelamin: z.enum(['L', 'P']).optional().nullable(),
  tanggalLahir: z.string().datetime().optional().nullable(),
  kodePos: z.string().regex(/^[0-9]{5}$/).optional().nullable(),
  telepon: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  // ...
});
```

**Frontend Validations** (sudah benar):
```dart
// ✅ jenisKelamin dropdown dengan nilai 'L' dan 'P'
DropdownMenuItem(value: 'L', child: Text('Laki-laki')),
DropdownMenuItem(value: 'P', child: Text('Perempuan')),

// ✅ tanggalLahir menggunakan ISO8601
tanggalLahir: _selectedDate?.toIso8601String(),

// ✅ kodePos validation (5 digit)
RegExp(r'^[0-9]{5}$').hasMatch(kodePos)

// ✅ telepon validation (Indonesian format)
RegExp(r'^(\+62|62|0)[0-9]{9,12}$').hasMatch(phone)
```

## ✅ Perubahan yang Dilakukan

### File: `lib/pages/profile/edit_profile_page.dart`

1. **Import Changes**:
```dart
// Dihapus (tidak diperlukan lagi)
import 'package:publishify/services/auth_service.dart';
```

2. **Method `_loadCurrentProfile()` - Sebelum**:
```dart
Future<void> _loadCurrentProfile() async {
  setState(() {
    _isLoadingData = true;
  });

  try {
    final loginData = await AuthService.getLoginData();

    if (loginData != null && loginData.pengguna.profilPengguna != null) {
      final profil = loginData.pengguna.profilPengguna!;

      setState(() {
        _namaDepanController.text = profil.namaDepan;
        _namaBelakangController.text = profil.namaBelakang;
        // ... field lainnya
        
        // ❌ MASALAH: telepon tidak di-load
        // _teleponController tidak di-set!
      });
    }
  } catch (e) {
    // error handling
  } finally {
    setState(() {
      _isLoadingData = false;
    });
  }
}
```

3. **Method `_loadCurrentProfile()` - Sesudah**:
```dart
Future<void> _loadCurrentProfile() async {
  setState(() {
    _isLoadingData = true;
  });

  try {
    // ✅ PERBAIKAN: Gunakan ProfileService.getProfile()
    final profileResponse = await ProfileService.getProfile();

    if (profileResponse.sukses && profileResponse.data != null) {
      final profil = profileResponse.data!.profilPengguna;
      final pengguna = profileResponse.data!;

      setState(() {
        if (profil != null) {
          _namaDepanController.text = profil.namaDepan;
          _namaBelakangController.text = profil.namaBelakang;
          _namaTampilanController.text = profil.namaTampilan;
          // ... field lainnya dari profilPengguna
        }

        // ✅ FIXED: Load telepon dari level user
        _teleponController.text = pengguna.telepon ?? '';
      });
    }
  } catch (e) {
    // error handling (sama seperti sebelumnya)
  } finally {
    setState(() {
      _isLoadingData = false;
    });
  }
}
```

## 🧪 Cara Testing

### 1. Test Load Data
1. Login sebagai user yang sudah punya nomor telepon
2. Buka halaman edit profile
3. **Verifikasi**: Nomor telepon muncul di field telepon

### 2. Test Update Profile
1. Isi semua field required:
   - Nama Depan (min 2 karakter)
   - Nama Belakang
   - Nama Tampilan
2. Isi field optional yang mau diubah:
   - Bio (maks 500 karakter)
   - Tanggal Lahir (pilih dari date picker)
   - Jenis Kelamin (pilih dari dropdown)
   - Telepon (format: 08xxx atau +628xxx, 9-12 digit)
   - Kode Pos (5 digit)
   - Alamat, Kota, Provinsi
3. Tap "Simpan Perubahan"
4. **Verifikasi**:
   - ✅ Success: Muncul SnackBar hijau "Profil berhasil diperbarui"
   - ❌ Gagal: Muncul error message dari backend dengan detail field yang salah

### 3. Test Validation

**Frontend Validation** (sebelum API call):
```
- Nama Depan: wajib, min 2 karakter, max 50
- Nama Belakang: wajib, max 50 karakter
- Nama Tampilan: wajib, max 100 karakter
- Bio: optional, max 500 karakter
- Telepon: optional, regex ^(\+62|62|0)[0-9]{9,12}$
- Kode Pos: optional, regex ^[0-9]{5}$
```

**Backend Validation** (akan ditampilkan jika frontend lolos):
```
- jenisKelamin: harus 'L' atau 'P' ✅ (sudah benar di dropdown)
- tanggalLahir: harus ISO 8601 datetime ✅ (sudah pakai toIso8601String())
- kodePos: harus 5 digit ✅ (sudah pakai regex)
- telepon: harus format Indonesia ✅ (sudah pakai regex)
```

## 📋 Checklist Perbaikan

- [x] Field `telepon` di-load dari backend
- [x] Menggunakan `ProfileService.getProfile()` untuk data lengkap
- [x] Hapus import `AuthService` yang tidak terpakai
- [x] Validasi frontend sudah sesuai backend requirements
- [x] Error handling dari backend ditampilkan dengan jelas
- [x] Date format display konsisten (DD/MM/YYYY dengan padLeft)
- [x] Dokumentasi dibuat

## 🎯 Next Steps (Opsional)

1. **Add Unit Tests**:
```dart
test('should load telepon from ProfileService', () async {
  // Test loading telepon field
});

test('should validate required fields', () {
  // Test nama depan, belakang, tampilan
});

test('should validate optional fields format', () {
  // Test telepon, kodePos regex
});
```

2. **Improve UX**:
- Add loading shimmer saat load data
- Add field-level error indicator (red border + icon)
- Add character counter untuk bio field
- Add phone formatter untuk auto-format telepon

3. **Backend Error Handling**:
- Parse error response lebih detail
- Map field names ke label Indonesia
- Show inline errors di masing-masing field

## 📖 References

- Backend DTO: `backend/src/modules/pengguna/dto/perbarui-profil.dto.ts`
- Backend Controller: `backend/src/modules/pengguna/pengguna.controller.ts`
- Frontend Service: `lib/services/profile_service.dart`
- Frontend Models: `lib/models/profile_api_models.dart`, `lib/models/update_profile_models.dart`
- Backend API Docs: `PUT /api/pengguna/profil/saya`

---

**Tanggal Perbaikan**: 2025
**Status**: ✅ COMPLETED
**Tested**: Pending manual testing oleh user
