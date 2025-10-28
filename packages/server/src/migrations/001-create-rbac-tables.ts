import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRbacTables1700000000001 implements MigrationInterface {
  name = 'CreateRbacTables1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'enum',
            enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'],
          },
          {
            name: 'resource',
            type: 'enum',
            enum: ['USER', 'LISTING', 'TRANSACTION', 'ADMIN', 'CHAT', 'ASSISTANT', 'LOGS', 'SYSTEM'],
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create roles table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isSystem',
            type: 'boolean',
            default: false,
          },
          {
            name: 'priority',
            type: 'integer',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create user_roles table
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'roleId',
            type: 'uuid',
          },
          {
            name: 'assignedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create role_permissions junction table
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'roleId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'permissionId',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    // Create audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
          },
          {
            name: 'resource',
            type: 'varchar',
          },
          {
            name: 'resourceId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'details',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "user_roles" 
      ADD CONSTRAINT "FK_user_roles_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_roles" 
      ADD CONSTRAINT "FK_user_roles_role" 
      FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions" 
      ADD CONSTRAINT "FK_role_permissions_role" 
      FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions" 
      ADD CONSTRAINT "FK_role_permissions_permission" 
      FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE
    `);

    // Add indexes for performance
    await queryRunner.createIndex('user_roles', new TableIndex({
      name: 'IDX_user_roles_user_role',
      columnNames: ['userId', 'roleId'],
      isUnique: true
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_user',
      columnNames: ['userId']
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_action',
      columnNames: ['action']
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_resource',
      columnNames: ['resource']
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_created',
      columnNames: ['createdAt']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('audit_logs');
    await queryRunner.dropTable('role_permissions');
    await queryRunner.dropTable('user_roles');
    await queryRunner.dropTable('roles');
    await queryRunner.dropTable('permissions');
  }
}
