import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':listingId')
  addToFavorites(
    @CurrentUser() user: User,
    @Param('listingId') listingId: string,
  ) {
    return this.favoritesService.addToFavorites(user.id, listingId);
  }

  @Delete(':listingId')
  removeFromFavorites(
    @CurrentUser() user: User,
    @Param('listingId') listingId: string,
  ) {
    return this.favoritesService.removeFromFavorites(user.id, listingId);
  }

  @Get()
  getUserFavorites(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.favoritesService.getUserFavorites(user.id, page, limit);
  }

  @Get('check/:listingId')
  checkIfFavorite(
    @CurrentUser() user: User,
    @Param('listingId') listingId: string,
  ) {
    return this.favoritesService.checkIfFavorite(user.id, listingId);
  }
}
