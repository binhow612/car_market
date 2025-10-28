# RBAC (Role-Based Access Control) Implementation

## Overview

This document describes the comprehensive RBAC system implemented for the CarMarket application. The system provides granular permission-based authorization with audit logging and resource-based access control.

## Architecture

### Core Components

1. **Entities**
   - `Permission`: Defines individual permissions with action and resource
   - `Role`: Groups permissions together with priority levels
   - `UserRole`: Junction table linking users to roles with expiration support
   - `AuditLog`: Tracks all security-related events

2. **Services**
   - `PermissionService`: Core RBAC logic for permission checking
   - `AuditService`: Comprehensive audit logging

3. **Guards**
   - `PermissionGuard`: Checks specific permissions
   - `ResourceGuard`: Validates resource access and ownership

4. **Decorators**
   - `@RequirePermission(permission)`: Require specific permission
   - `@RequireResource(resource)`: Require resource access
   - `@RequireOwnership()`: Require resource ownership

## Database Schema

### Permissions Table
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  description VARCHAR,
  action ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'),
  resource ENUM('USER', 'LISTING', 'TRANSACTION', 'ADMIN', 'CHAT', 'ASSISTANT', 'LOGS', 'SYSTEM'),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Roles Table
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  description VARCHAR,
  isActive BOOLEAN DEFAULT true,
  isSystem BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### User Roles Table
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  roleId UUID REFERENCES roles(id),
  assignedBy UUID,
  isActive BOOLEAN DEFAULT true,
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  UNIQUE(userId, roleId)
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  userId UUID,
  action VARCHAR NOT NULL,
  resource VARCHAR NOT NULL,
  resourceId VARCHAR,
  details JSON,
  ipAddress VARCHAR,
  userAgent VARCHAR,
  createdAt TIMESTAMP
);
```

## Default Permissions

### User Permissions
- `user:create` - Create new users
- `user:read` - View user information
- `user:update` - Update user information
- `user:delete` - Delete users
- `user:manage` - Manage all users

### Listing Permissions
- `listing:create` - Create new listings
- `listing:read` - View listings
- `listing:update` - Update listings
- `listing:delete` - Delete listings
- `listing:manage` - Manage all listings

### Transaction Permissions
- `transaction:create` - Create transactions
- `transaction:read` - View transactions
- `transaction:update` - Update transactions
- `transaction:manage` - Manage all transactions

### Admin Permissions
- `admin:dashboard` - Access admin dashboard
- `admin:users` - Manage users in admin
- `admin:listings` - Manage listings in admin
- `admin:logs` - View system logs

### Chat Permissions
- `chat:send` - Send chat messages
- `chat:read` - Read chat messages
- `chat:moderate` - Moderate chat

### Assistant Permissions
- `assistant:use` - Use virtual assistant
- `assistant:configure` - Configure assistant settings

### System Permissions
- `system:logs` - View system logs
- `system:manage` - Manage system settings

## Default Roles

### Super Admin (Priority: 100)
- All permissions
- System role (cannot be deleted)

### Admin (Priority: 80)
- User management permissions
- Listing management permissions
- Admin dashboard access
- System logs access

### Moderator (Priority: 60)
- Content moderation permissions
- Chat moderation permissions
- Read access to users and listings

### Seller (Priority: 40)
- Listing management permissions
- Transaction management permissions
- Chat and assistant access

### Buyer (Priority: 20)
- Basic read permissions
- Transaction creation
- Chat and assistant access

## Usage Examples

### Controller Protection

```typescript
@Controller('listings')
@UseGuards(PermissionGuard)
export class ListingsController {
  
  @Get()
  @RequirePermission('listing:read')
  async findAll() {
    // Get all listings
  }

  @Post()
  @RequirePermission('listing:create')
  async create(@Body() createListingDto: CreateListingDto) {
    // Create new listing
  }

  @Put(':id')
  @RequirePermission('listing:update')
  @RequireResource('LISTING')
  @RequireOwnership()
  async update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
    // Update listing (only if user owns it or has manage permission)
  }

  @Delete(':id')
  @RequirePermission('listing:delete')
  @RequireResource('LISTING')
  @RequireOwnership()
  async remove(@Param('id') id: string) {
    // Delete listing (only if user owns it or has manage permission)
  }
}
```

### Service Usage

```typescript
@Injectable()
export class SomeService {
  constructor(private permissionService: PermissionService) {}

