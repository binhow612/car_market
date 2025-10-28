import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../modules/rbac/permission.service';
import { RESOURCE_KEY, OWNERSHIP_KEY } from '../decorators/resource.decorator';

@Injectable()
export class ResourceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredResource = this.reflector.getAllAndOverride<string>(
      RESOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requireOwnership = this.reflector.getAllAndOverride<boolean>(
      OWNERSHIP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredResource) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Extract resource ID from request parameters
    const resourceId = this.extractResourceId(request, requiredResource);

    if (!resourceId) {
      throw new BadRequestException(
        `Resource ID not found for resource: ${requiredResource}`,
      );
    }

    // Check resource access
    const hasAccess = await this.permissionService.checkResourceAccess(
      user.id,
      requiredResource,
      resourceId,
    );

    if (!hasAccess) {
      if (requireOwnership) {
        throw new ForbiddenException(
          `Access denied. You can only access your own ${requiredResource.toLowerCase()} resources.`,
        );
      } else {
        throw new ForbiddenException(
          `Access denied to ${requiredResource.toLowerCase()} resource.`,
        );
      }
    }

    return true;
  }

  private extractResourceId(request: any, resource: string): string | null {
    // Try to get resource ID from different sources
    const params = request.params || {};
    const body = request.body || {};
    const query = request.query || {};

    // Common patterns for resource IDs
    const possibleKeys = [
      'id',
      `${resource.toLowerCase()}Id`,
      `${resource.toLowerCase()}_id`,
    ];

    for (const key of possibleKeys) {
      if (params[key]) return params[key];
      if (body[key]) return body[key];
      if (query[key]) return query[key];
    }

    // For user resources, use the authenticated user's ID
    if (resource === 'USER' && request.user?.id) {
      return request.user.id;
    }

    return null;
  }
}
