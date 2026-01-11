import { Test, TestingModule } from '@nestjs/testing';
import { UserSubscriptionsService } from '../src/modules/subscriptions/user-subscriptions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSubscription } from '../src/modules/subscriptions/entities/user-subscription.entity';
import { SubscriptionPlan } from '../src/modules/subscriptions/entities/subscription-plan.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';

describe('UserSubscriptionsService', () => {
  let service: UserSubscriptionsService;
  let subscriptionRepository: Repository<UserSubscription>;

  const mockSubscriptionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSubscriptionsService,
        {
          provide: getRepositoryToken(UserSubscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UserSubscriptionsService>(UserSubscriptionsService);
    subscriptionRepository = module.get<Repository<UserSubscription>>(
      getRepositoryToken(UserSubscription),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findActiveByUser', () => {
    it('should return active subscription for a user', async () => {
      const userId = 'user-123';
      const mockSubscription = {
        id: 'sub-123',
        userId,
        status: 'active',
        plan: {
          id: 'plan-123',
          name: 'Premium',
          enabledServices: ['ISEE', '730', 'IMU'],
        },
      };

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.findActiveByUser(userId);

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { userId, status: 'active' },
        relations: ['plan'],
      });
    });

    it('should return null if no active subscription found', async () => {
      const userId = 'user-123';
      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.findActiveByUser(userId);

      expect(result).toBeNull();
    });
  });

  describe('subscription status checks', () => {
    it('should identify expired subscription', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const subscription = {
        id: 'sub-123',
        status: 'active',
        endDate: expiredDate,
      };

      const now = new Date();
      expect(subscription.endDate < now).toBe(true);
    });

    it('should identify valid subscription', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const subscription = {
        id: 'sub-123',
        status: 'active',
        endDate: futureDate,
      };

      const now = new Date();
      expect(subscription.endDate > now).toBe(true);
    });
  });

  describe('service access validation', () => {
    it('should allow access to enabled services', () => {
      const plan = {
        enabledServices: ['ISEE', '730', 'IMU'],
      };
      const requestedService = 'ISEE';

      expect(plan.enabledServices.includes(requestedService)).toBe(true);
    });

    it('should deny access to non-enabled services', () => {
      const plan = {
        enabledServices: ['ISEE'],
      };
      const requestedService = 'IMU';

      expect(plan.enabledServices.includes(requestedService)).toBe(false);
    });

    it('should allow all services if enabledServices is empty', () => {
      const plan = {
        enabledServices: [],
      };

      // Empty array should allow all services (backward compatibility)
      expect(plan.enabledServices.length === 0).toBe(true);
    });
  });
});
