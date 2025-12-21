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
  // UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { KategoriService } from './kategori.service';
import {
  BuatKategoriDto,
  BuatKategoriDtoClass,
  PerbaruiKategoriDto,
  PerbaruiKategoriDtoClass,
  BuatKategoriSchema,
  PerbaruiKategoriSchema,
} from './dto';
import { ValidasiZodPipe } from '@/common/pipes/validasi-zod.pipe';
import { ParseUUIDPipe } from '@/common/pipes/parse-uuid.pipe';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PeranGuard } from '@/modules/auth/guards/roles.guard';
import { Peran } from '@/modules/auth/decorators/peran.decorator';
import { Public } from '@/common/decorators/public.decorator';
// import { CacheInterceptor, CacheKey, CacheTTL } from '@/common/cache'; // DISABLED: Redis

@ApiTags('Kategori')
@Controller('kategori')
// @UseInterceptors(CacheInterceptor) // DISABLED: Redis
export class KategoriController {
  constructor(private readonly kategoriService: KategoriService) {}

  /**
   * Ambil semua kategori dengan pagination
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ambil daftar kategori',
    description: 'Mendapatkan daftar kategori dengan pagination dan filter',
  })
  @ApiQuery({
    name: 'halaman',
    required: false,
    type: Number,
    example: 1,
    description: 'Nomor halaman',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Jumlah data per halaman',
  })
  @ApiQuery({
    name: 'aktif',
    required: false,
    type: Boolean,
    example: true,
    description: 'Filter berdasarkan status aktif',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar kategori berhasil diambil',
    schema: {
      example: {
        sukses: true,
        data: [
          {
            id: 'uuid',
            nama: 'Novel Fiksi',
            slug: 'novel-fiksi',
            deskripsi: 'Kategori untuk novel fiksi',
            idInduk: null,
            aktif: true,
            induk: null,
            subKategori: [],
            _count: {
              naskah: 10,
              subKategori: 3,
            },
          },
        ],
        metadata: {
          total: 50,
          halaman: 1,
          limit: 20,
          totalHalaman: 3,
        },
      },
    },
  })
  async ambilSemuaKategori(
    @Query('halaman') halaman: number = 1,
    @Query('limit') limit: number = 20,
    @Query('aktif') aktif?: string | boolean,
  ) {
    // Convert aktif to boolean if provided
    let aktifFilter: boolean | undefined = undefined;
    if (aktif !== undefined) {
      aktifFilter = aktif === true || aktif === 'true';
    }

    return this.kategoriService.ambilSemuaKategori(Number(halaman), Number(limit), aktifFilter);
  }

  /**
   * Ambil hanya kategori aktif (untuk dropdown)
   */
  @Public()
  @Get('aktif')
  @HttpCode(HttpStatus.OK)
  // @CacheKey('kategori:aktif') // DISABLED: Redis
  // @CacheTTL(3600) // Cache 1 jam untuk data dropdown yang jarang berubah - DISABLED: Redis
  @ApiOperation({
    summary: 'Ambil kategori aktif',
    description: 'Mendapatkan semua kategori dengan status aktif (untuk dropdown/select)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar kategori aktif berhasil diambil',
    schema: {
      example: {
        sukses: true,
        data: [
          {
            id: 'uuid',
            nama: 'Novel Fiksi',
            slug: 'novel-fiksi',
            deskripsi: 'Kategori untuk novel fiksi',
            idInduk: null,
            induk: null,
          },
        ],
        total: 15,
      },
    },
  })
  async ambilKategoriAktif() {
    return this.kategoriService.ambilKategoriAktif();
  }

  /**
   * Ambil kategori by ID
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ambil detail kategori',
    description: 'Mendapatkan detail kategori berdasarkan ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID kategori (UUID)',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail kategori berhasil diambil',
  })
  @ApiResponse({
    status: 404,
    description: 'Kategori tidak ditemukan',
  })
  async ambilKategoriById(@Param('id', ParseUUIDPipe) id: string) {
    return this.kategoriService.ambilKategoriById(id);
  }

  /**
   * Buat kategori baru
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PeranGuard)
  @Peran('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat kategori baru',
    description: 'Membuat kategori baru (Admin only)',
  })
  @ApiBody({ type: BuatKategoriDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Kategori berhasil dibuat',
    schema: {
      example: {
        sukses: true,
        pesan: 'Kategori berhasil dibuat',
        data: {
          id: 'uuid',
          nama: 'Novel Fiksi',
          slug: 'novel-fiksi',
          deskripsi: 'Kategori untuk novel fiksi',
          idInduk: null,
          aktif: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Slug sudah digunakan',
  })
  async buatKategori(@Body(new ValidasiZodPipe(BuatKategoriSchema)) dto: BuatKategoriDto) {
    return this.kategoriService.buatKategori(dto);
  }

  /**
   * Perbarui kategori
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PeranGuard)
  @Peran('admin')
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perbarui kategori',
    description: 'Memperbarui data kategori (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID kategori (UUID)',
    example: 'uuid',
  })
  @ApiBody({ type: PerbaruiKategoriDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Kategori berhasil diperbarui',
  })
  @ApiResponse({
    status: 404,
    description: 'Kategori tidak ditemukan',
  })
  async perbaruiKategori(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidasiZodPipe(PerbaruiKategoriSchema)) dto: PerbaruiKategoriDto,
  ) {
    return this.kategoriService.perbaruiKategori(id, dto);
  }

  /**
   * Hapus kategori
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PeranGuard)
  @Peran('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hapus kategori',
    description:
      'Menghapus kategori (Admin only). Kategori tidak dapat dihapus jika masih digunakan.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID kategori (UUID)',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Kategori berhasil dihapus',
  })
  @ApiResponse({
    status: 400,
    description: 'Kategori masih digunakan oleh naskah atau memiliki sub-kategori',
  })
  @ApiResponse({
    status: 404,
    description: 'Kategori tidak ditemukan',
  })
  async hapusKategori(@Param('id', ParseUUIDPipe) id: string) {
    return this.kategoriService.hapusKategori(id);
  }
}
