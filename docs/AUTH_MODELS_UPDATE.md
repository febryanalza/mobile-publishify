# Update Auth Models - Penyesuaian dengan Backend Structure

## 📋 Ringkasan Perubahan

Telah dilakukan update pada model autentikasi Flutter untuk menyesuaikan dengan struktur backend NestJS, khususnya untuk penanganan **peranPengguna** yang lebih kompleks.

## 🔄 Perubahan Utama

### 1. **Enhanced Auth Models (`lib/models/auth_models.dart`)**

#### ✅ **Tambahan Model PeranPengguna**
```dart
class PeranPengguna {
  final String id;
  final String idPengguna;
  final String jenisPeran; // 'penulis', 'editor', 'percetakan', 'admin'
  final bool aktif;
  final String ditugaskanPada;
  final String? ditugaskanOleh;
}
```

#### ✅ **Enhanced UserData Model**
```dart
class UserData {
  final String id;
  final String email;
  final List<String> peran; // Untuk kompatibilitas dengan response backend sederhana
  final bool terverifikasi;
  final ProfilPengguna? profilPengguna;
  final List<PeranPengguna>? peranPengguna; // Struktur lengkap dari backend

  // Helper methods:
  List<String> getActiveRoles(); // Ambil role aktif saja
  bool hasRole(String role);     // Cek apakah user punya role tertentu
  String? getPrimaryRole();      // Ambil role utama (pertama yang aktif)
}
```

#### ✅ **Tambahan JenisPeran Enum**
```dart
enum JenisPeran {
  penulis,
  editor,
  percetakan,
  admin,
}

extension JenisPeranExtension on JenisPeran {
  String get value;        // Nilai string untuk API
  String get displayName;  // Nama tampilan untuk UI
  static JenisPeran fromString(String value);
}
```

### 2. **Updated RoleNavigationController**

#### ✅ **Simplified Role Extraction**
```dart
static List<String> extractRolesFromResponse(LoginResponse response) {
  if (response.data?.pengguna != null) {
    // Gunakan helper method dari UserData untuk mendapatkan role aktif
    return response.data!.pengguna.getActiveRoles();
  }
  return ['penulis']; // default fallback
}
```

#### ✅ **Register Response Handling**
```dart
static List<String> extractRolesFromRegisterResponse(RegisterResponse response) {
  // Register response hanya berisi ID, email, dan token verifikasi
  // Role default untuk registrasi adalah 'penulis'
  return ['penulis'];
}
```

### 3. **Enhanced AuthService Methods**

#### ✅ **Role Management dengan Helper Methods**
```dart
/// Get user roles using helper method from UserData
static Future<List<String>> getUserRoles() async {
  final loginData = await getLoginData();
  if (loginData != null) {
    return loginData.pengguna.getActiveRoles();
  }
  // Fallback ke SharedPreferences
  final prefs = await SharedPreferences.getInstance();
  return prefs.getStringList(_keyPeran) ?? [];
}

/// Check if user has specific role
static Future<bool> hasRole(String role) async {
  final loginData = await getLoginData();
  if (loginData != null) {
    return loginData.pengguna.hasRole(role);
  }
  // Fallback check
  final roles = await getUserRoles();
  return roles.contains(role);
}

/// Get primary role (first active role)
static Future<String?> getPrimaryRole() async {
  final loginData = await getLoginData();
  if (loginData != null) {
    return loginData.pengguna.getPrimaryRole();
  }
  // Fallback
  final roles = await getUserRoles();
  return roles.isNotEmpty ? roles.first : null;
}
```

## 🏗️ Struktur Backend vs Frontend

### **Backend Response Structure**
```typescript
// AuthService.login() response (backend)
{
  accessToken: string,
  refreshToken: string,
  pengguna: {
    id: string,
    email: string,
    peran: JenisPeran[], // Array sederhana dari jenisPeran
    terverifikasi: boolean,
    profilPengguna: any
  }
}
```

### **Frontend Model Structure**
```dart
// LoginResponse (frontend)
class LoginData {
  final String accessToken;
  final String refreshToken;
  final UserData pengguna;
}

class UserData {
  final String id;
  final String email;
  final List<String> peran;           // Kompatibilitas dengan backend
  final bool terverifikasi;
  final ProfilPengguna? profilPengguna;
  final List<PeranPengguna>? peranPengguna; // Untuk struktur lengkap jika tersedia
}
```

