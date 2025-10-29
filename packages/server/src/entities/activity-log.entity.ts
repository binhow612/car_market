import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  DEBUG = 'debug',
}

export enum LogCategory {
  USER_ACTION = 'user_action',
  LISTING_ACTION = 'listing_action',
  ADMIN_ACTION = 'admin_action',
  SYSTEM_EVENT = 'system_event',
  AUTHENTICATION = 'authentication',
  PAYMENT = 'payment',
  CHAT = 'chat',
  FAVORITE = 'favorite',
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level!: LogLevel;

  @Column({
    type: 'enum',
    enum: LogCategory,
  })
  category!: LogCategory;

  @Column({ type: 'varchar', length: 255, nullable: true })
  message!: string | null;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  targetUserId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  listingId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  conversationId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'targetUserId' })
  targetUser!: User | null;
}
