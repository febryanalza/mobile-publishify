/**
 * Script untuk memperbaiki status pesanan yang tidak valid
 * Mengubah status 'selesai' menjadi 'terkirim'
 * 
 * Cara menjalankan:
 * bun run scripts/fix-status-pesanan.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Memeriksa data pesanan dengan status invalid...\n');

  try {
    // Cek berapa banyak data dengan status 'selesai'
    const invalidCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM pesanan_cetak 
      WHERE status = 'selesai'
    `;

    const count = Number(invalidCount[0]?.count || 0);
    
    if (count === 0) {
      console.log('✅ Tidak ada data dengan status invalid');
      return;
    }

    console.log(`⚠️  Ditemukan ${count} pesanan dengan status 'selesai' (invalid)`);
    console.log('📝 Mengubah status menjadi "terkirim"...\n');

    // Update status dari 'selesai' ke 'terkirim'
    const result = await prisma.$executeRaw`
      UPDATE pesanan_cetak 
      SET status = 'terkirim' 
      WHERE status = 'selesai'
    `;

    console.log(`✅ Berhasil mengupdate ${result} baris data`);
    
    // Verifikasi tidak ada lagi status invalid
    const checkAgain = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM pesanan_cetak 
      WHERE status = 'selesai'
    `;

    const remaining = Number(checkAgain[0]?.count || 0);
    
    if (remaining === 0) {
      console.log('✅ Semua data berhasil diperbaiki!');
    } else {
      console.log(`⚠️  Masih ada ${remaining} data yang perlu diperbaiki`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
