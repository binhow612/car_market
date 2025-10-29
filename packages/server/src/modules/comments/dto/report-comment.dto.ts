import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportReason } from '../../../entities/comment-report.entity';

export class ReportCommentDto {
  @ApiProperty({ 
    description: 'Reason for reporting', 
    enum: ReportReason 
  })
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiProperty({ 
    description: 'Additional description', 
    required: false,
    maxLength: 500 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}
