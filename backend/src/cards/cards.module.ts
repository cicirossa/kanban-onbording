import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { Card } from './entities/card.entity';
import { BoardColumn } from '../columns/entities/board-column.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card, BoardColumn])],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
