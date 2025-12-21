# 🔐 Auto-Login & Session Management

## Overview
Implementasi persistent login menggunakan SharedPreferences agar user tidak perlu login ulang setiap kali membuka aplikasi.

---

## 🎯 Features Implemented

### 1. **Auto-Login on App Start**
- ✅ Check login status di Splash Screen
- ✅ Redirect otomatis ke Home jika sudah login
- ✅ Load user data dari SharedPreferences
- ✅ Redirect ke Login jika belum login

### 2. **Session Persistence**
- ✅ Save login data ke SharedPreferences setelah login berhasil
- ✅ Data tersimpan meskipun app ditutup
- ✅ Data otomatis ter-load saat app dibuka kembali

### 3. **Logout Functionality**
- ✅ Clear semua data dari SharedPreferences
- ✅ Navigate ke Login Page
- ✅ Clear navigation stack (tidak bisa back ke Home)

---

## 📱 Flow Diagram

### **App Launch Flow**
```
App Start
    ↓
Splash Screen (3 detik)
    ↓
Check: isLoggedIn()?
    ↓
    ├─ YES → Load userName → Navigate to Home Page
    │
    └─ NO → Navigate to Login Page
```

### **Login Flow**
```
User Input (email, password)
    ↓
Validate Input
    ↓
Call API: AuthService.login()
    ↓
Backend Response
    ↓
Save to SharedPreferences:
  - access_token
  - refresh_token
  - user_id
  - user_email
  - nama_tampilan
  - peran
  - is_logged_in = true
    ↓
Navigate to Success Page
    ↓
Auto Navigate to Home (3 sec)
```

### **Logout Flow**
```
User clicks "Keluar" in Profile
    ↓
Show Confirmation Dialog
    ↓
User confirms
    ↓
Show Loading
    ↓
Call: AuthService.logout()
    ↓
Clear ALL SharedPreferences data:
  - access_token
  - refresh_token
  - user_id
  - user_email
  - nama_tampilan
  - peran
  - terverifikasi
  - user_data
  - is_logged_in
    ↓
Navigate to Login Page
(Clear all routes - tidak bisa back)
```

---

## 🔧 Implementation Details

### **File: `splash_screen.dart`**

**Before**:
```dart
_navigateToLogin() async {
  await Future.delayed(const Duration(seconds: 3));
  Navigator.pushReplacement(
    context,
    MaterialPageRoute(builder: (context) => const LoginPage()),
  );
}
```

**After**:
```dart
Future<void> _checkAuthAndNavigate() async {
  // Show splash screen for 3 seconds
  await Future.delayed(const Duration(seconds: 3));
  
  if (!mounted) return;

  // Check if user is logged in
  final isLoggedIn = await AuthService.isLoggedIn();
  
  if (isLoggedIn) {
    // User sudah login, ambil data user
    final userName = await AuthService.getNamaTampilan();
    
    // Navigate to Home Page
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => HomePage(userName: userName),
      ),
    );
  } else {
    // User belum login, navigate ke Login Page
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => const LoginPage(),
      ),
    );
  }
}
```

---

### **File: `profile_page.dart`**

**Logout Implementation**:
```dart
void _showLogoutConfirmation() {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Keluar'),
      content: const Text('Apakah Anda yakin ingin keluar?'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Batal'),
        ),
        TextButton(
          onPressed: () async {
            Navigator.pop(context); // Close dialog
            
            // Show loading
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Row(
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                    SizedBox(width: 16),
                    Text('Logging out...'),
                  ],
                ),
                duration: Duration(seconds: 2),
              ),
            );
            
            // Call logout service to clear all data
            await AuthService.logout();
            
            // Navigate to login and clear all routes
            if (mounted) {
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/login',
                (route) => false,
              );
            }
          },
          child: const Text(
            'Keluar',
            style: TextStyle(color: AppTheme.errorRed),
          ),
        ),
      ],
    ),
  );
}
```

---

## 📊 SharedPreferences Keys

### **Login State**
| Key | Type | Description | Set On | Cleared On |
|-----|------|-------------|--------|------------|
| `is_logged_in` | bool | Login status | Login success | Logout |
| `access_token` | String | JWT access token (1h) | Login success | Logout |
| `refresh_token` | String | JWT refresh token (7d) | Login success | Logout |

### **User Info**
| Key | Type | Description | Set On | Cleared On |
|-----|------|-------------|--------|------------|
| `user_id` | String | User UUID | Login/Register | Logout |
| `user_email` | String | User email | Login/Register | Logout |
| `nama_depan` | String | First name | Login success | Logout |
| `nama_belakang` | String | Last name | Login success | Logout |
| `nama_tampilan` | String | Display name | Login success | Logout |
| `peran` | List<String> | User roles | Login success | Logout |
| `terverifikasi` | bool | Email verified | Login success | Logout |

### **Complete Data**
| Key | Type | Description | Set On | Cleared On |
|-----|------|-------------|--------|------------|
| `user_data` | String (JSON) | Complete LoginData | Login success | Logout |
| `token_verifikasi` | String | Email verification token | Register success | Logout |

---

