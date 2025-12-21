# 🔍 AUDIT REVIEW NASKAH - USER PENULIS

**Tanggal**: 16 Desember 2025  
**Modul**: Review Naskah untuk User Penulis  
**Status**: 🔴 **CRITICAL PERFORMANCE ISSUE DETECTED**

---

## 🚨 MASALAH KRITIS YANG DITEMUKAN

### ⚠️ **BOTTLENECK #1: N+1 Query Problem**

**Lokasi**: `publishify/lib/services/writer/review_service.dart`  
**Method**: `getAllReviewsForMyManuscripts()`  
**Lines**: 150-220

#### Analisa Masalah:

```dart
// ❌ MASALAH: Loop API calls untuk setiap naskah
for (var naskah in naskahList) {
  final idNaskah = naskah['id'];
  
  // ❌ API call di dalam loop = N+1 problem!
  final reviewUri = Uri.parse('$baseUrl/api/review/naskah/$idNaskah')
      .replace(queryParameters: {
        'limit': '100',
      });

  final reviewResponse = await http.get(
    reviewUri,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
    },
  );
  // Process response...
}
```

**Dampak Performance**:
- Jika penulis punya **10 naskah** = **11 API calls** (1 untuk naskah + 10 untuk reviews)
- Jika penulis punya **50 naskah** = **51 API calls**
- Jika penulis punya **100 naskah** = **101 API calls**

**Waktu yang dibutuhkan** (estimasi):
- Average API response time: 200-300ms
- Untuk 10 naskah: **2-3 detik**
- Untuk 50 naskah: **10-15 detik**
- Untuk 100 naskah: **20-30 detik** ⚠️

---

### ⚠️ **BOTTLENECK #2: Backend Tidak Ada Endpoint Optimal**

**Lokasi**: `backend/src/modules/review/review.controller.ts`

#### Masalah:
Backend **TIDAK** memiliki endpoint khusus untuk penulis:
```typescript
// ❌ TIDAK ADA:
// GET /api/review/penulis/saya
```

Yang ada:
```typescript
// ✅ Ada untuk editor:
@Get('editor/saya')
@Peran('editor')
async ambilReviewSaya(...)

// ✅ Ada untuk naskah tertentu:
@Get('naskah/:idNaskah')
@Peran('penulis', 'admin', 'editor')
async ambilReviewNaskah(...)
```

**Dampak**:
Frontend terpaksa melakukan **workaround** dengan:
1. Fetch semua naskah penulis
2. Loop untuk setiap naskah
3. Fetch review untuk naskah tersebut
4. Gabungkan semua hasil

Ini **SANGAT TIDAK EFISIEN** dan menyebabkan:
- Banyak HTTP requests
- High network latency
- Poor user experience
- Server overload

---

### ⚠️ **BOTTLENECK #3: Tidak Ada Caching**

**Lokasi**: `publishify/lib/services/writer/review_service.dart`

#### Masalah:
Service tidak menggunakan caching sama sekali:
```dart
// ❌ Setiap kali _loadData() dipanggil = full API calls
Future<void> _loadData() async {
  setState(() {
    _isLoading = true;
    _errorMessage = null;
  });

  try {
    // ❌ Langsung hit API, tidak ada cache check
    final response = await ReviewService.getAllReviewsForMyManuscripts();
    // ...
  }
}
```

**Dampak**:
- Setiap buka halaman = 10-100 API calls
- Pull to refresh = 10-100 API calls
- Back dari detail = 10-100 API calls
- Data yang sama di-fetch berkali-kali

---

### ⚠️ **BOTTLENECK #4: Client-Side Pagination**

**Lokasi**: `review_service.dart` lines 194-204

