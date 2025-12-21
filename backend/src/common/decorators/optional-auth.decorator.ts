import { SetMetadata } from '@nestjs/common';

export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

/**
 * Decorator untuk menandai route sebagai optional authentication
 * Route akan tetap mencoba authenticate jika token ada,
 * tapi tidak akan error jika token tidak ada atau invalid
 */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
