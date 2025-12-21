import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PercetakanService } from './percetakan.service';
import {
  BuatPesananDtoClass,
  PerbaruiPesananDtoClass,
  FilterPesananDtoClass,
  UpdateStatusDtoClass,
  BuatPengirimanDtoClass,
  KonfirmasiPesananDtoClass,
  FilterPesananDto,
} from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PeranGuard } from '@/modules/auth/guards/roles.guard';
import { Peran } from '@/modules/auth/decorators/peran.decorator';
import { PenggunaSaatIni } from '@/modules/auth/decorators/pengguna-saat-ini.decorator';
import { ValidasiZodPipe } from '@/common/pipes/validasi-zod.pipe';
import {
  BuatPesananSchema,
  PerbaruiPesananSchema,
  FilterPesananSchema,
  UpdateStatusSchema,
  BuatPengirimanSchema,
  KonfirmasiPesananSchema,
} from './dto';

/**
 * Controller untuk mengelola pesanan cetak buku
 * Endpoints untuk create, read, update, konfirmasi, dan tracking pesanan
 */
@ApiTags('percetakan')
@ApiBearerAuth()
@Controller('percetakan')
@UseGuards(JwtAuthGuard, PeranGuard)
export class PercetakanController {
  constructor(private readonly percetakanService: PercetakanService) {}

