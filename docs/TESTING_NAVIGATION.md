# Testing Bottom Navigation - Publishify

## Cara Test Navigasi

### 1. Jalankan Aplikasi
```bash
flutter run
```

### 2. Test Flow
1. **Splash Screen** (3 detik) → Otomatis ke Login
2. **Login** → Tap "Masuk" → Success Page
3. **Success Page** (3 detik) → Otomatis ke Home

### 3. Test Bottom Navigation
Dari **Home Page**:
- ✅ Tap icon **Library** (index 1) → Harus pindah ke Statistics
- ✅ Tap icon **Notification** (index 2) → Harus pindah ke Notifications  
- ✅ Tap icon **Profile** (index 3) → Harus pindah ke Profile
- ✅ Tap icon **Home** (index 0) → Kembali ke Home

Dari **Statistics Page**:
- ✅ Tap icon **Home** → Pindah ke Home
- ✅ Tap icon **Notification** → Pindah ke Notifications
- ✅ Tap icon **Profile** → Pindah ke Profile

Dari **Notifications Page**:
- ✅ Tap icon **Home** → Pindah ke Home
- ✅ Tap icon **Statistics** → Pindah ke Statistics
- ✅ Tap icon **Profile** → Pindah ke Profile

Dari **Profile Page**:
- ✅ Tap icon **Home** → Pindah ke Home
- ✅ Tap icon **Statistics** → Pindah ke Statistics
- ✅ Tap icon **Notification** → Pindah ke Notifications

## Expected Behavior

### ✅ Yang Harus Terjadi:
1. Setiap tap bottom nav **langsung ganti halaman**
2. **Tidak ada delay** atau loading
3. Icon yang aktif **highlight** dengan background putih transparan
4. Notification icon menampilkan **red badge** jika ada unread
5. Tap pada tab yang sama **tidak ada efek** (early return)
6. Back button **keluar dari app** (tidak kembali ke halaman sebelumnya)

### ❌ Yang TIDAK Boleh Terjadi:
1. Tap bottom nav tidak ada respon
2. Halaman tidak berganti
3. Error navigation
4. Stack navigation menumpuk
5. Memory leak dari history panjang

## Troubleshooting

### Problem: Bottom nav tidak respond
**Solution**: Pastikan routes sudah terdaftar di `main.dart`
```dart
return MaterialApp(
  initialRoute: AppRoutes.splash,
  routes: AppRoutes.getRoutes(),
);
```

### Problem: Error "No route defined"
**Solution**: Cek `lib/utils/routes.dart` semua route terdefinisi

### Problem: Halaman tidak berganti
**Solution**: Pastikan menggunakan `pushReplacementNamed` bukan `pushNamed`

## Verification Checklist

- [ ] Routes terdaftar di main.dart
- [ ] Semua halaman menggunakan `pushReplacementNamed`
- [ ] Early return jika tap tab yang sama
- [ ] Switch statement di semua `_onNavBarTap`
- [ ] Bottom nav menampilkan current index dengan benar
- [ ] Notification badge muncul jika ada unread

## Debug Commands

```bash
# Check for errors
flutter analyze

# Run with verbose
flutter run -v

# Check routes
grep -r "pushReplacementNamed" lib/pages/

# Hot reload after changes
r (in terminal saat app running)
```
