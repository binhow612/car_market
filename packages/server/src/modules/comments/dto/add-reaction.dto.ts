import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '../../../entities/comment-reaction.entity';

export class AddReactionDto {
  @ApiProperty({ 
    description: 'Type of reaction', 
    enum: ReactionType 
  })
  @IsEnum(ReactionType)
  reactionType!: ReactionType;
}