  /**
   * Buat pesanan cetak baru
   * Hanya untuk penulis yang memiliki naskah dengan status 'diterbitkan'
   */
  @Post()
  @Peran('penulis')
  @ApiOperation({ summary: 'Buat pesanan cetak baru' })
  @ApiResponse({
    status: 201,
    description: 'Pesanan cetak berhasil dibuat',
    schema: {
      example: {
        sukses: true,
        pesan: 'Pesanan cetak berhasil dibuat',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          nomorPesanan: 'PO-20240129-1234',
          jumlah: 100,
          hargaTotal: '15000000',
          status: 'tertunda',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validasi gagal atau naskah tidak diterbitkan' })
  @ApiResponse({ status: 404, description: 'Naskah tidak ditemukan' })
  async buatPesanan(
    @PenggunaSaatIni('id') idPemesan: string,
    @Body(new ValidasiZodPipe(BuatPesananSchema)) dto: BuatPesananDtoClass,
  ) {
    return this.percetakanService.buatPesanan(idPemesan, dto);
  }

  /**
   * Ambil daftar pesanan dengan filter
   * Admin: lihat semua, Percetakan: lihat yang ditugaskan, Penulis: lihat milik sendiri
   */
  @Get()
  @Peran('penulis', 'percetakan', 'admin')
  @ApiOperation({ summary: 'Ambil daftar pesanan dengan filter dan pagination' })
  @ApiQuery({ name: 'halaman', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'tertunda',
      'diterima',
      'dalam_produksi',
      'kontrol_kualitas',
      'siap',
      'dikirim',
      'terkirim',
      'dibatalkan',
    ],
  })
  @ApiQuery({ name: 'idPemesan', required: false, type: String })
  @ApiQuery({ name: 'idNaskah', required: false, type: String })
  @ApiQuery({ name: 'nomorPesanan', required: false, type: String })
  @ApiQuery({ name: 'tanggalMulai', required: false, type: String })
  @ApiQuery({ name: 'tanggalSelesai', required: false, type: String })
  @ApiQuery({ name: 'cari', required: false, type: String })
  @ApiQuery({
    name: 'urutkan',
    required: false,
    enum: ['tanggalPesan', 'hargaTotal', 'jumlah', 'status'],
  })
  @ApiQuery({ name: 'arah', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Daftar pesanan berhasil diambil',
  })
  async ambilSemuaPesanan(
    @Query(new ValidasiZodPipe(FilterPesananSchema)) filter: FilterPesananDto,
    @PenggunaSaatIni('id') idPengguna: string,
    @PenggunaSaatIni('peran') peran: string,
  ) {
    return this.percetakanService.ambilSemuaPesanan(filter, idPengguna, peran);
  }

  /**
   * Ambil pesanan milik penulis yang login
   * Shortcut untuk filter pesanan penulis
   */
  @Get('penulis/saya')
  @Peran('penulis')
  @ApiOperation({ summary: 'Ambil pesanan milik penulis yang login' })
  @ApiQuery({ name: 'halaman', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'tertunda',
      'diterima',
      'dalam_produksi',
      'kontrol_kualitas',
      'siap',
      'dikirim',
      'terkirim',
      'dibatalkan',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar pesanan penulis berhasil diambil',
  })
  async ambilPesananPenulis(
    @PenggunaSaatIni('id') idPenulis: string,
    @Query(new ValidasiZodPipe(FilterPesananSchema)) filter: FilterPesananDto,
  ) {
    return this.percetakanService.ambilPesananPenulis(idPenulis, filter);
  }

  /**
   * Ambil statistik pesanan
   * Admin: semua, Percetakan: yang ditugaskan, Penulis: milik sendiri
   */
  @Get('statistik')
  @Peran('penulis', 'percetakan', 'admin')
  @ApiOperation({ summary: 'Ambil statistik pesanan' })
  @ApiResponse({
    status: 200,
    description: 'Statistik pesanan berhasil diambil',
    schema: {
      example: {
        sukses: true,
        data: {
          totalPesanan: 150,
          pesananAktif: 45,
          pesananSelesai: 90,
          totalRevenue: '225000000',
          statusBreakdown: {
            tertunda: 10,
            diterima: 15,
            dalam_produksi: 12,
            kontrol_kualitas: 5,
            siap: 3,
            dikirim: 8,
            terkirim: 90,
            dibatalkan: 7,
          },
        },
      },
    },
  })
  async ambilStatistikPesanan(
    @PenggunaSaatIni('id') idPengguna: string,
    @PenggunaSaatIni('peran') peran: string,
  ) {
    return this.percetakanService.ambilStatistikPesanan(idPengguna, peran);
  }

  /**
   * Ambil detail pesanan by ID
   */
  @Get(':id')
  @Peran('penulis', 'percetakan', 'admin')
  @ApiOperation({ summary: 'Ambil detail pesanan by ID' })
  @ApiParam({ name: 'id', description: 'ID pesanan' })
  @ApiResponse({
    status: 200,
    description: 'Detail pesanan berhasil diambil',
  })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Tidak memiliki akses ke pesanan ini' })
  async ambilPesananById(
    @Param('id') id: string,
    @PenggunaSaatIni('id') idPengguna: string,
    @PenggunaSaatIni('peran') peran: string,
  ) {
    return this.percetakanService.ambilPesananById(id, idPengguna, peran);
  }

  /**
   * Perbarui detail pesanan
   * Hanya untuk status 'tertunda'
   */
  @Put(':id')
  @Peran('penulis')
  @ApiOperation({ summary: 'Perbarui detail pesanan (hanya status tertunda)' })
  @ApiParam({ name: 'id', description: 'ID pesanan' })
  @ApiResponse({
    status: 200,
    description: 'Pesanan berhasil diperbarui',
  })
  @ApiResponse({ status: 400, description: 'Status pesanan tidak tertunda' })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Tidak memiliki akses' })
  async perbaruiPesanan(
    @Param('id') id: string,
    @PenggunaSaatIni('id') idPemesan: string,
    @Body(new ValidasiZodPipe(PerbaruiPesananSchema)) dto: PerbaruiPesananDtoClass,
  ) {
    return this.percetakanService.perbaruiPesanan(id, idPemesan, dto);
  }

  /**
   * Konfirmasi pesanan oleh percetakan
   * Status: tertunda → diterima/dibatalkan
   */
  @Put(':id/konfirmasi')
  @Peran('percetakan')
  @ApiOperation({ summary: 'Konfirmasi atau tolak pesanan oleh percetakan' })
  @ApiParam({ name: 'id', description: 'ID pesanan' })
  @ApiResponse({
    status: 200,
    description: 'Pesanan berhasil dikonfirmasi',
  })
  @ApiResponse({ status: 400, description: 'Status pesanan tidak tertunda' })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  async konfirmasiPesanan(
    @Param('id') id: string,
    @PenggunaSaatIni('id') idPercetakan: string,
    @Body(new ValidasiZodPipe(KonfirmasiPesananSchema)) dto: KonfirmasiPesananDtoClass,
  ) {
    return this.percetakanService.konfirmasiPesanan(id, idPercetakan, dto);
  }

  /**
   * Update status pesanan
   * Flow: diterima → dalam_produksi → kontrol_kualitas → siap → dikirim → terkirim
   */
  @Put(':id/status')
  @Peran('percetakan')
  @ApiOperation({ summary: 'Update status pesanan (untuk tracking produksi)' })
  @ApiParam({ name: 'id', description: 'ID pesanan' })
  @ApiResponse({
    status: 200,
    description: 'Status pesanan berhasil diperbarui',
  })
  @ApiResponse({ status: 400, description: 'Transisi status tidak valid' })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Tidak memiliki akses' })
  async updateStatusPesanan(
    @Param('id') id: string,
    @PenggunaSaatIni('id') idPercetakan: string,
    @Body(new ValidasiZodPipe(UpdateStatusSchema)) dto: UpdateStatusDtoClass,
  ) {
    return this.percetakanService.updateStatusPesanan(id, idPercetakan, dto);
  }

  /**
   * Batalkan pesanan
   * Hanya untuk status 'tertunda'
   */
  @Put(':id/batal')
  @Peran('penulis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batalkan pesanan (hanya status tertunda)' })
  @ApiParam({ name: 'id', description: 'ID pesanan' })
  @ApiResponse({
    status: 200,
    description: 'Pesanan berhasil dibatalkan',
  })
  @ApiResponse({ status: 400, description: 'Status pesanan tidak tertunda' })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Tidak memiliki akses' })
  async batalkanPesanan(
    @Param('id') id: string,
    @PenggunaSaatIni('id') idPemesan: string,
    @Body('alasan') alasan?: string,
  ) {
    return this.percetakanService.batalkanPesanan(id, idPemesan, alasan);
  }

  /**
   * Buat data pengiriman untuk pesanan
   * Status harus 'siap' atau 'dikirim'
   */
  @Post(':id/pengiriman')
  @Peran('percetakan')
  @ApiOperation({ summary: 'Buat data pengiriman untuk pesanan' })
  @ApiParam({ name: 'id', description: 'ID pesanan' })
  @ApiResponse({
    status: 201,
    description: 'Data pengiriman berhasil dibuat',
  })
  @ApiResponse({ status: 400, description: 'Status pesanan tidak valid atau pengiriman sudah ada' })
  @ApiResponse({ status: 404, description: 'Pesanan tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Tidak memiliki akses' })
  async buatPengiriman(
    @Param('id') id: string,
    @PenggunaSaatIni('id') idPercetakan: string,
    @Body(new ValidasiZodPipe(BuatPengirimanSchema)) dto: BuatPengirimanDtoClass,
  ) {
    return this.percetakanService.buatPengiriman(id, idPercetakan, dto);
  }
}
