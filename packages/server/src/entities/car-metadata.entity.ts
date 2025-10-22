import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MetadataType {
  FUEL_TYPE = 'fuel_type',
  TRANSMISSION_TYPE = 'transmission_type',
  BODY_TYPE = 'body_type',
  CONDITION = 'condition',
  PRICE_TYPE = 'price_type',
  CAR_FEATURE = 'car_feature',
  COLOR = 'color',
}

@Entity('car_metadata')
export class CarMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MetadataType,
  })
  type: MetadataType;

  @Column()
  value: string;

  @Column({ nullable: true })
  displayValue: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
