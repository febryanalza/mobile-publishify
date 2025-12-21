import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { StatusNaskah } from '@prisma/client';

/**
 * Schema Zod untuk filter naskah
 */
export const FilterNaskahSchema = z.object({
  halaman: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cari: z.string().optional(),
  status: z.nativeEnum(StatusNaskah).optional(),
  idKategori: z.string().uuid().optional(),
  idGenre: z.string().uuid().optional(),
  idPenulis: z.string().uuid().optional(),
  publik: z.coerce.boolean().optional(),
  urutkan: z.enum(['dibuatPada', 'diperbaruiPada', 'judul', 'status', 'jumlahHalaman']).default('dibuatPada'),
  arah: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Type inference dari Zod schema
 */
export type FilterNaskahDto = z.infer<typeof FilterNaskahSchema>;

/**
 * Class untuk Swagger documentation
 */
export class FilterNaskahDtoClass {
  @ApiProperty({
    description: 'Halaman yang diminta',
    example: 1,
    default: 1,
    minimum: 1,
    type: Number,
    required: false,
  })
  halaman?: number;

  @ApiProperty({
    description: 'Jumlah data per halaman',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    type: Number,
    required: false,
  })
  limit?: number;

  @ApiProperty({
    description: 'Pencarian (judul, sinopsis)',
    example: 'dongeng',
    required: false,
    type: String,
  })
  cari?: string;

  @ApiProperty({
    description: 'Filter berdasarkan status naskah',
    enum: StatusNaskah,
    required: false,
  })
  status?: StatusNaskah;

  @ApiProperty({
    description: 'Filter berdasarkan ID kategori',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
    type: String,
  })
  idKategori?: string;

  @ApiProperty({
    description: 'Filter berdasarkan ID genre',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
    type: String,
  })
  idGenre?: string;

  @ApiProperty({
    description: 'Filter berdasarkan ID penulis',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
    type: String,
  })
  idPenulis?: string;

  @ApiProperty({
    description: 'Filter naskah publik/private',
    required: false,
    type: Boolean,
  })
  publik?: boolean;

  @ApiProperty({
    description: 'Field untuk sorting',
    enum: ['dibuatPada', 'diperbaruiPada', 'judul', 'status', 'jumlahHalaman'],
    default: 'dibuatPada',
    required: false,
    type: String,
  })
  urutkan?: 'dibuatPada' | 'diperbaruiPada' | 'judul' | 'status' | 'jumlahHalaman';

  @ApiProperty({
    description: 'Arah sorting',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
    type: String,
  })
  arah?: 'asc' | 'desc';
}
