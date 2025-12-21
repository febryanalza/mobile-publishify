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
import { GenreService } from './genre.service';
import {
  BuatGenreDto,
  BuatGenreDtoClass,
  PerbaruiGenreDto,
  PerbaruiGenreDtoClass,
  BuatGenreSchema,
  PerbaruiGenreSchema,
} from './dto';
import { ValidasiZodPipe } from '@/common/pipes/validasi-zod.pipe';
import { ParseUUIDPipe } from '@/common/pipes/parse-uuid.pipe';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PeranGuard } from '@/modules/auth/guards/roles.guard';
import { Peran } from '@/modules/auth/decorators/peran.decorator';
import { Public } from '@/common/decorators/public.decorator';
// import { CacheInterceptor, CacheKey, CacheTTL } from '@/common/cache'; // DISABLED: Redis

@ApiTags('Genre')
@Controller('genre')
// @UseInterceptors(CacheInterceptor) // DISABLED: Redis
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  /**
   * Ambil semua genre dengan pagination
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ambil daftar genre',
    description: 'Mendapatkan daftar genre dengan pagination dan filter',
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
    description: 'Daftar genre berhasil diambil',
    schema: {
      example: {
        sukses: true,
        data: [
          {
            id: 'uuid',
            nama: 'Romance',
            slug: 'romance',
            deskripsi: 'Genre untuk cerita romantis',
            aktif: true,
            _count: {
              naskah: 25,
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
  async ambilSemuaGenre(
    @Query('halaman') halaman: number = 1,
    @Query('limit') limit: number = 20,
    @Query('aktif') aktif?: string | boolean,
  ) {
    // Convert aktif to boolean if provided
    let aktifFilter: boolean | undefined = undefined;
    if (aktif !== undefined) {
      aktifFilter = aktif === true || aktif === 'true';
    }

    return this.genreService.ambilSemuaGenre(Number(halaman), Number(limit), aktifFilter);
  }

  /**
   * Ambil hanya genre aktif (untuk dropdown)
   */
  @Public()
  @Get('aktif')
  @HttpCode(HttpStatus.OK)
  // @CacheKey('genre:aktif') // DISABLED: Redis
  // @CacheTTL(3600) // Cache 1 jam untuk data dropdown yang jarang berubah - DISABLED: Redis
  @ApiOperation({
    summary: 'Ambil genre aktif',
    description: 'Mendapatkan semua genre dengan status aktif (untuk dropdown/select)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar genre aktif berhasil diambil',
    schema: {
      example: {
        sukses: true,
        data: [
          {
            id: 'uuid',
            nama: 'Romance',
            slug: 'romance',
            deskripsi: 'Genre untuk cerita romantis',
          },
        ],
        total: 15,
      },
    },
  })
  async ambilGenreAktif() {
    return this.genreService.ambilGenreAktif();
  }

  /**
   * Ambil genre by ID
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ambil detail genre',
    description: 'Mendapatkan detail genre berdasarkan ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID genre (UUID)',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail genre berhasil diambil',
  })
  @ApiResponse({
    status: 404,
    description: 'Genre tidak ditemukan',
  })
  async ambilGenreById(@Param('id', ParseUUIDPipe) id: string) {
    return this.genreService.ambilGenreById(id);
  }

  /**
   * Buat genre baru
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PeranGuard)
  @Peran('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat genre baru',
    description: 'Membuat genre baru (Admin only)',
  })
  @ApiBody({ type: BuatGenreDtoClass })
  @ApiResponse({
    status: 201,
    description: 'Genre berhasil dibuat',
    schema: {
      example: {
        sukses: true,
        pesan: 'Genre berhasil dibuat',
        data: {
          id: 'uuid',
          nama: 'Romance',
          slug: 'romance',
          deskripsi: 'Genre untuk cerita romantis',
          aktif: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Nama atau slug sudah digunakan',
  })
  async buatGenre(@Body(new ValidasiZodPipe(BuatGenreSchema)) dto: BuatGenreDto) {
    return this.genreService.buatGenre(dto);
  }

  /**
   * Perbarui genre
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PeranGuard)
  @Peran('admin')
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perbarui genre',
    description: 'Memperbarui data genre (Admin only)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID genre (UUID)',
    example: 'uuid',
  })
  @ApiBody({ type: PerbaruiGenreDtoClass })
  @ApiResponse({
    status: 200,
    description: 'Genre berhasil diperbarui',
  })
  @ApiResponse({
    status: 404,
    description: 'Genre tidak ditemukan',
  })
  async perbaruiGenre(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidasiZodPipe(PerbaruiGenreSchema)) dto: PerbaruiGenreDto,
  ) {
    return this.genreService.perbaruiGenre(id, dto);
  }

  /**
   * Hapus genre
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PeranGuard)
  @Peran('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hapus genre',
    description: 'Menghapus genre (Admin only). Genre tidak dapat dihapus jika masih digunakan.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID genre (UUID)',
    example: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Genre berhasil dihapus',
  })
  @ApiResponse({
    status: 409,
    description: 'Genre masih digunakan oleh naskah',
  })
  @ApiResponse({
    status: 404,
    description: 'Genre tidak ditemukan',
  })
  async hapusGenre(@Param('id', ParseUUIDPipe) id: string) {
    return this.genreService.hapusGenre(id);
  }
}
