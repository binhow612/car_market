import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { CarDetail } from '../entities/car-detail.entity';
import { CarImage } from '../entities/car-image.entity';
import { ListingDetail } from '../entities/listing-detail.entity';
import { Transaction } from '../entities/transaction.entity';
import { CarMake } from '../entities/car-make.entity';
import { CarModel } from '../entities/car-model.entity';
import { CarMetadata } from '../entities/car-metadata.entity';
import { Favorite } from '../entities/favorite.entity';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ListingPendingChanges } from '../entities/listing-pending-changes.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { FAQ } from '../entities/faq.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { AuditLog } from '../entities/audit-log.entity';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [
    User,
    CarDetail,
    CarImage,
    ListingDetail,
    Transaction,
    CarMake,
    CarModel,
    CarMetadata,
    Favorite,
    ChatConversation,
    ChatMessage,
    ListingPendingChanges,
    ActivityLog,
    FAQ,
    Permission,
    Role,
    UserRole,
    AuditLog,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['error'] : false,
});