## 🔍 Backend Analysis

### **Authentication Response Pattern**
Berdasarkan analisis backend (`backend/src/modules/auth/auth.service.ts` line 254):

```typescript
pengguna: {
  id: pengguna.id,
  email: pengguna.email,
  peran: pengguna.peranPengguna.map((p: any) => p.jenisPeran), // Simplified array
  terverifikasi: pengguna.terverifikasi,
  profilPengguna: pengguna.profilPengguna,
}
```

**Backend saat ini mengirim `peran` sebagai array sederhana**, namun **frontend sudah siap** untuk menerima struktur `peranPengguna` yang lebih lengkap jika backend di-update di masa depan.

## 🎯 Keunggulan Struktur Baru

### 1. **Backward Compatibility**
- Model tetap kompatibel dengan response backend yang ada
- Field `peran` tetap ada untuk kompatibilitas 
- Field `peranPengguna` siap untuk struktur yang lebih lengkap

### 2. **Type Safety**
- Enum `JenisPeran` untuk type safety
- Helper methods untuk operasi role yang aman

### 3. **Flexibility**
- Helper methods `getActiveRoles()`, `hasRole()`, `getPrimaryRole()`
- Dapat handle role sederhana maupun kompleks
- Fallback ke SharedPreferences jika diperlukan

### 4. **Clean Code**
- Logika role extraction dipindah ke model
- Controller menjadi lebih sederhana
- Service methods menggunakan helper methods

## 🚀 Cara Penggunaan

### **1. Cek Role User**
```dart
// Menggunakan AuthService
bool isEditor = await AuthService.hasRole('editor');
String primaryRole = await AuthService.getPrimaryRole() ?? 'penulis';

// Atau langsung dari UserData
UserData user = loginResponse.data!.pengguna;
bool isPenulis = user.hasRole('penulis');
List<String> activeRoles = user.getActiveRoles();
```

### **2. Navigation Berdasarkan Role**
```dart
// Setelah login
await RoleNavigationController.navigateAfterLogin(context, loginResponse);

// Atau manual
String route = RoleNavigationController.getRoleBasedRoute(user.getActiveRoles());
Navigator.pushReplacementNamed(context, route);
```

### **3. Conditional UI Berdasarkan Role**
```dart
// Di dalam Widget
FutureBuilder<bool>(
  future: AuthService.hasRole('editor'),
  builder: (context, snapshot) {
    if (snapshot.data == true) {
      return EditorOnlyWidget();
    }
    return Container();
  },
)
```

## 🛡️ Role Hierarchy

Sistem menggunakan hierarki role sebagai berikut:

1. **admin** - Akses penuh ke semua fitur
2. **editor** - Akses untuk review dan mengedit naskah
3. **percetakan** - Akses untuk mengelola pesanan cetak
4. **penulis** - Akses untuk mengelola naskah sendiri

Role dengan prioritas lebih tinggi otomatis mendapat akses ke fitur role di bawahnya.

## 🔄 Migration Guide

### **Untuk Developer:**

1. **Update import statements** jika menggunakan role checking:
   ```dart
   // Sebelum
   List<String> roles = userData.peran;
   
   // Sesudah (recommended)
   List<String> roles = userData.getActiveRoles();
   bool hasEditor = userData.hasRole('editor');
   ```

2. **Gunakan enum untuk type safety**:
   ```dart
   // Sebelum
   if (role == 'penulis') { ... }
   
   // Sesudah
   if (role == JenisPeran.penulis.value) { ... }
   ```

3. **Update role checking logic**:
   ```dart
   // Gunakan helper methods dari AuthService
   bool canEdit = await AuthService.hasRole('editor');
   String primaryRole = await AuthService.getPrimaryRole() ?? 'penulis';
   ```

---

## ✅ Status Implementasi

- [x] Model PeranPengguna ditambahkan
- [x] UserData enhanced dengan helper methods  
- [x] JenisPeran enum dan extension
- [x] RoleNavigationController updated
- [x] AuthService enhanced dengan helper methods
- [x] Backward compatibility maintained
- [x] Type safety improved

**Ready to use! 🚀**

Struktur sekarang sudah selaras dengan backend dan siap untuk pengembangan fitur role-based selanjutnya.