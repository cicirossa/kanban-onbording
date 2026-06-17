import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import type { IAuthRequest } from '../auth/interfaces/auth-request.interface';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnDto } from './dto/reorder-column.dto';
import { BoardColumn } from './entities/board-column.entity';

@ApiTags('Columns')
@ApiBearerAuth()
@Controller('columns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post()
  @Permissions('columns.create')
  @ApiOperation({ summary: 'Create a new column' })
  @ApiResponse({ status: 201, type: BoardColumn })
  @UseInterceptors(NoFilesInterceptor())
  create(@Body() dto: CreateColumnDto, @Req() req: IAuthRequest) {
    return this.columnsService.createForUser(dto, req.user.userId);
  }

  @Get()
  @Permissions('columns.read')
  @ApiOperation({ summary: 'Get columns (with cards) for a board' })
  @ApiQuery({ name: 'boardId', type: Number })
  @ApiResponse({ status: 200, type: [BoardColumn] })
  findAll(@Query('boardId') boardId: string, @Req() req: IAuthRequest) {
    return this.columnsService.findAllForBoard(+boardId, req.user.userId);
  }

  @Patch(':id/move')
  @Permissions('columns.update')
  @ApiOperation({ summary: 'Reorder a column within its board' })
  @ApiResponse({ status: 200, type: BoardColumn })
  @UseInterceptors(NoFilesInterceptor())
  move(
    @Param('id') id: string,
    @Body() dto: ReorderColumnDto,
    @Req() req: IAuthRequest,
  ) {
    return this.columnsService.move(+id, dto.position, req.user.userId);
  }

  @Patch(':id')
  @Permissions('columns.update')
  @ApiOperation({ summary: 'Update a column' })
  @ApiResponse({ status: 200, type: BoardColumn })
  @UseInterceptors(NoFilesInterceptor())
  update(
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
    @Req() req: IAuthRequest,
  ) {
    return this.columnsService.updateForUser(+id, dto, req.user.userId);
  }

  @Delete(':id')
  @Permissions('columns.delete')
  @ApiOperation({ summary: 'Delete a column (cascades to its cards)' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string, @Req() req: IAuthRequest) {
    return this.columnsService.removeForUser(+id, req.user.userId);
  }
}
