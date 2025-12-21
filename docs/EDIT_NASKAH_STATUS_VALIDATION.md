# Validasi Status untuk Edit Naskah - Publishify

**Tanggal:** 17 Desember 2024  
**Status:** ✅ Selesai

## 🎯 Requirement

User meminta perubahan policy edit naskah:

### ❌ Policy Lama:
- Naskah hanya bisa diedit saat status: `draft` dan `perlu_revisi`
- Naskah tidak bisa diedit saat: `diajukan`, `dalam_review`, `disetujui`, `ditolak`, `diterbitkan`

### ✅ Policy Baru:
- **Naskah BISA DIEDIT** sampai status: `draft`, `diajukan`, `dalam_review`, `perlu_revisi`
- **Naskah TIDAK BISA DIEDIT** mulai status: `disetujui`, `ditolak`, `diterbitkan`

**Rasionale:**
Penulis perlu bisa melakukan perubahan selama naskah masih dalam proses review. Setelah naskah disetujui atau ditolak, naskah tidak boleh diubah untuk menjaga integritas keputusan editor.

## 📊 Status Naskah Flow

```
┌─────────┐
│  draft  │ ← BISA EDIT ✅
└────┬────┘
     │
     v
┌──────────┐
│ diajukan │ ← BISA EDIT ✅ (NEW!)
└────┬─────┘
     │
     v
┌──────────────┐
│ dalam_review │ ← BISA EDIT ✅ (NEW!)
└──────┬───────┘
       │
       ├────────────────┐
       │                │
       v                v
┌──────────────┐  ┌───────────┐
│ perlu_revisi │  │ disetujui │ ← TIDAK BISA EDIT ❌
└──────┬───────┘  └───────────┘
       │
       │ (loop back to dalam_review)
       │
┌──────────┐
│ ditolak  │ ← TIDAK BISA EDIT ❌
└──────────┘

┌─────────────┐
│ diterbitkan │ ← TIDAK BISA EDIT ❌
└─────────────┘
```

## 🔧 Implementasi

### 1. Backend Changes

**File:** `backend/src/modules/naskah/naskah.service.ts`

#### Before (Lines 517-524):
```typescript
// Validasi: tidak bisa edit jika status bukan draft atau perlu_revisi
if (
  !isAdmin &&
  naskahLama.status !== StatusNaskah.draft &&
  naskahLama.status !== StatusNaskah.perlu_revisi
) {
  throw new BadRequestException('Naskah hanya bisa diubah saat status draft atau perlu revisi');
}
```

#### After:
```typescript
// Validasi: tidak bisa edit jika status sudah disetujui, ditolak, atau diterbitkan
// Allowed: draft, diajukan, dalam_review, perlu_revisi
const allowedStatuses = [
  StatusNaskah.draft,
  StatusNaskah.diajukan,
  StatusNaskah.dalam_review,
  StatusNaskah.perlu_revisi,
];

if (!isAdmin && !allowedStatuses.includes(naskahLama.status)) {
  throw new BadRequestException(
    'Naskah tidak dapat diubah setelah disetujui, ditolak, atau diterbitkan. Status saat ini: ' + naskahLama.status
  );
}
```

**Key Changes:**
- ✅ Allow edit untuk status: `diajukan`, `dalam_review`
- ✅ Lebih readable dengan array `allowedStatuses`
- ✅ Error message lebih informatif dengan status saat ini
- ✅ Admin tetap bisa edit status apapun

### 2. Frontend Changes

**File:** `publishify/lib/pages/writer/naskah/edit_naskah_page.dart`

#### A. Add Permission Check di initState

