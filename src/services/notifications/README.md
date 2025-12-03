# Notification System

A comprehensive, generic notification system for BuildSewa that supports multiple channels (Email, In-App, SMS) with template management, user preferences, and automatic retry logic.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Integration Examples](#integration-examples)
- [Configuration](#configuration)
- [Testing](#testing)

## ✨ Features

- **Multi-Channel Support**: Email, In-App notifications, and SMS (placeholder)
- **Template Management**: Predefined templates with variable substitution
- **User Preferences**: Users can control which notifications they receive
- **Automatic Retry**: Failed notifications are automatically retried
- **Type Safety**: Full TypeScript support with comprehensive types
- **Generic Design**: Easy to mount on any event in your application
- **Email Provider**: NodeMailer integration with SMTP support
- **Rich Metadata**: Store additional context with each notification
- **Read/Unread Tracking**: Mark notifications as read/unread
- **Bulk Operations**: Send announcements to multiple users

## 🏗️ Architecture

```
services/notifications/
├── index.ts                          # Main exports
├── notification.service.ts           # Core notification orchestrator
├── notificationTemplate.service.ts   # Template rendering
├── providers/
│   └── email.provider.ts            # NodeMailer email provider
├── helpers/
│   └── notificationHelpers.ts       # Easy-to-use helper functions
├── examples/
│   └── integration.examples.ts      # Integration examples
├── SETUP.md                         # Environment setup guide
└── README.md                        # This file
```

### Database Schema

Three tables power the notification system:

1. **notifications**: Stores all notification records
2. **notification_templates**: Email templates with variables
3. **notification_preferences**: User-specific preferences

## 🚀 Quick Start

### 1. Database Setup

```bash
# Sync database schema
npx prisma db push

# Seed default templates
npm run seed:templates
# or
ts-node scripts/seed-notification-templates.ts
```

### 2. Environment Configuration

Add to `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@buildsewa.com
SMTP_FROM_NAME="BuildSewa Notifications"
SMTP_SECURE=false

# App URLs
APP_BASE_URL=http://localhost:3000
ADMIN_PANEL_URL=http://localhost:3001
```

See [SETUP.md](./SETUP.md) for detailed provider setup guides.

### 3. Basic Usage

```typescript
import { notifyUserCreated } from '@/services/notifications';

// Send a notification
await notifyUserCreated({
  userId: user.id,
  email: user.email,
  username: user.username,
  fullName: user.fullName,
});
```

## 📖 Usage

### Using Helper Functions (Recommended)

The easiest way to send notifications:

```typescript
import {
  notifyUserCreated,
  notifyCandidateApproved,
  notifyTrainingEnrollment,
  notifyProjectAssignment,
} from '@/services/notifications';

// User created
await notifyUserCreated({
  userId: '123',
  email: 'user@example.com',
  username: 'johndoe',
  fullName: 'John Doe',
});

// Candidate approved
await notifyCandidateApproved({
  userId: '456',
  email: 'candidate@example.com',
  candidateName: 'Jane Smith',
  candidateCode: 'CAND-001',
});

// Training enrollment
await notifyTrainingEnrollment({
  userId: '789',
  email: 'trainee@example.com',
  candidateName: 'Bob Johnson',
  batchName: 'Carpentry Batch 5',
  programName: 'Basic Carpentry',
  startDate: '2024-02-01',
  location: 'Kathmandu Training Center',
});
```

### Using NotificationService Directly

For custom notifications:

```typescript
import { NotificationService } from '@/services/notifications';

const notificationService = new NotificationService();

await notificationService.sendNotification({
  type: 'CUSTOM_EVENT',
  title: 'Custom Notification',
  message: 'This is a custom message',
  recipientUserId: 'user-123',
  recipientEmail: 'user@example.com',
  metadata: {
    customField: 'value',
  },
});
```

### Sending from Templates

```typescript
await notificationService.sendNotificationFromTemplate(
  'USER_CREATED',
  'user-123',
  'user@example.com',
  {
    userName: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
  }
);
```

### System Announcements

Send to multiple users at once:

```typescript
import { sendSystemAnnouncement } from '@/services/notifications';

await sendSystemAnnouncement({
  title: 'System Maintenance',
  message: 'Platform will be down for maintenance on Saturday 2-4 AM',
  recipientUserIds: ['user1', 'user2', 'user3'],
  recipientEmails: ['admin@example.com'],
});
```

## 🔌 API Endpoints

All endpoints require authentication via JWT token.

### Get User Notifications

```http
GET /api/notifications?page=1&limit=20&status=unread
Authorization: Bearer <token>
```

Response:
```json
{
  "notifications": [...],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

### Get Unread Count

```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

### Mark as Read

```http
POST /api/notifications/:id/read
Authorization: Bearer <token>
```

### Mark All as Read

```http
POST /api/notifications/read-all
Authorization: Bearer <token>
```

### Delete Notification

```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

### Get User Preferences

```http
GET /api/notifications/preferences
Authorization: Bearer <token>
```

### Update Preferences

```http
PUT /api/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "notificationType": "CANDIDATE_STATUS_CHANGED",
  "email": true,
  "inApp": true,
  "sms": false
}
```

### Send Test Notification

```http
POST /api/notifications/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "Test User"
}
```

## 🔗 Integration Examples

### Example 1: User Registration

```typescript
// In your user.service.ts
import { notifyUserCreated } from '@/services/notifications';

export async function createUser(userData: any) {
  const user = await prisma.user.create({ data: userData });

  // ✅ Mount notification
  try {
    await notifyUserCreated({
      userId: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
    });
  } catch (error) {
    console.error('Notification failed:', error);
    // Don't throw - notification failure shouldn't break user creation
  }

  return user;
}
```

### Example 2: Candidate Status Change

```typescript
// In your candidate.service.ts
import { notifyCandidateStatusChanged } from '@/services/notifications';

export async function updateCandidateStatus(
  candidateId: string,
  newStatus: string,
  notes?: string
) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { user: true },
  });

  const oldStatus = candidate.currentStage;

  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: { currentStage: newStatus },
  });

  // ✅ Mount notification
  try {
    await notifyCandidateStatusChanged({
      userId: candidate.userId,
      email: candidate.user?.email,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      candidateCode: candidate.candidateCode,
      oldStatus,
      newStatus,
      notes,
    });
  } catch (error) {
    console.error('Notification failed:', error);
  }

  return updated;
}
```

### Example 3: Approval/Rejection Flow

```typescript
// In your admin.controller.ts
import {
  notifyCandidateApproved,
  notifyCandidateRejected,
} from '@/services/notifications';

