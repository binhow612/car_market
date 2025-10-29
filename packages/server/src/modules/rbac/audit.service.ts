import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

export interface AuditLogData {
  userId?: string | undefined;
  action: string;
  resource: string;
  resourceId?: string | undefined;
  details?: Record<string, any> | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
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
    const auditLogData: any = {
      action: data.action,
      resource: data.resource,
    };

    if (data.userId !== undefined) auditLogData.userId = data.userId;
    if (data.resourceId !== undefined) auditLogData.resourceId = data.resourceId;
    if (data.details !== undefined) auditLogData.details = data.details;
    if (data.ipAddress !== undefined) auditLogData.ipAddress = data.ipAddress;
    if (data.userAgent !== undefined) auditLogData.userAgent = data.userAgent;

    const auditLog = this.auditLogRepository.create(auditLogData);
    const savedLog = await this.auditLogRepository.save(auditLog);
    return Array.isArray(savedLog) ? savedLog[0]! : savedLog!;
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
      details: details || undefined,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
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
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
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
      details: details || undefined,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
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
      resourceId: resourceId || undefined,
      details: details || undefined,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
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
