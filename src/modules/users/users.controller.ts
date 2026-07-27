import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Público: ver el perfil de alguien (sin datos sensibles).
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      id: String(user._id),
      username: user.username,
      nombre: user.nombre,
      apellidos: user.apellidos,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    };
  }

  // Solo admin
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  list(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.usersService.list(Number(page), Number(limit));
  }

  // Editar perfil: solo el dueño o un admin.
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    if (actor.id !== id && actor.rol !== 'admin') {
      throw new ForbiddenException('Solo puedes editar tu propio perfil.');
    }
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    if (actor.id !== id && actor.rol !== 'admin') {
      throw new ForbiddenException('No puedes eliminar esta cuenta.');
    }
    await this.usersService.softDelete(id);
  }
}
