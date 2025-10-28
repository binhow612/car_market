import { SetMetadata } from '@nestjs/common';
import { LegacyUserRole } from '../../entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: LegacyUserRole[]) => SetMetadata(ROLES_KEY, roles);
