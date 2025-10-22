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
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column('text', { array: true, default: [] })
  bodyStyles: string[];

  @Column({ nullable: true })
  defaultBodyStyle: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => CarMake, (make) => make.models, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'makeId' })
  make: CarMake;

  @Column()
  makeId: string;
}