```dart
@override
void initState() {
  super.initState();
  _initializeControllers();
  _loadOptions();
  
  // Check if naskah can be edited based on status
  WidgetsBinding.instance.addPostFrameCallback((_) {
    _checkEditPermission();
  });
}

void _checkEditPermission() {
  final status = widget.naskah.status.toLowerCase();
  
  // Status yang tidak boleh diedit
  final lockedStatuses = ['disetujui', 'ditolak', 'diterbitkan'];
  
  if (lockedStatuses.contains(status)) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.lock_outline, color: AppTheme.errorRed),
            const SizedBox(width: 8),
            const Text('Naskah Terkunci'),
          ],
        ),
        content: Text(
          'Naskah dengan status "$status" tidak dapat diubah. '
          'Naskah hanya dapat diedit sampai status "dalam review".',
          style: AppTheme.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Close edit page
            },
            child: const Text('Kembali'),
          ),
        ],
      ),
    );
  }
}
```

**Features:**
- ✅ Check status setelah widget build
- ✅ Alert dialog jika status locked
- ✅ Auto close edit page jika tidak bisa edit
- ✅ Non-dismissible dialog (user harus tap "Kembali")

#### B. Update Info Card dengan Status Info

```dart
// Info Card
Container(
  padding: const EdgeInsets.all(12),
  decoration: BoxDecoration(
    color: AppTheme.googleBlue.withValues(alpha: 0.1),
    borderRadius: BorderRadius.circular(8),
    border: Border.all(color: AppTheme.googleBlue.withValues(alpha: 0.3)),
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Icon(Icons.info_outline, color: AppTheme.googleBlue, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Edit data naskah Anda. Field yang wajib diisi ditandai dengan *',
              style: AppTheme.bodySmall.copyWith(color: AppTheme.googleBlue),
            ),
          ),
        ],
      ),
      const SizedBox(height: 8),
      Row(
        children: [
          Icon(Icons.check_circle_outline, color: AppTheme.primaryGreen, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Status saat ini: ${_formatStatus(widget.naskah.status)} • '
              'Dapat diedit sampai status "Dalam Review"',
              style: AppTheme.bodySmall.copyWith(
                color: AppTheme.greyText,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    ],
  ),
)
```

**Features:**
- ✅ Show current status
- ✅ Info kapan naskah tidak bisa diedit lagi
- ✅ Visual indicator (check icon)

#### C. Add Helper Method

```dart
String _formatStatus(String status) {
  final statusMap = {
    'draft': 'Draft',
    'diajukan': 'Diajukan',
    'dalam_review': 'Dalam Review',
    'perlu_revisi': 'Perlu Revisi',
    'disetujui': 'Disetujui',
    'ditolak': 'Ditolak',
    'diterbitkan': 'Diterbitkan',
  };
  
  return statusMap[status.toLowerCase()] ?? status;
}
```

**Features:**
- ✅ Convert status to readable Indonesian text
- ✅ Fallback to original status jika tidak dikenali

## 📱 UI/UX Preview

### Scenario 1: Status "Draft" - Bisa Edit

```
┌─────────────────────────────────────────┐
│ Edit Naskah                        ✕    │
├─────────────────────────────────────────┤
│ ℹ️  Edit data naskah Anda. Field yang  │
│    wajib diisi ditandai dengan *       │
│                                         │
│ ✓  Status saat ini: Draft •            │
│    Dapat diedit sampai status          │
│    "Dalam Review"                      │
├─────────────────────────────────────────┤
│ [Form fields...]                        │
│                                         │
│ [Simpan Perubahan]                     │
└─────────────────────────────────────────┘
```

### Scenario 2: Status "Diajukan" - Bisa Edit (NEW!)

```
┌─────────────────────────────────────────┐
│ Edit Naskah                        ✕    │
├─────────────────────────────────────────┤
│ ℹ️  Edit data naskah Anda. Field yang  │
│    wajib diisi ditandai dengan *       │
│                                         │
│ ✓  Status saat ini: Diajukan •        │
│    Dapat diedit sampai status          │
│    "Dalam Review"                      │
├─────────────────────────────────────────┤
│ [Form fields...]                        │
│                                         │
│ [Simpan Perubahan]                     │
└─────────────────────────────────────────┘
```

### Scenario 3: Status "Dalam Review" - Bisa Edit (NEW!)

