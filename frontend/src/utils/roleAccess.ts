import type { Restaurant, Role, User } from '../types/auth';

export function isManagerLikeRole(role: Role): boolean {
  return role === 'MANAGER' || role === 'REGIONAL_MANAGER';
}

export function isSupervisorRole(role: Role): boolean {
  return role === 'ADMIN' || isManagerLikeRole(role);
}

export function getUserScopedRestaurants(
  user: Pick<User, 'role' | 'restaurant' | 'managedRestaurants'>,
): Restaurant[] {
  if (user.role === 'REGIONAL_MANAGER') {
    return user.managedRestaurants;
  }

  return user.restaurant ? [user.restaurant] : [];
}

export function getUserScopedRestaurantIds(
  user: Pick<User, 'role' | 'restaurant' | 'managedRestaurants'>,
): number[] {
  return getUserScopedRestaurants(user).map((restaurant) => restaurant.id);
}
