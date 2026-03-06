import { PrismaService } from '../prisma/prisma.service';
export declare class RestaurantsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listRestaurants(): import("@prisma/client").Prisma.PrismaPromise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
    }[]>;
    createRestaurant(params: {
        name: string;
        address: string;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
    }>;
    ensureRestaurantExists(restaurantId: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
    }>;
}
