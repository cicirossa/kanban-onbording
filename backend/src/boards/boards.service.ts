import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { BaseService } from '../common/services/base.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService extends BaseService<Board> {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {
    super(boardRepository, 'Board', ['title', 'description']);
  }

  /** List every board owned by the user (lightweight — no nested relations). */
  findAllForUser(userId: number): Promise<Board[]> {
    return this.boardRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Single board fully hydrated with ordered columns and their cards. */
  async findOneForUser(id: number, userId: number): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id, userId },
      relations: { columns: { cards: true } },
      order: {
        columns: { position: 'ASC', cards: { position: 'ASC' } },
      },
    });
    if (!board) {
      throw new NotFoundException(`Board #${id} not found`);
    }
    return board;
  }

  createForUser(dto: CreateBoardDto, userId: number): Promise<Board> {
    return this.create({ ...dto, userId });
  }

  async updateForUser(
    id: number,
    dto: UpdateBoardDto,
    userId: number,
  ): Promise<Board> {
    await this.findOneForUser(id, userId);
    return this.update(id, dto);
  }

  async removeForUser(id: number, userId: number): Promise<void> {
    // softRemove only cascades to relations loaded in memory, so eager-load the
    // tree before deleting (see base.service.ts remove()).
    const board = await this.findOneForUser(id, userId);
    await this.boardRepository.softRemove(board);
  }
}
