# Statistics Page - Publishify

## 📁 Struktur File

```
lib/
├── pages/
│   └── statistics/
│       └── statistics_page.dart    # Halaman statistik
├── widgets/
│   └── cards/
│       ├── sales_chart.dart        # Line chart penjualan
│       ├── comment_card.dart       # Card komentar user
│       └── rating_bar.dart         # Bar rating dengan progress
├── models/
│   └── statistics.dart             # Model data statistik
└── utils/
    └── dummy_data.dart             # Dummy data statistik
```

## 🎨 Komponen Statistics Page

### 1. Top Navigation (Header)
- Background: Primary Green dengan border radius
- Title: "Statistik"
- Grid icon button di pojok kanan

### 2. Sales Chart (Line Chart)
- Library: `fl_chart` package
- Data: 6 bulan terakhir (Jan - Jun)
- Features:
  - Line chart dengan gradient area
  - Dots pada setiap data point
  - Grid horizontal
  - X-axis labels (bulan)
  - Responsive height

### 3. Comments Section (Kiri)
- Judul: "Komentar"
- List komentar users:
  - Avatar/Initial user
  - Username
  - Rating stars (1-5)
  - Comment text
  - Max 2 lines dengan ellipsis

### 4. Ratings Section (Kanan)
- Judul: "Rating"
- Average rating display (besar dengan star)
- Rating distribution (5 - 1 stars):
  - Star icon
  - Progress bar
  - Count angka
  - Percentage-based width

### 5. Bottom Navigation
- Same as Home Page
- Active pada index 1 (Statistics)

## 📊 Dummy Data Management

### File: `lib/utils/dummy_data.dart`

```dart
static Statistics getStatistics() {
  return Statistics(
    salesData: _getSalesData(),
    comments: _getComments(),
    ratings: _getRatings(),
    averageRating: 4.2,
  );
}
```

### Data Structure:

#### ChartData
```dart
ChartData(
  label: 'Jan',
  value: 15,
  date: DateTime(2025, 1),
)
```

#### Comment
```dart
Comment(
  id: '1',
  userName: 'User A',
  comment: 'Great book!',
  rating: 5.0,
  date: DateTime.now(),
)
```

#### Rating
```dart
Rating(
  stars: 5,
  count: 120,
  percentage: 0.6, // 60%
)
```

## 🔧 Komponen Reusable

### SalesChart
```dart
SalesChart(
  data: chartData,
  title: 'Penjualan',
)
```

**Features:**
- Line chart dengan smooth curves
- Gradient area below line
- Dots pada data points
- Customizable colors dari theme

### CommentCard
```dart
CommentCard(
  comment: commentData,
)
```

**Features:**
- Circular avatar dengan initial
- Username dan rating
- Comment text dengan max lines
- Compact design

### RatingBar
```dart
RatingBar(
  rating: ratingData,
)
```

**Features:**
- Star icon
- Progress bar dengan percentage
- Count display
- Yellow color untuk stars

## 📦 Dependencies

### fl_chart: ^0.69.0
Library untuk membuat charts yang beautiful dan interactive.

**Installation:**
```yaml
dependencies:
  fl_chart: ^0.69.0
```

**Import:**
```dart
import 'package:fl_chart/fl_chart.dart';
```

## 🔄 Mengganti dengan Data Real

### Step 1: Update Model
```dart
// lib/models/statistics.dart
class Statistics {
  factory Statistics.fromJson(Map<String, dynamic> json) {
    return Statistics(
      salesData: (json['salesData'] as List)
          .map((e) => ChartData.fromJson(e))
          .toList(),
      comments: (json['comments'] as List)
          .map((e) => Comment.fromJson(e))
          .toList(),
      ratings: (json['ratings'] as List)
          .map((e) => Rating.fromJson(e))
          .toList(),
      averageRating: json['averageRating'].toDouble(),
    );
  }
}
```

### Step 2: Create API Service
```dart
// lib/services/statistics_service.dart
class StatisticsService {
  static Future<Statistics> fetchStatistics() async {
    final response = await http.get(
      Uri.parse('$baseUrl/statistics'),
    );
    
    if (response.statusCode == 200) {
      return Statistics.fromJson(json.decode(response.body));
    }
    throw Exception('Failed to load statistics');
  }
}
```

### Step 3: Update Statistics Page
```dart
void _loadData() async {
  // From:
  _statistics = DummyData.getStatistics();
  
  // To:
  try {
    _statistics = await StatisticsService.fetchStatistics();
    setState(() {});
  } catch (e) {
    // Handle error
  }
}
```

## 🎯 Features Implemented

- ✅ Top header dengan title
- ✅ Line chart untuk penjualan (6 data points)
- ✅ Comments section dengan 5 komentar
- ✅ Ratings section dengan distribution
- ✅ Average rating display
- ✅ Bottom navigation
- ✅ Scroll view support
- ✅ Responsive layout (2 kolom)
- ✅ Dummy data terpusat
- ✅ Reusable components

## 💡 Tips

1. **Chart Customization:**
   - Ubah warna di `SalesChart` widget
   - Sesuaikan interval grid
   - Modify dot size dan style

2. **Performance:**
   - Limit comments display (take 5)
   - Use ListView.builder untuk list panjang
   - Cache chart data

3. **Responsive:**
   - Row layout untuk tablet/desktop
   - Column layout untuk mobile
   - Adjust padding/spacing

4. **Data Update:**
   - Pull-to-refresh
   - Real-time updates via WebSocket
   - Periodic auto-refresh

## 🎨 Color Scheme

Menggunakan theme.dart:
- Primary Green: Chart line, headers
- Yellow: Stars, ratings
- White: Card backgrounds
- Grey: Labels, secondary text
- Background Light: Chart background

## 📱 Navigation Flow

```
Home Page
    ↓ (tap tab 1)
Statistics Page
    ↓ (tap tab 0)
Back to Home
```
