import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { RoleScopeActor } from './users.types';

export function isSupervisorRole(role: string): boolean {
  return (
    role === Role.ADMIN ||
    role === Role.MANAGER ||
    role === Role.REGIONAL_MANAGER
  );
}

export function isRestaurantScopedSupervisorRole(role: string): boolean {
  return role === Role.MANAGER || role === Role.REGIONAL_MANAGER;
}

export function ensureAdminOrManagerScope(actor: RoleScopeActor): void {
  if (actor.actorRole === Role.ADMIN) {
    return;
  }

  if (!isRestaurantScopedSupervisorRole(actor.actorRole)) {
    throw new BadRequestException(
      'Only ADMIN, MANAGER, and REGIONAL_MANAGER are allowed',
    );
  }

  if (actor.actorRole === Role.MANAGER && !actor.actorRestaurantId) {
    throw new BadRequestException('Manager must be assigned to a restaurant');
  }

  if (
    actor.actorRole === Role.REGIONAL_MANAGER &&
    actor.actorManagedRestaurantIds.length === 0
  ) {
    throw new BadRequestException(
      'Regional manager must be assigned to at least one restaurant',
    );
  }
}

export function getActorRestaurantScopeIds(actor: RoleScopeActor): number[] {
  if (actor.actorRole === Role.ADMIN) {
    return [];
  }

  if (actor.actorRole === Role.MANAGER) {
    return actor.actorRestaurantId ? [actor.actorRestaurantId] : [];
  }

  if (actor.actorRole === Role.REGIONAL_MANAGER) {
    return Array.from(new Set(actor.actorManagedRestaurantIds));
  }

  return [];
}

export function canActorManageRestaurant(
  actor: RoleScopeActor,
  restaurantId: number | null,
): boolean {
  if (actor.actorRole === Role.ADMIN) {
    return true;
  }

  if (!restaurantId) {
    return false;
  }

  return getActorRestaurantScopeIds(actor).includes(restaurantId);
}
