import type { Request } from 'express';
import { RestaurantsService } from './restaurants.service';
type AuthenticatedRequest = Request & {
    user?: {
        role?: string;
    };
};
export declare class RestaurantsController {
    private readonly restaurantsService;
    constructor(restaurantsService: RestaurantsService);
    listRestaurants(): import("@prisma/client").Prisma.PrismaPromise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
    }[]>;
    createRestaurant(req: AuthenticatedRequest, name: string | undefined, address: string | undefined): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
    }>;
}
export {};