## 🧪 Testing Scenarios

### **Scenario 1: First Time User**
1. Open app → Splash Screen → Login Page
2. User melakukan registrasi → Success Page → Home Page
3. Close app
4. Open app → Splash Screen → **Login Page** (belum login, hanya register)

### **Scenario 2: User Login**
1. Open app → Splash Screen → Login Page
2. User login → Success Page → Home Page
3. Close app
4. Open app → Splash Screen → **Home Page** ✅ (auto-login)

### **Scenario 3: User Logout**
1. User sudah login → Home Page
2. Navigate to Profile → Click "Keluar"
3. Confirm logout → Loading → Login Page
4. Try back button → **Cannot go back** (stack cleared)
5. Close app
6. Open app → Splash Screen → **Login Page** (data cleared)

### **Scenario 4: Token Expiry** (Future Enhancement)
1. User login → access_token saved (expire 1h)
2. Use app normally (< 1 hour) → Works fine
3. Close app and wait 1+ hour
4. Open app → Auto-login → Home Page
5. Try API call → **401 Unauthorized**
6. Need: Implement auto-refresh or auto-logout

---

## 🔒 Security Considerations

### **Current Implementation**
- ✅ Uses SharedPreferences (Plain text storage)
- ✅ Data persists across app restarts
- ✅ Logout clears all data completely

### **Limitations**
- ⚠️ SharedPreferences is **NOT encrypted**
- ⚠️ Tokens stored in plain text
- ⚠️ Vulnerable on rooted/jailbroken devices

### **Production Recommendations**
1. **Use flutter_secure_storage** instead of SharedPreferences
   ```dart
   // Add to pubspec.yaml
   flutter_secure_storage: ^9.0.0
   
   // Usage
   final storage = FlutterSecureStorage();
   await storage.write(key: 'access_token', value: token);
   ```

2. **Implement Token Refresh**
   - Auto-refresh access_token before expiry
   - Use refresh_token to get new access_token
   - Handle 401 errors gracefully

3. **Add Biometric Authentication** (Optional)
   - Lock app with fingerprint/face ID
   - Re-authenticate for sensitive actions

4. **Session Timeout**
   - Auto-logout after X minutes of inactivity
   - Show session expiry warning

---

## 🎯 User Experience

### **Login Once, Stay Logged In**
✅ User tidak perlu login ulang setiap buka app  
✅ Seamless experience seperti Instagram, Facebook, WhatsApp  
✅ Data user ter-load otomatis (nama, email, role)

### **Quick App Launch**
```
App Launch → 3s Splash → Home (if logged in)
          → 3s Splash → Login (if not logged in)
```

### **Logout Feedback**
✅ Confirmation dialog (prevent accidental logout)  
✅ Loading indicator during logout  
✅ Clear navigation stack (security)

---

## 📝 Code Usage Examples

### **Check Login Status Anywhere**
```dart
Future<void> checkAuth() async {
  final isLoggedIn = await AuthService.isLoggedIn();
  
  if (isLoggedIn) {
    // User is logged in
    final userName = await AuthService.getNamaTampilan();
    print('Welcome back, $userName!');
  } else {
    // User is not logged in
    Navigator.pushReplacementNamed(context, '/login');
  }
}
```

### **Get User Data**
```dart
Future<void> loadUserData() async {
  // Get individual fields
  final userId = await AuthService.getUserId();
  final email = await AuthService.getUserEmail();
  final name = await AuthService.getNamaTampilan();
  final roles = await AuthService.getUserRoles();
  final isVerified = await AuthService.isVerified();
  
  // Or get complete data
  final loginData = await AuthService.getLoginData();
  if (loginData != null) {
    print('Access Token: ${loginData.accessToken}');
    print('User: ${loginData.pengguna.profilPengguna?.namaTampilan}');
  }
}
```

### **Protected Route**
```dart
class ProtectedPage extends StatefulWidget {
  @override
  _ProtectedPageState createState() => _ProtectedPageState();
}

class _ProtectedPageState extends State<ProtectedPage> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }
  
  Future<void> _checkAuth() async {
    final isLoggedIn = await AuthService.isLoggedIn();
    if (!isLoggedIn) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(/* ... */);
  }
}
```

---

## 🚀 Next Steps & Enhancements

### **Phase 1: Security** (High Priority)
- [ ] Migrate to `flutter_secure_storage`
- [ ] Implement token refresh mechanism
- [ ] Handle 401 errors globally
- [ ] Add session timeout

### **Phase 2: UX Improvements**
- [ ] Add biometric authentication option
- [ ] Remember me checkbox (optional auto-login)
- [ ] Multiple account support
- [ ] Offline mode with cached data

### **Phase 3: Advanced Features**
- [ ] Remote logout (logout from all devices)
- [ ] Login history & device management
- [ ] Two-factor authentication (2FA)
- [ ] Social login persistence (Google, Facebook)

---

## 📚 Related Documentation
- [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) - API integration details
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues & solutions

---

**Last Updated**: November 4, 2025  
**Status**: ✅ Auto-Login Implemented & Tested  
**Version**: 1.0.0
