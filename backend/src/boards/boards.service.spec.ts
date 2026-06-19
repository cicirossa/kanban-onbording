import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, jest } from 'bun:test';
import { BoardsService } from './boards.service';
import { Board } from './entities/board.entity';

describe('BoardsService', () => {
  let service: BoardsService;
  let boardRepository: Repository<Board>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        {
          provide: getRepositoryToken(Board),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn((dto: Partial<Board>) => dto),
            preload: jest.fn((dto: Partial<Board>) => Promise.resolve(dto)),
            save: jest.fn((entity: Partial<Board>) =>
              Promise.resolve({ id: 1, ...entity }),
            ),
            softRemove: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
    boardRepository = module.get<Repository<Board>>(getRepositoryToken(Board));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForUser', () => {
    it('scopes the query to the owner and orders by newest first', async () => {
      await service.findAllForUser(7);
      expect(boardRepository.find).toHaveBeenCalledWith({
        where: { userId: 7 },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOneForUser', () => {
    it('returns the board hydrated with ordered columns and cards', async () => {
      const board = { id: 1, userId: 7, columns: [] } as unknown as Board;
      (boardRepository.findOne as jest.Mock).mockResolvedValue(board);

      const result = await service.findOneForUser(1, 7);

      expect(boardRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 7 },
        relations: { columns: { cards: true } },
        order: { columns: { position: 'ASC', cards: { position: 'ASC' } } },
      });
      expect(result).toBe(board);
    });

    it('throws NotFoundException when not owned or missing', async () => {
      (boardRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOneForUser(1, 7)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createForUser', () => {
    it('persists the board stamped with the owner id', async () => {
      const result = await service.createForUser(
        { title: 'Roadmap', description: 'Q3' },
        7,
      );

      expect(boardRepository.create).toHaveBeenCalledWith({
        title: 'Roadmap',
        description: 'Q3',
        userId: 7,
      });
      expect(boardRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject({ title: 'Roadmap', userId: 7 });
    });
  });

  describe('updateForUser', () => {
    it('checks ownership before updating', async () => {
      const board = { id: 1, userId: 7, columns: [] } as unknown as Board;
      (boardRepository.findOne as jest.Mock).mockResolvedValue(board);

      await service.updateForUser(1, { title: 'Renamed' }, 7);

      // findOneForUser (ownership) + BaseService.update preload both hit findOne.
      expect(boardRepository.findOne).toHaveBeenCalled();
      expect(boardRepository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when the board is not owned', async () => {
      (boardRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.updateForUser(1, { title: 'x' }, 7)).rejects.toThrow(
        NotFoundException,
      );
      expect(boardRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('removeForUser', () => {
    it('soft-removes the eager-loaded board so the cascade fires', async () => {
      const board = {
        id: 1,
        userId: 7,
        columns: [{ id: 2, cards: [] }],
      } as unknown as Board;
      (boardRepository.findOne as jest.Mock).mockResolvedValue(board);

      await service.removeForUser(1, 7);

      // The board passed to softRemove must carry its columns/cards in memory.
      expect(boardRepository.softRemove).toHaveBeenCalledWith(board);
    });

    it('throws NotFoundException when the board is not owned', async () => {
      (boardRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.removeForUser(1, 7)).rejects.toThrow(
        NotFoundException,
      );
      expect(boardRepository.softRemove).not.toHaveBeenCalled();
    });
  });
});
