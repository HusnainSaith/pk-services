import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from '../src/modules/payments/stripe.service';
import { ConfigService } from '@nestjs/config';

describe('StripeService', () => {
  let service: StripeService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        STRIPE_SECRET_KEY: 'sk_test_fake_key',
        STRIPE_WEBHOOK_SECRET: 'whsec_fake_secret',
        STRIPE_PRICE_ID_MONTHLY: 'price_monthly_fake',
        STRIPE_PRICE_ID_ANNUAL: 'price_annual_fake',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with config service', () => {
      expect(configService).toBeDefined();
      expect(mockConfigService.get).toHaveBeenCalledWith('STRIPE_SECRET_KEY');
    });
  });

  describe('createCheckoutSession', () => {
    it('should throw error if Stripe not configured', async () => {
      const serviceWithoutStripe = new StripeService({
        get: jest.fn(() => null),
      } as any);

      await expect(
        serviceWithoutStripe.createCheckoutSession({
          userId: 'user-123',
          userEmail: 'test@example.com',
          billingCycle: 'monthly',
        }),
      ).rejects.toThrow('Stripe not configured');
    });
  });

  describe('configuration validation', () => {
    it('should have all required Stripe configuration', () => {
      const requiredKeys = [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'FRONTEND_URL',
      ];

      requiredKeys.forEach((key) => {
        const value = mockConfigService.get(key);
        expect(value).toBeDefined();
      });
    });
  });
});