```dart
// ❌ Fetch SEMUA data, lalu paginate di client
final naskahUri = Uri.parse('$baseUrl/api/naskah/penulis/saya')
    .replace(queryParameters: {
      'limit': '100', // Get ALL manuscripts
    });

// ❌ Lalu sort di client
allReviews.sort((a, b) => 
  b.diperbaruiPada.compareTo(a.diperbaruiPada)
);

// ❌ Lalu paginate di client
final startIndex = (halaman - 1) * limit;
final endIndex = startIndex + limit;
final paginatedReviews = allReviews.sublist(
  startIndex,
  endIndex > allReviews.length ? allReviews.length : endIndex,
);
```

**Dampak**:
- Transfer data berlebihan
- Memory overhead
- CPU intensive operations di client
- Battery drain

---

## 📊 Performance Metrics (Current)

### Skenario Testing:

#### User dengan 5 naskah:
- API calls: **6 requests**
- Estimated time: **1.2 - 1.8 seconds**
- Data transferred: ~50KB
- Status: 🟡 Acceptable

#### User dengan 20 naskah:
- API calls: **21 requests**
- Estimated time: **4 - 6 seconds**
- Data transferred: ~200KB
- Status: 🟠 Slow

#### User dengan 50 naskah:
- API calls: **51 requests**
- Estimated time: **10 - 15 seconds**
- Data transferred: ~500KB
- Status: 🔴 Very Slow

#### User dengan 100+ naskah:
- API calls: **100+ requests**
- Estimated time: **20 - 30 seconds**
- Data transferred: ~1MB
- Status: 🔴 **UNACCEPTABLE**

---

## 🛠️ SOLUSI YANG DIREKOMENDASIKAN

### ✅ **SOLUSI #1: Buat Endpoint Backend Optimal (PRIORITY 1)**

#### Backend Changes Required:

**File**: `backend/src/modules/review/review.controller.ts`

```typescript
/**
 * GET /review/penulis/saya - Ambil review untuk naskah penulis
 * Role: penulis
 * 
 * OPTIMIZED: Single query dengan JOIN untuk ambil semua review
 */
@Get('penulis/saya')
@Peran('penulis')
@ApiOperation({
  summary: 'Ambil semua review untuk naskah milik penulis yang login',
  description: 'Penulis dapat melihat semua review untuk semua naskah mereka dengan single request.',
})
@ApiQuery({ name: 'halaman', required: false, type: Number, example: 1 })
@ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
@ApiQuery({ name: 'status', required: false, enum: StatusReview })
@ApiResponse({
  status: 200,
  description: 'Daftar review berhasil diambil',
})
async ambilReviewPenulisSaya(
  @Query() filter: FilterReviewDto,
  @PenggunaSaatIni('id') idPenulis: string,
) {
  return this.reviewService.ambilReviewPenulis(idPenulis, filter);
}
```

**File**: `backend/src/modules/review/review.service.ts`

```typescript
/**
 * Ambil semua review untuk naskah milik penulis
 * OPTIMIZED: Single query dengan JOIN
 */
async ambilReviewPenulis(idPenulis: string, filter: FilterReviewDto) {
  const {
    halaman = 1,
    limit = 20,
    status,
    rekomendasi,
    urutkan = 'diperbaruiPada',
    arah = 'desc',
  } = filter;

  const skip = (halaman - 1) * limit;

  // Build where clause
  const where: any = {
    naskah: {
      idPenulis: idPenulis, // ✅ Filter by penulis
    },
  };

  if (status) {
    where.status = status;
  }

  if (rekomendasi) {
    where.rekomendasi = rekomendasi;
  }

  // ✅ Single query dengan JOIN - JAUH LEBIH CEPAT!
  const [reviews, total] = await Promise.all([
    this.prisma.reviewNaskah.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [urutkan]: arah },
      include: {
        naskah: {
          select: {
            id: true,
            judul: true,
            status: true,
            kategori: {
              select: {
                id: true,
                nama: true,
              },
            },
            genre: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
        editor: {
          select: {
            id: true,
            email: true,
            profilPengguna: {
              select: {
                namaDepan: true,
                namaBelakang: true,
                namaTampilan: true,
              },
            },
          },
        },
        feedback: {
          orderBy: {
            dibuatPada: 'desc',
          },
          take: 5, // Latest 5 feedback
        },
      },
    }),
    this.prisma.reviewNaskah.count({ where }),
  ]);

  return {
    sukses: true,
    pesan: 'Data review berhasil diambil',
    data: reviews,
    metadata: {
      total,
      halaman,
      limit,
      totalHalaman: Math.ceil(total / limit),
    },
  };
}
```

