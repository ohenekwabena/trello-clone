# Magic Link Invitation System

## 🎯 Overview

The invitation system now uses **magic links** to provide a seamless, passwordless authentication experience. When users receive an invitation email, they can click a single link that automatically signs them in and takes them directly to the invitation acceptance page.

## ✨ Benefits

- **No manual login required**: Users are automatically authenticated
- **Better UX**: One-click from email to invitation page
- **Works for new users**: Automatically creates accounts for first-time users
- **Works for existing users**: Seamlessly signs in existing users
- **Secure**: Uses Supabase's built-in OTP (One-Time Password) system

## 🔄 How It Works

### Flow Diagram

```
User clicks invite email link
         ↓
/invite/magic/[token]?email=user@example.com
         ↓
Is user already authenticated?
    ↓ No              ↓ Yes
Send magic link    Redirect to
via Supabase       /invite/[token]
    ↓
Show "Check Email"
message
    ↓
User clicks magic link in email
    ↓
Supabase auth callback
    ↓
User is now authenticated
    ↓
Redirect to /invite/[token]
    ↓
User accepts/declines invitation
```

### Step-by-Step Process

1. **Invitation Creation**
   - Admin/owner invites a user by email
   - System generates a unique token
   - Magic link is created: `/invite/magic/{token}?email={invitedEmail}`
   - Email is sent with the magic link

2. **User Clicks Magic Link**
   - User clicks link in email
   - Lands on `/invite/magic/[token]` page
   - System checks if user is already authenticated
   - If not, sends a Supabase magic link to their email

3. **Magic Link Authentication**
   - User receives a second email from Supabase (automatic)
   - Clicks the Supabase magic link
   - Supabase authenticates the user
   - Redirects to `/invite/[token]`

4. **Invitation Acceptance**
   - User is now authenticated
   - Can accept or decline the invitation
   - System validates email matches invitation
   - Adds user to organization on acceptance

## 📧 Email Flow

Users receive **two emails** in this flow:

### Email 1: Invitation Email (from your app)
```
Subject: You've been invited to join {Organization}

Hi there! 👋

{Inviter} has invited you to join {Organization} as a {Role}.

Click the button below to automatically sign in and view your invitation:

[Sign In & View Invitation] ← Magic link to /invite/magic/{token}

⏰ This invitation will expire in 7 days.
```

### Email 2: Magic Link Email (from Supabase Auth)
```
Subject: Confirm your signup / Magic Link

Click the link below to confirm your signup:

[Confirm your email]

This is an automatic email from Supabase Auth.
```

## 🔧 Technical Implementation

### Files Modified

1. **`lib/actions/invites.ts`**
   - Updated `createOrganizationInvite()` to generate magic link URLs
   - Updated `resendOrganizationInvite()` to use magic links
   
2. **`lib/utils/email.ts`**
   - Updated email template to emphasize automatic sign-in
   - Changed button text to "Sign In & View Invitation"

3. **`app/invite/magic/[token]/page.tsx`** (NEW)
   - Handles magic link processing
   - Sends Supabase OTP for authentication
   - Shows "Check your email" message
   - Validates invite before sending OTP

4. **`app/invite/[token]/invite-acceptance-client.tsx`**
   - Added success message for authenticated users
   - Improved feedback for email match/mismatch

### Magic Link Generation

```typescript
// In createOrganizationInvite
const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/magic/${token}?email=${encodeURIComponent(email)}`;
```

### Authentication Flow

```typescript
// In /invite/magic/[token]/page.tsx
await supabase.auth.signInWithOtp({
  email: email.toLowerCase(),
  options: {
    shouldCreateUser: true,
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${token}`,
  },
});
```

## 🎨 User Experience

### For New Users
1. Receives invitation email
2. Clicks "Sign In & View Invitation"
3. Sees "Check Your Email" page
4. Receives Supabase magic link
5. Clicks Supabase link
6. Account created automatically
7. Lands on invitation page (authenticated)
8. Accepts invitation
9. Joins organization

### For Existing Users
1. Receives invitation email
2. Clicks "Sign In & View Invitation"
3. Sees "Check Your Email" page
4. Receives Supabase magic link
5. Clicks Supabase link
6. Signed in automatically
7. Lands on invitation page (authenticated)
8. Accepts invitation
9. Joins organization

## 🔒 Security Features

- **Token validation**: Invite token is validated before sending OTP
- **Email verification**: Email must match the invited email
- **Expiration**: Invites expire after 7 days
- **Status checking**: Only pending invites can be accepted
- **Supabase OTP**: Uses Supabase's secure authentication system
- **No password required**: More secure than traditional passwords

## ⚙️ Configuration

### Environment Variables Required

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
RESEND_API_KEY=your_resend_key
```

### Supabase Configuration

Ensure magic links are enabled in your Supabase project:
1. Go to Authentication > Email Auth
2. Ensure "Enable email confirmations" is enabled
3. Configure redirect URLs to include your app domain

## 🧪 Testing

### Test the Flow

1. **Create an invitation**
   ```bash
   # As admin in your app
   Navigate to organization > Invite Members
   Enter email and role
   Click "Send Invitation"
   ```

2. **Check console logs**
   ```
   📧 Invite created for: user@example.com
   🔗 Invite link: http://localhost:3000/invite/magic/{token}?email=...
   ✅ Invite email sent successfully to: user@example.com
   ```

3. **User clicks link**
   - Should see "Check Your Email" page
   - Should receive Supabase magic link

4. **User clicks Supabase link**
   - Should be authenticated
   - Should land on invite acceptance page
   - Should see green "You're signed in" message

5. **User accepts invitation**
   - Should be added to organization
   - Should redirect to organization page

## 🐛 Troubleshooting

### User doesn't receive magic link
- Check Supabase email logs
- Verify email provider configuration
- Check spam folder
- Ensure email auth is enabled in Supabase

### User lands on login page instead of invite page
- Check redirect URL in Supabase settings
- Verify `emailRedirectTo` parameter
- Check auth callback handler

### Email mismatch error
- User must sign in with the exact email that received the invitation
- Case-insensitive comparison is used
- User can sign out and try with correct email

## 📝 Future Enhancements

Possible improvements to consider:

1. **Single-click flow**: Combine both emails into one (requires custom email provider)
2. **SMS invitations**: Support phone number invitations
3. **Social auth**: Allow sign-in with Google/GitHub during invite flow
4. **Invite previews**: Show organization details before authentication
5. **Rate limiting**: Prevent abuse of magic link sending

## 🎉 Conclusion

The magic link system provides a modern, secure, and user-friendly invitation experience. Users can accept invitations with minimal friction, and new users can join your platform without creating passwords.

The two-email flow (invitation + authentication) is a temporary UX trade-off for using Supabase's built-in authentication, which provides enterprise-grade security and reliability.
