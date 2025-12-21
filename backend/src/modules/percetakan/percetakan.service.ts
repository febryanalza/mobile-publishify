import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BuatPesananDto,
  PerbaruiPesananDto,
  FilterPesananDto,
  UpdateStatusDto,
  BuatPengirimanDto,
  KonfirmasiPesananDto,
} from './dto';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Service untuk mengelola pesanan cetak buku
 * Menangani pembuatan, update, konfirmasi, dan tracking pesanan
 */
@Injectable()
export class PercetakanService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Buat pesanan cetak baru
   * Validasi: naskah harus berstatus 'diterbitkan'
   */
  async buatPesanan(idPemesan: string, dto: BuatPesananDto) {
    // Validasi naskah exists dan status diterbitkan
    const naskah = await this.prisma.naskah.findUnique({
      where: { id: dto.idNaskah },
      include: {
        penulis: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!naskah) {
      throw new NotFoundException('Naskah tidak ditemukan');
    }

    if (naskah.status !== 'diterbitkan') {
      throw new BadRequestException('Hanya naskah dengan status "diterbitkan" yang dapat dicetak');
    }

    // Validasi pemesan adalah penulis naskah
    if (naskah.idPenulis !== idPemesan) {
      throw new ForbiddenException('Anda hanya dapat memesan cetak untuk naskah Anda sendiri');
    }

    // Generate nomor pesanan unik (format: PO-YYYYMMDD-XXXX)
    const tanggal = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const nomorPesanan = `PO-${tanggal}-${randomNum}`;

    // Hitung biaya cetak
    const hargaTotal = await this.hitungBiayaCetak({
      jumlah: dto.jumlah,
      formatKertas: dto.formatKertas,
      jenisKertas: dto.jenisKertas,
      jenisCover: dto.jenisCover,
      finishingTambahan: dto.finishingTambahan || [],
      jumlahHalaman: naskah.jumlahHalaman || 100, // Default 100 halaman
    });

    // Buat pesanan
    const pesanan = await this.prisma.pesananCetak.create({
      data: {
        idNaskah: dto.idNaskah,
        idPemesan,
        nomorPesanan,
        jumlah: dto.jumlah,
        formatKertas: dto.formatKertas,
        jenisKertas: dto.jenisKertas,
        jenisCover: dto.jenisCover,
        finishingTambahan: dto.finishingTambahan || [],
        catatan: dto.catatan,
        hargaTotal: new Decimal(hargaTotal),
        status: 'tertunda',
      },
      include: {
        naskah: {
          select: {
            id: true,
            judul: true,
            jumlahHalaman: true,
          },
        },
        pemesan: {
          select: {
            id: true,
            email: true,
            profilPengguna: {
              select: {
                namaDepan: true,
                namaBelakang: true,
              },
            },
          },
        },
      },
    });

    // Log aktivitas
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idPemesan,
        jenis: 'pesanan_cetak',
        aksi: 'buat',
        entitas: 'pesanan_cetak',
        idEntitas: pesanan.id,
        deskripsi: `Membuat pesanan cetak untuk naskah "${naskah.judul}" dengan nomor ${nomorPesanan}`,
      },
    });

    return {
      sukses: true,
      pesan: 'Pesanan cetak berhasil dibuat',
      data: pesanan,
    };
  }

  /**
   * Ambil semua pesanan dengan filter dan pagination
   * Admin: lihat semua, Percetakan: lihat yang ditugaskan, Penulis: lihat milik sendiri
   */
  async ambilSemuaPesanan(filter: FilterPesananDto, idPengguna?: string, peran?: string) {
    const { halaman, limit, urutkan, arah, ...filterLainnya } = filter;
    const skip = (halaman - 1) * limit;

    // Build where clause
    const where: any = {};

    // Filter berdasarkan peran
    if (peran === 'penulis' && idPengguna) {
      where.idPemesan = idPengguna;
    } else if (peran === 'percetakan' && idPengguna) {
      where.idPercetakan = idPengguna;
    }
    // Admin bisa lihat semua

    // Apply filters
    if (filterLainnya.status) {
      where.status = filterLainnya.status;
    }

    if (filterLainnya.idPemesan) {
      where.idPemesan = filterLainnya.idPemesan;
    }

    if (filterLainnya.idNaskah) {
      where.idNaskah = filterLainnya.idNaskah;
    }

    if (filterLainnya.nomorPesanan) {
      where.nomorPesanan = {
        contains: filterLainnya.nomorPesanan,
        mode: 'insensitive' as const,
      };
    }

    // Date range filter
    if (filterLainnya.tanggalMulai || filterLainnya.tanggalSelesai) {
      where.tanggalPesan = {};
      if (filterLainnya.tanggalMulai) {
        where.tanggalPesan.gte = new Date(filterLainnya.tanggalMulai);
      }
      if (filterLainnya.tanggalSelesai) {
        where.tanggalPesan.lte = new Date(filterLainnya.tanggalSelesai);
      }
    }

    // Search
    if (filterLainnya.cari) {
      where.OR = [
        {
          nomorPesanan: {
            contains: filterLainnya.cari,
            mode: 'insensitive' as const,
          },
        },
        {
          catatan: {
            contains: filterLainnya.cari,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    const [pesanan, total] = await Promise.all([
      this.prisma.pesananCetak.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [urutkan]: arah },
        include: {
          naskah: {
            select: {
              id: true,
              judul: true,
              jumlahHalaman: true,
            },
          },
          pemesan: {
            select: {
              id: true,
              email: true,
              profilPengguna: {
                select: {
                  namaDepan: true,
                  namaBelakang: true,
                },
              },
            },
          },
          pengiriman: {
            select: {
              id: true,
              namaEkspedisi: true,
              nomorResi: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.pesananCetak.count({ where }),
    ]);

    return {
      sukses: true,
      data: pesanan,
      metadata: {
        total,
        halaman,
        limit,
        totalHalaman: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ambil detail pesanan by ID
   */
  async ambilPesananById(id: string, idPengguna?: string, peran?: string) {
    const pesanan = await this.prisma.pesananCetak.findUnique({
      where: { id },
      include: {
        naskah: {
          select: {
            id: true,
            judul: true,
            isbn: true,
            jumlahHalaman: true,
            urlSampul: true,
          },
        },
        pemesan: {
          select: {
            id: true,
            email: true,
            telepon: true,
            profilPengguna: {
              select: {
                namaDepan: true,
                namaBelakang: true,
              },
            },
          },
        },
        pengiriman: true,
        logProduksi: {
          orderBy: {
            dibuatPada: 'desc',
          },
        },
      },
    });

    if (!pesanan) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    // Validasi akses berdasarkan peran
    if (peran === 'penulis' && pesanan.idPemesan !== idPengguna) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pesanan ini');
    }

    if (peran === 'percetakan' && pesanan.idPercetakan !== idPengguna) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pesanan ini');
    }

    return {
      sukses: true,
      data: pesanan,
    };
  }

  /**
   * Ambil pesanan milik penulis yang login
   */
  async ambilPesananPenulis(idPenulis: string, filter: FilterPesananDto) {
    return this.ambilSemuaPesanan(
      {
        ...filter,
        idPemesan: idPenulis,
      },
      idPenulis,
      'penulis',
    );
  }

  /**
   * Perbarui detail pesanan (hanya untuk status tertunda)
   */
  async perbaruiPesanan(id: string, idPemesan: string, dto: PerbaruiPesananDto) {
    const pesanan = await this.prisma.pesananCetak.findUnique({
      where: { id },
      include: {
        naskah: true,
      },
    });

    if (!pesanan) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    // Validasi pemesan
    if (pesanan.idPemesan !== idPemesan) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk memperbarui pesanan ini');
    }

    // Hanya bisa update jika status masih tertunda
    if (pesanan.status !== 'tertunda') {
      throw new BadRequestException(
        'Pesanan hanya dapat diperbarui ketika status masih "tertunda"',
      );
    }

    // Recalculate harga jika ada perubahan spesifikasi
    let hargaBaru = pesanan.hargaTotal;
    if (
      dto.jumlah ||
      dto.formatKertas ||
      dto.jenisKertas ||
      dto.jenisCover ||
      dto.finishingTambahan
    ) {
      hargaBaru = new Decimal(
        await this.hitungBiayaCetak({
          jumlah: dto.jumlah ?? pesanan.jumlah,
          formatKertas: dto.formatKertas ?? pesanan.formatKertas,
          jenisKertas: dto.jenisKertas ?? pesanan.jenisKertas,
          jenisCover: dto.jenisCover ?? pesanan.jenisCover,
          finishingTambahan: dto.finishingTambahan ?? pesanan.finishingTambahan,
          jumlahHalaman: pesanan.naskah.jumlahHalaman || 100,
        }),
      );
    }

    const pesananUpdated = await this.prisma.pesananCetak.update({
      where: { id },
      data: {
        ...dto,
        hargaTotal: hargaBaru,
      },
      include: {
        naskah: {
          select: {
            id: true,
            judul: true,
          },
        },
      },
    });

    // Log aktivitas
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idPemesan,
        jenis: 'pesanan_cetak',
        aksi: 'perbarui',
        entitas: 'pesanan_cetak',
        idEntitas: id,
        deskripsi: `Memperbarui pesanan ${pesanan.nomorPesanan}`,
      },
    });

    return {
      sukses: true,
      pesan: 'Pesanan berhasil diperbarui',
      data: pesananUpdated,
    };
  }

  /**
   * Konfirmasi pesanan oleh percetakan
   * Status berubah: tertunda → diterima atau dibatalkan (jika ditolak)
   */
  async konfirmasiPesanan(id: string, idPercetakan: string, dto: KonfirmasiPesananDto) {
    const pesanan = await this.prisma.pesananCetak.findUnique({
      where: { id },
    });

    if (!pesanan) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (pesanan.status !== 'tertunda') {
      throw new BadRequestException(
        'Hanya pesanan dengan status "tertunda" yang dapat dikonfirmasi',
      );
    }

    const statusBaru = dto.diterima ? 'diterima' : 'dibatalkan';
    const hargaFinal = dto.hargaTotal ? new Decimal(dto.hargaTotal) : pesanan.hargaTotal;

    const pesananUpdated = await this.prisma.pesananCetak.update({
      where: { id },
      data: {
        idPercetakan,
        status: statusBaru,
        hargaTotal: hargaFinal,
        estimasiSelesai: dto.estimasiSelesai ? new Date(dto.estimasiSelesai) : undefined,
      },
      include: {
        naskah: {
          select: {
            judul: true,
          },
        },
      },
    });

    // Buat log produksi
    await this.prisma.logProduksi.create({
      data: {
        idPesanan: id,
        tahapan: dto.diterima ? 'Pesanan Diterima' : 'Pesanan Ditolak',
        deskripsi:
          dto.catatan || (dto.diterima ? 'Pesanan dikonfirmasi dan diterima' : 'Pesanan ditolak'),
      },
    });

    // Log aktivitas
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idPercetakan,
        jenis: 'pesanan_cetak',
        aksi: dto.diterima ? 'konfirmasi' : 'tolak',
        entitas: 'pesanan_cetak',
        idEntitas: id,
        deskripsi: `${dto.diterima ? 'Menerima' : 'Menolak'} pesanan ${pesanan.nomorPesanan} untuk naskah "${pesananUpdated.naskah.judul}"`,
      },
    });

    return {
      sukses: true,
      pesan: dto.diterima ? 'Pesanan berhasil dikonfirmasi' : 'Pesanan ditolak',
      data: pesananUpdated,
    };
  }

  /**
   * Batalkan pesanan (hanya oleh pemesan, status harus tertunda)
   */
  async batalkanPesanan(id: string, idPemesan: string, alasan?: string) {
    const pesanan = await this.prisma.pesananCetak.findUnique({
      where: { id },
    });

    if (!pesanan) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (pesanan.idPemesan !== idPemesan) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk membatalkan pesanan ini');
    }

    if (pesanan.status !== 'tertunda') {
      throw new BadRequestException('Hanya pesanan dengan status "tertunda" yang dapat dibatalkan');
    }

    const pesananUpdated = await this.prisma.pesananCetak.update({
      where: { id },
      data: {
        status: 'dibatalkan',
        catatan: alasan
          ? `${pesanan.catatan || ''}\n\nAlasan Pembatalan: ${alasan}`
          : pesanan.catatan,
      },
    });

    // Log aktivitas
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idPemesan,
        jenis: 'pesanan_cetak',
        aksi: 'batalkan',
        entitas: 'pesanan_cetak',
        idEntitas: id,
        deskripsi: `Membatalkan pesanan ${pesanan.nomorPesanan}`,
      },
    });

    return {
      sukses: true,
      pesan: 'Pesanan berhasil dibatalkan',
      data: pesananUpdated,
    };
  }

  /**
   * Update status pesanan (oleh percetakan)
   * Flow: diterima → dalam_produksi → kontrol_kualitas → siap → dikirim → terkirim
   */
  async updateStatusPesanan(id: string, idPercetakan: string, dto: UpdateStatusDto) {
    const pesanan = await this.prisma.pesananCetak.findUnique({
      where: { id },
    });

    if (!pesanan) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (pesanan.idPercetakan !== idPercetakan) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk memperbarui pesanan ini');
    }

    // Validasi status flow
    const validTransitions: Record<string, string[]> = {
      diterima: ['dalam_produksi'],
      dalam_produksi: ['kontrol_kualitas'],
      kontrol_kualitas: ['siap', 'dalam_produksi'], // bisa kembali ke produksi jika QC gagal
      siap: ['dikirim'],
      dikirim: ['terkirim'],
    };

    const currentStatus = pesanan.status;
    const allowedNextStatuses = validTransitions[currentStatus];

    if (!allowedNextStatuses || !allowedNextStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Transisi status dari "${currentStatus}" ke "${dto.status}" tidak valid`,
      );
    }

    // Update pesanan
    const updateData: any = {
      status: dto.status,
    };

    if (dto.estimasiSelesai) {
      updateData.estimasiSelesai = new Date(dto.estimasiSelesai);
    }

    if (dto.status === 'terkirim') {
      updateData.tanggalSelesai = new Date();
    }

    const pesananUpdated = await this.prisma.pesananCetak.update({
      where: { id },
      data: updateData,
    });

    // Buat log produksi
    const labelStatus: Record<string, string> = {
      diterima: 'Pesanan Diterima',
      dalam_produksi: 'Proses Produksi',
      kontrol_kualitas: 'Kontrol Kualitas',
      siap: 'Siap Kirim',
      dikirim: 'Dikirim',
      terkirim: 'Diterima Pelanggan',
    };

    await this.prisma.logProduksi.create({
      data: {
        idPesanan: id,
        tahapan: labelStatus[dto.status] || dto.status,
        deskripsi: dto.catatan || `Status pesanan diperbarui menjadi ${dto.status}`,
      },
    });

    // Log aktivitas
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idPercetakan,
        jenis: 'pesanan_cetak',
        aksi: 'update_status',
        entitas: 'pesanan_cetak',
        idEntitas: id,
        deskripsi: `Memperbarui status pesanan ${pesanan.nomorPesanan} menjadi ${dto.status}`,
      },
    });

    return {
      sukses: true,
      pesan: `Status pesanan berhasil diperbarui menjadi "${dto.status}"`,
      data: pesananUpdated,
    };
  }

  /**
   * Buat data pengiriman untuk pesanan
   * Status pesanan harus 'siap' atau 'dikirim'
   */
  async buatPengiriman(id: string, idPercetakan: string, dto: BuatPengirimanDto) {
    const pesanan = await this.prisma.pesananCetak.findUnique({
      where: { id },
      include: {
        pengiriman: true,
      },
    });

    if (!pesanan) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    if (pesanan.idPercetakan !== idPercetakan) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk pesanan ini');
    }

    if (pesanan.status !== 'siap' && pesanan.status !== 'dikirim') {
      throw new BadRequestException(
        'Pengiriman hanya dapat dibuat untuk pesanan dengan status "siap" atau "dikirim"',
      );
    }

    if (pesanan.pengiriman) {
      throw new BadRequestException('Pesanan ini sudah memiliki data pengiriman');
    }

    const pengiriman = await this.prisma.pengiriman.create({
      data: {
        idPesanan: id,
        namaEkspedisi: dto.namaEkspedisi,
        nomorResi: dto.nomorResi,
        biayaPengiriman: new Decimal(dto.biayaPengiriman),
        alamatTujuan: dto.alamatTujuan,
        namaPenerima: dto.namaPenerima,
        teleponPenerima: dto.teleponPenerima,
        status: 'diproses',
        tanggalKirim: new Date(),
        estimasiTiba: dto.estimasiTiba ? new Date(dto.estimasiTiba) : undefined,
      },
    });

    // Update status pesanan menjadi 'dikirim' jika masih 'siap'
    if (pesanan.status === 'siap') {
      await this.prisma.pesananCetak.update({
        where: { id },
        data: {
          status: 'dikirim',
        },
      });

      // Buat log produksi
      await this.prisma.logProduksi.create({
        data: {
          idPesanan: id,
          tahapan: 'Dikirim',
          deskripsi: `Pesanan dikirim melalui ${dto.namaEkspedisi}${dto.nomorResi ? ` dengan resi ${dto.nomorResi}` : ''}`,
        },
      });
    }

    // Log aktivitas
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idPercetakan,
        jenis: 'pengiriman',
        aksi: 'buat',
        entitas: 'pengiriman',
        idEntitas: pengiriman.id,
        deskripsi: `Membuat data pengiriman untuk pesanan ${pesanan.nomorPesanan}`,
      },
    });

    return {
      sukses: true,
      pesan: 'Data pengiriman berhasil dibuat',
      data: pengiriman,
    };
  }

  /**
   * Hitung biaya cetak berdasarkan spesifikasi
   * Formula: (biayaDasar × jumlah) + biayaKertas + biayaCover + biayaFinishing
   */
  async hitungBiayaCetak(spec: {
    jumlah: number;
    formatKertas: string;
    jenisKertas: string;
    jenisCover: string;
    finishingTambahan: string[];
    jumlahHalaman: number;
  }): Promise<number> {
    // Biaya dasar per halaman (dalam rupiah)
    const biayaPerHalaman = 100;
    const biayaDasar = spec.jumlahHalaman * biayaPerHalaman * spec.jumlah;

    // Biaya format kertas
    const biayaFormat: Record<string, number> = {
      A4: 500,
      A5: 300,
      B5: 400,
      Letter: 500,
      Custom: 1000,
    };
    const biayaFormatTotal = (biayaFormat[spec.formatKertas] || 500) * spec.jumlah;

    // Biaya jenis kertas per eksemplar
    const biayaKertas: Record<string, number> = {
      'HVS 70gr': 2000,
      'HVS 80gr': 2500,
      'Art Paper 120gr': 5000,
      'Art Paper 150gr': 7000,
      Bookpaper: 4000,
    };
    const biayaKertasTotal = (biayaKertas[spec.jenisKertas] || 2500) * spec.jumlah;

    // Biaya cover per eksemplar
    const biayaCover: Record<string, number> = {
      'Soft Cover': 5000,
      'Hard Cover': 15000,
      'Board Cover': 10000,
    };
    const biayaCoverTotal = (biayaCover[spec.jenisCover] || 5000) * spec.jumlah;

    // Biaya finishing per eksemplar
    const biayaFinishing: Record<string, number> = {
      'Laminasi Glossy': 3000,
      'Laminasi Doff': 3000,
      Emboss: 5000,
      Deboss: 5000,
      'Spot UV': 7000,
      Foil: 10000,
      'Tidak Ada': 0,
    };

    const biayaFinishingTotal = spec.finishingTambahan.reduce((total, finishing) => {
      return total + (biayaFinishing[finishing] || 0) * spec.jumlah;
    }, 0);

    // Total harga
    const totalHarga =
      biayaDasar + biayaFormatTotal + biayaKertasTotal + biayaCoverTotal + biayaFinishingTotal;

    return Math.round(totalHarga);
  }

  /**
   * Ambil statistik pesanan
   * Total pesanan, revenue, status breakdown
   */
  async ambilStatistikPesanan(idPengguna?: string, peran?: string) {
    const where: any = {};

    // Filter berdasarkan peran
    if (peran === 'penulis' && idPengguna) {
      where.idPemesan = idPengguna;
    } else if (peran === 'percetakan' && idPengguna) {
      where.idPercetakan = idPengguna;
    }

    const [totalPesanan, pesananAktif, pesananSelesai, totalRevenue, breakdownStatus] =
      await Promise.all([
        // Total semua pesanan
        this.prisma.pesananCetak.count({ where }),

        // Pesanan aktif (belum selesai/dibatalkan)
        this.prisma.pesananCetak.count({
          where: {
            ...where,
            status: {
              notIn: ['terkirim', 'dibatalkan'],
            },
          },
        }),

        // Pesanan selesai (terkirim)
        this.prisma.pesananCetak.count({
          where: {
            ...where,
            status: 'terkirim',
          },
        }),

        // Total revenue (dari pesanan yang tidak dibatalkan)
        this.prisma.pesananCetak.aggregate({
          where: {
            ...where,
            status: {
              not: 'dibatalkan',
            },
          },
          _sum: {
            hargaTotal: true,
          },
        }),

        // Breakdown berdasarkan status
        this.prisma.pesananCetak.groupBy({
          by: ['status'],
          where,
          _count: {
            status: true,
          },
        }),
      ]);

    // Format breakdown status
    const statusBreakdown = breakdownStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      sukses: true,
      pesan: 'Statistik pesanan berhasil diambil',
      data: {
        totalPesanan,
        pesananAktif,
        pesananSelesai,
        totalRevenue: totalRevenue._sum.hargaTotal?.toString() || '0',
        statusBreakdown,
      },
    };
  }
}
