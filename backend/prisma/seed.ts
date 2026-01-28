/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient, StatusPesanan } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding database...');

  // Hash password default
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Buat admin user
  const admin = await prisma.pengguna.upsert({
    where: { email: 'admin@publishify.com' },
    update: {},
    create: {
      email: 'admin@publishify.com',
      kataSandi: hashedPassword,
      telepon: '081234567890',
      aktif: true,
      terverifikasi: true,
      emailDiverifikasiPada: new Date(),
      profilPengguna: {
        create: {
          namaDepan: 'Admin',
          namaBelakang: 'Publishify',
          namaTampilan: 'Admin System',
          bio: 'Administrator sistem Publishify',
        },
      },
      peranPengguna: {
        create: {
          jenisPeran: 'admin',
          aktif: true,
        },
      },
    },
  });
  console.log('✅ Admin user dibuat:', admin.email);

  // 2. Buat editor user
  const editor = await prisma.pengguna.upsert({
    where: { email: 'editor@publishify.com' },
    update: {},
    create: {
      email: 'editor@publishify.com',
      kataSandi: hashedPassword,
      telepon: '081234567891',
      aktif: true,
      terverifikasi: true,
      emailDiverifikasiPada: new Date(),
      profilPengguna: {
        create: {
          namaDepan: 'Editor',
          namaBelakang: 'Publishify',
          namaTampilan: 'Editor Professional',
          bio: 'Editor profesional dengan pengalaman 10 tahun',
        },
      },
      peranPengguna: {
        create: {
          jenisPeran: 'editor',
          aktif: true,
        },
      },
    },
  });
  console.log('✅ Editor user dibuat:', editor.email);

  // 3. Buat penulis user dengan profil lengkap
  const penulis = await prisma.pengguna.upsert({
    where: { email: 'penulis@publishify.com' },
    update: {},
    create: {
      email: 'penulis@publishify.com',
      kataSandi: hashedPassword,
      telepon: '081234567892',
      aktif: true,
      terverifikasi: true,
      emailDiverifikasiPada: new Date(),
      profilPengguna: {
        create: {
          namaDepan: 'Penulis',
          namaBelakang: 'Demo',
          namaTampilan: 'Penulis Hebat',
          bio: 'Penulis novel dan cerita fiksi',
          kota: 'Jakarta',
          provinsi: 'DKI Jakarta',
        },
      },
      peranPengguna: {
        create: {
          jenisPeran: 'penulis',
          aktif: true,
        },
      },
      profilPenulis: {
        create: {
          namaPena: 'P. Demo',
          biografi: 'Penulis dengan passion dalam storytelling',
          spesialisasi: ['Fiksi', 'Romance', 'Mystery'],
          totalBuku: 0,
          totalDibaca: 0,
          ratingRataRata: 0,
        },
      },
    },
  });
  console.log('✅ Penulis user dibuat:', penulis.email);

  // 4. Buat percetakan user
  const percetakan = await prisma.pengguna.upsert({
    where: { email: 'percetakan@publishify.com' },
    update: {},
    create: {
      email: 'percetakan@publishify.com',
      kataSandi: hashedPassword,
      telepon: '081234567893',
      aktif: true,
      terverifikasi: true,
      emailDiverifikasiPada: new Date(),
      profilPengguna: {
        create: {
          namaDepan: 'Percetakan',
          namaBelakang: 'Publishify',
          namaTampilan: 'Percetakan Partner',
          bio: 'Partner percetakan terpercaya',
          kota: 'Bandung',
          provinsi: 'Jawa Barat',
        },
      },
      peranPengguna: {
        create: {
          jenisPeran: 'percetakan',
          aktif: true,
        },
      },
    },
  });
  console.log('✅ Percetakan user dibuat:', percetakan.email);

  // 5. Buat kategori-kategori naskah
  const kategoriFiksi = await prisma.kategori.upsert({
    where: { slug: 'fiksi' },
    update: {},
    create: {
      nama: 'Fiksi',
      slug: 'fiksi',
      deskripsi: 'Karya fiksi dan imajinasi',
      aktif: true,
    },
  });

  const kategoriNonFiksi = await prisma.kategori.upsert({
    where: { slug: 'non-fiksi' },
    update: {},
    create: {
      nama: 'Non-Fiksi',
      slug: 'non-fiksi',
      deskripsi: 'Karya berdasarkan fakta dan kenyataan',
      aktif: true,
    },
  });

  console.log('✅ Kategori dibuat');

  // 6. Buat sub-kategori
  const subKategoriRomance = await prisma.kategori.upsert({
    where: { slug: 'romance' },
    update: {},
    create: {
      nama: 'Romance',
      slug: 'romance',
      deskripsi: 'Cerita percintaan',
      idInduk: kategoriFiksi.id,
      aktif: true,
    },
  });

  const subKategoriMystery = await prisma.kategori.upsert({
    where: { slug: 'mystery' },
    update: {},
    create: {
      nama: 'Mystery',
      slug: 'mystery',
      deskripsi: 'Cerita misteri dan detektif',
      idInduk: kategoriFiksi.id,
      aktif: true,
    },
  });

  console.log('✅ Sub-kategori dibuat');

  // 7. Buat genre-genre
  const genres = [
    { nama: 'Drama', slug: 'drama', deskripsi: 'Genre drama' },
    { nama: 'Comedy', slug: 'comedy', deskripsi: 'Genre komedi' },
    { nama: 'Thriller', slug: 'thriller', deskripsi: 'Genre thriller' },
    { nama: 'Fantasy', slug: 'fantasy', deskripsi: 'Genre fantasi' },
    { nama: 'Sci-Fi', slug: 'sci-fi', deskripsi: 'Genre fiksi ilmiah' },
    { nama: 'Horror', slug: 'horror', deskripsi: 'Genre horor' },
  ];

  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {},
      create: {
        ...genre,
        aktif: true,
      },
    });
  }
  console.log('✅ Genre dibuat');

  // 8. Buat beberapa tags
  const tags = [
    { nama: 'Inspiratif', slug: 'inspiratif' },
    { nama: 'Motivasi', slug: 'motivasi' },
    { nama: 'Petualangan', slug: 'petualangan' },
    { nama: 'Keluarga', slug: 'keluarga' },
    { nama: 'Persahabatan', slug: 'persahabatan' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log('✅ Tags dibuat');

  // 9. Buat sample naskah
  const genreDrama = await prisma.genre.findFirst({ where: { slug: 'drama' } });

  const naskahSample = await prisma.naskah.create({
    data: {
      idPenulis: penulis.id,
      judul: 'Perjalanan Hidup',
      subJudul: 'Sebuah Kisah Inspiratif',
      sinopsis:
        'Sebuah kisah tentang perjalanan hidup seseorang yang penuh dengan tantangan dan pembelajaran. Melalui berbagai pengalaman, tokoh utama belajar tentang arti kehidupan, cinta, dan persahabatan.',
      idKategori: kategoriFiksi.id,
      idGenre: genreDrama?.id || kategoriFiksi.id,
      bahasaTulis: 'id',
      jumlahHalaman: 250,
      jumlahKata: 75000,
      status: 'draft',
      publik: false,
    },
  });
  console.log('✅ Sample naskah dibuat:', naskahSample.judul);

  // 10. Buat COMPREHENSIVE WRITER dengan 15+ naskah terpublish
  console.log('');
  console.log('📚 Membuat comprehensive writer untuk testing...');

  const writerTest = await prisma.pengguna.upsert({
    where: { email: 'ahmad.surya@publishify.com' },
    update: {},
    create: {
      email: 'ahmad.surya@publishify.com',
      kataSandi: hashedPassword,
      telepon: '081234567899',
      aktif: true,
      terverifikasi: true,
      emailDiverifikasiPada: new Date(),
      loginTerakhir: new Date(),
      profilPengguna: {
        create: {
          namaDepan: 'Ahmad',
          namaBelakang: 'Surya Wijaya',
          namaTampilan: 'Ahmad Surya',
          bio: 'Penulis produktif dengan lebih dari 15 karya yang telah diterbitkan. Spesialisasi dalam novel fiksi, romance, dan thriller. Pemenang Anugerah Sastra Indonesia 2023.',
          tanggalLahir: new Date('1985-05-15'),
          jenisKelamin: 'Laki-laki',
          alamat: 'Jl. Sastra No. 123, Menteng',
          kota: 'Jakarta Pusat',
          provinsi: 'DKI Jakarta',
          kodePos: '10310',
        },
      },
      peranPengguna: {
        create: {
          jenisPeran: 'penulis',
          aktif: true,
        },
      },
      profilPenulis: {
        create: {
          namaPena: 'A.S. Wijaya',
          biografi:
            'Ahmad Surya Wijaya, atau dikenal dengan nama pena A.S. Wijaya, adalah penulis Indonesia yang telah menghasilkan lebih dari 15 karya best seller. Lahir di Jakarta pada tahun 1985, ia menyelesaikan pendidikan Sastra Indonesia di Universitas Indonesia. Karya-karyanya telah diterjemahkan ke berbagai bahasa dan beberapa telah diadaptasi menjadi film layar lebar.',
          spesialisasi: ['Fiksi', 'Romance', 'Thriller', 'Mystery', 'Drama'],
          totalBuku: 15,
          totalDibaca: 250000,
          ratingRataRata: 4.7,
          namaRekeningBank: 'Ahmad Surya Wijaya',
          namaBank: 'Bank Mandiri',
          nomorRekeningBank: '1234567890123',
          npwp: '12.345.678.9-012.345',
        },
      },
    },
  });
  console.log('✅ Comprehensive writer dibuat:', writerTest.email);

  // Ambil semua genre untuk distribusi naskah
  const allGenres = await prisma.genre.findMany();
  const genreFantasy = allGenres.find((g) => g.slug === 'fantasy');
  const genreThriller = allGenres.find((g) => g.slug === 'thriller');
  const genreComedy = allGenres.find((g) => g.slug === 'comedy');
  const genreHorror = allGenres.find((g) => g.slug === 'horror');
  const genreSciFi = allGenres.find((g) => g.slug === 'sci-fi');

  // Data naskah yang realistic untuk writer test
  const naskahData = [
    {
      judul: 'Jejak Sang Pemburu',
      subJudul: 'Trilogi Detektif Jakarta - Bagian 1',
      sinopsis:
        'Detektif Arman menghadapi kasus pembunuhan berantai yang mengguncang Jakarta. Setiap korban meninggalkan jejak misterius yang mengarah pada konspirasi besar di balik kota metropolitan. Dalam pencariannya, Arman harus menghadapi masa lalunya sendiri.',
      kategori: kategoriNonFiksi,
      genre: genreThriller || genreDrama,
      halaman: 320,
      kata: 95000,
      status: 'diterbitkan',
      isbn: '978-602-1234-001-0',
      diterbitkanPada: new Date('2023-01-15'),
    },
    {
      judul: 'Cinta di Ujung Senja',
      subJudul: 'Novel Romance Terbaik 2023',
      sinopsis:
        'Kisah cinta Dina dan Arka yang terpisah oleh keadaan, namun takdir mempertemukan mereka kembali di sebuah kota kecil di Bali. Mereka harus memilih antara mengejar mimpi atau mempertahankan cinta yang telah lama mereka simpan.',
      kategori: subKategoriRomance,
      genre: genreDrama,
      halaman: 280,
      kata: 82000,
      status: 'diterbitkan',
      isbn: '978-602-1234-002-7',
      diterbitkanPada: new Date('2023-03-20'),
    },
    {
      judul: 'Misteri Rumah Tua',
      subJudul: 'Horor Psikologis',
      sinopsis:
        'Keluarga baru pindah ke rumah tua warisan yang ternyata menyimpan rahasia kelam. Suara-suara aneh, bayangan misterius, dan kejadian supernatural mulai mengganggu kehidupan mereka. Mereka harus mengungkap misteri di balik rumah itu sebelum terlambat.',
      kategori: kategoriFiksi,
      genre: genreHorror || genreThriller,
      halaman: 295,
      kata: 88000,
      status: 'diterbitkan',
      isbn: '978-602-1234-003-4',
      diterbitkanPada: new Date('2023-05-10'),
    },
    {
      judul: 'Petualangan di Negeri Fantasi',
      subJudul: 'Saga Kerajaan Cahaya - Buku 1',
      sinopsis:
        'Lima remaja terpilih untuk menyelamatkan Kerajaan Cahaya dari ancaman Penguasa Kegelapan. Mereka harus mengumpulkan lima kristal legendaris yang tersebar di berbagai dimensi. Petualangan epik yang penuh dengan sihir, persahabatan, dan pengorbanan.',
      kategori: kategoriFiksi,
      genre: genreFantasy || genreDrama,
      halaman: 400,
      kata: 125000,
      status: 'diterbitkan',
      isbn: '978-602-1234-004-1',
      diterbitkanPada: new Date('2023-07-01'),
    },
    {
      judul: 'Komedi Keluarga Modern',
      subJudul: 'Kisah Lucu Sehari-hari',
      sinopsis:
        'Kehidupan sehari-hari keluarga Budi yang penuh dengan kejadian kocak dan mengharukan. Dari problem pekerjaan, anak remaja yang rewel, hingga mertua yang cerewet. Sebuah potret keluarga Indonesia modern yang akan membuat Anda tertawa dan terharu.',
      kategori: kategoriFiksi,
      genre: genreComedy || genreDrama,
      halaman: 245,
      kata: 72000,
      status: 'diterbitkan',
      isbn: '978-602-1234-005-8',
      diterbitkanPada: new Date('2023-08-15'),
    },
    {
      judul: 'Masa Depan Bumi 2150',
      subJudul: 'Fiksi Ilmiah Distopia',
      sinopsis:
        'Tahun 2150, Bumi telah berubah drastis akibat perubahan iklim dan perang dunia ketiga. Sekelompok ilmuwan mencoba menyelamatkan umat manusia dengan teknologi time travel. Namun, perjalanan mereka mengungkap rahasia yang lebih berbahaya.',
      kategori: kategoriFiksi,
      genre: genreSciFi || genreThriller,
      halaman: 350,
      kata: 105000,
      status: 'diterbitkan',
      isbn: '978-602-1234-006-5',
      diterbitkanPada: new Date('2023-10-01'),
    },
    {
      judul: 'Pemburu Bayangan',
      subJudul: 'Trilogi Detektif Jakarta - Bagian 2',
      sinopsis:
        'Detektif Arman kembali dengan kasus baru yang lebih rumit. Seorang pembunuh bayaran profesional yang tidak meninggalkan jejak. Setiap target yang dibunuh memiliki koneksi tersembunyi dengan kasus masa lalu Arman.',
      kategori: subKategoriMystery,
      genre: genreThriller || genreDrama,
      halaman: 330,
      kata: 98000,
      status: 'diterbitkan',
      isbn: '978-602-1234-007-2',
      diterbitkanPada: new Date('2023-11-20'),
    },
    {
      judul: 'Rahasia Pulau Terpencil',
      subJudul: 'Petualangan Tropis',
      sinopsis:
        'Sekelompok peneliti terdampar di pulau terpencil yang tidak ada di peta. Mereka menemukan peradaban kuno yang masih bertahan dengan teknologi yang sangat maju. Pulau itu menyimpan rahasia yang dapat mengubah sejarah dunia.',
      kategori: kategoriFiksi,
      genre: genreFantasy || genreThriller,
      halaman: 310,
      kata: 92000,
      status: 'diterbitkan',
      isbn: '978-602-1234-008-9',
      diterbitkanPada: new Date('2024-01-10'),
    },
    {
      judul: 'Cinta Kedua Kalinya',
      subJudul: 'Romance Drama',
      sinopsis:
        'Setelah perceraian yang menyakitkan, Maya bertemu dengan Rio, seorang janda dengan dua anak. Mereka saling jatuh cinta, tetapi harus menghadapi tantangan dari keluarga, mantan pasangan, dan trauma masa lalu.',
      kategori: subKategoriRomance,
      genre: genreDrama,
      halaman: 265,
      kata: 78000,
      status: 'diterbitkan',
      isbn: '978-602-1234-009-6',
      diterbitkanPada: new Date('2024-03-05'),
    },
    {
      judul: 'Hantu Gedung Tua',
      subJudul: 'Horor Urban',
      sinopsis:
        'Gedung perkantoran tua di pusat kota Jakarta yang akan dirobohkan ternyata dihuni oleh arwah-arwah yang tidak tenang. Tim pembongkaran mengalami kejadian supernatural yang mengerikan. Mereka harus mengungkap tragedi masa lalu sebelum menjadi korban berikutnya.',
      kategori: kategoriFiksi,
      genre: genreHorror || genreDrama,
      halaman: 275,
      kata: 81000,
      status: 'diterbitkan',
      isbn: '978-602-1234-010-2',
      diterbitkanPada: new Date('2024-05-15'),
    },
    {
      judul: 'Perang Galaksi Terakhir',
      subJudul: 'Space Opera Epic',
      sinopsis:
        'Perang antara Federasi Galaksi dan Kekaisaran Zorgon mencapai puncaknya. Kapten Rendra dan krunya adalah harapan terakhir untuk menghentikan kehancuran total. Mereka harus menemukan senjata kuno yang dapat mengakhiri perang.',
      kategori: kategoriFiksi,
      genre: genreSciFi || genreFantasy,
      halaman: 420,
      kata: 130000,
      status: 'diterbitkan',
      isbn: '978-602-1234-011-9',
      diterbitkanPada: new Date('2024-07-01'),
    },
    {
      judul: 'Konspirasi Gedung Putih',
      subJudul: 'Political Thriller',
      sinopsis:
        'Seorang jurnalis investigasi menemukan dokumen rahasia yang mengungkap korupsi besar-besaran di pemerintahan. Ia menjadi target pembunuhan dan harus berlari dari pemburu bayaran sambil mengungkap kebenaran kepada publik.',
      kategori: kategoriNonFiksi,
      genre: genreThriller || genreDrama,
      halaman: 340,
      kata: 102000,
      status: 'diterbitkan',
      isbn: '978-602-1234-012-6',
      diterbitkanPada: new Date('2024-08-20'),
    },
    {
      judul: 'Keajaiban di Kampung Halaman',
      subJudul: 'Drama Keluarga',
      sinopsis:
        'Andi pulang ke kampung halaman setelah 20 tahun merantau. Ia menemukan banyak perubahan, tetapi kehangatan keluarga tetap sama. Sebuah cerita tentang kembali ke akar, memaafkan, dan menemukan makna hidup.',
      kategori: kategoriFiksi,
      genre: genreDrama,
      halaman: 290,
      kata: 85000,
      status: 'diterbitkan',
      isbn: '978-602-1234-013-3',
      diterbitkanPada: new Date('2024-10-10'),
    },
    // Naskah dalam proses (bukan published)
    {
      judul: 'Misteri Hilangnya Kapal Selam',
      subJudul: 'Naval Thriller',
      sinopsis:
        'Kapal selam nuklir milik Indonesia menghilang di Samudra Hindia. Tim SAR internasional mencari dengan sia-sia. Ternyata ada konspirasi besar yang melibatkan beberapa negara adidaya.',
      kategori: subKategoriMystery,
      genre: genreThriller || genreDrama,
      halaman: 315,
      kata: 94000,
      status: 'dalam_review',
      isbn: null,
      diterbitkanPada: null,
    },
    {
      judul: 'Perjalanan Waktu ke Masa Lalu',
      subJudul: 'Time Travel Adventure',
      sinopsis:
        'Ilmuwan muda bernama Dika berhasil menciptakan mesin waktu. Ia kembali ke tahun 1945 untuk menyaksikan proklamasi kemerdekaan Indonesia. Namun, kehadirannya mengubah timeline sejarah.',
      kategori: kategoriFiksi,
      genre: genreSciFi || genreFantasy,
      halaman: 0,
      kata: 0,
      status: 'draft',
      isbn: null,
      diterbitkanPada: null,
    },
  ];

  // Buat semua naskah untuk writer test
  for (const [index, data] of naskahData.entries()) {
    const naskah = await prisma.naskah.create({
      data: {
        idPenulis: writerTest.id,
        judul: data.judul,
        subJudul: data.subJudul,
        sinopsis: data.sinopsis,
        idKategori: data.kategori.id,
        idGenre: data.genre?.id || genreDrama?.id || kategoriFiksi.id,
        bahasaTulis: 'id',
        jumlahHalaman: data.halaman,
        jumlahKata: data.kata,
        status: data.status as any,
        isbn: data.isbn,
        publik: data.status === 'diterbitkan',
        diterbitkanPada: data.diterbitkanPada,
        urlSampul: data.status === 'diterbitkan' ? `/sampul/${data.isbn}.jpg` : null,
        urlFile:
          data.status === 'diterbitkan' || data.status === 'dalam_review'
            ? `/naskah/${data.judul.toLowerCase().replace(/\s+/g, '-')}.pdf`
            : null,
      },
    });

    // Tambah revisi untuk naskah yang sudah ada filenya
    if (data.status === 'diterbitkan' || data.status === 'dalam_review') {
      await prisma.revisiNaskah.create({
        data: {
          idNaskah: naskah.id,
          versi: 1,
          catatan: 'Versi final yang telah direview dan disetujui',
          urlFile: `/naskah/${data.judul.toLowerCase().replace(/\s+/g, '-')}-v1.pdf`,
        },
      });
    }

    // Tambah review untuk naskah yang published
    if (data.status === 'diterbitkan') {
      const review = await prisma.reviewNaskah.create({
        data: {
          idNaskah: naskah.id,
          idEditor: editor.id,
          status: 'selesai',
          rekomendasi: 'setujui',
          catatan: `Novel yang sangat bagus dengan alur cerita yang menarik. Karakterisasi kuat dan gaya penulisan yang matang. Layak untuk diterbitkan.`,
          ditugaskanPada: new Date(data.diterbitkanPada!.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 hari sebelum terbit
          dimulaiPada: new Date(data.diterbitkanPada!.getTime() - 25 * 24 * 60 * 60 * 1000),
          selesaiPada: new Date(data.diterbitkanPada!.getTime() - 10 * 24 * 60 * 60 * 1000),
        },
      });

      // Tambah feedback untuk review
      await prisma.feedbackReview.create({
        data: {
          idReview: review.id,
          bab: 'Keseluruhan',
          halaman: null,
          komentar:
            'Pacing cerita sangat baik, tidak ada bagian yang membosankan. Dialog terasa natural dan sesuai dengan karakter.',
        },
      });
    }

    console.log(`  ✅ Naskah ${index + 1}/15: ${data.judul} (${data.status})`);
  }

  // Update statistik penulis
  await prisma.profilPenulis.update({
    where: { idPengguna: writerTest.id },
    data: {
      totalBuku: 13, // 13 naskah published
    },
  });

  console.log('');
  console.log('✅ Comprehensive writer seed completed!');
  console.log(`   - Total naskah: 15`);
  console.log(`   - Status diterbitkan: 13 naskah`);
  console.log(`   - Status dalam_review: 1 naskah`);
  console.log(`   - Status draft: 1 naskah`);
  console.log(`   - Semua naskah published memiliki review dan revisi`);

  // ============================================
  // PERCETAKAN - TARIF & PESANAN DUMMY DATA
  // ============================================
  console.log('');
  console.log('🖨️  Membuat data dummy untuk Percetakan...');

  // Buat tarif percetakan
  const tarifData = [
    {
      formatBuku: 'A5',
      jenisKertas: 'HVS 70gr',
      jenisCover: 'SOFTCOVER',
      hargaPerHalaman: 350,
      biayaJilid: 5000,
      minimumPesanan: 10,
    },
    {
      formatBuku: 'A5',
      jenisKertas: 'HVS 80gr',
      jenisCover: 'SOFTCOVER',
      hargaPerHalaman: 400,
      biayaJilid: 5500,
      minimumPesanan: 10,
    },
    {
      formatBuku: 'A5',
      jenisKertas: 'BOOKPAPER',
      jenisCover: 'SOFTCOVER',
      hargaPerHalaman: 450,
      biayaJilid: 6000,
      minimumPesanan: 10,
    },
    {
      formatBuku: 'A5',
      jenisKertas: 'BOOKPAPER',
      jenisCover: 'HARDCOVER',
      hargaPerHalaman: 450,
      biayaJilid: 12000,
      minimumPesanan: 10,
    },
    {
      formatBuku: 'A4',
      jenisKertas: 'HVS 80gr',
      jenisCover: 'SOFTCOVER',
      hargaPerHalaman: 500,
      biayaJilid: 7000,
      minimumPesanan: 5,
    },
  ];

  // Create parameter harga percetakan (new single-table approach)
  // TODO: Uncomment after running: bun prisma generate
  /*
  await prisma.parameterHargaPercetakan.create({
    data: {
      idPercetakan: percetakan.id,
      namaKombinasi: 'Tarif Standar',
      deskripsi: 'Tarif standar untuk pesanan reguler',
      hargaKertasA4: 500,
      hargaKertasA5: 350,
      hargaKertasB5: 400,
      hargaSoftcover: 5000,
      hargaHardcover: 15000,
      biayaJilid: 3000,
      minimumPesanan: 10,
      aktif: true,
    },
  });
  */
  console.log('✅ Parameter harga percetakan dibuat (commented out - needs Prisma regeneration)');

  // Ambil beberapa naskah published untuk pesanan
  const naskahPublished = await prisma.naskah.findMany({
    where: { status: 'diterbitkan' },
    take: 8,
  });

  // Buat pesanan cetak dengan berbagai status
  const pesananData = [
    {
      naskah: naskahPublished[0],
      status: 'tertunda',
      jumlah: 50,
      formatKertas: 'A5',
      jenisKertas: 'HVS 70gr',
      jenisCover: 'SOFTCOVER',
      hargaTotal: 875000,
      createdDaysAgo: 1,
    },
    {
      naskah: naskahPublished[1],
      status: 'tertunda',
      jumlah: 100,
      formatKertas: 'A5',
      jenisKertas: 'BOOKPAPER',
      jenisCover: 'SOFTCOVER',
      hargaTotal: 1650000,
      createdDaysAgo: 2,
    },
    {
      naskah: naskahPublished[2],
      status: 'diterima',
      jumlah: 75,
      formatKertas: 'A5',
      jenisKertas: 'HVS 80gr',
      jenisCover: 'SOFTCOVER',
      hargaTotal: 1225000,
      createdDaysAgo: 5,
    },
    {
      naskah: naskahPublished[3],
      status: 'dalam_produksi',
      jumlah: 200,
      formatKertas: 'A5',
      jenisKertas: 'BOOKPAPER',
      jenisCover: 'HARDCOVER',
      hargaTotal: 3750000,
      createdDaysAgo: 8,
    },
    {
      naskah: naskahPublished[4],
      status: 'dalam_produksi',
      jumlah: 150,
      formatKertas: 'A5',
      jenisKertas: 'BOOKPAPER',
      jenisCover: 'SOFTCOVER',
      hargaTotal: 2625000,
      createdDaysAgo: 10,
    },
    {
      naskah: naskahPublished[5],
      status: 'kontrol_kualitas',
      jumlah: 100,
      formatKertas: 'A5',
      jenisKertas: 'HVS 80gr',
      jenisCover: 'SOFTCOVER',
      hargaTotal: 1650000,
      createdDaysAgo: 15,
    },
    {
      naskah: naskahPublished[6],
      status: 'siap',
      jumlah: 50,
      formatKertas: 'A5',
      jenisKertas: 'HVS 70gr',
      jenisCover: 'SOFTCOVER',
      hargaTotal: 875000,
      createdDaysAgo: 18,
    },
    {
      naskah: naskahPublished[7],
      status: 'terkirim',
      jumlah: 250,
      formatKertas: 'A5',
      jenisKertas: 'BOOKPAPER',
      jenisCover: 'HARDCOVER',
      hargaTotal: 4687500,
      createdDaysAgo: 30,
      tanggalSelesai: 25,
    },
  ];

  for (let i = 0; i < pesananData.length; i++) {
    const data = pesananData[i];
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - data.createdDaysAgo);

    const nomorPesanan = `PO-${createdAt.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i + 1).padStart(4, '0')}`;

    const pesanan = await prisma.pesananCetak.create({
      data: {
        idNaskah: data.naskah.id,
        idPemesan: writerTest.id,
        idPercetakan: percetakan.id,
        nomorPesanan,
        jumlah: data.jumlah,
        formatKertas: data.formatKertas,
        jenisKertas: data.jenisKertas,
        jenisCover: data.jenisCover,
        finishingTambahan: [],
        catatan: `Pesanan untuk ${data.naskah.judul}. Mohon dikerjakan dengan kualitas terbaik.`,
        hargaTotal: data.hargaTotal,
        status: data.status as StatusPesanan,
        // TODO: Uncomment after running: bun prisma generate
        // judulSnapshot: data.naskah.judul,
        // formatSnapshot: data.formatKertas,
        // jumlahHalamanSnapshot: data.naskah.jumlahHalaman || 0,
        tanggalPesan: createdAt,
      },
    });

    // Buat log produksi untuk pesanan yang sudah dalam proses
    if (['dalam_produksi', 'kontrol_kualitas', 'siap', 'terkirim'].includes(data.status)) {
      await prisma.logProduksi.create({
        data: {
          idPesanan: pesanan.id,
          tahapan: 'Diterima',
          deskripsi: 'Pesanan diterima dan akan segera diproses',
        },
      });

      await prisma.logProduksi.create({
        data: {
          idPesanan: pesanan.id,
          tahapan: 'Dalam Produksi',
          deskripsi: 'Proses pencetakan dimulai',
        },
      });
    }

    if (['kontrol_kualitas', 'siap', 'terkirim'].includes(data.status)) {
      await prisma.logProduksi.create({
        data: {
          idPesanan: pesanan.id,
          tahapan: 'Quality Control',
          deskripsi: 'Melakukan quality control terhadap hasil cetak',
        },
      });
    }

    if (['siap', 'terkirim'].includes(data.status)) {
      await prisma.logProduksi.create({
        data: {
          idPesanan: pesanan.id,
          tahapan: 'Siap Kirim',
          deskripsi: 'Pesanan siap untuk dikirim',
        },
      });
    }

    // Buat data pengiriman untuk pesanan yang terkirim
    if (data.status === 'terkirim') {
      const tanggalKirim = new Date(createdAt);
      tanggalKirim.setDate(tanggalKirim.getDate() + (data.tanggalSelesai || 20));

      await prisma.pengiriman.create({
        data: {
          idPesanan: pesanan.id,
          namaEkspedisi: 'JNE Regular',
          nomorResi: `JNE${Math.random().toString().slice(2, 14)}`,
          biayaPengiriman: 25000,
          estimasiTiba: new Date(tanggalKirim.getTime() + 3 * 24 * 60 * 60 * 1000),
          alamatTujuan: 'Jl. Merdeka No. 123, Jakarta Pusat, DKI Jakarta 10110',
          namaPenerima: 'Ahmad Surya Wijaya',
          teleponPenerima: '081298765432',
          status: 'terkirim',
          tanggalKirim: tanggalKirim,
          tanggalTiba: new Date(tanggalKirim.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.logProduksi.create({
        data: {
          idPesanan: pesanan.id,
          tahapan: 'Terkirim',
          deskripsi: 'Pesanan telah dikirim dan diterima oleh pemesan',
        },
      });
    }

    console.log(`  ✅ Pesanan ${i + 1}/8: ${data.naskah.judul} - ${data.status} (${data.jumlah} buku)`);
  }

  console.log('');
  console.log('✅ Data percetakan dummy completed!');
  console.log(`   - Tarif percetakan: 5 kombinasi`);
  console.log(`   - Total pesanan: 8 pesanan`);
  console.log(`   - Status tertunda: 2 pesanan`);
  console.log(`   - Status diterima: 1 pesanan`);
  console.log(`   - Status dalam_produksi: 2 pesanan`);
  console.log(`   - Status kontrol_kualitas: 1 pesanan`);
  console.log(`   - Status siap: 1 pesanan`);
  console.log(`   - Status terkirim: 1 pesanan`);

  console.log('');
  console.log('🎉 Seeding selesai!');
  console.log('');
  console.log('📝 Informasi Login:');
  console.log('Admin     : admin@publishify.com / Password123!');
  console.log('Editor    : editor@publishify.com / Password123!');
  console.log('Penulis   : penulis@publishify.com / Password123!');
  console.log('Percetakan: percetakan@publishify.com / Password123!');
  console.log('');
  console.log('🌟 COMPREHENSIVE WRITER untuk Testing:');
  console.log('Email     : ahmad.surya@publishify.com / Password123!');
  console.log('Nama      : Ahmad Surya Wijaya (A.S. Wijaya)');
  console.log('Total Buku: 15 naskah (13 published, 1 review, 1 draft)');
  console.log('Profile   : Complete dengan bio, bank account, NPWP');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
