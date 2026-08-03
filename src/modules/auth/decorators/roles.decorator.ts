import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../schemas/users.schema';

export const ROLES_KEY = 'roles';

//  @Roles('admin', 'mod')
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
