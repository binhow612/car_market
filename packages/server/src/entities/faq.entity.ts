import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('faqs')
@Index(['category'])
export class FAQ {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  category!: string;

  @Column({ type: 'text' })
  question!: string;

  @Column({ type: 'text' })
  answer!: string;

  @Column({ type: 'float8', array: true, nullable: true })
  embedding!: number[] | null;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'en',
  })
  language!: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  searchCount!: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
    nullable: true,
  })
  rating!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}


