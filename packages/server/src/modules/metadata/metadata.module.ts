import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { CarMake } from '../../entities/car-make.entity';
import { CarModel } from '../../entities/car-model.entity';
import { CarMetadata } from '../../entities/car-metadata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CarMake, CarModel, CarMetadata])],
  controllers: [MetadataController],
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
