import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import type { IAuthRequest } from '../auth/interfaces/auth-request.interface';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { Card } from './entities/card.entity';

@ApiTags('Cards')
@ApiBearerAuth()
@Controller('cards')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @Permissions('cards.create')
  @ApiOperation({ summary: 'Create a new card' })
  @ApiResponse({ status: 201, type: Card })
  @UseInterceptors(NoFilesInterceptor())
  create(@Body() dto: CreateCardDto, @Req() req: IAuthRequest) {
    return this.cardsService.createForUser(dto, req.user.userId);
  }

  @Patch(':id/move')
  @Permissions('cards.update')
  @ApiOperation({ summary: 'Move a card to a column and/or new position' })
  @ApiResponse({ status: 200, type: Card })
  @UseInterceptors(NoFilesInterceptor())
  move(
    @Param('id') id: string,
    @Body() dto: MoveCardDto,
    @Req() req: IAuthRequest,
  ) {
    return this.cardsService.move(+id, dto, req.user.userId);
  }

  @Patch(':id')
  @Permissions('cards.update')
  @ApiOperation({ summary: 'Update a card' })
  @ApiResponse({ status: 200, type: Card })
  @UseInterceptors(NoFilesInterceptor())
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
    @Req() req: IAuthRequest,
  ) {
    return this.cardsService.updateForUser(+id, dto, req.user.userId);
  }

  @Delete(':id')
  @Permissions('cards.delete')
  @ApiOperation({ summary: 'Delete a card' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string, @Req() req: IAuthRequest) {
    return this.cardsService.removeForUser(+id, req.user.userId);
  }
}
