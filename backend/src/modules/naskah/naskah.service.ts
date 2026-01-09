/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BuatNaskahDto,
  PerbaruiNaskahDto,
  FilterNaskahDto,
  AjukanNaskahDto,
  TerbitkanNaskahDto,
} from './dto';
import { StatusNaskah } from '@prisma/client';
import {
  CursorPaginationDto,
  buildCursorPaginationResponse,
} from '@/common/dto/cursor-pagination.dto';

@Injectable()
export class NaskahService {
  private readonly logger = new Logger(NaskahService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Buat naskah baru
   * Role: penulis
   */
  async buatNaskah(idPenulis: string, dto: BuatNaskahDto) {
    // Validasi kategori exists
    const kategori = await this.prisma.kategori.findUnique({
      where: { id: dto.idKategori },
    });

    if (!kategori || !kategori.aktif) {
      throw new BadRequestException('Kategori tidak valid atau tidak aktif');
    }

    // Validasi genre exists
    const genre = await this.prisma.genre.findUnique({
      where: { id: dto.idGenre },
    });

    if (!genre || !genre.aktif) {
      throw new BadRequestException('Genre tidak valid atau tidak aktif');
    }

    // Buat naskah dengan revisi pertama
    const naskah = await this.prisma.$transaction(async (prisma) => {
      // Create naskah
      const newNaskah = await prisma.naskah.create({
        data: {
          ...dto,
          idPenulis,
          status: StatusNaskah.draft,
        },
        include: {
          penulis: {
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
          kategori: true,
          genre: true,
        },
      });

      // Create revisi pertama jika ada file
      if (dto.urlFile) {
        await prisma.revisiNaskah.create({
          data: {
            idNaskah: newNaskah.id,
            versi: 1,
            catatan: 'Versi awal naskah',
            urlFile: dto.urlFile,
          },
        });
      }

      return newNaskah;
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idPenulis,
        jenis: 'buat_naskah',
        aksi: 'Buat Naskah',
        entitas: 'Naskah',
        idEntitas: naskah.id,
        deskripsi: `Naskah "${naskah.judul}" berhasil dibuat`,
      },
    });

    return {
      sukses: true,
      pesan: 'Naskah berhasil dibuat',
      data: naskah,
    };
  }

  /**
   * Ambil semua naskah dengan pagination dan filter
   * Role: public (untuk publik=true), authenticated (semua)
   */
  async ambilSemuaNaskah(filter: FilterNaskahDto, idPengguna?: string) {
    const {
      halaman = 1,
      limit = 20,
      cari,
      status,
      idKategori,
      idGenre,
      idPenulis,
      publik,
      urutkan = 'dibuatPada',
      arah = 'desc',
    } = filter;

    const skip = (halaman - 1) * limit;

    // Build where clause
    const where: any = {};

    // Jika tidak ada idPengguna (public), hanya tampilkan yang publik dan diterbitkan
    if (!idPengguna) {
      where.publik = true;
      where.status = StatusNaskah.diterbitkan;
    } else {
      // Authenticated user bisa filter publik (opsional)
      if (publik !== undefined) {
        where.publik = publik;
      }
      // Authenticated user: tidak ada filter status default
      // Mereka bisa melihat semua status termasuk 'diajukan'
    }

    // Search filter (judul, sinopsis)
    if (cari) {
      where.OR = [
        { judul: { contains: cari, mode: 'insensitive' } },
        { sinopsis: { contains: cari, mode: 'insensitive' } },
      ];
    }

    // Filter by status (explicitly)
    if (status) {
      where.status = status;
    }

    // Filter by kategori
    if (idKategori) {
      where.idKategori = idKategori;
    }

    // Filter by genre
    if (idGenre) {
      where.idGenre = idGenre;
    }

    // Filter by penulis
    if (idPenulis) {
      where.idPenulis = idPenulis;
    }

    // Execute query
    const [data, total] = await Promise.all([
      this.prisma.naskah.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [urutkan]: arah },
        select: {
          id: true,
          judul: true,
          subJudul: true,
          sinopsis: true,
          isbn: true,
          status: true,
          urlSampul: true,
          urlFile: true,
          jumlahHalaman: true,
          jumlahKata: true,
          bahasaTulis: true,
          publik: true,
          dibuatPada: true,
          diperbaruiPada: true,
          idPenulis: true,
          idKategori: true,
          idGenre: true,
          penulis: {
            select: {
              id: true,
              email: true,
              profilPengguna: {
                select: {
                  namaDepan: true,
                  namaBelakang: true,
                  namaTampilan: true,
                  urlAvatar: true,
                },
              },
              profilPenulis: {
                select: {
                  namaPena: true,
                  ratingRataRata: true,
                },
              },
            },
          },
          kategori: {
            select: {
              id: true,
              nama: true,
              slug: true,
            },
          },
          genre: {
            select: {
              id: true,
              nama: true,
              slug: true,
            },
          },
          review: {
            select: {
              id: true,
              idEditor: true,
              status: true,
              rekomendasi: true,
            },
            where: {
              status: {
                in: ['ditugaskan', 'dalam_proses'],
              },
            },
          },
          _count: {
            select: {
              revisi: true,
              review: true,
            },
          },
        },
      }),
      this.prisma.naskah.count({ where }),
    ]);

    return {
      sukses: true,
      pesan: 'Data naskah berhasil diambil',
      data,
      metadata: {
        total,
        halaman,
        limit,
        totalHalaman: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ambil naskah dengan cursor-based pagination
   * Lebih efisien untuk dataset besar dan deep pagination
   * Role: public (untuk publik=true), authenticated (semua)
   */
  async ambilNaskahDenganCursor(
    cursor: string | undefined,
    limit: number = 20,
    status?: StatusNaskah,
    idKategori?: string,
    idPengguna?: string,
  ) {
    const take = Math.min(limit, 100); // Max 100 items

    // Build where clause
    const where: any = {};

    // Jika tidak ada idPengguna (public), hanya tampilkan yang publik dan diterbitkan
    if (!idPengguna) {
      where.publik = true;
      where.status = StatusNaskah.diterbitkan;
    } else {
      // Authenticated user bisa filter status
      if (status) {
        where.status = status;
      }
    }

    // Filter by kategori
    if (idKategori) {
      where.idKategori = idKategori;
    }

    // Fetch items (take + 1 untuk detect hasMore)
    const items = await this.prisma.naskah.findMany({
      where,
      take: take + 1, // Fetch satu lebih untuk detect hasMore
      ...(cursor && {
        cursor: {
          id: cursor, // Gunakan ID sebagai cursor (unique field)
        },
        skip: 1, // Skip cursor item
      }),
      orderBy: {
        dibuatPada: 'desc', // Sort by creation date
      },
      select: {
        id: true,
        judul: true,
        subJudul: true,
        sinopsis: true,
        isbn: true,
        status: true,
        urlSampul: true,
        jumlahHalaman: true,
        jumlahKata: true,
        publik: true,
        dibuatPada: true,
        diperbaruiPada: true,
        penulis: {
          select: {
            id: true,
            email: true,
            profilPengguna: {
              select: {
                namaDepan: true,
                namaBelakang: true,
                namaTampilan: true,
                urlAvatar: true,
              },
            },
            profilPenulis: {
              select: {
                namaPena: true,
                ratingRataRata: true,
              },
            },
          },
        },
        kategori: {
          select: {
            id: true,
            nama: true,
            slug: true,
          },
        },
        genre: {
          select: {
            id: true,
            nama: true,
            slug: true,
          },
        },
        _count: {
          select: {
            revisi: true,
            review: true,
          },
        },
      },
    });

    // Build response dengan helper function
    return buildCursorPaginationResponse(items, take, (item) => item.id);
  }

  /**
   * Ambil detail naskah by ID
   */
  async ambilNaskahById(id: string, idPengguna?: string) {
    // Debug logging untuk troubleshooting
    this.logger.debug(`[ambilNaskahById] ID Naskah: ${id}, ID Pengguna: ${idPengguna || 'undefined'}`);
    
    const naskah = await this.prisma.naskah.findUnique({
      where: { id },
      include: {
        penulis: {
          select: {
            id: true,
            email: true,
            profilPengguna: {
              select: {
                namaDepan: true,
                namaBelakang: true,
                namaTampilan: true,
                urlAvatar: true,
                bio: true,
              },
            },
            profilPenulis: {
              select: {
                namaPena: true,
                biografi: true,
                spesialisasi: true,
                ratingRataRata: true,
                totalBuku: true,
              },
            },
          },
        },
        kategori: true,
        genre: true,
        revisi: {
          orderBy: { versi: 'desc' },
          take: 10,
        },
        review: {
          where: { status: 'selesai' },
          include: {
            editor: {
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
          orderBy: { ditugaskanPada: 'desc' },
        },
        _count: {
          select: {
            revisi: true,
            review: true,
          },
        },
      },
    });

    if (!naskah) {
      throw new NotFoundException('Naskah tidak ditemukan');
    }

    // Validasi akses dengan best practice:
    // 1. Pemilik SELALU bisa akses naskah mereka sendiri (publik atau private)
    // 2. Naskah publik bisa diakses siapa saja
    // 3. Naskah private hanya bisa diakses pemilik
    const isPemilik = idPengguna && naskah.idPenulis === idPengguna;
    const isNaskahPublik = naskah.publik;

    // Debug logging untuk troubleshooting
    this.logger.debug(`[ambilNaskahById] isPemilik: ${isPemilik}, isNaskahPublik: ${isNaskahPublik}, idPenulis naskah: ${naskah.idPenulis}`);

    if (!isPemilik && !isNaskahPublik) {
      throw new ForbiddenException('Anda tidak memiliki akses ke naskah ini');
    }

    return {
      sukses: true,
      data: naskah,
    };
  }

  /**
   * Ambil naskah milik penulis tertentu
   * Role: penulis (naskah sendiri)
   */
  async ambilNaskahPenulis(idPenulis: string, filter: FilterNaskahDto) {
    // Override idPenulis di filter
    return this.ambilSemuaNaskah({ ...filter, idPenulis }, idPenulis);
  }

  /**
   * Perbarui naskah
   * Role: penulis (owner), editor (untuk review), admin
   */
  async perbaruiNaskah(
    id: string,
    dto: PerbaruiNaskahDto,
    idPengguna: string,
    peranPengguna: string[],
  ) {
    // Check if naskah exists
    const naskahLama = await this.prisma.naskah.findUnique({
      where: { id },
      select: {
        id: true,
        idPenulis: true,
        status: true,
        judul: true,
      },
    });

    if (!naskahLama) {
      throw new NotFoundException('Naskah tidak ditemukan');
    }

    // Validasi akses: hanya penulis owner atau admin
    const isPenulis = peranPengguna.includes('penulis');
    const isAdmin = peranPengguna.includes('admin');

    if (isPenulis && naskahLama.idPenulis !== idPengguna && !isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah naskah ini');
    }

    // Validasi: tidak bisa edit jika status sudah disetujui, ditolak, atau diterbitkan
    // Allowed: draft, diajukan, dalam_review, perlu_revisi
    const allowedStatuses: StatusNaskah[] = [
      StatusNaskah.draft,
      StatusNaskah.diajukan,
      StatusNaskah.dalam_review,
      StatusNaskah.perlu_revisi,
    ];

    if (!isAdmin && !allowedStatuses.includes(naskahLama.status as StatusNaskah)) {
      throw new BadRequestException(
        'Naskah tidak dapat diubah setelah disetujui, ditolak, atau diterbitkan. Status saat ini: ' + naskahLama.status
      );
    }

    // Validasi kategori dan genre jika ada update
    if (dto.idKategori) {
      const kategori = await this.prisma.kategori.findUnique({
        where: { id: dto.idKategori },
      });
      if (!kategori || !kategori.aktif) {
        throw new BadRequestException('Kategori tidak valid atau tidak aktif');
      }
    }

    if (dto.idGenre) {
      const genre = await this.prisma.genre.findUnique({
        where: { id: dto.idGenre },
      });
      if (!genre || !genre.aktif) {
        throw new BadRequestException('Genre tidak valid atau tidak aktif');
      }
    }

    // Update naskah
    const naskah = await this.prisma.naskah.update({
      where: { id },
      data: dto,
      include: {
        penulis: {
          select: {
            id: true,
            email: true,
            profilPengguna: true,
          },
        },
        kategori: true,
        genre: true,
      },
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna,
        jenis: 'perbarui_naskah',
        aksi: 'Perbarui Naskah',
        entitas: 'Naskah',
        idEntitas: id,
        deskripsi: `Naskah "${naskahLama.judul}" berhasil diperbarui`,
      },
    });

    return {
      sukses: true,
      pesan: 'Naskah berhasil diperbarui',
      data: naskah,
    };
  }

  /**
   * Ajukan naskah untuk review
   * Role: penulis
   */
  async ajukanNaskah(id: string, dto: AjukanNaskahDto, idPenulis: string) {
    const naskah = await this.prisma.naskah.findUnique({
      where: { id },
      select: {
        id: true,
        idPenulis: true,
        status: true,
        judul: true,
        urlFile: true,
      },
    });

    if (!naskah) {
      throw new NotFoundException('Naskah tidak ditemukan');
    }

    // Validasi owner
    if (naskah.idPenulis !== idPenulis) {
      throw new ForbiddenException('Anda tidak memiliki akses ke naskah ini');
    }

    // Validasi status: hanya draft atau perlu_revisi yang bisa diajukan
    if (naskah.status !== StatusNaskah.draft && naskah.status !== StatusNaskah.perlu_revisi) {
      throw new BadRequestException(
        'Naskah hanya bisa diajukan saat status draft atau perlu revisi',
      );
    }

    // Validasi: harus ada file naskah
    if (!naskah.urlFile) {
      throw new BadRequestException('Naskah harus memiliki file sebelum diajukan');
    }

    // Update status menjadi diajukan
    const naskahUpdated = await this.prisma.naskah.update({
      where: { id },
      data: {
        status: StatusNaskah.diajukan,
      },
      include: {
        penulis: true,
        kategori: true,
        genre: true,
      },
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idPenulis,
        jenis: 'ajukan_naskah',
        aksi: 'Ajukan Naskah',
        entitas: 'Naskah',
        idEntitas: id,
        deskripsi: `Naskah "${naskah.judul}" diajukan untuk review. ${dto.catatan || ''}`,
      },
    });

    return {
      sukses: true,
      pesan: 'Naskah berhasil diajukan untuk review',
      data: naskahUpdated,
    };
  }

  /**
   * Terbitkan naskah
   * Role: admin, editor
   */
  async terbitkanNaskah(id: string, dto: TerbitkanNaskahDto, idPengguna: string) {
    const naskah = await this.prisma.naskah.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        judul: true,
        isbn: true,
      },
    });

    if (!naskah) {
      throw new NotFoundException('Naskah tidak ditemukan');
    }

    // Validasi status: hanya disetujui yang bisa diterbitkan
    if (naskah.status !== StatusNaskah.disetujui) {
      throw new BadRequestException('Naskah hanya bisa diterbitkan jika sudah disetujui');
    }

    // Validasi ISBN unique
    if (dto.isbn !== naskah.isbn) {
      const existingNaskah = await this.prisma.naskah.findUnique({
        where: { isbn: dto.isbn },
      });

      if (existingNaskah) {
        throw new BadRequestException('ISBN sudah digunakan oleh naskah lain');
      }
    }

    // Update naskah dengan ISBN dan status diterbitkan
    const naskahUpdated = await this.prisma.naskah.update({
      where: { id },
      data: {
        isbn: dto.isbn,
        status: StatusNaskah.diterbitkan,
        publik: true, // Auto set publik saat diterbitkan
      },
      include: {
        penulis: true,
        kategori: true,
        genre: true,
      },
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna,
        jenis: 'terbitkan_naskah',
        aksi: 'Terbitkan Naskah',
        entitas: 'Naskah',
        idEntitas: id,
        deskripsi: `Naskah "${naskah.judul}" berhasil diterbitkan dengan ISBN ${dto.isbn}. ${dto.catatan || ''}`,
      },
    });

    return {
      sukses: true,
      pesan: 'Naskah berhasil diterbitkan',
      data: naskahUpdated,
    };
  }

  /**
   * Hapus naskah
   * Role: penulis (owner), admin
   */
  async hapusNaskah(id: string, idPengguna: string, peranPengguna: string[]) {
    const naskah = await this.prisma.naskah.findUnique({
      where: { id },
      select: {
        id: true,
        idPenulis: true,
        judul: true,
        status: true,
      },
    });

    if (!naskah) {
      throw new NotFoundException('Naskah tidak ditemukan');
    }

    // Validasi akses
    const isPenulis = peranPengguna.includes('penulis');
    const isAdmin = peranPengguna.includes('admin');

    if (isPenulis && naskah.idPenulis !== idPengguna && !isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus naskah ini');
    }

    // Validasi: tidak bisa hapus jika sudah diterbitkan (kecuali admin)
    if (!isAdmin && naskah.status === StatusNaskah.diterbitkan) {
      throw new BadRequestException('Naskah yang sudah diterbitkan tidak bisa dihapus');
    }

    // Delete naskah (cascade akan menghapus revisi dan review)
    await this.prisma.naskah.delete({
      where: { id },
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna,
        jenis: 'hapus_naskah',
        aksi: 'Hapus Naskah',
        entitas: 'Naskah',
        idEntitas: id,
        deskripsi: `Naskah "${naskah.judul}" berhasil dihapus`,
      },
    });

    return {
      sukses: true,
      pesan: 'Naskah berhasil dihapus',
    };
  }

  /**
   * Ambil statistik naskah
   * Role: admin, penulis (untuk naskah sendiri)
   */
  async ambilStatistikNaskah(idPenulis?: string) {
    const where = idPenulis ? { idPenulis } : {};

    const [totalNaskah, totalPerStatus, totalPerKategori, naskahTerbaru] = await Promise.all([
      // Total naskah
      this.prisma.naskah.count({ where }),

      // Count by status
      this.prisma.naskah.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true,
        },
      }),

      // Count by kategori (top 5)
      this.prisma.naskah.groupBy({
        by: ['idKategori'],
        where,
        _count: {
          idKategori: true,
        },
        orderBy: {
          _count: {
            idKategori: 'desc',
          },
        },
        take: 5,
      }),

      // Naskah terbaru (5 latest)
      this.prisma.naskah.findMany({
        where,
        orderBy: { dibuatPada: 'desc' },
        take: 5,
        select: {
          id: true,
          judul: true,
          status: true,
          dibuatPada: true,
          urlSampul: true,
        },
      }),
    ]);

    // Transform status counts to object
    const perStatus = totalPerStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<StatusNaskah, number>,
    );

    // Get kategori names
    const kategoriIds = totalPerKategori.map((item) => item.idKategori);
    const kategoriData = await this.prisma.kategori.findMany({
      where: { id: { in: kategoriIds } },
      select: { id: true, nama: true },
    });

    const perKategori = totalPerKategori.map((item) => ({
      kategori: kategoriData.find((k) => k.id === item.idKategori)?.nama || 'Unknown',
      total: item._count.idKategori,
    }));

    return {
      sukses: true,
      data: {
        totalNaskah,
        perStatus,
        perKategori,
        naskahTerbaru,
      },
    };
  }
}
