# Email Invite System Setup Guide

This guide will help you set up email functionality for sending organization invites in your Trello clone application.

## Overview

The system includes:
- **API Route**: `/api/send-invite` - Handles email sending
- **Utility Functions**: `lib/utils/email.ts` - Helper functions for email operations
- **Email Template**: Professional HTML email template included in the API route

## Quick Start

### 1. Choose an Email Service Provider

You have several options for sending emails:

#### Option A: Resend (Recommended for Next.js) ⭐

**Why Resend?**
- Modern API designed for Next.js
- Simple setup
- Generous free tier (100 emails/day)
- Great developer experience

**Setup Steps:**

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Install the package:
   ```bash
   npm install resend
   ```
4. Add to your `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   EMAIL_FROM=noreply@yourdomain.com
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

5. Uncomment the Resend code in `app/api/send-invite/route.ts` (lines ~130-140)

#### Option B: SendGrid

**Setup Steps:**

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Install the package:
   ```bash
   npm install @sendgrid/mail
   ```
4. Add to your `.env.local`:
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxx
   EMAIL_FROM=noreply@yourdomain.com
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

5. Uncomment the SendGrid code in `app/api/send-invite/route.ts` (lines ~143-152)

#### Option C: Nodemailer (SMTP)

**Setup Steps:**

1. Get SMTP credentials from your email provider (Gmail, Outlook, etc.)
2. Install the package:
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```
3. Add to your `.env.local`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=noreply@yourdomain.com
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Uncomment the Nodemailer code in `app/api/send-invite/route.ts` (lines ~155-175)

**Note for Gmail:** You'll need to generate an App Password:
1. Go to Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate a new app password
4. Use that password in `SMTP_PASS`

### 2. Update Supabase Database Schema

Add email tracking columns to your `organization_invites` table:

```sql
ALTER TABLE organization_invites
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
```

### 3. Integrate Email Sending

You have two options for integration:

#### Option 1: Automatic Email Sending (Recommended)

Update `lib/actions/invites.ts` to automatically send emails when invites are created:

```typescript
// After creating the invite (around line 110)
if (data) {
  // Get organization and inviter details
  const { data: orgData } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", input.org_id)
    .single();

  const { data: userData } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .single();

  // Send email via API route
  const emailResult = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inviteId: data.id,
      email: input.email,
      organizationName: orgData?.name || "the organization",
      inviterName: userData?.display_name || "A team member",
      role: input.role,
      inviteToken: token,
    }),
  });

  if (!emailResult.ok) {
    console.error("Failed to send invite email");
  }
}
```

#### Option 2: Manual Email Sending

Use the utility function from your components:

```typescript
import { sendInviteEmail } from "@/lib/utils/email";

// After creating an invite
const emailResult = await sendInviteEmail({
  inviteId: invite.id,
  email: invite.email,
  organizationName: organization.name,
  inviterName: currentUser.name,
  role: invite.role,
  inviteToken: invite.token,
});

if (emailResult.success) {
  toast.success("Invite email sent!");
} else {
  toast.error("Failed to send email");
}
```

## Development Mode

In development mode, the API will log email details to the console instead of sending actual emails. This is useful for testing without configuring an email service:

```
=== INVITE EMAIL ===
To: user@example.com
Subject: You've been invited to join My Organization
Invite URL: http://localhost:3000/invite/abc123...
Inviter: John Doe
Role: member
===================
```

## Email Template Customization

The email template is in `app/api/send-invite/route.ts` in the `getEmailTemplate()` function. You can customize:

- **Colors**: Update the hex color codes
- **Logo**: Add your logo image URL
- **Content**: Modify the text and messaging
- **Styling**: Adjust padding, fonts, and layout

Example customizations:

```typescript
// Add a logo
<td style="padding: 40px 40px 20px; text-align: center;">
  <img src="https://yourdomain.com/logo.png" alt="Logo" style="height: 40px; margin-bottom: 20px;">
  <h1>You've been invited!</h1>
</td>

// Change button color
<a href="${inviteUrl}" style="background-color: #3b82f6; ...">
  Accept Invitation
</a>
```

## Testing

### 1. Test API Endpoint Directly

```bash
curl -X POST http://localhost:3000/api/send-invite \
  -H "Content-Type: application/json" \
  -d '{
    "inviteId": "test-id",
    "email": "test@example.com",
    "organizationName": "Test Org",
    "inviterName": "John Doe",
    "role": "member",
    "inviteToken": "test-token-123"
  }'
```

### 2. Test from UI

1. Log in to your application
2. Go to an organization
3. Click "Invite Members"
4. Enter an email and send the invite
5. Check console logs (development) or your email (production)

## Troubleshooting

### Emails not sending?

1. **Check environment variables**: Make sure all required env vars are set
2. **Check API key**: Verify your email service API key is correct
3. **Check logs**: Look at server logs for error messages
4. **Check rate limits**: Some services have rate limits on free tiers
5. **Check spam folder**: Emails might be going to spam

### Common Errors

**"No email service configured"**
- You haven't uncommented the email service code in the API route
- Solution: Choose a provider and uncomment the relevant code

**"Invalid API key"**
- Your API key is incorrect or expired
- Solution: Generate a new API key from your email service provider

**"SMTP authentication failed"**
- Wrong SMTP credentials or app password not enabled
- Solution: Double-check credentials and enable app passwords if using Gmail

## Production Checklist

Before deploying to production:

- [ ] Email service configured and tested
- [ ] Environment variables set in production environment
- [ ] `NEXT_PUBLIC_SITE_URL` points to production URL
- [ ] Email template reviewed and customized
- [ ] Test emails sent successfully
- [ ] SPF/DKIM records configured (for better deliverability)
- [ ] Remove console.log statements from API route
- [ ] Set up error monitoring for failed emails

## Security Notes

- Never commit `.env` files to version control
- Use environment variables for all sensitive data
- API keys should have minimal required permissions
- Implement rate limiting to prevent abuse
- Validate all inputs in the API route
- Use HTTPS in production

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [SendGrid API Docs](https://docs.sendgrid.com/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Email Template Best Practices](https://www.campaignmonitor.com/dev-resources/guides/email-coding/)

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify environment variables are correct
3. Test with a simple email first
4. Check email service status pages
5. Review the API route code for any modifications

---

**Need help?** Check the API route at `app/api/send-invite/route.ts` for inline comments and examples.
