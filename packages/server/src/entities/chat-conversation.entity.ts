import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { ListingDetail } from './listing-detail.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_conversations')
@Unique(['buyerId', 'sellerId', 'listingId'])
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastMessage!: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt!: Date;

  @Column({ default: false })
  isBuyerTyping!: boolean;

  @Column({ default: false })
  isSellerTyping!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'buyerId' })
  buyer!: User;

  @Column({ type: 'uuid' })
  buyerId!: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sellerId' })
  seller!: User;

  @Column({ type: 'uuid' })
  sellerId!: string;

  @ManyToOne(() => ListingDetail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listingId' })
  listing!: ListingDetail;

  @Column({ type: 'uuid' })
  listingId!: string;

  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages!: ChatMessage[];
}
