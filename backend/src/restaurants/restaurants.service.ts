import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

    try {
      return await this.prisma.restaurant.create({
        data: {
          name,
          address,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Restaurant name already exists');
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2000'
      ) {
        throw new BadRequestException(
          'Restaurant name or address exceeds the allowed length',
        );
      }

      throw error;
    }
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
