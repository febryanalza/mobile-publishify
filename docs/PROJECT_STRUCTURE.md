# Publishify - Project Structure

## 📁 Folder Structure

```
lib/
├── main.dart                 # Entry point aplikasi
├── components/               # Komponen UI yang dapat digunakan ulang
├── pages/                    # Halaman-halaman aplikasi
│   ├── splash_screen.dart   # Splash screen
│   ├── login_page.dart      # Halaman login
│   └── register_page.dart   # Halaman register
├── services/                 # Service layer (API, Auth, dll)
├── models/                   # Data models
├── widgets/                  # Custom widgets
│   ├── custom_button.dart   # Custom button widget
│   └── custom_textfield.dart # Custom text field widget
└── utils/                    # Utilities dan helpers
    ├── theme.dart           # Theme dan styling
    └── constants.dart       # Konstanta aplikasi

assets/
├── images/                   # Folder untuk gambar
└── icons/                    # Folder untuk icon
```

## 🎨 Color Palette

Aplikasi menggunakan color scheme berikut:

- **Primary Green**: #0F766E - Warna utama aplikasi
- **Primary Dark**: #0E433F - Warna aksen gelap
- **White**: #FFFFFF - Background utama
- **Background Light**: #F0F3E9 - Background alternatif
- **Grey Medium**: #ACA7A7 - Text secondary
- **Grey Disabled**: #CACACA - Disabled states
- **Yellow**: #FFDF0E - Highlights
- **Error Red**: #FF0000 - Error states
- **Google Colors**: Untuk Google Sign-In button

## 📱 Pages

### 1. Splash Screen
- Menampilkan logo dan nama aplikasi
- Otomatis redirect ke Login Page setelah 3 detik

### 2. Login Page
- Form login dengan username dan password
- Tombol "Continue with Google"
- Link ke Register Page
- Lupa password

### 3. Register Page
- Form registrasi lengkap
- Pilihan role: Writer atau Editor
- Validasi form
- Tombol "Continue with Google"
- Link kembali ke Login

## 🚀 Next Steps

1. Implementasi authentication service
2. Integrasi dengan backend API
3. Implementasi Google Sign-In
4. Membuat halaman home untuk Writer dan Editor
5. Membuat halaman profile
6. Membuat fitur pencarian editor/writer
7. Implementasi sistem messaging

## 📝 Notes

- Semua halaman saat ini menggunakan dummy data
- Focus pada tampilan UI/UX
- Service layer masih kosong dan siap untuk diimplementasikan
- Theme sudah di-setup dengan lengkap dan siap digunakan
