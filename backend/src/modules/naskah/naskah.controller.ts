/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NaskahService } from './naskah.service';
import {
  BuatNaskahDto,
  BuatNaskahDtoClass,
  PerbaruiNaskahDto,
  PerbaruiNaskahDtoClass,
  FilterNaskahDto,
  FilterNaskahDtoClass,
  AjukanNaskahDto,
  AjukanNaskahDtoClass,
  TerbitkanNaskahDto,
  TerbitkanNaskahDtoClass,
} from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PeranGuard } from '@/modules/auth/guards/roles.guard';
import { Peran } from '@/modules/auth/decorators/peran.decorator';
import { PenggunaSaatIni } from '@/modules/auth/decorators/pengguna-saat-ini.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { OptionalAuth } from '@/common/decorators/optional-auth.decorator';
import { ValidasiZodPipe } from '@/common/pipes/validasi-zod.pipe';
import {
  BuatNaskahSchema,
  PerbaruiNaskahSchema,
  FilterNaskahSchema,
  AjukanNaskahSchema,
  TerbitkanNaskahSchema,
} from './dto';
// import { CacheInterceptor, CacheTTL } from '@/common/cache'; // DISABLED: Redis

@ApiTags('naskah')
@Controller('naskah')
@UseGuards(JwtAuthGuard, PeranGuard)
// @UseInterceptors(CacheInterceptor) // DISABLED: Redis
export class NaskahController {
  constructor(private readonly naskahService: NaskahService) {}

  /**
   * GET /naskah - Ambil daftar naskah (PUBLIC untuk yang diterbitkan)
   */
  @Get()
  @Public()
  // @CacheTTL(300) // Cache 5 menit untuk list naskah - DISABLED: Redis
  @ApiOperation({
    summary: 'Ambil daftar naskah',
    description:
      'Mengambil daftar naskah dengan pagination dan filter. Public dapat akses naskah yang diterbitkan. Authenticated user dapat filter lebih lanjut.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar naskah berhasil diambil',
  })
  @ApiQuery({ type: FilterNaskahDtoClass })
  async ambilSemuaNaskah(
    @Query(new ValidasiZodPipe(FilterNaskahSchema)) filter: FilterNaskahDto,
    @PenggunaSaatIni('id') idPengguna?: string,
  ) {
    return await this.naskahService.ambilSemuaNaskah(filter, idPengguna);
  }

  /**
   * GET /naskah/cursor - Ambil daftar naskah dengan cursor pagination
   * Lebih efisien untuk dataset besar dan deep pagination
   */
  @Get('cursor')
  @Public()
  // @CacheTTL(180) // Cache 3 menit untuk cursor pagination - DISABLED: Redis
  @ApiOperation({
    summary: 'Ambil daftar naskah dengan cursor pagination',
    description:
      'Cursor-based pagination lebih efisien untuk dataset besar. Gunakan nextCursor dari response sebelumnya untuk page berikutnya.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar naskah berhasil diambil dengan cursor pagination',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Cursor dari item terakhir (ID)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Jumlah items (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'draft',
      'diajukan',
      'dalam_review',
      'perlu_revisi',
      'disetujui',
      'ditolak',
      'diterbitkan',
    ],
  })
  @ApiQuery({ name: 'idKategori', required: false, type: String })
  async ambilNaskahDenganCursor(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: any,
    @Query('idKategori') idKategori?: string,
    @PenggunaSaatIni('id') idPengguna?: string,
  ) {
    return await this.naskahService.ambilNaskahDenganCursor(
      cursor,
      limit ? Number(limit) : 20,
      status,
      idKategori,
      idPengguna,
    );
  }

