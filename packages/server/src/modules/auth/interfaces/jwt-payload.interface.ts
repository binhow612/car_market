import { LegacyUserRole } from '../../../entities/user.entity';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: LegacyUserRole;
  iat?: number; // Issued at
  exp?: number; // Expires at
}
