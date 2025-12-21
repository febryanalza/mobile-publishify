# Sistem Autentikasi dengan Caching & Role-Based Routing

## 📋 Ringkasan

Sistem autentikasi yang **sudah terimplementasi** dengan fitur:
- ✅ **Automatic Caching**: Semua data pengguna disimpan otomatis di SharedPreferences saat login/register
- ✅ **Role-Based Routing**: Splash screen secara otomatis mengarahkan ke halaman sesuai peran pengguna
- ✅ **Multi-Role Support**: Mendukung pengguna dengan multiple roles (menggunakan role pertama sebagai primary)
- ✅ **Persistent Session**: Data tetap tersimpan meskipun aplikasi ditutup
- ✅ **Auto Logout**: Cache otomatis dibersihkan saat logout

## 🔐 AuthService - Data Caching System

### Data yang Disimpan

Saat **login berhasil**, AuthService menyimpan semua data berikut ke SharedPreferences:

```dart
// Token autentikasi
await prefs.setString(_keyAccessToken, data.accessToken);
await prefs.setString(_keyRefreshToken, data.refreshToken);

// Data pengguna
await prefs.setString(_keyUserId, data.pengguna.id);
await prefs.setString(_keyUserEmail, data.pengguna.email);
await prefs.setStringList(_keyPeran, data.pengguna.peran); // Array of roles
await prefs.setBool(_keyTerverifikasi, data.pengguna.terverifikasi);

// Data profil
await prefs.setString(_keyNamaDepan, profil.namaDepan);
await prefs.setString(_keyNamaBelakang, profil.namaBelakang);
await prefs.setString(_keyNamaTampilan, profil.namaTampilan);

// Complete JSON untuk retrieval mudah
await prefs.setString(_keyUserData, jsonEncode(data.toJson()));

// Status login
await prefs.setBool(_keyIsLoggedIn, true);
```

### SharedPreferences Keys

```dart
static const String _keyUserId = 'userId';
static const String _keyUserEmail = 'userEmail';
static const String _keyAccessToken = 'accessToken';
static const String _keyRefreshToken = 'refreshToken';
static const String _keyUserData = 'userData';
static const String _keyPeran = 'peran';
static const String _keyTerverifikasi = 'terverifikasi';
static const String _keyNamaDepan = 'namaDepan';
static const String _keyNamaBelakang = 'namaBelakang';
static const String _keyNamaTampilan = 'namaTampilan';
static const String _keyIsLoggedIn = 'isLoggedIn';
static const String _keyTokenVerifikasi = 'tokenVerifikasi';
```

### Methods untuk Akses Data Cache

#### 1. Check Login Status
```dart
final isLoggedIn = await AuthService.isLoggedIn();
// Returns: bool (true jika user sudah login)
```

#### 2. Get User Roles
```dart
final roles = await AuthService.getUserRoles();
// Returns: List<String> (contoh: ['penulis', 'editor'])
```

#### 3. Get Primary Role
```dart
final primaryRole = await AuthService.getPrimaryRole();
// Returns: String? (role pertama dari array, contoh: 'percetakan')
```

#### 4. Check Specific Role
```dart
final isPercetakan = await AuthService.hasRole('percetakan');
// Returns: bool
```

#### 5. Get Display Name
```dart
final userName = await AuthService.getNamaTampilan();
// Returns: String? (nama untuk ditampilkan di UI)
```

#### 6. Get Complete Login Data
```dart
final loginData = await AuthService.getLoginData();
// Returns: LoginData? (complete user data object)
```

## 🚀 Splash Screen - Role-Based Routing

### Flow Diagram

```
App Start
    ↓
Splash Screen (3 seconds)
    ↓
Check isLoggedIn()
    ├─ FALSE → Login Page
    └─ TRUE → Check getPrimaryRole()
                ├─ 'penulis' → MainLayout (Writer Home)
                ├─ 'editor' → MainLayout (Editor Home)
                ├─ 'percetakan' → PercetakanDashboardPage
                └─ Unknown → MainLayout (Default)
```

### Implementasi di SplashScreen

```dart
Future<void> _checkAuthAndNavigate() async {
  // Show splash screen for 3 seconds
  await Future.delayed(const Duration(seconds: 3));
  
  if (!mounted) return;

  // Check if user is logged in
  final isLoggedIn = await AuthService.isLoggedIn();
  
  if (isLoggedIn) {
    // User sudah login, cek peran untuk routing
    final primaryRole = await AuthService.getPrimaryRole();
    final userName = await AuthService.getNamaTampilan();
    
    // Route berdasarkan peran utama
    Widget destinationPage;
    
    if (primaryRole == 'penulis') {
      // Arahkan ke halaman penulis
      destinationPage = MainLayout(
        initialIndex: 0,
        userName: userName,
      );
    } else if (primaryRole == 'editor') {
      // Arahkan ke halaman editor
      destinationPage = MainLayout(
        initialIndex: 0,
        userName: userName,
      );
    } else if (primaryRole == 'percetakan') {
      // Arahkan langsung ke dashboard percetakan
      destinationPage = const PercetakanDashboardPage();
    } else {
      // Default: arahkan ke MainLayout
      destinationPage = MainLayout(
        initialIndex: 0,
        userName: userName,
      );
    }
    
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => destinationPage,
      ),
    );
  } else {
    // User belum login atau cache dihapus
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => const LoginPage(),
      ),
    );
  }
}
```

## 📱 User Journey Examples

### Scenario 1: First Time User