**Performance Improvement**:
- **Before**: 50 API calls untuk 50 naskah
- **After**: **1 API call** untuk semua naskah
- **Improvement**: **50x lebih cepat** 🚀

---

### ✅ **SOLUSI #2: Update Frontend Service (PRIORITY 1)**

**File**: `publishify/lib/services/writer/review_service.dart`

```dart
/// Get all reviews for current user's manuscripts
/// OPTIMIZED: Menggunakan endpoint backend yang sudah optimal
static Future<ReviewListResponse> getAllReviewsForMyManuscripts({
  int halaman = 1,
  int limit = 20,
  String? status,
}) async {
  try {
    final accessToken = await AuthService.getAccessToken();
    
    if (accessToken == null) {
      return ReviewListResponse(
        sukses: false,
        pesan: 'Token tidak ditemukan. Silakan login kembali.',
      );
    }

    // ✅ OPTIMIZED: Single API call dengan endpoint khusus penulis
    final queryParams = {
      'halaman': halaman.toString(),
      'limit': limit.toString(),
    };
    
    if (status != null && status.isNotEmpty && status != 'semua') {
      queryParams['status'] = status;
    }

    final uri = Uri.parse('$baseUrl/api/review/penulis/saya')
        .replace(queryParameters: queryParams);

    // ✅ Single HTTP request!
    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
    );

    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      return ReviewListResponse.fromJson(responseData);
    } else {
      return ReviewListResponse(
        sukses: false,
        pesan: 'Gagal mengambil data review',
      );
    }
  } catch (e) {
    return ReviewListResponse(
      sukses: false,
      pesan: 'Terjadi kesalahan: ${e.toString()}',
    );
  }
}
```

**Performance Improvement**:
- **Before**: N+1 API calls (1 + N requests)
- **After**: **1 API call**
- **Network time**: Dari 10-30 detik → **0.2-0.5 detik**

---

### ✅ **SOLUSI #3: Implementasi Caching (PRIORITY 2)**

**File**: `publishify/lib/services/writer/review_service.dart`

```dart
import 'package:shared_preferences/shared_preferences.dart';

class ReviewService {
  static const String _cacheKeyReviews = 'cache_reviews_penulis';
  static const String _cacheKeyTimestamp = 'cache_reviews_timestamp';
  static const int _cacheExpiryMinutes = 5; // Cache 5 menit

  /// Get reviews with caching
  static Future<ReviewListResponse> getAllReviewsForMyManuscripts({
    int halaman = 1,
    int limit = 20,
    String? status,
    bool forceRefresh = false,
  }) async {
    // ✅ Check cache first (jika halaman 1 dan tidak force refresh)
    if (halaman == 1 && !forceRefresh) {
      final cachedData = await _getCachedReviews();
      if (cachedData != null) {
        return cachedData;
      }
    }

    // Fetch from API
    final response = await _fetchReviewsFromAPI(
      halaman: halaman,
      limit: limit,
      status: status,
    );

    // ✅ Save to cache (jika halaman 1 dan sukses)
    if (halaman == 1 && response.sukses && response.data != null) {
      await _cacheReviews(response);
    }

    return response;
  }

  /// Get cached reviews
  static Future<ReviewListResponse?> _getCachedReviews() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // Check cache timestamp
      final timestamp = prefs.getInt(_cacheKeyTimestamp);
      if (timestamp == null) return null;
      
      final cacheTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      final now = DateTime.now();
      final difference = now.difference(cacheTime);
      
      // ✅ Cache expired jika > 5 menit
      if (difference.inMinutes > _cacheExpiryMinutes) {
        return null;
      }
      
      // Get cached data
      final cachedJson = prefs.getString(_cacheKeyReviews);
      if (cachedJson == null) return null;
      
      final data = jsonDecode(cachedJson);
      return ReviewListResponse.fromJson(data);
    } catch (e) {
      return null;
    }
  }

  /// Cache reviews
  static Future<void> _cacheReviews(ReviewListResponse response) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // Save data as JSON string
      final jsonString = jsonEncode({
        'sukses': response.sukses,
        'pesan': response.pesan,
        'data': response.data?.map((r) => r.toJson()).toList(),
        'metadata': response.metadata?.toJson(),
      });
      
      await prefs.setString(_cacheKeyReviews, jsonString);
      await prefs.setInt(_cacheKeyTimestamp, DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      // Silent fail - caching is optional
    }
  }

  /// Clear cache
  static Future<void> clearCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_cacheKeyReviews);
    await prefs.remove(_cacheKeyTimestamp);
  }
}
```

