import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../../schemas/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      return await this.userModel.create({
        nombre: dto.nombre,
        apellidos: dto.apellidos,
        username: dto.username,
        email: dto.email,
        passwordHash,
        bio: dto.bio,
      });
    } catch (error: any) {
      // 11000 = clave duplicada. 
      if (error?.code === 11000) {
        const campo = Object.keys(error.keyPattern ?? {})[0] ?? 'campo';
        throw new ConflictException(`Ya existe un usuario con ese ${campo}.`);
      }
      throw error;
    }
  }

  async findForAuth(identificador: string): Promise<UserDocument | null> {
    const valor = identificador.toLowerCase().trim();
    return this.userModel
      .findOne({
        deletedAt: null,
        $or: [{ username: valor }, { email: valor }],
      })
      .select('+passwordHash')
      .exec();
  }

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    const user = await this.userModel
      .findOne({ _id: id, deletedAt: null })
      .exec();
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, dto, { new: true })
      .exec();
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  // Soft delete: conserva el documento para no dejar posts/comentarios huérfanos.
  async softDelete(id: string): Promise<void> {
    const res = await this.userModel
      .updateOne(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date(), activo: false } },
      )
      .exec();
    if (res.matchedCount === 0) {
      throw new NotFoundException('Usuario no encontrado.');
    }
  }

  async list(page = 1, limit = 20): Promise<UserDocument[]> {
    const skip = (Math.max(page, 1) - 1) * limit;
    return this.userModel
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 100))
      .exec();
  }

  // Utilidad reutilizable: compara una contraseña plana contra su hash.
  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
