# Home Page - Publishify

## 📁 Struktur File

```
lib/
├── pages/
│   └── home/
│       └── home_page.dart          # Halaman utama
├── widgets/
│   ├── navigation/
│   │   └── bottom_nav_bar.dart     # Bottom navigation bar
│   └── cards/
│       ├── book_card.dart          # Card untuk tampilan buku
│       ├── status_card.dart        # Card untuk status (Draft, Revisi, dll)
│       └── action_button.dart      # Button untuk aksi cepat
├── models/
│   └── book.dart                   # Model data Buku
└── utils/
    └── dummy_data.dart             # Centralized dummy data
```

## 🎨 Komponen Home Page

### 1. Top Navigation (Header)
- Background: Primary Green dengan border radius
- Greeting: "Hi [Username]"
- Subtitle: "Apa yang mau kamu tulis hari ini?"

### 2. Search Bar
- Search input dengan icon
- Filter button (tune icon)

### 3. Status Summary
- Judul: "Kamu telah menulis"
- 4 Status Cards: Draft, Revisi, Cetak, Publish
- Menampilkan jumlah buku per status
- Dapat diklik untuk filter

### 4. Action Buttons
- 4 tombol aksi cepat:
  - New Document (note_add)
  - Edit (edit_note) - dengan notifikasi badge
  - Print (print)
  - List (list)

### 5. Books List
- Horizontal scroll
- Menampilkan semua buku
- Card dengan thumbnail, title, dan author
- Dapat diklik untuk detail

### 6. Bottom Navigation
- 4 menu: Home, Library, Notifications, Profile
- Active state indicator
- Notification badge pada tab notifications

## 📊 Dummy Data Management

### File: `lib/utils/dummy_data.dart`

Semua dummy data terpusat di file ini untuk memudahkan perubahan:

```dart
// Mudah diganti dengan data real
static List<Book> getBooks() {
  return [ /* dummy books */ ];
}
```

### Cara Mengganti dengan Data Real:

1. **Hapus Dummy Data:**
   - Buka `lib/utils/dummy_data.dart`
   - Uncomment contoh kode API call
   
2. **Ganti di Home Page:**
```dart
// Dari:
_books = DummyData.getBooks();

// Menjadi:
_books = await DummyData.fetchBooks(); // API call
```

3. **Update Model Book:**
   - Tambahkan `fromJson` dan `toJson` method
   - Sesuaikan field dengan response API

## 🔧 Komponen Reusable

### StatusCard
```dart
StatusCard(
  title: 'Draft',
  count: 5,
  onTap: () => handleTap(),
)
```

### BookCard
```dart
BookCard(
  book: bookData,
  onTap: () => openBook(),
)
```

### ActionButton
```dart
ActionButton(
  icon: Icons.note_add,
  label: 'New',
  onTap: () => createNew(),
  hasNotification: true, // optional
)
```

### CustomBottomNavBar
```dart
CustomBottomNavBar(
  currentIndex: 0,
  onTap: (index) => navigate(index),
)
```

## 🎯 Todo / Next Steps

1. ✅ Bottom Navigation dengan 4 tabs
2. ✅ Top header dengan greeting
3. ✅ Search bar dengan filter
4. ✅ Status summary cards
5. ✅ Action buttons
6. ✅ Horizontal book list
7. ⏳ Implementasi search functionality
8. ⏳ Implementasi filter
9. ⏳ Detail page untuk setiap buku
10. ⏳ Implementasi aksi buttons
11. ⏳ Halaman untuk tab lain (Library, Notifications, Profile)
12. ⏳ Integrasi dengan API real

## 💡 Tips

- Semua komponen sudah reusable
- Dummy data terpusat, mudah diganti
- State management siap untuk scale up
- Responsive design dengan scroll view
- Color palette konsisten dari theme.dart
