# RBAC Migration Guide

## Overview

This guide explains how to migrate existing controllers and services from the simple role-based system to the new comprehensive RBAC system.

## Migration Steps

### 1. Update Imports

Replace old imports with new RBAC imports:

```typescript
// OLD
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../entities/user.entity';

// NEW
import { RequirePermission } from '../common/decorators/permission.decorator';
import { RequireResource, RequireOwnership } from '../common/decorators/resource.decorator';
import { PermissionGuard } from '../common/guards/permission.guard';
import { ResourceGuard } from '../common/guards/resource.guard';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
```

### 2. Update Controller Guards

Replace the old role-based guards with new permission-based guards:

```typescript
// OLD
@Controller('example')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExampleController {

// NEW
@Controller('example')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class ExampleController {
```

### 3. Update Method Decorators

Replace `@Roles()` decorators with `@RequirePermission()`:

```typescript
// OLD
@Roles(LegacyUserRole.ADMIN)
@UseGuards(RolesGuard)

// NEW
@RequirePermission('admin:users')
@UseGuards(PermissionGuard)
```

### 4. Add Resource-Based Access Control

For methods that need resource ownership validation:

```typescript
// OLD
@Put(':id')
@Roles(LegacyUserRole.USER)
update(@Param('id') id: string, @Body() updateDto: UpdateDto) {
  // No ownership validation
}

// NEW
@Put(':id')
@RequirePermission('listing:update')
@RequireResource('LISTING')
@RequireOwnership()
update(@Param('id') id: string, @Body() updateDto: UpdateDto) {
  // Automatic ownership validation
}
```

### 5. Update Service Methods

Add permission checking to service methods:

```typescript
// OLD
async updateListing(id: string, updateDto: UpdateListingDto, userId: string) {
  // Simple user check
  const listing = await this.findListing(id);
  if (listing.userId !== userId) {
    throw new ForbiddenException('Not your listing');
  }
  // Update logic...
}

// NEW
async updateListing(id: string, updateDto: UpdateListingDto, userId: string) {
  // Permission check is handled by guards
  // Resource access is validated automatically
  // Update logic...
}
```

## Permission Mapping

### Common Permission Mappings

| Old Role | New Permission | Description |
|----------|----------------|-------------|
| `LegacyUserRole.ADMIN` | `admin:users` | User management |
| `LegacyUserRole.ADMIN` | `admin:listings` | Listing management |
| `LegacyUserRole.ADMIN` | `admin:logs` | System logs access |
| `LegacyUserRole.USER` | `listing:create` | Create listings |
| `LegacyUserRole.USER` | `listing:read` | Read listings |
| `LegacyUserRole.USER` | `listing:update` | Update own listings |
| `LegacyUserRole.USER` | `listing:delete` | Delete own listings |

### Resource-Based Permissions

| Resource | Permissions | Description |
|----------|-------------|-------------|
| `USER` | `user:create`, `user:read`, `user:update`, `user:delete`, `user:manage` | User management |
| `LISTING` | `listing:create`, `listing:read`, `listing:update`, `listing:delete`, `listing:manage` | Listing management |
| `TRANSACTION` | `transaction:create`, `transaction:read`, `transaction:update`, `transaction:manage` | Transaction management |
| `ADMIN` | `admin:dashboard`, `admin:users`, `admin:listings`, `admin:logs` | Admin functions |
| `CHAT` | `chat:send`, `chat:read`, `chat:moderate` | Chat functionality |
| `ASSISTANT` | `assistant:use`, `assistant:configure` | Virtual assistant |
| `LOGS` | `system:logs` | System logs |
| `SYSTEM` | `system:manage` | System management |

## Migration Examples

### Example 1: User Controller

```typescript
// OLD
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  
  @Get()
  @Roles(LegacyUserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Put(':id')
  @Roles(LegacyUserRole.USER)
  update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(id, updateDto);
  }
}

// NEW
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class UsersController {
  
  @Get()
  @RequirePermission('admin:users')
  findAll() {
    return this.usersService.findAll();
  }

  @Put(':id')
  @RequirePermission('user:update')
  @RequireResource('USER')
  @RequireOwnership()
  update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(id, updateDto);
  }
}
```

### Example 2: Admin Controller

```typescript
// OLD
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Get('dashboard')
  @Roles(LegacyUserRole.ADMIN)
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Delete('users/:id')
  @Roles(LegacyUserRole.ADMIN)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}

// NEW
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class AdminController {
  
  @Get('dashboard')
  @RequirePermission('admin:dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Delete('users/:id')
  @RequirePermission('user:delete')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
```

