# Auto Update Status "Perlu Revisi" Saat Feedback Dikirim

**Tanggal:** 17 Desember 2024  
**Status:** ✅ Selesai

## 🎯 Requirement

Ketika editor mengirim feedback kepada sebuah naskah:
1. ✅ Status naskah **otomatis berubah** menjadi `perlu_revisi`
2. ✅ Naskah menjadi **dapat diedit** oleh penulis (sesuai validation baru)
3. ✅ Frontend **tidak perlu manual update** - auto refresh

## 🔄 Flow Sebelum & Sesudah

### ❌ Flow Lama (Before)

```
Editor kirim feedback
  ↓
Feedback tersimpan
  ↓
Status naskah: tetap "dalam_review"
  ↓
❌ Penulis TIDAK BISA edit naskah
  ↓
Editor harus manual submit review → status "perlu_revisi"
  ↓
✅ Baru bisa edit
```

**Problem:** Penulis harus menunggu editor submit review untuk bisa edit.

### ✅ Flow Baru (After)

```
Editor kirim feedback
  ↓
Feedback tersimpan + Status naskah → "perlu_revisi"
  ↓
✅ Penulis LANGSUNG BISA edit naskah
  ↓
Penulis edit & save
  ↓
Editor lanjut review atau submit final
```

**Benefit:** Penulis bisa langsung respond to feedback tanpa delay!

## 💻 Implementasi

### Backend Changes

**File:** `backend/src/modules/review/review.service.ts`

#### 1. Update Query untuk Include Naskah ID

**Before:**
```typescript
const review = await this.prisma.reviewNaskah.findUnique({
  where: { id: idReview },
  select: {
    id: true,
    idEditor: true,
    status: true,
    naskah: {
      select: {
        judul: true,  // ← Only judul
      },
    },
  },
});
```

**After:**
```typescript
const review = await this.prisma.reviewNaskah.findUnique({
  where: { id: idReview },
  select: {
    id: true,
    idEditor: true,
    status: true,
    naskah: {
      select: {
        id: true,    // ← Added ID
        judul: true,
      },
    },
  },
});
```

#### 2. Add Status Update Logic in Transaction

**Before:**
```typescript
const feedback = await this.prisma.$transaction(async (prisma) => {
  const newFeedback = await prisma.feedbackReview.create({
    data: {
      idReview,
      ...dto,
    },
  });

  // Auto update review status ke dalam_proses
  if (review.status === StatusReview.ditugaskan) {
    await prisma.reviewNaskah.update({
      where: { id: idReview },
      data: {
        status: StatusReview.dalam_proses,
        dimulaiPada: new Date(),
      },
    });
  }

  return newFeedback;
});
```

**After:**
```typescript
const feedback = await this.prisma.$transaction(async (prisma) => {
  const newFeedback = await prisma.feedbackReview.create({
    data: {
      idReview,
      ...dto,
    },
  });

  // Auto update review status ke dalam_proses
  if (review.status === StatusReview.ditugaskan) {
    await prisma.reviewNaskah.update({
      where: { id: idReview },
      data: {
        status: StatusReview.dalam_proses,
        dimulaiPada: new Date(),
      },
    });
  }

  // ✅ NEW: Update status naskah menjadi perlu_revisi
  // Ini memungkinkan penulis untuk langsung edit naskah
  const naskahId = review.naskah.id;
  await prisma.naskah.update({
    where: { id: naskahId },
    data: {
      status: StatusNaskah.perlu_revisi,
    },
  });

  return newFeedback;
});
```

**Key Changes:**
- ✅ Update status naskah dalam transaction yang sama
- ✅ Atomic operation (feedback + status update together)
- ✅ If transaction fails, nothing is saved

### Frontend Changes

**❌ TIDAK ADA PERUBAHAN DIPERLUKAN!**

Frontend sudah handle dengan baik karena:

1. **Auto Reload Data** - Setelah feedback sukses:
```dart
if (response.sukses) {
  // Show success message
  ScaffoldMessenger.of(context).showSnackBar(...);
  
  // ✅ Reload data - ini akan fetch status terbaru
  await _loadFeedbackData();
}
```

2. **Service Layer Sudah Baik:**
```dart
final response = await EditorApiService.tambahFeedback(idReview, request);
```

