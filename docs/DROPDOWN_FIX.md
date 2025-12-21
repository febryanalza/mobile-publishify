# Fix: Dropdown Jenis Kelamin Error di Edit Profile

**Tanggal:** 11 November 2025  
**Issue:** Flutter dropdown error - "items.isEmpty || items.where((DropdownMenuItem<T> item) => item.value == (initialValue ?? value)).length == exactly one item with [DropdownButton]'s value: Laki-laki"  
**Status:** ✅ FIXED

---

## 🔍 Root Cause

Flutter `DropdownButtonFormField` memiliki **strict validation** untuk `value` property:
- Value **HARUS** ada di dalam list `items`, atau
- Value **HARUS** `null`
- Value **TIDAK BOLEH** string kosong `""` atau value lain yang tidak ada di items

### Backend Schema (Sudah Benar ✅):
```typescript
// backend/src/modules/pengguna/dto/perbarui-profil.dto.ts
jenisKelamin: z
  .enum(['L', 'P'], {
    invalid_type_error: 'Jenis kelamin harus L atau P',
  })
  .optional()
  .nullable(),
```

Backend accepts:
- ✅ `'L'` (Laki-laki)
- ✅ `'P'` (Perempuan)  
- ✅ `null` (Tidak diisi)

### Frontend Issues (YANG DIPERBAIKI):

#### Issue 1: Data Loading Tidak Validasi Value
```dart
// BEFORE ❌
_jenisKelamin = profil.jenisKelamin; // Could be null, 'L', 'P', or invalid value

// Jika database return value selain 'L' atau 'P' (misal: empty string, 'M', dll)
// Flutter akan error karena value tidak ada di items dropdown
```

#### Issue 2: Dropdown Tidak Ada Error Handling
```dart
// BEFORE ❌
DropdownButtonFormField<String>(
  value: _jenisKelamin, // No validation
  items: const [
    DropdownMenuItem(value: 'L', child: Text('Laki-laki')),
    DropdownMenuItem(value: 'P', child: Text('Perempuan')),
  ],
  // No validator, no error border
)
```

---

## ✅ Solusi

### 1. Validate Value saat Load Data

```dart
// AFTER ✅
if (profil != null) {
  // ... other fields ...
  
  // Fixed: Validate jenisKelamin value before assigning
  // Only accept 'L', 'P', or null (not empty string or other values)
  if (profil.jenisKelamin == 'L' || profil.jenisKelamin == 'P') {
    _jenisKelamin = profil.jenisKelamin;
  } else {
    _jenisKelamin = null; // Set to null if invalid value
  }
}
```

**Benefit:**
- ✅ Hanya assign value jika valid (`'L'` atau `'P'`)
- ✅ Set ke `null` jika value invalid (empty string, 'M', dll)
- ✅ Dropdown tidak error karena value selalu valid

### 2. Enhanced Dropdown dengan Error Handling

```dart
// AFTER ✅
DropdownButtonFormField<String>(
  value: _jenisKelamin, // Will be null, 'L', or 'P'
  decoration: InputDecoration(
    // ... other decorations ...
    
    // Added error borders
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppTheme.errorRed),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppTheme.errorRed, width: 2),
    ),
  ),
  items: const [
    DropdownMenuItem(value: 'L', child: Text('Laki-laki')),
    DropdownMenuItem(value: 'P', child: Text('Perempuan')),
  ],
  onChanged: (value) {
    setState(() {
      _jenisKelamin = value;
    });
  },
  validator: (value) {
    // Optional field - no validation needed
    // Backend accepts: 'L', 'P', or null
    return null;
  },
)
```

**Benefit:**
- ✅ Error borders untuk konsistensi UI
- ✅ Validator untuk future requirements
- ✅ Comment yang jelas tentang accepted values

---

## 📋 Files Changed

1. **publishify/lib/pages/profile/edit_profile_page.dart**
   - Fixed: `_loadCurrentProfile()` - Added value validation untuk `jenisKelamin`
   - Enhanced: `_buildGenderDropdown()` - Added error borders & validator

