import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Post, PostDocument } from '../../schemas/posts.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  async create(
    dto: CreatePostDto,
    autor: AuthenticatedUser,
  ): Promise<PostDocument> {
    return this.postModel.create({
      ...dto,
      autor: new Types.ObjectId(autor.id),
      // Snapshot tomado del TOKEN, sin ir a la base. El autor JAMÁS sale del body.
      autorUsername: autor.username,
    });
  }

  async findAll(page = 1, limit = 20, tag?: string): Promise<PostDocument[]> {
    const filtro: Record<string, unknown> = {
      deletedAt: null,
      estado: 'publicado',
    };
    if (tag) filtro.tags = tag;

    const skip = (Math.max(page, 1) - 1) * limit;
    return this.postModel
      .find(filtro)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 100))
      .exec();
  }

  async findOne(id: string): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Post no encontrado.');
    }
    const post = await this.postModel
      .findOne({ _id: id, deletedAt: null })
      .exec();
    if (!post) throw new NotFoundException('Post no encontrado.');
    return post;
  }

  async update(
    id: string,
    dto: UpdatePostDto,
    actor: AuthenticatedUser,
  ): Promise<PostDocument> {
    const post = await this.findOne(id);
    this.assertOwnership(post, actor);
    Object.assign(post, dto);
    return post.save();
  }

  async softDelete(id: string, actor: AuthenticatedUser): Promise<void> {
    const post = await this.findOne(id);
    this.assertOwnership(post, actor);
    post.deletedAt = new Date();
    await post.save();
  }
  
  async incrementComentarios(postId: string): Promise<void> {
    await this.postModel
      .updateOne({ _id: postId }, { $inc: { comentariosCount: 1 } })
      .exec();
  }

  async decrementComentarios(postId: string): Promise<void> {
    await this.postModel
      .updateOne({ _id: postId }, { $inc: { comentariosCount: -1 } })
      .exec();
  }

  private assertOwnership(post: PostDocument, actor: AuthenticatedUser): void {
    if (String(post.autor) !== actor.id && actor.rol !== 'admin') {
      throw new ForbiddenException('No eres el autor de este post.');
    }
  }
}
