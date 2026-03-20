import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

describe('NewsController', () => {
  let controller: NewsController;
  let newsService: {
    createNewsPost: jest.Mock;
    listNewsPosts: jest.Mock;
    markNewsAsRead: jest.Mock;
  };

  beforeEach(async () => {
    newsService = {
      createNewsPost: jest.fn(),
      listNewsPosts: jest.fn(),
      markNewsAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsController],
      providers: [
        {
          provide: NewsService,
          useValue: newsService,
        },
      ],
    }).compile();

    controller = module.get(NewsController);
  });

  it('rejects non-admin users when creating a news post', () => {
    expect(() =>
      controller.createNewsPost(
        {
          user: {
            id: 7,
            role: 'MANAGER',
          },
        } as never,
        {
          title: 'Update',
          message: 'Read this',
        },
      ),
    ).toThrow(new ForbiddenException('Admin only'));

    expect(newsService.createNewsPost).not.toHaveBeenCalled();
  });

  it('forwards one validated news creation DTO to the service', () => {
    const expected = { id: 3, title: 'Update' };
    newsService.createNewsPost.mockReturnValue(expected);
    const req = {
      protocol: 'https',
      get: jest.fn(),
      user: {
        id: 1,
        role: 'ADMIN',
      },
    } as never;
    const body = {
      title: 'Update',
      message: 'Read this',
      tags: ['kitchen'],
    };

    const result = controller.createNewsPost(req, body);

    expect(newsService.createNewsPost).toHaveBeenCalledWith(req, {
      ...body,
      createdByUserId: 1,
    });
    expect(result).toBe(expected);
  });

  it('rejects unsupported roles when marking one post as read', () => {
    expect(() =>
      controller.markNewsAsRead(
        {
          user: {
            id: 5,
            role: 'VISITOR',
          },
        } as never,
        10,
      ),
    ).toThrow(new ForbiddenException('Unsupported role'));

    expect(newsService.markNewsAsRead).not.toHaveBeenCalled();
  });

  it('forwards one list query to the service for supported users', () => {
    const expected = { items: [], availableMonths: [], availableTags: [] };
    newsService.listNewsPosts.mockReturnValue(expected);
    const req = {
      user: {
        id: 9,
        role: 'MANAGER',
        trainingAccess: ['RECIPE_TRAINING'],
        employeeLevel: 'L1_PARTNER',
      },
    } as never;

    const result = controller.listNewsPosts(req, {
      limit: 12,
      month: '2026-03',
      tag: 'kitchen',
    });

    expect(newsService.listNewsPosts).toHaveBeenCalledWith(req, {
      userId: 9,
      role: 'MANAGER',
      trainingAccess: ['RECIPE_TRAINING'],
      employeeLevel: 'L1_PARTNER',
      limit: 12,
      month: '2026-03',
      tag: 'kitchen',
    });
    expect(result).toBe(expected);
  });
});