```
1. User buka aplikasi
2. Splash screen (3 detik)
3. Cache kosong → diarahkan ke Login Page
4. User login dengan peran 'percetakan'
5. AuthService menyimpan semua data ke cache
6. Diarahkan ke PercetakanDashboardPage
```

### Scenario 2: Returning User (Percetakan)

```
1. User buka aplikasi
2. Splash screen (3 detik)
3. Cache ada → cek primary role = 'percetakan'
4. Langsung diarahkan ke PercetakanDashboardPage
5. (Tanpa perlu login lagi)
```

### Scenario 3: User dengan Multiple Roles

```
Backend response:
{
  "peran": ["penulis", "editor"]
}

1. User login
2. getPrimaryRole() → 'penulis' (role pertama)
3. Diarahkan ke MainLayout (Writer Home)
```

### Scenario 4: User Logout

```
1. User klik logout
2. AuthService.logout() dipanggil
3. Semua cache dibersihkan via _clearAllAuthData()
4. User diarahkan ke Login Page
5. Buka aplikasi lagi → splash screen → Login Page
```

## 🔄 Login & Register Flow

### Login Flow

```dart
// 1. User submit login form
final response = await AuthService.login(email, password);

// 2. Di dalam login():
// - API call ke backend
// - Terima response dengan accessToken, refreshToken, user data
// - Panggil _saveLoginData(response.data)
// - Set isLoggedIn = true

// 3. Data tersimpan otomatis:
// - Tokens (access & refresh)
// - User ID & email
// - Roles array
// - Profile (namaDepan, namaBelakang, namaTampilan)
// - Complete JSON
```

### Register Flow

```dart
// 1. User submit register form
final response = await AuthService.register(email, password, ...);

// 2. Di dalam register():
// - API call ke backend
// - Terima response dengan userId, email, tokenVerifikasi
// - Panggil _saveUserData(response.data)
// - Set isLoggedIn = false (butuh verifikasi)

// 3. Data yang tersimpan:
// - User ID
// - Email
// - Token verifikasi
// - isLoggedIn = false
```

## 🛠️ Implementation Details

### File yang Dimodifikasi

1. **lib/pages/auth/splash_screen.dart**
   - Ditambahkan role-based routing logic
   - Import PercetakanDashboardPage
   - Gunakan getPrimaryRole() untuk determine routing

2. **lib/services/general/auth_service.dart** (SUDAH ADA)
   - _saveLoginData() method
   - _saveUserData() method
   - getUserRoles(), getPrimaryRole(), hasRole()
   - getLoginData()
   - logout() dengan _clearAllAuthData()

### Dependencies

```yaml
dependencies:
  shared_preferences: ^2.2.2  # Untuk persistent storage
```

## 🎯 Routing Mapping

| Role | Primary Destination | Widget | Bottom Navigation |
|------|-------------------|---------|-------------------|
| `penulis` | Writer Home | `MainLayout(initialIndex: 0)` | ✅ 4 Menu (Home, Statistik, Notifikasi, Profile) |
| `editor` | Editor Home | `EditorMainPage(initialIndex: 0)` | ✅ 4 Menu (Home, Statistik, Notifikasi, Profile) |
| `percetakan` | Percetakan Dashboard | `PercetakanMainPage(initialIndex: 0)` | ✅ 5 Menu (Pesanan, Statistik, Pembayaran, Notifikasi, Profile) |
| Unknown/Null | Default Home | `MainLayout(initialIndex: 0)` | ✅ 4 Menu |
| Not Logged In | Login | `LoginPage()` | ❌ No Navigation |

## 📝 Notes

### Multi-Role Handling
- Backend mengirim peran sebagai **array of strings**: `["penulis", "editor"]`
- `getPrimaryRole()` mengambil **role pertama** dari array
- Untuk role switching, bisa implement UI toggle di masa depan

### Security Considerations
- Access token & refresh token tersimpan di SharedPreferences
- **WARNING**: SharedPreferences BUKAN storage yang sangat secure
- Untuk production: consider flutter_secure_storage untuk tokens

### Cache Persistence
- Data tetap ada meskipun aplikasi ditutup/reboot device
- Hanya hilang jika:
  - User logout
  - User clear app data
  - Uninstall aplikasi

### Token Expiration (Future Improvement)
- Saat ini belum ada auto-refresh token logic di splash
- Consider tambahkan check & refresh token saat app start
- Atau handle 401 error di interceptor untuk auto-refresh

## ✅ Testing Checklist

- [ ] Test login dengan role 'penulis' → route ke writer home
- [ ] Test login dengan role 'editor' → route ke editor home
- [ ] Test login dengan role 'percetakan' → route ke percetakan dashboard
- [ ] Test app restart dengan cache → auto login ke halaman sesuai role
- [ ] Test logout → cache terhapus → route ke login page
- [ ] Test app restart setelah logout → route ke login page
- [ ] Test register → data tersimpan tapi isLoggedIn = false
- [ ] Test user dengan multiple roles → gunakan primary role

## 🚀 Future Enhancements

1. **Role Switching UI**
   - Tambah menu untuk switch antar role jika user punya multiple roles
   - Simpan selected role ke cache

2. **Token Auto-Refresh**
   - Cek expiry token di splash screen
   - Auto refresh jika expired tapi refresh token masih valid

3. **Secure Storage**
   - Pindah tokens ke flutter_secure_storage
   - Keep non-sensitive data di SharedPreferences

4. **Onboarding Flow**
   - Tambah flag untuk first-time user
   - Show onboarding sebelum ke dashboard

5. **Role-Based Features**
   - Conditional UI based on user roles
   - Permission checking untuk sensitive actions
