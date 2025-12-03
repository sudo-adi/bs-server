# Notification System Environment Variables

## Required Environment Variables

Add these variables to your `.env` file in the server directory:

```env
# ==================================
# Email Configuration (NodeMailer)
# ==================================

# SMTP Host (e.g., smtp.gmail.com, smtp.sendgrid.net, smtp.office365.com)
SMTP_HOST=smtp.gmail.com

# SMTP Port (Common: 587 for TLS, 465 for SSL, 25 for non-encrypted)
SMTP_PORT=587

# SMTP Authentication
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# From Email (displayed as sender)
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME="BuildSewa Notifications"

# Optional: Enable/Disable SSL
SMTP_SECURE=false

# ==================================
# Notification System Configuration
# ==================================

# Base URL for links in email templates
APP_BASE_URL=http://localhost:3000

# Admin panel URL
ADMIN_PANEL_URL=http://localhost:3001
```

## Email Provider Setup Guides

### Gmail Setup

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. Use these settings:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password-here
   SMTP_SECURE=false
   ```

### SendGrid Setup

1. Sign up at https://sendgrid.com
2. Create an API Key with Mail Send permissions
3. Use these settings:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=your-sendgrid-api-key
   SMTP_SECURE=false
   ```

### Microsoft 365 / Outlook Setup

1. Use your Microsoft 365 account credentials
2. Use these settings:
   ```env
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_USER=your-email@outlook.com
   SMTP_PASSWORD=your-password
   SMTP_SECURE=false
   ```

### AWS SES Setup

1. Verify your domain/email in AWS SES
2. Create SMTP credentials in AWS Console
3. Use these settings:
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-ses-smtp-username
   SMTP_PASSWORD=your-ses-smtp-password
   SMTP_SECURE=false
   ```

## Database Setup

The notification system requires three tables. Run this command to sync your database:

```bash
npx prisma db push
```

This will create:
- `notifications` - Stores all notification records
- `notification_templates` - Stores email templates
- `notification_preferences` - Stores user preferences

## Seeding Default Templates

Run this function once to seed default email templates:

```typescript
import { NotificationTemplateService } from './services/notifications';

const templateService = new NotificationTemplateService();
await templateService.seedDefaultTemplates();
```

Or create a migration script:

```bash
# In server directory
npm run seed:templates
```

Add to `package.json`:
```json
{
  "scripts": {
    "seed:templates": "ts-node scripts/seed-notification-templates.ts"
  }
}
```

## Testing Email Configuration

Test your email configuration using the test endpoint:

```bash
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

Or use the NotificationService directly:

```typescript
import { NotificationService } from './services/notifications';

const service = new NotificationService();

// Test email sending
await service.sendNotification({
  type: 'SYSTEM_ANNOUNCEMENT',
  title: 'Test Notification',
  message: 'This is a test notification',
  recipientEmail: 'your-email@example.com',
});
```

## Security Best Practices

1. **Never commit `.env` file**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for documentation

2. **Use App-Specific Passwords**
   - Don't use your main email password
   - Generate app-specific passwords

3. **Limit SMTP Credentials**
   - Create dedicated service accounts
   - Use least-privilege principle

4. **Monitor Email Sending**
   - Track failed notifications
   - Set up alerts for high failure rates
   - Use retry mechanism for transient failures

5. **Rate Limiting**
   - Be aware of provider sending limits
   - Implement queues for bulk sends
   - Consider transactional email services for high volume

## Common Email Provider Limits

| Provider    | Free Tier Limit      | Notes                          |
|-------------|---------------------|--------------------------------|
| Gmail       | 500/day             | App password required          |
| SendGrid    | 100/day             | 40,000/month on paid plans     |
| AWS SES     | 200/day             | $0.10 per 1000 after free tier |
| Mailgun     | 5,000/month         | Pay as you go after            |
| Microsoft   | 10,000/day          | Business account needed        |

## Troubleshooting

### Common Issues

**1. Authentication Failed**
- Check username/password are correct
- For Gmail, ensure app password is used
- Verify 2FA is enabled (if required)

**2. Connection Timeout**
- Check SMTP host and port
- Verify firewall/network allows SMTP traffic
- Try alternative ports (587, 465, 25)

**3. TLS/SSL Errors**
- Set `SMTP_SECURE=false` for port 587
- Set `SMTP_SECURE=true` for port 465
- Update Node.js if seeing certificate errors

**4. Emails Going to Spam**
- Set up SPF records
- Configure DKIM signing
- Use verified domain email address
- Add unsubscribe links

### Debug Mode

Enable debug logging:

```typescript
// In email.provider.ts
const transporter = nodemailer.createTransport({
  // ... other config
  logger: true,
  debug: true,
});
```

## Production Recommendations

1. **Use a transactional email service** (SendGrid, AWS SES, Mailgun)
2. **Set up email analytics** (open rates, click rates)
3. **Implement email queues** (Bull, BullMQ) for async processing
4. **Monitor bounce rates** and handle bounced emails
5. **Respect user preferences** (check before sending)
6. **Use email templates** with proper branding
7. **Implement unsubscribe functionality**
8. **Set up proper DNS records** (SPF, DKIM, DMARC)

## Additional Features to Consider

- **Email Templates**: Use HandleBars or EJS for complex templates
- **Email Queue**: Implement Bull/BullMQ for background processing
- **Retry Logic**: Already implemented in NotificationService
- **Webhook Handlers**: Process delivery/bounce/complaint events
- **Analytics Dashboard**: Track notification metrics
- **A/B Testing**: Test different email templates
- **Localization**: Multi-language support
- **Rich Content**: HTML emails with images and styling
