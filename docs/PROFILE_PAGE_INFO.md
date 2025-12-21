# Halaman Profile - Publishify

## Struktur File

### Models
- `lib/models/user_profile.dart` - Model untuk UserProfile dan Portfolio

### Pages
- `lib/pages/profile/profile_page.dart` - Halaman utama profile

### Widgets
- `lib/widgets/profile/stat_item.dart` - Component untuk menampilkan statistik (Buku, Rating, Viewers)
- `lib/widgets/profile/portfolio_item.dart` - Component untuk menampilkan item portfolio
- `lib/widgets/profile/profile_widgets.dart` - Export file untuk widgets profile

## Fitur

### 1. Header
- Judul "Profil"
- Menu kebab (⋮) untuk Edit Profil, Pengaturan, dan Keluar

### 2. Profile Info Card
- Foto profil dengan border kuning
- Nama lengkap
- Role (Penulis/Editor)
- Statistik (Buku, Rating, Viewers)

### 3. Bio Section
- Biodata singkat
- LinkedIn URL

### 4. Portfolio Section
- Daftar portfolio dengan:
  - Thumbnail image dengan loading state
  - Judul portfolio
  - Arrow icon untuk navigasi
  - Tap untuk membuka detail

### 5. Bottom Navigation
- Terintegrasi dengan tab lainnya (Home, Statistics, Notifications, Profile)

## Dummy Data

Data profile dummy tersimpan di `lib/utils/dummy_data.dart` dalam method:
- `getUserProfile()` - Returns UserProfile dengan 4 portfolio items

## Navigasi

### Dari Profile ke:
- Home (index 0) - popUntil first route
- Statistics (index 1) - pushReplacementNamed('/statistics')
- Notifications (index 2) - pushReplacementNamed('/notifications')

### Ke Profile dari:
- Home - pushNamed('/profile')
- Statistics - pushReplacementNamed('/profile')
- Notifications - pushReplacementNamed('/profile')

## Routes

Route untuk profile: `/profile`

Terdaftar di `lib/utils/routes.dart`:
```dart
static const String profile = '/profile';
```

## Theme

Menggunakan AppTheme dari `lib/utils/theme.dart`:
- `primaryGreen` - Header background, stat values
- `yellow` - Profile picture border
- `white` - Card backgrounds
- `greyMedium` - Secondary text
- `errorRed` - Logout text

## Reusable Components

### StatItem
```dart
StatItem(
  count: 49,
  label: 'Buku',
)
```

### PortfolioItem
```dart
PortfolioItem(
  portfolio: portfolio,
  onTap: () {
    // Handle tap
  },
)
```

## TODO - Future Enhancements

1. Edit Profil - Form untuk mengubah profile
2. Pengaturan - Halaman settings aplikasi
3. Portfolio Detail - Detail view untuk setiap portfolio
4. Upload foto profil
5. Edit portfolio
6. API Integration untuk real data
