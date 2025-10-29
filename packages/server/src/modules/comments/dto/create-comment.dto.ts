import { IsString, IsUUID, IsOptional, MinLength, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'ID of the listing to comment on' })
  @IsUUID()
  listingId!: string;

  @ApiProperty({ description: 'Comment content', minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(2000, { message: 'Comment content cannot exceed 2000 characters' })
  content!: string;

  @ApiProperty({ description: 'Parent comment ID for replies', required: false })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ description: 'Updated comment content', minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1, { message: 'Comment content cannot be empty' })
  @MaxLength(2000, { message: 'Comment content cannot exceed 2000 characters' })
  content!: string;
}

export class CommentQueryDto {
  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Number of comments per page', default: 20, required: false })
  @IsOptional()
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
