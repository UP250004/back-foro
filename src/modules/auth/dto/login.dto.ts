import { IsString, Length } from 'class-validator';

export class LoginDto {
  // Puede ser username o email; lo resolvemos en el servicio.
  @IsString()
  @Length(3, 60)
  identificador: string;

  @IsString()
  @Length(8, 72)
  password: string;
}
