# Fix: Unauthorized Error pada Halaman Notifikasi

**Tanggal:** 11 November 2025  
**Issue:** Unauthorized error ketika membuka halaman notifikasi  
**Status:** ✅ FIXED

---

## 🔍 Root Cause

Token JWT disimpan dengan key yang **TIDAK KONSISTEN** antara AuthService dan NotifikasiService:

### AuthService (CORRECT):
```dart
static const String _keyAccessToken = 'access_token';  // With underscore
await prefs.setString(_keyAccessToken, data.accessToken);
```

### NotifikasiService & NotifikasiSocketService (WRONG):
```dart
return prefs.getString('accessToken');  // WITHOUT underscore ❌
```

**Result:** Token tidak ditemukan → Request tanpa Authorization header → Backend return `401 Unauthorized`

---

## ✅ Solusi

### 1. Fixed NotifikasiService.dart
```dart
// BEFORE ❌
return prefs.getString('accessToken');

// AFTER ✅
return prefs.getString('access_token'); // Fixed: use correct key with underscore
```

### 2. Fixed NotifikasiSocketService.dart
```dart
// BEFORE ❌
return prefs.getString('accessToken');

// AFTER ✅
return prefs.getString('access_token'); // Fixed: use correct key with underscore
```

### 3. Enhanced Error Handling

#### NotifikasiService.dart
- ✅ Added debug logging untuk token validation
- ✅ Added specific error message untuk 401 Unauthorized
- ✅ Added request/response logging

#### NotificationsPage.dart
- ✅ Added detailed error logging
- ✅ Added SnackBar untuk Unauthorized error dengan action button ke login page
- ✅ Added auto-redirect ke login jika token invalid

#### NotifikasiSocketService.dart
- ✅ Added token validation sebelum connect
- ✅ Added token length & preview logging
- ✅ Added connection status indicator

---

## 📋 Files Changed

1. **publishify/lib/services/notifikasi_service.dart**
   - Fixed: `accessToken` → `access_token`
   - Added: Debug logging
   - Added: 401 error handling

2. **publishify/lib/services/notifikasi_socket_service.dart**
   - Fixed: `accessToken` → `access_token`
   - Added: Token validation
   - Added: Debug logging

3. **publishify/lib/pages/notifications/notifications_page.dart**
   - Added: Unauthorized error detection
   - Added: Auto-redirect to login
   - Added: Debug logging

---

## 🧪 Testing

### Test Case 1: Valid Token
```bash
✅ User logged in
✅ Token exists in SharedPreferences with key 'access_token'
✅ Notifications page loads successfully
✅ WebSocket connects successfully
✅ Real-time notifications work
```

### Test Case 2: Invalid/Expired Token
```bash
✅ Error message shown: "Unauthorized - Token tidak valid atau sudah kedaluwarsa"
✅ SnackBar appears dengan message "Sesi login Anda telah berakhir"
✅ Action button "Login" redirects to login page
```

### Test Case 3: No Token
```bash
✅ WebSocket won't connect (logged: "No token found")
✅ API request fails with Unauthorized
✅ User redirected to login
```

---

## 🔑 Key Takeaways

### 1. **Consistent Key Naming**
Always use the same key for SharedPreferences across all services:
- ✅ `access_token` (with underscore) - STANDARD
- ❌ `accessToken` (camelCase) - INCONSISTENT

### 2. **Centralized Token Management**
Best practice: Use `AuthService.getAccessToken()` instead of direct `prefs.getString()`:

```dart
// ✅ GOOD - Centralized
final token = await AuthService.getAccessToken();

// ❌ BAD - Direct access (risk of typo)
final prefs = await SharedPreferences.getInstance();
final token = prefs.getString('access_token'); // Risk: typo in key
```

### 3. **Debug Logging**
Always add debug logging untuk authentication issues:
- Token existence check
- Token length & preview
- Request URL & headers
- Response status & body

### 4. **Error Handling**
Provide clear feedback untuk authentication errors:
- Show user-friendly error messages
- Provide action buttons (e.g., Login button)
- Auto-redirect jika perlu

---

## 📝 Verification Steps

1. **Check Token Storage:**
   ```dart
   final prefs = await SharedPreferences.getInstance();
   final token = prefs.getString('access_token');
   print('Token exists: ${token != null}');
   ```

2. **Check NotifikasiService:**
   ```dart
   final response = await NotifikasiService.getNotifikasi();
   print('Response sukses: ${response.sukses}');
   print('Response pesan: ${response.pesan}');
   ```

3. **Check WebSocket:**
   ```dart
   final socketService = NotifikasiSocketService();
   await socketService.connect();
   // Check console logs for connection status
   ```

---

## 🚀 Next Steps

- ✅ Test dengan user yang sudah login
- ✅ Test dengan token expired
- ✅ Test WebSocket reconnection
- ✅ Verify real-time notifications work
- ⏸️ Consider implementing token refresh logic
- ⏸️ Consider implementing auto-logout on 401 errors globally

---

## 📚 Related Files

- `lib/services/auth_service.dart` - Token storage dengan key `access_token`
- `lib/services/notifikasi_service.dart` - HTTP API calls
- `lib/services/notifikasi_socket_service.dart` - WebSocket connection
- `lib/pages/notifications/notifications_page.dart` - UI & error handling
- `backend/src/modules/notifikasi/notifikasi.controller.ts` - API endpoints
- `backend/src/modules/notifikasi/notifikasi.gateway.ts` - WebSocket gateway
