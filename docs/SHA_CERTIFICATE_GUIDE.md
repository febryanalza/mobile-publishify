# 🔐 SHA Certificate Fingerprint Guide - Publishify

**Project:** Publishify Mobile App  
**Package Name:** `com.example.publishify`  
**Date:** November 11, 2025

---

## 📋 Apa itu SHA Certificate Fingerprint?

SHA Certificate Fingerprint adalah identitas unik dari certificate signing key yang digunakan untuk menandatangani aplikasi Android Anda. Ini diperlukan untuk:

- ✅ Firebase Authentication
- ✅ Google Sign-In
- ✅ Google Maps API
- ✅ Google Cloud Services
- ✅ Facebook Login
- ✅ OAuth 2.0 services

---

## 🔑 Jenis Certificate

### 1. Debug Certificate (Development)
- Digunakan saat development (`flutter run`)
- Lokasi: `~/.android/debug.keystore` atau `%USERPROFILE%\.android\debug.keystore`
- Password: `android`
- Alias: `androiddebugkey`

### 2. Release Certificate (Production)
- Digunakan saat build release (`flutter build apk --release`)
- Anda perlu membuat sendiri
- Password: yang Anda tentukan
- Alias: yang Anda tentukan

---

## 🛠️ Cara Mendapatkan SHA Fingerprint

### Method 1: Menggunakan Keytool (Recommended)

#### A. Debug Certificate (Development)

**Windows:**
```powershell
# Cari lokasi keytool (biasanya di Java JDK)
where keytool

# Jika keytool tidak ditemukan, gunakan path lengkap:
# Contoh path Java JDK:
# C:\Program Files\Java\jdk-11\bin\keytool.exe
# C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe

# Command untuk mendapatkan SHA fingerprint:
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**macOS/Linux:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Output yang Anda cari:**
```
Certificate fingerprints:
    SHA1: A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0
    SHA256: 12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF
```

---

#### B. Release Certificate (Production)

**Jika sudah punya release keystore:**
```powershell
keytool -list -v -keystore "path\to\your\release.keystore" -alias your-key-alias
# Akan diminta password
```

**Jika belum punya, buat dulu:**
```powershell
keytool -genkey -v -keystore release.keystore -alias publishify-release -keyalg RSA -keysize 2048 -validity 10000
```

---

### Method 2: Menggunakan Gradle (Recommended untuk Android)

**Step 1:** Buka terminal di folder `android`
```powershell
cd D:\Belajar_Bebas\Project\ikhsan\mobile-publishify\publishify\android
```

**Step 2:** Jalankan Gradle Signing Report
```powershell
# Windows
.\gradlew signingReport

# macOS/Linux
./gradlew signingReport
```

**Step 3:** Lihat output, cari section:
```
Variant: debug
Config: debug
Store: C:\Users\[Username]\.android\debug.keystore
Alias: androiddebugkey
MD5: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
SHA-256: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
Valid until: [Date]
```

**⚠️ Note:** Jika Gradle error karena Java version, pastikan menggunakan Java 11 atau lebih baru.

---

### Method 3: Menggunakan Android Studio

**Step 1:** Buka project di Android Studio

**Step 2:** Buka Gradle panel (kanan atas)

**Step 3:** Navigate to:
```
android → app → Tasks → android → signingReport
```

**Step 4:** Double-click `signingReport`

**Step 5:** Lihat output di "Run" panel

---

### Method 4: Menggunakan Firebase Console (Auto-detect)

**Step 1:** Buka [Firebase Console](https://console.firebase.google.com)

**Step 2:** Pilih project atau buat baru

**Step 3:** Pilih Android app

**Step 4:** Masukkan package name: `com.example.publishify`

**Step 5:** Download `google-services.json`

**Step 6:** Jika sudah add app, Firebase akan auto-detect SHA fingerprint dari APK yang diupload

---

## 📍 Lokasi Debug Keystore

### Windows:
```
C:\Users\[YourUsername]\.android\debug.keystore
```

### macOS/Linux:
```
~/.android/debug.keystore
```

### Default Credentials:
- **Keystore Password:** `android`
- **Key Alias:** `androiddebugkey`
- **Key Password:** `android`

---

## 🔍 Troubleshooting

### Problem 1: Keytool not found

**Solution:**
1. Cari Java JDK di komputer Anda
2. Tambahkan ke PATH atau gunakan full path:
```powershell
# Contoh path lengkap:
"C:\Program Files\Java\jdk-11\bin\keytool.exe" -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

---

### Problem 2: Gradle requires Java 11

