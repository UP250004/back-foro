import { IsMongoId, IsOptional, IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @Length(1, 2000)
  contenido: string;
  @IsOptional()
  @IsMongoId()
  parent?: string;
}
