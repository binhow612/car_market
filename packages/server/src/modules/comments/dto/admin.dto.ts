import { IsEnum, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReportReason } from '../../../entities/comment-report.entity';

export class ReviewReportDto {
  @ApiProperty({ 
    description: 'Admin decision', 
    enum: ['resolved', 'dismissed'] 
  })
  @IsEnum(['resolved', 'dismissed'])
  decision!: 'resolved' | 'dismissed';

  @ApiProperty({ 
    description: 'Admin notes', 
    required: false,
    maxLength: 500 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}

export class ReportedCommentsQueryDto {
  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Number of reports per page', default: 20, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ 
    description: 'Filter by status', 
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['pending', 'reviewed', 'resolved', 'dismissed'])
  status?: string;

  @ApiProperty({ 
    description: 'Filter by reason', 
    enum: ReportReason,
    required: false 
  })
  @IsOptional()
  @IsEnum(ReportReason)
  reason?: ReportReason;
}
