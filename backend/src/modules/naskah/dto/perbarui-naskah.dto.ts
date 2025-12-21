import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, MinLength, MaxLength, IsUUID, Min } from 'class-validator';

/**
 * Schema Zod untuk update naskah
 * Semua field optional (partial update)
 */
export const PerbaruiNaskahSchema = z.object({
  judul: z
    .string()
    .min(3, 'Judul minimal 3 karakter')
    .max(200, 'Judul maksimal 200 karakter')
    .trim()
    .optional(),

  subJudul: z.string().max(200, 'Sub judul maksimal 200 karakter').trim().optional().nullable(),

  sinopsis: z
    .string()
    .min(50, 'Sinopsis minimal 50 karakter')
    .max(2000, 'Sinopsis maksimal 2000 karakter')
    .trim()
    .optional(),

  idKategori: z.string().uuid('ID kategori harus berupa UUID').optional(),

  idGenre: z.string().uuid('ID genre harus berupa UUID').optional(),

  bahasaTulis: z.string().length(2, 'Kode bahasa harus 2 karakter (ISO 639-1)').optional(),

  jumlahHalaman: z
    .number()
    .int('Jumlah halaman harus bilangan bulat')
    .min(1, 'Jumlah halaman minimal 1')
    .optional()
    .nullable(),

  jumlahKata: z
    .number()
    .int('Jumlah kata harus bilangan bulat')
    .min(100, 'Jumlah kata minimal 100')
    .optional()
    .nullable(),

  urlSampul: z
    .string()
    .refine(
      (val) => {
        // Accept full URL or relative path starting with /
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
      },
      { message: 'URL sampul harus berupa URL valid atau path relatif (dimulai dengan /)' },
    )
    .optional()
    .nullable(),

  urlFile: z
    .string()
    .refine(
      (val) => {
        // Accept full URL or relative path starting with /
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
      },
      { message: 'URL file harus berupa URL valid atau path relatif (dimulai dengan /)' },
    )
    .optional()
    .nullable(),

  publik: z.boolean().optional(),
});

/**
 * Type inference dari Zod schema
 */
export type PerbaruiNaskahDto = z.infer<typeof PerbaruiNaskahSchema>;

/**
 * Class untuk Swagger documentation dan validasi runtime
 */
export class PerbaruiNaskahDtoClass {
  @ApiProperty({
    description: 'Judul naskah',
    example: 'Perjalanan ke Negeri Dongeng',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  judul?: string;

  @ApiProperty({
    description: 'Sub judul naskah',
    example: 'Petualangan Seru di Dunia Fantasi',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subJudul?: string;

  @ApiProperty({
    description: 'Sinopsis naskah',
    example: 'Cerita tentang seorang anak yang menemukan portal ajaib...',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(50)
  @MaxLength(2000)
  sinopsis?: string;

  @ApiProperty({
    description: 'ID kategori naskah',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  idKategori?: string;

  @ApiProperty({
    description: 'ID genre naskah',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  idGenre?: string;

  @ApiProperty({
    description: 'Bahasa tulisan (kode ISO 639-1)',
    example: 'id',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  bahasaTulis?: string;

  @ApiProperty({
    description: 'Jumlah halaman naskah',
    example: 250,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  jumlahHalaman?: number;

  @ApiProperty({
    description: 'Jumlah kata dalam naskah',
    example: 75000,
    required: false,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  jumlahKata?: number;

  @ApiProperty({
    description: 'URL sampul/cover naskah',
    example: 'https://storage.publishify.com/covers/cover-123.jpg',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  urlSampul?: string;

  @ApiProperty({
    description: 'URL file naskah (PDF/DOCX)',
    example: 'https://storage.publishify.com/manuscripts/manuscript-123.pdf',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  urlFile?: string;

  @ApiProperty({
    description: 'Status publik',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  publik?: boolean;
}
