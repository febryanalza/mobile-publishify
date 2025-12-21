import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * Local Strategy untuk validasi username/password
 * 
 * Digunakan untuk endpoint login
 * Passport akan otomatis extract username dan password dari request body
 * Kemudian memanggil method validate() untuk verifikasi credentials
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Gunakan email sebagai username
      passwordField: 'kataSandi', // Field password dalam Bahasa Indonesia
    });
  }

  /**
   * Method validate dipanggil otomatis oleh Passport
   * 
   * @param email - Email pengguna
   * @param kataSandi - Kata sandi pengguna
   * @returns Object pengguna jika valid
   * @throws UnauthorizedException jika credentials tidak valid
   */
  async validate(email: string, kataSandi: string): Promise<any> {
    // Validasi input untuk mencegah null/undefined
    if (!email || !kataSandi || email.trim() === '' || kataSandi.trim() === '') {
      throw new UnauthorizedException('Email dan kata sandi harus diisi');
    }

    const pengguna = await this.authService.validasiPengguna(email.trim(), kataSandi);

    if (!pengguna) {
      throw new UnauthorizedException('Email atau kata sandi tidak valid');
    }

    // Pengguna akan di-attach ke request.user
    return pengguna;
  }
}
