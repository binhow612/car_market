import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

export const SKIP_PERMISSION_CHECK_KEY = 'skipPermissionCheck';
export const SkipPermissionCheck = () =>
  SetMetadata(SKIP_PERMISSION_CHECK_KEY, true);
