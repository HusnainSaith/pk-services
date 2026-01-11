import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { EmailService } from '../src/modules/notifications/email.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../src/modules/notifications/entities/notification.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let emailService: EmailService;
  let notificationRepository: Repository<Notification>;
  let userRepository: Repository<User>;

  const mockNotificationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    emailService = module.get<EmailService>(EmailService);
    notificationRepository = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUser', () => {
    it('should return notifications for a user', async () => {
      const userId = 'user-123';
      const mockNotifications = [
        {
          id: '1',
          userId,
          title: 'Test',
          message: 'Test message',
          type: 'info',
          isRead: false,
        },
      ];

      mockNotificationRepository.find.mockResolvedValue(mockNotifications);

      const result = await service.findByUser(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNotifications);
      expect(mockNotificationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const userId = 'user-123';
      mockNotificationRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(userId);

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
    });
  });

  describe('send', () => {
    it('should create notification and send email', async () => {
      const dto = {
        userId: 'user-123',
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockNotification = {
        id: 'notif-123',
        ...dto,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockEmailService.sendEmail.mockResolvedValue(true);

      const result = await service.send(dto);

      expect(result.success).toBe(true);
      expect(mockUserRepository.findOne).toHaveBeenCalled();
      expect(mockNotificationRepository.create).toHaveBeenCalled();
      expect(mockNotificationRepository.save).toHaveBeenCalled();
    });

    it('should return error if user not found', async () => {
      const dto = {
        userId: 'invalid-user',
        title: 'Test',
        message: 'Test',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.send(dto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notif-123';
      const userId = 'user-123';

      mockNotificationRepository.findOne.mockResolvedValue({
        id: notificationId,
        userId,
        readAt: new Date(),
      });

      const result = await service.markAsRead(notificationId, userId);

      expect(result.success).toBe(true);
      expect(mockNotificationRepository.update).toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('should send notification to all users', async () => {
      const dto = {
        title: 'Broadcast Test',
        message: 'Test message',
        type: 'info',
      };

      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];

      mockUserRepository.find.mockResolvedValue(mockUsers);
      mockNotificationRepository.create.mockImplementation((data) => data);
      mockNotificationRepository.save.mockResolvedValue([]);

      const result = await service.broadcast(dto);

      expect(result.success).toBe(true);
      expect(result.count).toBe(mockUsers.length);
      expect(mockNotificationRepository.save).toHaveBeenCalled();
    });
  });
});