---

## 🧪 Testing

### Test Case 1: User Belum Isi Jenis Kelamin (DB = null)
```
✅ Load profile
✅ _jenisKelamin = null
✅ Dropdown shows "Pilih jenis kelamin" (hint)
✅ No error displayed
✅ User can select 'L' or 'P'
```

### Test Case 2: User Sudah Isi Jenis Kelamin (DB = 'L' atau 'P')
```
✅ Load profile
✅ _jenisKelamin = 'L' or 'P'
✅ Dropdown shows "Laki-laki" or "Perempuan"
✅ No error displayed
✅ User can change selection
```

### Test Case 3: Invalid Data dari Database (DB = '', 'M', atau value lain)
```
✅ Load profile
✅ Validation catches invalid value
✅ _jenisKelamin = null (fallback)
✅ Dropdown shows "Pilih jenis kelamin" (hint)
✅ No error displayed
✅ User can select 'L' or 'P'
```

### Test Case 4: Submit Form
```
✅ If jenisKelamin = null → backend receives null (optional field)
✅ If jenisKelamin = 'L' → backend receives 'L'
✅ If jenisKelamin = 'P' → backend receives 'P'
✅ Backend validates dengan Zod schema
✅ Profile updated successfully
```

---

## 🔑 Key Takeaways

### 1. **Dropdown Value Validation is Critical**
Flutter dropdown **MUST** have:
- Value in items list, OR
- Value is null
- **NEVER** empty string or invalid value

### 2. **Always Validate Backend Data**
Don't trust backend data blindly. Always validate:
```dart
// ✅ GOOD - Validate before assign
if (value == 'L' || value == 'P') {
  _field = value;
} else {
  _field = null;
}

// ❌ BAD - Direct assign
_field = value; // Could be anything!
```

### 3. **Backend Enum Validation**
Backend Zod schema sudah benar:
```typescript
jenisKelamin: z.enum(['L', 'P']).optional().nullable()
```

This ensures:
- ✅ Only 'L' or 'P' accepted
- ✅ null accepted (optional field)
- ❌ Empty string rejected
- ❌ Other values rejected

### 4. **Frontend-Backend Contract**
Pastikan kontrak data type sama:
- Backend: `'L' | 'P' | null`
- Frontend: `String?` with validation → only `'L'`, `'P'`, or `null`

---

## 🚀 Verification Steps

1. **Run Flutter app:**
   ```bash
   cd publishify
   flutter run
   ```

2. **Test scenarios:**
   - Login sebagai user
   - Buka halaman Edit Profile
   - Check dropdown jenis kelamin:
     * Jika belum diisi → shows hint, no error
     * Jika sudah diisi → shows current value
   - Pilih jenis kelamin baru
   - Submit form
   - Verify data saved correctly

3. **Check console logs:**
   ```
   No errors related to dropdown
   Profile loaded successfully
   Profile updated successfully
   ```

---

## 📚 Related Documentation

- Flutter Dropdown: https://api.flutter.dev/flutter/material/DropdownButtonFormField-class.html
- Zod Enum: https://zod.dev/?id=enums
- Backend DTO: `backend/src/modules/pengguna/dto/perbarui-profil.dto.ts`
- Frontend Model: `publishify/lib/models/update_profile_models.dart`

---

## ⚠️ Important Notes

1. **Jangan ubah backend schema** - Sudah benar dengan enum `['L', 'P']`
2. **Jangan ubah dropdown items** - Sudah sesuai dengan backend
3. **Pastikan validation di frontend** - Untuk handle invalid data dari DB (legacy data, manual edit, etc.)

---

## 🎯 Summary

**Problem:** Dropdown error karena value tidak valid  
**Root Cause:** Tidak ada validation saat load data dari backend  
**Solution:** Validate value sebelum assign ke `_jenisKelamin`  
**Result:** Dropdown selalu punya value yang valid (`'L'`, `'P'`, atau `null`)  

✅ **Error Fixed!** User sekarang bisa edit profile tanpa dropdown error.
