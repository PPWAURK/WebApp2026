import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: {
    listProducts: jest.Mock;
    updateProductAvailability: jest.Mock;
  };

  beforeEach(() => {
    productsService = {
      listProducts: jest.fn(),
      updateProductAvailability: jest.fn(),
    };

    controller = new ProductsController(productsService as never);
  });

  it('allows admins to include inactive products', () => {
    productsService.listProducts.mockReturnValue([]);

    const result = controller.listProducts(
      {
        user: {
          role: 'ADMIN',
        },
      } as never,
      'true',
    );

    expect(productsService.listProducts).toHaveBeenCalledWith({
      includeInactive: true,
    });
    expect(result).toEqual([]);
  });

  it('rejects includeInactive for non-admin users', () => {
    expect(() =>
      controller.listProducts(
        {
          user: {
            role: 'MANAGER',
          },
        } as never,
        'true',
      ),
    ).toThrow(new ForbiddenException('Only ADMIN can list inactive products'));

    expect(productsService.listProducts).not.toHaveBeenCalled();
  });

  it('allows admins to update product availability', () => {
    const expected = { id: 7, isActive: false };
    productsService.updateProductAvailability.mockReturnValue(expected);

    const result = controller.updateProductAvailability(
      {
        user: {
          role: 'ADMIN',
        },
      } as never,
      7,
      { isActive: false },
    );

    expect(productsService.updateProductAvailability).toHaveBeenCalledWith(
      7,
      false,
    );
    expect(result).toBe(expected);
  });

  it('rejects non-boolean availability payloads', () => {
    expect(() =>
      controller.updateProductAvailability(
        {
          user: {
            role: 'ADMIN',
          },
        } as never,
        7,
        {},
      ),
    ).toThrow(new BadRequestException('isActive must be a boolean'));
  });

  it('rejects availability updates from non-admin users', () => {
    expect(() =>
      controller.updateProductAvailability(
        {
          user: {
            role: 'MANAGER',
          },
        } as never,
        7,
        { isActive: false },
      ),
    ).toThrow(
      new ForbiddenException('Only ADMIN can update product availability'),
    );

    expect(productsService.updateProductAvailability).not.toHaveBeenCalled();
  });
});