export async function approveCandidate(req: Request, res: Response) {
  const { candidateId } = req.params;

  const candidate = await prisma.candidate.update({
    where: { id: candidateId },
    data: { currentStage: 'approved', isApproved: true },
    include: { user: true },
  });

  // ✅ Mount notification
  await notifyCandidateApproved({
    userId: candidate.userId,
    email: candidate.user?.email,
    candidateName: `${candidate.firstName} ${candidate.lastName}`,
    candidateCode: candidate.candidateCode,
  });

  res.json({ success: true, candidate });
}

export async function rejectCandidate(req: Request, res: Response) {
  const { candidateId } = req.params;
  const { reason } = req.body;

  const candidate = await prisma.candidate.update({
    where: { id: candidateId },
    data: { currentStage: 'rejected', isApproved: false },
    include: { user: true },
  });

  // ✅ Mount notification
  await notifyCandidateRejected({
    userId: candidate.userId,
    email: candidate.user?.email,
    candidateName: `${candidate.firstName} ${candidate.lastName}`,
    candidateCode: candidate.candidateCode,
    reason,
  });

  res.json({ success: true, candidate });
}
```

See [integration.examples.ts](./examples/integration.examples.ts) for more examples.

## ⚙️ Configuration

### Available Notification Types

```typescript
enum NotificationType {
  USER_CREATED = 'USER_CREATED',
  CANDIDATE_STATUS_CHANGED = 'CANDIDATE_STATUS_CHANGED',
  CANDIDATE_APPROVED = 'CANDIDATE_APPROVED',
  CANDIDATE_REJECTED = 'CANDIDATE_REJECTED',
  CANDIDATE_BLACKLISTED = 'CANDIDATE_BLACKLISTED',
  DOCUMENT_VERIFIED = 'DOCUMENT_VERIFIED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  TRAINING_ENROLLMENT = 'TRAINING_ENROLLMENT',
  TRAINING_ENROLLMENT_APPROVED = 'TRAINING_ENROLLMENT_APPROVED',
  TRAINING_COMPLETED = 'TRAINING_COMPLETED',
  PROJECT_ASSIGNED = 'PROJECT_ASSIGNED',
  PROJECT_UNASSIGNED = 'PROJECT_UNASSIGNED',
  PROJECT_STARTED = 'PROJECT_STARTED',
  PROJECT_COMPLETED = 'PROJECT_COMPLETED',
  EMPLOYER_VERIFIED = 'EMPLOYER_VERIFIED',
  EMPLOYER_REJECTED = 'EMPLOYER_REJECTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  LOGIN_ALERT = 'LOGIN_ALERT',
}
```

### Notification Channels

```typescript
enum NotificationChannel {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  SMS = 'SMS', // Placeholder for future
}
```

### Notification Status

```typescript
enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}
```

## 🧪 Testing

### Test Email Configuration

```typescript
import { NotificationService } from '@/services/notifications';

