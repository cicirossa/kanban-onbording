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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import type { IAuthRequest } from '../auth/interfaces/auth-request.interface';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Board } from './entities/board.entity';

@ApiTags('Boards')
@ApiBearerAuth()
@Controller('boards')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @Permissions('boards.create')
  @ApiOperation({ summary: 'Create a new board' })
  @ApiResponse({ status: 201, type: Board })
  @UseInterceptors(NoFilesInterceptor())
  create(@Body() dto: CreateBoardDto, @Req() req: IAuthRequest) {
    return this.boardsService.createForUser(dto, req.user.userId);
  }

  @Get()
  @Permissions('boards.read')
  @ApiOperation({ summary: 'Get all boards owned by the current user' })
  @ApiResponse({ status: 200, type: [Board] })
  findAll(@Req() req: IAuthRequest) {
    return this.boardsService.findAllForUser(req.user.userId);
  }

  @Get(':id')
  @Permissions('boards.read')
  @ApiOperation({ summary: 'Get a board with its columns and cards' })
  @ApiResponse({ status: 200, type: Board })
  findOne(@Param('id') id: string, @Req() req: IAuthRequest) {
    return this.boardsService.findOneForUser(+id, req.user.userId);
  }

  @Patch(':id')
  @Permissions('boards.update')
  @ApiOperation({ summary: 'Update a board' })
  @ApiResponse({ status: 200, type: Board })
  @UseInterceptors(NoFilesInterceptor())
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
    @Req() req: IAuthRequest,
  ) {
    return this.boardsService.updateForUser(+id, dto, req.user.userId);
  }

  @Delete(':id')
  @Permissions('boards.delete')
  @ApiOperation({ summary: 'Delete a board (cascades to columns and cards)' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string, @Req() req: IAuthRequest) {
    return this.boardsService.removeForUser(+id, req.user.userId);
  }
}