3. **Data Refresh Otomatis:**
- Review data ter-reload dengan status terbaru
- Penulis yang buka naskah akan lihat status terbaru
- Edit button akan enabled karena status "perlu_revisi"

## 📊 Status Flow Matrix

| Kondisi | Status Naskah Sebelum | Status Naskah Sesudah | Dapat Edit? |
|---------|----------------------|----------------------|-------------|
| **Feedback Pertama** | dalam_review | perlu_revisi ✅ | ✅ Ya |
| **Feedback Kedua** | perlu_revisi | perlu_revisi | ✅ Ya |
| **Feedback Ke-N** | perlu_revisi | perlu_revisi | ✅ Ya |
| **Submit Review (setujui)** | perlu_revisi | disetujui | ❌ Tidak |
| **Submit Review (tolak)** | perlu_revisi | ditolak | ❌ Tidak |

**Key Point:** Status "perlu_revisi" tetap stabil setelah feedback pertama, tidak berubah-ubah.

## 🔄 Integration dengan Validation Baru

Implementasi ini **perfect match** dengan validation edit naskah yang baru:

### Edit Naskah Validation (dari EDIT_NASKAH_STATUS_VALIDATION.md):
```typescript
const allowedStatuses = [
  'draft',
  'diajukan',
  'dalam_review',
  'perlu_revisi',    // ← Status yang akan di-set oleh feedback
];
```

### Flow Terintegrasi:
```
1. Naskah status: "dalam_review"
   ↓
2. Editor kirim feedback
   ↓
3. Backend update status → "perlu_revisi"
   ↓
4. Frontend reload data
   ↓
5. Penulis lihat status "perlu_revisi"
   ↓
6. Penulis tap Edit Naskah
   ↓
7. ✅ Validation PASS (status "perlu_revisi" is allowed)
   ↓
8. Form terbuka, penulis bisa edit
```

## 🎨 UI/UX Preview

### Editor Side (Feedback Page)

**Before Send:**
```
┌─────────────────────────────────────────┐
│ Review: Novel Petualangan              │
│ Status Naskah: Dalam Review            │
├─────────────────────────────────────────┤
│ [Feedback Form]                        │
│                                         │
│ Bab: 3                                 │
│ Halaman: 45                            │
│ Komentar: Plot twist terlalu cepat...  │
│                                         │
│ [Kirim Feedback]                       │
└─────────────────────────────────────────┘
```

**After Send:**
```
┌─────────────────────────────────────────┐
│ ✓ Feedback berhasil ditambahkan        │
├─────────────────────────────────────────┤
│ Review: Novel Petualangan              │
│ Status Naskah: Perlu Revisi ✅         │ ← Changed!
├─────────────────────────────────────────┤
│ Feedback (1):                          │
│ • Bab 3, Hal 45: Plot twist...        │
└─────────────────────────────────────────┘
```

### Penulis Side (Review Detail Page)

**Before Editor Send Feedback:**
```
┌─────────────────────────────────────────┐
│ Review dari: Editor Budi               │
│ Status: Dalam Review                   │
├─────────────────────────────────────────┤
│ Feedback dari Editor:                  │
│ (Belum ada feedback)                   │
│                                         │
│ [Edit Naskah] ← Disabled (status review)│
└─────────────────────────────────────────┘
```

**After Editor Send Feedback (Auto Refresh):**
```
┌─────────────────────────────────────────┐
│ Review dari: Editor Budi               │
│ Status: Perlu Revisi ✅                │ ← Updated!
├─────────────────────────────────────────┤
│ Feedback dari Editor:                  │
│                                         │
│ 📝 Bab 3, Halaman 45                   │
│    "Plot twist terlalu cepat..."       │
│    [Tap untuk edit naskah]            │
│                                         │
│ [Edit Naskah] ← ENABLED! ✅            │ ← Now active!
└─────────────────────────────────────────┘
```

**After Penulis Edit:**
```
┌─────────────────────────────────────────┐
│ Edit Naskah                            │
├─────────────────────────────────────────┤
│ ℹ️  Status saat ini: Perlu Revisi •    │
│    Dapat diedit sampai "Dalam Review"  │
├─────────────────────────────────────────┤
│ [Form fields available]                │
│                                         │
│ [Simpan Perubahan] ← Can save!         │
└─────────────────────────────────────────┘
```

## 🧪 Testing Checklist

### Backend Tests