**Solution:**
1. Install Java JDK 11 atau lebih baru
2. Set JAVA_HOME:
```powershell
# Windows
$env:JAVA_HOME="C:\Program Files\Java\jdk-11"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
```

---

### Problem 3: Debug keystore tidak ada

**Solution:**
1. Jalankan aplikasi sekali: `flutter run`
2. Debug keystore akan otomatis dibuat
3. Atau buat manual:
```powershell
keytool -genkey -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 10000
```

---

## 📝 Cara Menggunakan SHA Fingerprint

### 1. Firebase Authentication

**Step 1:** Buka [Firebase Console](https://console.firebase.google.com)

**Step 2:** Project Settings → Your apps → Android app

**Step 3:** Scroll ke "SHA certificate fingerprints"

**Step 4:** Click "Add fingerprint"

**Step 5:** Paste SHA-1 dan SHA-256 (tambahkan keduanya)

**Step 6:** Download `google-services.json` terbaru

**Step 7:** Letakkan di `android/app/google-services.json`

---

### 2. Google Sign-In

**Step 1:** Buka [Google Cloud Console](https://console.cloud.google.com)

**Step 2:** APIs & Services → Credentials

**Step 3:** Create credentials → OAuth client ID

**Step 4:** Application type: Android

**Step 5:** Masukkan:
- **Package name:** `com.example.publishify`
- **SHA-1 fingerprint:** [Your SHA-1]

**Step 6:** Save dan gunakan Client ID

---

### 3. Google Maps API

**Step 1:** Buka [Google Cloud Console](https://console.cloud.google.com)

**Step 2:** APIs & Services → Credentials

**Step 3:** Create credentials → API key

**Step 4:** Restrict API key → Android apps

**Step 5:** Add an item:
- **Package name:** `com.example.publishify`
- **SHA-1 fingerprint:** [Your SHA-1]

---

## 📋 Checklist untuk Production

### Sebelum Release:

- [ ] **Buat Release Keystore**
  ```powershell
  keytool -genkey -v -keystore publishify-release.keystore -alias publishify-release -keyalg RSA -keysize 2048 -validity 10000
  ```

- [ ] **Simpan Keystore dengan Aman**
  - Backup ke cloud storage
  - Jangan commit ke Git
  - Simpan password di password manager

- [ ] **Get Release SHA Fingerprint**
  ```powershell
  keytool -list -v -keystore publishify-release.keystore -alias publishify-release
  ```

- [ ] **Update Firebase dengan Release SHA**
  - Add release SHA-1
  - Add release SHA-256
  - Download `google-services.json` terbaru

- [ ] **Update Google Cloud Credentials**
  - Add release SHA to OAuth client
  - Add release SHA to API keys

- [ ] **Configure Gradle Signing**
  - Update `android/app/build.gradle.kts`
  - Add signing config untuk release

- [ ] **Test Release Build**
  ```powershell
  flutter build apk --release
  flutter build appbundle --release
  ```

---

## 🔐 Security Best Practices

### ✅ DO:
- Simpan release keystore di tempat aman
- Backup keystore ke multiple locations
- Gunakan password yang kuat
- Tambahkan keystore ke `.gitignore`
- Dokumentasikan credentials (di luar Git)

### ❌ DON'T:
- Jangan commit keystore ke Git
- Jangan share keystore di public
- Jangan hardcode password di code
- Jangan gunakan debug keystore untuk production

---

## 📝 Quick Commands Reference

### Get Debug SHA (Windows):
```powershell
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

### Get Debug SHA (macOS/Linux):
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Get SHA via Gradle:
```powershell
cd android
.\gradlew signingReport
```

### Create Release Keystore:
```powershell
keytool -genkey -v -keystore publishify-release.keystore -alias publishify-release -keyalg RSA -keysize 2048 -validity 10000
```

### Get Release SHA:
```powershell
keytool -list -v -keystore publishify-release.keystore -alias publishify-release
```

---

## 📞 Support

Jika mengalami kesulitan:
1. Cek Java JDK sudah terinstall (min. Java 11)
2. Cek debug keystore ada di `~/.android/debug.keystore`
3. Gunakan Android Studio untuk auto-generate
4. Hubungi: [Your Contact]

---

## 📚 Resources

- [Android Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [Firebase Setup Guide](https://firebase.google.com/docs/android/setup)
- [Google Sign-In Setup](https://developers.google.com/identity/sign-in/android/start)
- [Keytool Documentation](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/keytool.html)

---

**Last Updated:** November 11, 2025  
**Project:** Publishify Mobile App  
**Package:** com.example.publishify
