# Backend Integration Documentation

## 📋 Overview
Dokumentasi ini menjelaskan integrasi antara Flutter frontend dengan Node.js backend API.

## 🔧 Konfigurasi

### Environment Variables (.env)
```env
BASE_URL=http://localhost:4000
API_AUTH_DAFTAR=/api/auth/daftar
API_AUTH_LOGIN=/api/auth/login
API_AUTH_LOGOUT=/api/auth/logout
```

### Android Configuration
- **Internet Permission**: `android.permission.INTERNET`
- **Network State Permission**: `android.permission.ACCESS_NETWORK_STATE`
- **Cleartext Traffic**: Enabled untuk localhost development

## 🔐 Authentication API

### 1. Register API

**Endpoint**: `POST /api/auth/daftar`

**Request Body**:
```json
{
  "email": "penulis@example.com",
  "kataSandi": "Password123!",
  "konfirmasiKataSandi": "Password123!",
  "namaDepan": "John",
  "namaBelakang": "Doe",
  "telepon": "081234567890",
  "jenisPeran": "penulis"
}
```

**Response Success**:
```json
{
  "sukses": true,
  "pesan": "Registrasi berhasil",
  "data": {
    "id": "e07f5bef-b37d-4714-b626-b345cc128f48",
    "email": "penulis@example.com",
    "tokenVerifikasi": "abc123xyz"
  }
}
```

**Data yang Disimpan di SharedPreferences**:
- `user_id`: ID pengguna
- `user_email`: Email pengguna
- `token_verifikasi`: Token untuk verifikasi email
- `is_logged_in`: false (belum login, perlu verifikasi)

---

### 2. Login API

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "penulis@example.com",
  "kataSandi": "Password123!"
}
```

**Response Success**:
```json
{
  "sukses": true,
  "pesan": "Login berhasil",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "pengguna": {
      "id": "e07f5bef-b37d-4714-b626-b345cc128f48",
      "email": "penulis@example.com",
      "peran": ["penulis"],
      "terverifikasi": false,
      "profilPengguna": {
        "id": "08ea18db-c41d-4964-9ad4-50484f5ecdf4",
        "idPengguna": "e07f5bef-b37d-4714-b626-b345cc128f48",
        "namaDepan": "John",
        "namaBelakang": "Doe",
        "namaTampilan": "John Doe",
        "bio": null,
        "urlAvatar": null,
        "tanggalLahir": null,
        "jenisKelamin": null,
        "alamat": null,
        "kota": null,
        "provinsi": null,
        "kodePos": null,
        "dibuatPada": "2025-11-04T12:15:35.244Z",
        "diperbaruiPada": "2025-11-04T12:15:35.244Z"
      }
    }
  }
}
```

**Data yang Disimpan di SharedPreferences**:

#### Authentication Tokens
- `access_token`: JWT token untuk autentikasi API (expire: 1 jam)
- `refresh_token`: Token untuk refresh access token (expire: 7 hari)

#### User Basic Info
- `user_id`: ID pengguna (UUID)
- `user_email`: Email pengguna
- `peran`: List peran pengguna (penulis/editor) - stored as StringList
- `terverifikasi`: Status verifikasi email (boolean)

#### Profile Info
- `nama_depan`: Nama depan pengguna
- `nama_belakang`: Nama belakang pengguna
- `nama_tampilan`: Nama tampilan (display name)

#### Complete Data
- `user_data`: Complete LoginData object dalam format JSON string untuk easy retrieval
- `is_logged_in`: true (user sudah login)

---

## 📦 Data Models

### RegisterRequest
```dart
class RegisterRequest {
  final String email;
  final String kataSandi;
  final String konfirmasiKataSandi;
  final String namaDepan;
  final String namaBelakang;
  final String telepon;
  final String jenisPeran;
}
```

### RegisterResponse
```dart
class RegisterResponse {
  final bool sukses;
  final String pesan;
  final RegisterData? data;
}
```

### LoginRequest
```dart
class LoginRequest {
  final String email;
  final String kataSandi;
}
```

### LoginResponse
```dart
class LoginResponse {
  final bool sukses;
  final String pesan;
  final LoginData? data;
}
```

### LoginData (Complete User Data)
```dart
class LoginData {
  final String accessToken;
  final String refreshToken;
  final UserData pengguna;
}
```

### UserData
```dart
class UserData {
  final String id;
  final String email;
  final List<String> peran;
  final bool terverifikasi;
  final ProfilPengguna? profilPengguna;
}
```

### ProfilPengguna
```dart
class ProfilPengguna {
  final String id;
  final String idPengguna;
  final String namaDepan;
  final String namaBelakang;
  final String namaTampilan;
  final String? bio;
  final String? urlAvatar;
  final String? tanggalLahir;
  final String? jenisKelamin;
  final String? alamat;
  final String? kota;
  final String? provinsi;
  final String? kodePos;
  final String dibuatPada;
  final String diperbaruiPada;
}
```

---

## 🔑 AuthService Methods

### Registration & Login
```dart
// Register new user
static Future<RegisterResponse> register(RegisterRequest request)