#### Test Case 1: First Feedback Changes Status
```bash
# Setup
Naskah ID: xxx
Status awal: "dalam_review"

# Action
POST /api/review/:reviewId/feedback
Body: {
  "bab": "3",
  "halaman": 45,
  "komentar": "Plot twist terlalu cepat"
}

# Expected
Response: 200 OK
{
  "sukses": true,
  "pesan": "Feedback berhasil ditambahkan"
}

# Verify
GET /api/naskah/:id
Response.data.status === "perlu_revisi" ✅
```

#### Test Case 2: Second Feedback Keeps Status
```bash
# Setup
Naskah status: "perlu_revisi" (dari feedback pertama)

# Action
POST /api/review/:reviewId/feedback
Body: {
  "bab": "5",
  "halaman": 78,
  "komentar": "Dialog perlu diperbaiki"
}

# Expected
Response: 200 OK

# Verify
GET /api/naskah/:id
Response.data.status === "perlu_revisi" ✅ (tetap)
```

#### Test Case 3: Transaction Rollback on Error
```bash
# Setup
Naskah status: "dalam_review"
Simulate DB error during naskah update

# Action
POST /api/review/:reviewId/feedback
(Database error occurs)

# Expected
Response: 500 Error
Feedback NOT saved ✅
Naskah status: "dalam_review" ✅ (unchanged)
```

### Frontend Tests

#### Test Case 1: Editor Send Feedback
```
1. Editor buka review dengan status "dalam_review"
2. Tap "Tambah Feedback"
3. Isi form feedback
4. Tap "Kirim Feedback"
Expected:
  ✅ Loading indicator muncul
  ✅ Success message: "Feedback berhasil ditambahkan"
  ✅ Data reload otomatis
  ✅ Status berubah ke "Perlu Revisi" di UI
```

#### Test Case 2: Penulis See Updated Status
```
1. Penulis buka review detail (status "dalam_review")
2. Editor kirim feedback (di device lain)
3. Penulis pull to refresh
Expected:
  ✅ Status berubah ke "Perlu Revisi"
  ✅ Feedback baru muncul
  ✅ Edit button enabled
```

#### Test Case 3: Penulis Can Edit After Feedback
```
1. Naskah status: "perlu_revisi" (setelah feedback)
2. Penulis tap "Edit Naskah"
Expected:
  ✅ Edit page terbuka
  ✅ Form enabled
  ✅ Info card: "Status saat ini: Perlu Revisi"
  ✅ Can save changes
```

#### Test Case 4: Multiple Feedbacks
```
1. Editor send feedback 1 → Status: "perlu_revisi"
2. Penulis edit naskah
3. Editor send feedback 2 → Status: tetap "perlu_revisi"
Expected:
  ✅ Both feedbacks visible
  ✅ Status stable at "perlu_revisi"
  ✅ Penulis masih bisa edit
```

### Integration Tests

#### Test Case 1: Full Feedback-Edit Flow
```
1. Naskah submitted: status "dalam_review"
2. Editor send feedback
3. Backend update: status → "perlu_revisi"
4. Frontend reload: show new status
5. Penulis tap Edit
6. Validation pass: status allowed
7. Penulis edit & save
8. Changes saved successfully
Expected: ✅ All steps pass
```

#### Test Case 2: Concurrent Operations
```
1. Editor 1 send feedback (same time)
2. Editor 2 send feedback (same time)
Expected:
  ✅ Both feedbacks saved
  ✅ No race condition
  ✅ Status updated correctly
  ✅ Transaction isolation works
```

## 📊 Database Changes

### Naskah Table - Status Transitions

**Before:**
```sql
-- Status flow yang lama
UPDATE naskah 
SET status = 'perlu_revisi' 
WHERE id = :id 
  AND status = 'dalam_review';
  
-- Hanya di submit review
```

**After:**
```sql
-- Status flow yang baru
UPDATE naskah 
SET status = 'perlu_revisi' 
WHERE id = :id;
  
-- Di setiap feedback dikirim (in transaction)
```

**Impact:** Status berubah lebih cepat, penulis dapat merespon lebih responsif.

## ✅ Benefits

### 1. Faster Iteration Cycle
```
Before: Editor review → Submit → Penulis edit (2-3 hari)
After:  Editor feedback → Penulis edit (instant!) ⚡
```

### 2. Better UX for Penulis
- ✅ Tidak perlu menunggu review selesai
- ✅ Bisa langsung respond to feedback
- ✅ Iterasi lebih cepat

