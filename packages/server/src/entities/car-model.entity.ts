import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CarMake } from './car-make.entity';

@Entity('car_models')
export class CarModel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  sortOrder!: number;

  @Column('text', { array: true, default: [] })
  bodyStyles!: string[];

  @Column({ type: 'varchar', length: 64, nullable: true })
  defaultBodyStyle!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => CarMake, (make) => make.models, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'makeId' })
  make!: CarMake;

  @Column()
  makeId!: string;
}
