import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: {
    createOrder: jest.Mock;
    getOrderHistoryAnalytics: jest.Mock;
  };

  beforeEach(async () => {
    ordersService = {
      createOrder: jest.fn(),
      getOrderHistoryAnalytics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: ordersService,
        },
      ],
    }).compile();

    controller = module.get(OrdersController);
  });

  it('rejects unauthenticated order creation requests', () => {
    expect(() =>
      controller.createOrder(
        {
          user: undefined,
        } as never,
        {
          deliveryDate: '2026-03-20',
          items: [{ productId: 2, quantity: 3 }],
        },
      ),
    ).toThrow(new ForbiddenException('Unauthenticated request'));

    expect(ordersService.createOrder).not.toHaveBeenCalled();
  });

  it('forwards one create-order DTO to the service with the resolved actor', () => {
    const expected = { id: 12, number: 'PO-12' };
    ordersService.createOrder.mockReturnValue(expected);
    const req = {
      protocol: 'https',
      get: jest.fn(),
      user: {
        id: 8,
        role: 'MANAGER',
        restaurantId: 5,
      },
    } as never;
    const body = {
      deliveryDate: '2026-03-20',
      items: [{ productId: 2, quantity: 3 }],
    };

    const result = controller.createOrder(req, body);

    expect(ordersService.createOrder).toHaveBeenCalledWith(
      {
        id: 8,
        role: 'MANAGER',
        restaurantId: 5,
      },
      body,
      req,
    );
    expect(result).toBe(expected);
  });

  it('forwards validated history analytics filters to the service', () => {
    const expected = { totals: { orders: 5 } };
    ordersService.getOrderHistoryAnalytics.mockReturnValue(expected);

    const result = controller.historyAnalytics(
      {
        user: {
          id: 4,
          role: 'ADMIN',
          restaurantId: null,
        },
      } as never,
      {
        supplierId: 11,
        period: 'this_month',
      },
    );

    expect(ordersService.getOrderHistoryAnalytics).toHaveBeenCalledWith(
      {
        id: 4,
        role: 'ADMIN',
        restaurantId: null,
      },
      {
        supplierId: 11,
        period: 'this_month',
      },
    );
    expect(result).toBe(expected);
  });
});
