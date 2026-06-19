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
import type { User } from '../../users/entities/user.entity';
import { BoardColumn } from '../../columns/entities/board-column.entity';

@Entity('boards')
export class Board {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  description: string;

  @ApiProperty()
  @Index()
  @Column({ type: 'int' })
  userId: number;

  @ManyToOne('User')
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ type: () => [BoardColumn] })
  @OneToMany(() => BoardColumn, (column) => column.board, { cascade: true })
  columns: BoardColumn[];

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
