import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class PostImageDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  alt?: string;
}

export class CreatePostDto {
  @IsString()
  @Length(3, 140)
  titulo: string;

  @IsString()
  @Length(1, 20000)
  cuerpo: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PostImageDto) 
  imagenes?: PostImageDto[];
}
