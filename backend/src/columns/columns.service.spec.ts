import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, jest } from 'bun:test';
import { ColumnsService } from './columns.service';
import { BoardColumn } from './entities/board-column.entity';
import { Board } from '../boards/entities/board.entity';

describe('ColumnsService', () => {
  let service: ColumnsService;
  let columnRepository: Repository<BoardColumn>;
  let boardRepository: Repository<Board>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColumnsService,
        {
          provide: getRepositoryToken(BoardColumn),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn((dto: Partial<BoardColumn>) => dto),
            preload: jest.fn((dto: Partial<BoardColumn>) =>
              Promise.resolve(dto),
            ),
            save: jest.fn((entity: Partial<BoardColumn>) =>
              Promise.resolve({ id: 1, ...entity }),
            ),
            softRemove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(Board),
          useValue: { findOne: jest.fn() },
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<ColumnsService>(ColumnsService);
    columnRepository = module.get<Repository<BoardColumn>>(
      getRepositoryToken(BoardColumn),
    );
    boardRepository = module.get<Repository<Board>>(getRepositoryToken(Board));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createForUser', () => {
    it('appends after the last column (last.position + 1024)', async () => {
      (boardRepository.findOne as jest.Mock).mockResolvedValue({ id: 5 });
      (columnRepository.findOne as jest.Mock).mockResolvedValue({
        position: 1024,
      });

      await service.createForUser({ title: 'Doing', boardId: 5 }, 7);

      expect(columnRepository.create).toHaveBeenCalledWith({
        title: 'Doing',
        boardId: 5,
        position: 2048,
      });
    });

    it('uses the base step for the first column in an empty board', async () => {
      (boardRepository.findOne as jest.Mock).mockResolvedValue({ id: 5 });
      (columnRepository.findOne as jest.Mock).mockResolvedValue(null);

      await service.createForUser({ title: 'To Do', boardId: 5 }, 7);

      expect(columnRepository.create).toHaveBeenCalledWith({
        title: 'To Do',
        boardId: 5,
        position: 1024,
      });
    });

    it('throws NotFoundException when the board is not owned', async () => {
      (boardRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.createForUser({ title: 'x', boardId: 5 }, 7),
      ).rejects.toThrow(NotFoundException);
      expect(columnRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('move', () => {
    it('persists the new position on an owned column', async () => {
      const column = { id: 1, position: 1024 } as unknown as BoardColumn;
      (columnRepository.findOne as jest.Mock).mockResolvedValue(column);

      await service.move(1, 1536, 7);

      const saved = (columnRepository.save as jest.Mock).mock
        .calls[0][0] as BoardColumn;
      expect(saved.position).toBe(1536);
    });

    it('throws NotFoundException when the column is not owned', async () => {
      (columnRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.move(1, 1536, 7)).rejects.toThrow(NotFoundException);
      expect(columnRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeForUser', () => {
    it('soft-removes the column with its cards loaded for the cascade', async () => {
      const column = { id: 1, cards: [{ id: 9 }] } as unknown as BoardColumn;
      (columnRepository.findOne as jest.Mock).mockResolvedValue(column);

      await service.removeForUser(1, 7);

      expect(columnRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, board: { userId: 7 } },
        relations: { cards: true },
      });
      expect(columnRepository.softRemove).toHaveBeenCalledWith(column);
    });

    it('throws NotFoundException when the column is not owned', async () => {
      (columnRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.removeForUser(1, 7)).rejects.toThrow(
        NotFoundException,
      );
      expect(columnRepository.softRemove).not.toHaveBeenCalled();
    });
  });

  describe('updateForUser', () => {
    it('checks ownership then updates the title', async () => {
      (columnRepository.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      await service.updateForUser(1, { title: 'Renamed' }, 7);

      expect(columnRepository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when the column is not owned', async () => {
      (columnRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.updateForUser(1, { title: 'x' }, 7)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