```
┌─────────────────────────────────────────┐
│ Edit Naskah                        ✕    │
├─────────────────────────────────────────┤
│ ℹ️  Edit data naskah Anda. Field yang  │
│    wajib diisi ditandai dengan *       │
│                                         │
│ ✓  Status saat ini: Dalam Review •    │
│    Dapat diedit sampai status          │
│    "Dalam Review"                      │
├─────────────────────────────────────────┤
│ [Form fields...]                        │
│                                         │
│ [Simpan Perubahan]                     │
└─────────────────────────────────────────┘
```

### Scenario 4: Status "Disetujui" - TIDAK Bisa Edit

```
┌─────────────────────────────────────────┐
│         🔒 Naskah Terkunci              │
├─────────────────────────────────────────┤
│                                         │
│ Naskah dengan status "disetujui"       │
│ tidak dapat diubah. Naskah hanya       │
│ dapat diedit sampai status             │
│ "dalam review".                        │
│                                         │
│                          [Kembali]     │
└─────────────────────────────────────────┘
           ↓ Auto close
┌─────────────────────────────────────────┐
│ Detail Naskah (previous page)           │
└─────────────────────────────────────────┘
```

### Scenario 5: Status "Ditolak" - TIDAK Bisa Edit

```
┌─────────────────────────────────────────┐
│         🔒 Naskah Terkunci              │
├─────────────────────────────────────────┤
│                                         │
│ Naskah dengan status "ditolak"         │
│ tidak dapat diubah. Naskah hanya       │
│ dapat diedit sampai status             │
│ "dalam review".                        │
│                                         │
│                          [Kembali]     │
└─────────────────────────────────────────┘
```

### Scenario 6: Status "Diterbitkan" - TIDAK Bisa Edit

```
┌─────────────────────────────────────────┐
│         🔒 Naskah Terkunci              │
├─────────────────────────────────────────┤
│                                         │
│ Naskah dengan status "diterbitkan"     │
│ tidak dapat diubah. Naskah hanya       │
│ dapat diedit sampai status             │
│ "dalam review".                        │
│                                         │
│                          [Kembali]     │
└─────────────────────────────────────────┘
```

## 🔒 Validation Matrix

| Status | Backend Edit | Frontend Edit | Admin Override | Notes |
|--------|-------------|---------------|----------------|-------|
| **draft** | ✅ | ✅ | ✅ | Initial state |
| **diajukan** | ✅ (NEW!) | ✅ (NEW!) | ✅ | Naskah submitted |
| **dalam_review** | ✅ (NEW!) | ✅ (NEW!) | ✅ | Under review |
| **perlu_revisi** | ✅ | ✅ | ✅ | Needs revision |
| **disetujui** | ❌ | ❌ | ✅ | Final decision |
| **ditolak** | ❌ | ❌ | ✅ | Final decision |
| **diterbitkan** | ❌ | ❌ | ✅ | Published |

**Legend:**
- ✅ = Allowed
- ❌ = Blocked
- **(NEW!)** = Changed from previous policy

## 🎨 Error Messages

### Backend Error (API Response)

**Status Code:** `400 Bad Request`

**Response:**
```json
{
  "sukses": false,
  "pesan": "Naskah tidak dapat diubah setelah disetujui, ditolak, atau diterbitkan. Status saat ini: disetujui",
  "error": {
    "timestamp": "2024-12-17T10:30:00.000Z"
  }
}
```

### Frontend Alert Dialog

**Title:** 🔒 Naskah Terkunci

**Message:**
```
Naskah dengan status "[status]" tidak dapat diubah.
Naskah hanya dapat diedit sampai status "dalam review".
```

**Action:** Button "Kembali" → Auto close edit page

## 🧪 Testing Checklist

### Backend Tests

#### Test Case 1: Edit Draft (Allowed)
```bash
PUT /api/naskah/:id
Body: { "judul": "Updated Title" }
Status: draft

Expected: ✅ 200 OK
Response: { "sukses": true, "pesan": "Naskah berhasil diperbarui" }
```

#### Test Case 2: Edit Diajukan (Allowed - NEW!)
```bash
PUT /api/naskah/:id
Body: { "sinopsis": "Updated Synopsis" }
Status: diajukan

Expected: ✅ 200 OK
Response: { "sukses": true, "pesan": "Naskah berhasil diperbarui" }
```

