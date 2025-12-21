# Statistik Page - Quick Guide

## 🚀 Cara Menggunakan

### 1. Navigation
```dart
// Dari Home Page, tap bottom nav index 1
// Atau programmatically:
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const StatisticsPage(),
  ),
);
```

### 2. Load Data
```dart
// Default (Dummy)
_statistics = DummyData.getStatistics();

// From API (Future)
_statistics = await StatisticsService.fetchStatistics();
```

## 📊 Chart Configuration

### Basic Usage
```dart
SalesChart(
  data: [
    ChartData(label: 'Jan', value: 15, date: DateTime(2025, 1)),
    ChartData(label: 'Feb', value: 25, date: DateTime(2025, 2)),
  ],
  title: 'Penjualan',
)
```

### Custom Colors
```dart
// Edit di sales_chart.dart
LineChartBarData(
  color: AppTheme.primaryGreen,  // Line color
  belowBarData: BarAreaData(
    color: AppTheme.primaryGreen.withValues(alpha: 0.1),  // Area color
  ),
)
```

### Adjust Grid
```dart
gridData: FlGridData(
  horizontalInterval: 10,  // Interval antar garis
  getDrawingHorizontalLine: (value) {
    return FlLine(
      color: AppTheme.greyDisabled.withValues(alpha: 0.3),
      strokeWidth: 1,
    );
  },
),
```

## 💬 Comments

### Display Comments
```dart
Column(
  children: _statistics.comments.take(5).map((comment) {
    return CommentCard(comment: comment);
  }).toList(),
)
```

### Filter Comments
```dart
// By rating
final highRatedComments = _statistics.comments
    .where((c) => c.rating >= 4.0)
    .toList();

// Recent comments
final recentComments = _statistics.comments
    .take(10)
    .toList();
```

## ⭐ Ratings

### Calculate Average
```dart
double calculateAverage(List<Rating> ratings) {
  double totalScore = 0;
  int totalCount = 0;
  
  for (var rating in ratings) {
    totalScore += rating.stars * rating.count;
    totalCount += rating.count;
  }
  
  return totalScore / totalCount;
}
```

### Get Total Reviews
```dart
int getTotalReviews(List<Rating> ratings) {
  return ratings.fold(0, (sum, rating) => sum + rating.count);
}
```

## 🎨 Customization

### Chart Height
```dart
// Di sales_chart.dart
SizedBox(
  height: 200,  // Adjust this
  child: LineChart(...),
)
```

### Comment Limit
```dart
// Di statistics_page.dart
...(_statistics.comments.take(5).map((comment) {
  //                        ^ Change this number
  return CommentCard(comment: comment);
})),
```

### Colors
Semua warna menggunakan `AppTheme`:
- `AppTheme.primaryGreen` - Chart, headers
- `AppTheme.yellow` - Stars
- `AppTheme.greyMedium` - Text secondary
- `AppTheme.white` - Backgrounds

## 🔄 Real-time Updates

```dart
// Setup timer untuk auto-refresh
Timer.periodic(Duration(minutes: 5), (timer) {
  _loadData();
});

// Pull to refresh
RefreshIndicator(
  onRefresh: () async {
    await _loadData();
  },
  child: SingleChildScrollView(...),
)
```

## 📱 Responsive Design

### Tablet/Desktop Layout
```dart
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth > 768) {
      // Tablet/Desktop: 2 columns
      return Row(
        children: [
          Expanded(child: CommentsSection()),
          SizedBox(width: 16),
          Expanded(child: RatingsSection()),
        ],
      );
    } else {
      // Mobile: Stack vertically
      return Column(
        children: [
          CommentsSection(),
          SizedBox(height: 16),
          RatingsSection(),
        ],
      );
    }
  },
)
```

## 🐛 Common Issues

### Chart tidak muncul
- Check data tidak kosong
- Verify maxY calculation
- Ensure spots are valid

### Rating bar tidak proporsional
- Check percentage calculation (0.0 - 1.0)
- Verify total count

### Comments overflow
- Use maxLines dan overflow
- Add scrollable container jika perlu

## 📚 Documentation

- **fl_chart**: https://pub.dev/packages/fl_chart
- **Line Chart Guide**: https://github.com/imaNNeo/fl_chart/blob/main/repo_files/documentations/line_chart.md

## 🎯 Next Features

- [ ] Filter by date range
- [ ] Export to PDF/Excel
- [ ] Interactive chart tooltips
- [ ] Sort comments by rating/date
- [ ] Pagination for comments
- [ ] Real-time updates
- [ ] Comparison charts
- [ ] Download chart as image
