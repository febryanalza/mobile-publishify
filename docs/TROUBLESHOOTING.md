# 🔧 Troubleshooting Guide

## ❌ Error: Connection Refused

### Error Message:
```
ClientException with SocketException: Connection refused
(OS Error: Connection refused, errno = 111)
address = localhost, port = 51448
uri=http://localhost:4000/api/auth/login
```

### 🔍 Diagnosis:
✅ **Backend Status**: Running perfectly on port 4000  
❌ **Issue**: Network configuration antara Flutter dan Backend

### 📝 Root Cause:
- Android Emulator tidak bisa akses `localhost` dari host machine
- `localhost` di emulator merujuk ke emulator itu sendiri, bukan host PC
- Perlu menggunakan IP khusus: `10.0.2.2` untuk Android Emulator

### ✅ Solution:

#### 1. **Untuk Android Emulator** (yang sedang digunakan):
```env
BASE_URL=http://10.0.2.2:4000
```

#### 2. **Untuk iOS Simulator**:
```env
BASE_URL=http://localhost:4000
```

#### 3. **Untuk Physical Device**:
- Pastikan PC dan device di network yang sama
- Cek IP address PC: `ipconfig` (Windows) atau `ifconfig` (Mac/Linux)
```env
BASE_URL=http://192.168.x.x:4000
```

#### 4. **Untuk Web/Desktop**:
```env
BASE_URL=http://localhost:4000
```

---

## ❌ Error: Gradle JVM Version Mismatch

### Error Message:
```
Could not resolve all dependencies for configuration 'classpath'.
Dependency requires at least JVM runtime version 11.
This build uses a Java 8 JVM.
```

### 🔍 Diagnosis:
- Gradle 8.12 membutuhkan Java 11+
- System PATH menggunakan Java 8
- Android Studio memiliki JDK 21 tapi tidak digunakan oleh Gradle

### ✅ Solution:

#### Option 1: Set JAVA_HOME (Temporary - Per Session)
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

#### Option 2: Set JAVA_HOME (Permanent)
1. Buka **System Properties** → **Environment Variables**
2. Tambahkan/Edit **JAVA_HOME**:
   ```
   C:\Program Files\Android\Android Studio\jbr
   ```
3. Update PATH untuk menambahkan:
   ```
   %JAVA_HOME%\bin
   ```
4. Restart terminal/IDE

#### Option 3: Use Flutter Config
```bash
flutter config --jdk-dir="C:\Program Files\Android\Android Studio\jbr"
```

#### Option 4: Downgrade Gradle (Not Recommended)
Edit `android/gradle/wrapper/gradle-wrapper.properties`:
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-7.6-all.zip
```

---

## 🧪 Testing Backend Connection

### PowerShell Test:
```powershell
# Test if backend is running
Test-NetConnection -ComputerName localhost -Port 4000

# Test login endpoint
$body = @{
  email='penulis@example.com'
  kataSandi='Password123!'
} | ConvertTo-Json

Invoke-WebRequest -Uri 'http://localhost:4000/api/auth/login' `
  -Method POST -Body $body -ContentType 'application/json'
```

### Expected Response:
```json
{
  "sukses": true,
  "pesan": "Login berhasil",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "pengguna": {...}
  }
}
```

---

## 📱 Platform-Specific BASE_URL Configuration

### Dynamic BASE_URL (Advanced)
Jika ingin otomatis switch berdasarkan platform:

```dart
// lib/config/api_config.dart
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static String get baseUrl {
    if (kIsWeb) {
      // Web
      return 'http://localhost:4000';
    } else if (Platform.isAndroid) {
      // Android Emulator
      return 'http://10.0.2.2:4000';
    } else if (Platform.isIOS) {
      // iOS Simulator
      return 'http://localhost:4000';
    } else {
      // Desktop (Windows/Mac/Linux)
      return 'http://localhost:4000';
    }
  }
}
```

Kemudian update `auth_service.dart`:
```dart
import 'package:publishify/config/api_config.dart';

class AuthService {
  static String get baseUrl => ApiConfig.baseUrl;
  // ... rest of code
}
```

---

## 🔥 Quick Fix Checklist

Saat error "Connection Refused":

- [ ] Backend sudah berjalan? (`Test-NetConnection localhost -Port 4000`)
- [ ] BASE_URL di `.env` sudah benar untuk platform yang digunakan?
- [ ] Sudah `flutter clean` dan `flutter pub get`?
- [ ] Restart emulator/simulator?
- [ ] Firewall tidak memblokir port 4000?
- [ ] JAVA_HOME sudah di-set ke JDK 11+?

---

## 🎯 Platform Testing Matrix

| Platform | BASE_URL | Status |
|----------|----------|--------|
| Android Emulator | `http://10.0.2.2:4000` | ✅ Fixed |
| iOS Simulator | `http://localhost:4000` | ⚠️ Not tested |
| Web Browser | `http://localhost:4000` | ⚠️ Not tested |
| Windows Desktop | `http://localhost:4000` | ⚠️ Not tested |
| Physical Device | `http://[PC_IP]:4000` | ⚠️ Not tested |

---

## 📞 Still Having Issues?

### Debug Steps:
1. **Enable HTTP Logging**:
   ```dart
   // In auth_service.dart
   print('Calling: $url');
   print('Body: ${jsonEncode(request.toJson())}');
   print('Response: ${response.body}');
   ```

2. **Check Android Logs**:
   ```bash
   flutter logs
   ```

3. **Check Backend Logs**:
   Look for incoming requests in your Node.js console

4. **Network Inspector**:
   Use Android Studio's Network Inspector to see actual requests

---

**Last Updated**: November 4, 2025  
**Status**: ✅ Connection Issue Fixed - Updated BASE_URL to `10.0.2.2` for Android Emulator
