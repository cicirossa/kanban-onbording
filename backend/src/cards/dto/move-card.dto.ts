import { IsInt, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveCardDto {
  @ApiProperty({ description: 'Target column id' })
  @IsInt()
  columnId: number;

  @ApiProperty({ description: 'New fractional position within the column' })
  @IsNumber()
  position: number;
}
