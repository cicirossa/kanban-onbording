import { IsString, IsInt, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateColumnDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsInt()
  boardId: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  position?: number;
}
