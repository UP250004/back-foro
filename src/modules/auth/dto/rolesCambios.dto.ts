import { IsString, Length } from 'class-validator';

export class SetupAdminDto {
  @IsString()
  id: string; // username o email del usuario a promover

  @IsString()
  @Length(8, 200)
  adminKey: string; // la clave secreta del .env
}