import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, LegacyUserRole } from '../../entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(LegacyUserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getAllUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.adminService.getAllUsers(page, limit);
  }

  @Get('listings/pending')
  getPendingListings(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.adminService.getPendingListings(page, limit);
  }

  @Put('listings/:id/approve')
  approveListing(@Param('id') id: string, @CurrentUser() user: User) {
    return this.adminService.approveListing(id, user.id);
  }

  @Put('listings/:id/reject')
  rejectListing(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.rejectListing(id, reason, user.id);
  }

  @Get('listings/:id/pending-changes')
  getListingWithPendingChanges(@Param('id') id: string) {
    return this.adminService.getListingWithPendingChanges(id);
  }

  @Get('transactions')
  getTransactions(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.adminService.getTransactions(page, limit);
  }

  // Enhanced listing management
  @Get('listings')
  getAllListings(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllListings(page, limit, status, search);
  }

  @Get('listings/:id')
  getListingById(@Param('id') id: string) {
    return this.adminService.getListingById(id);
  }

  @Put('listings/:id/status')
  updateListingStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.updateListingStatus(id, status, reason);
  }

  @Delete('listings/:id')
  deleteListing(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.deleteListing(id, body.reason);
  }

  @Put('listings/:id/featured')
  toggleFeatured(@Param('id') id: string) {
    return this.adminService.toggleFeatured(id);
  }

  // Enhanced user management
  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/status')
  updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.updateUserStatus(id, isActive, reason);
  }

  @Put('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Get('users/:id/listings')
  getUserListings(
    @Param('id') id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.adminService.getUserListings(id, page, limit);
  }

  // RBAC endpoints for admin dashboard
  @Get('rbac/roles')
  getAllRoles() {
    return this.adminService.getAllRoles();
  }

  @Get('rbac/roles/user/:userId')
  getUserRoles(@Param('userId') userId: string) {
    return this.adminService.getUserRoles(userId);
  }

  @Post('rbac/roles/assign')
  assignRole(
    @Body() body: { userId: string; roleId: string; expiresAt?: string },
    @Request() req: any,
  ) {
    return this.adminService.assignRole(
      body.userId,
      body.roleId,
      req.user.id,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
  }

  @Delete('rbac/roles/remove')
  removeRole(@Body() body: { userId: string; roleId: string }) {
    return this.adminService.removeRole(body.userId, body.roleId);
  }

  @Get('rbac/permissions')
  getAllPermissions() {
    return this.adminService.getAllPermissions();
  }

  @Get('rbac/audit-logs')
  getAuditLogs(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    return this.adminService.getAuditLogs(limit);
  }

  // Analytics and reports
  @Get('analytics/overview')
  getAnalyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('analytics/listings')
  getListingAnalytics(@Query('period') period: string = '30d') {
    return this.adminService.getListingAnalytics(period);
  }

  @Get('analytics/users')
  getUserAnalytics(@Query('period') period: string = '30d') {
    return this.adminService.getUserAnalytics(period);
  }

  @Post('rbac/seed')
  seedRbacData() {
    return this.adminService.seedRbacData();
  }
}
