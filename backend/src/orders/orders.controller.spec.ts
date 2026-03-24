import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: {
    createOrder: jest.Mock;
    createOrderReturn: jest.Mock;
    getOrderHistoryAnalytics: jest.Mock;
    getOrderReturnDraft: jest.Mock;
    listOrderReturns: jest.Mock;
  };

  beforeEach(async () => {
    ordersService = {
      createOrder: jest.fn(),
      createOrderReturn: jest.fn(),
      getOrderHistoryAnalytics: jest.fn(),
      getOrderReturnDraft: jest.fn(),
      listOrderReturns: jest.fn(),
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

  it('forwards order return creation to the service with the resolved actor', () => {
    const expected = { id: 7, orderNumber: 'PO-20260324-0007' };
    ordersService.createOrderReturn.mockReturnValue(expected);

    const result = controller.createOrderReturn(
      {
        user: {
          id: 5,
          role: 'MANAGER',
          restaurantId: 2,
        },
      } as never,
      {
        orderId: 19,
        reason: 'Produit abime',
        notes: 'Carton humide',
        items: [
          {
            purchaseOrderItemId: 44,
            quantity: 2,
            photoDocumentIds: [91, 92],
          },
        ],
      },
    );

    expect(ordersService.createOrderReturn).toHaveBeenCalledWith(
      {
        id: 5,
        role: 'MANAGER',
        restaurantId: 2,
      },
      {
        orderId: 19,
        reason: 'Produit abime',
        notes: 'Carton humide',
        items: [
          {
            purchaseOrderItemId: 44,
            quantity: 2,
            photoDocumentIds: [91, 92],
          },
        ],
      },
    );
    expect(result).toBe(expected);
  });
});
