import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderColumnDto {
  @ApiProperty({ description: 'New fractional position within the board' })
  @IsNumber()
  position: number;
}
