import type { Restaurant } from '../types/auth';
export declare function fetchRestaurants(): Promise<Restaurant[]>;
export declare function createRestaurant(token: string, payload: {
    name: string;
    address: string;
}): Promise<Restaurant>;
