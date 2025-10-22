import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
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

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {  
    return {
      type: 'postgres',
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: this.configService.get<number>('DATABASE_PORT', 5432),
      username: this.configService.get<string>('DATABASE_USERNAME'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      database: this.configService.get<string>('DATABASE_NAME'),
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
      ],
      synchronize: this.configService.get<string>('NODE_ENV') === 'development',
      logging: this.configService.get<string>('NODE_ENV') === 'development' ? ['error'] : false,
      migrations: ['dist/migrations/*{.ts,.js}'],
      migrationsTableName: 'migrations',
    };
  }
}
