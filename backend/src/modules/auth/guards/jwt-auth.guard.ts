import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { IS_OPTIONAL_AUTH_KEY } from '@/common/decorators/optional-auth.decorator';

/**
 * JWT Authentication Guard
 * 
 * Protect routes yang memerlukan authentication
 * Otomatis skip authentication untuk routes yang di-mark dengan @Public()
 * Optional authentication untuk routes yang di-mark dengan @OptionalAuth()
 * 
 * @example
 * // Di controller
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * async getProfile(@PenggunaSaatIni() pengguna: any) {
 *   return pengguna;
 * }
 * 
 * @example
 * // Route publik (skip auth)
 * @Public()
 * @Get('public-data')
 * async getPublicData() {
 *   return 'Data publik';
 * }
 * 
 * @example
 * // Route dengan optional auth (authenticated jika token ada)
 * @OptionalAuth()
 * @Get('mixed-data')
 * async getMixedData(@PenggunaSaatIni('id') idPengguna?: string) {
 *   // idPengguna akan ada jika user authenticated, undefined jika tidak
 *   return idPengguna ? 'Private data' : 'Public data';
 * }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check apakah route di-mark sebagai public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Jika public, skip authentication
    if (isPublic) {
      return true;
    }

    // Check apakah route di-mark sebagai optional auth
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Jika optional auth, tetap coba authenticate tapi jangan error
    if (isOptionalAuth) {
      return super.canActivate(context) as Promise<boolean> | boolean;
    }

    // Lanjutkan dengan JWT authentication (required)
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Check apakah route di-mark sebagai optional auth
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Jika optional auth dan tidak ada user, return undefined (tidak error)
    if (isOptionalAuth && !user && !err) {
      return undefined;
    }

    // Jika ada error atau tidak ada user (untuk non-optional routes), throw error
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    return user;
  }
}
