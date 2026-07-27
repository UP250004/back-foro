import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true, collection: 'comments' })
export class Comment {
  @Prop({ required: true, trim: true, maxlength: 2000 })
  contenido: string;

  // A qué post pertenece (referencia). Se indexa para listar rápido por post.
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  autor: Types.ObjectId;

  @Prop({ required: true })
  autorUsername: string; // snapshot, igual que en Post

  // Un solo nivel de respuestas: si parent es null, es comentario raíz.
  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parent: Types.ObjectId | null;

  // type: Date obligatorio: "Date | null" es una unión no inferible.
  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ post: 1, createdAt: -1 }); // comentarios de un post
CommentSchema.index({ parent: 1, createdAt: 1 }); // respuestas de un comentario