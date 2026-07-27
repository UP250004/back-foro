import { UserRole } from '../../../schemas/users.schema';

export interface JwtPayload {
  sub: string; // "subject" = id del usuario
  username: string;
  rol: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  rol: UserRole;
}
