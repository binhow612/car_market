import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CarDetail } from './car-detail.entity';

export enum ImageType {
  EXTERIOR = 'exterior',
  INTERIOR = 'interior',
  ENGINE = 'engine',
  DOCUMENT = 'document',
  OTHER = 'other',
}

@Entity('car_images')
export class CarImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  filename!: string;

  @Column()
  originalName!: string;

  @Column()
  url!: string;

  @Column({
    type: 'enum',
    enum: ImageType,
    default: ImageType.EXTERIOR,
  })
  type!: ImageType;

  @Column({ default: 0 })
  sortOrder!: number;

  @Column({ default: false })
  isPrimary!: boolean;

  @Column({ type: 'bigint', nullable: true })
  fileSize!: number | null; // in bytes

  @Column({ type: 'varchar', length: 255, nullable: true })
  mimeType!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alt!: string | null; // Alt text for accessibility

  @CreateDateColumn()
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => CarDetail, (carDetail) => carDetail.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'carDetailId' })
  carDetail!: CarDetail;

  @Column()
  carDetailId!: string;
}
