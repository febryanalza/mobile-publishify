# 📋 DOKUMENTASI ROLE-BASED NAVIGATION SYSTEM

Sistem navigasi berdasarkan peran pengguna untuk aplikasi mobile Publishify.

## 🎯 FITUR UTAMA

1. **Automatic Role Detection**: Otomatis mendeteksi peran dari response login/register
2. **Dynamic Navigation**: Mengarahkan user ke dashboard yang sesuai dengan perannya
3. **Permission Control**: Kontrol akses fitur berdasarkan peran
4. **Multi-Role Support**: Mendukung user dengan multiple roles
5. **Fallback Mechanism**: Sistem fallback jika role tidak dikenali

## 🔑 ROLE TYPES

### Role Hierarchy (berdasarkan prioritas)
1. **admin** - Administrator sistem (akses penuh)
2. **editor** - Editor review naskah  
3. **percetakan** - Staff percetakan/printing
4. **penulis** - Penulis naskah (default)

## 🗂️ FILE YANG DIBUAT

### 1. **lib/controllers/role_navigation_controller.dart**
Controller utama untuk mengelola navigasi berdasarkan role.

**Key Methods:**
- `getRoleBasedRoute()` - Dapatkan route berdasarkan role
- `navigateAfterLogin()` - Navigasi setelah login berhasil  
- `navigateAfterRegister()` - Navigasi setelah register berhasil
- `hasRolePermission()` - Check permission role
- `getPrimaryRole()` - Dapatkan role utama

### 2. **lib/routes/app_routes.dart** 
Route configuration untuk role-based navigation.

**Routes:**
```dart
// Dashboard Routes
/dashboard/admin      -> AdminDashboardPage
/dashboard/editor     -> EditorDashboardPage  
/dashboard/percetakan -> PercetakanDashboardPage
/dashboard/penulis    -> PenulisDashboardPage

// Role-specific Routes
/penulis/manuscripts  -> PenulisManuscriptListPage
/editor/reviews       -> EditorReviewListPage
/percetakan/orders    -> PercetakanOrderListPage
/admin/users          -> AdminUserManagementPage
```

### 3. **lib/examples/role_integration_guide.dart**
Panduan dan contoh implementasi.

**Contoh Widgets:**
- `UserRoleBadge` - Badge untuk menampilkan role
- `RoleBasedWidget` - Widget dengan permission control
- `RoleBasedDrawer` - Navigation drawer berdasarkan role

### 4. **Updated: lib/services/auth_service.dart**
Ditambahkan methods untuk role management.

**New Methods:**
- `saveUserRoles()` - Simpan user roles
- `getUserRoles()` - Ambil user roles
- `hasRole()` - Check specific role
- `hasAnyRole()` - Check multiple roles
- `getPrimaryRole()` - Get primary role

## 🚀 CARA IMPLEMENTASI

### Step 1: Import di halaman Login
```dart
// lib/pages/auth/login_page.dart
import 'package:publishify/controllers/role_navigation_controller.dart';

// Ganti navigation setelah login sukses:
if (response.sukses) {
  await RoleNavigationController.navigateAfterLogin(context, response);
}
```

### Step 2: Import di halaman Register  
```dart
// lib/pages/auth/register_page.dart
import 'package:publishify/controllers/role_navigation_controller.dart';

// Ganti navigation setelah register sukses:
if (registerResponse.sukses) {
  await RoleNavigationController.navigateAfterRegister(context, registerResponse);
}
```

### Step 3: Update Main App
```dart
// lib/main.dart
import 'package:publishify/routes/app_routes.dart';

MaterialApp(
  title: 'Publishify',
  onGenerateRoute: AppRoutes.generateRoute,
  initialRoute: '/', // atau gunakan dynamic initial route
)
```

### Step 4: Buat Dashboard Pages
Anda perlu membuat file-file berikut (atau gunakan yang sudah ada):

```dart
lib/pages/dashboard/
├── admin_dashboard_page.dart
├── editor_dashboard_page.dart  
├── percetakan_dashboard_page.dart
└── penulis_dashboard_page.dart
```

### Step 5: Contoh Usage di Widget
```dart
// Check role permission
final isAdmin = await AuthService.hasRole('admin');
final canEdit = await AuthService.hasAnyRole(['editor', 'admin']);

// Get user greeting
final roles = await AuthService.getUserRoles();
final greeting = RoleNavigationController.getRoleGreeting(roles);

// Conditional UI berdasarkan role
RoleBasedWidget(
  requiredRoles: ['admin'],
  child: ElevatedButton(
    onPressed: () => print('Admin only'),
    child: Text('Admin Menu'),
  ),
)
```

## 📊 FLOW DIAGRAM

