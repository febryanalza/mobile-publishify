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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import {
  TugaskanReviewDto,
  PerbaruiReviewDto,
  TambahFeedbackDto,
  SubmitReviewDto,
  FilterReviewDto,
} from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PeranGuard } from '@/modules/auth/guards/roles.guard';
import { Peran } from '@/modules/auth/decorators/peran.decorator';
import { PenggunaSaatIni } from '@/modules/auth/decorators/pengguna-saat-ini.decorator';
import { StatusReview, Rekomendasi } from '@prisma/client';

@ApiTags('review')
@ApiBearerAuth()
@Controller('review')
@UseGuards(JwtAuthGuard, PeranGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * POST /review/tugaskan - Tugaskan review ke editor
   * Role: admin, editor
   */
  @Post('tugaskan')
  @Peran('admin', 'editor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tugaskan review naskah ke editor',
    description:
      'Admin atau editor senior dapat menugaskan review naskah kepada editor. Naskah harus berstatus diajukan.',
  })
  @ApiResponse({
    status: 201,
    description: 'Review berhasil ditugaskan',
  })
  @ApiResponse({
    status: 400,
    description: 'Naskah tidak dalam status yang valid atau sudah ada review aktif',
  })
  @ApiResponse({
    status: 404,
    description: 'Naskah atau editor tidak ditemukan',
  })
  async tugaskanReview(
    @Body() dto: TugaskanReviewDto,
    @PenggunaSaatIni('id') idPenugasAdmin: string,
  ) {
    return this.reviewService.tugaskanReview(dto, idPenugasAdmin);
  }

  /**
   * GET /review - Ambil semua review dengan filter
   * Role: admin, editor
   */
  @Get()
  @Peran('admin', 'editor')
  @ApiOperation({
    summary: 'Ambil daftar review dengan pagination dan filter',
    description:
      'Admin dapat melihat semua review, editor dapat melihat review yang ditugaskan kepada mereka.',
  })
  @ApiQuery({ name: 'halaman', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: StatusReview })
  @ApiQuery({ name: 'rekomendasi', required: false, enum: Rekomendasi })
  @ApiQuery({ name: 'idNaskah', required: false, type: String })
  @ApiQuery({ name: 'idEditor', required: false, type: String })
  @ApiQuery({
    name: 'urutkan',
    required: false,
    enum: ['ditugaskanPada', 'dimulaiPada', 'selesaiPada', 'status'],
  })
  @ApiQuery({ name: 'arah', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Daftar review berhasil diambil',
  })
  async ambilSemuaReview(
    @Query() filter: FilterReviewDto,
    @PenggunaSaatIni('id') idPengguna: string,
  ) {
    return this.reviewService.ambilSemuaReview(filter, idPengguna);
  }

  /**
   * GET /review/statistik - Ambil statistik review
   * Role: admin, editor
   */
  @Get('statistik')
  @Peran('admin', 'editor')
  @ApiOperation({
    summary: 'Ambil statistik review',
    description:
      'Admin melihat statistik semua review, editor melihat statistik review mereka sendiri.',
  })
  @ApiQuery({
    name: 'idEditor',
    required: false,
    type: String,
    description: 'Filter untuk editor tertentu (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistik review berhasil diambil',
  })
  async ambilStatistikReview(
    @Query('idEditor') idEditor?: string,
    @PenggunaSaatIni('id') idPengguna?: string,
    @PenggunaSaatIni('peran') peranPengguna?: string[],
  ) {
    // Jika bukan admin, hanya bisa lihat statistik sendiri
    const filterEditor = peranPengguna?.includes('admin') ? idEditor : idPengguna;

    return this.reviewService.ambilStatistikReview(filterEditor);
  }

  /**
   * GET /review/editor/saya - Ambil review milik editor yang login
   * Role: editor
   */
  @Get('editor/saya')
  @Peran('editor')
  @ApiOperation({
    summary: 'Ambil review yang ditugaskan kepada saya',
    description: 'Editor dapat melihat daftar review yang ditugaskan kepada mereka.',
  })
  @ApiQuery({ name: 'halaman', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: StatusReview })
  @ApiResponse({
    status: 200,
    description: 'Daftar review berhasil diambil',
  })
  async ambilReviewSaya(@Query() filter: FilterReviewDto, @PenggunaSaatIni('id') idEditor: string) {
    return this.reviewService.ambilReviewEditor(idEditor, filter);
  }

  /**
   * GET /review/penulis/saya - Ambil semua review untuk naskah milik penulis
   * Role: penulis
   * OPTIMIZED: Single query dengan JOIN untuk performa optimal
   */
  @Get('penulis/saya')
  @Peran('penulis')
  @ApiOperation({
    summary: 'Ambil semua review untuk naskah milik penulis yang login',
    description:
      'Penulis dapat melihat semua review untuk semua naskah mereka dengan single request yang optimal. Mengatasi N+1 query problem.',
  })
  @ApiQuery({ name: 'halaman', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: StatusReview })
  @ApiQuery({ name: 'rekomendasi', required: false, enum: Rekomendasi })
  @ApiQuery({
    name: 'urutkan',
    required: false,
    enum: ['diperbaruiPada', 'dibuatPada', 'selesaiPada'],
    example: 'diperbaruiPada',
  })
  @ApiQuery({ name: 'arah', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Daftar review berhasil diambil',
  })
  async ambilReviewPenulisSaya(
    @Query() filter: FilterReviewDto,
    @PenggunaSaatIni('id') idPenulis: string,
  ) {
    return this.reviewService.ambilReviewPenulis(idPenulis, filter);
  }

  /**
   * GET /review/naskah/:idNaskah - Ambil review untuk naskah tertentu
   * Role: penulis (owner), admin, editor
   */
  @Get('naskah/:idNaskah')
  @Peran('penulis', 'admin', 'editor')
  @ApiOperation({
    summary: 'Ambil review untuk naskah tertentu',
    description:
      'Penulis dapat melihat review untuk naskah mereka sendiri, admin dan editor dapat melihat semua review.',
  })
  @ApiParam({ name: 'idNaskah', type: String })
  @ApiQuery({ name: 'halaman', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Daftar review untuk naskah berhasil diambil',
  })
  async ambilReviewNaskah(@Param('idNaskah') idNaskah: string, @Query() filter: FilterReviewDto) {
    return this.reviewService.ambilSemuaReview({ ...filter, idNaskah });
  }

  /**
   * GET /review/:id - Ambil detail review
   * Role: editor (owner), penulis (owner naskah), admin
   */
  @Get(':id')
  @Peran('penulis', 'editor', 'admin')
  @ApiOperation({
    summary: 'Ambil detail review by ID',
    description: 'Editor yang ditugaskan, penulis naskah, atau admin dapat melihat detail review.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Detail review berhasil diambil',
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses ke review ini',
  })
  @ApiResponse({
    status: 404,
    description: 'Review tidak ditemukan',
  })
  async ambilReviewById(
    @Param('id') id: string,
    @PenggunaSaatIni('id') idPengguna: string,
    @PenggunaSaatIni('peran') peranPengguna: string[],
  ) {
    return this.reviewService.ambilReviewById(id, idPengguna, peranPengguna);
  }

  /**
   * PUT /review/:id - Perbarui review
   * Role: editor (owner), admin
   */
  @Put(':id')
  @Peran('editor', 'admin')
  @ApiOperation({
    summary: 'Perbarui review (status, catatan)',
    description: 'Editor yang ditugaskan atau admin dapat memperbarui status dan catatan review.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Review berhasil diperbarui',
  })
  @ApiResponse({
    status: 400,
    description: 'Review sudah selesai atau dibatalkan',
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses untuk mengubah review ini',
  })
  @ApiResponse({
    status: 404,
    description: 'Review tidak ditemukan',
  })
  async perbaruiReview(
    @Param('id') id: string,
    @Body() dto: PerbaruiReviewDto,
    @PenggunaSaatIni('id') idPengguna: string,
    @PenggunaSaatIni('peran') peranPengguna: string[],
  ) {
    return this.reviewService.perbaruiReview(id, dto, idPengguna, peranPengguna);
  }

  /**
   * POST /review/:id/feedback - Tambah feedback ke review
   * Role: editor (owner)
   */
  @Post(':id/feedback')
  @Peran('editor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tambah feedback ke review',
    description:
      'Editor yang ditugaskan dapat menambahkan feedback detail untuk review. Status akan otomatis berubah ke dalam_proses jika masih ditugaskan.',
  })
  @ApiParam({ name: 'id', type: String, description: 'ID review' })
  @ApiResponse({
    status: 201,
    description: 'Feedback berhasil ditambahkan',
  })
  @ApiResponse({
    status: 400,
    description: 'Feedback hanya bisa ditambahkan saat review dalam proses',
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses ke review ini',
  })
  @ApiResponse({
    status: 404,
    description: 'Review tidak ditemukan',
  })
  async tambahFeedback(
    @Param('id') idReview: string,
    @Body() dto: TambahFeedbackDto,
    @PenggunaSaatIni('id') idEditor: string,
  ) {
    return this.reviewService.tambahFeedback(idReview, dto, idEditor);
  }

  /**
   * PUT /review/:id/submit - Submit/finalisasi review
   * Role: editor (owner)
   */
  @Put(':id/submit')
  @Peran('editor')
  @ApiOperation({
    summary: 'Submit/finalisasi review dengan rekomendasi',
    description:
      'Editor yang ditugaskan dapat menyelesaikan review dengan memberikan rekomendasi. Status naskah akan diperbarui berdasarkan rekomendasi (setujui→disetujui, revisi→perlu_revisi, tolak→ditolak). Harus ada minimal 1 feedback sebelum submit.',
  })
  @ApiParam({ name: 'id', type: String, description: 'ID review' })
  @ApiResponse({
    status: 200,
    description: 'Review berhasil disubmit',
  })
  @ApiResponse({
    status: 400,
    description: 'Review sudah selesai atau harus ada minimal 1 feedback',
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses ke review ini',
  })
  @ApiResponse({
    status: 404,
    description: 'Review tidak ditemukan',
  })
  async submitReview(
    @Param('id') id: string,
    @Body() dto: SubmitReviewDto,
    @PenggunaSaatIni('id') idEditor: string,
  ) {
    return this.reviewService.submitReview(id, dto, idEditor);
  }

  /**
   * PUT /review/:id/batal - Batalkan review
   * Role: editor (owner), admin
   */
  @Put(':id/batal')
  @Peran('editor', 'admin')
  @ApiOperation({
    summary: 'Batalkan review',
    description:
      'Editor yang ditugaskan atau admin dapat membatalkan review. Status naskah akan dikembalikan ke diajukan.',
  })
  @ApiParam({ name: 'id', type: String, description: 'ID review' })
  @ApiResponse({
    status: 200,
    description: 'Review berhasil dibatalkan',
  })
  @ApiResponse({
    status: 400,
    description: 'Review yang sudah selesai tidak bisa dibatalkan',
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses untuk membatalkan review ini',
  })
  @ApiResponse({
    status: 404,
    description: 'Review tidak ditemukan',
  })
  async batalkanReview(
    @Param('id') id: string,
    @Body('alasan') alasan: string,
    @PenggunaSaatIni('id') idPengguna: string,
    @PenggunaSaatIni('peran') peranPengguna: string[],
  ) {
    return this.reviewService.batalkanReview(id, alasan, idPengguna, peranPengguna);
  }
}
