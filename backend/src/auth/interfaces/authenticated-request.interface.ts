import type { Request } from 'express';

export type AuthenticatedUser = {
  id?: number;
  role?: string;
  restaurantId?: number | null;
  managedRestaurants?: Array<{
    id: number;
    name: string;
    address: string;
  }>;
  trainingAccess?: string[];
  employeeLevel?: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};
