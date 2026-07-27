import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Comment, CommentDocument } from '../../schemas/comments.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PostsService } from '../posts/posts.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    // Inyectamos PostsService (no el modelo Post) para reutilizar su lógica.
    private readonly postsService: PostsService,
  ) {}

  async create(
    postId: string,
    dto: CreateCommentDto,
    autor: AuthenticatedUser,
  ): Promise<CommentDocument> {
    // 1. Verifica que el post exista (lanza 404 y valida el formato del id).
    await this.postsService.findOne(postId);

    // 2. Crea el comentario.
    const comment = await this.commentModel.create({
      contenido: dto.contenido,
      post: new Types.ObjectId(postId),
      autor: new Types.ObjectId(autor.id),
      autorUsername: autor.username,
      parent: dto.parent ? new Types.ObjectId(dto.parent) : null,
    });

    // 3. Incrementa el contador del post (operación atómica con $inc).
    //    NOTA: aquí son DOS operaciones separadas. Para atomicidad TOTAL
    //    (crear + contar como una sola unidad indivisible) necesitas un
    //    replica set + session/transaction. Ver GUIA-BRUNO §7.
    await this.postsService.incrementComentarios(postId);

    return comment;
  }

  async findByPost(
    postId: string,
    page = 1,
    limit = 20,
  ): Promise<CommentDocument[]> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new NotFoundException('Post no encontrado.');
    }
    const skip = (Math.max(page, 1) - 1) * limit;
    return this.commentModel
      .find({ post: new Types.ObjectId(postId), deletedAt: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 100))
      .exec();
  }

  async update(
    id: string,
    dto: UpdateCommentDto,
    actor: AuthenticatedUser,
  ): Promise<CommentDocument> {
    const comment = await this.getOwned(id, actor);
    comment.contenido = dto.contenido;
    return comment.save();
  }

  async softDelete(id: string, actor: AuthenticatedUser): Promise<void> {
    const comment = await this.getOwned(id, actor);
    comment.deletedAt = new Date();
    await comment.save();
    await this.postsService.decrementComentarios(String(comment.post));
  }

  private async getOwned(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<CommentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Comentario no encontrado.');
    }
    const comment = await this.commentModel
      .findOne({ _id: id, deletedAt: null })
      .exec();
    if (!comment) throw new NotFoundException('Comentario no encontrado.');
    if (String(comment.autor) !== actor.id && actor.rol !== 'admin') {
      throw new ForbiddenException('No eres el autor de este comentario.');
    }
    return comment;
  }
}