```
Login/Register Success
         ↓
Extract Roles from Response
         ↓
Save Roles to SharedPreferences  
         ↓
Determine Target Route based on Primary Role
         ↓
Navigate to Role-specific Dashboard
         ↓
Dashboard loads role-specific UI & Menu
```

## 🎨 ROLE-SPECIFIC DASHBOARD FEATURES

### Admin Dashboard
- Kelola semua pengguna
- Assign editor ke review
- Manage master data (kategori, genre)
- Statistik sistem
- Override semua permission

### Editor Dashboard  
- List review yang ditugaskan
- Add feedback ke naskah
- Submit review final
- Approve/reject naskah
- Statistik review

### Percetakan Dashboard
- List pesanan cetak
- Update status produksi
- Manage pengiriman
- Track orders
- Confirm payments

### Penulis Dashboard
- Naskah saya
- Upload naskah baru
- View review feedback
- Submit untuk review
- Buat pesanan cetak

## 🛠️ CUSTOMIZATION

### 1. Tambah Role Baru
```dart
// Di role_navigation_controller.dart
static String getRoleBasedRoute(List<String> userRoles) {
  if (userRoles.contains('admin')) return '/dashboard/admin';
  if (userRoles.contains('your_new_role')) return '/dashboard/your_new_role'; // Add this
  // ... rest of roles
}

// Tambah icon & color
static IconData getRoleIcon(String role) {
  switch (role.toLowerCase()) {
    case 'your_new_role': return Icons.your_icon; // Add this
    // ... rest of cases  
  }
}
```

### 2. Custom Permission Logic
```dart
// Override hasRolePermission untuk logic custom
static bool hasCustomPermission(List<String> userRoles, String feature) {
  // Implement custom permission logic
  if (feature == 'special_feature') {
    return userRoles.contains('editor') && userRoles.contains('penulis');
  }
  return false;
}
```

### 3. Dynamic Route Generation
```dart
// Untuk route yang lebih kompleks
static String getDynamicRoute(List<String> userRoles, Map<String, dynamic> context) {
  final primaryRole = getPrimaryRole(userRoles);
  
  // Add context-aware routing
  if (context.containsKey('redirect_to')) {
    return context['redirect_to'];
  }
  
  return getRoleBasedRoute(userRoles);
}
```

## 🐛 TROUBLESHOOTING

### Problem: User roles tidak tersimpan
**Solution:** 
- Pastikan `saveUserRoles()` dipanggil setelah login sukses
- Check SharedPreferences permissions
- Verify response structure dari backend

### Problem: Navigation tidak bekerja
**Solution:**
- Pastikan route sudah didefinisikan di `app_routes.dart`  
- Check apakah dashboard pages sudah dibuat
- Verify import statements

### Problem: Permission check tidak akurat
**Solution:**
- Clear SharedPreferences cache: `AuthService.clearAllData()`
- Re-login untuk refresh roles
- Check role data structure di backend response

### Problem: Multiple roles conflict
**Solution:**
- Sistem menggunakan hierarchy (admin > editor > percetakan > penulis)
- `getPrimaryRole()` akan return role dengan prioritas tertinggi
- Customize logic di `getRoleBasedRoute()` jika perlu

## 📝 TODO IMPLEMENTATION

1. ✅ Buat RoleNavigationController
2. ✅ Update AuthService dengan role management  
3. ✅ Buat route configuration
4. ✅ Update login page integration
5. ⏳ **Buat dashboard pages yang sebenarnya**
6. ⏳ **Buat role-specific pages (manuscripts, reviews, orders, etc)**
7. ⏳ **Implement permission guards di existing pages**  
8. ⏳ **Add role information di existing UI components**
9. ⏳ **Test flow dengan different user roles**

## 🔗 INTEGRATION CHECKLIST

- [ ] Update halaman login untuk gunakan `navigateAfterLogin()`
- [ ] Update halaman register untuk gunakan `navigateAfterRegister()`  
- [ ] Buat/update dashboard pages untuk setiap role
- [ ] Implement `UserRoleBadge` di app bar atau drawer
- [ ] Gunakan `RoleBasedWidget` untuk conditional UI
- [ ] Test dengan user yang memiliki different roles
- [ ] Add route guards untuk protected pages
- [ ] Update existing navigation untuk konsistensi

## 💡 BEST PRACTICES

1. **Selalu check permission** sebelum menampilkan sensitive UI
2. **Gunakan fallback** untuk role yang tidak dikenali  
3. **Cache user roles** untuk performance (sudah diimplementasi)
4. **Implement loading states** saat check permissions
5. **Clear cache** saat logout untuk security
6. **Test dengan multiple roles** untuk edge cases
7. **Provide clear error messages** untuk access denied

---

**File ini adalah panduan lengkap untuk mengimplementasikan role-based navigation di aplikasi Publishify Anda.**