import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ListingComment } from './listing-comment.entity';
import { User } from './user.entity';

export enum ReactionType {
  LIKE = 'like',
  HELPFUL = 'helpful',
  DISLIKE = 'dislike',
}

@Entity('comment_reactions')
@Index(['commentId'])
@Index(['userId'])
@Index(['reactionType'])
export class CommentReaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  commentId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: ReactionType,
  })
  reactionType!: ReactionType;

  @CreateDateColumn()
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => ListingComment, (comment) => comment.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentId' })
  comment!: ListingComment;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