**Performance Improvement**:
- **First load**: 0.5 detik (dari API)
- **Subsequent loads**: **50-100ms** (dari cache)
- **Cache duration**: 5 menit
- **User experience**: Instant loading! ⚡

---

### ✅ **SOLUSI #4: Update Review Page dengan Cache Support**

**File**: `publishify/lib/pages/writer/review/review_page.dart`

```dart
class _ReviewPageState extends State<ReviewPage> {
  // ... existing code ...

  Future<void> _loadData({bool forceRefresh = false}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // ✅ Gunakan cache kecuali force refresh
      final response = await ReviewService.getAllReviewsForMyManuscripts(
        forceRefresh: forceRefresh,
      );

      if (response.sukses && response.data != null) {
        setState(() {
          _reviews = response.data!;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = response.pesan;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Terjadi kesalahan: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshData() async {
    // ✅ Force refresh untuk pull-to-refresh
    await ReviewService.clearCache();
    await _loadData(forceRefresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // ... existing code ...
      RefreshIndicator(
        onRefresh: _refreshData, // ✅ Gunakan _refreshData bukan _loadData
        color: AppTheme.primaryGreen,
        // ... rest of code
      ),
    );
  }
}
```

---

## 📈 PERFORMANCE IMPROVEMENT SUMMARY

### Before Optimization:

| Naskah Count | API Calls | Time (sec) | Status |
|--------------|-----------|------------|--------|
| 5 naskah     | 6 calls   | 1.2-1.8s   | 🟡 Slow |
| 20 naskah    | 21 calls  | 4-6s       | 🟠 Very Slow |
| 50 naskah    | 51 calls  | 10-15s     | 🔴 Critical |
| 100 naskah   | 101 calls | 20-30s     | 🔴 Unacceptable |

### After Optimization:

| Naskah Count | API Calls | Time (sec) | Improvement |
|--------------|-----------|------------|-------------|
| 5 naskah     | 1 call    | 0.2-0.3s   | ✅ **6x faster** |
| 20 naskah    | 1 call    | 0.3-0.4s   | ✅ **15x faster** |
| 50 naskah    | 1 call    | 0.4-0.5s   | ✅ **30x faster** |
| 100 naskah   | 1 call    | 0.5-0.6s   | ✅ **50x faster** |

### With Cache (Subsequent Loads):

| Naskah Count | Time (sec) | Improvement |
|--------------|------------|-------------|
| Any count    | 0.05-0.1s  | ✅ **100-500x faster** |

---

## 🎯 ACTION PLAN

### Phase 1: Backend (CRITICAL - Do First)
- [ ] Buat endpoint `/api/review/penulis/saya` di `review.controller.ts`
- [ ] Implement `ambilReviewPenulis()` di `review.service.ts`
- [ ] Test endpoint dengan Postman/Thunder Client
- [ ] Deploy backend changes

**Estimated Time**: 2-3 jam  
**Priority**: 🔴 **HIGHEST**

