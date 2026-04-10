import { ForbiddenException } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';

describe('RestaurantsController', () => {
  let controller: RestaurantsController;
  let restaurantsService: {
    updateRestaurant: jest.Mock;
  };

  beforeEach(() => {
    restaurantsService = {
      updateRestaurant: jest.fn(),
    };

    controller = new RestaurantsController(restaurantsService as never);
  });

  it('allows admins to update one restaurant', () => {
    const expected = {
      id: 8,
      name: 'Paris 11',
      address: '12 Rue Exemple',
    };
    restaurantsService.updateRestaurant.mockReturnValue(expected);

    const result = controller.updateRestaurant(
      {
        user: {
          role: 'ADMIN',
        },
      } as never,
      8,
      {
        name: 'Paris 11',
        address: '12 Rue Exemple',
      },
    );

    expect(restaurantsService.updateRestaurant).toHaveBeenCalledWith(8, {
      name: 'Paris 11',
      address: '12 Rue Exemple',
    });
    expect(result).toBe(expected);
  });

  it('rejects non-admin users when updating one restaurant', () => {
    expect(() =>
      controller.updateRestaurant(
        {
          user: {
            role: 'MANAGER',
          },
        } as never,
        8,
        {
          name: 'Paris 11',
          address: '12 Rue Exemple',
        },
      ),
    ).toThrow(new ForbiddenException('Admin only'));

    expect(restaurantsService.updateRestaurant).not.toHaveBeenCalled();
  });
});
