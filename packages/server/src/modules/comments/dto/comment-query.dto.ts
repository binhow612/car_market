import { IsOptional, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CommentQueryDto {
  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Number of comments per page', default: 20, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ 
    description: 'Sort order', 
    enum: ['newest', 'oldest', 'popular'], 
    default: 'newest',
    required: false 
  })
  @IsOptional()
  @IsEnum(['newest', 'oldest', 'popular'])
  sortBy?: 'newest' | 'oldest' | 'popular' = 'newest';

  @ApiProperty({ description: 'Parent comment ID for fetching replies', required: false })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
