import { SetMetadata } from '@nestjs/common';

export const RESOURCE_KEY = 'resource';
export const RequireResource = (resource: string) =>
  SetMetadata(RESOURCE_KEY, resource);

export const OWNERSHIP_KEY = 'ownership';
export const RequireOwnership = () => SetMetadata(OWNERSHIP_KEY, true);
