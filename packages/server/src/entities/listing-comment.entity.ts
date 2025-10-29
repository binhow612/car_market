import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { ListingDetail } from './listing-detail.entity';
import { CommentReaction } from './comment-reaction.entity';
import { CommentReport } from './comment-report.entity';

@Entity('listing_comments')
@Index(['listingId'])
@Index(['userId'])
@Index(['parentCommentId'])
@Index(['createdAt'])
@Index(['isDeleted'])
@Index(['isPinned'])
export class ListingComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  listingId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  parentCommentId?: string;

  @Column('text')
  content!: string;

  @Column({ default: false })
  isEdited!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  editedAt?: Date;

  @Column({ default: false })
  isDeleted!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  deletedBy?: string;

  @Column({ default: 0 })
  reactionCount!: number;

  @Column({ default: 0 })
  replyCount!: number;

  @Column({ default: false })
  isPinned!: boolean;

  @Column({ default: false })
  isReported!: boolean;

  @Column({ default: 0 })
  reportCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => ListingDetail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listingId' })
  listing!: ListingDetail;

  @ManyToOne(() => ListingComment, (comment) => comment.replies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment?: ListingComment;

  @OneToMany(() => ListingComment, (comment) => comment.parentComment)
  replies!: ListingComment[];

  @OneToMany(() => CommentReaction, (reaction) => reaction.comment)
  reactions!: CommentReaction[];

  @OneToMany(() => CommentReport, (report) => report.comment)
  reports!: CommentReport[];

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'deletedBy' })
  deletedByUser?: User;

  // Virtual properties
  get isOwner(): boolean {
    return this.userId === this.user?.id;
  }

  get canEdit(): boolean {
    if (!this.isOwner) return false;
    if (this.isDeleted) return false;
    
    // Can edit within 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.createdAt > twentyFourHoursAgo;
  }

  get canDelete(): boolean {
    if (this.isDeleted) return false;
    return this.isOwner;
  }

  get canSellerDelete(): boolean {
    if (this.isDeleted) return false;
    return true; // Seller can delete any comment on their listing
  }

  get canAdminDelete(): boolean {
    if (this.isDeleted) return false;
    return true; // Admin can delete any comment
  }

  get nestingLevel(): number {
    let level = 0;
    let current = this.parentComment;
    while (current && level < 3) {
      level++;
      current = current.parentComment;
    }
    return level;
  }

  get canReply(): boolean {
    return this.nestingLevel < 2; // Max 3 levels: comment -> reply -> reply
  }
}

