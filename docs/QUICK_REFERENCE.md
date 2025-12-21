# Quick Reference - Publishify Components

## 📚 Import Statements

```dart
// Theme
import 'package:publishify/utils/theme.dart';

// Dummy Data
import 'package:publishify/utils/dummy_data.dart';

// Models
import 'package:publishify/models/book.dart';
import 'package:publishify/models/statistics.dart';

// All Cards (single import)
import 'package:publishify/widgets/cards/cards.dart';

// All Navigation (single import)
import 'package:publishify/widgets/navigation/navigation.dart';

// Charts
import 'package:fl_chart/fl_chart.dart';

// Pages
import 'package:publishify/pages/home/home_page.dart';
import 'package:publishify/pages/statistics/statistics_page.dart';
import 'package:publishify/pages/login_page.dart';
import 'package:publishify/pages/register_page.dart';
import 'package:publishify/pages/success_page.dart';
```

## 🎨 Component Usage Examples

### 1. Status Card
```dart
StatusCard(
  title: 'Draft',
  count: 10,
  onTap: () {
    // Handle tap
  },
)
```

### 2. Book Card
```dart
BookCard(
  book: Book(
    id: '1',
    title: 'My Book',
    author: 'Author Name',
    status: 'draft',
  ),
  onTap: () {
    // Open book detail
  },
)
```

### 3. Action Button
```dart
ActionButton(
  icon: Icons.note_add,
  label: 'New',
  onTap: () {
    // Create new document
  },
  hasNotification: false,
)
```

### 4. Bottom Navigation Bar
```dart
CustomBottomNavBar(
  currentIndex: 0,
  onTap: (index) {
    setState(() {
      _currentIndex = index;
    });
  },
)
```

## 🔄 Mengganti Dummy Data dengan Real Data

### Step 1: Update Model
```dart
// lib/models/book.dart
class Book {
  // Add fromJson
  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'],
      title: json['title'],
      author: json['author'],
      status: json['status'],
      // ... other fields
    );
  }
  
  // Add toJson
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'author': author,
      'status': status,
      // ... other fields
    };
  }
}
```

### Step 2: Create API Service
```dart
// lib/services/book_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class BookService {
  static const String baseUrl = 'https://api.publishify.com';
  
  static Future<List<Book>> fetchBooks() async {
    final response = await http.get(
      Uri.parse('$baseUrl/books'),
    );
    
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Book.fromJson(json)).toList();
    }
    throw Exception('Failed to load books');
  }
}
```

### Step 3: Update Home Page
```dart
// lib/pages/home/home_page.dart
void _loadData() async {
  // Change from:
  _books = DummyData.getBooks();
  
  // To:
  try {
    _books = await BookService.fetchBooks();
    setState(() {});
  } catch (e) {
    // Handle error
  }
}
```

## 🎯 Navigation Examples

### Navigate to Home
```dart
Navigator.pushReplacement(
  context,
  MaterialPageRoute(
    builder: (context) => HomePage(
      userName: 'John Doe',
    ),
  ),
);
```

### Navigate to Login
```dart
Navigator.pushReplacement(
  context,
  MaterialPageRoute(
    builder: (context) => const LoginPage(),
  ),
);
```

## 🎨 Theme Usage

```dart
// Colors
AppTheme.primaryGreen      // #0F766E
AppTheme.primaryDark       // #0E433F
AppTheme.white             // #FFFFFF
AppTheme.backgroundWhite   // #F0F3E9
AppTheme.greyMedium        // #ACA7A7

// Text Styles
AppTheme.headingLarge
AppTheme.headingMedium
AppTheme.headingSmall
AppTheme.bodyLarge
AppTheme.bodyMedium
AppTheme.bodySmall
AppTheme.buttonText

// Button Styles
AppTheme.primaryButtonStyle
AppTheme.secondaryButtonStyle
AppTheme.googleButtonStyle

// Input Decoration
AppTheme.inputDecoration(
  hintText: 'Username',
  prefixIcon: Icon(Icons.person),
)
```

## 📱 Screen Flow

```
Splash Screen (3s)
    ↓
Login Page
    ↓
Success Page (3s)
    ↓
Home Page
```

## 🔧 Useful Commands

```bash
# Run app
flutter run

# Analyze code
flutter analyze

# Format code
flutter format .

# Get dependencies
flutter pub get

# Clean build
flutter clean
```