#### Test Case 3: Edit Dalam Review (Allowed - NEW!)
```bash
PUT /api/naskah/:id
Body: { "jumlahHalaman": 250 }
Status: dalam_review

Expected: ✅ 200 OK
Response: { "sukses": true, "pesan": "Naskah berhasil diperbarui" }
```

#### Test Case 4: Edit Perlu Revisi (Allowed)
```bash
PUT /api/naskah/:id
Body: { "judul": "Revised Title" }
Status: perlu_revisi

Expected: ✅ 200 OK
Response: { "sukses": true, "pesan": "Naskah berhasil diperbarui" }
```

#### Test Case 5: Edit Disetujui (Blocked)
```bash
PUT /api/naskah/:id
Body: { "judul": "Should Fail" }
Status: disetujui

Expected: ❌ 400 Bad Request
Response: {
  "sukses": false,
  "pesan": "Naskah tidak dapat diubah setelah disetujui, ditolak, atau diterbitkan. Status saat ini: disetujui"
}
```

#### Test Case 6: Edit Ditolak (Blocked)
```bash
PUT /api/naskah/:id
Body: { "sinopsis": "Should Fail" }
Status: ditolak

Expected: ❌ 400 Bad Request
Response: {
  "sukses": false,
  "pesan": "Naskah tidak dapat diubah setelah disetujui, ditolak, atau diterbitkan. Status saat ini: ditolak"
}
```

#### Test Case 7: Edit Diterbitkan (Blocked)
```bash
PUT /api/naskah/:id
Body: { "publik": false }
Status: diterbitkan

Expected: ❌ 400 Bad Request
Response: {
  "sukses": false,
  "pesan": "Naskah tidak dapat diubah setelah disetujui, ditolak, atau diterbitkan. Status saat ini: diterbitkan"
}
```

#### Test Case 8: Admin Override (Allowed)
```bash
PUT /api/naskah/:id
Body: { "judul": "Admin Edit" }
Status: disetujui
Role: admin

Expected: ✅ 200 OK (Admin can edit any status)
```

### Frontend Tests

#### Test Case 1: Open Edit - Draft
```
Action: Navigate to EditNaskahPage with status "draft"
Expected: ✅ Page opens, form enabled, no alert
```

#### Test Case 2: Open Edit - Diajukan
```
Action: Navigate to EditNaskahPage with status "diajukan"
Expected: ✅ Page opens, form enabled, no alert
Info: "Status saat ini: Diajukan • Dapat diedit sampai status 'Dalam Review'"
```

#### Test Case 3: Open Edit - Dalam Review
```
Action: Navigate to EditNaskahPage with status "dalam_review"
Expected: ✅ Page opens, form enabled, no alert
Info: "Status saat ini: Dalam Review • Dapat diedit sampai status 'Dalam Review'"
```

#### Test Case 4: Open Edit - Perlu Revisi
```
Action: Navigate to EditNaskahPage with status "perlu_revisi"
Expected: ✅ Page opens, form enabled, no alert
```

#### Test Case 5: Open Edit - Disetujui
```
Action: Navigate to EditNaskahPage with status "disetujui"
Expected: ❌ Alert dialog appears
Dialog: "🔒 Naskah Terkunci" with message
Action: Tap "Kembali" → Close edit page
```

#### Test Case 6: Open Edit - Ditolak
```
Action: Navigate to EditNaskahPage with status "ditolak"
Expected: ❌ Alert dialog appears
Dialog: "🔒 Naskah Terkunci" with message
Action: Tap "Kembali" → Close edit page
```

#### Test Case 7: Open Edit - Diterbitkan
```
Action: Navigate to EditNaskahPage with status "diterbitkan"
Expected: ❌ Alert dialog appears
Dialog: "🔒 Naskah Terkunci" with message
Action: Tap "Kembali" → Close edit page
```

### Integration Tests

