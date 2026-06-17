import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { BoardColumn } from '../columns/entities/board-column.entity';
import { BaseService } from '../common/services/base.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { MoveCardDto } from './dto/move-card.dto';

const POSITION_STEP = 1024;

@Injectable()
export class CardsService extends BaseService<Card> {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(BoardColumn)
    private readonly columnRepository: Repository<BoardColumn>,
  ) {
    super(cardRepository, 'Card', ['title', 'description']);
  }

  /** Assert a column belongs to the user (via its board), throwing 404. */
  private async assertColumnOwned(columnId: number, userId: number) {
    const column = await this.columnRepository.findOne({
      where: { id: columnId, board: { userId } },
    });
    if (!column) {
      throw new NotFoundException(`Column #${columnId} not found`);
    }
  }

  private async findOwned(id: number, userId: number): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id, column: { board: { userId } } },
    });
    if (!card) {
      throw new NotFoundException(`Card #${id} not found`);
    }
    return card;
  }

  async createForUser(dto: CreateCardDto, userId: number): Promise<Card> {
    await this.assertColumnOwned(dto.columnId, userId);
    const position = dto.position ?? (await this.nextPosition(dto.columnId));
    return this.create({
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      priority: dto.priority,
      columnId: dto.columnId,
      position,
    });
  }

  async updateForUser(
    id: number,
    dto: UpdateCardDto,
    userId: number,
  ): Promise<Card> {
    await this.findOwned(id, userId);
    return this.update(id, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });
  }

  async removeForUser(id: number, userId: number): Promise<void> {
    await this.findOwned(id, userId);
    return this.remove(id);
  }

  async move(id: number, dto: MoveCardDto, userId: number): Promise<Card> {
    const card = await this.findOwned(id, userId);
    await this.assertColumnOwned(dto.columnId, userId);
    card.columnId = dto.columnId;
    card.position = dto.position;
    return this.cardRepository.save(card);
  }

  /** Position just past the last card in a column. */
  private async nextPosition(columnId: number): Promise<number> {
    const last = await this.cardRepository.findOne({
      where: { columnId },
      order: { position: 'DESC' },
    });
    return (last?.position ?? 0) + POSITION_STEP;
  }
}