  /**
   * GET /naskah/statistik - Ambil statistik naskah
   * Role: admin, atau penulis (naskah sendiri)
   */
  @Get('statistik')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ambil statistik naskah',
    description:
      'Mengambil statistik naskah seperti total, per status, per kategori. Admin dapat lihat semua, penulis hanya naskah sendiri.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistik naskah berhasil diambil',
  })
  async ambilStatistikNaskah(
    @PenggunaSaatIni('id') idPengguna: string,
    @PenggunaSaatIni('peran') peranPengguna: string[],
  ) {
    // Admin dapat lihat semua, penulis hanya milik sendiri
    const idPenulis =
      peranPengguna.includes('admin') || peranPengguna.includes('editor') ? undefined : idPengguna;

    return await this.naskahService.ambilStatistikNaskah(idPenulis);
  }

  /**
   * GET /naskah/penulis/saya - Ambil naskah penulis sendiri
   * Role: penulis
   */
  @Get('penulis/saya')
  @ApiBearerAuth()
  @Peran('penulis')
  @ApiOperation({
    summary: 'Ambil naskah milik penulis sendiri',
    description: 'Penulis mengambil daftar naskah mereka sendiri dengan pagination dan filter.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar naskah penulis berhasil diambil',
  })
  @ApiQuery({ type: FilterNaskahDtoClass })
  async ambilNaskahPenulis(
    @PenggunaSaatIni('id') idPenulis: string,
    @Query(new ValidasiZodPipe(FilterNaskahSchema)) filter: FilterNaskahDto,
  ) {
    return await this.naskahService.ambilNaskahPenulis(idPenulis, filter);
  }

  /**
   * GET /naskah/:id - Ambil detail naskah
   */
  @Get(':id')
  @OptionalAuth()
  // @CacheTTL(600) // Cache 10 menit untuk detail naskah - DISABLED: Redis
  @ApiOperation({
    summary: 'Ambil detail naskah',
    description:
      'Mengambil detail lengkap naskah berdasarkan ID. Public dapat akses naskah publik, authenticated user dapat akses naskah sendiri meskipun private.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail naskah berhasil diambil',
  })
  @ApiResponse({
    status: 404,
    description: 'Naskah tidak ditemukan',
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses ke naskah ini',
  })
  async ambilNaskahById(
    @Param('id', ParseUUIDPipe) id: string,
    @PenggunaSaatIni('id') idPengguna?: string,
  ) {
    return await this.naskahService.ambilNaskahById(id, idPengguna);
  }

  /**
   * POST /naskah - Buat naskah baru
   * Role: penulis
   */
  @Post()
  @ApiBearerAuth()
  @Peran('penulis')
  @ApiOperation({
    summary: 'Buat naskah baru',
    description: 'Penulis membuat naskah baru dengan status draft.',
  })
  @ApiResponse({
    status: 201,
    description: 'Naskah berhasil dibuat',
  })
  @ApiResponse({
    status: 400,
    description: 'Data tidak valid',
  })
  async buatNaskah(
    @PenggunaSaatIni('id') idPenulis: string,
    @Body(new ValidasiZodPipe(BuatNaskahSchema)) dto: BuatNaskahDto,
  ) {
    return await this.naskahService.buatNaskah(idPenulis, dto);
  }

  /**
   * PUT /naskah/:id - Perbarui naskah
   * Role: penulis (owner), admin
   */
  @Put(':id')
  @ApiBearerAuth()
  @Peran('penulis', 'admin')
  @ApiOperation({
    summary: 'Perbarui naskah',
    description:
      'Penulis memperbarui naskah sendiri (hanya saat draft/perlu_revisi). Admin dapat update kapan saja.',
  })
  @ApiResponse({
    status: 200,
    description: 'Naskah berhasil diperbarui',
  })
  @ApiResponse({
    status: 404,
    description: 'Naskah tidak ditemukan',
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses untuk mengubah naskah ini',
  })
  @ApiResponse({
    status: 400,
    description: 'Naskah hanya bisa diubah saat status draft atau perlu revisi',
  })
  async perbaruiNaskah(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidasiZodPipe(PerbaruiNaskahSchema)) dto: PerbaruiNaskahDto,
    @PenggunaSaatIni('id') idPengguna: string,
    @PenggunaSaatIni('peran') peranPengguna: string[],
  ) {
    return await this.naskahService.perbaruiNaskah(id, dto, idPengguna, peranPengguna);
  }

  /**
   * PUT /naskah/:id/ajukan - Ajukan naskah untuk review
   * Role: penulis
   */
  @Put(':id/ajukan')
  @ApiBearerAuth()
  @Peran('penulis')
  @ApiOperation({
    summary: 'Ajukan naskah untuk review',
    description:
      'Penulis mengajukan naskah untuk direview editor. Status berubah dari draft/perlu_revisi menjadi diajukan.',
  })
  @ApiResponse({
    status: 200,
    description: 'Naskah berhasil diajukan untuk review',
  })
  @ApiResponse({
    status: 404,
    description: 'Naskah tidak ditemukan',
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses ke naskah ini',
  })
  @ApiResponse({
    status: 400,
    description: 'Naskah hanya bisa diajukan saat status draft atau perlu revisi',
  })
  async ajukanNaskah(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidasiZodPipe(AjukanNaskahSchema)) dto: AjukanNaskahDto,
    @PenggunaSaatIni('id') idPenulis: string,
  ) {
    return await this.naskahService.ajukanNaskah(id, dto, idPenulis);
  }

  /**
   * PUT /naskah/:id/terbitkan - Terbitkan naskah
   * Role: admin, editor
   */
  @Put(':id/terbitkan')
  @ApiBearerAuth()
  @Peran('admin', 'editor')
  @ApiOperation({
    summary: 'Terbitkan naskah',
    description:
      'Admin/Editor menerbitkan naskah yang sudah disetujui. Memerlukan ISBN dan akan set status menjadi diterbitkan.',
  })
  @ApiResponse({
    status: 200,
    description: 'Naskah berhasil diterbitkan',
  })
  @ApiResponse({
    status: 404,
    description: 'Naskah tidak ditemukan',
  })
  @ApiResponse({
    status: 400,
    description: 'Naskah hanya bisa diterbitkan jika sudah disetujui atau ISBN sudah digunakan',
  })
  async terbitkanNaskah(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidasiZodPipe(TerbitkanNaskahSchema)) dto: TerbitkanNaskahDto,
    @PenggunaSaatIni('id') idPengguna: string,
  ) {
    return await this.naskahService.terbitkanNaskah(id, dto, idPengguna);
  }

  /**
   * DELETE /naskah/:id - Hapus naskah
   * Role: penulis (owner), admin
   */
  @Delete(':id')
  @ApiBearerAuth()
  @Peran('penulis', 'admin')
  @ApiOperation({
    summary: 'Hapus naskah',
    description:
      'Penulis menghapus naskah sendiri (tidak bisa jika sudah diterbitkan kecuali admin). Admin dapat hapus naskah kapan saja.',
  })
  @ApiResponse({
    status: 200,
    description: 'Naskah berhasil dihapus',
  })
  @ApiResponse({
    status: 404,
    description: 'Naskah tidak ditemukan',
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses untuk menghapus naskah ini',
  })
  @ApiResponse({
    status: 400,
    description: 'Naskah yang sudah diterbitkan tidak bisa dihapus',
  })
  async hapusNaskah(
    @Param('id', ParseUUIDPipe) id: string,
    @PenggunaSaatIni('id') idPengguna: string,
    @PenggunaSaatIni('peran') peranPengguna: string[],
  ) {
    return await this.naskahService.hapusNaskah(id, idPengguna, peranPengguna);
  }
}
