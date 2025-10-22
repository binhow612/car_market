import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CarDetail } from './car-detail.entity';
import { Transaction } from './transaction.entity';
import { ListingPendingChanges } from './listing-pending-changes.entity';

export enum ListingStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SOLD = 'sold',
  INACTIVE = 'inactive',
}

export enum PriceType {
  FIXED = 'fixed',
  NEGOTIABLE = 'negotiable',
  AUCTION = 'auction',
}

@Entity('listing_details')
export class ListingDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: PriceType,
    default: PriceType.NEGOTIABLE,
  })
  priceType: PriceType;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.DRAFT,
  })
  status: ListingStatus;

  @Column()
  location: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  favoriteCount: number;

  @Column({ default: 0 })
  inquiryCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  soldAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.listings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  sellerId: string;

  @OneToOne(() => CarDetail, (carDetail) => carDetail.listing, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'carDetailId' })
  carDetail: CarDetail;

  @Column()
  carDetailId: string;

  @OneToMany(() => Transaction, (transaction) => transaction.listing)
  transactions: Transaction[];

  @OneToMany(
    () => ListingPendingChanges,
    (pendingChange) => pendingChange.listing,
  )
  pendingChanges: ListingPendingChanges[];

  // Virtual properties
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get isPending(): boolean {
    return this.status === ListingStatus.PENDING;
  }

  get isApproved(): boolean {
    return this.status === ListingStatus.APPROVED;
  }

  get isSold(): boolean {
    return this.status === ListingStatus.SOLD;
  }
}
