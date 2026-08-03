import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 60)
  nombre: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  apellidos?: string;

  @IsString()
  @Length(3, 24)
  @Matches(/^[a-z0-9_.]+$/, {
    message: 'El username solo admite minúsculas, números, punto y guion bajo.',
  })
  username: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido.' })
  email: string;

  @IsString()
  @Length(8, 72) // bcrypt se estanca en 72 bytes, por eso el limite, (se hace muy wey el culero)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contraseña debe tener al menos una letra y un número.',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;
}
