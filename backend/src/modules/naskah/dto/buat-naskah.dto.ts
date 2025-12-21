import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Schema Zod untuk membuat naskah baru
 */
export const BuatNaskahSchema = z.object({
  judul: z
    .string({
      required_error: 'Judul wajib diisi',
    })
    .min(3, 'Judul minimal 3 karakter')
    .max(200, 'Judul maksimal 200 karakter')
    .trim(),

  subJudul: z.string().max(200, 'Sub judul maksimal 200 karakter').trim().optional().nullable(),

  sinopsis: z
    .string({
      required_error: 'Sinopsis wajib diisi',
    })
    .min(50, 'Sinopsis minimal 50 karakter')
    .max(2000, 'Sinopsis maksimal 2000 karakter')
    .trim(),

  idKategori: z
    .string({
      required_error: 'Kategori wajib dipilih',
    })
    .uuid('ID kategori harus berupa UUID'),

  idGenre: z
    .string({
      required_error: 'Genre wajib dipilih',
    })
    .uuid('ID genre harus berupa UUID'),

  bahasaTulis: z
    .string()
    .length(2, 'Kode bahasa harus 2 karakter (ISO 639-1)')
    .default('id')
    .optional(),

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

  publik: z.boolean().default(false).optional(),
});

/**
 * Type inference dari Zod schema
 */
export type BuatNaskahDto = z.infer<typeof BuatNaskahSchema>;

/**
 * Class untuk Swagger documentation
 */
export class BuatNaskahDtoClass {
  @ApiProperty({
    description: 'Judul naskah',
    example: 'Perjalanan ke Negeri Dongeng',
    minLength: 3,
    maxLength: 200,
    type: String,
  })
  judul!: string;

  @ApiProperty({
    description: 'Sub judul naskah',
    example: 'Petualangan Seru di Dunia Fantasi',
    required: false,
    maxLength: 200,
    type: String,
  })
  subJudul?: string;

  @ApiProperty({
    description: 'Sinopsis naskah',
    example: 'Cerita tentang seorang anak yang menemukan portal ajaib ke negeri dongeng...',
    minLength: 50,
    maxLength: 2000,
    type: String,
  })
  sinopsis!: string;

  @ApiProperty({
    description: 'ID kategori naskah',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  idKategori!: string;

  @ApiProperty({
    description: 'ID genre naskah',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
  })
  idGenre!: string;

  @ApiProperty({
    description: 'Bahasa tulisan (kode ISO 639-1)',
    example: 'id',
    default: 'id',
    required: false,
    type: String,
  })
  bahasaTulis?: string;

  @ApiProperty({
    description: 'Jumlah halaman naskah',
    example: 250,
    required: false,
    type: Number,
  })
  jumlahHalaman?: number;

  @ApiProperty({
    description: 'Jumlah kata dalam naskah',
    example: 75000,
    required: false,
    type: Number,
  })
  jumlahKata?: number;

  @ApiProperty({
    description: 'URL sampul/cover naskah',
    example: 'https://storage.publishify.com/covers/cover-123.jpg',
    required: false,
    type: String,
  })
  urlSampul?: string;

  @ApiProperty({
    description: 'URL file naskah (PDF/DOCX)',
    example: 'https://storage.publishify.com/manuscripts/manuscript-123.pdf',
    required: false,
    type: String,
  })
  urlFile?: string;

  @ApiProperty({
    description: 'Status publik (dapat dilihat publik atau tidak)',
    default: false,
    required: false,
    type: Boolean,
  })
  publik?: boolean;
}
