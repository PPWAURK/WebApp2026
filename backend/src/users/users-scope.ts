import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { RoleScopeActor } from './users.types';

export function ensureAdminOrManagerScope(actor: RoleScopeActor): void {
  if (actor.actorRole === Role.ADMIN) {
    return;
  }

  if (actor.actorRole !== Role.MANAGER) {
    throw new BadRequestException('Only ADMIN and MANAGER are allowed');
  }

  if (!actor.actorRestaurantId) {
    throw new BadRequestException('Manager must be assigned to a restaurant');
  }
}
