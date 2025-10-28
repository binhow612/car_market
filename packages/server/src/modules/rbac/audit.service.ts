import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return await this.auditLogRepository.save(auditLog);
  }

  /**
   * Log authentication events
   */
  async logAuth(
    userId: string,
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED',
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action,
      resource: 'AUTH',
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log permission changes
   */
  async logPermissionChange(
    userId: string,
    action: 'ROLE_ASSIGNED' | 'ROLE_REMOVED' | 'PERMISSION_GRANTED' | 'PERMISSION_REVOKED',
    targetUserId: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action,
      resource: 'USER',
      resourceId: targetUserId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log resource modifications
   */
  async logResourceModification(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    resource: string,
    resourceId: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log administrative actions
   */
  async logAdminAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceAuditLogs(
    resource: string,
    resourceId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { resource, resourceId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs by action
   */
  async getAuditLogsByAction(
    action: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get all audit logs
   */
  async getAllAuditLogs(
    limit: number = 50,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
