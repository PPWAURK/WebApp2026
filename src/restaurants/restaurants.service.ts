import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  listRestaurants() {
    return this.prisma.restaurant.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createRestaurant(params: { name: string; address: string }) {
    const name = params.name.trim();
    const address = params.address.trim();

    if (!name) {
      throw new BadRequestException('Restaurant name is required');
    }

    if (!address) {
      throw new BadRequestException('Restaurant address is required');
    }

    return this.prisma.restaurant.create({
      data: {
        name,
        address,
      },
    });
  }

  async ensureRestaurantExists(restaurantId: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }
}