  async someMethod(userId: string) {
    // Check if user has specific permission
    const canCreate = await this.permissionService.hasPermission(userId, 'listing:create');
    
    if (!canCreate) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Check resource access
    const canAccess = await this.permissionService.checkResourceAccess(
      userId, 
      'LISTING', 
      'listing-id'
    );

    // Get user's roles
    const userRoles = await this.permissionService.getUserRoles(userId);
    
    // Get user's permissions
    const userPermissions = await this.permissionService.getUserPermissions(userId);
  }
}
```

### Audit Logging

```typescript
@Injectable()
export class SomeService {
  constructor(private auditService: AuditService) {}

  async createUser(userData: any, adminId: string) {
    // Create user logic...
    
    // Log the action
    await this.auditService.logResourceModification(
      adminId,
      'CREATE',
      'USER',
      newUser.id,
      { email: userData.email },
      request.ip,
      request.headers['user-agent']
    );
  }
}
```

## Migration and Setup

### 1. Run Database Migration

```bash
npm run typeorm migration:run
```

### 2. Seed RBAC Data

```bash
npm run seed:rbac
```

### 3. Update Existing Controllers

Replace `@Roles()` decorators with `@RequirePermission()`:

```typescript
// Old
@Roles(LegacyUserRole.ADMIN)
@UseGuards(RolesGuard)

// New
@RequirePermission('admin:users')
@UseGuards(PermissionGuard)
```

## API Endpoints

### RBAC Management

- `GET /rbac/permissions` - Get all permissions
- `GET /rbac/permissions/user/:userId` - Get user permissions
- `GET /rbac/roles` - Get all roles
- `GET /rbac/roles/user/:userId` - Get user roles
- `POST /rbac/roles/assign` - Assign role to user
- `DELETE /rbac/roles/remove` - Remove role from user
- `GET /rbac/check-permission` - Check user permission
- `GET /rbac/check-resource-access` - Check resource access

### Audit Logs

- `GET /rbac/audit-logs` - Get all audit logs
- `GET /rbac/audit-logs/user/:userId` - Get user audit logs
- `GET /rbac/audit-logs/resource/:resource/:resourceId` - Get resource audit logs

## Security Features

1. **Permission-based Authorization**: Granular control over user actions
2. **Resource-based Access Control**: Ownership validation for resources
3. **Audit Logging**: Comprehensive tracking of all security events
4. **Role Priority**: Higher priority roles override lower ones
5. **Expiration Support**: Time-limited role assignments
6. **System Roles**: Protected roles that cannot be deleted

## Performance Considerations

1. **Caching**: Permission lookups are cached for performance
2. **Database Indexes**: Optimized indexes for common queries
3. **Connection Pooling**: Efficient database connections
4. **Query Optimization**: Optimized queries for permission checking

## Testing

### Unit Tests
- Permission service methods
- Guard functionality
- Audit service logging

### Integration Tests
- End-to-end permission flows
- Role assignment scenarios
- Resource access validation

### Security Tests
- Permission bypass attempts
- Unauthorized access attempts
- Audit log integrity

## Monitoring and Maintenance

1. **Audit Log Review**: Regular review of security events
2. **Permission Audits**: Periodic review of user permissions
3. **Role Cleanup**: Remove expired or unused roles
4. **Performance Monitoring**: Track permission check performance

## Future Enhancements

1. **Dynamic Permissions**: Runtime permission creation
2. **Permission Inheritance**: Hierarchical permission structures
3. **Conditional Permissions**: Context-aware permission checking
4. **API Rate Limiting**: Permission-based rate limiting
5. **Multi-tenant Support**: Tenant-specific permissions

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check user roles and permissions
2. **Resource Access Denied**: Verify ownership or manage permissions
3. **Audit Log Missing**: Ensure audit interceptor is applied
4. **Migration Issues**: Check database constraints and foreign keys

### Debug Commands

```bash
# Check user permissions
curl -H "Authorization: Bearer <token>" /rbac/permissions/user/<userId>

# Check user roles
curl -H "Authorization: Bearer <token>" /rbac/roles/user/<userId>

# View audit logs
curl -H "Authorization: Bearer <token>" /rbac/audit-logs
```

## Support

For issues or questions regarding the RBAC implementation, please refer to:
- Code documentation in service files
- Test cases for usage examples
- Audit logs for security event tracking