// Login user
static Future<LoginResponse> login(LoginRequest request)

// Logout (clear all data)
static Future<void> logout()
```

### Token Management
```dart
// Get access token for API calls
static Future<String?> getAccessToken()

// Get refresh token
static Future<String?> getRefreshToken()

// Get verification token
static Future<String?> getTokenVerifikasi()
```

### User Data Retrieval
```dart
// Get complete login data (LoginData object)
static Future<LoginData?> getLoginData()

// Get user ID
static Future<String?> getUserId()

// Get user email
static Future<String?> getUserEmail()

// Get user roles (List<String>)
static Future<List<String>> getUserRoles()

// Get display name
static Future<String?> getNamaTampilan()
```

### Status Checks
```dart
// Check if user is logged in
static Future<bool> isLoggedIn()

// Check if email is verified
static Future<bool> isVerified()
```

### Data Management
```dart
// Clear all data (including verification token)
static Future<void> clearAllData()
```

---

## 🔄 Authentication Flow

### Registration Flow
1. User mengisi form registrasi (nama depan, nama belakang, telepon, email, password, peran)
2. App memanggil `AuthService.register()` dengan `RegisterRequest`
3. Backend memproses dan mengirim email verifikasi
4. Backend merespon dengan `user_id`, `email`, dan `tokenVerifikasi`
5. App menyimpan data ke SharedPreferences dengan `is_logged_in = false`
6. User diarahkan ke Success Page dengan pesan untuk cek email
7. User klik link verifikasi di email (handled by backend)

### Login Flow
1. User mengisi email dan password di `login_page.dart`
2. App memvalidasi input (email format & password length)
3. App menampilkan loading indicator
4. App memanggil `AuthService.login()` dengan `LoginRequest(email, kataSandi)`
5. AuthService mengirim HTTP POST ke `http://localhost:4000/api/auth/login`
6. Backend memvalidasi credentials
7. Backend merespon dengan `accessToken`, `refreshToken`, dan complete `UserData`
8. AuthService otomatis menyimpan semua data ke SharedPreferences dengan `is_logged_in = true`
9. App menyembunyikan loading indicator
10. Jika sukses: User diarahkan ke Success Page dengan nama tampilan
11. Jika gagal: Menampilkan error message dalam SnackBar merah

### Authenticated API Calls
```dart
// Get access token
final token = await AuthService.getAccessToken();

// Use in API headers
final response = await http.get(
  Uri.parse('$baseUrl/api/protected-endpoint'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
);
```

### Logout Flow
1. User memilih logout
2. App memanggil `AuthService.logout()`
3. Semua data di SharedPreferences dihapus
4. User diarahkan ke Login Page

---

## 📱 Usage Examples

