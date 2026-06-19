import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardColumn } from './entities/board-column.entity';
import { Board } from '../boards/entities/board.entity';
import { BaseService } from '../common/services/base.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

const POSITION_STEP = 1024;

@Injectable()
export class ColumnsService extends BaseService<BoardColumn> {
  constructor(
    @InjectRepository(BoardColumn)
    private readonly columnRepository: Repository<BoardColumn>,
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {
    super(columnRepository, 'Column', ['title']);
  }

  /** Assert a board belongs to the user, throwing 404 otherwise. */
  private async assertBoardOwned(boardId: number, userId: number) {
    const board = await this.boardRepository.findOne({
      where: { id: boardId, userId },
    });
    if (!board) {
      throw new NotFoundException(`Board #${boardId} not found`);
    }
  }

  /** Fetch a column scoped to the owner via its board. */
  private async findOwned(id: number, userId: number): Promise<BoardColumn> {
    const column = await this.columnRepository.findOne({
      where: { id, board: { userId } },
    });
    if (!column) {
      throw new NotFoundException(`Column #${id} not found`);
    }
    return column;
  }

  async findAllForBoard(
    boardId: number,
    userId: number,
  ): Promise<BoardColumn[]> {
    await this.assertBoardOwned(boardId, userId);
    return this.columnRepository.find({
      where: { boardId },
      relations: { cards: true },
      order: { position: 'ASC', cards: { position: 'ASC' } },
    });
  }

  async createForUser(
    dto: CreateColumnDto,
    userId: number,
  ): Promise<BoardColumn> {
    await this.assertBoardOwned(dto.boardId, userId);
    const position = dto.position ?? (await this.nextPosition(dto.boardId));
    return this.create({
      title: dto.title,
      boardId: dto.boardId,
      position,
    });
  }

  async updateForUser(
    id: number,
    dto: UpdateColumnDto,
    userId: number,
  ): Promise<BoardColumn> {
    await this.findOwned(id, userId);
    return this.update(id, dto);
  }

  async removeForUser(id: number, userId: number): Promise<void> {
    // Eager-load cards so softRemove cascades the soft-delete.
    const column = await this.columnRepository.findOne({
      where: { id, board: { userId } },
      relations: { cards: true },
    });
    if (!column) {
      throw new NotFoundException(`Column #${id} not found`);
    }
    await this.columnRepository.softRemove(column);
  }

  async move(
    id: number,
    position: number,
    userId: number,
  ): Promise<BoardColumn> {
    const column = await this.findOwned(id, userId);
    column.position = position;
    return this.columnRepository.save(column);
  }

  /** Position just past the last column in a board. */
  private async nextPosition(boardId: number): Promise<number> {
    const last = await this.columnRepository.findOne({
      where: { boardId },
      order: { position: 'DESC' },
    });
    return (last?.position ?? 0) + POSITION_STEP;
  }
}