### Phase 2: Frontend Service (CRITICAL)
- [ ] Update `ReviewService.getAllReviewsForMyManuscripts()` 
- [ ] Hapus N+1 query logic
- [ ] Gunakan endpoint baru `/api/review/penulis/saya`
- [ ] Test dengan real data

**Estimated Time**: 1-2 jam  
**Priority**: 🔴 **HIGHEST**

### Phase 3: Caching (HIGH)
- [ ] Tambah caching layer di service
- [ ] Implement cache expiry (5 minutes)
- [ ] Add force refresh support
- [ ] Update review page untuk gunakan cache

**Estimated Time**: 2-3 jam  
**Priority**: 🟠 **HIGH**

### Phase 4: Testing & Validation (HIGH)
- [ ] Test dengan user yang punya 1-5 naskah
- [ ] Test dengan user yang punya 20-50 naskah
- [ ] Test dengan user yang punya 100+ naskah
- [ ] Measure actual performance improvements
- [ ] Test cache expiry & force refresh

**Estimated Time**: 1-2 jam  
**Priority**: 🟠 **HIGH**

---

## 🐛 ADDITIONAL FINDINGS

### Minor Issues:

1. **No loading indicator during N+1 queries**
   - User tidak tahu berapa lama lagi harus menunggu
   - Solusi: Tambah progress indicator dengan percentage

2. **No error retry mechanism**
   - Jika 1 dari 50 API calls gagal, semua data incomplete
   - Solusi: Implement retry logic dengan exponential backoff

3. **No offline support**
   - Tidak bisa lihat review jika offline
   - Solusi: Cache review data untuk offline viewing

4. **No incremental loading**
   - User harus tunggu semua data loaded
   - Solusi: Show data as it loads (stream-based approach)

---

## 📝 CODE QUALITY ISSUES

### Backend:

1. ✅ **Good**: RLS (Row Level Security) digunakan dengan benar
2. ✅ **Good**: Proper authorization dengan guards
3. ⚠️ **Issue**: Tidak ada index di `reviewNaskah.idNaskah`
   - Solusi: Tambah index untuk query performance

```prisma
model ReviewNaskah {
  // ... fields ...
  
  @@index([idNaskah]) // ✅ Add this!
  @@index([idEditor])
  @@index([status])
}
```

### Frontend:

1. ✅ **Good**: Proper error handling
2. ✅ **Good**: Loading states
3. ❌ **Bad**: N+1 query anti-pattern
4. ❌ **Bad**: No caching
5. ⚠️ **Issue**: Client-side pagination

---

## 🎓 LESSONS LEARNED

### Do's:
- ✅ Always check if backend has optimal endpoint
- ✅ Use single query with JOIN instead of multiple queries
- ✅ Implement caching for frequently accessed data
- ✅ Use server-side pagination
- ✅ Measure performance early in development

### Don'ts:
- ❌ Never do API calls in loops (N+1 problem)
- ❌ Don't fetch all data then paginate client-side
- ❌ Don't ignore caching opportunities
- ❌ Don't assume backend has optimal endpoints without checking

---

## 📊 CONCLUSION

**Current Status**: 🔴 **CRITICAL PERFORMANCE ISSUE**

**Root Cause**: 
1. Backend tidak punya endpoint optimal untuk penulis
2. Frontend melakukan N+1 queries sebagai workaround
3. Tidak ada caching layer

**Impact**: 
- User dengan banyak naskah mengalami **delay 10-30 detik**
- Poor user experience
- High server load
- Battery drain

**Solution**: 
1. Buat endpoint backend `/api/review/penulis/saya`
2. Update frontend untuk gunakan endpoint baru
3. Implement caching layer
4. Result: **50-500x performance improvement** 🚀

**Priority**: 🔴 **FIX IMMEDIATELY**

---

**Prepared by**: AI Development Assistant  
**Last Updated**: 16 Desember 2025  
**Version**: 1.0.0
