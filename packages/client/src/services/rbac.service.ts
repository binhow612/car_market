import { api } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  priority: number;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  action: string;
  resource: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export class RbacService {
  // Get all permissions
  static async getPermissions(): Promise<Permission[]> {
    const response = await api.get('/rbac/permissions');
    return response.data;
  }

  // Get all roles
  static async getRoles(): Promise<Role[]> {
    const response = await api.get('/rbac/roles');
    return response.data;
  }

  // Get user permissions
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    const response = await api.get(`/rbac/permissions/user/${userId}`);
    return response.data;
  }

  // Get user roles
  static async getUserRoles(userId: string): Promise<Role[]> {
    const response = await api.get(`/rbac/roles/user/${userId}`);
    return response.data;
  }

  // Assign role to user
  static async assignRole(userId: string, roleId: string, expiresAt?: string): Promise<UserRole> {
    const response = await api.post('/rbac/roles/assign', {
      userId,
      roleId,
      expiresAt,
    });
    return response.data;
  }

  // Remove role from user
  static async removeRole(userId: string, roleId: string): Promise<void> {
    await api.delete('/rbac/roles/remove', {
      data: { userId, roleId },
    });
  }

  // Check permission
  static async checkPermission(permission: string): Promise<{ hasPermission: boolean }> {
    const response = await api.get(`/rbac/check-permission?permission=${permission}`);
    return response.data;
  }

  // Check resource access
  static async checkResourceAccess(resource: string, resourceId: string): Promise<{ hasAccess: boolean }> {
    const response = await api.get(`/rbac/check-resource-access?resource=${resource}&resourceId=${resourceId}`);
    return response.data;
  }

  // Get audit logs
  static async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    const response = await api.get(`/rbac/audit-logs?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  // Get user audit logs
  static async getUserAuditLogs(userId: string, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    const response = await api.get(`/rbac/audit-logs/user/${userId}?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  // Get resource audit logs
  static async getResourceAuditLogs(resource: string, resourceId: string, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    const response = await api.get(`/rbac/audit-logs/resource/${resource}/${resourceId}?limit=${limit}&offset=${offset}`);
    return response.data;
  }
}
