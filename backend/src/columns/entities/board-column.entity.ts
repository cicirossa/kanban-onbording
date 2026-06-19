import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Card } from '../../cards/entities/card.entity';
import type { Board } from '../../boards/entities/board.entity';

// Entity class is `BoardColumn` / table `board_columns` — `column` is a SQL
// reserved word, so the bare name must be avoided.
@Entity('board_columns')
export class BoardColumn {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column({ type: 'double precision', default: 0 })
  position: number;

  @ApiProperty()
  @Index()
  @Column({ type: 'int' })
  boardId: number;

  // String-form relation + `import type` to avoid a circular import with Board.
  @ManyToOne('Board', 'columns', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @ApiProperty({ type: () => [Card] })
  @OneToMany(() => Card, (card) => card.column, { cascade: true })
  cards: Card[];

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