const service = new NotificationService();

await service.sendNotification({
  type: 'SYSTEM_ANNOUNCEMENT',
  title: 'Test Email',
  message: 'This is a test notification',
  recipientEmail: 'your-email@example.com',
});
```

### Test via API

```bash
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

### Retry Failed Notifications

```typescript
import { NotificationService } from '@/services/notifications';

const service = new NotificationService();
const retried = await service.retryFailedNotifications();
console.log(`Retried ${retried} failed notifications`);
```

## 📝 Best Practices

1. **Always wrap notifications in try-catch**
   - Don't let notification failures break your main logic

2. **Use helper functions when possible**
   - Cleaner code, less boilerplate

3. **Log notification failures**
   - Monitor and track delivery issues

4. **Respect user preferences**
   - System automatically checks preferences before sending

5. **Use meaningful metadata**
   - Include IDs and context for debugging

6. **Test with real emails**
   - Verify templates render correctly

7. **Monitor delivery rates**
   - Check failed notifications periodically
   - Run retry mechanism for transient failures

## 🔄 Retry Mechanism

The system automatically handles retries for failed notifications:

```typescript
// Failed notifications are automatically retried up to 3 times
// with exponential backoff

// Manual retry:
await notificationService.retryFailedNotifications();
```

## 🎨 Customizing Templates

Templates use simple variable substitution with `{{variableName}}`:

```typescript
const template = {
  type: 'CUSTOM_EVENT',
  subject: 'Hello {{userName}}!',
  body: 'Welcome to BuildSewa, {{userName}}. Your username is {{username}}.',
  variables: { userName: 'required', username: 'required' },
};
```

## 🚀 Production Checklist

- [ ] Set up proper SMTP provider (SendGrid, AWS SES, etc.)
- [ ] Configure environment variables
- [ ] Seed default templates
- [ ] Test email delivery
- [ ] Set up monitoring for failed notifications
- [ ] Configure email DNS records (SPF, DKIM, DMARC)
- [ ] Implement email queue for bulk sends (optional)
- [ ] Set up analytics/tracking (optional)

## 📚 Additional Resources

- [SETUP.md](./SETUP.md) - Detailed environment setup guide
- [integration.examples.ts](./examples/integration.examples.ts) - Integration examples
- [Prisma Schema](../../prisma/schema.prisma) - Database schema

## 🤝 Contributing

When adding new notification types:

1. Add to `NotificationType` enum in `notification.types.ts`
2. Create helper function in `notificationHelpers.ts`
3. Add default template in `notificationTemplate.service.ts`
4. Add example in `integration.examples.ts`
5. Update this README

## 📄 License

Part of the BuildSewa platform.
