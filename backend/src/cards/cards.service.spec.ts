import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, jest } from 'bun:test';
import { CardsService } from './cards.service';
import { Card } from './entities/card.entity';
import { CardPriority } from './card-priority.enum';
import { BoardColumn } from '../columns/entities/board-column.entity';

describe('CardsService', () => {
  let service: CardsService;
  let cardRepository: Repository<Card>;
  let columnRepository: Repository<BoardColumn>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        {
          provide: getRepositoryToken(Card),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn((dto: Partial<Card>) => dto),
            preload: jest.fn((dto: Partial<Card>) => Promise.resolve(dto)),
            save: jest.fn((entity: Partial<Card>) =>
              Promise.resolve({ id: 1, ...entity }),
            ),
            softRemove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(BoardColumn),
          useValue: { findOne: jest.fn() },
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
    cardRepository = module.get<Repository<Card>>(getRepositoryToken(Card));
    columnRepository = module.get<Repository<BoardColumn>>(
      getRepositoryToken(BoardColumn),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createForUser', () => {
    it('appends the card, coerces dueDate to a Date, and keeps the priority', async () => {
      (columnRepository.findOne as jest.Mock).mockResolvedValue({ id: 3 });
      (cardRepository.findOne as jest.Mock).mockResolvedValue({
        position: 1024,
      });

      await service.createForUser(
        {
          title: 'Ship it',
          columnId: 3,
          priority: CardPriority.HIGH,
          dueDate: '2026-07-01',
        },
        7,
      );

      const created = (cardRepository.create as jest.Mock).mock
        .calls[0][0] as Card;
      expect(created.columnId).toBe(3);
      expect(created.position).toBe(2048);
      expect(created.priority).toBe(CardPriority.HIGH);
      expect(created.dueDate).toBeInstanceOf(Date);
    });

    it('uses the base step for the first card in an empty column', async () => {
      (columnRepository.findOne as jest.Mock).mockResolvedValue({ id: 3 });
      (cardRepository.findOne as jest.Mock).mockResolvedValue(null);

      await service.createForUser({ title: 'First', columnId: 3 }, 7);

      const created = (cardRepository.create as jest.Mock).mock
        .calls[0][0] as Card;
      expect(created.position).toBe(1024);
      expect(created.dueDate).toBeUndefined();
    });

    it('throws NotFoundException when the target column is not owned', async () => {
      (columnRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.createForUser({ title: 'x', columnId: 3 }, 7),
      ).rejects.toThrow(NotFoundException);
      expect(cardRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('move', () => {
    it('reassigns the column and position after validating both sides', async () => {
      const card = { id: 1, columnId: 2, position: 1024 } as unknown as Card;
      (cardRepository.findOne as jest.Mock).mockResolvedValue(card);
      (columnRepository.findOne as jest.Mock).mockResolvedValue({ id: 5 });

      await service.move(1, { columnId: 5, position: 512 }, 7);

      const saved = (cardRepository.save as jest.Mock).mock.calls[0][0] as Card;
      expect(saved.columnId).toBe(5);
      expect(saved.position).toBe(512);
    });

    it('throws NotFoundException when the card is not owned', async () => {
      (cardRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.move(1, { columnId: 5, position: 512 }, 7),
      ).rejects.toThrow(NotFoundException);
      expect(cardRepository.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the target column is not owned', async () => {
      (cardRepository.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        columnId: 2,
      });
      (columnRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.move(1, { columnId: 99, position: 512 }, 7),
      ).rejects.toThrow(NotFoundException);
      expect(cardRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateForUser', () => {
    it('checks ownership then updates editable fields', async () => {
      (cardRepository.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      await service.updateForUser(
        1,
        { title: 'Renamed', priority: CardPriority.LOW },
        7,
      );

      expect(cardRepository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when the card is not owned', async () => {
      (cardRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.updateForUser(1, { title: 'x' }, 7)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeForUser', () => {
    it('soft-removes an owned card', async () => {
      const card = { id: 1 } as unknown as Card;
      (cardRepository.findOne as jest.Mock).mockResolvedValue(card);

      await service.removeForUser(1, 7);

      expect(cardRepository.softRemove).toHaveBeenCalledWith(card);
    });

    it('throws NotFoundException when the card is not owned', async () => {
      (cardRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.removeForUser(1, 7)).rejects.toThrow(
        NotFoundException,
      );
      expect(cardRepository.softRemove).not.toHaveBeenCalled();
    });
  });
});
