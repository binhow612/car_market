import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ListingDetail } from './listing-detail.entity';
import { Transaction } from './transaction.entity';
import { UserRole } from './user-role.entity';

// Keep legacy enum for backward compatibility during migration
export enum LegacyUserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum OAuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password?: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, type: 'date' })
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: LegacyUserRole,
    default: LegacyUserRole.USER,
    nullable: true, // Make nullable for migration
  })
  role?: LegacyUserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true })
  passwordResetExpires?: Date;

  @Column({
    type: 'enum',
    enum: OAuthProvider,
    default: OAuthProvider.LOCAL,
  })
  provider: OAuthProvider;

  @Column({ nullable: true })
  providerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => ListingDetail, (listing) => listing.seller)
  listings: ListingDetail[];

  @OneToMany(() => Transaction, (transaction) => transaction.seller)
  sales: Transaction[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
