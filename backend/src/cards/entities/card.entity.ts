import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import type { BoardColumn } from '../../columns/entities/board-column.entity';
import { CardPriority } from '../card-priority.enum';

@Entity('cards')
export class Card {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date;

  @ApiProperty({ enum: CardPriority, default: CardPriority.MEDIUM })
  @Column({ type: 'enum', enum: CardPriority, default: CardPriority.MEDIUM })
  priority: CardPriority;

  @ApiProperty()
  @Column({ type: 'double precision', default: 0 })
  position: number;

  @ApiProperty()
  @Index()
  @Column({ type: 'int' })
  columnId: number;

  // String-form relation + `import type` to avoid a circular import with
  // BoardColumn (mirrors media.entity.ts's reference to User).
  @ManyToOne('BoardColumn', 'cards', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'columnId' })
  column: BoardColumn;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  @Exclude()
  deletedAt: Date;
}