### Example 3: Listing Controller

```typescript
// OLD
@Controller('listings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListingsController {
  
  @Post()
  @Roles(LegacyUserRole.USER)
  create(@Body() createDto: CreateListingDto) {
    return this.listingsService.create(createDto);
  }

  @Put(':id')
  @Roles(LegacyUserRole.USER)
  update(@Param('id') id: string, @Body() updateDto: UpdateListingDto) {
    return this.listingsService.update(id, updateDto);
  }
}

// NEW
@Controller('listings')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class ListingsController {
  
  @Post()
  @RequirePermission('listing:create')
  create(@Body() createDto: CreateListingDto) {
    return this.listingsService.create(createDto);
  }

  @Put(':id')
  @RequirePermission('listing:update')
  @RequireResource('LISTING')
  @RequireOwnership()
  update(@Param('id') id: string, @Body() updateDto: UpdateListingDto) {
    return this.listingsService.update(id, updateDto);
  }
}
```

## Testing Migration

### 1. Unit Tests

Update test files to use new permission system:

```typescript
// OLD
describe('UsersController', () => {
  it('should allow admin to get all users', () => {
    const adminUser = { role: LegacyUserRole.ADMIN };
    // Test logic...
  });
});

// NEW
describe('UsersController', () => {
  it('should allow admin to get all users', async () => {
    const adminUser = { id: 'admin-id' };
    const hasPermission = await permissionService.hasPermission('admin-id', 'admin:users');
    expect(hasPermission).toBe(true);
  });
});
```

### 2. Integration Tests

Update integration tests to use new guards:

```typescript
// OLD
it('should protect admin routes', () => {
  return request(app.getHttpServer())
    .get('/admin/dashboard')
    .expect(403);
});

// NEW
it('should protect admin routes', () => {
  return request(app.getHttpServer())
    .get('/admin/dashboard')
    .expect(403);
});
```

## Rollback Plan

If issues arise during migration:

1. **Database Rollback**: Run the migration down command
2. **Code Rollback**: Revert to previous commit
3. **Gradual Migration**: Migrate one controller at a time

### Rollback Commands

```bash
# Rollback database migration
npm run typeorm migration:revert

# Remove RBAC seed data
npm run typeorm query "DELETE FROM user_roles; DELETE FROM role_permissions; DELETE FROM roles; DELETE FROM permissions;"

# Revert code changes
git revert <commit-hash>
```

## Best Practices

### 1. Gradual Migration

- Migrate one controller at a time
- Test thoroughly after each migration
- Keep old system as fallback initially

### 2. Permission Design

- Use descriptive permission names
- Follow the pattern: `resource:action`
- Group related permissions logically

### 3. Resource Access

- Use `@RequireOwnership()` for user-owned resources
- Use `@RequireResource()` for resource-specific access
- Combine with appropriate permissions

### 4. Audit Logging

- Add `@UseInterceptors(AuditInterceptor)` to controllers
- Log important actions manually in services
- Review audit logs regularly

### 5. Testing

- Test permission scenarios thoroughly
- Test resource access validation
- Test audit logging functionality

## Common Issues and Solutions

### Issue 1: Permission Denied Errors

**Problem**: Users getting permission denied after migration

**Solution**: 
- Check user role assignments
- Verify permission mappings
- Run RBAC seed script

### Issue 2: Resource Access Denied

**Problem**: Users can't access their own resources

**Solution**:
- Check ownership validation logic
- Verify resource ID extraction
- Test with different user scenarios

### Issue 3: Audit Logs Missing

**Problem**: No audit logs being generated

**Solution**:
- Ensure `AuditInterceptor` is applied
- Check audit service configuration
- Verify database connection

### Issue 4: Performance Issues

**Problem**: Slow permission checks

**Solution**:
- Implement permission caching
- Optimize database queries
- Use connection pooling

## Support and Resources

- **Documentation**: See `RBAC_IMPLEMENTATION.md`
- **Examples**: Check `src/examples/` directory
- **Tests**: Run `npm test` for unit tests
- **Migration Scripts**: Use `npm run seed:rbac`

## Next Steps

After successful migration:

1. **Monitor Performance**: Track permission check performance
2. **Review Audit Logs**: Regular security event review
3. **Optimize Permissions**: Fine-tune permission structure
4. **Plan Phase 2**: Advanced RBAC features
5. **Documentation**: Update API documentation
