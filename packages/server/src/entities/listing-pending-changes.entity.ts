import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ListingDetail } from './listing-detail.entity';
import { User } from './user.entity';

@Entity('listing_pending_changes')
export class ListingPendingChanges {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  listingId: string;

  @Column()
  changedByUserId: string;

  @Column('jsonb')
  changes: Record<string, any>; // Store the changed fields and their new values

  @Column('jsonb', { nullable: true })
  originalValues: Record<string, any>; // Store the original values for comparison

  @Column({ default: false })
  isApplied: boolean; // Whether these changes have been applied after approval

  @Column({ nullable: true })
  appliedAt: Date;

  @Column({ nullable: true })
  appliedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => ListingDetail, (listing) => listing.pendingChanges, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listingId' })
  listing: ListingDetail;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'changedByUserId' })
  changedBy: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appliedByUserId' })
  appliedBy: User;
}

