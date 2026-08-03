import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;
export type PostEstado = 'borrador' | 'publicado' | 'oculto';
@Schema({ _id: false })
class PostImage {
  @Prop({ required: true })
  url: string;

  @Prop()
  alt?: string;
}
const PostImageSchema = SchemaFactory.createForClass(PostImage);

@Schema({ timestamps: true, collection: 'posts' })
export class Post {
  @Prop({ required: true, trim: true, maxlength: 140 })
  titulo: string;

  @Prop({ required: true, maxlength: 20000 })
  cuerpo: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  autor: Types.ObjectId;

  @Prop({ required: true })
  autorUsername: string;

  @Prop({ type: [PostImageSchema], default: [] })
  imagenes: PostImage[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  comentariosCount: number;

  @Prop({ enum: ['borrador', 'publicado', 'oculto'], default: 'publicado' })
  estado: PostEstado;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const PostSchema = SchemaFactory.createForClass(Post);
// Índices pensados para cómo se LEE el foro:
PostSchema.index({ createdAt: -1 });
PostSchema.index({ autor: 1, createdAt: -1 }); 
PostSchema.index({ tags: 1, createdAt: -1 });
PostSchema.index({ titulo: 'text', cuerpo: 'text' });