### 3. Better UX for Editor
- ✅ Feedback langsung actionable
- ✅ Tidak perlu submit untuk allow edit
- ✅ Bisa kirim feedback incremental

### 4. Reduced Communication Overhead
- ✅ Tidak perlu chat: "Tolong submit supaya saya bisa edit"
- ✅ Self-service workflow
- ✅ Clear status indicator

## ⚠️ Considerations

### 1. Status "Perlu Revisi" Early
**Issue:** Naskah jadi "perlu_revisi" padahal review belum selesai

**Mitigation:**
- Status tetap allowed untuk edit (sesuai validation baru)
- Editor bisa lanjut review
- Submit final tetap override ke status final (setujui/tolak)

### 2. Multiple Status Changes
**Issue:** Status berubah-ubah saat multiple feedback

**Mitigation:**
- Status "perlu_revisi" stabil setelah feedback pertama
- Tidak berubah-ubah per feedback berikutnya
- Idempotent operation

### 3. Race Condition
**Issue:** Multiple editor send feedback bersamaan

**Mitigation:**
- Transaction isolation di Prisma
- Status update atomic
- Last write wins (acceptable)

## 🔗 Related Features

### 1. Edit Naskah Status Validation
File: `docs/EDIT_NASKAH_STATUS_VALIDATION.md`

Status yang allowed untuk edit:
```typescript
const allowedStatuses = [
  'draft',
  'diajukan',
  'dalam_review',
  'perlu_revisi',    // ← Perfect match!
];
```

### 2. Feedback Display Fix
File: `docs/FEEDBACK_DISPLAY_FIX.md`

Backend include feedback array:
```typescript
feedback: {
  orderBy: { dibuatPada: 'desc' }
}
```

### 3. Feedback Navigation Feature
File: `docs/FEEDBACK_TO_EDIT_NAVIGATION_FEATURE.md`

Penulis tap feedback → Navigate to edit:
```dart
_handleFeedbackTap(feedback) {
  // Fetch naskah detail
  // Navigate to EditNaskahPage
  // Status "perlu_revisi" allows edit ✅
}
```

## 🚀 Future Enhancements

### 1. Configurable Auto-Status
```typescript
// Config di admin panel
autoStatusOnFeedback: boolean = true;

if (config.autoStatusOnFeedback) {
  await updateNaskahStatus('perlu_revisi');
}
```

### 2. Status History
```typescript
model StatusHistory {
  id         String
  idNaskah   String
  oldStatus  String
  newStatus  String
  reason     String
  changedBy  String
  changedAt  DateTime
}
```

### 3. Notification to Penulis
```typescript
// Notify penulis saat status berubah
await notificationService.send({
  to: penulis.id,
  title: 'Naskah Perlu Revisi',
  body: 'Editor telah memberikan feedback. Naskah Anda sudah dapat diedit.',
  type: 'status_change',
});
```

### 4. Smart Status Logic
```typescript
// Jika editor send feedback tapi pilih "minor fixes"
// Jangan ubah status, tetap "dalam_review"
if (feedback.severity === 'critical' || feedback.severity === 'major') {
  status = 'perlu_revisi';
} else {
  status = 'dalam_review'; // Minor fixes
}
```

## 📁 Files Modified

### Backend
✅ `backend/src/modules/review/review.service.ts`
- Line ~507: Updated query to include `naskah.id`
- Line ~534-560: Added status update logic in transaction

### Frontend
❌ No changes needed - Already handles data reload properly

### Documentation
✅ `docs/AUTO_STATUS_PERLU_REVISI_FEEDBACK.md` (this file)

## ✅ Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Status Change Trigger** | Manual (submit review) | Auto (send feedback) |
| **Time to Edit** | Wait for submit | Instant ⚡ |
| **Penulis Action** | Wait passively | Edit proactively |
| **Editor Control** | Must submit to allow edit | Can send incremental feedback |
| **Status Stability** | Changes once (submit) | Changes on first feedback, then stable |
| **Transaction Safety** | N/A | Atomic (feedback + status) |

**Key Achievement:** Penulis dapat langsung merespon feedback tanpa delay! 🚀

---

**Status:** ✅ Completed  
**Last Updated:** 17 Desember 2024  
**Version:** 1.0.0  
**Breaking Changes:** None
