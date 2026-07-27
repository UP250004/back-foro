import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserDocument } from '../../schemas/users.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Registro: delega en UsersService (hashea + controla duplicados) y
  // devuelve el token de una vez para no obligar a un login extra.
  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findForAuth(dto.identificador);

    if (!user) throw new UnauthorizedException('Credenciales inválidas.');

    const ok = await this.usersService.verifyPassword(
      dto.password,
      user.passwordHash,
    );
    if (!ok) throw new UnauthorizedException('Credenciales inválidas.');

    return this.buildAuthResponse(user);
  }
  private buildAuthResponse(user: UserDocument) {
    const payload: JwtPayload = {
      sub: String(user._id),
      username: user.username,
      rol: user.rol,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: String(user._id),
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
