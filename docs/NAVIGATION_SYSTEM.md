# Navigation System - Publishify

## Bottom Navigation Bar

Bottom navigation bar menggunakan `pushReplacementNamed` untuk navigasi antar halaman utama, sehingga:
- ✅ Tidak menumpuk history navigation
- ✅ Langsung mengganti halaman saat ini
- ✅ Back button akan keluar dari app (tidak kembali ke halaman sebelumnya di bottom nav)
- ✅ Menghindari navigasi ke halaman yang sama

## Navigation Flow

### Index Bottom Nav:
- **Index 0**: Home (`/home`)
- **Index 1**: Statistics (`/statistics`)
- **Index 2**: Notifications (`/notifications`)
- **Index 3**: Profile (`/profile`)

## Implementation

### HomePage (index 0)
```dart
void _onNavBarTap(int index) {
  if (index == _currentIndex) return;
  
  switch (index) {
    case 0: break; // Already on Home
    case 1: Navigator.pushReplacementNamed(context, '/statistics');
    case 2: Navigator.pushReplacementNamed(context, '/notifications');
    case 3: Navigator.pushReplacementNamed(context, '/profile');
  }
}
```

### StatisticsPage (index 1)
```dart
void _onNavBarTap(int index) {
  if (index == _currentIndex) return;
  
  switch (index) {
    case 0: Navigator.pushReplacementNamed(context, '/home');
    case 1: break; // Already on Statistics
    case 2: Navigator.pushReplacementNamed(context, '/notifications');
    case 3: Navigator.pushReplacementNamed(context, '/profile');
  }
}
```

### NotificationsPage (index 2)
```dart
void _onNavBarTap(int index) {
  if (index == _currentIndex) return;
  
  switch (index) {
    case 0: Navigator.pushReplacementNamed(context, '/home');
    case 1: Navigator.pushReplacementNamed(context, '/statistics');
    case 2: break; // Already on Notifications
    case 3: Navigator.pushReplacementNamed(context, '/profile');
  }
}
```

### ProfilePage (index 3)
```dart
void _onNavBarTap(int index) {
  if (index == _currentIndex) return;
  
  switch (index) {
    case 0: Navigator.pushReplacementNamed(context, '/home');
    case 1: Navigator.pushReplacementNamed(context, '/statistics');
    case 2: Navigator.pushReplacementNamed(context, '/notifications');
    case 3: break; // Already on Profile
  }
}
```

## Routes Configuration

Semua routes terdefinisi di `lib/utils/routes.dart`:

```dart
class AppRoutes {
  static const String home = '/home';
  static const String statistics = '/statistics';
  static const String notifications = '/notifications';
  static const String profile = '/profile';
}
```

## Key Features

1. **pushReplacementNamed**: Mengganti halaman saat ini dengan halaman baru, tidak menambah ke stack
2. **Early Return**: `if (index == _currentIndex) return;` mencegah navigasi ke halaman yang sama
3. **Switch Statement**: Lebih clean dan readable dibanding if-else chain
4. **Consistent Pattern**: Semua halaman menggunakan pola yang sama

## Navigation Behavior

### User Flow:
1. User di Home → Tap Statistics → Langsung ke Statistics (Home ter-replace)
2. User di Statistics → Tap Notifications → Langsung ke Notifications (Statistics ter-replace)
3. User di Notifications → Tap Home → Langsung ke Home (Notifications ter-replace)
4. User tap back button → Keluar app (karena tidak ada history)

### Benefits:
- Tidak ada memory leak dari stack navigation yang menumpuk
- User experience lebih smooth (tidak ada animasi back)
- Sesuai dengan pattern bottom navigation bar yang benar
- Mudah di-maintain dan di-debug

## Testing

Test navigasi dengan:
1. Tap setiap tab di bottom navigation
2. Pastikan halaman berganti dengan cepat
3. Tap tab yang sama (tidak boleh ada perubahan)
4. Tap back button (harus keluar app atau kembali ke login)
