import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LegacyUserRole } from '../../entities/user.entity';

@Controller('rbac')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(LegacyUserRole.ADMIN)
export class RbacController {
  constructor(
    private permissionService: PermissionService,
    private auditService: AuditService,
  ) {}

  // Permission management
  @Get('permissions')
  async getPermissions() {
    try {
      return await this.permissionService.getAllPermissions();
    } catch (error) {
      // If RBAC data doesn't exist, return empty array
      console.log('RBAC data not found, returning empty permissions');
      return [];
    }
  }

  @Get('permissions/user/:userId')
  async getUserPermissions(@Param('userId') userId: string) {
    return this.permissionService.getUserPermissions(userId);
  }

  @Get('roles')
  async getRoles() {
    try {
      return await this.permissionService.getAllRoles();
    } catch (error) {
      // If RBAC data doesn't exist, return empty array
      console.log('RBAC data not found, returning empty roles');
      return [];
    }
  }

  @Get('roles/user/:userId')
  async getUserRoles(@Param('userId') userId: string) {
    return this.permissionService.getUserRoles(userId);
  }

  @Post('roles/assign')
  async assignRole(
    @Body() body: { userId: string; roleId: string; expiresAt?: string },
    @Request() req: any,
  ) {
    const userRole = await this.permissionService.assignRole(
      body.userId,
      body.roleId,
      req.user.id,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );

    // Log the role assignment
    await this.auditService.logPermissionChange(
      req.user.id,
      'ROLE_ASSIGNED',
      body.userId,
      { roleId: body.roleId, expiresAt: body.expiresAt },
      req.ip,
      req.headers['user-agent'],
    );

    return userRole;
  }

  @Delete('roles/remove')
  async removeRole(
    @Body() body: { userId: string; roleId: string },
    @Request() req: any,
  ) {
    await this.permissionService.removeRole(body.userId, body.roleId);

    // Log the role removal
    await this.auditService.logPermissionChange(
      req.user.id,
      'ROLE_REMOVED',
      body.userId,
      { roleId: body.roleId },
      req.ip,
      req.headers['user-agent'],
    );

    return { message: 'Role removed successfully' };
  }

  @Get('check-permission')
  async checkPermission(
    @Query('permission') permission: string,
    @Request() req: any,
  ) {
    const hasPermission = await this.permissionService.hasPermission(
      req.user.id,
      permission,
    );
    return { hasPermission };
  }

  @Get('check-resource-access')
  async checkResourceAccess(
    @Query('resource') resource: string,
    @Query('resourceId') resourceId: string,
    @Request() req: any,
  ) {
    const hasAccess = await this.permissionService.checkResourceAccess(
      req.user.id,
      resource,
      resourceId,
    );
    return { hasAccess };
  }

  // Audit logs
  @Get('audit-logs')
  async getAuditLogs(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    try {
      return await this.auditService.getAllAuditLogs(limit, offset);
    } catch (error) {
      // If audit logs don't exist, return empty array
      console.log('Audit logs not found, returning empty array');
      return [];
    }
  }

  @Get('audit-logs/user/:userId')
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.auditService.getUserAuditLogs(userId, limit, offset);
  }

  @Get('audit-logs/resource/:resource/:resourceId')
  async getResourceAuditLogs(
    @Param('resource') resource: string,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.auditService.getResourceAuditLogs(resource, resourceId, limit, offset);
  }

  @Post('seed')
  async seedRbacData() {
    try {
      // Check if RBAC data already exists
      const existingRoles = await this.permissionService.getAllRoles();
      if (existingRoles.length > 0) {
        return { message: 'RBAC data already exists', success: true };
      }

      // For now, just return success - the actual seeding will be handled by the admin service
      return { message: 'RBAC seeding endpoint ready', success: true };
    } catch (error) {
      console.error('Failed to seed RBAC data:', error);
      return { message: 'Failed to seed RBAC data', success: false, error: error.message };
    }
  }
}