#### Test Case 1: Edit Flow - Allowed Status
```
1. Open naskah with status "dalam_review"
2. Navigate to EditNaskahPage
3. Change field values
4. Tap "Simpan Perubahan"
Expected: ✅ Success, navigate back, data updated
```

#### Test Case 2: Edit Flow - Blocked Status
```
1. Open naskah with status "disetujui"
2. Navigate to EditNaskahPage
3. Alert dialog appears
4. Tap "Kembali"
Expected: ❌ Back to detail page, no changes
```

#### Test Case 3: Status Change Impact
```
1. Open naskah with status "dalam_review"
2. Editor approves → Status changes to "disetujui"
3. Penulis tries to edit
Expected: ❌ Alert dialog, cannot edit
```

## 📊 Impact Analysis

### ✅ Positive Impact

1. **Better UX for Penulis**
   - Penulis bisa edit selama review
   - Tidak perlu wait for "perlu_revisi" status
   - Faster iteration cycle

2. **Flexible Review Process**
   - Penulis bisa fix minor issues during review
   - Editor tidak perlu reject untuk minor fixes
   - Less back-and-forth communication

3. **Clear Boundaries**
   - Status yang locked jelas (disetujui, ditolak, diterbitkan)
   - UI feedback langsung (alert dialog)
   - Error message informatif

### ⚠️ Considerations

1. **Race Conditions**
   - Penulis edit saat editor sedang review
   - **Mitigation:** Editor gets latest version when they open
   - **Future:** Add version tracking

2. **Data Integrity**
   - Naskah berubah saat dalam review
   - **Mitigation:** Editor sees updated content
   - **Future:** Add "last modified" indicator

3. **Review Impact**
   - Editor's feedback bisa outdated jika penulis edit
   - **Mitigation:** Timestamp pada feedback
   - **Future:** Lock naskah saat editor mulai review

## 🔗 Related Files

### Backend
- `backend/src/modules/naskah/naskah.service.ts` - Main validation logic
- `backend/src/modules/naskah/naskah.controller.ts` - API endpoint
- `backend/prisma/schema.prisma` - Status enum definition

### Frontend
- `publishify/lib/pages/writer/naskah/edit_naskah_page.dart` - Edit page with validation
- `publishify/lib/models/editor/review_models.dart` - StatusNaskah enum
- `publishify/lib/models/writer/naskah_models.dart` - Naskah models

## 🚀 Future Enhancements

### 1. Version History
```dart
// Track naskah versions
model RevisiNaskah {
  id       String
  idNaskah String
  versi    Int
  perubahan Json
  dibuatPada DateTime
}
```

### 2. Lock Mechanism
```dart
// Lock naskah saat editor mulai review
model LockNaskah {
  id         String
  idNaskah   String
  idPengguna String
  lockedAt   DateTime
  expiresAt  DateTime
}
```

### 3. Edit History
```dart
// Log setiap perubahan
model LogPerubahan {
  id         String
  idNaskah   String
  idPengguna String
  field      String
  oldValue   String
  newValue   String
  changedAt  DateTime
}
```

### 4. Smart Alerts
```dart
// Notify editor jika penulis edit
"Penulis melakukan perubahan pada naskah yang sedang Anda review"
```

### 5. Conditional Fields
```dart
// Allow edit specific fields based on status
if (status == 'dalam_review') {
  // Only allow edit: sinopsis, urlSampul
  // Lock: judul, kategori, genre
}
```

## ✅ Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Editable Statuses** | 2 statuses (draft, perlu_revisi) | 4 statuses (draft, diajukan, dalam_review, perlu_revisi) |
| **Locked Statuses** | 5 statuses | 3 statuses (disetujui, ditolak, diterbitkan) |
| **Validation Location** | Backend only | Backend + Frontend |
| **User Feedback** | API error only | Alert dialog + Info card |
| **Error Message** | Generic | Specific with current status |
| **Admin Override** | Yes | Yes (unchanged) |

---

**Status:** ✅ Completed  
**Last Updated:** 17 Desember 2024  
**Version:** 1.0.0  
**Breaking Changes:** None (backward compatible)
