import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  TugaskanReviewDto,
  PerbaruiReviewDto,
  TambahFeedbackDto,
  SubmitReviewDto,
  FilterReviewDto,
} from './dto';
import { StatusReview, StatusNaskah, Rekomendasi } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ambil semua review untuk naskah milik penulis
   * OPTIMIZED: Single query dengan JOIN - mengatasi N+1 query problem
   * Role: penulis
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

    // Ensure numeric values (convert from string if needed)
    const pageNum = typeof halaman === 'string' ? parseInt(halaman) : halaman;
    const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;

    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      naskah: {
        idPenulis: idPenulis, // Filter by penulis
      },
    };

    if (status) {
      where.status = status;
    }

    if (rekomendasi) {
      where.rekomendasi = rekomendasi;
    }

    // Single query dengan JOIN - JAUH LEBIH CEPAT!
    const [reviews, total] = await Promise.all([
      this.prisma.reviewNaskah.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [urutkan]: arah },
        include: {
          naskah: {
            select: {
              id: true,
              judul: true,
              subJudul: true,
              status: true,
              urlSampul: true,
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
                  urlAvatar: true,
                },
              },
            },
          },
          feedback: {
            orderBy: {
              dibuatPada: 'desc',
            },
            take: 5, // Latest 5 feedback
            select: {
              id: true,
              komentar: true,
              dibuatPada: true,
            },
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
        halaman: pageNum,
        limit: limitNum,
        totalHalaman: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Tugaskan review ke editor
   * Role: admin, editor (senior)
   */
  async tugaskanReview(dto: TugaskanReviewDto, idPenugasAdmin: string) {
    // Validasi naskah exists dan statusnya diajukan
    const naskah = await this.prisma.naskah.findUnique({
      where: { id: dto.idNaskah },
      select: {
        id: true,
        judul: true,
        status: true,
        idPenulis: true,
      },
    });

    if (!naskah) {
      throw new NotFoundException('Naskah tidak ditemukan');
    }

    if (naskah.status !== StatusNaskah.diajukan) {
      throw new BadRequestException('Naskah hanya bisa direview jika statusnya diajukan');
    }

    // Validasi editor exists dan memiliki role editor
    const editor = await this.prisma.pengguna.findUnique({
      where: { id: dto.idEditor },
      include: {
        peranPengguna: {
          where: {
            jenisPeran: 'editor',
            aktif: true,
          },
        },
      },
    });

    if (!editor || editor.peranPengguna.length === 0) {
      throw new BadRequestException('Editor tidak ditemukan atau tidak memiliki role editor');
    }

    // Cek apakah sudah ada review aktif untuk naskah ini
    const existingReview = await this.prisma.reviewNaskah.findFirst({
      where: {
        idNaskah: dto.idNaskah,
        status: {
          in: [StatusReview.ditugaskan, StatusReview.dalam_proses],
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('Naskah ini sudah memiliki review yang sedang berjalan');
    }

    // Buat review baru
    const review = await this.prisma.$transaction(async (prisma) => {
      // Create review
      const newReview = await prisma.reviewNaskah.create({
        data: {
          idNaskah: dto.idNaskah,
          idEditor: dto.idEditor,
          status: StatusReview.ditugaskan,
          catatan: dto.catatan,
        },
        include: {
          naskah: {
            select: {
              id: true,
              judul: true,
              status: true,
              penulis: {
                select: {
                  id: true,
                  email: true,
                  profilPengguna: true,
                },
              },
            },
          },
          editor: {
            select: {
              id: true,
              email: true,
              profilPengguna: true,
            },
          },
        },
      });

      // Update status naskah menjadi dalam_review
      await prisma.naskah.update({
        where: { id: dto.idNaskah },
        data: {
          status: StatusNaskah.dalam_review,
        },
      });

      return newReview;
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idPenugasAdmin,
        jenis: 'tugaskan_review',
        aksi: 'Tugaskan Review',
        entitas: 'ReviewNaskah',
        idEntitas: review.id,
        deskripsi: `Review naskah "${naskah.judul}" ditugaskan ke editor ${editor.email}`,
      },
    });

    return {
      sukses: true,
      pesan: 'Review berhasil ditugaskan ke editor',
      data: review,
    };
  }

  /**
   * Ambil semua review dengan pagination dan filter
   * Role: admin, editor
   */
  async ambilSemuaReview(filter: FilterReviewDto, idPengguna?: string) {
    const {
      halaman = 1,
      limit = 20,
      status,
      rekomendasi,
      idNaskah,
      idEditor,
      urutkan = 'ditugaskanPada',
      arah = 'desc',
    } = filter;

    // Konversi ke number (handle query string dari HTTP request)
    const halamanNum = typeof halaman === 'string' ? parseInt(halaman, 10) : Number(halaman);
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit);
    const skip = (halamanNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (rekomendasi) {
      where.rekomendasi = rekomendasi;
    }

    if (idNaskah) {
      where.idNaskah = idNaskah;
    }

    if (idEditor) {
      where.idEditor = idEditor;
    }

    // Execute query
    const [data, total] = await Promise.all([
      this.prisma.reviewNaskah.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [urutkan]: arah },
        include: {
          naskah: {
            select: {
              id: true,
              judul: true,
              subJudul: true,
              sinopsis: true,
              status: true,
              urlSampul: true,
              jumlahHalaman: true,
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
            orderBy: { dibuatPada: 'desc' },
          },
        },
      }),
      this.prisma.reviewNaskah.count({ where }),
    ]);

    return {
      sukses: true,
      pesan: 'Data review berhasil diambil',
      data,
      metadata: {
        total,
        halaman: halamanNum,
        limit: limitNum,
        totalHalaman: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Ambil detail review by ID
   */
  async ambilReviewById(id: string, idPengguna?: string, peranPengguna?: string[]) {
    const review = await this.prisma.reviewNaskah.findUnique({
      where: { id },
      include: {
        naskah: {
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
        },
        editor: {
          select: {
            id: true,
            email: true,
            profilPengguna: true,
          },
        },
        feedback: {
          orderBy: { dibuatPada: 'desc' },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review tidak ditemukan');
    }

    // Validasi akses: hanya editor yang ditugaskan, penulis naskah, atau admin
    const isEditor = review.idEditor === idPengguna;
    const isPenulis = review.naskah.idPenulis === idPengguna;
    const isAdmin = peranPengguna?.includes('admin');

    if (idPengguna && !isEditor && !isPenulis && !isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki akses ke review ini');
    }

    return {
      sukses: true,
      data: review,
    };
  }

  /**
   * Ambil review milik editor tertentu
   * Role: editor
   */
  async ambilReviewEditor(idEditor: string, filter: FilterReviewDto) {
    return this.ambilSemuaReview({ ...filter, idEditor }, idEditor);
  }

  /**
   * Perbarui review (update status, catatan)
   * Role: editor (owner), admin
   */
  async perbaruiReview(
    id: string,
    dto: PerbaruiReviewDto,
    idPengguna: string,
    peranPengguna: string[],
  ) {
    const review = await this.prisma.reviewNaskah.findUnique({
      where: { id },
      select: {
        id: true,
        idEditor: true,
        status: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review tidak ditemukan');
    }

    // Validasi akses
    const isEditor = review.idEditor === idPengguna;
    const isAdmin = peranPengguna.includes('admin');

    if (!isEditor && !isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah review ini');
    }

    // Validasi: tidak bisa update jika sudah selesai atau dibatalkan
    if (
      !isAdmin &&
      (review.status === StatusReview.selesai || review.status === StatusReview.dibatalkan)
    ) {
      throw new BadRequestException('Review yang sudah selesai atau dibatalkan tidak bisa diubah');
    }

    // Update review
    const updatedReview = await this.prisma.reviewNaskah.update({
      where: { id },
      data: {
        ...dto,
        dimulaiPada: dto.dimulaiPada ? new Date(dto.dimulaiPada) : undefined,
      },
      include: {
        naskah: true,
        editor: true,
      },
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna,
        jenis: 'perbarui_review',
        aksi: 'Perbarui Review',
        entitas: 'ReviewNaskah',
        idEntitas: id,
        deskripsi: `Review diperbarui: ${dto.status || 'update catatan'}`,
      },
    });

    return {
      sukses: true,
      pesan: 'Review berhasil diperbarui',
      data: updatedReview,
    };
  }

  /**
   * Tambah feedback ke review
   * Role: editor (owner)
   */
  async tambahFeedback(idReview: string, dto: TambahFeedbackDto, idEditor: string) {
    const review = await this.prisma.reviewNaskah.findUnique({
      where: { id: idReview },
      select: {
        id: true,
        idEditor: true,
        status: true,
        naskah: {
          select: {
            id: true,
            judul: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review tidak ditemukan');
    }

    // Validasi akses: hanya editor yang ditugaskan
    if (review.idEditor !== idEditor) {
      throw new ForbiddenException('Anda tidak memiliki akses ke review ini');
    }

    // Validasi status: hanya bisa tambah feedback jika dalam_proses atau ditugaskan
    if (review.status !== StatusReview.dalam_proses && review.status !== StatusReview.ditugaskan) {
      throw new BadRequestException('Feedback hanya bisa ditambahkan saat review dalam proses');
    }

    // Buat feedback
    const feedback = await this.prisma.$transaction(async (prisma) => {
      const newFeedback = await prisma.feedbackReview.create({
        data: {
          idReview,
          ...dto,
        },
      });

      // Auto update status ke dalam_proses jika masih ditugaskan
      if (review.status === StatusReview.ditugaskan) {
        await prisma.reviewNaskah.update({
          where: { id: idReview },
          data: {
            status: StatusReview.dalam_proses,
            dimulaiPada: new Date(),
          },
        });
      }

      // Update status naskah menjadi perlu_revisi ketika feedback dikirim
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

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idEditor,
        jenis: 'tambah_feedback',
        aksi: 'Tambah Feedback Review',
        entitas: 'FeedbackReview',
        idEntitas: feedback.id,
        deskripsi: `Feedback ditambahkan untuk review naskah "${review.naskah.judul}"`,
      },
    });

    return {
      sukses: true,
      pesan: 'Feedback berhasil ditambahkan',
      data: feedback,
    };
  }

  /**
   * Submit/finalisasi review dengan rekomendasi
   * Role: editor (owner)
   */
  async submitReview(id: string, dto: SubmitReviewDto, idEditor: string) {
    const review = await this.prisma.reviewNaskah.findUnique({
      where: { id },
      include: {
        naskah: {
          select: {
            id: true,
            judul: true,
            status: true,
          },
        },
        feedback: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review tidak ditemukan');
    }

    // Validasi akses
    if (review.idEditor !== idEditor) {
      throw new ForbiddenException('Anda tidak memiliki akses ke review ini');
    }

    // Validasi status
    if (review.status === StatusReview.selesai) {
      throw new BadRequestException('Review sudah selesai');
    }

    if (review.status === StatusReview.dibatalkan) {
      throw new BadRequestException('Review sudah dibatalkan');
    }

    // Validasi: harus ada minimal 1 feedback
    if (review.feedback.length === 0) {
      throw new BadRequestException('Review harus memiliki minimal 1 feedback sebelum disubmit');
    }

    // Update review dan naskah status based on rekomendasi
    const result = await this.prisma.$transaction(async (prisma) => {
      // Update review status
      const updatedReview = await prisma.reviewNaskah.update({
        where: { id },
        data: {
          status: StatusReview.selesai,
          rekomendasi: dto.rekomendasi,
          catatan: dto.catatan,
          selesaiPada: new Date(),
        },
        include: {
          naskah: true,
          editor: true,
          feedback: true,
        },
      });

      // Update naskah status based on rekomendasi
      let newNaskahStatus: StatusNaskah;
      switch (dto.rekomendasi) {
        case Rekomendasi.setujui:
          newNaskahStatus = StatusNaskah.disetujui;
          break;
        case Rekomendasi.revisi:
          newNaskahStatus = StatusNaskah.perlu_revisi;
          break;
        case Rekomendasi.tolak:
          newNaskahStatus = StatusNaskah.ditolak;
          break;
      }

      await prisma.naskah.update({
        where: { id: review.naskah.id },
        data: {
          status: newNaskahStatus,
        },
      });

      return updatedReview;
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna: idEditor,
        jenis: 'submit_review',
        aksi: 'Submit Review',
        entitas: 'ReviewNaskah',
        idEntitas: id,
        deskripsi: `Review naskah "${review.naskah.judul}" selesai dengan rekomendasi: ${dto.rekomendasi}`,
      },
    });

    return {
      sukses: true,
      pesan: 'Review berhasil disubmit',
      data: result,
    };
  }

  /**
   * Batalkan review
   * Role: admin, editor (owner)
   */
  async batalkanReview(id: string, alasan: string, idPengguna: string, peranPengguna: string[]) {
    const review = await this.prisma.reviewNaskah.findUnique({
      where: { id },
      include: {
        naskah: {
          select: {
            id: true,
            judul: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review tidak ditemukan');
    }

    // Validasi akses
    const isEditor = review.idEditor === idPengguna;
    const isAdmin = peranPengguna.includes('admin');

    if (!isEditor && !isAdmin) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk membatalkan review ini');
    }

    // Validasi status
    if (review.status === StatusReview.selesai) {
      throw new BadRequestException('Review yang sudah selesai tidak bisa dibatalkan');
    }

    if (review.status === StatusReview.dibatalkan) {
      throw new BadRequestException('Review sudah dibatalkan');
    }

    // Batalkan review dan kembalikan status naskah
    await this.prisma.$transaction(async (prisma) => {
      await prisma.reviewNaskah.update({
        where: { id },
        data: {
          status: StatusReview.dibatalkan,
          catatan: alasan,
        },
      });

      // Kembalikan status naskah ke diajukan
      await prisma.naskah.update({
        where: { id: review.naskah.id },
        data: {
          status: StatusNaskah.diajukan,
        },
      });
    });

    // Log activity
    await this.prisma.logAktivitas.create({
      data: {
        idPengguna,
        jenis: 'batal_review',
        aksi: 'Batalkan Review',
        entitas: 'ReviewNaskah',
        idEntitas: id,
        deskripsi: `Review naskah "${review.naskah.judul}" dibatalkan. Alasan: ${alasan}`,
      },
    });

    return {
      sukses: true,
      pesan: 'Review berhasil dibatalkan',
    };
  }

  /**
   * Ambil statistik review
   * Role: admin, editor (untuk statistik sendiri)
   */
  async ambilStatistikReview(idEditor?: string) {
    const where = idEditor ? { idEditor } : {};

    const [totalReview, totalPerStatus, totalPerRekomendasi, reviewTerbaru, avgReviewTime] =
      await Promise.all([
        // Total review
        this.prisma.reviewNaskah.count({ where }),

        // Count by status
        this.prisma.reviewNaskah.groupBy({
          by: ['status'],
          where,
          _count: {
            status: true,
          },
        }),

        // Count by rekomendasi (only completed reviews)
        this.prisma.reviewNaskah.groupBy({
          by: ['rekomendasi'],
          where: {
            ...where,
            status: StatusReview.selesai,
            rekomendasi: { not: null },
          },
          _count: {
            rekomendasi: true,
          },
        }),

        // Review terbaru (5 latest)
        this.prisma.reviewNaskah.findMany({
          where,
          orderBy: { ditugaskanPada: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            rekomendasi: true,
            ditugaskanPada: true,
            selesaiPada: true,
            naskah: {
              select: {
                judul: true,
              },
            },
          },
        }),

        // Average review completion time (in days)
        this.prisma.reviewNaskah.findMany({
          where: {
            ...where,
            status: StatusReview.selesai,
            selesaiPada: { not: undefined },
          },
          select: {
            ditugaskanPada: true,
            selesaiPada: true,
          },
        }),
      ]);

    // Transform status counts
    const perStatus = totalPerStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<StatusReview, number>,
    );

    // Transform rekomendasi counts
    const perRekomendasi = totalPerRekomendasi.reduce(
      (acc, item) => {
        if (item.rekomendasi) {
          acc[item.rekomendasi] = item._count.rekomendasi;
        }
        return acc;
      },
      {} as Record<Rekomendasi, number>,
    );

    // Calculate average review time in days
    let rataRataHariReview = 0;
    if (avgReviewTime.length > 0) {
      const totalDays = avgReviewTime.reduce((sum, review) => {
        const diffMs =
          new Date(review.selesaiPada!).getTime() - new Date(review.ditugaskanPada).getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      rataRataHariReview = Math.round(totalDays / avgReviewTime.length);
    }

    return {
      sukses: true,
      data: {
        totalReview,
        perStatus,
        perRekomendasi,
        rataRataHariReview,
        reviewTerbaru,
      },
    };
  }
}
