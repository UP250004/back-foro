import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;
export type UserRole = 'user' | 'mod' | 'admin';

@Schema({ timestamps: true, collection: 'usuarios' })
export class User {
  @Prop({ required: true, trim: true, maxlength: 60 })
  nombre: string;

  @Prop({ trim: true, maxlength: 60 })
  apellidos?: string;

  // lowercase + unique evita que "Odin" y "odin" sean cuentas distintas.
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 24,
    match: /^[a-z0-9_.]+$/,
  })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ enum: ['user', 'mod', 'admin'], default: 'user' })
  rol: UserRole;

  @Prop()
  avatarUrl?: string;

  @Prop({ maxlength: 280 })
  bio?: string;

  @Prop({ default: true })
  activo: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ deletedAt: 1 });