### Check Login Status on App Start
```dart
@override
void initState() {
  super.initState();
  _checkLoginStatus();
}

Future<void> _checkLoginStatus() async {
  final isLoggedIn = await AuthService.isLoggedIn();
  
  if (isLoggedIn) {
    // Get user data
    final loginData = await AuthService.getLoginData();
    final userName = await AuthService.getNamaTampilan();
    final userRoles = await AuthService.getUserRoles();
    
    // Navigate to Home
    Navigator.pushReplacementNamed(context, '/home');
  }
}
```

### Display User Info
```dart
Future<void> _loadUserInfo() async {
  final namaTampilan = await AuthService.getNamaTampilan();
  final email = await AuthService.getUserEmail();
  final peran = await AuthService.getUserRoles();
  final isVerified = await AuthService.isVerified();
  
  setState(() {
    _displayName = namaTampilan ?? 'User';
    _userEmail = email ?? '';
    _userRoles = peran;
    _emailVerified = isVerified;
  });
}
```

### Handle Logout
```dart
Future<void> _handleLogout() async {
  await AuthService.logout();
  Navigator.pushReplacementNamed(context, '/login');
}
```

---

## ⚠️ Important Notes

### Token Expiration
- **Access Token**: Expire dalam 1 jam (3600 detik)
- **Refresh Token**: Expire dalam 7 hari (604800 detik)
- Implementasi token refresh akan ditambahkan di fase berikutnya

### Data Persistence
- Semua data disimpan menggunakan SharedPreferences
- Data tetap ada meskipun app ditutup
- Data hanya dihapus saat logout atau clearAllData()

### Security Considerations
1. **Cleartext Traffic**: Hanya enabled untuk development (localhost)
2. **Production**: Ganti dengan HTTPS dan disable cleartext traffic
3. **Token Storage**: SharedPreferences tidak encrypted, pertimbangkan flutter_secure_storage untuk production
4. **Password Validation**: Minimal 6 karakter (bisa ditingkatkan sesuai kebutuhan)

### Error Handling
Semua service methods menggunakan try-catch dan return response dengan format:
```dart
{
  "sukses": false,
  "pesan": "Error message here"
}
```

---

## ✅ Integration Status

### Completed
- ✅ **Register API**: Fully integrated with backend (`register_page.dart`)
- ✅ **Login API**: Fully integrated with backend (`login_page.dart`)
- ✅ **Data Persistence**: SharedPreferences storing all necessary data
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Loading States**: Loading indicators during API calls
- ✅ **Form Validation**: Email format, password length, required fields

### Flow Diagram
```
User Input → Validation → Loading → API Call → Response → Success/Error Handler
     ↓                                              ↓
Form Fields                                    SharedPreferences
                                                      ↓
                                              Navigate to Success/Home
```

---

## 🚀 Next Steps

1. **Success Page Navigation**: Redirect to Home Page instead of Success Page after login
2. **Auto Login**: Check `isLoggedIn()` on app start and navigate accordingly
3. **Token Refresh Mechanism**: Implement auto-refresh when access token expire
4. **Email Verification**: Add email verification page and API integration
5. **Password Reset**: Add forgot password flow with email
6. **Profile Update**: Add profile update API integration
7. **Secure Storage**: Migrate to flutter_secure_storage for sensitive data
8. **Offline Mode**: Handle offline scenarios with cached data
9. **Token Expiry Handler**: Auto logout when token expired
10. **Google Login**: Integrate real Google Sign-In (currently dummy)

---

## 📞 API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | /api/auth/daftar | User registration | No |
| POST | /api/auth/login | User login | No |
| POST | /api/auth/logout | User logout | Yes |
| POST | /api/auth/refresh | Refresh access token | Yes (refresh token) |
| GET | /api/auth/verify/:token | Verify email | No |

---

**Last Updated**: November 4, 2025
**Phase**: 11 - Backend Integration Complete ✅
